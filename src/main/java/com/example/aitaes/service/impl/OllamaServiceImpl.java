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
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
        return callOllama(prompt, "json");
    }

    @Override
    public List<AiGeneratedQuestionDTO> generateQuestions(AiQuestionGenerateRequest request) {
        validateRequest(request);
        String json = stripMarkdownFence(callOllama(
                buildQuestionPrompt(request), buildQuestionSchema(request.getCount())));
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
                        || !StringUtils.hasText(question.getQuestionType())
                        || !StringUtils.hasText(question.getAnswer())
                        || !StringUtils.hasText(question.getExplanation())
                        || question.getOptions() == null
                        || question.getKnowledgeTags() == null
                        || question.getSocraticQuestions() == null) {
                    throw new BusinessException("模型返回的题目JSON缺少必填字段");
                }
                normalizeCompositeQuestionOrder(question);
                validateGeneratedQuestion(question, request);
            }
            return questions;
        } catch (JsonProcessingException | IllegalArgumentException ex) {
            throw new BusinessException("模型返回内容不是合法的题目JSON: " + ex.getMessage());
        }
    }

    private String callOllama(String prompt, Object format) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", properties.getModel());
        body.put("prompt", prompt);
        body.put("stream", false);
        body.put("format", format);
        body.put("keep_alive", "30m");
        body.put("options", Map.of(
                "temperature", properties.getTemperature(),
                "num_predict", 4096));

        RestClientException lastException = null;
        int attempts = Math.max(1, properties.getMaxAttempts());
        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                Map<?, ?> response = restTemplate.postForObject("/api/generate", body, Map.class);
                Object generated = response == null ? null : response.get("response");
                if (generated == null || !StringUtils.hasText(generated.toString())) {
                    throw new BusinessException("Ollama返回内容为空");
                }
                return generated.toString();
            } catch (RestClientException ex) {
                lastException = ex;
                log.warn("Ollama调用失败，第{}/{}次尝试: {}", attempt, attempts, ex.getMessage());
                if (attempt < attempts) {
                    sleepBeforeRetry();
                }
            }
        }
        throw new BusinessException(503, "本地大模型服务暂不可用: "
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
                每道题必须直接考查“知识点”列表中的至少一个知识点，禁止生成列表以外主题的题目。
                questions中的每个对象必须包含：
                {"questionType":"单选/多选/填空/简答/综合","stem":"题干","options":{"A":"选项A","B":"选项B"},"answer":"答案",
                 "explanation":"解析","knowledgeTags":["知识点标签"],"socraticQuestions":["递进追问"]}
                questionType必须严格取自请求题型，且遵守以下规则：
                1. 单选：必须恰好有4个选项且只有1个正确答案，answer仅返回一个字母，如"B"。
                2. 多选：必须恰好有4个选项且至少有2个正确答案，answer按字母升序用英文逗号分隔，如"A,C"；禁止只给1个答案。
                3. 填空：题干必须含明确的“____”，options为空对象，answer只返回应填内容，禁止在题干泄露答案。
                4. 简答：options为空对象，answer给出简洁、可评分的要点。
                5. 综合：必须采用固定的两问结构。题干先给出包含必要数据的具体材料或场景；第（1）问必须是概念、原理或分析类简答题；第（2）问必须是能够根据材料数据求解的计算题。不得出现第（3）问。options为空对象。answer必须按“（1）简答要点；（2）计算公式、代入过程和最终结果”逐问作答，禁止退化成选择题、两个简答题或只有计算结果。
                综合题必须严格仿照下面的字段格式（内容根据知识点重新命题）：
                {"questionType":"综合","stem":"材料：某具体场景，已知计算所需数据。\\n（1）请简述或分析相关原理。\\n（2）请根据上述数据计算所求量。","options":{},"answer":"（1）相关原理和关键要点。\\n（2）公式：...；代入：...；计算结果：...。","explanation":"说明第（1）问的评分点以及第（2）问的计算逻辑。","knowledgeTags":["知识点"],"socraticQuestions":[]}
                苏格拉底模式关闭时socraticQuestions返回空数组；开启时返回2到4个递进问题，且不得直接泄露答案。
                答案必须唯一且可验证，题干不得含歧义，难度应与要求匹配，所有字段均不得省略。
                """.formatted(String.join("、", request.getKnowledgePoints()), request.getQuestionType(),
                request.getCount(), request.getDifficulty(), request.isSocraticMode() ? "开启" : "关闭",
                request.getCount());
    }

    private Map<String, Object> buildQuestionSchema(int count) {
        Map<String, Object> stringSchema = Map.of("type", "string");
        Map<String, Object> questionSchema = Map.of(
                "type", "object",
                "properties", Map.of(
                        "stem", stringSchema,
                        "questionType", stringSchema,
                        "options", Map.of("type", "object", "additionalProperties", stringSchema),
                        "answer", stringSchema,
                        "explanation", stringSchema,
                        "knowledgeTags", Map.of("type", "array", "items", stringSchema),
                        "socraticQuestions", Map.of("type", "array", "items", stringSchema)),
                "required", List.of("questionType", "stem", "options", "answer", "explanation",
                        "knowledgeTags", "socraticQuestions"));
        return Map.of(
                "type", "object",
                "properties", Map.of("questions", Map.of(
                        "type", "array", "minItems", count, "maxItems", count, "items", questionSchema)),
                "required", List.of("questions"));
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

    private void validateGeneratedQuestion(AiGeneratedQuestionDTO question,
                                           AiQuestionGenerateRequest request) {
        String type = normalizeQuestionType(question.getQuestionType());
        boolean requestedType = java.util.Arrays.stream(request.getQuestionType().split("[、,，/]"))
                .map(this::normalizeQuestionType)
                .anyMatch(type::equals);
        if (!requestedType) {
            throw new BusinessException("模型返回了请求范围外的题型: " + type);
        }
        question.setQuestionType(type);

        Map<String, String> options = question.getOptions();
        if (type.contains("多选")) {
            if (options.size() != 4 || parseAnswerKeys(question.getAnswer()).size() < 2
                    || !options.keySet().containsAll(parseAnswerKeys(question.getAnswer()))) {
                throw new BusinessException("模型生成的多选题必须有4个选项和至少2个正确答案");
            }
        } else if (type.contains("单选")) {
            List<String> keys = parseAnswerKeys(question.getAnswer());
            if (options.size() != 4 || keys.size() != 1 || !options.containsKey(keys.getFirst())) {
                throw new BusinessException("模型生成的单选题必须有4个选项和唯一正确答案");
            }
        } else if (type.contains("填空")) {
            if (!options.isEmpty() || !question.getStem().contains("____")) {
                throw new BusinessException("模型生成的填空题格式不正确");
            }
        } else if (type.contains("综合")) {
            boolean hasRequiredStructure = question.getStem().matches(
                    "(?s).*[（(]1[）)]\\s*.*(简述|说明|分析|解释|阐述|描述).*[（(]2[）)]\\s*.*(计算|求出|求解|求得|求).*"
            );
            boolean hasThirdQuestion = question.getStem().matches("(?s).*[（(]3[）)].*");
            boolean hasNumberedAnswers = question.getAnswer().matches("(?s).*[（(]1[）)].*[（(]2[）)].*")
                    || question.getAnswer().matches("(?s).*1[.、].*2[.、].*");
            boolean onlyOptionLetters = question.getAnswer().matches("(?i)\\s*[A-Z](?:\\s*[,，、/]\\s*[A-Z])+\\s*");
            boolean answerHasCalculation = question.getAnswer().matches(
                    "(?s).*[（(]2[）)].*(=|×|÷|\\+|-|公式|代入|计算).*"
            );
            if (!options.isEmpty() || !hasRequiredStructure || hasThirdQuestion
                    || !hasNumberedAnswers || !answerHasCalculation || onlyOptionLetters) {
                throw new BusinessException("综合题必须是第（1）问简答、第（2）问计算，并提供逐问答案和计算过程");
            }
        } else if (!options.isEmpty()) {
            throw new BusinessException("非选择题不应包含选项");
        }
    }

    private List<String> parseAnswerKeys(String answer) {
        return answer.toUpperCase().chars()
                .mapToObj(value -> String.valueOf((char) value))
                .filter(value -> value.matches("[A-Z]"))
                .distinct()
                .toList();
    }

    private String normalizeQuestionType(String type) {
        return type == null ? "" : type.trim().replaceAll("\\s+", "").replaceFirst("题$", "");
    }

    private void normalizeCompositeQuestionOrder(AiGeneratedQuestionDTO question) {
        if (!normalizeQuestionType(question.getQuestionType()).contains("综合")) {
            return;
        }

        Pattern twoParts = Pattern.compile("(?s)^(.*?)[（(]1[）)](.*?)[（(]2[）)](.*)$");
        Matcher stemMatcher = twoParts.matcher(question.getStem());
        if (!stemMatcher.matches()) {
            return;
        }

        String firstQuestion = stemMatcher.group(2).trim();
        String secondQuestion = stemMatcher.group(3).trim();
        boolean firstIsCalculation = containsCalculationInstruction(firstQuestion);
        boolean secondIsShortAnswer = containsShortAnswerInstruction(secondQuestion);
        if (!firstIsCalculation || !secondIsShortAnswer) {
            return;
        }

        question.setStem(stemMatcher.group(1).trim()
                + "\n（1）" + secondQuestion
                + "\n（2）" + firstQuestion);

        Matcher answerMatcher = twoParts.matcher(question.getAnswer());
        if (answerMatcher.matches()) {
            question.setAnswer("（1）" + answerMatcher.group(3).trim()
                    + "\n（2）" + answerMatcher.group(2).trim());
        }
    }

    private boolean containsCalculationInstruction(String value) {
        return value.matches("(?s).*(计算|求出|求解|求得|求).*");
    }

    private boolean containsShortAnswerInstruction(String value) {
        return value.matches("(?s).*(简述|说明|分析|解释|阐述|描述).*");
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
            throw new BusinessException("Ollama重试等待被中断");
        }
    }
}
