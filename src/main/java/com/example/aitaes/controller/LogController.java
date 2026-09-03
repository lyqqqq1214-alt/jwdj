package com.example.aitaes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.aitaes.annotation.RequireRole;
import com.example.aitaes.common.Result;
import com.example.aitaes.entity.OperationLog;
import com.example.aitaes.mapper.OperationLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

/**
 * 操作日志查询控制器（仅管理员）
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/logs")
@RequiredArgsConstructor
@RequireRole("ADMIN")
public class LogController {

    private final OperationLogMapper operationLogMapper;

    /**
     * 分页查询操作日志
     */
    @GetMapping
    public Result<IPage<OperationLog>> list(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String logType,
            @RequestParam(required = false) String username) {
        LambdaQueryWrapper<OperationLog> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(logType)) {
            wrapper.eq(OperationLog::getLogType, logType);
        }
        if (StringUtils.hasText(username)) {
            wrapper.eq(OperationLog::getUsername, username);
        }
        wrapper.orderByDesc(OperationLog::getCreateTime);
        return Result.success(operationLogMapper.selectPage(new Page<>(pageNum, pageSize), wrapper));
    }
}
