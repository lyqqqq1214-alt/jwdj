package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("t_course")
public class Course {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 课程编号 */
    private String courseNo;

    /** 课程名称 */
    private String courseName;

    /** 班级名称（如"计科1801"，默认为课程名） */
    private String className;

    /** 授课教师ID */
    private Long teacherId;

    /** 学分 */
    private BigDecimal credit;

    /** 课程类型：必修/选修/公选 */
    private String courseType;

    /** 学期 */
    private String semester;

    /** 课程描述 */
    private String description;

    /** 课程知识点列表（JSON格式，缓存完整知识点结构） */
    private String knowledgePointList;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
