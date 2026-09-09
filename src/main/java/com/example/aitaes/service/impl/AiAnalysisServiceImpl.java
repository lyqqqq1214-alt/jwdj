package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.common.AttendanceStatus;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.config.OllamaProperties;
import com.example.aitaes.dto.AiAnalysisReportDTO;
import com.example.aitaes.dto.QuestionBankAuditDTO;
import com.example.aitaes.entity.*;
import com.example.aitaes.mapper.*;
import com.example.aitaes.service.AiAnalysisService;
import com.example.aitaes.service.OllamaService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI 智能分析引擎服务实现
 * <p>
 * 统计分析全部由本地规则计算（不依赖外部服务），AI 总评/判断仅作可选增强，
 * 外部大模型不可用时自动降级为规则总结，保证报告始终可用。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiAnalysisServiceImpl implements AiAnalysisService {

    private final CourseMapper courseMapper;
    private final CourseStudentMapper courseStudentMapper;
    private final StudentMapper studentMapper;
    private final AttendanceMapper attendanceMapper;
    private final AssessmentMapper assessmentMapper;
    private final AssessmentRecordMapper assessmentRecordMapper;
    private final StudentKpMasteryMapper studentKpMasteryMapper;
    private final QuestionBankMapper questionBankMapper;
    private final KnowledgePointMapper knowledgePointMapper;
    private final AiAnalysisResultMapper aiAnalysisResultMapper;
    private final OllamaService ollamaService;
    private final OllamaProperties ollamaProperties;
    private final ObjectMapper objectMapper;

    /** 到课率预警阈值（%） */
    private static final BigDecimal ATTENDANCE_WARN = new BigDecimal("80");
    /** 掌握率再讲/巩固阈值（%） */
    private static final BigDecimal KP_RETEACH = new BigDecimal("50");
    private static final BigDecimal KP_REINFORCE = new BigDecimal("70");
    /** 个人掌握率薄弱阈值（%） */
    private static final BigDecimal KP_WEAK = new BigDecimal("60");
    /** 得分率及格线（%） */
    private static final BigDecimal SCORE_PASS = new BigDecimal("60");

    /** 合法难度值 */
    private static final Set<String> VALID_DIFFICULTIES = Set.of("EASY", "MEDIUM", "HARD");

    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    // ─── 课程智能分析报告 ─────────────────────────────────────────────────────

    @Override
    public AiAnalysisReportDTO generateReport(Long courseId) {
        Course course = courseMapper.selectById(courseId);
        if (course == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "课程不存在");
        }

        // 学生名单
        List<CourseStudent> css = courseStudentMapper.selectList(
                new LambdaQueryWrapper<CourseStudent>().eq(CourseStudent::getCourseId, courseId));
        List<Long> studentIds = css.stream().map(CourseStudent::getStudentId).distinct().toList();
        Map<Long, Student> studentMap = studentIds.isEmpty() ? Map.of()
                : studentMapper.selectBatchIds(studentIds).stream()
                        .collect(Collectors.toMap(Student::getId, s -> s));

        // 模块一：到课率短板分析
        AiAnalysisReportDTO.AttendanceModule attendance = buildAttendanceModule(courseId, studentIds, studentMap);

        // 考核 + 成绩记录（成绩分析 / 学生风险 / 评价反馈共用）
        List<Assessment> assessments = assessmentMapper.selectList(
                new LambdaQueryWrapper<Assessment>().eq(Assessment::getCourseId, courseId));
        List<AssessmentRecord> records = loadRecords(assessments);

        // 模块二：知识点再讲建议
        List<AiAnalysisReportDTO.KpAdvice> knowledge = buildKpAdvice(courseId);

        // 模块三：学生综合预警（整合考勤 + 作业 + 考试）
        List<AiAnalysisReportDTO.StudentRisk> alerts =
                buildStudentRisks(studentIds, studentMap, attendance, assessments, records);

        // 模块四：成绩分析
        List<AiAnalysisReportDTO.AssessmentStat> scores = buildScoreStats(assessments, records);

        // 模块五：教学评价反馈
        List<AiAnalysisReportDTO.KpFeedback> feedback = buildKpFeedback(records);

        // AI 总评（可降级）：buildAiSummary 返回 "AI_" 标记表示大模型不可用，用规则总结兜底
        String aiSummary = buildAiSummary(course, attendance, knowledge, alerts, scores);
        boolean aiAvailable = !aiSummary.startsWith("AI_");
        String summary = aiAvailable ? aiSummary : fallbackSummary(attendance, knowledge, alerts);

        AiAnalysisReportDTO report = AiAnalysisReportDTO.builder()
                .courseId(courseId)
                .courseName(course.getCourseName())
                .semester(course.getSemester())
                .generatedAt(LocalDateTime.now().format(TS))
                .aiSummary(summary)
                .aiAvailable(aiAvailable)
                .attendance(attendance)
                .knowledge(knowledge)
                .alerts(alerts)
                .scores(scores)
                .feedback(feedback)
                .build();

        saveResult("TEACHING_REPORT", courseId, report);
        return report;
    }

    /** 到课率短板分析：按学生统计出勤/迟到/请假/缺勤，班级平均到课率作为参考项 */
    private AiAnalysisReportDTO.AttendanceModule buildAttendanceModule(
            Long courseId, List<Long> studentIds, Map<Long, Student> studentMap) {
        List<Attendance> atts = attendanceMapper.selectList(
                new LambdaQueryWrapper<Attendance>().eq(Attendance::getCourseId, courseId));

        BigDecimal classAvgRate = BigDecimal.ZERO;
        List<AiAnalysisReportDTO.StudentAttendance> students = new ArrayList<>();
        if (!atts.isEmpty()) {
            Map<Long, List<Attendance>> byStudent = atts.stream()
                    .collect(Collectors.groupingBy(Attendance::getStudentId));

            long totalPresent = 0;
            for (Long sid : studentIds) {
                List<Attendance> list = byStudent.getOrDefault(sid, List.of());
                int present = 0, late = 0, leave = 0, absent = 0;
                for (Attendance a : list) {
                    switch (AttendanceStatus.normalize(a.getStatus())) {
                        case "出勤" -> present++;
                        case "迟到" -> late++;
                        case "请假" -> leave++;
                        case "缺勤" -> absent++;
                        default -> { /* 未知状态不计入 */ }
                    }
                }
                totalPresent += present;
                int total = list.size();
                BigDecimal rate = total == 0 ? BigDecimal.ZERO
                        : pct(present, total);
                Student s = studentMap.get(sid);
                students.add(AiAnalysisReportDTO.StudentAttendance.builder()
                        .studentId(sid)
                        .studentNo(s != null ? s.getStudentNo() : null)
                        .name(s != null ? s.getName() : null)
                        .presentCount(present).lateCount(late).leaveCount(leave).absentCount(absent)
                        .attendanceRate(rate)
                        .level(rate.compareTo(ATTENDANCE_WARN) < 0 ? "预警"
                                : rate.compareTo(new BigDecimal("90")) < 0 ? "关注" : "正常")
                        .build());
            }
            // 班级平均到课率 = 总出勤次数 / 总应到次数（参考项）
            classAvgRate = pct(totalPresent, atts.size());
        }

        students.sort(Comparator.comparing(AiAnalysisReportDTO.StudentAttendance::getAttendanceRate));
        return AiAnalysisReportDTO.AttendanceModule.builder()
                .classAvgRate(classAvgRate)
                .students(students)
                .build();
    }

    /** 知识点再讲建议：班级平均掌握率 < 50% 建议重点再讲，< 70% 建议巩固 */
    private List<AiAnalysisReportDTO.KpAdvice> buildKpAdvice(Long courseId) {
        List<StudentKpMastery> masteryList = studentKpMasteryMapper.selectList(
                new LambdaQueryWrapper<StudentKpMastery>().eq(StudentKpMastery::getCourseId, courseId));
        if (masteryList.isEmpty()) {
            return List.of();
        }
        Map<String, List<StudentKpMastery>> grouped = masteryList.stream()
                .filter(m -> m.getKpName() != null)
                .collect(Collectors.groupingBy(StudentKpMastery::getKpName));

        return grouped.entrySet().stream().map(e -> {
            List<StudentKpMastery> list = e.getValue();
            BigDecimal avg = avgOf(list.stream()
                    .map(m -> m.getMasteryRate() != null ? m.getMasteryRate() : BigDecimal.ZERO)
                    .toList());
            int weakCount = (int) list.stream()
                    .filter(m -> m.getMasteryRate() != null && m.getMasteryRate().compareTo(KP_WEAK) < 0)
                    .count();
            String suggestion = avg.compareTo(KP_RETEACH) < 0 ? "RETEACH"
                    : avg.compareTo(KP_REINFORCE) < 0 ? "REINFORCE" : "OK";
            return AiAnalysisReportDTO.KpAdvice.builder()
                    .kpName(e.getKey())
                    .classAvgRate(avg)
                    .studentCount(list.size())
                    .weakStudentCount(weakCount)
                    .suggestion(suggestion)
                    .build();
        }).sorted(Comparator.comparing(AiAnalysisReportDTO.KpAdvice::getClassAvgRate))
          .collect(Collectors.toList());
    }

    /** 学生综合预警：整合到课率、作业均分、考试均分，给出风险等级与原因 */
    private List<AiAnalysisReportDTO.StudentRisk> buildStudentRisks(
            List<Long> studentIds, Map<Long, Student> studentMap,
            AiAnalysisReportDTO.AttendanceModule attendance,
            List<Assessment> assessments, List<AssessmentRecord> records) {

        Map<Long, AiAnalysisReportDTO.StudentAttendance> attMap = attendance.getStudents().stream()
                .collect(Collectors.toMap(AiAnalysisReportDTO.StudentAttendance::getStudentId, a -> a));

        // 考核ID → 类型（HOMEWORK 与 其他 分组）
        Set<Long> homeworkIds = assessments.stream()
                .filter(a -> "HOMEWORK".equals(a.getAssessmentType()))
                .map(Assessment::getId).collect(Collectors.toSet());

        // 学生均分（百分制：totalScore / 满分 × 100）
        Map<Long, List<BigDecimal>> homeworkScores = new HashMap<>();
        Map<Long, List<BigDecimal>> examScores = new HashMap<>();
        Map<Long, Assessment> assessmentMap = assessments.stream()
                .collect(Collectors.toMap(Assessment::getId, a -> a));
        for (AssessmentRecord r : records) {
            Assessment a = assessmentMap.get(r.getAssessmentId());
            if (a == null || a.getTotalScore() == null || a.getTotalScore().signum() <= 0
                    || r.getTotalScore() == null || "ABSENT".equals(r.getSubmitStatus())) {
                continue;
            }
            BigDecimal rate = r.getTotalScore()
                    .divide(a.getTotalScore(), 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal(100)).setScale(1, RoundingMode.HALF_UP);
            if (homeworkIds.contains(r.getAssessmentId())) {
                homeworkScores.computeIfAbsent(r.getStudentId(), k -> new ArrayList<>()).add(rate);
            } else {
                examScores.computeIfAbsent(r.getStudentId(), k -> new ArrayList<>()).add(rate);
            }
        }

        List<AiAnalysisReportDTO.StudentRisk> risks = new ArrayList<>();
        for (Long sid : studentIds) {
            List<String> reasons = new ArrayList<>();
            AiAnalysisReportDTO.StudentAttendance att = attMap.get(sid);
            BigDecimal attRate = att != null ? att.getAttendanceRate() : BigDecimal.ZERO;
            int absentCount = att != null && att.getAbsentCount() != null ? att.getAbsentCount() : 0;
            if (attRate.compareTo(ATTENDANCE_WARN) < 0) {
                reasons.add("到课率 " + attRate + "%，低于 80% 参考线");
            }
            if (absentCount >= 3) {
                reasons.add("缺勤 " + absentCount + " 次");
            }

            List<BigDecimal> hw = homeworkScores.getOrDefault(sid, List.of());
            List<BigDecimal> ex = examScores.getOrDefault(sid, List.of());
            BigDecimal hwAvg = hw.isEmpty() ? null : avgOf(hw);
            BigDecimal exAvg = ex.isEmpty() ? null : avgOf(ex);
            if (hwAvg != null && hwAvg.compareTo(SCORE_PASS) < 0) {
                reasons.add("作业均分折合 " + hwAvg + " 分");
            }
            if (exAvg != null && exAvg.compareTo(SCORE_PASS) < 0) {
                reasons.add("考试均分折合 " + exAvg + " 分");
            }

            if (reasons.isEmpty()) {
                continue; // 只保留有风险信号的学生
            }
            Student s = studentMap.get(sid);
            risks.add(AiAnalysisReportDTO.StudentRisk.builder()
                    .studentId(sid)
                    .studentNo(s != null ? s.getStudentNo() : null)
                    .name(s != null ? s.getName() : null)
                    .attendanceRate(attRate)
                    .homeworkAvg(hwAvg)
                    .examAvg(exAvg)
                    .riskLevel(reasons.size() >= 2 ? "HIGH" : "MEDIUM")
                    .reasons(reasons)
                    .build());
        }

        risks.sort(Comparator
                .comparing(AiAnalysisReportDTO.StudentRisk::getRiskLevel)
                .thenComparing(r -> r.getExamAvg() != null ? r.getExamAvg() : BigDecimal.valueOf(100)));
        return risks;
    }

    /** 成绩分析：逐考核统计平均分、得分率、缺考数、低分人数 */
    private List<AiAnalysisReportDTO.AssessmentStat> buildScoreStats(
            List<Assessment> assessments, List<AssessmentRecord> records) {
        Map<Long, List<AssessmentRecord>> byAssessment = records.stream()
                .collect(Collectors.groupingBy(AssessmentRecord::getAssessmentId));

        return assessments.stream().map(a -> {
            List<AssessmentRecord> list = byAssessment.getOrDefault(a.getId(), List.of());
            BigDecimal total = a.getTotalScore() != null ? a.getTotalScore() : BigDecimal.ZERO;
            int absent = (int) list.stream()
                    .filter(r -> "ABSENT".equals(r.getSubmitStatus())).count();
            List<BigDecimal> rateList = list.stream()
                    .filter(r -> r.getTotalScore() != null && total.signum() > 0)
                    .filter(r -> !"ABSENT".equals(r.getSubmitStatus())) // 缺考不计入得分率
                    .map(r -> r.getTotalScore()
                            .divide(total, 4, RoundingMode.HALF_UP)
                            .multiply(new BigDecimal(100)).setScale(1, RoundingMode.HALF_UP))
                    .toList();
            BigDecimal avgRate = rateList.isEmpty() ? BigDecimal.ZERO : avgOf(rateList);
            int lowCount = (int) rateList.stream().filter(r -> r.compareTo(SCORE_PASS) < 0).count();
            BigDecimal avgScore = total.signum() > 0 && !rateList.isEmpty()
                    ? avgRate.multiply(total).divide(new BigDecimal(100), 1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            return AiAnalysisReportDTO.AssessmentStat.builder()
                    .assessmentId(a.getId())
                    .assessmentName(a.getAssessmentName())
                    .assessmentType(a.getAssessmentType())
                    .totalScore(total)
                    .avgScore(avgScore)
                    .scoreRate(avgRate)
                    .absentCount(absent)
                    .lowScoreCount(lowCount)
                    .build();
        }).sorted(Comparator.comparing(
                s -> s.getAssessmentName() != null ? s.getAssessmentName() : ""))
          .collect(Collectors.toList());
    }

    /** 教学评价反馈：聚合成绩记录中的最薄弱知识点/方面 */
    private List<AiAnalysisReportDTO.KpFeedback> buildKpFeedback(List<AssessmentRecord> records) {
        Map<String, List<AssessmentRecord>> grouped = records.stream()
                .filter(r -> r.getWeakestKp() != null && !r.getWeakestKp().isBlank())
                .collect(Collectors.groupingBy(AssessmentRecord::getWeakestKp));

        return grouped.entrySet().stream()
                .map(e -> AiAnalysisReportDTO.KpFeedback.builder()
                        .kpName(e.getKey())
                        .count(e.getValue().size())
                        .aspect(e.getValue().stream()
                                .map(AssessmentRecord::getWeakestAspect)
                                .filter(a -> a != null && !a.isBlank())
                                .findFirst().orElse(null))
                        .build())
                .sorted(Comparator.comparing(AiAnalysisReportDTO.KpFeedback::getCount).reversed())
                .limit(8)
                .collect(Collectors.toList());
    }

    // ─── 题库整理判断 ────────────────────────────────────────────────────────

    @Override
    public QuestionBankAuditDTO auditQuestionBank(Long courseId) {
        Course course = courseMapper.selectById(courseId);
        if (course == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "课程不存在");
        }
        List<QuestionBank> questions = questionBankMapper.selectList(
                new LambdaQueryWrapper<QuestionBank>().eq(QuestionBank::getCourseId, courseId));

        // 题型分布 / AI 生成数 / 待审核数
        Map<String, Long> typeCounts = questions.stream()
                .filter(q -> q.getQuestionType() != null)
                .collect(Collectors.groupingBy(QuestionBank::getQuestionType, Collectors.counting()));
        List<QuestionBankAuditDTO.TypeStat> typeDistribution = typeCounts.entrySet().stream()
                .map(e -> QuestionBankAuditDTO.TypeStat.builder()
                        .questionType(e.getKey()).count(e.getValue().intValue()).build())
                .sorted(Comparator.comparing(QuestionBankAuditDTO.TypeStat::getCount).reversed())
                .toList();
        int aiGenerated = (int) questions.stream()
                .filter(q -> q.getAiGenerated() != null && q.getAiGenerated() == 1).count();
        int pendingReview = (int) questions.stream()
                .filter(q -> "DRAFT".equals(q.getStatus())).count();

        // 知识点覆盖
        Map<String, Integer> kpCount = new LinkedHashMap<>();
        for (QuestionBank q : questions) {
            if (q.getKnowledgePoints() == null || q.getKnowledgePoints().isBlank()) {
                continue;
            }
            for (String kp : q.getKnowledgePoints().split("[,，]")) {
                String name = kp.trim();
                if (!name.isEmpty()) {
                    kpCount.merge(name, 1, Integer::sum);
                }
            }
        }
        List<QuestionBankAuditDTO.KpCoverage> coverage = kpCount.entrySet().stream()
                .map(e -> QuestionBankAuditDTO.KpCoverage.builder()
                        .kpName(e.getKey()).questionCount(e.getValue()).build())
                .sorted(Comparator.comparing(QuestionBankAuditDTO.KpCoverage::getQuestionCount).reversed())
                .toList();
        List<KnowledgePoint> courseKps = knowledgePointMapper.selectList(
                new LambdaQueryWrapper<KnowledgePoint>().eq(KnowledgePoint::getCourseId, courseId));
        Set<String> covered = kpCount.keySet();
        List<String> uncovered = courseKps.stream()
                .map(KnowledgePoint::getKpName)
                .filter(Objects::nonNull)
                .filter(name -> !covered.contains(name.trim()))
                .distinct()
                .toList();
        Set<String> courseKpNames = courseKps.stream()
                .map(KnowledgePoint::getKpName)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(name -> !name.isEmpty())
                .collect(Collectors.toSet());

        // 疑似重复题（题干完全相同）
        Map<String, List<Long>> stemGroups = new LinkedHashMap<>();
        for (QuestionBank q : questions) {
            String stem = extractStem(q);
            if (stem != null) {
                stemGroups.computeIfAbsent(stem, k -> new ArrayList<>()).add(q.getId());
            }
        }
        List<QuestionBankAuditDTO.DuplicateGroup> duplicates = stemGroups.entrySet().stream()
                .filter(e -> e.getValue().size() > 1)
                .map(e -> QuestionBankAuditDTO.DuplicateGroup.builder()
                        .stem(truncate(e.getKey(), 50))
                        .questionIds(e.getValue())
                        .build())
                .toList();

        // 质量均分
        List<QuestionBank> rated = questions.stream()
                .filter(q -> q.getQualityClarity() != null).toList();
        BigDecimal avgClarity = rated.isEmpty() ? null
                : avgOf(rated.stream().map(q -> BigDecimal.valueOf(q.getQualityClarity())).toList());
        List<QuestionBank> ratedDiff = questions.stream()
                .filter(q -> q.getQualityDifficulty() != null).toList();
        BigDecimal avgDifficulty = ratedDiff.isEmpty() ? null
                : avgOf(ratedDiff.stream().map(q -> BigDecimal.valueOf(q.getQualityDifficulty())).toList());
        List<QuestionBank> ratedAmb = questions.stream()
                .filter(q -> q.getQualityAmbiguity() != null).toList();
        BigDecimal avgAmbiguity = ratedAmb.isEmpty() ? null
                : avgOf(ratedAmb.stream().map(q -> BigDecimal.valueOf(q.getQualityAmbiguity())).toList());
        List<QuestionBank> ratedKp = questions.stream()
                .filter(q -> q.getQualityKpCoverage() != null).toList();
        BigDecimal avgKp = ratedKp.isEmpty() ? null
                : avgOf(ratedKp.stream().map(q -> BigDecimal.valueOf(q.getQualityKpCoverage())).toList());

        // 难度分布
        Map<String, Long> difficultyCounts = new LinkedHashMap<>();
        for (QuestionBank q : questions) {
            String d = q.getDifficulty() == null || q.getDifficulty().isBlank()
                    ? "UNLABELED" : q.getDifficulty().trim().toUpperCase();
            difficultyCounts.merge(d, 1L, Long::sum);
        }
        List<QuestionBankAuditDTO.DifficultyStat> difficultyDistribution = difficultyCounts.entrySet().stream()
                .map(e -> QuestionBankAuditDTO.DifficultyStat.builder()
                        .difficulty(e.getKey()).count(e.getValue().intValue()).build())
                .sorted(Comparator.comparing(QuestionBankAuditDTO.DifficultyStat::getCount).reversed())
                .toList();

        // 内容完整性 / 规范性 / 知识点错标（逐题规则检测）
        List<QuestionBankAuditDTO.IssueItem> issues = new ArrayList<>();
        for (QuestionBank q : questions) {
            JsonNode content = parseContent(q);
            String stem = extractStem(q);
            String stemText = stem == null ? "" : truncate(stem, 50);
            String type = q.getQuestionType();

            // 内容完整性
            if (content == null || !hasText(content, "stem")) {
                issues.add(issue(q, stemText, "MISSING_STEM", null));
            } else {
                if (isChoiceType(type) && !hasOptions(content)) {
                    issues.add(issue(q, stemText, "MISSING_OPTIONS", null));
                }
                if (!hasText(content, "answer")) {
                    issues.add(issue(q, stemText, "MISSING_ANSWER", null));
                }
                if (!hasText(content, "analysis", "explanation")) {
                    issues.add(issue(q, stemText, "MISSING_ANALYSIS", null));
                }
            }

            // 规范性：难度
            if (q.getDifficulty() == null || q.getDifficulty().isBlank()
                    || !VALID_DIFFICULTIES.contains(q.getDifficulty().trim().toUpperCase())) {
                issues.add(issue(q, stemText, "INVALID_DIFFICULTY",
                        q.getDifficulty() == null ? "空" : q.getDifficulty()));
            }

            // 规范性：知识点为空 / 错标
            if (q.getKnowledgePoints() == null || q.getKnowledgePoints().isBlank()) {
                issues.add(issue(q, stemText, "NO_KNOWLEDGE_POINT", null));
            } else if (!courseKpNames.isEmpty() && !matchesAnyKp(q.getKnowledgePoints(), courseKpNames)) {
                issues.add(issue(q, stemText, "UNMATCHED_KNOWLEDGE_POINT", q.getKnowledgePoints()));
            }
        }

        // 从未被组卷使用的题目数
        int unusedCount = (int) questions.stream()
                .filter(q -> q.getUsageCount() == null || q.getUsageCount() == 0).count();

        // 规则整理建议
        List<String> suggestions = new ArrayList<>();
        if (!uncovered.isEmpty()) {
            suggestions.add("有 " + uncovered.size() + " 个教学知识点没有对应题目：" + truncate(String.join("、", uncovered), 60));
        }
        if (!duplicates.isEmpty()) {
            suggestions.add("发现 " + duplicates.size() + " 组疑似重复题目（题干相同），建议合并或下架");
        }
        if (pendingReview > 0) {
            suggestions.add("有 " + pendingReview + " 道题处于待审核（DRAFT）状态，建议尽快审核入库");
        }
        if (total(typeDistribution) == 0) {
            suggestions.add("题库为空，可使用「AI出题组卷」按知识点批量生成题目");
        } else if (typeDistribution.size() < 3) {
            suggestions.add("题型仅 " + typeDistribution.size() + " 种，建议补充不同题型以提升卷面多样性");
        }
        if (avgClarity != null && avgClarity.compareTo(new BigDecimal("3")) < 0) {
            suggestions.add("AI 质量评分显示题目清晰度偏低（均分 " + avgClarity + "/5），建议人工复核题干表述");
        }
        // 新增规则建议
        Map<String, Long> issueCounts = issues.stream()
                .collect(Collectors.groupingBy(QuestionBankAuditDTO.IssueItem::getCategory, Collectors.counting()));
        long missingStem = count(issueCounts, "MISSING_STEM");
        long missingOptions = count(issueCounts, "MISSING_OPTIONS");
        long missingAnswer = count(issueCounts, "MISSING_ANSWER");
        long missingAnalysis = count(issueCounts, "MISSING_ANALYSIS");
        long incomplete = missingStem + missingOptions + missingAnswer + missingAnalysis;
        if (incomplete > 0) {
            suggestions.add("有 " + incomplete + " 道题内容不完整（缺题干 " + missingStem
                    + "、缺选项 " + missingOptions + "、缺答案 " + missingAnswer
                    + "、缺解析 " + missingAnalysis + "），建议补齐");
        }
        long invalidDifficulty = count(issueCounts, "INVALID_DIFFICULTY");
        if (invalidDifficulty > 0) {
            suggestions.add("有 " + invalidDifficulty + " 道题难度缺失或非法，建议规范标注");
        }
        long noKp = count(issueCounts, "NO_KNOWLEDGE_POINT");
        if (noKp > 0) {
            suggestions.add("有 " + noKp + " 道题未标注知识点，建议补充");
        }
        long unmatchedKp = count(issueCounts, "UNMATCHED_KNOWLEDGE_POINT");
        if (unmatchedKp > 0) {
            suggestions.add("有 " + unmatchedKp + " 道题的知识点标签不在课程知识点列表中，建议核对");
        }
        if (unusedCount > 0) {
            suggestions.add("有 " + unusedCount + " 道题从未被组卷使用，建议评估是否保留或复用");
        }
        if (!questions.isEmpty() && difficultyDistribution.size() == 1
                && "UNLABELED".equals(difficultyDistribution.get(0).getDifficulty())) {
            suggestions.add("题目均未标注难度，建议补充难度标签");
        }
        if (suggestions.isEmpty()) {
            suggestions.add("题库整体状态良好，暂无需整理");
        }

        QuestionBankAuditDTO audit = QuestionBankAuditDTO.builder()
                .courseId(courseId)
                .total(questions.size())
                .aiGenerated(aiGenerated)
                .pendingReview(pendingReview)
                .typeDistribution(typeDistribution)
                .kpCoverage(coverage)
                .uncoveredKps(uncovered)
                .duplicates(duplicates)
                .avgClarity(avgClarity)
                .avgDifficultyMatch(avgDifficulty)
                .avgAmbiguity(avgAmbiguity)
                .avgKpCoverage(avgKp)
                .difficultyDistribution(difficultyDistribution)
                .issues(issues)
                .unusedCount(unusedCount)
                .suggestions(suggestions)
                .build();

        // AI 综合判断（可降级）
        String judgment = buildAiJudgment(audit);
        audit.setAiAvailable(!judgment.startsWith("AI_"));
        audit.setAiJudgment(judgment.startsWith("AI_") ? String.join("；", suggestions) : judgment);

        saveResult("QUESTION_BANK_AUDIT", courseId, audit);
        return audit;
    }

    // ─── AI 增强（可降级） ───────────────────────────────────────────────────

    /** AI 总评：成功返回 AI 文案；失败/空返回以 "AI_" 开头的降级标记（调用方再翻转） */
    private String buildAiSummary(
            Course course,
            AiAnalysisReportDTO.AttendanceModule attendance,
            List<AiAnalysisReportDTO.KpAdvice> knowledge,
            List<AiAnalysisReportDTO.StudentRisk> alerts,
            List<AiAnalysisReportDTO.AssessmentStat> scores) {
        try {
            StringBuilder p = new StringBuilder();
            p.append("你是一位高校教学分析专家。请根据以下课程统计数据，生成一段约250字的中文教学分析总结，")
                    .append("指出当前教学短板、最需要重点再讲的知识点、以及需要优先关注的学生，并给出可执行的教学建议。")
                    .append("直接输出总结文字，不要加标题或前缀。\n\n");
            p.append("课程：").append(course.getCourseName()).append("（").append(course.getSemester()).append("）\n");
            p.append("班级平均到课率：").append(attendance.getClassAvgRate()).append("%\n");
            long attWarn = attendance.getStudents().stream()
                    .filter(s -> "预警".equals(s.getLevel())).count();
            p.append("到课率低于80%的学生数：").append(attWarn).append("\n");
            List<AiAnalysisReportDTO.KpAdvice> weakKps = knowledge.stream()
                    .filter(k -> !"OK".equals(k.getSuggestion())).limit(5).toList();
            if (!weakKps.isEmpty()) {
                p.append("薄弱知识点（班级平均掌握率）：");
                p.append(weakKps.stream()
                        .map(k -> k.getKpName() + " " + k.getClassAvgRate() + "%")
                        .collect(Collectors.joining("、"))).append("\n");
            }
            long high = alerts.stream().filter(r -> "HIGH".equals(r.getRiskLevel())).count();
            p.append("综合预警学生数：").append(alerts.size()).append("（高风险 ").append(high).append(" 名）\n");
            if (!scores.isEmpty()) {
                p.append("考核概况：");
                p.append(scores.stream()
                        .map(s -> s.getAssessmentName() + " 平均得分率 " + s.getScoreRate() + "%")
                        .limit(6)
                        .collect(Collectors.joining("；"))).append("\n");
            }
            String text = ollamaService.generate(p.toString());
            if (text != null && !text.isBlank()) {
                text = text.replaceAll("```[\\s\\S]*?```", "").trim();
                return text.length() > 600 ? text.substring(0, 600) : text;
            }
        } catch (Exception e) {
            log.warn("AI 总评生成失败，降级为规则总结: {}", e.getMessage());
        }
        return "AI_UNAVAILABLE";
    }

    /** 规则兜底总评 */
    private String fallbackSummary(
            AiAnalysisReportDTO.AttendanceModule attendance,
            List<AiAnalysisReportDTO.KpAdvice> knowledge,
            List<AiAnalysisReportDTO.StudentRisk> alerts) {
        long attWarn = attendance.getStudents().stream()
                .filter(s -> "预警".equals(s.getLevel())).count();
        List<String> reteach = knowledge.stream()
                .filter(k -> "RETEACH".equals(k.getSuggestion()))
                .map(AiAnalysisReportDTO.KpAdvice::getKpName).toList();
        long high = alerts.stream().filter(r -> "HIGH".equals(r.getRiskLevel())).count();
        StringBuilder sb = new StringBuilder();
        sb.append("班级平均到课率 ").append(attendance.getClassAvgRate())
                .append("%，有 ").append(attWarn).append(" 名学生到课率低于 80%；");
        if (!reteach.isEmpty()) {
            sb.append("「").append(String.join("、", reteach)).append("」掌握薄弱，建议重点再讲；");
        }
        sb.append("综合预警学生 ").append(alerts.size()).append(" 名（高风险 ").append(high).append(" 名），建议结合风险原因逐一辅导。");
        return sb.toString();
    }

    /** AI 题库判断：成功返回 AI 文案；失败返回以 "AI_" 开头的降级标记 */
    private String buildAiJudgment(QuestionBankAuditDTO audit) {
        try {
            StringBuilder p = new StringBuilder();
            p.append("你是一位题库质量审核专家。请根据以下题库体检数据，生成一段约150字的中文整理判断，")
                    .append("指出题库主要问题与整理优先级。直接输出文字，不要加标题或前缀。\n\n");
            p.append("题目总数：").append(audit.getTotal())
                    .append("（AI生成 ").append(audit.getAiGenerated())
                    .append("，待审核 ").append(audit.getPendingReview()).append("）\n");
            p.append("题型分布：");
            p.append(audit.getTypeDistribution().stream()
                    .map(t -> t.getQuestionType() + "×" + t.getCount())
                    .collect(Collectors.joining("、"))).append("\n");
            p.append("未覆盖知识点数：").append(audit.getUncoveredKps().size()).append("\n");
            p.append("疑似重复题组数：").append(audit.getDuplicates().size()).append("\n");
            if (audit.getAvgClarity() != null) {
                p.append("AI质量均分：清晰度 ").append(audit.getAvgClarity())
                        .append("、难度匹配 ").append(audit.getAvgDifficultyMatch())
                        .append("、歧义性 ").append(audit.getAvgAmbiguity())
                        .append("、知识点覆盖 ").append(audit.getAvgKpCoverage()).append("（满分5）\n");
            }
            p.append("规则建议：").append(String.join("；", audit.getSuggestions())).append("\n");
            String text = ollamaService.generate(p.toString());
            if (text != null && !text.isBlank()) {
                text = text.replaceAll("```[\\s\\S]*?```", "").trim();
                return text.length() > 400 ? text.substring(0, 400) : text;
            }
        } catch (Exception e) {
            log.warn("AI 题库判断生成失败，降级为规则建议: {}", e.getMessage());
        }
        return "AI_UNAVAILABLE";
    }

    // ─── 工具方法 ────────────────────────────────────────────────────────────

    private List<AssessmentRecord> loadRecords(List<Assessment> assessments) {
        if (assessments.isEmpty()) {
            return List.of();
        }
        List<Long> ids = assessments.stream().map(Assessment::getId).toList();
        return assessmentRecordMapper.selectList(
                new LambdaQueryWrapper<AssessmentRecord>().in(AssessmentRecord::getAssessmentId, ids));
    }

    private BigDecimal pct(long part, long total) {
        if (total == 0) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(part).multiply(new BigDecimal(100))
                .divide(new BigDecimal(total), 1, RoundingMode.HALF_UP);
    }

    private BigDecimal avgOf(List<BigDecimal> values) {
        if (values.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return values.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(new BigDecimal(values.size()), 1, RoundingMode.HALF_UP);
    }

    private int total(List<QuestionBankAuditDTO.TypeStat> typeDistribution) {
        return typeDistribution.stream().mapToInt(QuestionBankAuditDTO.TypeStat::getCount).sum();
    }

    /** 从题目 content JSON 中提取题干；解析失败时退回原始内容 */
    private String extractStem(QuestionBank q) {
        String content = q.getContent();
        if (content == null || content.isBlank()) {
            return null;
        }
        try {
            JsonNode node = objectMapper.readTree(content);
            if (node.isObject() && node.hasNonNull("stem")) {
                return node.get("stem").asText().replaceAll("\\s+", "");
            }
        } catch (Exception ignored) {
            // 非 JSON 内容，按原文处理
        }
        return content.replaceAll("\\s+", "");
    }

    private String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }

    /** 解析题目 content JSON，失败返回 null */
    private JsonNode parseContent(QuestionBank q) {
        String content = q.getContent();
        if (content == null || content.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readTree(content);
        } catch (Exception e) {
            return null;
        }
    }

    /** 对象中任一 key 存在非空文本值 */
    private boolean hasText(JsonNode node, String... keys) {
        if (node == null || !node.isObject()) {
            return false;
        }
        for (String key : keys) {
            JsonNode value = node.get(key);
            if (value != null && value.isTextual() && !value.asText().isBlank()) {
                return true;
            }
        }
        return false;
    }

    /** 选择题是否有选项（支持对象 {A:..} 或数组 [{label,text}]） */
    private boolean hasOptions(JsonNode content) {
        if (content == null || !content.isObject()) {
            return false;
        }
        JsonNode options = content.get("options");
        if (options == null || options.isNull()) {
            return false;
        }
        return options.isObject() ? options.size() > 0 : options.isArray() && options.size() > 0;
    }

    /** 是否选择题型（SINGLE/MULTI 或中文单选/多选） */
    private boolean isChoiceType(String type) {
        if (type == null) {
            return false;
        }
        String upper = type.trim().toUpperCase();
        return upper.contains("SINGLE") || upper.contains("MULTI")
                || type.contains("单选") || type.contains("多选");
    }

    /** 知识点标签是否命中课程知识点名（兼容「一级模块/二级知识点」层级格式） */
    private boolean matchesAnyKp(String knowledgePoints, Set<String> courseKpNames) {
        for (String tag : knowledgePoints.split("[,，]")) {
            String t = tag.trim();
            if (t.isEmpty()) {
                continue;
            }
            if (courseKpNames.contains(t)) {
                return true;
            }
            int idx = t.lastIndexOf('/');
            if (idx >= 0 && courseKpNames.contains(t.substring(idx + 1).trim())) {
                return true;
            }
        }
        return false;
    }

    private QuestionBankAuditDTO.IssueItem issue(QuestionBank q, String stemText, String category, String detail) {
        return QuestionBankAuditDTO.IssueItem.builder()
                .questionId(q.getId())
                .questionType(q.getQuestionType())
                .stem(stemText)
                .category(category)
                .detail(detail)
                .build();
    }

    private long count(Map<String, Long> counts, String key) {
        return counts.getOrDefault(key, 0L);
    }

    /** 分析结果落库 t_ai_analysis_result */
    private void saveResult(String analysisType, Long courseId, Object result) {
        try {
            AiAnalysisResult entity = new AiAnalysisResult();
            entity.setAnalysisType(analysisType);
            entity.setTargetId(courseId);
            entity.setTargetType("COURSE");
            entity.setResultData(objectMapper.writeValueAsString(result));
            entity.setModelName(ollamaProperties.getModel());
            entity.setAnalysisTime(LocalDateTime.now());
            entity.setDeleted(0);
            aiAnalysisResultMapper.insert(entity);
        } catch (Exception e) {
            log.warn("分析结果保存失败（不影响返回）: {}", e.getMessage());
        }
    }
}
