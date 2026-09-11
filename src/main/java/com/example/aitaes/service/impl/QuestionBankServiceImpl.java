package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.entity.KnowledgePoint;
import com.example.aitaes.entity.QuestionBank;
import com.example.aitaes.entity.Teacher;
import com.example.aitaes.entity.TeachingAssistant;
import com.example.aitaes.entity.User;
import com.example.aitaes.entity.Course;
import com.example.aitaes.dto.AnalysisGenerateRequest;
import com.example.aitaes.dto.AiGeneratedQuestionDTO;
import com.example.aitaes.dto.AiQuestionGenerateRequest;
import com.example.aitaes.dto.QuestionLabelUpdateRequest;
import com.example.aitaes.dto.AnalysisConfirmRequest;
import com.example.aitaes.dto.AutoGenerateConfirmRequest;
import com.example.aitaes.mapper.KnowledgePointMapper;
import com.example.aitaes.mapper.QuestionBankMapper;
import com.example.aitaes.mapper.TeacherMapper;
import com.example.aitaes.mapper.TeachingAssistantMapper;
import com.example.aitaes.mapper.UserMapper;
import com.example.aitaes.mapper.CourseMapper;
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
    private final TeachingAssistantMapper teachingAssistantMapper;
    private final UserMapper userMapper;
    private final CourseMapper courseMapper;
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
    public BatchAnalysisResult batchGenerateAnalysis(Long courseId, Long userId, Integer limit) {
        ensureCourseAccess(courseId, userId);
        int batchSize = Math.min(Math.max(limit == null ? 10 : limit, 1), 20);
        List<QuestionBank> questions = questionBankMapper.selectList(
                new LambdaQueryWrapper<QuestionBank>().eq(QuestionBank::getCourseId, courseId));

        int total = 0, success = 0, failed = 0;
        List<Long> failedIds = new ArrayList<>();
        List<QuestionBankService.AnalysisPreviewItem> previews = new ArrayList<>();

        for (QuestionBank q : questions) {
            if (total >= batchSize) break;
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

                previews.add(QuestionBankService.AnalysisPreviewItem.builder()
                        .questionId(q.getId()).stem(firstText(content, "stem", "question", "title", "questionStem"))
                        .answer(firstText(content, "answer", "correctAnswer", "referenceAnswer"))
                        .analysis(analysis).build());
                success++;
            } catch (Exception e) {
                failed++;
                failedIds.add(q.getId());
                log.warn("题目 {} 解析补全失败: {}", q.getId(), e.getMessage());
            }
        }

        int remaining = (int) questions.stream().filter(q -> {
            try {
                JsonNode content = objectMapper.readTree(q.getContent());
                return !hasText(content, "analysis") && !hasText(content, "explanation");
            } catch (Exception ignored) {
                return false;
            }
        }).count() - total;

        return BatchAnalysisResult.builder()
                .total(total).success(success).failed(failed).failedIds(failedIds)
                .remaining(Math.max(0, remaining)).previewItems(previews).build();
    }

    @Override
    public int confirmAnalyses(Long courseId, Long userId, AnalysisConfirmRequest request) {
        ensureCourseAccess(courseId, userId);
        int saved = 0;
        for (AnalysisConfirmRequest.Item item : request.getItems()) {
            if (item == null || item.getQuestionId() == null || !StringUtils.hasText(item.getAnalysis())) continue;
            QuestionBank question = questionBankMapper.selectById(item.getQuestionId());
            if (question == null || !courseId.equals(question.getCourseId())) continue;
            try {
                JsonNode parsed = objectMapper.readTree(question.getContent());
                if (!(parsed instanceof ObjectNode content)) continue;
                content.put("analysis", item.getAnalysis().trim());
                question.setContent(objectMapper.writeValueAsString(content));
                questionBankMapper.updateById(question);
                saved++;
            } catch (Exception ex) {
                log.warn("确认解析写入失败, questionId={}: {}", item.getQuestionId(), ex.getMessage());
            }
        }
        if (saved == 0) throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "没有可写入的解析");
        return saved;
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
        req.setStem(firstText(content, "stem", "question", "title", "questionStem"));
        req.setAnswer(firstText(content, "answer", "correctAnswer", "referenceAnswer"));
        JsonNode opts = content.get("options");
        if (opts != null && opts.isObject()) {
            Map<String, String> options = new java.util.HashMap<>();
            opts.fields().forEachRemaining(e -> options.put(e.getKey(), e.getValue().asText()));
            req.setOptions(options);
        }
        return req;
    }

    private String firstText(JsonNode content, String... keys) {
        for (String key : keys) {
            String value = content.path(key).asText("").trim();
            if (StringUtils.hasText(value)) return value;
        }
        return "";
    }

    // ─── 根据未覆盖知识点自动补全题目 ────────────────────────────────────────

    @Override
    public AutoGenerateResult autoGenerateForUncoveredKps(Long courseId, Integer countPerKp,
                                                            String questionType, String difficulty,
                                                            Integer maxKnowledgePoints, Long userId) {
        Long teacherId = ensureCourseAccess(courseId, userId);
        int perKp = (countPerKp == null || countPerKp <= 0) ? 2 : countPerKp;
        perKp = Math.min(perKp, 5);
        int maxKps = Math.min(Math.max(maxKnowledgePoints == null ? 10 : maxKnowledgePoints, 1), 20);
        String requestedType = normalizeBankQuestionType(questionType);
        String requestedDifficulty = normalizeDifficulty(difficulty);

        // 1. 课程所有可考查知识点：优先叶子节点，避免把“第1章”等目录误认为空缺知识点。
        List<KnowledgePoint> allKps = knowledgePointMapper.selectList(
                new LambdaQueryWrapper<KnowledgePoint>()
                        .eq(KnowledgePoint::getCourseId, courseId)
                        .eq(KnowledgePoint::getDeleted, 0));

        Set<Long> parentIds = allKps.stream().map(KnowledgePoint::getParentId)
                .filter(java.util.Objects::nonNull).collect(Collectors.toSet());
        List<KnowledgePoint> leafKps = allKps.stream()
                .filter(kp -> !parentIds.contains(kp.getId()))
                .filter(kp -> StringUtils.hasText(kp.getKpName()))
                .toList();
        List<KnowledgePoint> targetKps = leafKps.isEmpty() ? allKps : leafKps;

        // 2. 题库中已覆盖的知识点集合，兼容“一级模块/二级知识点”和逗号分隔标签。
        List<QuestionBank> questions = questionBankMapper.selectList(
                new LambdaQueryWrapper<QuestionBank>().eq(QuestionBank::getCourseId, courseId));
        Set<String> coveredKps = new HashSet<>();
        for (QuestionBank q : questions) {
            if (StringUtils.hasText(q.getKnowledgePoints())) {
                for (String kp : q.getKnowledgePoints().split(",")) {
                    String normalized = kp.trim();
                    if (StringUtils.hasText(normalized)) {
                        coveredKps.add(normalized);
                        int slash = normalized.lastIndexOf('/');
                        if (slash >= 0 && slash < normalized.length() - 1) coveredKps.add(normalized.substring(slash + 1));
                    }
                }
            }
        }

        // 3. 未覆盖的知识点
        List<String> uncovered = targetKps.stream()
                .map(KnowledgePoint::getKpName)
                .filter(name -> name != null && !coveredKps.contains(name))
                .distinct()
                .toList();

        if (uncovered.isEmpty()) {
            return AutoGenerateResult.builder()
                    .uncoveredKpCount(0).generatedCount(0)
                    .uncoveredKpNames(List.of()).failedKpNames(List.of()).skippedKpNames(List.of())
                    .build();
        }

        // 4. 分批补齐，单次最多处理 maxKps 个，防止本地模型长时间串行阻塞。
        int generated = 0;
        List<String> failed = new ArrayList<>();
        List<AiGeneratedQuestionDTO> previews = new ArrayList<>();
        List<String> toGenerate = uncovered.stream().limit(maxKps).toList();
        List<String> skipped = uncovered.stream().skip(maxKps).toList();
        for (String kpName : toGenerate) {
            try {
                AiQuestionGenerateRequest req = AiQuestionGenerateRequest.builder()
                        .knowledgePoints(List.of(kpName))
                        .questionType(toAiQuestionType(requestedType))
                        .count(perKp)
                        .difficulty(requestedDifficulty)
                        .socraticMode(false)
                        .build();
                List<AiGeneratedQuestionDTO> generatedQs = ollamaService.generateQuestions(req);
                if (generatedQs == null || generatedQs.isEmpty()) {
                    failed.add(kpName);
                    continue;
                }
                for (AiGeneratedQuestionDTO gq : generatedQs) {
                    if (gq.getKnowledgeTags() == null || gq.getKnowledgeTags().isEmpty()) {
                        gq.setKnowledgeTags(List.of(kpName));
                    }
                    previews.add(gq);
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
                .failedKpNames(failed).skippedKpNames(skipped)
                .previewQuestions(previews)
                .build();
    }

    @Override
    public int confirmGeneratedQuestions(Long courseId, Long userId, AutoGenerateConfirmRequest request) {
        Long teacherId = ensureCourseAccess(courseId, userId);
        String difficulty = normalizeDifficulty(request.getDifficulty());
        int saved = 0;
        for (AiGeneratedQuestionDTO question : request.getQuestions()) {
            if (question == null || !StringUtils.hasText(question.getStem()) || !StringUtils.hasText(question.getAnswer())) continue;
            String knowledgePoint = question.getKnowledgeTags() == null || question.getKnowledgeTags().isEmpty()
                    ? "AI补题" : String.join(",", question.getKnowledgeTags());
            saveGeneratedQuestion(courseId, teacherId, knowledgePoint, difficulty, question);
            saved++;
        }
        if (saved == 0) throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "没有可入库的题目");
        return saved;
    }

    private void saveGeneratedQuestion(Long courseId, Long teacherId, String kpName,
                                       String difficulty, AiGeneratedQuestionDTO gq) {
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
            qb.setQuestionType(normalizeBankQuestionType(gq.getQuestionType()));
            qb.setDifficulty(difficulty);
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

    private Long ensureCourseAccess(Long courseId, Long userId) {
        Course course = courseMapper.selectById(courseId);
        if (course == null) throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "课程不存在");
        Long teacherId = resolveTeacherId(userId);
        if (course.getTeacherId() != null && !course.getTeacherId().equals(teacherId)) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "无权操作该课程题库");
        }
        return teacherId;
    }

    private Long resolveTeacherId(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) throw new BusinessException(ResultCode.UNAUTHORIZED.getCode(), "登录用户不存在");
        if ("TEACHER".equals(user.getRole())) {
            Teacher teacher = teacherMapper.selectOne(new LambdaQueryWrapper<Teacher>().eq(Teacher::getUserId, userId));
            if (teacher != null) return teacher.getId();
        }
        if ("ASSISTANT".equals(user.getRole())) {
            TeachingAssistant assistant = teachingAssistantMapper.selectOne(new LambdaQueryWrapper<TeachingAssistant>().eq(TeachingAssistant::getUserId, userId));
            if (assistant != null) return assistant.getTeacherId();
        }
        throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "当前账号没有题库操作权限");
    }

    private String normalizeBankQuestionType(String source) {
        if (!StringUtils.hasText(source)) return "SINGLE";
        String value = source.trim().toUpperCase();
        if (value.contains("MULTI") || source.contains("多选")) return "MULTI";
        if (value.contains("FILL") || source.contains("填空")) return "FILL";
        if (value.contains("SHORT") || source.contains("简答")) return "SHORT";
        if (value.contains("COMPREHENSIVE") || source.contains("综合")) return "COMPREHENSIVE";
        if (value.contains("TRUE") || source.contains("判断")) return "TRUE_FALSE";
        return "SINGLE";
    }

    private String toAiQuestionType(String type) {
        return switch (type) {
            case "MULTI" -> "多选";
            case "FILL" -> "填空";
            case "SHORT" -> "简答";
            case "COMPREHENSIVE" -> "综合";
            case "TRUE_FALSE" -> "判断";
            default -> "单选";
        };
    }

    private String normalizeDifficulty(String source) {
        return "EASY".equalsIgnoreCase(source) || "HARD".equalsIgnoreCase(source)
                ? source.toUpperCase() : "MEDIUM";
    }
}
