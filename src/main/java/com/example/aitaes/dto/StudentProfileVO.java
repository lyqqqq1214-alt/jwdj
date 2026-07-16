package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 学生画像完整返回对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfileVO {

    /** 基本信息 */
    private Long studentId;
    private String studentNo;
    private String name;
    private String gender;
    private String college;
    private String major;
    private String className;
    private String grade;
    private String avatar;
    private Boolean isFocus;

    /** 成绩概览 */
    private List<TrendDTO> scoreTrendList;

    /** 考勤记录列表 */
    private List<AttendanceItem> attendanceList;
    private BigDecimal attendanceRate;
    /** 考勤统计 */
    private Long absentCount;
    private Long lateCount;
    private Long leaveCount;

    /** 作业情况列表 */
    private List<HomeworkItem> homeworkList;

    /** 实验报告列表 */
    private List<ExperimentItem> experimentList;

    /** 知识点掌握度 */
    private List<ChartItem> knowledgeRadar;
    private List<ChartItem> classAvgRadar;

    /** AI 综合评价（预留，AI 同学实现） */
    private String aiEvaluation;

    // ===== 内嵌类 =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceItem {
        private LocalDateTime date;
        private String status;
        private Integer weekNo;
        private String remark;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HomeworkItem {
        private String name;
        private BigDecimal score;
        private String submitStatus;
        private LocalDateTime submitTime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExperimentItem {
        private String name;
        private Integer experimentNo;
        private BigDecimal score;
        private LocalDateTime submitTime;
    }
}
