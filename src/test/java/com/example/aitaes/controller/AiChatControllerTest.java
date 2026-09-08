package com.example.aitaes.controller;

import com.example.aitaes.dto.AiChatRequest;
import com.example.aitaes.dto.AiChatResponseDTO;
import com.example.aitaes.service.AiChatService;
import com.example.aitaes.util.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
public class AiChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AiChatService aiChatService;

    @Test
    @DisplayName("应该成功处理AI对话请求并返回回复")
    void shouldHandleAiChatRequest() throws Exception {
        // Given
        Long userId = 1L;
        String role = "STUDENT";
        String token = JwtUtil.generateToken(userId, "test_student", role);

        AiChatRequest request = new AiChatRequest();
        request.setMessage("你好");
        request.setCourseId(1L);

        AiChatResponseDTO responseDTO = AiChatResponseDTO.builder()
                .answer("你好！我是AI助手。")
                .assistantMode("STUDENT_LEARNING")
                .build();

        when(aiChatService.chat(eq(userId), eq(role), any(AiChatRequest.class)))
                .thenReturn(responseDTO);

        // When & Then
        mockMvc.perform(post("/api/ai/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.answer").value("你好！我是AI助手。"))
                .andExpect(jsonPath("$.data.assistantMode").value("STUDENT_LEARNING"));
    }
}
