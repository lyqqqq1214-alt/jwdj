package com.example.aitaes.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.entity.KnowledgePoint;
import com.example.aitaes.entity.QuestionBank;
import com.example.aitaes.dto.AnalysisGenerateRequest;
import com.example.aitaes.dto.QuestionLabelUpdateRequest;
import com.example.aitaes.dto.AnalysisConfirmRequest;
import com.example.aitaes.dto.AutoGenerateConfirmRequest;
import com.example.aitaes.dto.AiGeneratedQuestionDTO;

import java.util.List;

/**
 * 题库管理服务接口
 */
public interface QuestionBankService {

    /**
     * 分页查询题库
     */
    IPage<QuestionBank> page(int pageNum, int pageSize, Long courseId,
                             String questionType, String difficulty, String keyword);

    /**
     * 题目详情
     */
    QuestionBank getById(Long id);

    /**
     * 新增题目
     */
    QuestionBank create(Long userId, QuestionBank entity);

    /**
     * 更新题目
     */
    QuestionBank update(Long id, QuestionBank entity);

    /** 仅更新教师题库中题目的知识点与难度标签，避免编辑标签时覆盖题干和答案。 */
    QuestionBank updateLabels(Long id, Long userId, QuestionLabelUpdateRequest request);

    /**
     * 删除题目
     */
    void delete(Long id);

    /**
     * 知识点树形结构
     */
    List<KnowledgePoint> getKnowledgeTree(Long courseId);

    /**
     * 根据题目内容调用 AI 生成解析文本
     */
    String generateAnalysis(AnalysisGenerateRequest request);

    /**
     * 批量为缺少解析的题目自动补全 AI 解析
     * <p>
     * 扫描课程下所有题目，对 content JSON 中 analysis/explanation 为空的题目，
     * 调用 AI 生成解析并写回 content。
     *
     * @param courseId 课程ID
     * @return 补全结果：总数、成功数、失败数、失败题目ID列表
     */
    BatchAnalysisResult batchGenerateAnalysis(Long courseId, Long userId, Integer limit);

    int confirmAnalyses(Long courseId, Long userId, AnalysisConfirmRequest request);

    /**
     * 根据未覆盖知识点自动补全题目
     * <p>
     * 扫描课程知识点树，找出题库中尚未覆盖的知识点，调用 AI 生成题目并入库。
     *
     * @param courseId   课程ID
     * @param countPerKp 每个未覆盖知识点生成的题目数
     * @param userId  当前登录教师/助教用户ID（服务内解析为所属教师ID）
     * @return 补全结果
     */
    AutoGenerateResult autoGenerateForUncoveredKps(Long courseId, Integer countPerKp,
                                                    String questionType, String difficulty,
                                                    Integer maxKnowledgePoints, Long userId);

    int confirmGeneratedQuestions(Long courseId, Long userId, AutoGenerateConfirmRequest request);

    /** 自动补全题目结果 */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    class AutoGenerateResult {
        private int uncoveredKpCount;
        private int generatedCount;
        private java.util.List<String> uncoveredKpNames;
        private java.util.List<String> failedKpNames;
        private java.util.List<String> skippedKpNames;
        /** AI 已生成、等待教师审核的题目，不会在预览阶段入库。 */
        private java.util.List<AiGeneratedQuestionDTO> previewQuestions;
    }

    /**
     * 批量补全解析结果
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    class BatchAnalysisResult {
        private int total;
        private int success;
        private int failed;
        private java.util.List<Long> failedIds;
        private int remaining;
        /** AI 已生成、等待教师审核的解析，不会在预览阶段写回题库。 */
        private java.util.List<AnalysisPreviewItem> previewItems;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    class AnalysisPreviewItem {
        private Long questionId;
        private String stem;
        private String answer;
        private String analysis;
    }
}
