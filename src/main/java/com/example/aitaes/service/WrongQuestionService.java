package com.example.aitaes.service;

import com.example.aitaes.dto.AiGeneratedQuestionDTO;

import java.util.List;

/** 错题分析及巩固练习服务。 */
public interface WrongQuestionService {

    String analyzeWrongAnswer(Long userId, Long wrongQuestionId);

    List<AiGeneratedQuestionDTO> generateSimilarQuestions(Long userId, Long wrongQuestionId,
                                                           int count, String difficulty);
}
