package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 课程-学生选课关联表
 */
@Data
@TableName("t_course_student")
public class CourseStudent {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 课程ID */
    private Long courseId;

    /** 学生ID */
    private Long studentId;

    /** 班级名称（如"计科1801"） */
    private String className;

    /** 选课学期 */
    private String semester;

    /** 教师重点关注标记 */
    private Integer isFocus;

    /** AI综合评价 */
    private String aiEvaluation;

    /** AI评价生成时间 */
    private LocalDateTime aiEvaluationTime;

    /** AI学习建议（JSON数组） */
    private String aiSuggestions;

    /** AI学习建议生成时间 */
    private LocalDateTime aiSuggestionsTime;

    private LocalDateTime createTime;

    /** 逻辑删除（0=正常, 1=退课） */
    private Integer deleted;
}
