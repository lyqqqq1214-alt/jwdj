package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 学生知识点掌握度实体（计算缓存）
 * <p>
 * 每次导入新数据后自动汇总 {@link RecordKpDeduction} 计算掌握率。
 * 掌握率 = MAX(0, 100 - (总扣分 / 涉及该知识点的总分) × 100)
 */
@Data
@TableName("t_student_kp_mastery")
public class StudentKpMastery {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 学生ID */
    private Long studentId;

    /** 课程ID */
    private Long courseId;

    /** 知识点名称 */
    private String kpName;

    /** 个人掌握率（0-100，如85.00表示85%） */
    private BigDecimal masteryRate;

    /** 班级平均掌握率（雷达图对比虚线） */
    private BigDecimal classAvgRate;

    /** 扣分次数 */
    private Integer loseCount;

    /** 涉及该知识点的总题目数 */
    private Integer totalQuestionCount;

    /** 最近一次涉及该知识点的考核ID */
    private Long lastAssessmentId;

    /** 更新时间 */
    private LocalDateTime lastUpdated;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
