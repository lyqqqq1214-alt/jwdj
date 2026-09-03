package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 扣分知识点明细实体 ⭐学生画像核心支撑表
 * <p>
 * 每一行 = 某学生在某次考核的某道题上，因为某个知识点而扣分。
 * 通过汇总该表可精确计算每个学生对每个知识点的掌握程度。
 */
@Data
@TableName("t_record_kp_deduction")
public class RecordKpDeduction {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 成绩记录ID */
    private Long recordId;

    /** 题号（第X题，从1开始） */
    private Integer questionNo;

    /** 该题得分 */
    private BigDecimal questionScore;

    /** 该题满分 */
    private BigDecimal maxScore;

    /** 扣分涉及的知识点 */
    private String deductionKp;

    /** 扣分方面（概念混淆/计算错误/协议机制理解/审题偏差） */
    private String deductionAspect;

    /** 详细扣分说明 */
    private String deductionDetail;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
