package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI 对话消息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatMessageDTO {

    /**
     * 角色：system / user / assistant
     */
    private String role;

    /**
     * 消息内容
     */
    private String content;
}
