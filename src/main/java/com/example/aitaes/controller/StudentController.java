package com.example.aitaes.controller;

import com.example.aitaes.annotation.RequireRole;
import com.example.aitaes.common.Result;
import com.example.aitaes.dto.*;
import com.example.aitaes.entity.Assessment;
import com.example.aitaes.entity.AssessmentRecord;
import com.example.aitaes.entity.Attendance;
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
    private final PortraitService portraitService;

    /**
     * 个人学习中心概览 (UC19)
     */
    @GetMapping("/overview")
    public Result<Map<String, Object>> overview(@RequestAttribute("userId") Long userId,
                                                 @RequestParam Long courseId) {
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
                            .eq(AssessmentRecord::getStudentId, userId));
            currentScore = record != null && record.getTotalScore() != null
                    ? record.getTotalScore() : BigDecimal.ZERO;
        }
        data.put("currentScore", currentScore);

        // 出勤率
        Long totalAtt = attendanceMapper.selectCount(
                new LambdaQueryWrapper<Attendance>()
                        .eq(Attendance::getCourseId, courseId)
                        .eq(Attendance::getStudentId, userId));
        Long presentAtt = attendanceMapper.selectCount(
                new LambdaQueryWrapper<Attendance>()
                        .eq(Attendance::getCourseId, courseId)
                        .eq(Attendance::getStudentId, userId)
                        .eq(Attendance::getStatus, "出勤"));
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
        return Result.success(portraitService.getProfile(userId, courseId));
    }

    /**
     * 成绩趋势 (UC21)
     */
    @GetMapping("/trends")
    public Result<List<ChartItem>> trends(@RequestAttribute("userId") Long userId,
                                           @RequestParam Long courseId) {
        List<Assessment> assessments = assessmentMapper.selectList(
                new LambdaQueryWrapper<Assessment>()
                        .eq(Assessment::getCourseId, courseId)
                        .orderByAsc(Assessment::getAssessmentDate));

        List<ChartItem> trends = new ArrayList<>();
        for (Assessment a : assessments) {
            AssessmentRecord record = assessmentRecordMapper.selectOne(
                    new LambdaQueryWrapper<AssessmentRecord>()
                            .eq(AssessmentRecord::getAssessmentId, a.getId())
                            .eq(AssessmentRecord::getStudentId, userId));
            trends.add(ChartItem.builder()
                    .name(a.getAssessmentName())
                    .value(record != null && record.getTotalScore() != null
                            ? record.getTotalScore() : BigDecimal.ZERO)
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
        List<StudentWrongQuestion> list = wrongQuestionMapper.selectList(
                new LambdaQueryWrapper<StudentWrongQuestion>()
                        .eq(StudentWrongQuestion::getStudentId, userId)
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
}
