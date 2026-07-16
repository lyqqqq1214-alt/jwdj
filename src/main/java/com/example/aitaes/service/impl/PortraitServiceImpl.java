package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.dto.ChartItem;
import com.example.aitaes.dto.StudentProfileVO;
import com.example.aitaes.dto.TrendDTO;
import com.example.aitaes.entity.*;
import com.example.aitaes.mapper.*;
import com.example.aitaes.service.OllamaService;
import com.example.aitaes.service.PortraitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 学生画像服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PortraitServiceImpl implements PortraitService {

    private final StudentMapper studentMapper;
    private final CourseStudentMapper courseStudentMapper;
    private final AssessmentRecordMapper assessmentRecordMapper;
    private final AssessmentMapper assessmentMapper;
    private final AttendanceMapper attendanceMapper;
    private final ExperimentMapper experimentMapper;
    private final StudentKpMasteryMapper studentKpMasteryMapper;
    private final OllamaService ollamaService;

    @Override
    public StudentProfileVO getProfile(Long studentId, Long courseId) {
        Student student = studentMapper.selectById(studentId);
        if (student == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "学生不存在");
        }

        CourseStudent cs = courseStudentMapper.selectOne(
                new LambdaQueryWrapper<CourseStudent>()
                        .eq(CourseStudent::getCourseId, courseId)
                        .eq(CourseStudent::getStudentId, studentId));

        // 基本信息 + 重点关注
        StudentProfileVO.StudentProfileVOBuilder builder = StudentProfileVO.builder()
                .studentId(student.getId())
                .studentNo(student.getStudentNo())
                .name(student.getName())
                .gender(student.getGender())
                .college(student.getCollege())
                .major(student.getMajor())
                .className(student.getClassName())
                .grade(student.getGrade())
                .avatar(student.getAvatar())
                .isFocus(cs != null && cs.getIsFocus() != null && cs.getIsFocus() == 1);

        // 成绩概览
        builder.scoreTrendList(getScoreTrend(studentId, courseId));

        // 考勤
        List<Attendance> atts = attendanceMapper.selectList(
                new LambdaQueryWrapper<Attendance>()
                        .eq(Attendance::getCourseId, courseId)
                        .eq(Attendance::getStudentId, studentId));
        builder.attendanceList(atts.stream().map(a -> StudentProfileVO.AttendanceItem.builder()
                .date(a.getAttendanceDate() != null ? a.getAttendanceDate().atStartOfDay() : null)
                .status(a.getStatus()).weekNo(a.getWeekNo()).remark(a.getRemark()).build())
                .collect(Collectors.toList()));
        long presentCount = atts.stream().filter(a -> "出勤".equals(a.getStatus())).count();
        long absentCount = atts.stream().filter(a -> "缺勤".equals(a.getStatus())).count();
        long lateCount = atts.stream().filter(a -> "迟到".equals(a.getStatus())).count();
        long leaveCount = atts.stream().filter(a -> "请假".equals(a.getStatus())).count();
        builder.attendanceRate(atts.isEmpty() ? BigDecimal.ZERO
                : new BigDecimal(presentCount).divide(new BigDecimal(atts.size()), 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal(100)).setScale(1, RoundingMode.HALF_UP));
        builder.absentCount(absentCount);
        builder.lateCount(lateCount);
        builder.leaveCount(leaveCount);

        // 作业
        builder.homeworkList(getHomeworkList(studentId, courseId));

        // 实验
        List<Experiment> exps = experimentMapper.selectList(
                new LambdaQueryWrapper<Experiment>()
                        .eq(Experiment::getCourseId, courseId)
                        .eq(Experiment::getStudentId, studentId));
        builder.experimentList(exps.stream().map(e -> StudentProfileVO.ExperimentItem.builder()
                .name(e.getExperimentName()).experimentNo(e.getExperimentNo())
                .score(e.getScore()).submitTime(e.getSubmitTime()).build())
                .collect(Collectors.toList()));

        // 知识点掌握度
        builder.knowledgeRadar(getKnowledgeRadar(studentId, courseId, false));
        builder.classAvgRadar(getKnowledgeRadar(studentId, courseId, true));

        // AI 评价（预留）
        builder.aiEvaluation(generateAiEvaluation(studentId, courseId));

        return builder.build();
    }

    @Override
    public void toggleFocus(Long studentId, Long courseId, boolean focus) {
        CourseStudent cs = courseStudentMapper.selectOne(
                new LambdaQueryWrapper<CourseStudent>()
                        .eq(CourseStudent::getCourseId, courseId)
                        .eq(CourseStudent::getStudentId, studentId));
        if (cs == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "该学生不在班级中");
        }
        cs.setIsFocus(focus ? 1 : 0);
        courseStudentMapper.updateById(cs);
        log.info("{} 重点关注学生: studentId={}, courseId={}",
                focus ? "标记" : "取消", studentId, courseId);
    }

    // ===== 私有方法 =====

    private List<StudentProfileVO.HomeworkItem> getHomeworkList(Long studentId, Long courseId) {
        List<Assessment> hwAssessments = assessmentMapper.selectList(
                new LambdaQueryWrapper<Assessment>()
                        .eq(Assessment::getCourseId, courseId)
                        .eq(Assessment::getAssessmentType, "HOMEWORK")
                        .orderByAsc(Assessment::getAssessmentNo));
        return hwAssessments.stream().map(hw -> {
            AssessmentRecord record = assessmentRecordMapper.selectOne(
                    new LambdaQueryWrapper<AssessmentRecord>()
                            .eq(AssessmentRecord::getAssessmentId, hw.getId())
                            .eq(AssessmentRecord::getStudentId, studentId));
            return StudentProfileVO.HomeworkItem.builder()
                    .name(hw.getAssessmentName())
                    .score(record != null ? record.getTotalScore() : null)
                    .submitStatus(record != null ? record.getSubmitStatus() : null)
                    .submitTime(record != null ? record.getSubmitTime() : null)
                    .build();
        }).collect(Collectors.toList());
    }

    private List<ChartItem> getKnowledgeRadar(Long studentId, Long courseId, boolean classAvg) {
        List<StudentKpMastery> masteryList = studentKpMasteryMapper.selectList(
                new LambdaQueryWrapper<StudentKpMastery>()
                        .eq(StudentKpMastery::getCourseId, courseId));
        if (classAvg) {
            // 按知识点聚合班级均值
            return masteryList.stream()
                    .collect(Collectors.groupingBy(StudentKpMastery::getKpName))
                    .entrySet().stream().map(e -> {
                        BigDecimal avg = e.getValue().stream()
                                .map(m -> m.getMasteryRate() != null ? m.getMasteryRate() : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add)
                                .divide(new BigDecimal(e.getValue().size()), 2, RoundingMode.HALF_UP);
                        return ChartItem.builder().name(e.getKey()).value(avg).build();
                    }).collect(Collectors.toList());
        } else {
            return masteryList.stream()
                    .filter(m -> m.getStudentId().equals(studentId))
                    .map(m -> ChartItem.builder()
                            .name(m.getKpName()).value(m.getMasteryRate()).build())
                    .collect(Collectors.toList());
        }
    }

    private List<TrendDTO> getScoreTrend(Long studentId, Long courseId) {
        // 获取课程所有考核（非作业类型）
        List<Assessment> assessments = assessmentMapper.selectList(
                new LambdaQueryWrapper<Assessment>()
                        .eq(Assessment::getCourseId, courseId)
                        .ne(Assessment::getAssessmentType, "HOMEWORK")
                        .orderByAsc(Assessment::getAssessmentDate));
        if (assessments.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> semesters = new ArrayList<>();
        List<BigDecimal> overallScores = new ArrayList<>();
        List<TrendDTO.CategoryTrend> categoryTrends = new ArrayList<>();

        // 按类型分组
        Map<String, List<Assessment>> typeGroups = assessments.stream()
                .collect(Collectors.groupingBy(a -> a.getAssessmentType() != null
                        ? a.getAssessmentType() : "OTHER", LinkedHashMap::new, Collectors.toList()));

        for (Assessment a : assessments) {
            semesters.add(a.getAssessmentName());
            AssessmentRecord record = assessmentRecordMapper.selectOne(
                    new LambdaQueryWrapper<AssessmentRecord>()
                            .eq(AssessmentRecord::getAssessmentId, a.getId())
                            .eq(AssessmentRecord::getStudentId, studentId));
            overallScores.add(record != null && record.getTotalScore() != null
                    ? record.getTotalScore() : BigDecimal.ZERO);
        }

        // 各类型趋势
        for (Map.Entry<String, List<Assessment>> entry : typeGroups.entrySet()) {
            List<BigDecimal> scores = new ArrayList<>();
            for (Assessment a : entry.getValue()) {
                AssessmentRecord record = assessmentRecordMapper.selectOne(
                        new LambdaQueryWrapper<AssessmentRecord>()
                                .eq(AssessmentRecord::getAssessmentId, a.getId())
                                .eq(AssessmentRecord::getStudentId, studentId));
                scores.add(record != null && record.getTotalScore() != null
                        ? record.getTotalScore() : BigDecimal.ZERO);
            }
            String typeLabel = switch (entry.getKey()) {
                case "TEST" -> "测验";
                case "EXAM" -> "考试";
                case "EXPERIMENT" -> "实验";
                default -> entry.getKey();
            };
            categoryTrends.add(TrendDTO.CategoryTrend.builder()
                    .category(typeLabel).scores(scores).build());
        }

        return List.of(TrendDTO.builder()
                .semesters(semesters)
                .overallScores(overallScores)
                .categoryTrends(categoryTrends)
                .build());
    }

    @Override
    public String generateAiEvaluation(Long studentId, Long courseId) {
        // 先获取画像数据用于构建 prompt
        StudentProfileVO profile = getProfile(studentId, courseId);

        StringBuilder prompt = new StringBuilder();
        prompt.append("你是一位教学专家，请根据以下学生数据生成一段约200字的学情综合评价：\n\n");
        prompt.append("学生姓名：").append(profile.getName()).append("\n");
        prompt.append("学号：").append(profile.getStudentNo()).append("\n");
        if (profile.getClassName() != null) {
            prompt.append("班级：").append(profile.getClassName()).append("\n");
        }

        // 考勤
        prompt.append("\n【考勤情况】\n");
        prompt.append("出勤率：").append(profile.getAttendanceRate()).append("%\n");
        prompt.append("缺勤").append(profile.getAbsentCount()).append("次，");
        prompt.append("迟到").append(profile.getLateCount()).append("次，");
        prompt.append("请假").append(profile.getLeaveCount()).append("次\n");

        // 成绩
        if (profile.getScoreTrendList() != null && !profile.getScoreTrendList().isEmpty()) {
            TrendDTO trend = profile.getScoreTrendList().get(0);
            prompt.append("\n【考试成绩趋势】\n");
            for (int i = 0; i < trend.getSemesters().size(); i++) {
                prompt.append(trend.getSemesters().get(i)).append("：")
                        .append(trend.getOverallScores().get(i)).append("分\n");
            }
        }

        // 作业
        if (profile.getHomeworkList() != null && !profile.getHomeworkList().isEmpty()) {
            prompt.append("\n【作业情况】\n");
            for (StudentProfileVO.HomeworkItem hw : profile.getHomeworkList()) {
                prompt.append(hw.getName()).append("：")
                        .append(hw.getScore() != null ? hw.getScore() + "分" : "未提交")
                        .append("（").append(hw.getSubmitStatus() != null ? hw.getSubmitStatus() : "未知").append("）\n");
            }
        }

        // 实验
        if (profile.getExperimentList() != null && !profile.getExperimentList().isEmpty()) {
            prompt.append("\n【实验报告】\n");
            for (StudentProfileVO.ExperimentItem exp : profile.getExperimentList()) {
                prompt.append(exp.getName()).append("：")
                        .append(exp.getScore() != null ? exp.getScore() + "分" : "未评分").append("\n");
            }
        }

        // 知识点掌握度
        if (profile.getKnowledgeRadar() != null && !profile.getKnowledgeRadar().isEmpty()) {
            prompt.append("\n【知识点掌握度】\n");
            for (ChartItem kp : profile.getKnowledgeRadar()) {
                prompt.append(kp.getName()).append("：").append(kp.getValue()).append("%\n");
            }
        }

        prompt.append("\n请综合以上数据，从学习态度、知识掌握、能力发展、改进建议四个方面，生成约200字的学情评价。评价应客观、有针对性，直接输出评价文字，不要加任何前缀说明。");

        try {
            log.info("开始生成AI学情评价: studentId={}, courseId={}", studentId, courseId);
            String evaluation = ollamaService.generate(prompt.toString());
            if (evaluation != null && !evaluation.isBlank()) {
                // 清理可能的 markdown 标记
                evaluation = evaluation.replaceAll("```[\\s\\S]*?```", "").trim();
                if (evaluation.length() > 500) {
                    evaluation = evaluation.substring(0, 500);
                }
                return evaluation;
            }
        } catch (Exception e) {
            log.warn("AI评价生成失败: {}", e.getMessage());
        }
        return "AI评价暂不可用，请稍后重试。";
    }
}
