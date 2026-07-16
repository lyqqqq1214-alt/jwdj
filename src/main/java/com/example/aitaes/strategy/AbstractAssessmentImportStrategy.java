package com.example.aitaes.strategy;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.read.listener.ReadListener;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.dto.ImportResultDTO;
import com.example.aitaes.entity.*;
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
 * Excel 模板格式（列顺序任意，按表头列名定位）：
 * <pre>
 * 序号 | 学号 | 姓名 | 第1题得分 | 扣分主要知识点 | ... | 第N题得分 | 扣分主要知识点 | 总成绩 | 最薄弱知识点
 * </pre>
 * 题目数量由表头动态检测；无题目列时仅导入总成绩。
 * <p>
 * 课程与考核信息优先来自 {@link ImportContext}（前端页面选择/填写），
 * 回退兼容旧文件名约定：{课程编号}_{类型}_{名称}.xlsx，如 CS-NET-001_HOMEWORK_第1次作业.xlsx。
 * <p>
 * 所有可变状态封装在方法内局部的 {@link AssessmentSession} 中，
 * 单例 Bean 无跨请求脏状态，支持并发导入。
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
    protected final CourseResolver courseResolver;

    /** 单次导入的上下文与统计（局部创建，避免单例 Bean 跨请求脏状态） */
    protected static class AssessmentSession {
        Long courseId;
        String semester;
        String assessmentType;
        String assessmentName;
        final List<String> errors = new ArrayList<>();
        final List<String> warnings = new ArrayList<>();
        int totalRows;
        int successRows;
        int failRows;
        int skippedRows;
    }

    /** 表头列位置（按列名定位，对列顺序鲁棒） */
    protected static class ColumnLayout {
        int studentNoCol = -1;
        int nameCol = -1;
        int totalScoreCol = -1;
        int weakestKpCol = -1;
        /** 每题一项：[题号, 得分列, 扣分知识点列(-1 表示无)] */
        final List<int[]> questions = new ArrayList<>();
    }

    /** 携带真实 Excel 行号的原始行数据 */
    protected record RawRow(int rowNo, Map<Integer, String> data) {
    }

    @Override
    public ImportResultDTO execute(InputStream inputStream, ImportContext ctx) {
        AssessmentSession session = new AssessmentSession();

        // 1. 确定课程（页面参数优先，文件名约定回退）
        CourseResolver.ResolvedCourse resolved = courseResolver.resolve(ctx);
        if (resolved == null) {
            return ImportResultDTO.failed(CourseResolver.COURSE_NOT_FOUND_MSG);
        }
        session.courseId = resolved.courseId();
        session.semester = resolved.semester();

        // 2. 确定考核名称与类型（页面参数优先，文件名约定回退）
        if (ctx.getAssessmentName() != null && !ctx.getAssessmentName().isBlank()) {
            session.assessmentName = ctx.getAssessmentName().trim();
        }
        resolveAssessmentInfo(ctx, session);
        if (session.assessmentName == null || session.assessmentName.isBlank()) {
            return ImportResultDTO.failed(
                    "无法确定考核名称：请在页面填写考核名称（或使用文件名格式 {课程编号}_类型_考核名称.xlsx）");
        }
        if (session.assessmentType == null) {
            return ImportResultDTO.failed("无法确定考核类型：期中/期末成绩导入请在页面选择期中或期末");
        }

        // 3. 读取表头与所有数据行
        List<String> headerRow = new ArrayList<>();
        List<RawRow> allRows = new ArrayList<>();
        readRows(inputStream, ctx.getOriginalFilename(), headerRow, allRows);

        // 4. 按表头列名定位各列
        ColumnLayout layout = resolveColumns(headerRow);
        if (layout.studentNoCol < 0) {
            return ImportResultDTO.failed("表头缺少\"学号\"列，请下载并使用官方导入模板");
        }
        log.info("表头定位: 学号列={}, 总成绩列={}, 题目数={}",
                layout.studentNoCol, layout.totalScoreCol, layout.questions.size());

        // 5. 过滤学生数据行（学号列非空；汇总行/空行自然被跳过）
        List<RawRow> studentRows = allRows.stream()
                .filter(row -> !cell(row.data(), layout.studentNoCol).isBlank())
                .toList();
        if (studentRows.isEmpty()) {
            // 未解析到数据行 → 统一 FAILED（不创建空考核记录）
            return ImportResultDTO.of(0, 0, 0, 0, session.errors, session.warnings);
        }

        // 6. 查找或创建考核
        Assessment assessment = findOrCreateAssessment(session, layout.questions.size());

        // 7. 逐行处理学生数据
        for (RawRow row : studentRows) {
            session.totalRows++;
            try {
                processStudentRow(row, layout, assessment, session);
            } catch (Exception e) {
                session.failRows++;
                session.errors.add(String.format("第%d行处理失败: %s", row.rowNo(), e.getMessage()));
                log.warn("处理学生行失败: 第{}行", row.rowNo(), e);
            }
        }

        // 8. 导入完成后重新计算知识点掌握度
        if (session.successRows > 0) {
            recalculateKpMastery(assessment.getId(), session.courseId);
        }

        return ImportResultDTO.of(session.totalRows, session.successRows, session.failRows,
                session.skippedRows, session.errors, session.warnings);
    }

    /**
     * 确定考核类型与名称（页面参数缺省时回退文件名约定）。
     * 基类实现：HOMEWORK/QUIZ 类型由策略自身决定；名称回退文件名第三段。
     * EXAM_SCORE 子类重写以处理 MIDTERM/FINAL。
     */
    protected void resolveAssessmentInfo(ImportContext ctx, AssessmentSession session) {
        session.assessmentType = getSupportedType().getCode();
        if (session.assessmentName == null) {
            String[] parts = splitFilename(ctx.getOriginalFilename());
            if (parts != null && parts.length >= 3 && SUPPORTED_TYPES.contains(parts[1].toUpperCase())) {
                session.assessmentName = parts[2];
                log.info("从文件名解析考核名称: {}", session.assessmentName);
            }
        }
    }

    /** 去掉扩展名后按下划线切分文件名 */
    protected static String[] splitFilename(String filename) {
        if (filename == null) {
            return null;
        }
        return filename.replaceAll("(?i)\\.(xlsx|xls|csv)$", "").split("_");
    }

    /**
     * 读取首个 Sheet：第一行作为表头，其余行连同真实行号收集
     */
    private void readRows(InputStream inputStream, String filename,
                          List<String> headerRow, List<RawRow> allRows) {
        EasyExcel.read(inputStream, new ReadListener<Map<Integer, String>>() {
            private boolean isHeader = true;

            @Override
            public void invoke(Map<Integer, String> data, AnalysisContext context) {
                if (isHeader) {
                    int maxCol = data.keySet().stream().mapToInt(Integer::intValue).max().orElse(-1);
                    for (int i = 0; i <= maxCol; i++) {
                        headerRow.add(Objects.toString(data.get(i), ""));
                    }
                    isHeader = false;
                    return;
                }
                allRows.add(new RawRow(context.readRowHolder().getRowIndex() + 1, data));
            }

            @Override
            public void doAfterAllAnalysed(AnalysisContext context) {
                log.info("Sheet解析完成: {}行数据", allRows.size());
            }
            // headRowNumber(0)：所有行（含表头）都进 invoke()，由上面的 isHeader 逻辑识别表头，
            // 否则 EasyExcel 默认吞掉首行导致第一个学生行被误当表头丢弃
        }).excelType(getExcelType(filename)).headRowNumber(0).sheet().doRead();
    }

    /**
     * 按表头列名定位各列位置（对列顺序鲁棒，兼容新旧模板格式）
     */
    protected ColumnLayout resolveColumns(List<String> header) {
        ColumnLayout layout = new ColumnLayout();
        for (int i = 0; i < header.size(); i++) {
            String col = header.get(i) == null ? "" : header.get(i).trim();
            if ("学号".equals(col) && layout.studentNoCol < 0) {
                layout.studentNoCol = i;
            } else if ("姓名".equals(col) && layout.nameCol < 0) {
                layout.nameCol = i;
            } else if (("总成绩".equals(col) || "总分".equals(col)) && layout.totalScoreCol < 0) {
                layout.totalScoreCol = i;
            } else if ("最薄弱知识点".equals(col) && layout.weakestKpCol < 0) {
                layout.weakestKpCol = i;
            } else if (col.matches("第\\d+题得分")) {
                int qno = Integer.parseInt(col.replaceAll("[^0-9]", ""));
                // 扣分知识点列 = 得分列右侧紧邻的"扣分(主要)知识点"列
                int deductionCol = -1;
                if (i + 1 < header.size()) {
                    String next = header.get(i + 1) == null ? "" : header.get(i + 1).trim();
                    if (isDeductionHeader(next)) {
                        deductionCol = i + 1;
                    }
                }
                layout.questions.add(new int[]{qno, i, deductionCol});
            }
        }
        return layout;
    }

    private static boolean isDeductionHeader(String col) {
        return col.contains("扣分") && col.contains("知识点");
    }

    /** 安全取单元格文本（null → 空串，自动 trim） */
    protected static String cell(Map<Integer, String> data, int col) {
        if (col < 0) {
            return "";
        }
        String value = data.get(col);
        return value == null ? "" : value.trim();
    }

    /**
     * 查找或创建考核（按 课程 + 考核名称 + 考核类型 去重）
     */
    protected Assessment findOrCreateAssessment(AssessmentSession session, int questionCount) {
        Assessment existing = assessmentMapper.selectOne(
                new LambdaQueryWrapper<Assessment>()
                        .eq(Assessment::getCourseId, session.courseId)
                        .eq(Assessment::getAssessmentName, session.assessmentName)
                        .eq(Assessment::getAssessmentType, session.assessmentType));

        if (existing != null) {
            return existing;
        }

        Assessment assessment = new Assessment();
        assessment.setCourseId(session.courseId);
        assessment.setAssessmentName(session.assessmentName);
        assessment.setAssessmentType(session.assessmentType);
        assessment.setTotalScore(new BigDecimal("100.00"));
        assessment.setQuestionCount(questionCount);
        assessment.setSemester(session.semester);
        assessment.setAssessmentDate(LocalDate.now());
        assessmentMapper.insert(assessment);
        return assessment;
    }

    /**
     * 处理单个学生行（成功/跳过在此计数，异常由调用方计为失败）
     */
    protected void processStudentRow(RawRow rawRow, ColumnLayout layout,
                                     Assessment assessment, AssessmentSession session) {
        Map<Integer, String> row = rawRow.data();
        String studentNo = cell(row, layout.studentNoCol);

        // 查找学生
        Student student = studentMapper.selectOne(
                new LambdaQueryWrapper<Student>().eq(Student::getStudentNo, studentNo));
        if (student == null) {
            throw new RuntimeException("学生不存在: " + studentNo + "（请先导入学生名单）");
        }

        // 重复导入检查（uk_record: assessment_id + student_id）
        AssessmentRecord existing = recordMapper.selectOne(
                new LambdaQueryWrapper<AssessmentRecord>()
                        .eq(AssessmentRecord::getAssessmentId, assessment.getId())
                        .eq(AssessmentRecord::getStudentId, student.getId()));
        if (existing != null) {
            session.skippedRows++;
            session.warnings.add(String.format("第%d行: 学生 %s 在该考核已有成绩记录，跳过", rawRow.rowNo(), studentNo));
            return;
        }

        // 总成绩：优先取"总成绩"列；无该列时按各题得分求和
        BigDecimal totalScore;
        if (layout.totalScoreCol >= 0) {
            totalScore = parseScore(cell(row, layout.totalScoreCol));
        } else {
            totalScore = layout.questions.stream()
                    .map(q -> parseScore(cell(row, q[1])))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        String weakestKp = cell(row, layout.weakestKpCol);

        // 创建考核记录
        AssessmentRecord record = new AssessmentRecord();
        record.setAssessmentId(assessment.getId());
        record.setStudentId(student.getId());
        record.setTotalScore(totalScore);
        record.setWeakestKp(weakestKp.isEmpty() ? null : weakestKp);
        record.setSubmitTime(LocalDateTime.now());
        recordMapper.insert(record);

        // 逐题创建扣分知识点明细
        for (int[] question : layout.questions) {
            int questionNo = question[0];
            String scoreStr = cell(row, question[1]);
            String deductionKp = cell(row, question[2]);

            if (scoreStr.isEmpty()) {
                continue;
            }

            BigDecimal questionScore = parseScore(scoreStr);

            // 有扣分知识点或得分低于满分时记录
            if (questionScore.compareTo(new BigDecimal("20")) < 0 || !deductionKp.isEmpty()) {
                RecordKpDeduction deduction = new RecordKpDeduction();
                deduction.setRecordId(record.getId());
                deduction.setQuestionNo(questionNo);
                deduction.setQuestionScore(questionScore);
                deduction.setMaxScore(new BigDecimal("20"));
                deduction.setDeductionKp(deductionKp);
                deductionMapper.insert(deduction);
            }
        }

        session.successRows++;
    }

    /**
     * 重算学生知识点掌握度
     */
    protected void recalculateKpMastery(Long assessmentId, Long courseId) {
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
}
