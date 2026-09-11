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
import java.util.LinkedHashMap;
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
        // 密钥永不回传到浏览器；前端只需知道是否已经保存过。
        return all.stream().map(this::maskSensitiveConfig).collect(Collectors.groupingBy(
                config -> config.getConfigType() != null ? config.getConfigType() : "OTHER",
                LinkedHashMap::new, Collectors.toList()));
    }

    @Override
    @Transactional
    public void batchUpdate(Map<String, String> configs) {
        for (Map.Entry<String, String> entry : configs.entrySet()) {
            SystemConfig config = systemConfigMapper.selectOne(
                    new LambdaQueryWrapper<SystemConfig>()
                            .eq(SystemConfig::getConfigKey, entry.getKey()));
            // 新增配置但未填写 Key 时无需创建空记录（数据库该列不可为空）。
            if (config == null && "ai.remote.api_key".equals(entry.getKey())
                    && (entry.getValue() == null || entry.getValue().isBlank())) {
                continue;
            }
            if (config == null && isRemoteAiConfig(entry.getKey())) {
                config = new SystemConfig();
                config.setConfigKey(entry.getKey());
                config.setConfigType(entry.getKey().endsWith("enabled") ? "BOOLEAN" : "STRING");
                config.setDescription(remoteAiDescription(entry.getKey()));
                config.setConfigValue("");
                config.setCreateTime(LocalDateTime.now());
                config.setUpdateTime(LocalDateTime.now());
                systemConfigMapper.insert(config);
            }
            if (config == null) {
                throw new BusinessException(ResultCode.NOT_FOUND.getCode(),
                        "配置项不存在: " + entry.getKey());
            }
            // 空 Key 表示管理员不修改已保存的密钥，避免脱敏回显时意外覆盖。
            if ("ai.remote.api_key".equals(entry.getKey()) && (entry.getValue() == null || entry.getValue().isBlank())) {
                continue;
            }
            config.setConfigValue(entry.getValue());
            config.setUpdateTime(LocalDateTime.now());
            systemConfigMapper.updateById(config);
        }
        log.info("批量更新系统配置: {} 项", configs.size());
    }

    private boolean isRemoteAiConfig(String key) {
        return "ai.remote.enabled".equals(key) || "ai.remote.base_url".equals(key)
                || "ai.remote.api_key".equals(key) || "ai.remote.model".equals(key);
    }

    private String remoteAiDescription(String key) {
        return switch (key) {
            case "ai.remote.enabled" -> "是否启用远程 OpenAI 兼容 API";
            case "ai.remote.base_url" -> "远程 OpenAI 兼容 API 地址";
            case "ai.remote.api_key" -> "远程 OpenAI 兼容 API 密钥";
            case "ai.remote.model" -> "远程模型名称";
            default -> "远程 AI 配置";
        };
    }

    private SystemConfig maskSensitiveConfig(SystemConfig source) {
        SystemConfig copy = new SystemConfig();
        copy.setId(source.getId());
        copy.setConfigKey(source.getConfigKey());
        copy.setConfigValue("ai.remote.api_key".equals(source.getConfigKey())
                ? (source.getConfigValue() == null || source.getConfigValue().isBlank() ? "" : "已设置")
                : source.getConfigValue());
        copy.setConfigType(source.getConfigType());
        copy.setDescription(source.getDescription());
        copy.setCreateTime(source.getCreateTime());
        copy.setUpdateTime(source.getUpdateTime());
        return copy;
    }
}
