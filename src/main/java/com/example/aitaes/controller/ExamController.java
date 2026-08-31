package com.example.aitaes.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.annotation.RequireRole;
import com.example.aitaes.common.Result;
import com.example.aitaes.dto.ExamPaperCreateDTO;
import com.example.aitaes.dto.ExamResultDTO;
import com.example.aitaes.dto.GradeRequestDTO;
import com.example.aitaes.dto.GradingItemVO;
import com.example.aitaes.dto.StudentExamRecordVO;
import com.example.aitaes.dto.StudentExamResultVO;
import com.example.aitaes.dto.StudentExamVO;
import com.example.aitaes.dto.SubmitExamResultDTO;
import com.example.aitaes.entity.ExamPaper;
import com.example.aitaes.service.ExamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 考试管理控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    // ===== 教师端：试卷管理 =====

    @PostMapping("/papers")
    @RequireRole({"TEACHER"})
    public Result<ExamPaper> createPaper(@RequestAttribute("userId") Long userId,
                                          @Valid @RequestBody ExamPaperCreateDTO dto) {
        return Result.success("试卷创建成功", examService.createPaper(userId, dto));
    }

    @GetMapping("/papers")
    @RequireRole({"TEACHER", "ASSISTANT"})
    public Result<IPage<ExamPaper>> listPapers(
            @RequestAttribute("userId") Long userId,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) Long courseId) {
        return Result.success(examService.listPapers(pageNum, pageSize, courseId, userId));
    }

    @GetMapping("/papers/{id}")
    @RequireRole({"TEACHER", "ASSISTANT"})
    public Result<ExamPaper> getPaper(@PathVariable Long id) {
        return Result.success(examService.getPaperById(id));
    }

    @PutMapping("/papers/{id}")
    @RequireRole({"TEACHER"})
    public Result<ExamPaper> updatePaper(@PathVariable Long id,
                                          @RequestBody ExamPaperCreateDTO dto) {
        return Result.success("试卷更新成功", examService.updatePaper(id, dto));
    }

    @DeleteMapping("/papers/{id}")
    @RequireRole({"TEACHER"})
    public Result<Void> deletePaper(@PathVariable Long id) {
        examService.deletePaper(id);
        return Result.success("试卷已删除", null);
    }

    @PutMapping("/papers/{id}/publish")
    @RequireRole({"TEACHER"})
    public Result<Void> publishPaper(@PathVariable Long id) {
        examService.publishPaper(id);
        return Result.success("考试已发布", null);
    }

    @PutMapping("/papers/{id}/close")
    @RequireRole({"TEACHER"})
    public Result<Void> closePaper(@PathVariable Long id) {
        examService.closePaper(id);
        return Result.success("考试已结束", null);
    }

    // ===== 教师端：考试结果 =====

    @GetMapping("/papers/{id}/results")
    @RequireRole({"TEACHER", "ASSISTANT"})
    public Result<ExamResultDTO> getResults(@PathVariable Long id) {
        return Result.success(examService.getExamResults(id));
    }

    // ===== 教师端：主观题批阅 =====

    @GetMapping("/grading/list")
    @RequireRole({"TEACHER", "ASSISTANT"})
    public Result<List<GradingItemVO>> gradingList(@RequestParam Long courseId,
                                                    @RequestParam(required = false) Long paperId) {
        return Result.success(examService.getGradingList(courseId, paperId));
    }

    @PutMapping("/grading/{answerId}")
    @RequireRole({"TEACHER", "ASSISTANT"})
    public Result<Void> submitGrade(@PathVariable Long answerId,
                                     @RequestAttribute("userId") Long userId,
                                     @Valid @RequestBody GradeRequestDTO dto) {
        examService.submitGrade(answerId, userId, dto.getScore(), dto.getComment());
        return Result.success("批阅完成", null);
    }

    // ===== 学生端：在线考试 =====

    @GetMapping("/student/pending")
    @RequireRole({"STUDENT"})
    public Result<List<ExamPaper>> pendingExams(@RequestAttribute("userId") Long userId) {
        return Result.success(examService.getPendingExams(userId));
    }

    @GetMapping("/student/{paperId}")
    @RequireRole({"STUDENT"})
    public Result<StudentExamVO> getStudentExam(@PathVariable Long paperId,
                                                 @RequestAttribute("userId") Long userId) {
        return Result.success(examService.getExamForStudent(paperId, userId));
    }

    @PostMapping("/student/{paperId}/submit")
    @RequireRole({"STUDENT"})
    public Result<SubmitExamResultDTO> submitExam(@PathVariable Long paperId,
                                                  @RequestAttribute("userId") Long userId,
                                                  @RequestBody Map<Long, String> answers) {
        return Result.success("交卷成功", examService.submitExam(paperId, userId, answers));
    }

    @GetMapping("/student/records")
    @RequireRole({"STUDENT"})
    public Result<List<StudentExamRecordVO>> myExamRecords(@RequestAttribute("userId") Long userId) {
        return Result.success(examService.getMyExamRecords(userId));
    }

    @GetMapping("/student/records/{paperId}")
    @RequireRole({"STUDENT"})
    public Result<StudentExamResultVO> myExamResult(@PathVariable Long paperId,
                                                    @RequestAttribute("userId") Long userId) {
        return Result.success(examService.getMyExamResult(paperId, userId));
    }
}
