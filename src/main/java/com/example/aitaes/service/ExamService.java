package com.example.aitaes.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.dto.ExamPaperCreateDTO;
import com.example.aitaes.dto.ExamResultDTO;
import com.example.aitaes.dto.AiGradeSuggestionDTO;
import com.example.aitaes.dto.GradingItemVO;
import com.example.aitaes.dto.PaperGradingVO;
import com.example.aitaes.dto.PaperQuestionEditVO;
import com.example.aitaes.dto.StudentExamRecordVO;
import com.example.aitaes.dto.StudentExamResultVO;
import com.example.aitaes.dto.StudentExamVO;
import com.example.aitaes.dto.StudentGradeRequestDTO;
import com.example.aitaes.dto.SubmitExamResultDTO;
import com.example.aitaes.entity.ExamPaper;
import com.example.aitaes.entity.QuestionBank;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 考试服务接口
 */
public interface ExamService {

    // ===== 试卷管理 =====

    ExamPaper createPaper(Long userId, ExamPaperCreateDTO dto);
    IPage<ExamPaper> listPapers(int pageNum, int pageSize, Long courseId, Long userId);
    ExamPaper getPaperById(Long id);
    ExamPaper updatePaper(Long id, ExamPaperCreateDTO dto);
    void deletePaper(Long id);
    void publishPaper(Long id);
    void closePaper(Long id);

    // ===== 学生考试 =====

    List<ExamPaper> getPendingExams(Long userId);
    StudentExamVO getExamForStudent(Long paperId, Long userId);
    SubmitExamResultDTO submitExam(Long paperId, Long userId, Map<Long, String> answers);
    List<StudentExamRecordVO> getMyExamRecords(Long userId);
    StudentExamResultVO getMyExamResult(Long paperId, Long userId);

    // ===== 考试结果 =====

    ExamResultDTO getExamResults(Long paperId);

    // ===== 主观题批阅 =====

    List<GradingItemVO> getGradingList(Long courseId, Long paperId);
    AiGradeSuggestionDTO suggestSubjectiveGrade(Long answerId, Long graderUserId);
    void submitGrade(Long answerId, Long graderUserId, BigDecimal score, String comment);
    PaperGradingVO getPaperGrading(Long paperId, Long userId);
    BigDecimal submitStudentGrade(Long recordId, Long graderUserId, List<StudentGradeRequestDTO.GradeItem> grades);

    // ===== 试卷题目（供编辑回填） =====

    List<PaperQuestionEditVO> getPaperQuestions(Long paperId);

    // ===== AI 预留接口 =====

    default String generateWrongAnswerAnalysis(Long questionId) { return null; }
    default List<QuestionBank> generateSimilarQuestions(Long questionId, int count) { return null; }
    default String suggestScore(String questionContent, String studentAnswer) { return null; }

    // ===== AI 智能组卷 =====

    /**
     * 根据班级薄弱知识点情况自动生成个性化试卷
     *
     * @param userId       当前用户ID（教师）
     * @param courseId     课程ID
     * @param paperName    试卷名称
     * @param questionCount 题目数量
     * @return 创建好的试卷
     */
    ExamPaper aiGeneratePaper(Long userId, Long courseId, String paperName, Integer questionCount);
}
