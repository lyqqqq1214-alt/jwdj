package com.example.aitaes.service;

import com.example.aitaes.entity.SystemConfig;

import java.util.List;
import java.util.Map;

/**
 * 系统配置服务接口
 */
public interface SystemConfigService {

    /**
     * 获取所有配置（按 configType 分组）
     */
    Map<String, List<SystemConfig>> getAllGrouped();

    /**
     * 批量更新配置
     *
     * @param configs key=configKey, value=configValue
     */
    void batchUpdate(Map<String, String> configs);
}
