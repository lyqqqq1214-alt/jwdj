package com.example.aitaes.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AiQuestionGenerateRequest {
    private List<String> knowledgePoints;
    private String questionType;
    private Integer count;
    private String difficulty;
    private boolean socraticMode;
}
