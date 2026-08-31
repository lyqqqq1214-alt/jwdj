package com.example.aitaes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 创建试卷请求
 */
@Data
public class ExamPaperCreateDTO {

    @NotBlank(message = "试卷名称不能为空")
    private String paperName;

    @NotNull(message = "课程ID不能为空")
    private Long courseId;

    private BigDecimal totalScore;

    private Integer durationMinutes;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    /** 目标班级描述 */
    private String targetClasses;

    /** 题目列表（含每题分值） */
    private List<QuestionItem> questions;

    @Data
    public static class QuestionItem {
        private Long questionId;
        private Integer questionNo;
        private BigDecimal score;
        /** 题目内容快照（完整 JSON，编辑后覆盖题库原题；为空则回退题库原题） */
        private String content;
    }
}
