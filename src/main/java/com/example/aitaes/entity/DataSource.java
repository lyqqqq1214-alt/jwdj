package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 数据源配置 - 支持多种外部数据源导入
 */
@Data
@TableName("t_data_source")
public class DataSource {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 数据源名称 */
    private String sourceName;

    /** 数据源类型：EXCEL / TXT / CSV / DB / API */
    private String sourceType;

    /** 文件路径（Excel/Txt/Csv文件） */
    private String filePath;

    /** 数据源说明 */
    private String description;

    /** 状态：ACTIVE / INACTIVE */
    private String status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
