package com.example.aitaes.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 手动添加学生请求
 */
@Data
public class StudentAddDTO {

    @NotBlank(message = "学号不能为空")
    private String studentNo;

    @NotBlank(message = "姓名不能为空")
    private String name;

    private String gender;
    private String college;
    private String major;
    private String grade;
    private String email;
}
