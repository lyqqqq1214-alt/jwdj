package com.example.aitaes.controller;

import com.example.aitaes.common.Result;
import com.example.aitaes.dto.AiChatRequest;
import com.example.aitaes.dto.AiChatResponseDTO;
import com.example.aitaes.dto.AiInsightDTO;
import com.example.aitaes.service.AiChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * AI 对话助手控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    /**
     * AI 对话接口
     * 支持教师端学情分析和学生端学习问答，集成苏格拉底模式
     */
    @PostMapping("/chat")
    public Result<AiChatResponseDTO> chat(@RequestAttribute("userId") Long userId,
                                          @RequestAttribute("role") String role,
                                          @RequestBody AiChatRequest request) {
        log.info("AI对话请求: userId={}, role={}, courseId={}, studentId={}", 
                userId, role, request.getCourseId(), request.getStudentId());
        
        AiChatResponseDTO response = aiChatService.chat(userId, role, request);
        return Result.success(response);
    }

    /**
     * AI洞察播报接口（用于驾驶舱顶部播报和指标点评）
     */
    @GetMapping("/insight/{courseId}")
    public Result<AiInsightDTO> getInsight(@RequestAttribute("userId") Long userId,
                                           @PathVariable Long courseId) {
        log.info("获取AI洞察播报: userId={}, courseId={}", userId, courseId);
        AiInsightDTO insight = aiChatService.getInsight(userId, courseId);
        return Result.success(insight);
    }
}
