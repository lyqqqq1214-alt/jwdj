package com.example.aitaes.dto;

import lombok.Data;

/**
 * 更新教师信息请求（工号不可修改）
 */
@Data
public class TeacherUpdateDTO {

    private String name;
    private String gender;
    private String college;
    private String department;
    private String title;
    private String email;
    private String phone;
}
