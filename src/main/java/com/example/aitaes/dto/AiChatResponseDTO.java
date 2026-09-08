package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI 对话响应
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponseDTO {

    /**
     * 回复内容
     */
    private String answer;

    /**
     * 实际使用的问答模式
     */
    private String assistantMode;

    /**
     * 是否启用苏格拉底模式
     */
    private Boolean socraticMode;

    /**
     * 苏格拉底模式下的追问建议
     */
    private java.util.List<String> socraticQuestions;
}
