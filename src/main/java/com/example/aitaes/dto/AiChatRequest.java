package com.example.aitaes.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * AI 对话请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatRequest {

    /**
     * 当前用户输入
     */
    @NotBlank(message = "提问内容不能为空")
    private String message;

    /**
     * 历史消息，仅保留最近若干轮
     */
    private List<AiChatMessageDTO> history;

    /**
     * 当前课程 ID
     */
    private Long courseId;

    /**
     * 教师端当前查看的学生 ID
     */
    private Long studentId;

    /**
     * 当前页面上下文
     */
    private String pageContext;

    /**
     * 是否启用苏格拉底启发式提问
     */
    private Boolean socraticMode;

    /**
     * 已选择附件名列表，仅用于提示模型当前参考材料
     */
    private List<String> attachmentNames;
}
