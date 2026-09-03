package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 课程知识点实体
 * <p>
 * 每个课程拥有独立的知识点树，支持三层级结构（章→节→具体知识点）。
 * 学生画像雷达图、扣分分析、AI出题都依赖此表。
 */
@Data
@TableName("t_knowledge_point")
public class KnowledgePoint {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属课程ID */
    private Long courseId;

    /** 知识点名称（如"TCP三次握手"） */
    private String kpName;

    /** 知识点分类/章节（如"第5章 传输层"） */
    private String kpCategory;

    /** 父知识点ID，支持层级 */
    private Long parentId;

    /** 层级：1=章, 2=节, 3=具体知识点 */
    private Integer level;

    /** 难度：EASY/MEDIUM/HARD */
    private String difficulty;

    /** 知识点说明 */
    private String description;

    /** 排序号 */
    private Integer sortOrder;

    private LocalDateTime createTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
