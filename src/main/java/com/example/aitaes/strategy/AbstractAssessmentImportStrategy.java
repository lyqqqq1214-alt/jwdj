package com.example.aitaes.strategy;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.read.listener.ReadListener;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.dto.ImportResultDTO;
import com.example.aitaes.entity.*;
import com.example.aitaes.enums.ImportStatus;
import com.example.aitaes.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 考核成绩导入抽象基类
 * <p>
 * 支持 HOMEWORK / QUIZ / MIDTERM / FINAL 四种考核类型，共用同一套表结构
 * （t_assessment + t_assessment_record + t_record_kp_deduction）。
 * <p>
 * 子类只需实现 {@link #getSupportedType()} 返回对应的 ImportType。
 * <p>
 * Excel 模板格式（多Sheet，每个Sheet一个班级）：
 * <pre>
 * 序号 | 学号 | 姓名 | 第1题得分 | 扣分知识点 | 第2题得分 | 扣分知识点 | ... | 总成绩 | 最薄弱知识点
 * </pre>
 * 题目数量由表头动态检测。
 * <p>
 * 文件名格式：{课程编号}_{类型}_{名称}.xlsx，如 CS-NET-001_HOMEWORK_第1次作业.xlsx
 */
@Slf4j
@RequiredArgsConstructor
public abstract class AbstractAssessmentImportStrategy implements ImportStrategy {

    /** 支持从文件名解析的考核类型（对应文件名第二段） */
    protected static final List<String> SUPPORTED_TYPES = List.of("HOMEWORK", "QUIZ", "MIDTERM", "FINAL");

    protected final AssessmentMapper assessmentMapper;
    protected final AssessmentRecordMapper recordMapper;
    protected final RecordKpDeductionMapper deductionMapper;
    protected final StudentMapper studentMapper;
    protected final CourseMapper courseMapper;
    protected final StudentKpMasteryMapper masteryMapper;

    /** 导入上下文 */
    protected Long courseId;
    protected String assessmentName;
    protected String assessmentType;
    protected String semester;
    protected List<String> errors = new ArrayList<>();
    protected int totalRows;
    protected int successRows;
    protected int failRows;

    @Override
    public ImportResultDTO execute(InputStream inputStream, String originalFilename) {
        errors.clear();
        totalRows = 0;
        successRows = 0;
        failRows = 0;

        // 解析文件名获取考核信息
        parseFileName(originalFilename);

        // 读取所有Sheet的数据
        List<Map<Integer, String>> allRows = new ArrayList<>();
        List<String> headerRow = new ArrayList<>();

        EasyExcel.read(inputStream, new ReadListener<Map<Integer, String>>() {
            private boolean isHeader = true;

            @Override
            public void invoke(Map<Integer, String> data, AnalysisContext context) {
                if (isHeader) {
                    headerRow.clear();
                    for (int i = 0; i < data.size(); i++) {
                        headerRow.add(data.getOrDefault(i, ""));
                    }
                    isHeader = false;
                    return;
                }

                // 跳过空行和知识点汇总行
                String firstCell = data.getOrDefault(0, "");
                if (firstCell == null || firstCell.isBlank()) {
                    return;
                }

                // 跳过非学生数据行（序号不能解析为数字的行）
                try {
                    Integer.parseInt(firstCell.trim());
                } catch (NumberFormatException e) {
                    return;
                }

                allRows.add(data);
            }

            @Override
            public void doAfterAllAnalysed(AnalysisContext context) {
                log.info("Sheet解析完成: {}行数据", allRows.size());
            }
            // headRowNumber(0)：所有行（含表头）都进 invoke()，由上面的 isHeader 逻辑识别表头，
            // 否则 EasyExcel 默认吞掉首行导致第一个学生行被误当表头丢弃
        }).excelType(getExcelType(originalFilename)).headRowNumber(0).sheet().doRead();

        // 解析题目数
        int questionCount = detectQuestionCount(headerRow);
        log.info("检测到题目数: {}", questionCount);

        // 查找或创建考核记录
        Assessment assessment = findOrCreateAssessment(questionCount);

        // 逐行处理学生数据
        for (Map<Integer, String> row : allRows) {
            try {
                processStudentRow(row, assessment, questionCount);
                successRows++;
            } catch (Exception e) {
                failRows++;
                errors.add(String.format("第%d行处理失败: %s", totalRows + 1, e.getMessage()));
                log.warn("处理学生行失败", e);
            }
            totalRows++;
        }

        // 导入完成后重新计算知识点掌握度
        recalculateKpMastery(assessment.getId());

        return buildResult();
    }

    /**
     * 从文件名解析课程和考核信息
     * 格式：{课程编号}_{类型}_{考核名称}.xlsx
     */
    protected void parseFileName(String filename) {
        if (filename == null) return;
        String name = filename.replaceAll("(?i)\\.(xlsx|xls|csv)$", "");
        String[] parts = name.split("_");
        if (parts.length >= 3 && SUPPORTED_TYPES.contains(parts[1].toUpperCase())) {
            // 查找课程
            Course course = courseMapper.selectOne(
                    new LambdaQueryWrapper<Course>().eq(Course::getCourseNo, parts[0]));
            if (course != null) {
                this.courseId = course.getId();
                this.semester = course.getSemester();
            }
            this.assessmentType = parts[1].toUpperCase();
            this.assessmentName = parts[2];
            log.info("解析文件名: courseNo={}, type={}, name={}", parts[0], assessmentType, assessmentName);
        }
    }

    /**
     * 从表头中检测题目数量（匹配"第X题得分"模式）
     */
    protected int detectQuestionCount(List<String> header) {
        int maxQ = 0;
        for (String col : header) {
            if (col != null && col.matches("第\\d+题得分")) {
                int qno = Integer.parseInt(col.replaceAll("[^0-9]", ""));
                maxQ = Math.max(maxQ, qno);
            }
        }
        return maxQ > 0 ? maxQ : 5;
    }

    /**
     * 查找或创建考核
     */
    protected Assessment findOrCreateAssessment(int questionCount) {
        if (courseId == null || assessmentName == null) {
            throw new IllegalStateException(
                    "无法确定课程或考核名称，请检查文件名格式: COURSENO_TYPE_NAME.xlsx");
        }

        Assessment existing = assessmentMapper.selectOne(
                new LambdaQueryWrapper<Assessment>()
                        .eq(Assessment::getCourseId, courseId)
                        .eq(Assessment::getAssessmentName, assessmentName));

        if (existing != null) {
            return existing;
        }

        Assessment assessment = new Assessment();
        assessment.setCourseId(courseId);
        assessment.setAssessmentName(assessmentName);
        assessment.setAssessmentType(assessmentType != null ? assessmentType : "HOMEWORK");
        assessment.setTotalScore(new BigDecimal("100.00"));
        assessment.setQuestionCount(questionCount);
        assessment.setSemester(semester);
        assessment.setAssessmentDate(LocalDate.now());
        assessmentMapper.insert(assessment);
        return assessment;
    }

    /**
     * 处理单个学生行
     */
    protected void processStudentRow(Map<Integer, String> row, Assessment assessment, int questionCount) {
        String studentNo = row.getOrDefault(1, "").trim();
        String studentName = row.getOrDefault(2, "").trim();

        if (studentNo.isEmpty()) return;

        // 查找学生
        Student student = studentMapper.selectOne(
                new LambdaQueryWrapper<Student>().eq(Student::getStudentNo, studentNo));
        if (student == null) {
            throw new RuntimeException("学生不存在: " + studentNo);
        }

        // 总成绩在第 N*2+3 列（序号0 + 学号1 + 姓名2 + N题×(得分+知识点) = 3+2N）
        int totalScoreCol = 3 + questionCount * 2;
        String totalScoreStr = row.getOrDefault(totalScoreCol, "0").trim();
        BigDecimal totalScore = parseScore(totalScoreStr);

        // 最薄弱知识点在总成绩后一列
        String weakestKp = row.getOrDefault(totalScoreCol + 1, "").trim();

        // 创建考核记录
        AssessmentRecord record = new AssessmentRecord();
        record.setAssessmentId(assessment.getId());
        record.setStudentId(student.getId());
        record.setTotalScore(totalScore);
        record.setWeakestKp(weakestKp.isEmpty() ? null : weakestKp);
        record.setSubmitTime(LocalDateTime.now());
        recordMapper.insert(record);

        // 逐题创建扣分知识点明细
        for (int q = 1; q <= questionCount; q++) {
            int scoreCol = 3 + (q - 1) * 2;
            int deductionCol = scoreCol + 1;

            String scoreStr = row.getOrDefault(scoreCol, "");
            String deductionKp = row.getOrDefault(deductionCol, "");

            if (scoreStr == null || scoreStr.trim().isEmpty()) {
                continue;
            }

            BigDecimal questionScore = parseScore(scoreStr.trim());

            // 有扣分知识点或得分低于满分时记录
            if (questionScore.compareTo(new BigDecimal("20")) < 0
                    || (deductionKp != null && !deductionKp.trim().isEmpty())) {
                RecordKpDeduction deduction = new RecordKpDeduction();
                deduction.setRecordId(record.getId());
                deduction.setQuestionNo(q);
                deduction.setQuestionScore(questionScore);
                deduction.setMaxScore(new BigDecimal("20"));
                deduction.setDeductionKp(deductionKp != null ? deductionKp.trim() : "");
                deductionMapper.insert(deduction);
            }
        }
    }

    /**
     * 重算学生知识点掌握度
     */
    protected void recalculateKpMastery(Long assessmentId) {
        List<AssessmentRecord> records = recordMapper.selectList(
                new LambdaQueryWrapper<AssessmentRecord>()
                        .eq(AssessmentRecord::getAssessmentId, assessmentId));

        for (AssessmentRecord record : records) {
            List<RecordKpDeduction> deductions = deductionMapper.selectList(
                    new LambdaQueryWrapper<RecordKpDeduction>()
                            .eq(RecordKpDeduction::getRecordId, record.getId()));

            // 按知识点汇总扣分
            Map<String, BigDecimal[]> kpStats = new LinkedHashMap<>();
            for (RecordKpDeduction d : deductions) {
                if (d.getDeductionKp() == null || d.getDeductionKp().isBlank()) continue;

                String[] kps = d.getDeductionKp().split("[,，/]");
                BigDecimal lostScore = d.getMaxScore().subtract(
                        d.getQuestionScore() != null ? d.getQuestionScore() : BigDecimal.ZERO);

                for (String kp : kps) {
                    String kpName = kp.trim();
                    if (kpName.isEmpty()) continue;

                    BigDecimal[] stats = kpStats.computeIfAbsent(kpName,
                            k -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
                    stats[0] = stats[0].add(lostScore.max(BigDecimal.ZERO));
                    stats[1] = stats[1].add(d.getMaxScore());
                }
            }

            // UPSERT 到掌握度表
            for (Map.Entry<String, BigDecimal[]> entry : kpStats.entrySet()) {
                String kpName = entry.getKey();
                BigDecimal totalLost = entry.getValue()[0];
                BigDecimal totalMax = entry.getValue()[1];

                BigDecimal masteryRate = BigDecimal.valueOf(100);
                if (totalMax.compareTo(BigDecimal.ZERO) > 0) {
                    masteryRate = new BigDecimal("100").subtract(
                            totalLost.divide(totalMax, 4, RoundingMode.HALF_UP)
                                    .multiply(new BigDecimal("100")));
                }
                masteryRate = masteryRate.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

                StudentKpMastery existing = masteryMapper.selectOne(
                        new LambdaQueryWrapper<StudentKpMastery>()
                                .eq(StudentKpMastery::getStudentId, record.getStudentId())
                                .eq(StudentKpMastery::getCourseId, courseId)
                                .eq(StudentKpMastery::getKpName, kpName));

                if (existing != null) {
                    existing.setMasteryRate(masteryRate);
                    existing.setLoseCount(existing.getLoseCount() + 1);
                    existing.setTotalQuestionCount(existing.getTotalQuestionCount() + 1);
                    existing.setLastAssessmentId(assessmentId);
                    existing.setLastUpdated(LocalDateTime.now());
                    masteryMapper.updateById(existing);
                } else {
                    StudentKpMastery mastery = new StudentKpMastery();
                    mastery.setStudentId(record.getStudentId());
                    mastery.setCourseId(courseId);
                    mastery.setKpName(kpName);
                    mastery.setMasteryRate(masteryRate);
                    mastery.setLoseCount(totalLost.compareTo(BigDecimal.ZERO) > 0 ? 1 : 0);
                    mastery.setTotalQuestionCount(1);
                    mastery.setLastAssessmentId(assessmentId);
                    mastery.setLastUpdated(LocalDateTime.now());
                    masteryMapper.insert(mastery);
                }
            }
        }
    }

    protected BigDecimal parseScore(String scoreStr) {
        if (scoreStr == null || scoreStr.trim().isEmpty()) return BigDecimal.ZERO;
        try {
            return new BigDecimal(scoreStr.trim());
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    protected ImportResultDTO buildResult() {
        ImportResultDTO result = new ImportResultDTO();
        result.setTotalRows(totalRows);
        result.setSuccessRows(successRows);
        result.setFailRows(failRows);

        if (failRows == 0) {
            result.setStatus(ImportStatus.SUCCESS.getCode());
        } else if (successRows == 0) {
            result.setStatus(ImportStatus.FAILED.getCode());
        } else {
            result.setStatus(ImportStatus.PARTIAL.getCode());
        }

        result.setErrors(errors.size() > 100 ? errors.subList(0, 100) : errors);
        return result;
    }
}
