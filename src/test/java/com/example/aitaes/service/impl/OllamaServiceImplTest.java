package com.example.aitaes.service.impl;

import com.example.aitaes.common.BusinessException;
import com.example.aitaes.config.OllamaProperties;
import com.example.aitaes.dto.AiGeneratedQuestionDTO;
import com.example.aitaes.dto.AiQuestionGenerateRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.ExpectedCount.times;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class OllamaServiceImplTest {

    private MockRestServiceServer server;
    private OllamaServiceImpl service;

    @BeforeEach
    void setUp() {
        RestTemplate restTemplate = new RestTemplate();
        server = MockRestServiceServer.bindTo(restTemplate).build();
        OllamaProperties properties = new OllamaProperties();
        properties.setModel("qwen2.5:7b");
        properties.setMaxAttempts(3);
        properties.setRetryDelay(Duration.ZERO);
        service = new OllamaServiceImpl(restTemplate, properties, new ObjectMapper());
    }

    @Test
    @DisplayName("应发送非流式JSON请求并解析结构化题目")
    void shouldGenerateStructuredQuestions() {
        String questionsJson = "{\"questions\":[{\"questionType\":\"简答\",\"stem\":\"TCP为何需要三次握手？\",\"options\":{},\"answer\":\"同步双方序列号并确认收发能力\",\"explanation\":\"三次交互可确认双向通信。\",\"knowledgeTags\":[\"TCP\"],\"socraticQuestions\":[]}]}";
        String ollamaResponse = "{\"response\":" + quote(questionsJson) + "}";
        server.expect(requestTo("/api/generate"))
                .andExpect(jsonPath("$.model").value("qwen2.5:7b"))
                .andExpect(jsonPath("$.stream").value(false))
                .andExpect(jsonPath("$.keep_alive").value("30m"))
                .andExpect(jsonPath("$.format.type").value("object"))
                .andExpect(jsonPath("$.format.properties.questions.minItems").value(1))
                .andRespond(withSuccess(ollamaResponse, MediaType.APPLICATION_JSON));

        List<AiGeneratedQuestionDTO> result = service.generateQuestions(request(1));

        assertEquals(1, result.size());
        assertEquals("TCP为何需要三次握手？", result.getFirst().getStem());
        server.verify();
    }

    @Test
    @DisplayName("调用失败时应按配置重试")
    void shouldRetryOnTransportFailure() {
        server.expect(times(2), requestTo("/api/generate")).andRespond(withServerError());
        server.expect(requestTo("/api/generate"))
                .andRespond(withSuccess("{\"response\":\"[]\"}", MediaType.APPLICATION_JSON));

        assertEquals("[]", service.generate("测试"));
        server.verify();
    }

    @Test
    @DisplayName("应拒绝格式不合法的模型输出")
    void shouldRejectInvalidJson() {
        server.expect(requestTo("/api/generate"))
                .andRespond(withSuccess("{\"response\":\"not-json\"}", MediaType.APPLICATION_JSON));

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.generateQuestions(request(1)));
        assertTrue(exception.getMessage().contains("合法的题目JSON"));
    }

    @Test
    @DisplayName("Prompt应明确结构、数量和苏格拉底模式")
    void shouldBuildStableQuestionPrompt() {
        String prompt = service.buildQuestionPrompt(request(2));
        assertAll(
                () -> assertTrue(prompt.contains("questions数组")),
                () -> assertTrue(prompt.contains("恰好包含2个对象")),
                () -> assertTrue(prompt.contains("knowledgeTags")),
                () -> assertTrue(prompt.contains("socraticQuestions")),
                () -> assertTrue(prompt.contains("计算机网络"))
        );
    }

    @Test
    @DisplayName("综合题两问顺序颠倒时应自动纠正并同步交换答案")
    void shouldNormalizeReversedCompositeQuestion() {
        String questionsJson = "{\"questions\":[{\"questionType\":\"综合题\","
                + "\"stem\":\"材料：某链路带宽为100Mbps。\\n（1）请计算传输时延。\\n（2）请简述时延的含义。\","
                + "\"options\":{},"
                + "\"answer\":\"（1）公式：T=L/R；代入数据计算结果为1秒。\\n（2）时延表示数据传输所需时间。\","
                + "\"explanation\":\"考查概念与计算。\",\"knowledgeTags\":[\"时延\"],\"socraticQuestions\":[]}]}";
        server.expect(requestTo("/api/generate"))
                .andRespond(withSuccess("{\"response\":" + quote(questionsJson) + "}", MediaType.APPLICATION_JSON));

        AiQuestionGenerateRequest compositeRequest = AiQuestionGenerateRequest.builder()
                .knowledgePoints(List.of("计算机网络"))
                .questionType("综合")
                .count(1)
                .difficulty("中等")
                .socraticMode(false)
                .build();

        AiGeneratedQuestionDTO question = service.generateQuestions(compositeRequest).getFirst();

        assertTrue(question.getStem().indexOf("简述") < question.getStem().indexOf("计算"));
        assertTrue(question.getAnswer().indexOf("时延表示") < question.getAnswer().indexOf("公式"));
        assertEquals("综合", question.getQuestionType());
        server.verify();
    }

    private AiQuestionGenerateRequest request(int count) {
        return AiQuestionGenerateRequest.builder()
                .knowledgePoints(List.of("计算机网络", "TCP"))
                .questionType("简答题")
                .count(count)
                .difficulty("中等")
                .socraticMode(false)
                .build();
    }

    private String quote(String value) {
        try {
            return new ObjectMapper().writeValueAsString(value);
        } catch (Exception ex) {
            throw new AssertionError(ex);
        }
    }
}
