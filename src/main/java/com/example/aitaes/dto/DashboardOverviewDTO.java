package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 驾驶舱概览统计卡片
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardOverviewDTO {

    /** 班级学生总数 */
    private Integer studentCount;

    /** 最近一次考核平均分 */
    private BigDecimal averageScore;

    /** 出勤率（百分比） */
    private BigDecimal attendanceRate;

    /** 作业提交率（百分比） */
    private BigDecimal homeworkRate;

    /** 预警学生数量 */
    private Integer warningCount;
}
