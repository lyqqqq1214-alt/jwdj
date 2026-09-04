package com.example.aitaes.service;

import com.example.aitaes.dto.*;

import java.util.List;

/**
 * 教学驾驶舱服务接口
 */
public interface DashboardService {

    /**
     * 概览统计卡片（className 为空时统计全课程，否则仅统计该班级）
     */
    DashboardOverviewDTO getOverview(Long courseId, String className);

    /**
     * 图表数据（className 为空时统计全课程，否则仅统计该班级）
     */
    DashboardChartsDTO getCharts(Long courseId, String className);

    /**
     * 预警学生列表（className 为空时返回全课程，否则仅返回该班级）
     */
    List<WarningStudentDTO> getWarnings(Long courseId, String className);

    /**
     * 教师可选课程列表（用于课程切换器 UC27）
     */
    List<ClassVO> getMyCourses(Long userId);
}
