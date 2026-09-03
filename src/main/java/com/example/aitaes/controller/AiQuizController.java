package com.example.aitaes.controller;

import com.example.aitaes.common.Result;
import com.example.aitaes.dto.AiGeneratedQuestionDTO;
import com.example.aitaes.dto.AiQuestionGenerateRequest;
import com.example.aitaes.service.OllamaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AiQuizController {

    private final OllamaService ollamaService;

    @PostMapping("/generate")
    public Result<List<AiGeneratedQuestionDTO>> generate(@RequestBody AiQuestionGenerateRequest request) {
        return Result.success(ollamaService.generateQuestions(request));
    }
}
