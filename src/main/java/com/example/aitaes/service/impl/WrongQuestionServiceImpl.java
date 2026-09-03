package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.dto.AiGeneratedQuestionDTO;
import com.example.aitaes.dto.AiQuestionGenerateRequest;
import com.example.aitaes.entity.QuestionBank;
import com.example.aitaes.entity.Student;
import com.example.aitaes.entity.StudentWrongQuestion;
import com.example.aitaes.mapper.QuestionBankMapper;
import com.example.aitaes.mapper.StudentMapper;
import com.example.aitaes.mapper.StudentWrongQuestionMapper;
import com.example.aitaes.service.OllamaService;
import com.example.aitaes.service.WrongQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WrongQuestionServiceImpl implements WrongQuestionService {

    private final StudentMapper studentMapper;
    private final StudentWrongQuestionMapper wrongQuestionMapper;
    private final QuestionBankMapper questionBankMapper;
    private final OllamaService ollamaService;

    @Override
    @Transactional
    public String analyzeWrongAnswer(Long userId, Long wrongQuestionId) {
        StudentWrongQuestion wrongQuestion = ownedWrongQuestion(userId, wrongQuestionId);
        String analysis = ollamaService.generate("""
                你是一名耐心的高校助教。请分析学生的一道错题，使用中文给出：
                1. 可能的错误原因；2. 涉及知识点；3. 纠正思路；4. 一条可执行的复习建议。
                不要臆造题目中没有的信息，答案应简洁、具体。

                题目：%s
                学生答案：%s
                正确答案：%s
                知识点：%s
                """.formatted(valueOrDefault(wrongQuestion.getQuestionContent(), "未记录"),
                valueOrDefault(wrongQuestion.getStudentAnswer(), "未作答"),
                valueOrDefault(wrongQuestion.getCorrectAnswer(), "未记录"),
                valueOrDefault(wrongQuestion.getKnowledgePoints(), "未标注")));
        wrongQuestion.setAnalysis(analysis);
        wrongQuestionMapper.updateById(wrongQuestion);
        return analysis;
    }

    @Override
    public List<AiGeneratedQuestionDTO> generateSimilarQuestions(Long userId, Long wrongQuestionId,
                                                                   int count, String difficulty) {
        StudentWrongQuestion wrongQuestion = ownedWrongQuestion(userId, wrongQuestionId);
        List<String> knowledgePoints = Arrays.stream(valueOrDefault(wrongQuestion.getKnowledgePoints(), "综合复习")
                        .split("[,，、]"))
                .map(String::trim).filter(StringUtils::hasText).toList();
        QuestionBank sourceQuestion = !"ASSESSMENT".equals(wrongQuestion.getSource())
                || wrongQuestion.getSourceId() == null ? null
                : questionBankMapper.selectById(wrongQuestion.getSourceId());
        return ollamaService.generateQuestions(AiQuestionGenerateRequest.builder()
                .knowledgePoints(knowledgePoints.isEmpty() ? List.of("综合复习") : knowledgePoints)
                .questionType(toAiQuestionType(sourceQuestion != null ? sourceQuestion.getQuestionType() : null))
                .count(count)
                .difficulty(normalizeDifficulty(difficulty))
                .socraticMode(false)
                .build());
    }

    private StudentWrongQuestion ownedWrongQuestion(Long userId, Long wrongQuestionId) {
        Student student = studentMapper.selectOne(new LambdaQueryWrapper<Student>()
                .eq(Student::getUserId, userId));
        if (student == null) throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "学生不存在");
        StudentWrongQuestion wrongQuestion = wrongQuestionMapper.selectById(wrongQuestionId);
        if (wrongQuestion == null) throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "错题不存在");
        if (!student.getId().equals(wrongQuestion.getStudentId())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "无权访问该错题");
        }
        return wrongQuestion;
    }

    private String toAiQuestionType(String questionType) {
        if (questionType == null) return "单选";
        return switch (questionType.toUpperCase()) {
            case "MULTI" -> "多选";
            case "FILL" -> "填空";
            case "SHORT" -> "简答";
            case "COMPREHENSIVE" -> "综合";
            default -> "单选";
        };
    }

    private String normalizeDifficulty(String difficulty) {
        return List.of("EASY", "MEDIUM", "HARD", "简单", "中等", "困难").contains(difficulty)
                ? difficulty : "MEDIUM";
    }

    private String valueOrDefault(String value, String defaultValue) {
        return StringUtils.hasText(value) ? value : defaultValue;
    }
}
