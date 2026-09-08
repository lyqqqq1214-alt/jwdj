package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.entity.*;
import com.example.aitaes.mapper.*;
import com.example.aitaes.service.WarningCheckService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 预警检查服务实现
 * <p>
 * 根据预警规则自动检查学生数据，生成预警记录
 * 支持4种规则：ATTENDANCE（缺勤）、SCORE_DROP（成绩下滑）、HOMEWORK_MISS（作业未交）、KP_WEAK（知识点薄弱）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WarningCheckServiceImpl implements WarningCheckService {

    private final CourseStudentMapper courseStudentMapper;
    private final AttendanceMapper attendanceMapper;
    private final AssessmentMapper assessmentMapper;
    private final AssessmentRecordMapper assessmentRecordMapper;
    private final StudentKpMasteryMapper studentKpMasteryMapper;
    private final WarningRecordMapper warningRecordMapper;
    private final SystemConfigMapper systemConfigMapper;

    @Override
    public int checkAndGenerateWarnings(Long courseId) {
        log.info("开始预警检查: courseId={}", courseId);

        // 获取课程下所有学生
        List<CourseStudent> courseStudents = courseStudentMapper.selectList(
                new LambdaQueryWrapper<CourseStudent>()
                        .eq(CourseStudent::getCourseId, courseId));

        if (courseStudents.isEmpty()) {
            log.info("课程无学生，跳过预警检查: courseId={}", courseId);
            return 0;
        }

        // 读取预警阈值配置
        WarningThresholds thresholds = loadThresholds();

        int totalWarnings = 0;
        for (CourseStudent cs : courseStudents) {
            Long studentId = cs.getStudentId();
            totalWarnings += checkStudent(courseId, studentId, thresholds);
        }

        log.info("预警检查完成: courseId={}, 新增预警数={}", courseId, totalWarnings);
        return totalWarnings;
    }

    @Override
    public void checkStudentWarnings(Long courseId, Long studentId) {
        WarningThresholds thresholds = loadThresholds();
        checkStudent(courseId, studentId, thresholds);
    }

    /**
     * 检查单个学生的所有预警规则
     */
    private int checkStudent(Long courseId, Long studentId, WarningThresholds thresholds) {
        int count = 0;
        count += checkAttendanceWarning(courseId, studentId, thresholds);
        count += checkScoreDropWarning(courseId, studentId, thresholds);
        count += checkHomeworkMissWarning(courseId, studentId, thresholds);
        count += checkKpWeakWarning(courseId, studentId, thresholds);
        return count;
    }

    /**
     * 规则1：缺勤过多预警
     * 阈值：缺勤次数 >= threshold（默认3次）
     */
    private int checkAttendanceWarning(Long courseId, Long studentId, WarningThresholds thresholds) {
        // 统计该学生缺勤次数（状态为"缺勤"）
        Long absentCount = attendanceMapper.selectCount(
                new LambdaQueryWrapper<Attendance>()
                        .eq(Attendance::getCourseId, courseId)
                        .eq(Attendance::getStudentId, studentId)
                        .eq(Attendance::getStatus, "缺勤"));

        if (absentCount >= thresholds.attendanceThreshold) {
            return createWarningIfNotExists(
                    courseId, studentId,
                    "ATTENDANCE",
                    absentCount >= thresholds.attendanceThreshold * 2 ? "HIGH" : "MEDIUM",
                    String.format("该学生缺勤次数已达%d次，超过预警阈值%d次，请及时关注", absentCount, thresholds.attendanceThreshold)
            );
        }
        return 0;
    }

    /**
     * 规则2：成绩持续下滑预警
     * 阈值：连续N次成绩下降幅度 >= M%（默认连续2次下降>=20%）
     */
    private int checkScoreDropWarning(Long courseId, Long studentId, WarningThresholds thresholds) {
        // 获取该课程所有考核，按考核序号排序
        List<Assessment> assessments = assessmentMapper.selectList(
                new LambdaQueryWrapper<Assessment>()
                        .eq(Assessment::getCourseId, courseId)
                        .orderByAsc(Assessment::getAssessmentNo));

        if (assessments.size() < 2) {
            return 0;
        }

        // 获取该学生在每次考核的成绩
        List<BigDecimal> scores = new ArrayList<>();
        for (Assessment assessment : assessments) {
            AssessmentRecord record = assessmentRecordMapper.selectOne(
                    new LambdaQueryWrapper<AssessmentRecord>()
                            .eq(AssessmentRecord::getAssessmentId, assessment.getId())
                            .eq(AssessmentRecord::getStudentId, studentId));
            if (record != null && record.getTotalScore() != null) {
                scores.add(record.getTotalScore());
            }
        }

        if (scores.size() < 2) {
            return 0;
        }

        // 检查连续下滑次数
        int consecutiveDrops = 0;
        BigDecimal maxDropPercent = BigDecimal.ZERO;

        for (int i = 1; i < scores.size(); i++) {
            BigDecimal prev = scores.get(i - 1);
            BigDecimal curr = scores.get(i);

            if (prev.compareTo(BigDecimal.ZERO) > 0 && curr.compareTo(prev) < 0) {
                // 计算下降百分比
                BigDecimal drop = prev.subtract(curr);
                BigDecimal dropPercent = drop.multiply(new BigDecimal(100))
                        .divide(prev, 2, RoundingMode.HALF_UP);

                if (dropPercent.compareTo(new BigDecimal(thresholds.scoreDropPercent)) >= 0) {
                    consecutiveDrops++;
                    maxDropPercent = maxDropPercent.max(dropPercent);
                } else {
                    consecutiveDrops = 0;
                }
            } else {
                consecutiveDrops = 0;
            }
        }

        if (consecutiveDrops >= thresholds.scoreDropTimes) {
            return createWarningIfNotExists(
                    courseId, studentId,
                    "SCORE_DROP",
                    maxDropPercent.compareTo(new BigDecimal(30)) >= 0 ? "HIGH" : "MEDIUM",
                    String.format("该学生成绩连续%d次下滑，最大降幅%.1f%%，请及时关注", consecutiveDrops, maxDropPercent.doubleValue())
            );
        }
        return 0;
    }

    /**
     * 规则3：作业连续未交预警
     * 阈值：连续N次作业未交（默认3次）
     * 判断依据：submitStatus 为 ABSENT 或 null
     */
    private int checkHomeworkMissWarning(Long courseId, Long studentId, WarningThresholds thresholds) {
        // 获取该课程所有作业类型的考核
        List<Assessment> homeworks = assessmentMapper.selectList(
                new LambdaQueryWrapper<Assessment>()
                        .eq(Assessment::getCourseId, courseId)
                        .eq(Assessment::getAssessmentType, "HOMEWORK")
                        .orderByAsc(Assessment::getAssessmentNo));

        if (homeworks.size() < thresholds.homeworkMissTimes) {
            return 0;
        }

        // 检查连续未交次数
        int consecutiveMiss = 0;
        int maxConsecutiveMiss = 0;

        for (Assessment hw : homeworks) {
            AssessmentRecord record = assessmentRecordMapper.selectOne(
                    new LambdaQueryWrapper<AssessmentRecord>()
                            .eq(AssessmentRecord::getAssessmentId, hw.getId())
                            .eq(AssessmentRecord::getStudentId, studentId));

            boolean missed = record == null
                    || record.getSubmitStatus() == null
                    || "ABSENT".equals(record.getSubmitStatus());

            if (missed) {
                consecutiveMiss++;
                maxConsecutiveMiss = Math.max(maxConsecutiveMiss, consecutiveMiss);
            } else {
                consecutiveMiss = 0;
            }
        }

        if (maxConsecutiveMiss >= thresholds.homeworkMissTimes) {
            return createWarningIfNotExists(
                    courseId, studentId,
                    "HOMEWORK_MISS",
                    maxConsecutiveMiss >= thresholds.homeworkMissTimes * 2 ? "HIGH" : "MEDIUM",
                    String.format("该学生连续%d次作业未交，请及时了解原因并进行干预", maxConsecutiveMiss)
            );
        }
        return 0;
    }

    /**
     * 规则4：知识点严重薄弱预警
     * 阈值：单知识点掌握率 < threshold%（默认30%）
     */
    private int checkKpWeakWarning(Long courseId, Long studentId, WarningThresholds thresholds) {
        List<StudentKpMastery> masteries = studentKpMasteryMapper.selectList(
                new LambdaQueryWrapper<StudentKpMastery>()
                        .eq(StudentKpMastery::getCourseId, courseId)
                        .eq(StudentKpMastery::getStudentId, studentId));

        // 找出掌握率低于阈值的知识点
        List<StudentKpMastery> weakKps = masteries.stream()
                .filter(m -> m.getMasteryRate() != null
                        && m.getMasteryRate().compareTo(new BigDecimal(thresholds.kpMasteryThreshold)) < 0)
                .collect(Collectors.toList());

        if (!weakKps.isEmpty()) {
            // 取掌握率最低的知识点
            StudentKpMastery weakest = weakKps.stream()
                    .min(Comparator.comparing(StudentKpMastery::getMasteryRate))
                    .orElse(weakKps.get(0));

            String kpNames = weakKps.stream()
                    .map(k -> String.format("%s(%.0f%%)", k.getKpName(), k.getMasteryRate().doubleValue()))
                    .collect(Collectors.joining("、"));

            return createWarningIfNotExists(
                    courseId, studentId,
                    "KP_WEAK",
                    weakest.getMasteryRate().compareTo(new BigDecimal(15)) < 0 ? "HIGH" : "MEDIUM",
                    String.format("该学生有%d个知识点掌握率低于%d%%，最薄弱：%s", weakKps.size(), thresholds.kpMasteryThreshold, kpNames)
            );
        }
        return 0;
    }

    /**
     * 创建预警记录（带去重）
     * 同一学生、同一课程、同一规则类型，在去重时间内不重复创建
     */
    private int createWarningIfNotExists(Long courseId, Long studentId, String warningType, String severity, String warningMsg) {
        // 读取去重时间配置（默认24小时）
        int dedupHours = getConfigInt("warning.dedup_hours", 24);

        // 检查是否已有未解除的同类预警
        Long existingCount = warningRecordMapper.selectCount(
                new LambdaQueryWrapper<WarningRecord>()
                        .eq(WarningRecord::getCourseId, courseId)
                        .eq(WarningRecord::getStudentId, studentId)
                        .eq(WarningRecord::getWarningType, warningType)
                        .eq(WarningRecord::getIsResolved, 0));

        if (existingCount > 0) {
            log.debug("预警已存在，跳过: courseId={}, studentId={}, type={}", courseId, studentId, warningType);
            return 0;
        }

        // 检查去重时间内是否已创建过
        LocalDateTime dedupTime = LocalDateTime.now().minusHours(dedupHours);
        Long recentCount = warningRecordMapper.selectCount(
                new LambdaQueryWrapper<WarningRecord>()
                        .eq(WarningRecord::getCourseId, courseId)
                        .eq(WarningRecord::getStudentId, studentId)
                        .eq(WarningRecord::getWarningType, warningType)
                        .ge(WarningRecord::getCreateTime, dedupTime));

        if (recentCount > 0) {
            log.debug("去重时间内已创建预警，跳过: courseId={}, studentId={}, type={}", courseId, studentId, warningType);
            return 0;
        }

        // 创建预警记录
        WarningRecord record = new WarningRecord();
        record.setCourseId(courseId);
        record.setStudentId(studentId);
        record.setWarningType(warningType);
        record.setSeverity(severity);
        record.setWarningMsg(warningMsg);
        record.setIsResolved(0);
        warningRecordMapper.insert(record);

        log.info("生成预警记录: courseId={}, studentId={}, type={}, severity={}", courseId, studentId, warningType, severity);
        return 1;
    }

    /**
     * 加载预警阈值配置
     */
    private WarningThresholds loadThresholds() {
        WarningThresholds t = new WarningThresholds();
        t.attendanceThreshold = getConfigInt("warning.attendance_threshold", 3);
        t.scoreDropPercent = getConfigInt("warning.score_drop_threshold", 20);
        t.scoreDropTimes = getConfigInt("warning.score_drop_times", 2);
        t.homeworkMissTimes = getConfigInt("warning.homework_miss_times", 3);
        t.kpMasteryThreshold = getConfigInt("warning.kp_mastery_threshold", 30);
        return t;
    }

    /**
     * 从系统配置中读取整型配置值
     */
    private int getConfigInt(String key, int defaultValue) {
        SystemConfig config = systemConfigMapper.selectOne(
                new LambdaQueryWrapper<SystemConfig>()
                        .eq(SystemConfig::getConfigKey, key));
        if (config != null && config.getConfigValue() != null) {
            try {
                return Integer.parseInt(config.getConfigValue());
            } catch (NumberFormatException e) {
                log.warn("配置值格式错误: key={}, value={}", key, config.getConfigValue());
            }
        }
        return defaultValue;
    }

    /**
     * 预警阈值配置内部类
     */
    private static class WarningThresholds {
        int attendanceThreshold;    // 缺勤次数阈值
        int scoreDropPercent;       // 成绩下滑幅度阈值(%)
        int scoreDropTimes;         // 成绩连续下滑次数
        int homeworkMissTimes;      // 作业连续未交次数
        int kpMasteryThreshold;     // 知识点掌握率阈值(%)
    }
}
