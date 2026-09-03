package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 助教权限配置实体
 * <p>
 * 一条记录 = 一个助教在一个课程中的一项权限。
 */
@Data
@TableName("t_assistant_permission")
public class AssistantPermission {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 助教ID */
    private Long assistantId;

    /** 课程ID */
    private Long courseId;

    /** 是否可查看班级数据 */
    private Integer canViewData;

    /** 是否允许导入数据 */
    private Integer canImportData;

    /** 是否允许批阅 */
    private Integer canGrade;

    /** 是否允许查看学生画像 */
    private Integer canViewPortrait;

    private LocalDateTime createTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
