package com.example.aitaes.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/** 教师从 AI 补题预览中选择后确认入库的题目。 */
@Data
public class AutoGenerateConfirmRequest {
    @NotEmpty(message = "至少选择一道题目")
    private List<AiGeneratedQuestionDTO> questions;
    private String difficulty;
}
