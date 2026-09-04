package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.dto.*;
import com.example.aitaes.entity.*;
import com.example.aitaes.mapper.*;
import com.example.aitaes.common.AttendanceStatus;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 教学驾驶舱服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final CourseStudentMapper courseStudentMapper;
    private final AssessmentMapper assessmentMapper;
    private final AssessmentRecordMapper assessmentRecordMapper;
    private final AttendanceMapper attendanceMapper;
    private final StudentKpMasteryMapper studentKpMasteryMapper;
    private final WarningRecordMapper warningRecordMapper;
    private final CourseMapper courseMapper;
    private final StudentMapper studentMapper;
    private final TeacherMapper teacherMapper;
    private final TeachingAssistantMapper teachingAssistantMapper;
    private final UserMapper userMapper;
    private final ExperimentMapper experimentMapper;

    @Override
    public DashboardOverviewDTO getOverview(Long courseId) {
        // 班级人数
        Long studentCount = courseStudentMapper.selectCount(
                new LambdaQueryWrapper<CourseStudent>()
                        .eq(CourseStudent::getCourseId, courseId));

        // 最近一次考核平均分
        List<Assessment> assessments = assessmentMapper.selectList(
                new LambdaQueryWrapper<Assessment>()
                        .eq(Assessment::getCourseId, courseId)
                        .orderByDesc(Assessment::getAssessmentDate));
        BigDecimal avgScore = BigDecimal.ZERO;
        if (!assessments.isEmpty()) {
            Assessment latest = assessments.get(0);
            List<AssessmentRecord> records = assessmentRecordMapper.selectList(
                    new LambdaQueryWrapper<AssessmentRecord>()
                            .eq(AssessmentRecord::getAssessmentId, latest.getId()));
            avgScore = records.stream()
                    .map(r -> r.getTotalScore() != null ? r.getTotalScore() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (!records.isEmpty()) {
                avgScore = avgScore.divide(new BigDecimal(records.size()), 2, RoundingMode.HALF_UP);
            }
        }

        // 出勤率
        Long totalAtt = attendanceMapper.selectCount(
                new LambdaQueryWrapper<Attendance>()
                        .eq(Attendance::getCourseId, courseId));
        Long presentAtt = attendanceMapper.selectCount(
                new LambdaQueryWrapper<Attendance>()
                        .eq(Attendance::getCourseId, courseId)
                        .in(Attendance::getStatus, List.of("出勤", "PRESENT")));
        BigDecimal attRate = totalAtt > 0
                ? new BigDecimal(presentAtt).divide(new BigDecimal(totalAtt), 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal(100)).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // 作业提交率
        LambdaQueryWrapper<AssessmentRecord> hwWrapper = new LambdaQueryWrapper<AssessmentRecord>()
                .inSql(AssessmentRecord::getAssessmentId,
                        "SELECT id FROM t_assessment WHERE course_id = " + courseId
                                + " AND assessment_type = 'HOMEWORK'");
        Long totalHw = assessmentRecordMapper.selectCount(hwWrapper);
        LambdaQueryWrapper<AssessmentRecord> onTimeWrapper = new LambdaQueryWrapper<AssessmentRecord>()
                .inSql(AssessmentRecord::getAssessmentId,
                        "SELECT id FROM t_assessment WHERE course_id = " + courseId
                                + " AND assessment_type = 'HOMEWORK'")
                .eq(AssessmentRecord::getSubmitStatus, "ON_TIME");
        Long onTimeHw = assessmentRecordMapper.selectCount(onTimeWrapper);
        BigDecimal hwRate = totalHw > 0
                ? new BigDecimal(onTimeHw).divide(new BigDecimal(totalHw), 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal(100)).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // 预警人数
        Long warningCount = warningRecordMapper.selectCount(
                new LambdaQueryWrapper<WarningRecord>()
                        .eq(WarningRecord::getCourseId, courseId)
                        .eq(WarningRecord::getIsResolved, 0));

        return DashboardOverviewDTO.builder()
                .studentCount(studentCount.intValue())
                .averageScore(avgScore)
                .attendanceRate(attRate)
                .homeworkRate(hwRate)
                .warningCount(warningCount.intValue())
                .build();
    }

    @Override
    public DashboardChartsDTO getCharts(Long courseId) {
        return DashboardChartsDTO.builder()
                .scoreDistribution(getScoreDistribution(courseId))
                .scoreTrend(getScoreTrend(courseId))
                .attendanceStats(getAttendanceStats(courseId))
                .homeworkStats(getHomeworkStats(courseId))
                .knowledgeRadar(getKnowledgeRadar(courseId))
                .experimentStats(getExperimentStats(courseId))
                .build();
    }

    @Override
    public List<WarningStudentDTO> getWarnings(Long courseId) {
        List<WarningRecord> warnings = warningRecordMapper.selectList(
                new LambdaQueryWrapper<WarningRecord>()
                        .eq(WarningRecord::getCourseId, courseId)
                        .eq(WarningRecord::getIsResolved, 0)
                        .orderByDesc(WarningRecord::getCreateTime));

        if (warnings.isEmpty()) return Collections.emptyList();

        List<Long> studentIds = warnings.stream()
                .map(WarningRecord::getStudentId).distinct().collect(Collectors.toList());
        Map<Long, Student> studentMap = studentMapper.selectBatchIds(studentIds).stream()
                .collect(Collectors.toMap(Student::getId, s -> s));

        return warnings.stream().map(w -> {
            Student s = studentMap.get(w.getStudentId());
            return WarningStudentDTO.builder()
                    .studentId(w.getStudentId())
                    .studentNo(s != null ? s.getStudentNo() : null)
                    .name(s != null ? s.getName() : null)
                    .courseId(w.getCourseId())
                    .warningType(w.getWarningType())
                    .severity(w.getSeverity())
                    .warningMsg(w.getWarningMsg())
                    .createTime(w.getCreateTime())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public List<ClassVO> getMyCourses(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "用户不存在");
        }

        Long teacherId;
        if ("TEACHER".equals(user.getRole())) {
            Teacher teacher = teacherMapper.selectOne(
                    new LambdaQueryWrapper<Teacher>().eq(Teacher::getUserId, userId));
            if (teacher == null) {
                throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "教师不存在");
            }
            teacherId = teacher.getId();
        } else if ("ASSISTANT".equals(user.getRole())) {
            TeachingAssistant ta = teachingAssistantMapper.selectOne(
                    new LambdaQueryWrapper<TeachingAssistant>().eq(TeachingAssistant::getUserId, userId));
            if (ta == null) {
                throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "助教不存在");
            }
            teacherId = ta.getTeacherId();
        } else {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "角色不支持");
        }

        List<Course> courses = courseMapper.selectList(
                new LambdaQueryWrapper<Course>()
                        .eq(Course::getTeacherId, teacherId)
                        .orderByDesc(Course::getCreateTime));
        if (courses.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> courseIds = courses.stream().map(Course::getId).collect(Collectors.toList());

        // 课程-学生关联：同时统计人数与授课班级名（t_course_student.class_name）
        List<CourseStudent> allCourseStudents = courseStudentMapper.selectList(
                new LambdaQueryWrapper<CourseStudent>().in(CourseStudent::getCourseId, courseIds));
        Map<Long, Long> studentCountMap = allCourseStudents.stream()
                .collect(Collectors.groupingBy(CourseStudent::getCourseId, Collectors.counting()));
        Map<Long, List<String>> classNamesByCourse = allCourseStudents.stream()
                .filter(cs -> cs.getClassName() != null && !cs.getClassName().isBlank())
                .collect(Collectors.groupingBy(CourseStudent::getCourseId,
                        Collectors.mapping(CourseStudent::getClassName,
                                Collectors.collectingAndThen(Collectors.toSet(),
                                        set -> set.stream().sorted().collect(Collectors.toList())))));

        Map<Long, BigDecimal> avgScoreMap = new HashMap<>();
        List<Assessment> allAssessments = assessmentMapper.selectList(
                new LambdaQueryWrapper<Assessment>().in(Assessment::getCourseId, courseIds)
                        .orderByDesc(Assessment::getAssessmentDate));
        Map<Long, List<Assessment>> assessmentByCourse = allAssessments.stream()
                .collect(Collectors.groupingBy(Assessment::getCourseId));
        List<Long> latestAssessmentIds = new ArrayList<>();
        for (Map.Entry<Long, List<Assessment>> entry : assessmentByCourse.entrySet()) {
            if (!entry.getValue().isEmpty()) {
                latestAssessmentIds.add(entry.getValue().get(0).getId());
            }
        }
        if (!latestAssessmentIds.isEmpty()) {
            List<AssessmentRecord> latestRecords = assessmentRecordMapper.selectList(
                    new LambdaQueryWrapper<AssessmentRecord>().in(AssessmentRecord::getAssessmentId, latestAssessmentIds));
            Map<Long, List<AssessmentRecord>> recordsByAssessment = latestRecords.stream()
                    .collect(Collectors.groupingBy(AssessmentRecord::getAssessmentId));
            Map<Long, Long> assessmentToCourse = allAssessments.stream()
                    .collect(Collectors.toMap(Assessment::getId, Assessment::getCourseId));
            for (Long asmId : latestAssessmentIds) {
                Long courseId = assessmentToCourse.get(asmId);
                List<AssessmentRecord> recs = recordsByAssessment.getOrDefault(asmId, Collections.emptyList());
                BigDecimal avg = recs.isEmpty() ? BigDecimal.ZERO :
                        recs.stream().map(r -> r.getTotalScore() != null ? r.getTotalScore() : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add)
                                .divide(new BigDecimal(recs.size()), 2, RoundingMode.HALF_UP);
                avgScoreMap.put(courseId, avg);
            }
        }

        Map<Long, BigDecimal> attendanceRateMap = new HashMap<>();
        List<Attendance> allAttendances = attendanceMapper.selectList(
                new LambdaQueryWrapper<Attendance>().in(Attendance::getCourseId, courseIds));
        Map<Long, List<Attendance>> attByCourse = allAttendances.stream()
                .collect(Collectors.groupingBy(Attendance::getCourseId));
        for (Map.Entry<Long, List<Attendance>> entry : attByCourse.entrySet()) {
            List<Attendance> atts = entry.getValue();
            long total = atts.size();
            long present = atts.stream().filter(a -> "出勤".equals(a.getStatus()) || "PRESENT".equalsIgnoreCase(a.getStatus())).count();
            BigDecimal rate = total > 0
                    ? new BigDecimal(present).divide(new BigDecimal(total), 4, RoundingMode.HALF_UP)
                            .multiply(new BigDecimal(100)).setScale(1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            attendanceRateMap.put(entry.getKey(), rate);
        }

        Map<Long, BigDecimal> homeworkRateMap = new HashMap<>();
        List<Assessment> hwAssessments = assessmentMapper.selectList(
                new LambdaQueryWrapper<Assessment>()
                        .in(Assessment::getCourseId, courseIds)
                        .eq(Assessment::getAssessmentType, "HOMEWORK"));
        List<Long> hwIds = hwAssessments.stream().map(Assessment::getId).collect(Collectors.toList());
        Map<Long, Long> hwCourseMap = hwAssessments.stream()
                .collect(Collectors.toMap(Assessment::getId, Assessment::getCourseId));
        if (!hwIds.isEmpty()) {
            List<AssessmentRecord> hwRecords = assessmentRecordMapper.selectList(
                    new LambdaQueryWrapper<AssessmentRecord>().in(AssessmentRecord::getAssessmentId, hwIds));
            Map<Long, List<AssessmentRecord>> hwRecByCourse = new HashMap<>();
            for (AssessmentRecord rec : hwRecords) {
                Long courseId = hwCourseMap.get(rec.getAssessmentId());
                if (courseId != null) {
                    hwRecByCourse.computeIfAbsent(courseId, k -> new ArrayList<>()).add(rec);
                }
            }
            for (Map.Entry<Long, List<AssessmentRecord>> entry : hwRecByCourse.entrySet()) {
                List<AssessmentRecord> recs = entry.getValue();
                long total = recs.size();
                long onTime = recs.stream().filter(r -> "ON_TIME".equals(r.getSubmitStatus())).count();
                BigDecimal rate = total > 0
                        ? new BigDecimal(onTime).divide(new BigDecimal(total), 4, RoundingMode.HALF_UP)
                                .multiply(new BigDecimal(100)).setScale(1, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;
                homeworkRateMap.put(entry.getKey(), rate);
            }
        }

        return courses.stream().map(c -> ClassVO.builder()
                .id(c.getId())
                .courseNo(c.getCourseNo())
                .courseName(c.getCourseName())
                .className(resolveClassName(c, classNamesByCourse.get(c.getId())))
                .semester(c.getSemester())
                .credit(c.getCredit())
                .courseType(c.getCourseType())
                .studentCount(studentCountMap.getOrDefault(c.getId(), 0L).intValue())
                .avgScore(avgScoreMap.getOrDefault(c.getId(), BigDecimal.ZERO))
                .attendanceRate(attendanceRateMap.getOrDefault(c.getId(), BigDecimal.ZERO))
                .homeworkRate(homeworkRateMap.getOrDefault(c.getId(), BigDecimal.ZERO))
                .build()).collect(Collectors.toList());
    }

    /**
     * 解析课程卡片的班级名：
     * 优先取选课记录中的班级（t_course_student.class_name，去重排序），
     * 多个班级显示「首个班名 等N个班」；无选课时回退到课程表自身 class_name；
     * 均为空则返回 null（前端兜底显示"未分班"）。
     */
    private String resolveClassName(Course course, List<String> classNames) {
        if (classNames != null && !classNames.isEmpty()) {
            if (classNames.size() == 1) {
                return classNames.get(0);
            }
            return classNames.get(0) + " 等" + classNames.size() + "个班";
        }
        String own = course.getClassName();
        return (own != null && !own.isBlank()) ? own : null;
    }

    // ===== 图表数据 =====

    private List<ChartItem> getScoreDistribution(Long courseId) {
        List<Assessment> assessments = assessmentMapper.selectList(
                new LambdaQueryWrapper<Assessment>()
                        .eq(Assessment::getCourseId, courseId)
                        .orderByDesc(Assessment::getAssessmentDate));
        if (assessments.isEmpty()) return Collections.emptyList();

        Assessment latest = assessments.get(0);
        List<AssessmentRecord> records = assessmentRecordMapper.selectList(
                new LambdaQueryWrapper<AssessmentRecord>()
                        .eq(AssessmentRecord::getAssessmentId, latest.getId()));

        int[] ranges = {0, 60, 70, 80, 90, 101};
        String[] labels = {"0-59", "60-69", "70-79", "80-89", "90-100"};
        int[] counts = new int[5];

        for (AssessmentRecord r : records) {
            if (r.getTotalScore() == null) continue;
            int score = r.getTotalScore().intValue();
            for (int i = 0; i < 5; i++) {
                if (score >= ranges[i] && score < ranges[i + 1]) {
                    counts[i]++;
                    break;
                }
            }
        }

        List<ChartItem> items = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            items.add(ChartItem.builder()
                    .name(labels[i]).value(new BigDecimal(counts[i])).build());
        }
        return items;
    }

    private List<ChartItem> getScoreTrend(Long courseId) {
        List<Assessment> assessments = assessmentMapper.selectList(
                new LambdaQueryWrapper<Assessment>()
                        .eq(Assessment::getCourseId, courseId)
                        .in(Assessment::getAssessmentType, "HOMEWORK", "QUIZ", "EXAM_SCORE")
                        .orderByAsc(Assessment::getAssessmentDate));

        return assessments.stream().map(a -> {
            List<AssessmentRecord> records = assessmentRecordMapper.selectList(
                    new LambdaQueryWrapper<AssessmentRecord>()
                            .eq(AssessmentRecord::getAssessmentId, a.getId()));
            BigDecimal avg = records.isEmpty() ? BigDecimal.ZERO
                    : records.stream().map(r -> r.getTotalScore() != null ? r.getTotalScore() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add)
                            .divide(new BigDecimal(records.size()), 2, RoundingMode.HALF_UP);
            return ChartItem.builder().name(a.getAssessmentName()).value(avg).build();
        }).collect(Collectors.toList());
    }

    private List<ChartItem> getAttendanceStats(Long courseId) {
        List<Attendance> records = attendanceMapper.selectList(
                new LambdaQueryWrapper<Attendance>()
                        .eq(Attendance::getCourseId, courseId));
        Map<String, Long> grouped = records.stream()
                .collect(Collectors.groupingBy(
                        a -> AttendanceStatus.normalize(a.getStatus()),
                        Collectors.counting()));

        return Arrays.asList(
                ChartItem.builder().name("出勤").value(new BigDecimal(grouped.getOrDefault("出勤", 0L))).color("#67C23A").build(),
                ChartItem.builder().name("迟到").value(new BigDecimal(grouped.getOrDefault("迟到", 0L))).color("#E6A23C").build(),
                ChartItem.builder().name("请假").value(new BigDecimal(grouped.getOrDefault("请假", 0L))).color("#909399").build(),
                ChartItem.builder().name("缺勤").value(new BigDecimal(grouped.getOrDefault("缺勤", 0L))).color("#F56C6C").build()
        );
    }

    private List<HomeworkSubmitStat> getHomeworkStats(Long courseId) {
        List<Assessment> hwAssessments = assessmentMapper.selectList(
                new LambdaQueryWrapper<Assessment>()
                        .eq(Assessment::getCourseId, courseId)
                        .eq(Assessment::getAssessmentType, "HOMEWORK")
                        .orderByAsc(Assessment::getAssessmentNo));

        return hwAssessments.stream().map(hw -> {
            List<AssessmentRecord> records = assessmentRecordMapper.selectList(
                    new LambdaQueryWrapper<AssessmentRecord>()
                            .eq(AssessmentRecord::getAssessmentId, hw.getId()));
            long onTime = records.stream().filter(r -> "ON_TIME".equals(r.getSubmitStatus())).count();
            long late = records.stream().filter(r -> "LATE".equals(r.getSubmitStatus())).count();
            long absent = records.stream().filter(r -> "ABSENT".equals(r.getSubmitStatus())).count();
            return HomeworkSubmitStat.builder()
                    .homeworkName(hw.getAssessmentName())
                    .onTimeCount((int) onTime).lateCount((int) late).absentCount((int) absent)
                    .build();
        }).collect(Collectors.toList());
    }

    private List<ChartItem> getKnowledgeRadar(Long courseId) {
        List<StudentKpMastery> masteryList = studentKpMasteryMapper.selectList(
                new LambdaQueryWrapper<StudentKpMastery>()
                        .eq(StudentKpMastery::getCourseId, courseId));

        Map<String, List<StudentKpMastery>> grouped = masteryList.stream()
                .collect(Collectors.groupingBy(StudentKpMastery::getKpName));

        return grouped.entrySet().stream().map(e -> {
            BigDecimal avg = e.getValue().stream()
                    .map(m -> m.getMasteryRate() != null ? m.getMasteryRate() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(new BigDecimal(e.getValue().size()), 2, RoundingMode.HALF_UP);
            return ChartItem.builder().name(e.getKey()).value(avg).build();
        }).collect(Collectors.toList());
    }

    private List<ExperimentStat> getExperimentStats(Long courseId) {
        Long studentCount = courseStudentMapper.selectCount(
                new LambdaQueryWrapper<CourseStudent>()
                        .eq(CourseStudent::getCourseId, courseId));

        List<Experiment> experiments = experimentMapper.selectList(
                new LambdaQueryWrapper<Experiment>()
                        .eq(Experiment::getCourseId, courseId)
                        .orderByAsc(Experiment::getExperimentNo));

        Map<String, List<Experiment>> grouped = experiments.stream()
                .collect(Collectors.groupingBy(e -> e.getExperimentName() + "_" + e.getExperimentNo()));

        return grouped.entrySet().stream().sorted((a, b) -> {
            int noA = a.getKey().contains("_") ? Integer.parseInt(a.getKey().split("_")[1]) : 0;
            int noB = b.getKey().contains("_") ? Integer.parseInt(b.getKey().split("_")[1]) : 0;
            return Integer.compare(noA, noB);
        }).map(entry -> {
            List<Experiment> list = entry.getValue();
            Experiment first = list.get(0);
            BigDecimal avgScore = list.isEmpty() ? BigDecimal.ZERO :
                    list.stream()
                            .map(e -> e.getScore() != null ? e.getScore() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add)
                            .divide(new BigDecimal(list.size()), 2, RoundingMode.HALF_UP);
            int submittedCount = list.size();
            int totalCount = studentCount.intValue();
            BigDecimal submitRate = totalCount > 0
                    ? new BigDecimal(submittedCount).divide(new BigDecimal(totalCount), 4, RoundingMode.HALF_UP)
                            .multiply(new BigDecimal(100)).setScale(1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            return ExperimentStat.builder()
                    .experimentName(first.getExperimentName())
                    .experimentNo(first.getExperimentNo())
                    .avgScore(avgScore)
                    .submittedCount(submittedCount)
                    .totalCount(totalCount)
                    .submitRate(submitRate)
                    .build();
        }).collect(Collectors.toList());
    }
}
