package com.example.aitaes.service.impl;

import com.example.aitaes.common.BusinessException;
import com.example.aitaes.config.OllamaProperties;
import com.example.aitaes.dto.AiGeneratedQuestionDTO;
import com.example.aitaes.dto.AiQuestionGenerateRequest;
import com.example.aitaes.service.OllamaService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class OllamaServiceImpl implements OllamaService {

    @Qualifier("ollamaRestTemplate")
    private final RestTemplate restTemplate;
    private final OllamaProperties properties;
    private final ObjectMapper objectMapper;

    @Override
    public String generate(String prompt) {
        if (!StringUtils.hasText(prompt)) {
            throw new BusinessException(400, "Prompt不能为空");
        }
        return callDashScope(prompt, null);
    }

    @Override
    public List<AiGeneratedQuestionDTO> generateQuestions(AiQuestionGenerateRequest request) {
        validateRequest(request);
        String json = stripMarkdownFence(callDashScope(
                buildQuestionPrompt(request),
                Map.of("type", "json_object")));
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode questionsNode;
            if (root.isArray()) {
                questionsNode = root;
            } else if (root.has("questions") && root.get("questions").isArray()) {
                questionsNode = root.get("questions");
            } else if (request.getCount() == 1 && root.isObject()) {
                questionsNode = objectMapper.createArrayNode().add(root);
            } else {
                throw new BusinessException("模型返回的题目JSON缺少questions数组");
            }

            List<AiGeneratedQuestionDTO> questions = objectMapper.convertValue(
                    questionsNode, new TypeReference<>() { });
            if (questions.size() != request.getCount()) {
                throw new BusinessException("模型返回题目数量不符合要求，期望"
                        + request.getCount() + "题，实际" + questions.size() + "题");
            }
            for (AiGeneratedQuestionDTO question : questions) {
                if (!StringUtils.hasText(question.getStem())
                        || !StringUtils.hasText(question.getAnswer())
                        || !StringUtils.hasText(question.getExplanation())
                        || question.getKnowledgeTags() == null
                        || question.getSocraticQuestions() == null) {
                    throw new BusinessException("模型返回的题目JSON缺少必填字段");
                }
            }
            return questions;
        } catch (JsonProcessingException | IllegalArgumentException ex) {
            throw new BusinessException("模型返回内容不是合法的题目JSON: " + ex.getMessage());
        }
    }

    private String callDashScope(String prompt, Object responseFormat) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "user", "content", prompt));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", properties.getModel());
        body.put("messages", messages);
        body.put("temperature", properties.getTemperature());
        if (responseFormat != null) {
            body.put("response_format", responseFormat);
        }

        Exception lastException = null;
        int attempts = Math.max(1, properties.getMaxAttempts());
        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(properties.getApiKey());
                HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

                ResponseEntity<Map> response = restTemplate.postForEntity(
                        "/chat/completions", request, Map.class);
                Map<?, ?> data = response.getBody();
                if (data == null || !data.containsKey("choices")) {
                    throw new BusinessException("DashScope返回格式异常");
                }
                List<?> choices = (List<?>) data.get("choices");
                if (choices == null || choices.isEmpty()) {
                    throw new BusinessException("DashScope返回内容为空");
                }
                Map<?, ?> choice = (Map<?, ?>) choices.get(0);
                Map<?, ?> message = (Map<?, ?>) choice.get("message");
                if (message == null || message.get("content") == null) {
                    throw new BusinessException("DashScope返回内容为空");
                }
                return message.get("content").toString();
            } catch (HttpClientErrorException ex) {
                lastException = ex;
                log.warn("DashScope调用失败(HTTP {}), 第{}/{}次尝试: {}",
                        ex.getStatusCode(), attempt, attempts, ex.getResponseBodyAsString());
                if (attempt < attempts) {
                    sleepBeforeRetry();
                }
            } catch (ResourceAccessException ex) {
                lastException = ex;
                log.warn("DashScope网络异常，第{}/{}次尝试: {}", attempt, attempts, ex.getMessage());
                if (attempt < attempts) {
                    sleepBeforeRetry();
                }
            }
        }
        throw new BusinessException(503, "AI服务暂不可用: "
                + (lastException == null ? "未知错误" : lastException.getMessage()));
    }

    String buildQuestionPrompt(AiQuestionGenerateRequest request) {
        return """
                你是一名严谨的高校教师。请根据以下条件生成试题：
                - 知识点：%s
                - 题型：%s
                - 数量：%d
                - 难度：%s
                - 苏格拉底模式：%s

                只返回JSON对象，不要Markdown代码块或任何额外文字。顶层仅包含questions数组，数组必须恰好包含%d个对象。
                每道题必须直接考查"知识点"列表中的至少一个知识点，禁止生成列表以外主题的题目。
                questions中的每个对象必须包含：
                {"stem":"题干","options":{"A":"选项A","B":"选项B"},"answer":"答案",
                 "explanation":"解析","knowledgeTags":["知识点标签"],"socraticQuestions":["递进追问"]}
                非选择题的options返回空对象。苏格拉底模式关闭时socraticQuestions返回空数组；开启时返回2到4个递进问题，且不得直接泄露答案。
                答案必须唯一且可验证，题干不得含歧义，难度应与要求匹配，所有字段均不得省略。
                """.formatted(String.join("、", request.getKnowledgePoints()), request.getQuestionType(),
                request.getCount(), request.getDifficulty(), request.isSocraticMode() ? "开启" : "关闭",
                request.getCount());
    }

    private void validateRequest(AiQuestionGenerateRequest request) {
        if (request == null || request.getKnowledgePoints() == null
                || request.getKnowledgePoints().isEmpty()
                || request.getKnowledgePoints().stream().anyMatch(point -> !StringUtils.hasText(point))
                || !StringUtils.hasText(request.getQuestionType())
                || request.getCount() == null || request.getCount() < 1 || request.getCount() > 20
                || !StringUtils.hasText(request.getDifficulty())) {
            throw new BusinessException(400, "出题参数不完整或题目数量不在1到20之间");
        }
    }

    private String stripMarkdownFence(String value) {
        String result = value.trim();
        if (result.startsWith("```")) {
            result = result.replaceFirst("^```(?:json)?\\s*", "");
            result = result.replaceFirst("\\s*```$", "");
        }
        return result.trim();
    }

    private void sleepBeforeRetry() {
        try {
            Thread.sleep(Math.max(0, properties.getRetryDelay().toMillis()));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new BusinessException("AI调用重试等待被中断");
        }
    }
}
