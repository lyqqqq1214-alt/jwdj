package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.dto.AiChatMessageDTO;
import com.example.aitaes.dto.AiChatRequest;
import com.example.aitaes.dto.AiChatResponseDTO;
import com.example.aitaes.dto.AiInsightDTO;
import com.example.aitaes.dto.ChartItem;
import com.example.aitaes.dto.DashboardChartsDTO;
import com.example.aitaes.dto.DashboardOverviewDTO;
import com.example.aitaes.dto.StudentProfileVO;
import com.example.aitaes.dto.TrendDTO;
import com.example.aitaes.dto.WarningStudentDTO;
import com.example.aitaes.entity.Assessment;
import com.example.aitaes.entity.AssessmentRecord;
import com.example.aitaes.entity.Attendance;
import com.example.aitaes.entity.Course;
import com.example.aitaes.entity.CourseStudent;
import com.example.aitaes.entity.Student;
import com.example.aitaes.entity.StudentKpMastery;
import com.example.aitaes.entity.StudentWrongQuestion;
import com.example.aitaes.entity.Teacher;
import com.example.aitaes.mapper.AssessmentMapper;
import com.example.aitaes.mapper.AssessmentRecordMapper;
import com.example.aitaes.mapper.AttendanceMapper;
import com.example.aitaes.mapper.CourseMapper;
import com.example.aitaes.mapper.CourseStudentMapper;
import com.example.aitaes.mapper.StudentKpMasteryMapper;
import com.example.aitaes.mapper.StudentMapper;
import com.example.aitaes.mapper.StudentWrongQuestionMapper;
import com.example.aitaes.mapper.TeacherMapper;
import com.example.aitaes.service.AiChatService;
import com.example.aitaes.service.DashboardService;
import com.example.aitaes.service.OllamaService;
import com.example.aitaes.service.PortraitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatServiceImpl implements AiChatService {

    private static final int MAX_HISTORY = 8;

    private final OllamaService ollamaService;
    private final PortraitService portraitService;
    private final DashboardService dashboardService;
    private final StudentMapper studentMapper;
    private final TeacherMapper teacherMapper;
    private final CourseMapper courseMapper;
    private final CourseStudentMapper courseStudentMapper;
    private final AssessmentMapper assessmentMapper;
    private final AssessmentRecordMapper assessmentRecordMapper;
    private final AttendanceMapper attendanceMapper;
    private final StudentKpMasteryMapper studentKpMasteryMapper;
    private final StudentWrongQuestionMapper studentWrongQuestionMapper;

    @Override
    public AiChatResponseDTO chat(Long userId, String role, AiChatRequest request) {
        if (request == null || !StringUtils.hasText(request.getMessage())) {
            throw new BusinessException(400, "提问内容不能为空");
        }

        String normalizedRole = normalizeRole(role);
        if (!List.of("TEACHER", "ASSISTANT", "STUDENT").contains(normalizedRole)) {
            throw new BusinessException(403, "当前角色不支持 AI 对话助手");
        }

        Long courseId = request.getCourseId();
        if ("STUDENT".equals(normalizedRole)) {
            courseId = resolveStudentCourseId(userId, courseId);
            request.setCourseId(courseId);
        }

        List<AiChatMessageDTO> messages = new ArrayList<>();
        messages.add(AiChatMessageDTO.builder()
                .role("system")
                .content(buildSystemPrompt(normalizedRole, Boolean.TRUE.equals(request.getSocraticMode())))
                .build());

        String businessContext = buildBusinessContext(userId, normalizedRole, request);
        if (StringUtils.hasText(businessContext)) {
            messages.add(AiChatMessageDTO.builder()
                    .role("system")
                    .content(businessContext)
                    .build());
        }

        appendHistory(messages, request.getHistory());
        messages.add(AiChatMessageDTO.builder()
                .role("user")
                .content(buildUserMessage(request))
                .build());

        log.info("AI 对话请求: role={}, userId={}, courseId={}, studentId={}, page={}",
                normalizedRole, userId, request.getCourseId(), request.getStudentId(), request.getPageContext());
        String answer = ollamaService.chat(messages);
        
        List<String> socraticQuestions = new ArrayList<>();
        String cleanedAnswer = answer;
        if (Boolean.TRUE.equals(request.getSocraticMode())) {
            cleanedAnswer = extractSocraticQuestions(answer, socraticQuestions);
        }

        return AiChatResponseDTO.builder()
                .answer(cleanAnswer(cleanedAnswer))
                .assistantMode("STUDENT".equals(normalizedRole) ? "student-learning" : "teacher-analysis")
                .socraticMode(Boolean.TRUE.equals(request.getSocraticMode()))
                .socraticQuestions(socraticQuestions.isEmpty() ? null : socraticQuestions)
                .build();
    }

    private String extractSocraticQuestions(String answer, List<String> questions) {
        if (!StringUtils.hasText(answer)) return answer;
        
        // 简单的提取逻辑：寻找最后面以问号结尾的行，或者带有数字编号的行
        String[] lines = answer.split("\\n");
        StringBuilder mainContent = new StringBuilder();
        boolean findingQuestions = false;
        
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) continue;
            
            // 如果某行看起来像是一个启发式问题（以问号结尾且较短，或者在最后几个段落）
            if (line.endsWith("？") || line.endsWith("?")) {
                if (line.length() < 50 && questions.size() < 3) {
                    questions.add(line.replaceAll("^\\d+[.、\\s]+", ""));
                    continue;
                }
            }
            mainContent.append(lines[i]).append("\n");
        }
        
        return questions.isEmpty() ? answer : mainContent.toString().trim();
    }

    private void appendHistory(List<AiChatMessageDTO> messages, List<AiChatMessageDTO> history) {
        if (CollectionUtils.isEmpty(history)) {
            return;
        }
        int start = Math.max(0, history.size() - MAX_HISTORY);
        for (AiChatMessageDTO item : history.subList(start, history.size())) {
            if (item == null || !StringUtils.hasText(item.getContent())) {
                continue;
            }
            String role = item.getRole();
            if (!"user".equalsIgnoreCase(role) && !"assistant".equalsIgnoreCase(role)) {
                continue;
            }
            messages.add(AiChatMessageDTO.builder()
                    .role(role.toLowerCase())
                    .content(item.getContent().trim())
                    .build());
        }
    }

    private String buildUserMessage(AiChatRequest request) {
        StringBuilder builder = new StringBuilder();
        if (StringUtils.hasText(request.getPageContext())) {
            builder.append("当前页面：").append(request.getPageContext().trim()).append("\n");
        }
        if (!CollectionUtils.isEmpty(request.getAttachmentNames())) {
            builder.append("当前附件：")
                    .append(request.getAttachmentNames().stream()
                            .filter(StringUtils::hasText)
                            .collect(Collectors.joining("、")))
                    .append("\n");
        }
        builder.append("用户问题：").append(request.getMessage().trim());
        return builder.toString();
    }

    private String buildSystemPrompt(String role, boolean socraticMode) {
        String socraticInstruction = socraticMode
                ? """
                你必须采用苏格拉底启发式提问模式：
                1. 先用 1 到 3 个递进问题帮助用户定位问题本质。
                2. 再给出分步骤提示、分析框架或下一步建议。
                3. 对计算题、概念题或策略问题，不要一开始直接给最终结论，要保留一定启发性。
                4. 问题必须简洁、可执行，不要空泛说教。
                """
                : "直接给出结论清晰、条理明确、结合系统数据的回答。";

        if ("STUDENT".equals(role)) {
            return """
                    你是 AITAES 学习问答助手，服务对象是学生。
                    你的任务是根据课程学情数据、成绩趋势、错题与知识点掌握情况提供学习答疑、复习建议和方法指导。
                    回答要求：
                    1. 优先结合提供的课程、画像、错题和知识点数据回答。
                    2. 输出结构清晰，优先使用短段落或编号。
                    3. 避免编造系统中不存在的数据；缺失信息时明确说明并给出下一步建议。
                    4. 语气专业、鼓励、具体，可直接指导学生行动。
                    %s
                    """.formatted(socraticInstruction);
        }

        return """
                你是 AITAES 教学分析问答助手，服务对象是教师或助教。
                你的任务是基于课程学情、学生画像、考核、出勤和知识点掌握情况，提供教学诊断、风险识别、干预建议和答疑支持。
                回答要求：
                1. 优先结合提供的课程和学生画像数据回答，必要时给出可执行的教学干预方案。
                2. 可以从成绩、考勤、作业、实验、知识点薄弱项多个维度综合分析。
                3. 不编造未提供的数据；缺少上下文时明确指出并给出补充建议。
                4. 语气专业、简洁、面向教学决策。
                %s
                """.formatted(socraticInstruction);
    }

    private String buildBusinessContext(Long userId, String role, AiChatRequest request) {
        return "以下是当前系统提供的业务上下文，请优先基于这些事实作答：\n"
                + ("STUDENT".equals(role)
                ? buildStudentContext(userId, request.getCourseId(), request.getPageContext())
                : buildTeacherContext(userId, request.getCourseId(), request.getStudentId(), request.getPageContext()));
    }

    private String buildTeacherContext(Long userId, Long courseId, Long studentId, String pageContext) {
        StringBuilder builder = new StringBuilder();
        Teacher teacher = teacherMapper.selectOne(new LambdaQueryWrapper<Teacher>()
                .eq(Teacher::getUserId, userId)
                .last("LIMIT 1"));
        
        if (teacher != null) {
            builder.append("当前用户：教师/助教 ").append(defaultText(teacher.getName())).append("\n");
            // 获取该教师负责的所有课程
            List<Course> myCourses = courseMapper.selectList(new LambdaQueryWrapper<Course>()
                    .eq(Course::getTeacherId, teacher.getId()));
            if (!myCourses.isEmpty()) {
                builder.append("您负责的全部课程及学情摘要：\n");
                for (Course c : myCourses) {
                    builder.append("- ").append(c.getCourseName()).append("(").append(c.getCourseNo()).append("): ")
                           .append(buildCourseSummary(c.getId())).append("\n");
                }
            }
        }

        if (StringUtils.hasText(pageContext)) {
            builder.append("当前页面：").append(pageContext.trim()).append("\n");
        }
        if (courseId == null) {
            builder.append("当前未选择具体课程，仅能进行通用教学咨询。\n");
            return builder.toString();
        }

        Course course = getCourseOrThrow(courseId);
        builder.append("课程信息：")
                .append(course.getCourseName())
                .append("，课程号=").append(defaultText(course.getCourseNo()))
                .append("，班级=").append(defaultText(course.getClassName()))
                .append("，学期=").append(defaultText(course.getSemester()))
                .append("\n");
        builder.append(buildCourseSummary(courseId));

        if (studentId != null) {
            CourseStudent courseStudent = courseStudentMapper.selectOne(new LambdaQueryWrapper<CourseStudent>()
                    .eq(CourseStudent::getCourseId, courseId)
                    .eq(CourseStudent::getStudentId, studentId)
                    .last("LIMIT 1"));
            if (courseStudent == null) {
                throw new BusinessException(404, "当前课程下不存在该学生");
            }
            builder.append(buildStudentProfileSummary(studentId, courseId));
        } else {
            builder.append("当前未锁定具体学生，请偏向班级层面的教学分析与干预建议。\n");
        }
        return builder.toString();
    }

    private String buildStudentContext(Long userId, Long courseId, String pageContext) {
        Student student = getStudentByUserId(userId);
        Course course = getCourseOrThrow(courseId);

        StringBuilder builder = new StringBuilder();
        builder.append("当前用户：学生 ").append(defaultText(student.getName()))
                .append("，学号=").append(defaultText(student.getStudentNo())).append("\n");
        builder.append("当前课程：").append(defaultText(course.getCourseName()))
                .append("，任课教师=").append(resolveTeacherName(course.getTeacherId()))
                .append("，学期=").append(defaultText(course.getSemester()))
                .append("\n");
        if (StringUtils.hasText(pageContext)) {
            builder.append("当前页面：").append(pageContext.trim()).append("\n");
        }

        StudentProfileVO profile = portraitService.getProfile(student.getId(), courseId);
        builder.append("画像摘要：总评=").append(formatNumber(profile.getTotalScore()))
                .append("，出勤率=").append(formatPercent(profile.getAttendanceRate()))
                .append("，作业提交率=").append(formatPercent(profile.getHomeworkRate()))
                .append("，班级排名=")
                .append(profile.getClassRank() == null ? "暂无" : profile.getClassRank() + "/" + profile.getClassTotal())
                .append("\n");
        builder.append("优势知识点：").append(summarizeKnowledge(profile.getKnowledgeRadar(), false, 3)).append("\n");
        builder.append("薄弱知识点：").append(summarizeKnowledge(profile.getKnowledgeRadar(), true, 3)).append("\n");
        builder.append("近期成绩趋势：").append(summarizeTrend(profile.getScoreTrendList())).append("\n");
        builder.append("最近错题：").append(summarizeWrongQuestions(student.getId(), courseId)).append("\n");
        return builder.toString();
    }

    private String buildCourseSummary(Long courseId) {
        StringBuilder builder = new StringBuilder();
        List<CourseStudent> courseStudents = courseStudentMapper.selectList(new LambdaQueryWrapper<CourseStudent>()
                .eq(CourseStudent::getCourseId, courseId));
        List<Assessment> assessments = assessmentMapper.selectList(new LambdaQueryWrapper<Assessment>()
                .eq(Assessment::getCourseId, courseId)
                .orderByAsc(Assessment::getAssessmentDate));
        List<Long> assessmentIds = assessments.stream().map(Assessment::getId).toList();
        List<AssessmentRecord> records = assessmentIds.isEmpty()
                ? List.of()
                : assessmentRecordMapper.selectList(new LambdaQueryWrapper<AssessmentRecord>()
                .in(AssessmentRecord::getAssessmentId, assessmentIds));
        List<Attendance> attendanceList = attendanceMapper.selectList(new LambdaQueryWrapper<Attendance>()
                .eq(Attendance::getCourseId, courseId));

        BigDecimal avgScore = records.stream()
                .map(AssessmentRecord::getTotalScore)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long scoredCount = records.stream().filter(record -> record.getTotalScore() != null).count();
        if (scoredCount > 0) {
            avgScore = avgScore.divide(BigDecimal.valueOf(scoredCount), 1, RoundingMode.HALF_UP);
        }

        long presentCount = attendanceList.stream().filter(attendance -> "出勤".equals(attendance.getStatus())).count();
        BigDecimal attendanceRate = attendanceList.isEmpty()
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(presentCount)
                .divide(BigDecimal.valueOf(attendanceList.size()), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(1, RoundingMode.HALF_UP);
        long focusedCount = courseStudents.stream().filter(item -> Integer.valueOf(1).equals(item.getIsFocus())).count();

        builder.append("课程概况：学生数=").append(courseStudents.size())
                .append("，考核数=").append(assessments.size())
                .append("，平均成绩=").append(formatNumber(avgScore))
                .append("，整体出勤率=").append(formatPercent(attendanceRate))
                .append("，重点关注学生=").append(focusedCount)
                .append("\n");
        builder.append("班级薄弱知识点：").append(summarizeCourseWeakKnowledge(courseId)).append("\n");
        return builder.toString();
    }

    private String buildStudentProfileSummary(Long studentId, Long courseId) {
        Student student = studentMapper.selectById(studentId);
        StudentProfileVO profile = portraitService.getProfile(studentId, courseId);
        StringBuilder builder = new StringBuilder();
        builder.append("目标学生：").append(student == null ? studentId : defaultText(student.getName()))
                .append("，学号=").append(student == null ? "未知" : defaultText(student.getStudentNo()))
                .append("\n");
        builder.append("学生画像：总评=").append(formatNumber(profile.getTotalScore()))
                .append("，出勤率=").append(formatPercent(profile.getAttendanceRate()))
                .append("，作业提交率=").append(formatPercent(profile.getHomeworkRate()))
                .append("，班级排名=")
                .append(profile.getClassRank() == null ? "暂无" : profile.getClassRank() + "/" + profile.getClassTotal())
                .append("，是否重点关注=").append(Boolean.TRUE.equals(profile.getIsFocus()) ? "是" : "否")
                .append("\n");
        builder.append("学生优势知识点：").append(summarizeKnowledge(profile.getKnowledgeRadar(), false, 3)).append("\n");
        builder.append("学生薄弱知识点：").append(summarizeKnowledge(profile.getKnowledgeRadar(), true, 3)).append("\n");
        builder.append("学生近期成绩：").append(summarizeTrend(profile.getScoreTrendList())).append("\n");
        builder.append("学生最近错题：").append(summarizeWrongQuestions(studentId, courseId)).append("\n");
        if (StringUtils.hasText(profile.getAiEvaluation())) {
            builder.append("已保存 AI 学情评价：").append(profile.getAiEvaluation()).append("\n");
        }
        return builder.toString();
    }

    private String summarizeCourseWeakKnowledge(Long courseId) {
        List<StudentKpMastery> masteryList = studentKpMasteryMapper.selectList(new LambdaQueryWrapper<StudentKpMastery>()
                .eq(StudentKpMastery::getCourseId, courseId));
        if (masteryList.isEmpty()) {
            return "暂无知识点掌握度数据";
        }
        Map<String, BigDecimal> averages = new LinkedHashMap<>();
        masteryList.stream()
                .collect(Collectors.groupingBy(StudentKpMastery::getKpName, LinkedHashMap::new, Collectors.toList()))
                .forEach((kpName, items) -> {
                    BigDecimal total = items.stream()
                            .map(StudentKpMastery::getMasteryRate)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    long count = items.stream().filter(item -> item.getMasteryRate() != null).count();
                    averages.put(kpName, count == 0 ? BigDecimal.ZERO
                            : total.divide(BigDecimal.valueOf(count), 1, RoundingMode.HALF_UP));
                });
        return averages.entrySet().stream()
                .sorted(Map.Entry.comparingByValue())
                .limit(5)
                .map(entry -> entry.getKey() + "(" + formatNumber(entry.getValue()) + "%)")
                .collect(Collectors.joining("、"));
    }

    private String summarizeKnowledge(List<ChartItem> knowledgeList, boolean ascending, int limit) {
        if (CollectionUtils.isEmpty(knowledgeList)) {
            return "暂无数据";
        }
        Comparator<ChartItem> comparator = Comparator.comparing(
                item -> item.getValue() == null ? BigDecimal.ZERO : item.getValue());
        if (!ascending) {
            comparator = comparator.reversed();
        }
        return knowledgeList.stream()
                .sorted(comparator)
                .limit(limit)
                .map(item -> item.getName() + "(" + formatNumber(item.getValue()) + "%)")
                .collect(Collectors.joining("、"));
    }

    private String summarizeTrend(List<TrendDTO> trendList) {
        if (CollectionUtils.isEmpty(trendList) || CollectionUtils.isEmpty(trendList.getFirst().getSemesters())) {
            return "暂无成绩趋势数据";
        }
        TrendDTO trend = trendList.getFirst();
        int size = trend.getSemesters().size();
        int start = Math.max(0, size - 3);
        List<String> parts = new ArrayList<>();
        for (int i = start; i < size; i++) {
            parts.add(trend.getSemesters().get(i) + ":" + formatNumber(trend.getOverallScores().get(i)));
        }
        return String.join("；", parts);
    }

    private String summarizeWrongQuestions(Long studentId, Long courseId) {
        List<StudentWrongQuestion> wrongQuestions = studentWrongQuestionMapper.selectList(new LambdaQueryWrapper<StudentWrongQuestion>()
                .eq(StudentWrongQuestion::getStudentId, studentId)
                .eq(StudentWrongQuestion::getCourseId, courseId)
                .orderByDesc(StudentWrongQuestion::getCreateTime)
                .last("LIMIT 3"));
        if (wrongQuestions.isEmpty()) {
            return "暂无错题记录";
        }
        return wrongQuestions.stream()
                .map(item -> {
                    String knowledgePoints = StringUtils.hasText(item.getKnowledgePoints())
                            ? item.getKnowledgePoints() : "未标注知识点";
                    String content = defaultText(item.getQuestionContent());
                    if (content.length() > 20) {
                        content = content.substring(0, 20) + "...";
                    }
                    return knowledgePoints + "[" + content + "]";
                })
                .collect(Collectors.joining("、"));
    }

    private Long resolveStudentCourseId(Long userId, Long requestedCourseId) {
        Student student = getStudentByUserId(userId);
        if (requestedCourseId != null) {
            long count = courseStudentMapper.selectCount(new LambdaQueryWrapper<CourseStudent>()
                    .eq(CourseStudent::getStudentId, student.getId())
                    .eq(CourseStudent::getCourseId, requestedCourseId));
            if (count == 0) {
                throw new BusinessException(403, "当前学生无权访问该课程");
            }
            return requestedCourseId;
        }

        CourseStudent courseStudent = courseStudentMapper.selectOne(new LambdaQueryWrapper<CourseStudent>()
                .eq(CourseStudent::getStudentId, student.getId())
                .orderByDesc(CourseStudent::getCreateTime)
                .last("LIMIT 1"));
        if (courseStudent == null) {
            throw new BusinessException(404, "当前学生暂无课程数据");
        }
        return courseStudent.getCourseId();
    }

    private Student getStudentByUserId(Long userId) {
        Student student = studentMapper.selectOne(new LambdaQueryWrapper<Student>()
                .eq(Student::getUserId, userId)
                .last("LIMIT 1"));
        if (student == null) {
            throw new BusinessException(404, "学生不存在");
        }
        return student;
    }

    private Course getCourseOrThrow(Long courseId) {
        Course course = courseMapper.selectById(courseId);
        if (course == null) {
            throw new BusinessException(404, "课程不存在");
        }
        return course;
    }

    private String resolveTeacherName(Long teacherId) {
        if (teacherId == null) {
            return "未知";
        }
        Teacher teacher = teacherMapper.selectById(teacherId);
        return teacher == null ? "未知" : defaultText(teacher.getName());
    }

    private String cleanAnswer(String answer) {
        if (!StringUtils.hasText(answer)) {
            return "AI 助手暂时没有生成有效回复，请稍后重试。";
        }
        String cleaned = answer.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```(?:markdown|md|text)?\\s*", "");
            cleaned = cleaned.replaceFirst("\\s*```$", "");
        }
        return cleaned.trim();
    }

    private String normalizeRole(String role) {
        return role == null ? "" : role.trim().toUpperCase();
    }

    private String defaultText(String value) {
        return StringUtils.hasText(value) ? value.trim() : "未知";
    }

    private String formatPercent(Number value) {
        return formatNumber(value) + "%";
    }

    private String formatNumber(Number value) {
        if (value == null) {
            return "0";
        }
        BigDecimal decimal = value instanceof BigDecimal bigDecimal
                ? bigDecimal
                : BigDecimal.valueOf(value.doubleValue());
        return decimal.stripTrailingZeros().toPlainString();
    }

    @Override
    public AiInsightDTO getInsight(Long userId, Long courseId) {
        log.info("生成AI洞察播报: userId={}, courseId={}", userId, courseId);
        
        try {
            // 复用DashboardService获取数据
            DashboardOverviewDTO overview = dashboardService.getOverview(courseId, null);
            List<WarningStudentDTO> warnings = dashboardService.getWarnings(courseId, null);
            DashboardChartsDTO charts = dashboardService.getCharts(courseId, null);
            
            // 构建AI提示词
            String prompt = buildInsightPrompt(overview, warnings, charts);
            
            // 调用AI生成播报
            String aiResponse = ollamaService.generate(prompt);
            
            // 解析响应
            return parseInsightResponse(aiResponse, overview, warnings);
        } catch (Exception e) {
            log.error("AI洞察生成失败: {}", e.getMessage(), e);
            // 降级处理
            return buildFallbackInsight(courseId);
        }
    }
    
    private String buildInsightPrompt(DashboardOverviewDTO overview, List<WarningStudentDTO> warnings, DashboardChartsDTO charts) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("你是一位AI教学助教，请基于以下教学数据生成简洁的洞察播报：\n\n");
        
        prompt.append("【班级概况】\n");
        prompt.append(String.format("- 学生人数: %d人\n", overview.getStudentCount()));
        prompt.append(String.format("- 平均分: %.1f分\n", overview.getAverageScore()));
        prompt.append(String.format("- 出勤率: %.1f%%\n", overview.getAttendanceRate()));
        prompt.append(String.format("- 作业提交率: %.1f%%\n", overview.getHomeworkRate()));
        prompt.append(String.format("- 预警学生: %d人\n\n", warnings.size()));
        
        if (!warnings.isEmpty()) {
            prompt.append("【预警学生】\n");
            for (WarningStudentDTO w : warnings) {
                prompt.append(String.format("- %s: %s\n", w.getName(), w.getWarningMsg()));
            }
            prompt.append("\n");
        }
        
        if (charts != null && charts.getScoreTrend() != null && !charts.getScoreTrend().isEmpty()) {
            prompt.append("【成绩趋势】\n");
            for (ChartItem item : charts.getScoreTrend()) {
                prompt.append(String.format("- %s: %.1f分\n", item.getName(), item.getValue().doubleValue()));
            }
            prompt.append("\n");
        }
        
        prompt.append("请生成：\n");
        prompt.append("1. 一段50字以内的播报内容（总结班级整体情况）\n");
        prompt.append("2. 对平均分、出勤率、作业提交率各一句点评（20字以内）\n");
        prompt.append("3. 判断紧急程度：URGENT（有严重问题）/IMPORTANT（需关注）/NORMAL（正常）\n\n");
        prompt.append("用JSON格式返回：\n");
        prompt.append("{\n");
        prompt.append("  \"broadcast\": \"播报内容\",\n");
        prompt.append("  \"metricComments\": [\n");
        prompt.append("    {\"metricName\": \"平均分\", \"comment\": \"点评\", \"trend\": \"UP/DOWN/STABLE\"},\n");
        prompt.append("    {\"metricName\": \"出勤率\", \"comment\": \"点评\", \"trend\": \"UP/DOWN/STABLE\"},\n");
        prompt.append("    {\"metricName\": \"作业提交率\", \"comment\": \"点评\", \"trend\": \"UP/DOWN/STABLE\"}\n");
        prompt.append("  ],\n");
        prompt.append("  \"urgency\": \"URGENT/IMPORTANT/NORMAL\"\n");
        prompt.append("}");
        
        return prompt.toString();
    }
    
    private AiInsightDTO parseInsightResponse(String aiResponse, DashboardOverviewDTO overview, List<WarningStudentDTO> warnings) {
        try {
            // 简单JSON解析
            String broadcast = extractJsonField(aiResponse, "broadcast");
            String urgency = extractJsonField(aiResponse, "urgency");
            
            List<AiInsightDTO.MetricComment> metricComments = new ArrayList<>();
            
            // 提取metricComments数组
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\"metricComments\"\\s*:\\s*\\[(.*?)\\]", java.util.regex.Pattern.DOTALL);
            java.util.regex.Matcher matcher = pattern.matcher(aiResponse);
            if (matcher.find()) {
                String arrayContent = matcher.group(1);
                // 提取每个对象
                java.util.regex.Pattern objPattern = java.util.regex.Pattern.compile("\\{([^}]+)\\}");
                java.util.regex.Matcher objMatcher = objPattern.matcher(arrayContent);
                while (objMatcher.find()) {
                    String obj = objMatcher.group(1);
                    String metricName = extractJsonField(obj, "metricName");
                    String comment = extractJsonField(obj, "comment");
                    String trend = extractJsonField(obj, "trend");
                    if (metricName != null && comment != null) {
                        metricComments.add(AiInsightDTO.MetricComment.builder()
                            .metricName(metricName)
                            .comment(comment)
                            .trend(trend != null ? trend : "STABLE")
                            .build());
                    }
                }
            }
            
            return AiInsightDTO.builder()
                .broadcast(broadcast != null ? broadcast : "AI洞察生成中...")
                .metricComments(metricComments)
                .urgency(urgency != null ? urgency : "NORMAL")
                .build();
        } catch (Exception e) {
            log.error("解析AI洞察响应失败: {}", e.getMessage());
            return buildFallbackInsight(null);
        }
    }
    
    private AiInsightDTO buildFallbackInsight(Long courseId) {
        List<AiInsightDTO.MetricComment> comments = new ArrayList<>();
        comments.add(AiInsightDTO.MetricComment.builder()
            .metricName("平均分")
            .comment("AI服务暂时不可用")
            .trend("STABLE")
            .build());
        comments.add(AiInsightDTO.MetricComment.builder()
            .metricName("出勤率")
            .comment("请稍后刷新")
            .trend("STABLE")
            .build());
        comments.add(AiInsightDTO.MetricComment.builder()
            .metricName("作业提交率")
            .comment("数据加载中")
            .trend("STABLE")
            .build());
        
        return AiInsightDTO.builder()
            .broadcast("AI助教正在分析教学数据...")
            .metricComments(comments)
            .urgency("NORMAL")
            .build();
    }
    
    private String extractJsonField(String json, String field) {
        try {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\"" + field + "\"\\s*:\\s*\"([^\"]*)\"");
            java.util.regex.Matcher matcher = pattern.matcher(json);
            if (matcher.find()) {
                return matcher.group(1);
            }
        } catch (Exception e) {
            log.debug("JSON字段提取失败: {}", field);
        }
        return null;
    }
}
