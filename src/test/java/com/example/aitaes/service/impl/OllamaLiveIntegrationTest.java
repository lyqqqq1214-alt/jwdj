package com.example.aitaes.service.impl;

import com.example.aitaes.config.OllamaProperties;
import com.example.aitaes.dto.AiGeneratedQuestionDTO;
import com.example.aitaes.dto.AiQuestionGenerateRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class OllamaLiveIntegrationTest {

    @Test
    @EnabledIfEnvironmentVariable(named = "OLLAMA_LIVE_TEST", matches = "true")
    void shouldGenerateQuestionThroughRealOllamaApi() {
        OllamaProperties properties = new OllamaProperties();
        properties.setBaseUrl("http://127.0.0.1:11434");
        properties.setModel("qwen2.5:7b");
        properties.setReadTimeout(Duration.ofMinutes(5));
        properties.setRetryDelay(Duration.ZERO);

        RestTemplate restTemplate = new RestTemplateBuilder()
                .rootUri(properties.getBaseUrl())
                .connectTimeout(properties.getConnectTimeout())
                .readTimeout(properties.getReadTimeout())
                .build();
        OllamaServiceImpl service = new OllamaServiceImpl(restTemplate, properties, new ObjectMapper());

        List<AiGeneratedQuestionDTO> questions = service.generateQuestions(AiQuestionGenerateRequest.builder()
                .knowledgePoints(List.of("TCP三次握手"))
                .questionType("单项选择题")
                .count(1)
                .difficulty("中等")
                .socraticMode(false)
                .build());

        assertEquals(1, questions.size());
        assertFalse(questions.getFirst().getOptions().isEmpty());
        assertFalse(questions.getFirst().getKnowledgeTags().isEmpty());
    }
}
