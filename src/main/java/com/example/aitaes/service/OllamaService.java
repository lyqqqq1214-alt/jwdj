package com.example.aitaes.service;

import com.example.aitaes.dto.AiChatMessageDTO;
import com.example.aitaes.dto.AiGeneratedQuestionDTO;
import com.example.aitaes.dto.AiQuestionGenerateRequest;

import java.util.List;

public interface OllamaService {
    String generate(String prompt);

    String chat(List<AiChatMessageDTO> messages);

    List<AiGeneratedQuestionDTO> generateQuestions(AiQuestionGenerateRequest request);
}
