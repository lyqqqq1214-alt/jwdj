package com.example.aitaes.controller;

import com.example.aitaes.annotation.RequireRole;
import com.example.aitaes.common.Result;
import com.example.aitaes.entity.SystemConfig;
import com.example.aitaes.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 系统参数配置控制器（仅系统管理员可访问）
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/configs")
@RequiredArgsConstructor
@RequireRole("ADMIN")
public class SystemConfigController {

    private final SystemConfigService systemConfigService;

    /**
     * 获取所有配置（按类型分组）
     */
    @GetMapping
    public Result<Map<String, List<SystemConfig>>> getAll() {
        return Result.success(systemConfigService.getAllGrouped());
    }

    /**
     * 批量更新配置
     */
    @PutMapping
    public Result<Void> batchUpdate(@RequestBody Map<String, String> configs) {
        systemConfigService.batchUpdate(configs);
        return Result.success("配置已保存", null);
    }
}
