package com.example.aitaes.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.entity.KnowledgePoint;
import com.example.aitaes.entity.QuestionBank;

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

    /**
     * 删除题目
     */
    void delete(Long id);

    /**
     * 知识点树形结构
     */
    List<KnowledgePoint> getKnowledgeTree(Long courseId);
}
