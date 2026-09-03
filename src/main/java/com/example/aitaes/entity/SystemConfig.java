package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 系统参数配置实体
 * <p>
 * 系统管理员面板2的配置项，如AI模型地址、预警阈值等。
 */
@Data
@TableName("t_system_config")
public class SystemConfig {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 配置键 */
    private String configKey;

    /** 配置值 */
    private String configValue;

    /** 配置类型：STRING/INT/BOOLEAN/JSON */
    private String configType;

    /** 配置说明 */
    private String description;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
