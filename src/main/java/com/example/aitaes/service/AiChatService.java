package com.example.aitaes.service;

import com.example.aitaes.dto.AiChatRequest;
import com.example.aitaes.dto.AiChatResponseDTO;
import com.example.aitaes.dto.AiInsightDTO;

public interface AiChatService {

    AiChatResponseDTO chat(Long userId, String role, AiChatRequest request);
    
    /**
     * 生成AI洞察播报（用于驾驶舱顶部播报和指标点评）
     */
    AiInsightDTO getInsight(Long userId, Long courseId);
}
