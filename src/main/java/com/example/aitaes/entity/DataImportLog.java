package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 数据导入日志 - 记录每次数据导入的详细情况
 */
@Data
@TableName("t_data_import_log")
public class DataImportLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 数据源ID */
    private Long sourceId;

    /** 导入文件名 */
    private String fileName;

    /** 导入类型：TEACHER / STUDENT / COURSE / SCORE / INDICATOR */
    private String importType;

    /** 总行数 */
    private Integer totalRows;

    /** 成功行数 */
    private Integer successRows;

    /** 失败行数 */
    private Integer failRows;

    /** 状态：SUCCESS / PARTIAL / FAILED */
    private String status;

    /** 错误信息 */
    private String errorMsg;

    /** 导入时间 */
    private LocalDateTime importTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
