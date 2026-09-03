package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_student")
public class Student {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 关联 t_user.id */
    private Long userId;

    /** 学号 */
    private String studentNo;

    /** 姓名 */
    private String name;

    /** 性别 */
    private String gender;

    /** 学院 */
    private String college;

    /** 专业 */
    private String major;

    /** 班级 */
    private String className;

    /** 年级 */
    private String grade;

    /** 头像URL（默认占位） */
    private String avatar;

    /** 邮箱 */
    private String email;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
