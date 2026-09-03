package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 主观题待批阅条目（教师端批阅列表项）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradingItemVO {

    private Long answerId;
    private Long recordId;
    private Long paperId;
    private String paperName;
    private Long studentId;
    private String studentNo;
    private String studentName;
    private Integer questionNo;
    private String questionType;
    private String questionStem;
    private String studentAnswer;
    private String correctAnswer;
    private BigDecimal maxScore;
    private BigDecimal score;
    private LocalDateTime submitTime;
}
