package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 班级卡片返回对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassVO {

    private Long id;
    private String courseNo;
    private String courseName;
    private String className;
    private String semester;
    private BigDecimal credit;
    private String courseType;
    private Integer studentCount;
    private LocalDateTime createTime;
    private BigDecimal avgScore;
    private BigDecimal attendanceRate;
    private BigDecimal homeworkRate;
}
