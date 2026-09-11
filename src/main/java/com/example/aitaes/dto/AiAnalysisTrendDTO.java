package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * AI 分析数据变化对比（两次报告之间的差异）
 * <p>
 * 教师可直观看到数据更新的变化：到课率、成绩、知识点掌握、预警名单的增减。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalysisTrendDTO {

    private Long courseId;
    private String courseName;

    /** 本次报告生成时间 */
    private String currentTime;
    /** 上次报告生成时间（null 表示首次生成，无对比基准） */
    private String previousTime;

    /** 是否有历史数据可对比 */
    private Boolean hasPrevious;

    /** 到课率变化 */
    private MetricChange attendanceChange;
    /** 平均分变化 */
    private MetricChange avgScoreChange;
    /** 预警学生数变化 */
    private MetricChange riskStudentCountChange;
    /** 需再讲知识点数变化 */
    private MetricChange reteachKpCountChange;

    /** 知识点掌握率变化明细 */
    private List<KpMasteryChange> kpChanges;

    /** 新增预警学生 */
    private List<String> newRiskStudents;
    /** 解除预警学生 */
    private List<String> recoveredStudents;

    /** 数据变化总结 */
    private String summary;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricChange {
        /** 当前值 */
        private BigDecimal current;
        /** 上次值 */
        private BigDecimal previous;
        /** 变化量（current - previous） */
        private BigDecimal delta;
        /** 变化趋势：UP / DOWN / SAME */
        private String trend;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpMasteryChange {
        private String kpName;
        private BigDecimal currentRate;
        private BigDecimal previousRate;
        private BigDecimal delta;
        private String trend;
    }
}
