package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 学生考试结果详情（学生端「回看试卷」：每题作答与批阅结果）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentExamResultVO {

    private Long paperId;
    private String paperName;

    /** 试卷满分 */
    private BigDecimal totalScore;

    /** 我的得分（客观题 + 已批主观题） */
    private BigDecimal myScore;

    /** 客观题得分 */
    private BigDecimal objectiveScore;

    /** 待批主观题数量 */
    private Integer subjectivePending;

    /** 交卷时间 */
    private String submitTime;

    private List<AnswerItem> answers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerItem {
        private Integer questionNo;
        private String questionType;
        private String stem;
        private List<StudentExamVO.Option> options;
        private String studentAnswer;
        private String correctAnswer;
        private BigDecimal score;
        private BigDecimal maxScore;
        /** 客观题对错（1=对，0=错，主观题为 null） */
        private Integer isCorrect;
        /** 主观题是否已批（0=待批，1=已批） */
        private Integer graded;
        /** 教师批阅评语（仅主观题） */
        private String comment;
    }
}
