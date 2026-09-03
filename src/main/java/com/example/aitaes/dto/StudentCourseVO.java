package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentCourseVO {
    private Long id;
    private String courseNo;
    private String courseName;
    private String className;
    private String teacherName;
    private String semester;
    private BigDecimal credit;
    private String courseType;
}
