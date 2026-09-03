package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 登录响应
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDTO {

    /** JWT Token */
    private String token;

    /** 用户 ID */
    private Long userId;

    /** 用户名 */
    private String username;

    /** 角色：ADMIN / TEACHER / ASSISTANT / STUDENT */
    private String role;

    /** 是否首次登录（需强制修改密码） */
    private Boolean firstLogin;

    /** 用户姓名（教师/学生真实姓名） */
    private String displayName;
}
