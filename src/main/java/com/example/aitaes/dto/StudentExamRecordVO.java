package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 学生历史考试记录（学生端「已完成考试」列表项）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentExamRecordVO {

    /** 成绩记录ID */
    private Long recordId;

    /** 试卷ID */
    private Long paperId;

    /** 试卷名称 */
    private String paperName;

    /** 课程ID */
    private Long courseId;

    /** 课程名称 */
    private String courseName;

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

    /** 状态：GRADING（主观题待批）/ GRADED（全部批阅完成） */
    private String status;
}
