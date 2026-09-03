package com.example.aitaes.controller;

import com.example.aitaes.annotation.RequireRole;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.Result;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.dto.*;
import com.example.aitaes.entity.Assessment;
import com.example.aitaes.entity.AssessmentRecord;
import com.example.aitaes.entity.Attendance;
import com.example.aitaes.entity.Student;
import com.example.aitaes.entity.Course;
import com.example.aitaes.entity.CourseStudent;
import com.example.aitaes.entity.Teacher;
import com.example.aitaes.entity.StudentWrongQuestion;
import com.example.aitaes.mapper.*;
import com.example.aitaes.service.PortraitService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 学生端控制器 (UC19+UC20+UC21+UC22)
 */
@Slf4j
@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@RequireRole("STUDENT")
public class StudentController {

    private final AssessmentRecordMapper assessmentRecordMapper;
    private final AssessmentMapper assessmentMapper;
    private final AttendanceMapper attendanceMapper;
    private final CourseStudentMapper courseStudentMapper;
    private final StudentWrongQuestionMapper wrongQuestionMapper;
    private final StudentMapper studentMapper;
    private final CourseMapper courseMapper;
    private final TeacherMapper teacherMapper;
    private final PortraitService portraitService;

    private Long getStudentId(Long userId) {
        Student student = studentMapper.selectOne(
                new LambdaQueryWrapper<Student>().eq(Student::getUserId, userId));
        if (student == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "学生不存在");
        }
        return student.getId();
    }

    /**
     * 我的课程列表
     */
    @GetMapping("/courses")
    public Result<List<StudentCourseVO>> myCourses(@RequestAttribute("userId") Long userId) {
        Long studentId = getStudentId(userId);
        List<CourseStudent> courseStudents = courseStudentMapper.selectList(
                new LambdaQueryWrapper<CourseStudent>()
                        .eq(CourseStudent::getStudentId, studentId));
        if (courseStudents.isEmpty()) {
            return Result.success(Collections.emptyList());
        }
        List<Long> courseIds = courseStudents.stream()
                .map(CourseStudent::getCourseId)
                .collect(Collectors.toList());
        List<Course> courses = courseMapper.selectBatchIds(courseIds);
        Map<Long, Course> courseMap = courses.stream()
                .collect(Collectors.toMap(Course::getId, c -> c));
        Set<Long> teacherIds = courses.stream()
                .map(Course::getTeacherId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> teacherNameMap = Collections.emptyMap();
        if (!teacherIds.isEmpty()) {
            List<Teacher> teachers = teacherMapper.selectBatchIds(teacherIds);
            teacherNameMap = teachers.stream()
                    .collect(Collectors.toMap(Teacher::getId, Teacher::getName, (a, b) -> a));
        }
        List<StudentCourseVO> result = new ArrayList<>();
        for (CourseStudent cs : courseStudents) {
            Course c = courseMap.get(cs.getCourseId());
            if (c == null) continue;
            result.add(StudentCourseVO.builder()
                    .id(c.getId())
                    .courseNo(c.getCourseNo())
                    .courseName(c.getCourseName())
                    .className(cs.getClassName())
                    .teacherName(teacherNameMap.getOrDefault(c.getTeacherId(), ""))
                    .semester(c.getSemester())
                    .credit(c.getCredit())
                    .courseType(c.getCourseType())
                    .build());
        }
        return Result.success(result);
    }

    /**
     * 个人学习中心概览 (UC19)
     */
    @GetMapping("/overview")
    public Result<Map<String, Object>> overview(@RequestAttribute("userId") Long userId,
                                                 @RequestParam Long courseId) {
        Long studentId = getStudentId(userId);
        Map<String, Object> data = new HashMap<>();

        // 当前成绩 - 最近一次考核
        Assessment latest = assessmentMapper.selectOne(
                new LambdaQueryWrapper<Assessment>()
                        .eq(Assessment::getCourseId, courseId)
                        .orderByDesc(Assessment::getAssessmentDate)
                        .last("LIMIT 1"));
        BigDecimal currentScore = BigDecimal.ZERO;
        if (latest != null) {
            AssessmentRecord record = assessmentRecordMapper.selectOne(
                    new LambdaQueryWrapper<AssessmentRecord>()
                            .eq(AssessmentRecord::getAssessmentId, latest.getId())
                            .eq(AssessmentRecord::getStudentId, studentId));
            currentScore = record != null && record.getTotalScore() != null
                    ? record.getTotalScore() : BigDecimal.ZERO;
        }
        data.put("currentScore", currentScore);

        // 出勤率
        Long totalAtt = attendanceMapper.selectCount(
                new LambdaQueryWrapper<Attendance>()
                        .eq(Attendance::getCourseId, courseId)
                        .eq(Attendance::getStudentId, studentId));
        Long presentAtt = attendanceMapper.selectCount(
                new LambdaQueryWrapper<Attendance>()
                        .eq(Attendance::getCourseId, courseId)
                        .eq(Attendance::getStudentId, studentId)
                        .in(Attendance::getStatus, List.of("出勤", "PRESENT")));
        data.put("attendanceRate", totalAtt > 0
                ? new BigDecimal(presentAtt).divide(new BigDecimal(totalAtt), 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal(100)).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO);

        // 作业提交率
        data.put("homeworkRate", BigDecimal.valueOf(100));

        // 待完成考试
        data.put("pendingExams", 0);

        return Result.success(data);
    }

    /**
     * 个人画像 (UC20)
     */
    @GetMapping("/portrait")
    public Result<StudentProfileVO> portrait(@RequestAttribute("userId") Long userId,
                                              @RequestParam Long courseId) {
        Long studentId = getStudentId(userId);
        return Result.success(portraitService.getProfile(studentId, courseId));
    }

    /**
     * 成绩趋势 (UC21)
     */
    @GetMapping("/trends")
    public Result<List<ScoreTrendItem>> trends(@RequestAttribute("userId") Long userId,
                                               @RequestParam Long courseId) {
        Long studentId = getStudentId(userId);
        List<Assessment> assessments = assessmentMapper.selectList(
                new LambdaQueryWrapper<Assessment>()
                        .eq(Assessment::getCourseId, courseId)
                        .orderByAsc(Assessment::getAssessmentDate));

        List<ScoreTrendItem> trends = new ArrayList<>();
        for (Assessment a : assessments) {
            AssessmentRecord myRecord = assessmentRecordMapper.selectOne(
                    new LambdaQueryWrapper<AssessmentRecord>()
                            .eq(AssessmentRecord::getAssessmentId, a.getId())
                            .eq(AssessmentRecord::getStudentId, studentId));
            BigDecimal myScore = myRecord != null && myRecord.getTotalScore() != null
                    ? myRecord.getTotalScore() : BigDecimal.ZERO;

            List<AssessmentRecord> allRecords = assessmentRecordMapper.selectList(
                    new LambdaQueryWrapper<AssessmentRecord>()
                            .eq(AssessmentRecord::getAssessmentId, a.getId()));
            BigDecimal classAvg = BigDecimal.ZERO;
            if (!allRecords.isEmpty()) {
                BigDecimal sum = allRecords.stream()
                        .filter(r -> r.getTotalScore() != null)
                        .map(AssessmentRecord::getTotalScore)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                long count = allRecords.stream().filter(r -> r.getTotalScore() != null).count();
                classAvg = count > 0 ? sum.divide(new BigDecimal(count), 1, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            }

            trends.add(ScoreTrendItem.builder()
                    .name(a.getAssessmentName())
                    .score(myScore)
                    .classAvg(classAvg)
                    .build());
        }
        return Result.success(trends);
    }

    /**
     * 错题本列表 (UC22)
     */
    @GetMapping("/wrong-questions")
    public Result<List<StudentWrongQuestion>> wrongQuestions(@RequestAttribute("userId") Long userId,
                                                               @RequestParam Long courseId) {
        Long studentId = getStudentId(userId);
        List<StudentWrongQuestion> list = wrongQuestionMapper.selectList(
                new LambdaQueryWrapper<StudentWrongQuestion>()
                        .eq(StudentWrongQuestion::getStudentId, studentId)
                        .eq(StudentWrongQuestion::getCourseId, courseId)
                        .orderByDesc(StudentWrongQuestion::getCreateTime));
        return Result.success(list);
    }

    /**
     * 错题详情
     */
    @GetMapping("/wrong-questions/{id}")
    public Result<StudentWrongQuestion> wrongQuestionDetail(@PathVariable Long id) {
        StudentWrongQuestion q = wrongQuestionMapper.selectById(id);
        return Result.success(q);
    }

    /**
     * 生成AI学习建议
     */
    @PostMapping("/ai-suggestions")
    public Result<String> generateAiSuggestions(@RequestAttribute("userId") Long userId,
                                                 @RequestParam Long courseId) {
        Long studentId = getStudentId(userId);
        return Result.success("AI学习建议生成成功",
                portraitService.generateAiSuggestions(studentId, courseId));
    }
}
