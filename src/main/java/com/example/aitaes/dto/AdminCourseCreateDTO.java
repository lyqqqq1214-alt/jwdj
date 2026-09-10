package com.example.aitaes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class AdminCourseCreateDTO {
    @NotBlank(message = "课程编号不能为空") private String courseNo;
    @NotBlank(message = "课程名称不能为空") private String courseName;
    @NotNull(message = "请选择授课教师") private Long teacherId;
    @NotBlank(message = "学期不能为空") private String semester;
    private String className;
    private BigDecimal credit;
    private String courseType;
    private String description;
}
