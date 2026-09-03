package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 题库实体
 * <p>
 * 支持AI生成题目和教师手动创建题目，题目内容以JSON格式存储。
 */
@Data
@TableName("t_question_bank")
public class QuestionBank {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属课程ID */
    private Long courseId;

    /** 所属教师ID */
    private Long teacherId;

    /** 题型：SINGLE/MULTI/FILL/SHORT/COMPREHENSIVE */
    private String questionType;

    /** 难度：EASY/MEDIUM/HARD */
    private String difficulty;

    /** 题目内容（JSON：题干+选项+答案+解析） */
    private String content;

    /** 关联知识点（逗号分隔） */
    private String knowledgePoints;

    /** 是否AI生成 */
    private Integer aiGenerated;

    /** AI质量评分-清晰度(1-5) */
    private Integer qualityClarity;

    /** AI质量评分-难度匹配度(1-5) */
    private Integer qualityDifficulty;

    /** AI质量评分-歧义性(1-5, 5=无歧义) */
    private Integer qualityAmbiguity;

    /** AI质量评分-知识点覆盖度(1-5) */
    private Integer qualityKpCoverage;

    /** 苏格拉底模式（启发式追问开关） */
    private Integer socraticMode;

    /** 苏格拉底追问链（JSON数组，2-3个递进追问） */
    private String socraticChain;

    /** 使用次数 */
    private Integer usageCount;

    /** 状态：DRAFT/APPROVED/PUBLISHED */
    private String status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
