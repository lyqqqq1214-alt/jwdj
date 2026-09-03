package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 助教实体
 * <p>
 * 关联教师，权限由教师在班级管理中分配。
 */
@Data
@TableName("t_teaching_assistant")
public class TeachingAssistant {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 关联 t_user.id */
    private Long userId;

    /** 所属教师ID */
    private Long teacherId;

    /** 姓名 */
    private String name;

    private LocalDateTime createTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
