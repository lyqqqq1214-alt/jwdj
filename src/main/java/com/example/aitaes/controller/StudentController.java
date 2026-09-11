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
import com.example.aitaes.entity.WarningRecord;
import com.example.aitaes.mapper.*;
import com.example.aitaes.service.PortraitService;
import com.example.aitaes.service.WrongQuestionService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
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

    private static final String PERSONAL_WRONG_BOOK_COURSE_NO = "WRONG-BOOK-TEST";

    private final AssessmentRecordMapper assessmentRecordMapper;
    private final AssessmentMapper assessmentMapper;
    private final AttendanceMapper attendanceMapper;
    private final CourseStudentMapper courseStudentMapper;
    private final StudentWrongQuestionMapper wrongQuestionMapper;
    private final StudentMapper studentMapper;
    private final CourseMapper courseMapper;
    private final TeacherMapper teacherMapper;
    private final WarningRecordMapper warningRecordMapper;
    private final PortraitService portraitService;
    private final WrongQuestionService wrongQuestionService;
    private final ObjectMapper objectMapper;

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

    /** 学生只查看自己、当前课程内尚未解除的真实预警记录。 */
    @GetMapping("/warnings")
    public Result<List<WarningRecord>> warnings(@RequestAttribute("userId") Long userId,
                                                @RequestParam Long courseId) {
        Long studentId = getStudentId(userId);
        Long enrolled = courseStudentMapper.selectCount(new LambdaQueryWrapper<CourseStudent>()
                .eq(CourseStudent::getStudentId, studentId)
                .eq(CourseStudent::getCourseId, courseId));
        if (enrolled == 0) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "无权查看该课程预警");
        }
        List<WarningRecord> records = warningRecordMapper.selectList(
                new LambdaQueryWrapper<WarningRecord>()
                        .eq(WarningRecord::getStudentId, studentId)
                        .eq(WarningRecord::getCourseId, courseId)
                        .eq(WarningRecord::getIsResolved, 0)
                        .orderByDesc(WarningRecord::getCreateTime));
        return Result.success(records);
    }

    /**
     * 错题本列表 (UC22)
     */
    @GetMapping("/wrong-questions")
    public Result<List<StudentWrongQuestion>> wrongQuestions(@RequestAttribute("userId") Long userId,
                                                               @RequestParam(required = false) Long courseId) {
        Long studentId = getStudentId(userId);
        LambdaQueryWrapper<StudentWrongQuestion> query = new LambdaQueryWrapper<StudentWrongQuestion>()
                .eq(StudentWrongQuestion::getStudentId, studentId);
        if (courseId != null) query.eq(StudentWrongQuestion::getCourseId, courseId);
        List<StudentWrongQuestion> list = wrongQuestionMapper.selectList(query.orderByDesc(StudentWrongQuestion::getCreateTime));
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

    /** 手动录入一条错题，便于学生补充练习和使用 AI 分析。 */
    @PostMapping("/wrong-questions")
    public Result<StudentWrongQuestion> createWrongQuestion(@RequestAttribute("userId") Long userId,
                                                              @RequestBody ManualWrongQuestionRequest request) {
        Long studentId = getStudentId(userId);
        if (request == null || !org.springframework.util.StringUtils.hasText(request.getQuestion())
                || !org.springframework.util.StringUtils.hasText(request.getCorrectAnswer())
                || !org.springframework.util.StringUtils.hasText(request.getStudentAnswer())
                || !org.springframework.util.StringUtils.hasText(request.getKnowledgePoints())) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "课程、题目、答案和知识点不能为空");
        }
        Long courseId = resolveManualWrongQuestionCourse(studentId, request.getCourseId());
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("stem", request.getQuestion().trim());
        snapshot.put("options", parseOptions(request.getOptions()));
        try {
            StudentWrongQuestion wrongQuestion = new StudentWrongQuestion();
            wrongQuestion.setStudentId(studentId);
            wrongQuestion.setCourseId(courseId);
            wrongQuestion.setQuestionContent(objectMapper.writeValueAsString(snapshot));
            wrongQuestion.setStudentAnswer(request.getStudentAnswer().trim());
            wrongQuestion.setCorrectAnswer(request.getCorrectAnswer().trim());
            wrongQuestion.setKnowledgePoints(request.getKnowledgePoints().trim());
            wrongQuestion.setAnalysis(request.getRemark());
            wrongQuestion.setWrongCount(1);
            wrongQuestion.setSource("AI_GENERATE".equals(request.getSource()) ? "AI_GENERATE" : "MANUAL");
            wrongQuestion.setCreateTime(LocalDateTime.now());
            wrongQuestion.setUpdateTime(LocalDateTime.now());
            wrongQuestionMapper.insert(wrongQuestion);
            return Result.success("错题添加成功", wrongQuestion);
        } catch (JsonProcessingException ex) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "错题选项格式错误");
        }
    }

    private Map<String, String> parseOptions(String rawOptions) {
        Map<String, String> options = new LinkedHashMap<>();
        if (!org.springframework.util.StringUtils.hasText(rawOptions)) return options;
        String[] lines = rawOptions.split("\\r?\\n");
        for (int i = 0; i < lines.length; i++) {
            String option = lines[i].trim().replaceFirst("^[A-Za-z][.、:：]\\s*", "");
            if (org.springframework.util.StringUtils.hasText(option)) {
                options.put(String.valueOf((char) ('A' + options.size())), option);
            }
        }
        return options;
    }

    private Long resolveManualWrongQuestionCourse(Long studentId, Long requestedCourseId) {
        if (requestedCourseId != null) {
            Long enrollmentCount = courseStudentMapper.selectCount(new LambdaQueryWrapper<CourseStudent>()
                    .eq(CourseStudent::getStudentId, studentId)
                    .eq(CourseStudent::getCourseId, requestedCourseId));
            if (enrollmentCount == 0) {
                throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "不能向未选课程添加错题");
            }
            return requestedCourseId;
        }
        Course testCourse = courseMapper.selectOne(new LambdaQueryWrapper<Course>()
                .eq(Course::getCourseNo, PERSONAL_WRONG_BOOK_COURSE_NO));
        if (testCourse == null) {
            testCourse = new Course();
            testCourse.setCourseNo(PERSONAL_WRONG_BOOK_COURSE_NO);
            testCourse.setCourseName("个人错题本（测试）");
            testCourse.setClassName("个人练习");
            testCourse.setCredit(BigDecimal.ZERO);
            testCourse.setCourseType("TEST");
            testCourse.setSemester("TEST");
            testCourse.setDescription("未关联课程时用于错题本和 AI 功能测试的系统课程");
            courseMapper.insert(testCourse);
        }
        return testCourse.getId();
    }

    /** 调用大模型生成错因分析，并保存到错题本。 */
    @PostMapping("/wrong-questions/{id}/analysis")
    public Result<String> analyzeWrongQuestion(@RequestAttribute("userId") Long userId,
                                                @PathVariable Long id) {
        return Result.success("错因分析生成成功", wrongQuestionService.analyzeWrongAnswer(userId, id));
    }

    /** 基于该错题的知识点生成同类巩固练习。 */
    @PostMapping("/wrong-questions/{id}/similar-questions")
    public Result<List<AiGeneratedQuestionDTO>> similarQuestions(@RequestAttribute("userId") Long userId,
                                                                   @PathVariable Long id,
                                                                   @RequestParam(defaultValue = "3") int count,
                                                                   @RequestParam(defaultValue = "MEDIUM") String difficulty) {
        if (count < 1 || count > 10) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "题目数量应在1到10之间");
        }
        return Result.success(wrongQuestionService.generateSimilarQuestions(userId, id, count, difficulty));
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
