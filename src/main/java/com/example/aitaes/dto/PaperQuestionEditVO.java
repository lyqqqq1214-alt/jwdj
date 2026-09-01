package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 试卷题目编辑视图（含内容快照/题库原题，用于编辑 wizard 回填）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaperQuestionEditVO {
    private Long questionId;
    private Integer questionNo;
    private String questionType;
    private BigDecimal score;
    private String stem;
    private List<StudentExamVO.Option> options;
    private String answer;
    private String analysis;
    private String knowledgePoints;
}
