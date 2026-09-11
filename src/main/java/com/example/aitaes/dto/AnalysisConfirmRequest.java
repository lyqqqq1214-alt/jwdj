package com.example.aitaes.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/** 教师确认写入的 AI 题目解析。 */
@Data
public class AnalysisConfirmRequest {
    @NotEmpty(message = "至少选择一条解析")
    private List<Item> items;

    @Data
    public static class Item {
        private Long questionId;
        private String analysis;
    }
}
