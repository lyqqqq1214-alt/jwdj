package com.example.aitaes.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 创建班级请求
 */
@Data
public class ClassCreateDTO {

    @NotBlank(message = "班级名称不能为空")
    private String className;

    @NotBlank(message = "课程名称不能为空")
    private String courseName;

    @NotBlank(message = "学期不能为空")
    private String semester;

    /** 学分 */
    private java.math.BigDecimal credit;

    /** 课程类型 */
    private String courseType;

    /** 课程描述 */
    private String description;
}
