package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 统一用户认证实体
 * <p>
 * 4种角色(ADMIN/TEACHER/ASSISTANT/STUDENT)共用此表登录。
 */
@Data
@TableName("t_user")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 登录账号 */
    private String username;

    /** BCrypt加密密码 */
    private String password;

    /** 角色：ADMIN/TEACHER/ASSISTANT/STUDENT */
    private String role;

    /** 状态：ACTIVE(正常)/DISABLED(已禁用) */
    private String status;

    /** 首次登录标记（1=首次，强制改密码） */
    private Integer firstLogin;

    /** 最近登录时间 */
    private LocalDateTime lastLoginTime;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
