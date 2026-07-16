package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.dto.ChartItem;
import com.example.aitaes.dto.ExamPaperCreateDTO;
import com.example.aitaes.dto.ExamResultDTO;
import com.example.aitaes.entity.*;
import com.example.aitaes.mapper.*;
import com.example.aitaes.service.ExamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 考试服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExamServiceImpl implements ExamService {

    private final ExamPaperMapper examPaperMapper;
    private final ExamPaperQuestionMapper examPaperQuestionMapper;
    private final QuestionBankMapper questionBankMapper;
    private final AssessmentMapper assessmentMapper;
    private final AssessmentRecordMapper assessmentRecordMapper;
    private final CourseStudentMapper courseStudentMapper;
    private final StudentMapper studentMapper;
    private final CourseMapper courseMapper;
    private final TeacherMapper teacherMapper;
    private final TeachingAssistantMapper teachingAssistantMapper;
    private final UserMapper userMapper;

    // ===== 私有方法 =====

    private Long resolveTeacherId(Long userId) {
        User user = userMapper.selectById(userId);
        if (user != null) {
            if ("TEACHER".equals(user.getRole())) {
                Teacher teacher = teacherMapper.selectOne(
                        new LambdaQueryWrapper<Teacher>().eq(Teacher::getUserId, userId));
                if (teacher == null) {
                    throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "教师不存在");
                }
                return teacher.getId();
            } else if ("ASSISTANT".equals(user.getRole())) {
                TeachingAssistant ta = teachingAssistantMapper.selectOne(
                        new LambdaQueryWrapper<TeachingAssistant>().eq(TeachingAssistant::getUserId, userId));
                if (ta == null) {
                    throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "助教不存在");
                }
                return ta.getTeacherId();
            } else {
                throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "角色不支持");
            }
        }

        // fallback：兼容旧逻辑，直接查 teacher 表
        Teacher teacher = teacherMapper.selectOne(
                new LambdaQueryWrapper<Teacher>().eq(Teacher::getUserId, userId));
        if (teacher == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "教师不存在");
        }
        return teacher.getId();
    }

    // ===== 试卷管理 =====

    @Override
    @Transactional
    public ExamPaper createPaper(Long userId, ExamPaperCreateDTO dto) {
        Long teacherId = resolveTeacherId(userId);

        ExamPaper paper = new ExamPaper();
        paper.setCourseId(dto.getCourseId());
        paper.setTeacherId(teacherId);
        paper.setPaperName(dto.getPaperName());
        paper.setTotalScore(dto.getTotalScore() != null ? dto.getTotalScore() : new BigDecimal("100.00"));
        paper.setDurationMinutes(dto.getDurationMinutes() != null ? dto.getDurationMinutes() : 120);
        paper.setStartTime(dto.getStartTime());
        paper.setEndTime(dto.getEndTime());
        paper.setTargetClasses(dto.getTargetClasses());
        paper.setStatus("DRAFT");
        examPaperMapper.insert(paper);

        // 关联题目
        if (dto.getQuestions() != null) {
            for (ExamPaperCreateDTO.QuestionItem qi : dto.getQuestions()) {
                ExamPaperQuestion epq = new ExamPaperQuestion();
                epq.setPaperId(paper.getId());
                epq.setQuestionId(qi.getQuestionId());
                epq.setQuestionNo(qi.getQuestionNo());
                epq.setScore(qi.getScore());
                examPaperQuestionMapper.insert(epq);

                // 更新题目使用次数
                QuestionBank qb = questionBankMapper.selectById(qi.getQuestionId());
                if (qb != null) {
                    qb.setUsageCount((qb.getUsageCount() != null ? qb.getUsageCount() : 0) + 1);
                    questionBankMapper.updateById(qb);
                }
            }
        }

        log.info("创建试卷: id={}, name={}", paper.getId(), dto.getPaperName());
        return paper;
    }

    @Override
    public IPage<ExamPaper> listPapers(int pageNum, int pageSize, Long courseId, Long userId) {
        Long teacherId = null;
        if (userId != null) {
            try {
                teacherId = resolveTeacherId(userId);
            } catch (BusinessException e) {
                teacherId = null;
            }
        }

        LambdaQueryWrapper<ExamPaper> wrapper = new LambdaQueryWrapper<>();
        if (courseId != null) wrapper.eq(ExamPaper::getCourseId, courseId);
        if (teacherId != null) wrapper.eq(ExamPaper::getTeacherId, teacherId);
        wrapper.orderByDesc(ExamPaper::getCreateTime);
        return examPaperMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public ExamPaper getPaperById(Long id) {
        ExamPaper paper = examPaperMapper.selectById(id);
        if (paper == null) throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "试卷不存在");
        return paper;
    }

    @Override
    @Transactional
    public ExamPaper updatePaper(Long id, ExamPaperCreateDTO dto) {
        getPaperById(id);
        // 删除旧题目关联
        examPaperQuestionMapper.delete(
                new LambdaQueryWrapper<ExamPaperQuestion>().eq(ExamPaperQuestion::getPaperId, id));
        // 重新关联
        if (dto.getQuestions() != null) {
            for (ExamPaperCreateDTO.QuestionItem qi : dto.getQuestions()) {
                ExamPaperQuestion epq = new ExamPaperQuestion();
                epq.setPaperId(id);
                epq.setQuestionId(qi.getQuestionId());
                epq.setQuestionNo(qi.getQuestionNo());
                epq.setScore(qi.getScore());
                examPaperQuestionMapper.insert(epq);
            }
        }
        return getPaperById(id);
    }

    @Override
    public void deletePaper(Long id) {
        getPaperById(id);
        examPaperMapper.deleteById(id);
        examPaperQuestionMapper.delete(
                new LambdaQueryWrapper<ExamPaperQuestion>().eq(ExamPaperQuestion::getPaperId, id));
    }

    @Override
    public void publishPaper(Long id) {
        ExamPaper paper = getPaperById(id);
        paper.setStatus("PUBLISHED");
        examPaperMapper.updateById(paper);
        log.info("发布考试: paperId={}", id);
    }

    @Override
    public void closePaper(Long id) {
        ExamPaper paper = getPaperById(id);
        paper.setStatus("CLOSED");
        examPaperMapper.updateById(paper);
        log.info("结束考试: paperId={}", id);
    }

    // ===== 学生考试 =====

    @Override
    public List<ExamPaper> getPendingExams(Long studentId) {
        // 查找学生所在课程
        List<CourseStudent> csList = courseStudentMapper.selectList(
                new LambdaQueryWrapper<CourseStudent>().eq(CourseStudent::getStudentId, studentId));
        if (csList.isEmpty()) return Collections.emptyList();

        List<Long> courseIds = csList.stream().map(CourseStudent::getCourseId).collect(Collectors.toList());
        return examPaperMapper.selectList(
                new LambdaQueryWrapper<ExamPaper>()
                        .in(ExamPaper::getCourseId, courseIds)
                        .eq(ExamPaper::getStatus, "PUBLISHED")
                        .orderByDesc(ExamPaper::getCreateTime));
    }

    @Override
    public ExamPaper getExamForStudent(Long paperId, Long studentId) {
        ExamPaper paper = getPaperById(paperId);
        if (!"PUBLISHED".equals(paper.getStatus())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "考试不可用");
        }
        // 检查学生是否在目标班级
        List<CourseStudent> csList = courseStudentMapper.selectList(
                new LambdaQueryWrapper<CourseStudent>()
                        .eq(CourseStudent::getCourseId, paper.getCourseId())
                        .eq(CourseStudent::getStudentId, studentId));
        if (csList.isEmpty()) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "你不在该考试的参与班级中");
        }
        return paper;
    }

    @Override
    @Transactional
    public void submitExam(Long paperId, Long studentId, Map<Long, String> answers) {
        ExamPaper paper = getPaperById(paperId);
        List<ExamPaperQuestion> questions = examPaperQuestionMapper.selectList(
                new LambdaQueryWrapper<ExamPaperQuestion>().eq(ExamPaperQuestion::getPaperId, paperId));

        // 自动批改客观题
        BigDecimal totalScore = BigDecimal.ZERO;
        for (ExamPaperQuestion epq : questions) {
            QuestionBank qb = questionBankMapper.selectById(epq.getQuestionId());
            if (qb == null) continue;
            String studentAnswer = answers.getOrDefault(epq.getQuestionId(), "");
            // 客观题比对答案（题目 content JSON 中应包含 answer 字段）
            if (isObjective(qb.getQuestionType())) {
                String correctAnswer = extractAnswer(qb.getContent());
                if (correctAnswer != null && correctAnswer.equalsIgnoreCase(studentAnswer.trim())) {
                    totalScore = totalScore.add(epq.getScore());
                }
            }
        }

        // 创建考核记录
        Assessment assessment = new Assessment();
        assessment.setCourseId(paper.getCourseId());
        assessment.setAssessmentName(paper.getPaperName());
        assessment.setAssessmentType("EXAM");
        assessment.setTotalScore(paper.getTotalScore());
        assessment.setStatus("CLOSED");
        assessmentMapper.insert(assessment);

        AssessmentRecord record = new AssessmentRecord();
        record.setAssessmentId(assessment.getId());
        record.setStudentId(studentId);
        record.setTotalScore(totalScore);
        record.setSubmitStatus("ON_TIME");
        record.setSubmitTime(LocalDateTime.now());
        assessmentRecordMapper.insert(record);

        log.info("学生交卷: paperId={}, studentId={}, score={}", paperId, studentId, totalScore);
    }

    // ===== 考试结果 =====

    @Override
    public ExamResultDTO getExamResults(Long paperId) {
        ExamPaper paper = getPaperById(paperId);

        // 查找关联的 assessment
        Assessment assessment = assessmentMapper.selectOne(
                new LambdaQueryWrapper<Assessment>()
                        .eq(Assessment::getAssessmentName, paper.getPaperName())
                        .eq(Assessment::getCourseId, paper.getCourseId())
                        .orderByDesc(Assessment::getCreateTime)
                        .last("LIMIT 1"));

        if (assessment == null) {
            return ExamResultDTO.builder()
                    .averageScore(BigDecimal.ZERO).maxScore(BigDecimal.ZERO)
                    .minScore(BigDecimal.ZERO).passRate(BigDecimal.ZERO)
                    .totalStudents(0).submittedCount(0)
                    .scoreDistribution(Collections.emptyList())
                    .questionStats(Collections.emptyList())
                    .studentScores(Collections.emptyList())
                    .build();
        }

        List<AssessmentRecord> records = assessmentRecordMapper.selectList(
                new LambdaQueryWrapper<AssessmentRecord>()
                        .eq(AssessmentRecord::getAssessmentId, assessment.getId()));

        Long totalStudents = courseStudentMapper.selectCount(
                new LambdaQueryWrapper<CourseStudent>()
                        .eq(CourseStudent::getCourseId, paper.getCourseId()));

        BigDecimal avg = records.isEmpty() ? BigDecimal.ZERO
                : records.stream().map(r -> r.getTotalScore() != null ? r.getTotalScore() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(new BigDecimal(records.size()), 2, RoundingMode.HALF_UP);

        BigDecimal max = records.stream().map(r -> r.getTotalScore() != null ? r.getTotalScore() : BigDecimal.ZERO)
                .max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        BigDecimal min = records.stream().map(r -> r.getTotalScore() != null ? r.getTotalScore() : BigDecimal.ZERO)
                .min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);

        long passCount = records.stream()
                .filter(r -> r.getTotalScore() != null
                        && r.getTotalScore().compareTo(new BigDecimal("60")) >= 0).count();
        BigDecimal passRate = records.isEmpty() ? BigDecimal.ZERO
                : new BigDecimal(passCount).divide(new BigDecimal(records.size()), 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal(100)).setScale(1, RoundingMode.HALF_UP);

        // 学生成绩列表
        List<Long> studentIds = records.stream().map(AssessmentRecord::getStudentId).collect(Collectors.toList());
        Map<Long, Student> studentMap = studentMapper.selectBatchIds(studentIds).stream()
                .collect(Collectors.toMap(Student::getId, s -> s));

        List<ExamResultDTO.StudentScoreItem> studentScores = records.stream().map(r -> {
            Student s = studentMap.get(r.getStudentId());
            return ExamResultDTO.StudentScoreItem.builder()
                    .studentId(r.getStudentId())
                    .studentNo(s != null ? s.getStudentNo() : null)
                    .name(s != null ? s.getName() : null)
                    .totalScore(r.getTotalScore())
                    .submitStatus(r.getSubmitStatus())
                    .submitTime(r.getSubmitTime() != null ? r.getSubmitTime().toString() : null)
                    .build();
        }).collect(Collectors.toList());

        return ExamResultDTO.builder()
                .averageScore(avg).maxScore(max).minScore(min).passRate(passRate)
                .totalStudents(totalStudents.intValue()).submittedCount(records.size())
                .scoreDistribution(Collections.emptyList())
                .questionStats(Collections.emptyList())
                .studentScores(studentScores)
                .build();
    }

    // ===== 主观题批阅 =====

    @Override
    public List<Map<String, Object>> getGradingList(Long courseId) {
        // 简化实现：返回该课程下所有考试的主观题待批阅记录
        List<Map<String, Object>> result = new ArrayList<>();
        // 实际应查询需要手动批阅的 assessment_record
        return result;
    }

    @Override
    public void submitGrade(Long recordId, BigDecimal score, String comment) {
        AssessmentRecord record = assessmentRecordMapper.selectById(recordId);
        if (record == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "批阅记录不存在");
        }
        record.setTotalScore(score);
        record.setWeakestAspect(comment);
        assessmentRecordMapper.updateById(record);
        log.info("主观题批阅: recordId={}, score={}", recordId, score);
    }

    // ===== 辅助方法 =====

    private boolean isObjective(String questionType) {
        return "SINGLE".equals(questionType) || "MULTI".equals(questionType)
                || "FILL".equals(questionType) || "TRUE_FALSE".equals(questionType);
    }

    private String extractAnswer(String content) {
        // content 为 JSON，尝试简单提取 answer 字段
        if (content == null) return null;
        try {
            int idx = content.indexOf("\"answer\"");
            if (idx < 0) return null;
            int colon = content.indexOf(":", idx);
            int start = content.indexOf("\"", colon + 1);
            int end = content.indexOf("\"", start + 1);
            return content.substring(start + 1, end);
        } catch (Exception e) {
            return null;
        }
    }
}
