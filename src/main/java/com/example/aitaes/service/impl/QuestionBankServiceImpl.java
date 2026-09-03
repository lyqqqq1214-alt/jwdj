package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.entity.KnowledgePoint;
import com.example.aitaes.entity.QuestionBank;
import com.example.aitaes.entity.Teacher;
import com.example.aitaes.mapper.KnowledgePointMapper;
import com.example.aitaes.mapper.QuestionBankMapper;
import com.example.aitaes.mapper.TeacherMapper;
import com.example.aitaes.service.QuestionBankService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 题库管理服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionBankServiceImpl implements QuestionBankService {

    private final QuestionBankMapper questionBankMapper;
    private final KnowledgePointMapper knowledgePointMapper;
    private final TeacherMapper teacherMapper;

    @Override
    public IPage<QuestionBank> page(int pageNum, int pageSize, Long courseId,
                                     String questionType, String difficulty, String keyword) {
        LambdaQueryWrapper<QuestionBank> wrapper = new LambdaQueryWrapper<>();
        if (courseId != null) {
            wrapper.eq(QuestionBank::getCourseId, courseId);
        }
        if (StringUtils.hasText(questionType)) {
            wrapper.eq(QuestionBank::getQuestionType, questionType);
        }
        if (StringUtils.hasText(difficulty)) {
            wrapper.eq(QuestionBank::getDifficulty, difficulty);
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.like(QuestionBank::getContent, keyword);
        }
        wrapper.orderByDesc(QuestionBank::getCreateTime);
        return questionBankMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public QuestionBank getById(Long id) {
        QuestionBank q = questionBankMapper.selectById(id);
        if (q == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "题目不存在");
        }
        return q;
    }

    @Override
    public QuestionBank create(Long userId, QuestionBank entity) {
        // 解析 userId → teacherId
        Teacher teacher = teacherMapper.selectOne(
                new LambdaQueryWrapper<Teacher>()
                        .eq(Teacher::getUserId, userId));
        if (teacher == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "教师不存在");
        }
        entity.setTeacherId(teacher.getId());
        entity.setUsageCount(0);
        if (!StringUtils.hasText(entity.getStatus())) {
            entity.setStatus("DRAFT");
        }
        questionBankMapper.insert(entity);
        log.info("新增题目: id={}, type={}", entity.getId(), entity.getQuestionType());
        return entity;
    }

    @Override
    public QuestionBank update(Long id, QuestionBank entity) {
        QuestionBank existing = getById(id);
        entity.setId(id);
        entity.setCreateTime(existing.getCreateTime());
        questionBankMapper.updateById(entity);
        log.info("更新题目: id={}", id);
        return getById(id);
    }

    @Override
    public void delete(Long id) {
        getById(id);
        questionBankMapper.deleteById(id);
        log.info("删除题目: id={}", id);
    }

    @Override
    public List<KnowledgePoint> getKnowledgeTree(Long courseId) {
        return knowledgePointMapper.selectList(
                new LambdaQueryWrapper<KnowledgePoint>()
                        .eq(KnowledgePoint::getCourseId, courseId)
                        .orderByAsc(KnowledgePoint::getSortOrder));
    }
}
