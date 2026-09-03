package com.example.aitaes.service;

import com.example.aitaes.dto.AiGeneratedQuestionDTO;
import com.example.aitaes.dto.AiQuestionGenerateRequest;

import java.util.List;

public interface OllamaService {
    String generate(String prompt);

    List<AiGeneratedQuestionDTO> generateQuestions(AiQuestionGenerateRequest request);
}
