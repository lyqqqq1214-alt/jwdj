package com.example.aitaes.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 创建教师请求
 */
@Data
public class TeacherCreateDTO {

    @NotBlank(message = "工号不能为空")
    private String teacherNo;

    @NotBlank(message = "姓名不能为空")
    private String name;

    private String gender;
    private String college;
    private String department;
    private String title;
    private String email;
    private String phone;

    /** 初始密码（为空则使用系统默认密码） */
    private String password;
}
