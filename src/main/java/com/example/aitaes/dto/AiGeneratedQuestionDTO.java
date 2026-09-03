package com.example.aitaes.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class AiGeneratedQuestionDTO {
    private String questionType;
    private String stem;
    private Map<String, String> options;
    private String answer;
    private String explanation;
    private List<String> knowledgeTags;
    private List<String> socraticQuestions;
}
