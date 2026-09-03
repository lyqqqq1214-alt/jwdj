package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 错题本实体
 * <p>
 * 记录学生错题，支持从考核自动导入和AI生成相似题练习。
 */
@Data
@TableName("t_student_wrong_question")
public class StudentWrongQuestion {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 学生ID */
    private Long studentId;

    /** 课程ID */
    private Long courseId;

    /** 题目内容快照（JSON格式） */
    private String questionContent;

    /** 学生答案 */
    private String studentAnswer;

    /** 正确答案 */
    private String correctAnswer;

    /** 关联知识点（逗号分隔） */
    private String knowledgePoints;

    /** 解析 */
    private String analysis;

    /** 错误次数（重复错同一知识点时累加） */
    private Integer wrongCount;

    /** 来源：ASSESSMENT/AI_GENERATE */
    private String source;

    /** 来源记录ID */
    private Long sourceId;

    /** 首次错误时间 */
    private LocalDateTime createTime;

    /** 最近错误时间 */
    private LocalDateTime updateTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
