package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 学生考试逐题作答记录实体
 * <p>
 * 每个学生对试卷中每道题的一条作答记录。客观题在交卷时自动判分（{@code isCorrect}/{@code score}），
 * 主观题交卷时仅保存答案（{@code score=null, graded=0}），待教师逐题批阅后回填分数。
 */
@Data
@TableName("t_exam_answer")
public class ExamAnswer {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 试卷ID */
    private Long paperId;

    /** 考核ID */
    private Long assessmentId;

    /** 成绩记录ID（t_assessment_record） */
    private Long recordId;

    /** 学生ID */
    private Long studentId;

    /** 题目ID */
    private Long questionId;

    /** 题号（在试卷中的排序） */
    private Integer questionNo;

    /** 题型：SINGLE/MULTI/FILL/TRUE_FALSE/SHORT/COMPREHENSIVE */
    private String questionType;

    /** 学生答案 */
    private String studentAnswer;

    /** 正确答案快照 */
    private String correctAnswer;

    /** 得分（主观题批阅前为 null） */
    private BigDecimal score;

    /** 本题满分 */
    private BigDecimal maxScore;

    /** 客观题是否正确（1=对，0=错，主观题为 null） */
    private Integer isCorrect;

    /** 主观题是否已批（0=待批，1=已批） */
    private Integer graded;

    /** 批阅教师ID */
    private Long graderId;

    /** 批阅评语 */
    private String comment;

    private LocalDateTime createTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
