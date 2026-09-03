package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.entity.SystemConfig;
import com.example.aitaes.mapper.SystemConfigMapper;
import com.example.aitaes.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 系统配置服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemConfigServiceImpl implements SystemConfigService {

    private final SystemConfigMapper systemConfigMapper;

    @Override
    public Map<String, List<SystemConfig>> getAllGrouped() {
        List<SystemConfig> all = systemConfigMapper.selectList(
                new LambdaQueryWrapper<SystemConfig>()
                        .orderByAsc(SystemConfig::getConfigType, SystemConfig::getConfigKey));
        return all.stream().collect(Collectors.groupingBy(
                config -> config.getConfigType() != null ? config.getConfigType() : "OTHER"));
    }

    @Override
    @Transactional
    public void batchUpdate(Map<String, String> configs) {
        for (Map.Entry<String, String> entry : configs.entrySet()) {
            SystemConfig config = systemConfigMapper.selectOne(
                    new LambdaQueryWrapper<SystemConfig>()
                            .eq(SystemConfig::getConfigKey, entry.getKey()));
            if (config == null) {
                throw new BusinessException(ResultCode.NOT_FOUND.getCode(),
                        "配置项不存在: " + entry.getKey());
            }
            config.setConfigValue(entry.getValue());
            config.setUpdateTime(LocalDateTime.now());
            systemConfigMapper.updateById(config);
        }
        log.info("批量更新系统配置: {} 项", configs.size());
    }
}
