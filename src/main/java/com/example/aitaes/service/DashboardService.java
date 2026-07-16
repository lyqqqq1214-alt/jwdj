package com.example.aitaes.service;

import com.example.aitaes.dto.*;

import java.util.List;

/**
 * 教学驾驶舱服务接口
 */
public interface DashboardService {

    /**
     * 概览统计卡片
     */
    DashboardOverviewDTO getOverview(Long courseId);

    /**
     * 图表数据
     */
    DashboardChartsDTO getCharts(Long courseId);

    /**
     * 预警学生列表
     */
    List<WarningStudentDTO> getWarnings(Long courseId);

    /**
     * 教师可选班级列表（用于班级切换器 UC27）
     */
    List<ClassVO> getMyCourses(Long userId);
}
