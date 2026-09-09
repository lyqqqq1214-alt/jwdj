package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 题库整理判断结果
 * <p>
 * AI 对课程题库进行体检：题型分布、知识点覆盖、疑似重复题、质量评分，
 * 并给出整理建议。规则统计本地计算，AI 判断可选增强。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionBankAuditDTO {

    private Long courseId;

    private Integer total;

    /** AI 生成题数 */
    private Integer aiGenerated;

    /** 待审核题数（DRAFT 状态） */
    private Integer pendingReview;

    /** 题型分布 */
    private List<TypeStat> typeDistribution;

    /** 知识点覆盖情况 */
    private List<KpCoverage> kpCoverage;

    /** 已有题目未覆盖的知识点（空缺知识点） */
    private List<String> uncoveredKps;

    /** 疑似重复题组（题干相同） */
    private List<DuplicateGroup> duplicates;

    /** 平均质量分（1-5，无评分题时为 null） */
    private BigDecimal avgClarity;
    private BigDecimal avgDifficultyMatch;
    private BigDecimal avgAmbiguity;
    private BigDecimal avgKpCoverage;

    /** 难度分布（EASY/MEDIUM/HARD/未标注） */
    private List<DifficultyStat> difficultyDistribution;

    /** 单题问题清单（内容完整性 + 规范性 + 知识点错标） */
    private List<IssueItem> issues;

    /** 从未被组卷使用的题目数（usageCount == 0 或 null） */
    private Integer unusedCount;

    /** 整理建议（规则生成） */
    private List<String> suggestions;

    /** AI 综合判断（外部大模型生成；不可用时为规则文案） */
    private String aiJudgment;

    /** AI 大模型是否可用 */
    private Boolean aiAvailable;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TypeStat {

        /** 题型：SINGLE/MULTI/FILL/SHORT/COMPREHENSIVE */
        private String questionType;

        private Integer count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpCoverage {

        private String kpName;

        /** 涉及该知识点的题目数 */
        private Integer questionCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DuplicateGroup {

        /** 疑似重复的题干 */
        private String stem;

        /** 重复题目ID列表 */
        private List<Long> questionIds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DifficultyStat {

        /** 难度：EASY / MEDIUM / HARD / UNLABELED */
        private String difficulty;

        private Integer count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IssueItem {

        private Long questionId;

        private String questionType;

        /** 截断后的题干 */
        private String stem;

        /** 问题类型：MISSING_STEM / MISSING_OPTIONS / MISSING_ANSWER /
         *  MISSING_ANALYSIS / INVALID_DIFFICULTY / NO_KNOWLEDGE_POINT / UNMATCHED_KNOWLEDGE_POINT */
        private String category;

        /** 补充说明（如未匹配的知识点名） */
        private String detail;
    }
}
