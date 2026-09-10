package com.example.aitaes.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminUserUpdateDTO {
    @NotBlank(message = "姓名不能为空")
    private String name;
    private String college;
    private String major;
    private String className;
    private String grade;
}
