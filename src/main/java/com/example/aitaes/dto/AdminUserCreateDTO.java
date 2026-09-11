package com.example.aitaes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class AdminUserCreateDTO {
    @NotBlank(message = "账号不能为空")
    @Pattern(regexp = "^[A-Za-z0-9_@.-]{3,50}$", message = "账号只能包含字母、数字及 _ @ . -")
    private String username;
    @NotBlank(message = "初始密码不能为空")
    private String password;
    @NotBlank(message = "角色不能为空")
    private String role;
    private String name;
    private String college;
    private String major;
    private String className;
    private String grade;
    /** 创建助教时必须指定其所属教师。 */
    private Long teacherId;
}
