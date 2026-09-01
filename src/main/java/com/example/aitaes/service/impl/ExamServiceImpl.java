package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.dto.ExamPaperCreateDTO;
import com.example.aitaes.dto.ExamResultDTO;
import com.example.aitaes.dto.GradingItemVO;
import com.example.aitaes.dto.PaperGradingVO;
import com.example.aitaes.dto.PaperQuestionEditVO;
import com.example.aitaes.dto.StudentExamRecordVO;
import com.example.aitaes.dto.StudentExamResultVO;
import com.example.aitaes.dto.StudentExamVO;
import com.example.aitaes.dto.StudentGradeRequestDTO;
import com.example.aitaes.dto.SubmitExamResultDTO;
import com.example.aitaes.entity.*;
import com.example.aitaes.mapper.*;
import com.example.aitaes.service.ExamService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final ExamAnswerMapper examAnswerMapper;
    private final CourseStudentMapper courseStudentMapper;
    private final StudentMapper studentMapper;
    private final StudentWrongQuestionMapper studentWrongQuestionMapper;
    private final CourseMapper courseMapper;
    private final TeacherMapper teacherMapper;
    private final TeachingAssistantMapper teachingAssistantMapper;
    private final UserMapper userMapper;
    private final ObjectMapper objectMapper;

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

    private Long resolveStudentId(Long userId) {
        Student student = studentMapper.selectOne(
                new LambdaQueryWrapper<Student>().eq(Student::getUserId, userId));
        if (student == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "学生不存在");
        }
        return student.getId();
    }

    private Set<Long> submittedPaperIds(Long studentId) {
        List<AssessmentRecord> records = assessmentRecordMapper.selectList(
                new LambdaQueryWrapper<AssessmentRecord>().eq(AssessmentRecord::getStudentId, studentId));
        if (records.isEmpty()) return Collections.emptySet();
        Set<Long> assessmentIds = records.stream()
                .map(AssessmentRecord::getAssessmentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (assessmentIds.isEmpty()) return Collections.emptySet();
        return assessmentMapper.selectBatchIds(assessmentIds).stream()
                .map(Assessment::getPaperId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
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
        paper.setTargetStudents(dto.getTargetStudents());
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
                epq.setContentOverride(qi.getContent());
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
        IPage<ExamPaper> page = examPaperMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);

        // 惰性归一化：已过截止时间仍为 PUBLISHED 的卷自动转为 ENDED
        normalizeEnded(page.getRecords());
        // 回填未批阅份数
        fillUngradedCount(page.getRecords());
        return page;
    }

    @Override
    public ExamPaper getPaperById(Long id) {
        ExamPaper paper = examPaperMapper.selectById(id);
        if (paper == null) throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "试卷不存在");
        normalizeEnded(Collections.singletonList(paper));
        return paper;
    }

    @Override
    @Transactional
    public ExamPaper updatePaper(Long id, ExamPaperCreateDTO dto) {
        ExamPaper paper = getPaperById(id);
        if (!"DRAFT".equals(paper.getStatus())) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "试卷已发布，无法修改");
        }
        paper.setPaperName(dto.getPaperName());
        paper.setCourseId(dto.getCourseId());
        paper.setTotalScore(dto.getTotalScore() != null ? dto.getTotalScore() : paper.getTotalScore());
        paper.setDurationMinutes(dto.getDurationMinutes() != null ? dto.getDurationMinutes() : paper.getDurationMinutes());
        paper.setStartTime(dto.getStartTime());
        paper.setEndTime(dto.getEndTime());
        paper.setTargetClasses(dto.getTargetClasses());
        paper.setTargetStudents(dto.getTargetStudents());
        examPaperMapper.updateById(paper);

        // 删除旧题目关联（物理删除，绕过逻辑删除，否则 uk_paper_question 唯一键冲突），重新关联
        examPaperQuestionMapper.physicalDeleteByPaperId(id);
        if (dto.getQuestions() != null) {
            for (ExamPaperCreateDTO.QuestionItem qi : dto.getQuestions()) {
                ExamPaperQuestion epq = new ExamPaperQuestion();
                epq.setPaperId(id);
                epq.setQuestionId(qi.getQuestionId());
                epq.setQuestionNo(qi.getQuestionNo());
                epq.setScore(qi.getScore());
                epq.setContentOverride(qi.getContent());
                examPaperQuestionMapper.insert(epq);
            }
        }
        return paper;
    }

    @Override
    public void deletePaper(Long id) {
        getPaperById(id);
        examPaperMapper.deleteById(id);
        examPaperQuestionMapper.delete(
                new LambdaQueryWrapper<ExamPaperQuestion>().eq(ExamPaperQuestion::getPaperId, id));
    }

    @Override
    public List<PaperQuestionEditVO> getPaperQuestions(Long paperId) {
        getPaperById(paperId);
        List<ExamPaperQuestion> epqs = examPaperQuestionMapper.selectList(
                new LambdaQueryWrapper<ExamPaperQuestion>()
                        .eq(ExamPaperQuestion::getPaperId, paperId)
                        .orderByAsc(ExamPaperQuestion::getQuestionNo));
        if (epqs.isEmpty()) return Collections.emptyList();

        Set<Long> qids = epqs.stream().map(ExamPaperQuestion::getQuestionId).collect(Collectors.toSet());
        Map<Long, QuestionBank> qbMap = questionBankMapper.selectBatchIds(qids).stream()
                .collect(Collectors.toMap(QuestionBank::getId, q -> q));

        return epqs.stream().map(epq -> {
            QuestionBank qb = qbMap.get(epq.getQuestionId());
            String content = effectiveContent(epq, qb);
            return PaperQuestionEditVO.builder()
                    .questionId(epq.getQuestionId())
                    .questionNo(epq.getQuestionNo())
                    .questionType(qb != null ? qb.getQuestionType() : null)
                    .score(epq.getScore())
                    .stem(content != null ? parseStem(content) : null)
                    .options(content != null ? parseOptions(content) : Collections.emptyList())
                    .answer(content != null ? parseEditableAnswer(content) : null)
                    .analysis(content != null ? parseAnalysis(content) : null)
                    .knowledgePoints(qb != null ? qb.getKnowledgePoints() : null)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void publishPaper(Long id) {
        ExamPaper paper = getPaperById(id);
        if (!"DRAFT".equals(paper.getStatus())) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "试卷已发布，不能重复发布");
        }
        if (paper.getStartTime() == null || paper.getEndTime() == null) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "请先设置考试开始与截止时间");
        }
        LocalDateTime now = LocalDateTime.now();
        if (!paper.getStartTime().isBefore(paper.getEndTime())) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "考试开始时间必须早于截止时间");
        }
        if (!paper.getEndTime().isAfter(now)) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "考试截止时间必须晚于当前时间");
        }

        List<ExamPaperQuestion> questions = examPaperQuestionMapper.selectList(
                new LambdaQueryWrapper<ExamPaperQuestion>().eq(ExamPaperQuestion::getPaperId, id));
        if (questions.isEmpty()) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "试卷未关联任何题目，无法发布");
        }

        // 一张试卷对应一条考核（按 paperId 复用）
        Assessment assessment = assessmentMapper.selectOne(
                new LambdaQueryWrapper<Assessment>().eq(Assessment::getPaperId, id));
        if (assessment == null) {
            assessment = new Assessment();
            assessment.setPaperId(id);
            assessment.setCourseId(paper.getCourseId());
            assessment.setAssessmentName(paper.getPaperName());
            assessment.setAssessmentType("EXAM");
            assessment.setTotalScore(paper.getTotalScore());
            assessment.setQuestionCount(questions.size());
            assessment.setStartTime(paper.getStartTime());
            assessment.setEndTime(paper.getEndTime());
            assessment.setDurationMinutes(paper.getDurationMinutes());
            assessment.setStatus("PUBLISHED");
            assessmentMapper.insert(assessment);
        } else {
            assessment.setCourseId(paper.getCourseId());
            assessment.setAssessmentName(paper.getPaperName());
            assessment.setTotalScore(paper.getTotalScore());
            assessment.setQuestionCount(questions.size());
            assessment.setStartTime(paper.getStartTime());
            assessment.setEndTime(paper.getEndTime());
            assessment.setDurationMinutes(paper.getDurationMinutes());
            assessment.setStatus("PUBLISHED");
            assessmentMapper.updateById(assessment);
        }

        paper.setStatus("PUBLISHED");
        examPaperMapper.updateById(paper);
        log.info("发布考试: paperId={}, assessmentId={}", id, assessment.getId());
    }

    @Override
    @Transactional
    public void closePaper(Long id) {
        ExamPaper paper = getPaperById(id);
        paper.setStatus("ENDED");
        examPaperMapper.updateById(paper);

        Assessment assessment = assessmentMapper.selectOne(
                new LambdaQueryWrapper<Assessment>().eq(Assessment::getPaperId, id));
        if (assessment != null) {
            assessment.setStatus("ENDED");
            assessmentMapper.updateById(assessment);
        }
        log.info("结束考试: paperId={}", id);
    }

    // ===== 学生考试 =====

    @Override
    public List<ExamPaper> getPendingExams(Long userId) {
        Long studentId = resolveStudentId(userId);
        List<CourseStudent> csList = courseStudentMapper.selectList(
                new LambdaQueryWrapper<CourseStudent>().eq(CourseStudent::getStudentId, studentId));
        if (csList.isEmpty()) return Collections.emptyList();
        Set<Long> enrolled = csList.stream().map(CourseStudent::getCourseId).collect(Collectors.toSet());

        // 已交卷试卷集合（交卷后移出待考）
        Set<Long> submittedPaperIds = submittedPaperIds(studentId);

        List<ExamPaper> papers = examPaperMapper.selectList(
                new LambdaQueryWrapper<ExamPaper>()
                        .eq(ExamPaper::getStatus, "PUBLISHED")
                        .orderByDesc(ExamPaper::getCreateTime));

        LocalDateTime now = LocalDateTime.now();
        return papers.stream()
                .filter(p -> inTargetStudents(studentId, enrolled, p))
                .filter(p -> p.getEndTime() == null || now.isBefore(p.getEndTime()))
                .filter(p -> !submittedPaperIds.contains(p.getId()))
                .collect(Collectors.toList());
    }

    @Override
    public StudentExamVO getExamForStudent(Long paperId, Long userId) {
        Long studentId = resolveStudentId(userId);
        ExamPaper paper = getPaperById(paperId);
        if ("DRAFT".equals(paper.getStatus()) || "ENDED".equals(paper.getStatus())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "考试不可用");
        }
        LocalDateTime now = LocalDateTime.now();
        if (paper.getStartTime() != null && now.isBefore(paper.getStartTime())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "考试尚未开始");
        }
        if (paper.getEndTime() != null && now.isAfter(paper.getEndTime())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "考试已结束");
        }

        // 已交卷则禁止再次进入
        if (submittedPaperIds(studentId).contains(paperId)) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "你已完成该考试");
        }

        // 检查学生是否在目标班级/学生范围内
        if (!inTargetStudents(studentId, enrolledCourseIds(studentId), paper)) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "你不在该考试的参与班级中");
        }

        // 组装题目（剥离答案/解析）
        List<ExamPaperQuestion> epqs = examPaperQuestionMapper.selectList(
                new LambdaQueryWrapper<ExamPaperQuestion>()
                        .eq(ExamPaperQuestion::getPaperId, paperId)
                        .orderByAsc(ExamPaperQuestion::getQuestionNo));
        List<Long> questionIds = epqs.stream().map(ExamPaperQuestion::getQuestionId).collect(Collectors.toList());
        Map<Long, QuestionBank> qbMap = questionIds.isEmpty() ? Collections.emptyMap()
                : questionBankMapper.selectBatchIds(questionIds).stream()
                        .collect(Collectors.toMap(QuestionBank::getId, q -> q));

        List<StudentExamVO.QuestionItem> items = epqs.stream().map(epq -> {
            QuestionBank qb = qbMap.get(epq.getQuestionId());
            String content = effectiveContent(epq, qb);
            return StudentExamVO.QuestionItem.builder()
                    .questionId(epq.getQuestionId())
                    .questionNo(epq.getQuestionNo())
                    .questionType(qb != null ? qb.getQuestionType() : null)
                    .score(epq.getScore())
                    .stem(content != null ? parseStem(content) : null)
                    .options(content != null ? parseOptions(content) : Collections.emptyList())
                    .knowledgePoints(qb != null ? qb.getKnowledgePoints() : null)
                    .build();
        }).collect(Collectors.toList());

        return StudentExamVO.builder()
                .paperId(paper.getId())
                .paperName(paper.getPaperName())
                .courseId(paper.getCourseId())
                .totalScore(paper.getTotalScore())
                .durationMinutes(paper.getDurationMinutes())
                .startTime(paper.getStartTime())
                .endTime(paper.getEndTime())
                .status(paper.getStatus())
                .questions(items)
                .build();
    }

    @Override
    @Transactional
    public SubmitExamResultDTO submitExam(Long paperId, Long userId, Map<Long, String> answers) {
        Long studentId = resolveStudentId(userId);
        ExamPaper paper = getPaperById(paperId);
        if ("DRAFT".equals(paper.getStatus()) || "ENDED".equals(paper.getStatus())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "考试不可用");
        }
        LocalDateTime now = LocalDateTime.now();
        if (paper.getStartTime() != null && now.isBefore(paper.getStartTime())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "考试尚未开始");
        }
        if (paper.getEndTime() != null && now.isAfter(paper.getEndTime())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "考试已结束，无法交卷");
        }

        // 一张试卷对应一条考核
        Assessment assessment = assessmentMapper.selectOne(
                new LambdaQueryWrapper<Assessment>().eq(Assessment::getPaperId, paperId));
        if (assessment == null) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "考试未发布，无法交卷");
        }

        // 防重复交卷
        Long submitted = assessmentRecordMapper.selectCount(
                new LambdaQueryWrapper<AssessmentRecord>()
                        .eq(AssessmentRecord::getAssessmentId, assessment.getId())
                        .eq(AssessmentRecord::getStudentId, studentId));
        if (submitted != null && submitted > 0) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "请勿重复交卷");
        }

        AssessmentRecord record = new AssessmentRecord();
        record.setAssessmentId(assessment.getId());
        record.setStudentId(studentId);
        record.setTotalScore(BigDecimal.ZERO);
        record.setSubmitStatus("ON_TIME");
        record.setSubmitTime(now);
        assessmentRecordMapper.insert(record);

        List<ExamPaperQuestion> questions = examPaperQuestionMapper.selectList(
                new LambdaQueryWrapper<ExamPaperQuestion>().eq(ExamPaperQuestion::getPaperId, paperId));

        BigDecimal totalScore = BigDecimal.ZERO;
        int objectiveCount = 0;
        int subjectiveCount = 0;
        for (ExamPaperQuestion epq : questions) {
            QuestionBank qb = questionBankMapper.selectById(epq.getQuestionId());
            ExamAnswer answer = new ExamAnswer();
            answer.setPaperId(paperId);
            answer.setAssessmentId(assessment.getId());
            answer.setRecordId(record.getId());
            answer.setStudentId(studentId);
            answer.setQuestionId(epq.getQuestionId());
            answer.setQuestionNo(epq.getQuestionNo());
            answer.setQuestionType(qb != null ? qb.getQuestionType() : null);
            answer.setMaxScore(epq.getScore());
            String studentAnswer = answers != null ? answers.getOrDefault(epq.getQuestionId(), "") : "";
            answer.setStudentAnswer(studentAnswer);

            if (qb != null && isObjective(qb.getQuestionType())) {
                objectiveCount++;
                String correct = parseAnswer(effectiveContent(epq, qb));
                answer.setCorrectAnswer(correct);
                boolean correctFlag = isCorrectAnswer(correct, studentAnswer, qb.getQuestionType());
                answer.setIsCorrect(correctFlag ? 1 : 0);
                answer.setScore(correctFlag ? epq.getScore() : BigDecimal.ZERO);
                answer.setGraded(1);
                if (correctFlag) {
                    totalScore = totalScore.add(epq.getScore());
                } else {
                    writeWrongQuestion(studentId, paper.getCourseId(), qb, studentAnswer, correct);
                }
            } else {
                // 主观题：仅保存答案，待教师批阅
                subjectiveCount++;
                answer.setCorrectAnswer(parseAnswer(effectiveContent(epq, qb)));
                answer.setScore(null);
                answer.setGraded(0);
            }
            examAnswerMapper.insert(answer);
        }

        record.setTotalScore(totalScore);
        assessmentRecordMapper.updateById(record);
        log.info("学生交卷: paperId={}, studentId={}, score={}", paperId, studentId, totalScore);
        return SubmitExamResultDTO.builder()
                .objectiveScore(totalScore)
                .totalScore(totalScore)
                .objectiveCount(objectiveCount)
                .subjectiveCount(subjectiveCount)
                .build();
    }

    @Override
    public List<StudentExamRecordVO> getMyExamRecords(Long userId) {
        Long studentId = resolveStudentId(userId);
        List<AssessmentRecord> records = assessmentRecordMapper.selectList(
                new LambdaQueryWrapper<AssessmentRecord>()
                        .eq(AssessmentRecord::getStudentId, studentId)
                        .orderByDesc(AssessmentRecord::getSubmitTime));
        if (records.isEmpty()) return Collections.emptyList();

        // 批量加载考核 / 试卷 / 课程
        Set<Long> assessmentIds = records.stream().map(AssessmentRecord::getAssessmentId).collect(Collectors.toSet());
        Map<Long, Assessment> assessmentMap = assessmentMapper.selectBatchIds(assessmentIds).stream()
                .collect(Collectors.toMap(Assessment::getId, a -> a));
        Set<Long> paperIds = assessmentMap.values().stream().map(Assessment::getPaperId)
                .filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, ExamPaper> paperMap = paperIds.isEmpty() ? Collections.emptyMap()
                : examPaperMapper.selectBatchIds(paperIds).stream()
                        .collect(Collectors.toMap(ExamPaper::getId, p -> p));
        Set<Long> courseIds = assessmentMap.values().stream().map(Assessment::getCourseId)
                .filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, Course> courseMap = courseIds.isEmpty() ? Collections.emptyMap()
                : courseMapper.selectBatchIds(courseIds).stream()
                        .collect(Collectors.toMap(Course::getId, c -> c));

        // 批量加载作答，按 recordId 分组
        Set<Long> recordIds = records.stream().map(AssessmentRecord::getId).collect(Collectors.toSet());
        List<ExamAnswer> allAnswers = examAnswerMapper.selectList(
                new LambdaQueryWrapper<ExamAnswer>().in(ExamAnswer::getRecordId, recordIds));
        Map<Long, List<ExamAnswer>> answerMap = allAnswers.stream()
                .collect(Collectors.groupingBy(ExamAnswer::getRecordId));

        return records.stream().map(r -> {
            Assessment a = assessmentMap.get(r.getAssessmentId());
            ExamPaper p = a != null && a.getPaperId() != null ? paperMap.get(a.getPaperId()) : null;
            Course c = a != null && a.getCourseId() != null ? courseMap.get(a.getCourseId()) : null;

            List<ExamAnswer> answers = answerMap.getOrDefault(r.getId(), Collections.emptyList());
            BigDecimal myScore = answers.stream()
                    .map(x -> x.getScore() != null ? x.getScore() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal objectiveScore = answers.stream()
                    .filter(x -> isObjective(x.getQuestionType()))
                    .map(x -> x.getScore() != null ? x.getScore() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            int subjectivePending = (int) answers.stream()
                    .filter(x -> !isObjective(x.getQuestionType()))
                    .filter(x -> x.getGraded() == null || x.getGraded() == 0)
                    .count();

            return StudentExamRecordVO.builder()
                    .recordId(r.getId())
                    .paperId(a != null ? a.getPaperId() : null)
                    .paperName(p != null ? p.getPaperName() : (a != null ? a.getAssessmentName() : null))
                    .courseId(a != null ? a.getCourseId() : null)
                    .courseName(c != null ? c.getCourseName() : null)
                    .totalScore(p != null ? p.getTotalScore() : (a != null ? a.getTotalScore() : null))
                    .myScore(myScore)
                    .objectiveScore(objectiveScore)
                    .subjectivePending(subjectivePending)
                    .submitTime(r.getSubmitTime() != null ? r.getSubmitTime().toString() : null)
                    .status(subjectivePending > 0 ? "GRADING" : "GRADED")
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public StudentExamResultVO getMyExamResult(Long paperId, Long userId) {
        Long studentId = resolveStudentId(userId);
        ExamPaper paper = getPaperById(paperId);

        Assessment assessment = assessmentMapper.selectOne(
                new LambdaQueryWrapper<Assessment>().eq(Assessment::getPaperId, paperId));
        if (assessment == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "考试不存在");
        }

        AssessmentRecord record = assessmentRecordMapper.selectOne(
                new LambdaQueryWrapper<AssessmentRecord>()
                        .eq(AssessmentRecord::getAssessmentId, assessment.getId())
                        .eq(AssessmentRecord::getStudentId, studentId));
        if (record == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "你未参加该考试");
        }

        List<ExamAnswer> answers = examAnswerMapper.selectList(
                new LambdaQueryWrapper<ExamAnswer>()
                        .eq(ExamAnswer::getRecordId, record.getId())
                        .orderByAsc(ExamAnswer::getQuestionNo));

        Set<Long> questionIds = answers.stream().map(ExamAnswer::getQuestionId).collect(Collectors.toSet());
        Map<Long, QuestionBank> qbMap = questionIds.isEmpty() ? Collections.emptyMap()
                : questionBankMapper.selectBatchIds(questionIds).stream()
                        .collect(Collectors.toMap(QuestionBank::getId, q -> q));

        Map<Long, String> overrideMap = loadOverrideMap(paperId);

        List<StudentExamResultVO.AnswerItem> items = answers.stream().map(a -> {
            QuestionBank qb = qbMap.get(a.getQuestionId());
            String content = overrideMap.getOrDefault(a.getQuestionId(), qb != null ? qb.getContent() : null);
            return StudentExamResultVO.AnswerItem.builder()
                    .questionNo(a.getQuestionNo())
                    .questionType(a.getQuestionType())
                    .stem(content != null ? parseStem(content) : null)
                    .options(content != null ? parseOptions(content) : Collections.emptyList())
                    .studentAnswer(a.getStudentAnswer())
                    .correctAnswer(a.getCorrectAnswer())
                    .score(a.getScore())
                    .maxScore(a.getMaxScore())
                    .isCorrect(a.getIsCorrect())
                    .graded(a.getGraded())
                    .comment(a.getComment())
                    .build();
        }).collect(Collectors.toList());

        BigDecimal myScore = answers.stream()
                .map(x -> x.getScore() != null ? x.getScore() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal objectiveScore = answers.stream()
                .filter(x -> isObjective(x.getQuestionType()))
                .map(x -> x.getScore() != null ? x.getScore() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int subjectivePending = (int) answers.stream()
                .filter(x -> !isObjective(x.getQuestionType()))
                .filter(x -> x.getGraded() == null || x.getGraded() == 0)
                .count();

        return StudentExamResultVO.builder()
                .paperId(paper.getId())
                .paperName(paper.getPaperName())
                .totalScore(paper.getTotalScore())
                .myScore(myScore)
                .objectiveScore(objectiveScore)
                .subjectivePending(subjectivePending)
                .submitTime(record.getSubmitTime() != null ? record.getSubmitTime().toString() : null)
                .answers(items)
                .build();
    }

    // ===== 考试结果 =====

    @Override
    public ExamResultDTO getExamResults(Long paperId) {
        ExamPaper paper = getPaperById(paperId);

        Assessment assessment = assessmentMapper.selectOne(
                new LambdaQueryWrapper<Assessment>().eq(Assessment::getPaperId, paperId));

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

        // 花名册：目标学生（优先）或目标班级的所有学生
        Set<Long> rosterStudentIds;
        Set<Long> targetStudents = targetStudentIds(paper);
        if (!targetStudents.isEmpty()) {
            rosterStudentIds = targetStudents;
        } else {
            Set<Long> targetIds = targetClassIds(paper);
            List<CourseStudent> rosterCs = targetIds.isEmpty() ? Collections.emptyList()
                    : courseStudentMapper.selectList(
                            new LambdaQueryWrapper<CourseStudent>().in(CourseStudent::getCourseId, targetIds));
            rosterStudentIds = rosterCs.stream().map(CourseStudent::getStudentId).collect(Collectors.toSet());
        }
        Map<Long, AssessmentRecord> submittedMap = records.stream()
                .collect(Collectors.toMap(AssessmentRecord::getStudentId, r -> r, (a, b) -> a));

        Set<Long> allStudentIds = new HashSet<>(rosterStudentIds);
        allStudentIds.addAll(submittedMap.keySet());
        Map<Long, Student> studentMap = allStudentIds.isEmpty() ? Collections.emptyMap()
                : studentMapper.selectBatchIds(allStudentIds).stream()
                        .collect(Collectors.toMap(Student::getId, s -> s));

        Long totalStudents = (long) allStudentIds.size();

        BigDecimal avg = records.isEmpty() ? BigDecimal.ZERO
                : records.stream().map(r -> r.getTotalScore() != null ? r.getTotalScore() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(new BigDecimal(records.size()), 2, RoundingMode.HALF_UP);

        BigDecimal max = records.stream().map(r -> r.getTotalScore() != null ? r.getTotalScore() : BigDecimal.ZERO)
                .max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        BigDecimal min = records.stream().map(r -> r.getTotalScore() != null ? r.getTotalScore() : BigDecimal.ZERO)
                .min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);

        // 及格线 = 总分 * 60%
        BigDecimal passScore = paper.getTotalScore() != null
                ? paper.getTotalScore().multiply(new BigDecimal("0.6"))
                : new BigDecimal("60");
        long passCount = records.stream()
                .filter(r -> r.getTotalScore() != null
                        && r.getTotalScore().compareTo(passScore) >= 0).count();
        BigDecimal passRate = records.isEmpty() ? BigDecimal.ZERO
                : new BigDecimal(passCount).divide(new BigDecimal(records.size()), 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal(100)).setScale(1, RoundingMode.HALF_UP);

        // 学生成绩列表：合并花名册 + 已交卷（未交卷 0 分）
        List<ExamResultDTO.StudentScoreItem> studentScores = allStudentIds.stream().map(sid -> {
            Student s = studentMap.get(sid);
            AssessmentRecord r = submittedMap.get(sid);
            boolean submitted = r != null;
            return ExamResultDTO.StudentScoreItem.builder()
                    .studentId(sid)
                    .studentNo(s != null ? s.getStudentNo() : null)
                    .name(s != null ? s.getName() : null)
                    .totalScore(submitted && r.getTotalScore() != null ? r.getTotalScore() : BigDecimal.ZERO)
                    .submitStatus(submitted ? "SUBMITTED" : "ABSENT")
                    .submitTime(submitted && r.getSubmitTime() != null ? r.getSubmitTime().toString() : null)
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
    public List<GradingItemVO> getGradingList(Long courseId, Long paperId) {
        List<Long> paperIds;
        if (paperId != null) {
            paperIds = List.of(paperId);
        } else {
            List<ExamPaper> papers = examPaperMapper.selectList(
                    new LambdaQueryWrapper<ExamPaper>().eq(ExamPaper::getCourseId, courseId));
            paperIds = papers.stream().map(ExamPaper::getId).collect(Collectors.toList());
            if (paperIds.isEmpty()) return Collections.emptyList();
        }

        List<ExamAnswer> answers = examAnswerMapper.selectList(
                new LambdaQueryWrapper<ExamAnswer>()
                        .in(ExamAnswer::getPaperId, paperIds)
                        .eq(ExamAnswer::getGraded, 0)
                        .in(ExamAnswer::getQuestionType, List.of("SHORT", "COMPREHENSIVE"))
                        .orderByAsc(ExamAnswer::getQuestionNo));
        if (answers.isEmpty()) return Collections.emptyList();

        Map<Long, ExamPaper> paperMap = examPaperMapper.selectBatchIds(paperIds).stream()
                .collect(Collectors.toMap(ExamPaper::getId, p -> p));
        Set<Long> studentIds = answers.stream().map(ExamAnswer::getStudentId).collect(Collectors.toSet());
        Map<Long, Student> studentMap = studentMapper.selectBatchIds(studentIds).stream()
                .collect(Collectors.toMap(Student::getId, s -> s));
        Set<Long> questionIds = answers.stream().map(ExamAnswer::getQuestionId).collect(Collectors.toSet());
        Map<Long, QuestionBank> qbMap = questionBankMapper.selectBatchIds(questionIds).stream()
                .collect(Collectors.toMap(QuestionBank::getId, q -> q));

        Map<Long, Map<Long, String>> overrideMap = new HashMap<>();
        for (Long pid : paperIds) {
            overrideMap.put(pid, loadOverrideMap(pid));
        }

        return answers.stream().map(a -> {
            ExamPaper p = paperMap.get(a.getPaperId());
            Student s = studentMap.get(a.getStudentId());
            QuestionBank qb = qbMap.get(a.getQuestionId());
            String content = overrideMap.getOrDefault(a.getPaperId(), Collections.emptyMap())
                    .getOrDefault(a.getQuestionId(), qb != null ? qb.getContent() : null);
            return GradingItemVO.builder()
                    .answerId(a.getId())
                    .recordId(a.getRecordId())
                    .paperId(a.getPaperId())
                    .paperName(p != null ? p.getPaperName() : null)
                    .studentId(a.getStudentId())
                    .studentNo(s != null ? s.getStudentNo() : null)
                    .studentName(s != null ? s.getName() : null)
                    .questionNo(a.getQuestionNo())
                    .questionType(a.getQuestionType())
                    .questionStem(content != null ? parseStem(content) : null)
                    .studentAnswer(a.getStudentAnswer())
                    .correctAnswer(a.getCorrectAnswer())
                    .maxScore(a.getMaxScore())
                    .score(a.getScore())
                    .submitTime(a.getCreateTime())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void submitGrade(Long answerId, Long graderUserId, BigDecimal score, String comment) {
        ExamAnswer answer = examAnswerMapper.selectById(answerId);
        if (answer == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "作答记录不存在");
        }
        if (isObjective(answer.getQuestionType())) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "客观题已自动批改，无需手动批阅");
        }
        if (answer.getGraded() != null && answer.getGraded() == 1) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "该题已批阅，请勿重复操作");
        }
        if (answer.getMaxScore() != null && score.compareTo(answer.getMaxScore()) > 0) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "分数不能超过本题满分");
        }

        answer.setScore(score);
        answer.setComment(comment);
        answer.setGraded(1);
        answer.setGraderId(resolveTeacherId(graderUserId));
        examAnswerMapper.updateById(answer);

        recalculateRecordTotal(answer.getRecordId());
        log.info("主观题批阅: answerId={}, recordId={}, score={}", answerId, answer.getRecordId(), score);
    }

    @Override
    public PaperGradingVO getPaperGrading(Long paperId, Long userId) {
        ExamPaper paper = getPaperById(paperId);
        Assessment assessment = assessmentMapper.selectOne(
                new LambdaQueryWrapper<Assessment>().eq(Assessment::getPaperId, paperId));
        if (assessment == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "考试不存在");
        }

        List<AssessmentRecord> records = assessmentRecordMapper.selectList(
                new LambdaQueryWrapper<AssessmentRecord>()
                        .eq(AssessmentRecord::getAssessmentId, assessment.getId())
                        .orderByAsc(AssessmentRecord::getStudentId));
        if (records.isEmpty()) {
            return PaperGradingVO.builder()
                    .paperId(paperId).paperName(paper.getPaperName())
                    .totalScore(paper.getTotalScore()).students(Collections.emptyList())
                    .build();
        }

        Set<Long> studentIds = records.stream().map(AssessmentRecord::getStudentId).collect(Collectors.toSet());
        Map<Long, Student> studentMap = studentMapper.selectBatchIds(studentIds).stream()
                .collect(Collectors.toMap(Student::getId, s -> s));

        Set<Long> recordIds = records.stream().map(AssessmentRecord::getId).collect(Collectors.toSet());
        List<ExamAnswer> allAnswers = examAnswerMapper.selectList(
                new LambdaQueryWrapper<ExamAnswer>()
                        .in(ExamAnswer::getRecordId, recordIds)
                        .orderByAsc(ExamAnswer::getQuestionNo));
        Map<Long, List<ExamAnswer>> answerMap = allAnswers.stream()
                .collect(Collectors.groupingBy(ExamAnswer::getRecordId));

        Set<Long> questionIds = allAnswers.stream().map(ExamAnswer::getQuestionId).collect(Collectors.toSet());
        Map<Long, QuestionBank> qbMap = questionIds.isEmpty() ? Collections.emptyMap()
                : questionBankMapper.selectBatchIds(questionIds).stream()
                        .collect(Collectors.toMap(QuestionBank::getId, q -> q));
        Map<Long, String> overrideMap = loadOverrideMap(paperId);

        List<PaperGradingVO.StudentItem> students = records.stream().map(r -> {
            Student s = studentMap.get(r.getStudentId());
            List<ExamAnswer> answers = answerMap.getOrDefault(r.getId(), Collections.emptyList());
            BigDecimal objective = answers.stream()
                    .filter(a -> isObjective(a.getQuestionType()))
                    .map(a -> a.getScore() != null ? a.getScore() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            int pending = (int) answers.stream()
                    .filter(a -> !isObjective(a.getQuestionType()))
                    .filter(a -> a.getGraded() == null || a.getGraded() == 0)
                    .count();

            List<PaperGradingVO.QuestionItem> questions = answers.stream().map(a -> {
                QuestionBank qb = qbMap.get(a.getQuestionId());
                String content = overrideMap.getOrDefault(a.getQuestionId(),
                        qb != null ? qb.getContent() : null);
                return PaperGradingVO.QuestionItem.builder()
                        .answerId(a.getId())
                        .questionId(a.getQuestionId())
                        .questionNo(a.getQuestionNo())
                        .questionType(a.getQuestionType())
                        .stem(content != null ? parseStem(content) : null)
                        .options(content != null ? parseOptions(content) : Collections.emptyList())
                        .studentAnswer(a.getStudentAnswer())
                        .correctAnswer(a.getCorrectAnswer())
                        .maxScore(a.getMaxScore())
                        .score(a.getScore())
                        .graded(a.getGraded())
                        .comment(a.getComment())
                        .build();
            }).collect(Collectors.toList());

            return PaperGradingVO.StudentItem.builder()
                    .recordId(r.getId())
                    .studentId(r.getStudentId())
                    .studentNo(s != null ? s.getStudentNo() : null)
                    .studentName(s != null ? s.getName() : null)
                    .submitTime(r.getSubmitTime())
                    .objectiveScore(objective)
                    .totalScore(r.getTotalScore())
                    .pendingCount(pending)
                    .questions(questions)
                    .build();
        }).collect(Collectors.toList());

        return PaperGradingVO.builder()
                .paperId(paperId)
                .paperName(paper.getPaperName())
                .totalScore(paper.getTotalScore())
                .students(students)
                .build();
    }

    @Override
    @Transactional
    public BigDecimal submitStudentGrade(Long recordId, Long graderUserId,
                                         List<StudentGradeRequestDTO.GradeItem> grades) {
        Long teacherId = resolveTeacherId(graderUserId);
        if (grades == null || grades.isEmpty()) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "批阅列表不能为空");
        }
        for (StudentGradeRequestDTO.GradeItem g : grades) {
            if (g.getAnswerId() == null || g.getScore() == null) continue;
            ExamAnswer answer = examAnswerMapper.selectById(g.getAnswerId());
            if (answer == null) {
                throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "作答记录不存在");
            }
            if (!recordId.equals(answer.getRecordId())) {
                throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "作答记录不属于该学生试卷");
            }
            if (isObjective(answer.getQuestionType())) {
                throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "客观题已自动批改，无需手动批阅");
            }
            if (answer.getGraded() != null && answer.getGraded() == 1) {
                continue; // 已批阅，跳过
            }
            if (answer.getMaxScore() != null && g.getScore().compareTo(answer.getMaxScore()) > 0) {
                throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "分数不能超过本题满分");
            }
            answer.setScore(g.getScore());
            answer.setComment(g.getComment());
            answer.setGraded(1);
            answer.setGraderId(teacherId);
            examAnswerMapper.updateById(answer);
        }
        recalculateRecordTotal(recordId);
        AssessmentRecord record = assessmentRecordMapper.selectById(recordId);
        return record != null && record.getTotalScore() != null ? record.getTotalScore() : BigDecimal.ZERO;
    }

    private void recalculateRecordTotal(Long recordId) {
        List<ExamAnswer> answers = examAnswerMapper.selectList(
                new LambdaQueryWrapper<ExamAnswer>().eq(ExamAnswer::getRecordId, recordId));
        BigDecimal total = answers.stream()
                .map(a -> a.getScore() != null ? a.getScore() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        AssessmentRecord record = assessmentRecordMapper.selectById(recordId);
        if (record != null) {
            record.setTotalScore(total);
            assessmentRecordMapper.updateById(record);
        }
    }

    // ===== 状态与可见性助手 =====

    private void normalizeEnded(List<ExamPaper> papers) {
        if (papers == null || papers.isEmpty()) return;
        LocalDateTime now = LocalDateTime.now();
        List<ExamPaper> toEnd = papers.stream()
                .filter(p -> "PUBLISHED".equals(p.getStatus())
                        && p.getEndTime() != null && now.isAfter(p.getEndTime()))
                .collect(Collectors.toList());
        for (ExamPaper p : toEnd) {
            p.setStatus("ENDED");
            examPaperMapper.updateById(p);
            Assessment a = assessmentMapper.selectOne(
                    new LambdaQueryWrapper<Assessment>().eq(Assessment::getPaperId, p.getId()));
            if (a != null) {
                a.setStatus("ENDED");
                assessmentMapper.updateById(a);
            }
        }
    }

    private void fillUngradedCount(List<ExamPaper> papers) {
        if (papers == null || papers.isEmpty()) return;
        List<Long> paperIds = papers.stream().map(ExamPaper::getId).collect(Collectors.toList());
        List<ExamAnswer> pending = examAnswerMapper.selectList(
                new LambdaQueryWrapper<ExamAnswer>()
                        .in(ExamAnswer::getPaperId, paperIds)
                        .eq(ExamAnswer::getGraded, 0)
                        .in(ExamAnswer::getQuestionType, List.of("SHORT", "COMPREHENSIVE")));
        Map<Long, Set<Long>> paperRecordIds = new HashMap<>();
        for (ExamAnswer a : pending) {
            paperRecordIds.computeIfAbsent(a.getPaperId(), k -> new HashSet<>()).add(a.getRecordId());
        }
        for (ExamPaper p : papers) {
            p.setUngradedCount(paperRecordIds.getOrDefault(p.getId(), Collections.emptySet()).size());
        }
    }

    private Set<Long> targetClassIds(ExamPaper paper) {
        Set<Long> ids = new HashSet<>();
        if (paper.getTargetClasses() != null && !paper.getTargetClasses().isBlank()) {
            for (String s : paper.getTargetClasses().split(",")) {
                String t = s.trim();
                if (!t.isEmpty()) {
                    try {
                        ids.add(Long.parseLong(t));
                    } catch (NumberFormatException ignored) {
                        // 忽略非数字段
                    }
                }
            }
        }
        if (ids.isEmpty() && paper.getCourseId() != null) {
            ids.add(paper.getCourseId());
        }
        return ids;
    }

    private Set<Long> enrolledCourseIds(Long studentId) {
        List<CourseStudent> csList = courseStudentMapper.selectList(
                new LambdaQueryWrapper<CourseStudent>().eq(CourseStudent::getStudentId, studentId));
        return csList.stream().map(CourseStudent::getCourseId).collect(Collectors.toSet());
    }

    private boolean inTargetClasses(Set<Long> enrolled, ExamPaper paper) {
        if (enrolled == null || enrolled.isEmpty()) return false;
        Set<Long> target = targetClassIds(paper);
        target.retainAll(enrolled);
        return !target.isEmpty();
    }

    private Set<Long> targetStudentIds(ExamPaper paper) {
        Set<Long> ids = new HashSet<>();
        if (paper.getTargetStudents() != null && !paper.getTargetStudents().isBlank()) {
            for (String s : paper.getTargetStudents().split(",")) {
                String t = s.trim();
                if (!t.isEmpty()) {
                    try {
                        ids.add(Long.parseLong(t));
                    } catch (NumberFormatException ignored) {
                        // 忽略非数字段
                    }
                }
            }
        }
        return ids;
    }

    private boolean inTargetStudents(Long studentId, Set<Long> enrolled, ExamPaper paper) {
        Set<Long> targetStudents = targetStudentIds(paper);
        if (!targetStudents.isEmpty()) {
            return targetStudents.contains(studentId);
        }
        return inTargetClasses(enrolled, paper);
    }

    // ===== 错题本 =====

    private void writeWrongQuestion(Long studentId, Long courseId, QuestionBank qb,
                                    String studentAnswer, String correctAnswer) {
        StudentWrongQuestion existing = studentWrongQuestionMapper.selectOne(
                new LambdaQueryWrapper<StudentWrongQuestion>()
                        .eq(StudentWrongQuestion::getStudentId, studentId)
                        .eq(StudentWrongQuestion::getCourseId, courseId)
                        .eq(StudentWrongQuestion::getSourceId, qb.getId())
                        .eq(StudentWrongQuestion::getSource, "ASSESSMENT"));
        if (existing != null) {
            existing.setWrongCount((existing.getWrongCount() != null ? existing.getWrongCount() : 0) + 1);
            existing.setStudentAnswer(studentAnswer);
            existing.setCorrectAnswer(correctAnswer);
            existing.setUpdateTime(LocalDateTime.now());
            studentWrongQuestionMapper.updateById(existing);
        } else {
            StudentWrongQuestion wq = new StudentWrongQuestion();
            wq.setStudentId(studentId);
            wq.setCourseId(courseId);
            wq.setQuestionContent(qb.getContent());
            wq.setStudentAnswer(studentAnswer);
            wq.setCorrectAnswer(correctAnswer);
            wq.setKnowledgePoints(qb.getKnowledgePoints());
            wq.setAnalysis(parseAnalysis(qb.getContent()));
            wq.setWrongCount(1);
            wq.setSource("ASSESSMENT");
            wq.setSourceId(qb.getId());
            studentWrongQuestionMapper.insert(wq);
        }
    }

    // ===== 题目内容解析 =====

    private String effectiveContent(ExamPaperQuestion epq, QuestionBank qb) {
        if (epq != null && epq.getContentOverride() != null && !epq.getContentOverride().isBlank()) {
            return epq.getContentOverride();
        }
        return qb != null ? qb.getContent() : null;
    }

    private Map<Long, String> loadOverrideMap(Long paperId) {
        List<ExamPaperQuestion> epqs = examPaperQuestionMapper.selectList(
                new LambdaQueryWrapper<ExamPaperQuestion>()
                        .eq(ExamPaperQuestion::getPaperId, paperId));
        return epqs.stream()
                .filter(e -> e.getContentOverride() != null && !e.getContentOverride().isBlank())
                .collect(Collectors.toMap(ExamPaperQuestion::getQuestionId, ExamPaperQuestion::getContentOverride));
    }

    private JsonNode parseContent(String content) {
        if (content == null || content.isBlank()) return null;
        try {
            return objectMapper.readTree(content);
        } catch (Exception e) {
            log.warn("解析题目内容 JSON 失败: {}", e.getMessage());
            return null;
        }
    }

    private String parseAnswer(String content) {
        JsonNode node = parseContent(content);
        if (node == null) return null;
        JsonNode answer = node.get("answer");
        if (answer == null || answer.isNull()) return null;
        if (answer.isArray()) return answer.toString();
        return answer.asText();
    }

    private String parseEditableAnswer(String content) {
        JsonNode node = parseContent(content);
        if (node == null) return null;
        JsonNode answer = node.get("answer");
        if (answer == null || answer.isNull()) return null;
        if (answer.isArray()) {
            List<String> parts = new ArrayList<>();
            answer.forEach(a -> parts.add(a.asText()));
            return String.join(",", parts);
        }
        return answer.asText();
    }

    private String parseStem(String content) {
        JsonNode node = parseContent(content);
        if (node == null) return null;
        JsonNode stem = node.get("stem");
        if (stem == null || stem.isNull()) {
            JsonNode question = node.get("question");
            return question != null ? question.asText() : null;
        }
        return stem.asText();
    }

    private String parseAnalysis(String content) {
        JsonNode node = parseContent(content);
        if (node == null) return null;
        JsonNode analysis = node.get("analysis");
        return analysis != null && !analysis.isNull() ? analysis.asText() : null;
    }

    private List<StudentExamVO.Option> parseOptions(String content) {
        JsonNode node = parseContent(content);
        if (node == null) return Collections.emptyList();
        JsonNode options = node.get("options");
        if (options == null || options.isNull()) return Collections.emptyList();
        List<StudentExamVO.Option> result = new ArrayList<>();
        if (options.isArray()) {
            for (JsonNode o : options) {
                result.add(StudentExamVO.Option.builder()
                        .label(o.path("label").asText())
                        .text(o.path("text").asText())
                        .build());
            }
        } else if (options.isObject()) {
            Iterator<String> names = options.fieldNames();
            while (names.hasNext()) {
                String label = names.next();
                result.add(StudentExamVO.Option.builder()
                        .label(label)
                        .text(options.get(label).asText())
                        .build());
            }
        }
        return result;
    }

    // ===== 客观题批改 =====

    private boolean isObjective(String questionType) {
        return "SINGLE".equals(questionType) || "MULTI".equals(questionType)
                || "FILL".equals(questionType) || "TRUE_FALSE".equals(questionType);
    }

    private boolean isCorrectAnswer(String correct, String student, String type) {
        if (correct == null || student == null) return false;
        return normalizeAnswer(correct, type).equals(normalizeAnswer(student, type));
    }

    private String normalizeAnswer(String raw, String type) {
        if (raw == null) return "";
        String trimmed = raw.trim();
        if ("MULTI".equals(type)) {
            char[] arr = trimmed.replaceAll("[,\\s、]", "").toUpperCase().toCharArray();
            Arrays.sort(arr);
            return new String(arr);
        }
        return trimmed.replaceAll("\\s+", "").toUpperCase();
    }
}
