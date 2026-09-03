package com.example.aitaes.controller;

import com.example.aitaes.annotation.RequireRole;
import com.example.aitaes.common.Result;
import com.example.aitaes.dto.*;
import com.example.aitaes.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 教学驾驶舱控制器（教师/助教）
 */
@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@RequireRole({"TEACHER", "ASSISTANT"})
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * 驾驶舱完整数据
     */
    @GetMapping
    public Result<Map<String, Object>> full(@RequestParam Long courseId) {
        Map<String, Object> data = new HashMap<>();
        data.put("overview", dashboardService.getOverview(courseId));
        data.put("charts", dashboardService.getCharts(courseId));
        data.put("warnings", dashboardService.getWarnings(courseId));
        return Result.success(data);
    }

    /**
     * 概览统计卡片
     */
    @GetMapping("/overview")
    public Result<DashboardOverviewDTO> overview(@RequestParam Long courseId) {
        return Result.success(dashboardService.getOverview(courseId));
    }

    /**
     * 图表数据
     */
    @GetMapping("/charts")
    public Result<DashboardChartsDTO> charts(@RequestParam Long courseId) {
        return Result.success(dashboardService.getCharts(courseId));
    }

    /**
     * 预警学生列表
     */
    @GetMapping("/warnings")
    public Result<List<WarningStudentDTO>> warnings(@RequestParam Long courseId) {
        return Result.success(dashboardService.getWarnings(courseId));
    }

    /**
     * 教师可选班级列表 (UC27 班级切换器)
     */
    @GetMapping("/courses")
    public Result<List<ClassVO>> myCourses(@RequestAttribute("userId") Long userId) {
        return Result.success(dashboardService.getMyCourses(userId));
    }
}
