package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * AI 智能分析报告（模块化）
 * <p>
 * 面向教师的自动分析结果：到课率短板、知识点再讲建议、学生综合预警、
 * 作业/考试成绩分析、教学评价反馈。无交互问答，一键生成。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalysisReportDTO {

    private Long courseId;
    private String courseName;
    private String semester;
    private String generatedAt;

    /** AI 总评（外部大模型生成；不可用时为规则总结文案） */
    private String aiSummary;

    /** AI 大模型是否可用（false 时 aiSummary 为本地规则生成） */
    private Boolean aiAvailable;

    /** 模块一：到课率短板分析（含班级平均参考项） */
    private AttendanceModule attendance;

    /** 模块二：知识点再讲建议 */
    private List<KpAdvice> knowledge;

    /** 模块三：学生综合预警名单（整合考勤/作业/考试） */
    private List<StudentRisk> alerts;

    /** 模块四：作业/考试成绩分析 */
    private List<AssessmentStat> scores;

    /** 模块五：教学评价反馈（考核暴露的薄弱点聚合） */
    private List<KpFeedback> feedback;

    /** 到课率模块 */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceModule {

        /** 参考项：班级平均到课率（%） */
        private BigDecimal classAvgRate;

        /** 到课率升序的学生明细 */
        private List<StudentAttendance> students;
    }

    /** 学生到课率明细 */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentAttendance {

        private Long studentId;
        private String studentNo;
        private String name;

        private Integer presentCount;
        private Integer lateCount;
        private Integer leaveCount;
        private Integer absentCount;

        /** 到课率 = 出勤次数 / 应到总次数 × 100 */
        private BigDecimal attendanceRate;

        /** 等级：正常 / 关注 / 预警 */
        private String level;
    }

    /** 知识点再讲建议 */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpAdvice {

        private String kpName;

        /** 参考项：该知识点班级平均掌握率（%） */
        private BigDecimal classAvgRate;

        /** 涉及学生数 */
        private Integer studentCount;

        /** 掌握率低于 60% 的学生数 */
        private Integer weakStudentCount;

        /** 建议：RETEACH(重点再讲) / REINFORCE(建议巩固) / OK(掌握良好) */
        private String suggestion;
    }

    /** 学生综合风险（整合到课率、作业、考试） */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentRisk {

        private Long studentId;
        private String studentNo;
        private String name;

        private BigDecimal attendanceRate;
        private BigDecimal homeworkAvg;
        private BigDecimal examAvg;

        /** 风险等级：HIGH / MEDIUM */
        private String riskLevel;

        /** 风险原因列表 */
        private List<String> reasons;
    }

    /** 单次考核成绩统计 */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssessmentStat {

        private Long assessmentId;
        private String assessmentName;

        /** 考核类型：HOMEWORK/QUIZ/EXPERIMENT/MIDTERM/FINAL */
        private String assessmentType;

        private BigDecimal totalScore;
        private BigDecimal avgScore;

        /** 得分率 = avgScore / totalScore × 100（参考项） */
        private BigDecimal scoreRate;

        /** 缺考/未交人数 */
        private Integer absentCount;

        /** 得分率低于 60% 的学生数 */
        private Integer lowScoreCount;
    }

    /** 教学评价反馈（考核暴露的薄弱知识点/方面） */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpFeedback {

        /** 薄弱知识点（weakestKp 聚合） */
        private String kpName;

        /** 出现次数（多少人次在该知识点失分） */
        private Integer count;

        /** 典型薄弱方面（如"计算能力"/"概念理解"） */
        private String aspect;
    }
}
