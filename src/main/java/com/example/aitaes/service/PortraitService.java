package com.example.aitaes.service;

import com.example.aitaes.dto.ChartItem;
import com.example.aitaes.dto.StudentProfileVO;

import java.util.List;

/**
 * 学生画像服务接口
 */
public interface PortraitService {

    /**
     * 获取学生完整画像
     */
    StudentProfileVO getProfile(Long studentId, Long courseId);

    /**
     * 标记/取消重点关注学生 (UC08)
     */
    void toggleFocus(Long studentId, Long courseId, boolean focus);

    /**
     * AI 综合评价
     */
    String generateAiEvaluation(Long studentId, Long courseId);

    /**
     * AI 学习建议
     */
    String generateAiSuggestions(Long studentId, Long courseId);
}
