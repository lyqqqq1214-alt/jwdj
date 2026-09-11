package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.entity.KnowledgePoint;
import com.example.aitaes.entity.QuestionBank;
import com.example.aitaes.entity.Teacher;
import com.example.aitaes.dto.AnalysisGenerateRequest;
import com.example.aitaes.dto.AiGeneratedQuestionDTO;
import com.example.aitaes.dto.AiQuestionGenerateRequest;
import com.example.aitaes.dto.QuestionLabelUpdateRequest;
import com.example.aitaes.mapper.KnowledgePointMapper;
import com.example.aitaes.mapper.QuestionBankMapper;
import com.example.aitaes.mapper.TeacherMapper;
import com.example.aitaes.service.OllamaService;
import com.example.aitaes.service.QuestionBankService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private final OllamaService ollamaService;
    private final ObjectMapper objectMapper = new ObjectMapper();

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
    public QuestionBank updateLabels(Long id, Long userId, QuestionLabelUpdateRequest request) {
        QuestionBank existing = getById(id);
        Teacher teacher = teacherMapper.selectOne(new LambdaQueryWrapper<Teacher>()
                .eq(Teacher::getUserId, userId));
        if (teacher == null || !teacher.getId().equals(existing.getTeacherId())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "无权编辑该题目标签");
        }
        existing.setKnowledgePoints(normalizeKnowledgePoints(request.getKnowledgePoints()));
        existing.setDifficulty(request.getDifficulty());
        questionBankMapper.updateById(existing);
        return existing;
    }

    private String normalizeKnowledgePoints(String source) {
        List<String> tags = java.util.Arrays.stream(source.split("[,，、]"))
                .map(String::trim).filter(StringUtils::hasText).distinct().limit(3).toList();
        if (tags.isEmpty()) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "至少需要一个知识点标签");
        }
        if (tags.stream().anyMatch(tag -> !tag.matches("[^/]+/[^/]+"))) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "知识点必须使用“一级模块/二级知识点”格式");
        }
        return String.join(",", tags);
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

    @Override
    public String generateAnalysis(AnalysisGenerateRequest request) {
        if (request == null || !StringUtils.hasText(request.getStem())
                || !StringUtils.hasText(request.getAnswer())) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "题干和答案不能为空");
        }
        String analysis = ollamaService.generate(buildAnalysisPrompt(request));
        return analysis == null ? "" : analysis.trim();
    }

    private String buildAnalysisPrompt(AnalysisGenerateRequest request) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("你是一名资深教师，请为下面这道题目撰写简洁、准确的解析。\n\n");
        prompt.append("【题型】").append(StringUtils.hasText(request.getQuestionType())
                ? request.getQuestionType() : "未指定").append("\n");
        prompt.append("【难度】").append(StringUtils.hasText(request.getDifficulty())
                ? request.getDifficulty() : "未指定").append("\n");
        prompt.append("【知识点】").append(StringUtils.hasText(request.getKnowledgePoints())
                ? request.getKnowledgePoints() : "未指定").append("\n");
        prompt.append("【题干】").append(request.getStem()).append("\n");
        boolean hasOptions = request.getOptions() != null && !request.getOptions().isEmpty();
        if (hasOptions) {
            prompt.append("【选项】\n");
            request.getOptions().forEach((k, v) -> prompt.append(k).append(". ").append(v).append("\n"));
        }
        prompt.append("【答案】").append(request.getAnswer()).append("\n\n");
        prompt.append("请直接返回解析正文：说明解题思路、该答案为何正确");
        if (hasOptions) {
            prompt.append("、其他选项为何不正确");
        }
        prompt.append("。不要输出任何额外说明、标题或代码块标记。");
        return prompt.toString();
    }

    // ─── 批量自动补全解析 ────────────────────────────────────────────────────

    @Override
    public BatchAnalysisResult batchGenerateAnalysis(Long courseId) {
        List<QuestionBank> questions = questionBankMapper.selectList(
                new LambdaQueryWrapper<QuestionBank>().eq(QuestionBank::getCourseId, courseId));

        int total = 0, success = 0, failed = 0;
        List<Long> failedIds = new ArrayList<>();

        for (QuestionBank q : questions) {
            try {
                JsonNode content = objectMapper.readTree(q.getContent());
                // 已有解析则跳过
                if (hasText(content, "analysis") || hasText(content, "explanation")) {
                    continue;
                }
                total++;

                AnalysisGenerateRequest req = buildRequestFromQuestion(q, content);
                String analysis = generateAnalysis(req);
                if (analysis == null || analysis.isBlank()) {
                    failed++;
                    failedIds.add(q.getId());
                    continue;
                }

                ((ObjectNode) content).put("analysis", analysis);
                q.setContent(objectMapper.writeValueAsString(content));
                questionBankMapper.updateById(q);
                success++;
            } catch (Exception e) {
                failed++;
                failedIds.add(q.getId());
                log.warn("题目 {} 解析补全失败: {}", q.getId(), e.getMessage());
            }
        }

        return BatchAnalysisResult.builder()
                .total(total).success(success).failed(failed).failedIds(failedIds).build();
    }

    private boolean hasText(JsonNode node, String key) {
        if (node == null || !node.isObject()) return false;
        JsonNode v = node.get(key);
        return v != null && v.isTextual() && !v.asText().isBlank();
    }

    private AnalysisGenerateRequest buildRequestFromQuestion(QuestionBank q, JsonNode content) {
        AnalysisGenerateRequest req = new AnalysisGenerateRequest();
        req.setQuestionType(q.getQuestionType());
        req.setDifficulty(q.getDifficulty());
        req.setKnowledgePoints(q.getKnowledgePoints());
        req.setStem(content.path("stem").asText(""));
        req.setAnswer(content.path("answer").asText(""));
        JsonNode opts = content.get("options");
        if (opts != null && opts.isObject()) {
            Map<String, String> options = new java.util.HashMap<>();
            opts.fields().forEachRemaining(e -> options.put(e.getKey(), e.getValue().asText()));
            req.setOptions(options);
        }
        return req;
    }

    // ─── 根据未覆盖知识点自动补全题目 ────────────────────────────────────────

    @Override
    public AutoGenerateResult autoGenerateForUncoveredKps(Long courseId, Integer countPerKp, Long teacherId) {
        int perKp = (countPerKp == null || countPerKp <= 0) ? 2 : countPerKp;

        // 1. 课程所有知识点（取叶子节点 level=3，或全部）
        List<KnowledgePoint> allKps = knowledgePointMapper.selectList(
                new LambdaQueryWrapper<KnowledgePoint>()
                        .eq(KnowledgePoint::getCourseId, courseId)
                        .eq(KnowledgePoint::getDeleted, 0));

        // 2. 题库中已覆盖的知识点集合
        List<QuestionBank> questions = questionBankMapper.selectList(
                new LambdaQueryWrapper<QuestionBank>().eq(QuestionBank::getCourseId, courseId));
        Set<String> coveredKps = new HashSet<>();
        for (QuestionBank q : questions) {
            if (StringUtils.hasText(q.getKnowledgePoints())) {
                for (String kp : q.getKnowledgePoints().split(",")) {
                    coveredKps.add(kp.trim());
                }
            }
        }

        // 3. 未覆盖的知识点
        List<String> uncovered = allKps.stream()
                .map(KnowledgePoint::getKpName)
                .filter(name -> name != null && !coveredKps.contains(name))
                .distinct()
                .toList();

        if (uncovered.isEmpty()) {
            return AutoGenerateResult.builder()
                    .uncoveredKpCount(0).generatedCount(0)
                    .uncoveredKpNames(List.of()).failedKpNames(List.of())
                    .build();
        }

        // 4. 为每个未覆盖知识点生成题目
        int generated = 0;
        List<String> failed = new ArrayList<>();
        for (String kpName : uncovered) {
            try {
                AiQuestionGenerateRequest req = AiQuestionGenerateRequest.builder()
                        .knowledgePoints(List.of(kpName))
                        .questionType("SINGLE")
                        .count(perKp)
                        .difficulty("MEDIUM")
                        .socraticMode(false)
                        .build();
                List<AiGeneratedQuestionDTO> generatedQs = ollamaService.generateQuestions(req);
                if (generatedQs == null || generatedQs.isEmpty()) {
                    failed.add(kpName);
                    continue;
                }
                for (AiGeneratedQuestionDTO gq : generatedQs) {
                    saveGeneratedQuestion(courseId, teacherId, kpName, gq);
                    generated++;
                }
            } catch (Exception e) {
                failed.add(kpName);
                log.warn("知识点 {} 自动出题失败: {}", kpName, e.getMessage());
            }
        }

        return AutoGenerateResult.builder()
                .uncoveredKpCount(uncovered.size())
                .generatedCount(generated)
                .uncoveredKpNames(uncovered)
                .failedKpNames(failed)
                .build();
    }

    private void saveGeneratedQuestion(Long courseId, Long teacherId, String kpName, AiGeneratedQuestionDTO gq) {
        try {
            ObjectNode content = objectMapper.createObjectNode();
            content.put("stem", gq.getStem() != null ? gq.getStem() : "");
            content.put("answer", gq.getAnswer() != null ? gq.getAnswer() : "");
            content.put("analysis", gq.getExplanation() != null ? gq.getExplanation() : "");
            if (gq.getOptions() != null && !gq.getOptions().isEmpty()) {
                ObjectNode opts = objectMapper.createObjectNode();
                gq.getOptions().forEach(opts::put);
                content.set("options", opts);
            }

            QuestionBank qb = new QuestionBank();
            qb.setCourseId(courseId);
            qb.setTeacherId(teacherId);
            qb.setQuestionType(gq.getQuestionType() != null ? gq.getQuestionType() : "SINGLE");
            qb.setDifficulty("MEDIUM");
            qb.setContent(objectMapper.writeValueAsString(content));
            qb.setKnowledgePoints(kpName);
            qb.setAiGenerated(1);
            qb.setUsageCount(0);
            qb.setStatus("APPROVED");
            questionBankMapper.insert(qb);
        } catch (Exception e) {
            log.warn("保存AI生成题目失败: {}", e.getMessage());
        }
    }
}
