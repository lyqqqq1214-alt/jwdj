package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_teacher")
public class Teacher {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 关联 t_user.id */
    private Long userId;

    /** 工号 */
    private String teacherNo;

    /** 姓名 */
    private String name;

    /** 性别 */
    private String gender;

    /** 学院 */
    private String college;

    /** 系/部门 */
    private String department;

    /** 职称 */
    private String title;

    /** 邮箱 */
    private String email;

    /** 联系电话 */
    private String phone;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
