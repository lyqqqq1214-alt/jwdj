package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * AI教学建议DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiSuggestionDTO {

    /**
     * 建议列表
     */
    private List<Suggestion> suggestions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Suggestion {
        /**
         * 建议类型：教学方法/课堂管理/学生辅导/课程优化
         */
        private String type;

        /**
         * 优先级：HIGH/MEDIUM/LOW
         */
        private String priority;

        /**
         * 建议标题
         */
        private String title;

        /**
         * 建议内容
         */
        private String content;

        /**
         * 预期效果
         */
        private String expectedEffect;
    }
}
