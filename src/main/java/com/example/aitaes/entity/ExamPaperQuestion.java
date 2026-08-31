package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 试卷题目关联实体
 */
@Data
@TableName("t_exam_paper_question")
public class ExamPaperQuestion {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 试卷ID */
    private Long paperId;

    /** 题库题目ID */
    private Long questionId;

    /** 题号（在试卷中的排序） */
    private Integer questionNo;

    /** 本题在试卷中的分值 */
    private BigDecimal score;

    /** 题目内容快照（编辑后覆盖题库原题，null 表示用题库原题） */
    private String contentOverride;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
