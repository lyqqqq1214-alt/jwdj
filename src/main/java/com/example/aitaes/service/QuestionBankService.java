package com.example.aitaes.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.entity.KnowledgePoint;
import com.example.aitaes.entity.QuestionBank;
import com.example.aitaes.dto.AnalysisGenerateRequest;
import com.example.aitaes.dto.QuestionLabelUpdateRequest;

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
     *
     * @param request 题目内容
     * @return 解析文本
     */
    String generateAnalysis(AnalysisGenerateRequest request);
}
