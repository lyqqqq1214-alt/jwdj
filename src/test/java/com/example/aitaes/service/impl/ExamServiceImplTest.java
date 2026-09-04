package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.dto.ExamPaperCreateDTO;
import com.example.aitaes.dto.ExamResultDTO;
import com.example.aitaes.dto.GradingItemVO;
import com.example.aitaes.dto.PaperGradingVO;
import com.example.aitaes.dto.PaperQuestionEditVO;
import com.example.aitaes.dto.StudentExamRecordVO;
import com.example.aitaes.dto.StudentExamResultVO;
import com.example.aitaes.dto.SubmitExamResultDTO;
import com.example.aitaes.entity.*;
import com.example.aitaes.mapper.*;
import com.example.aitaes.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ExamService 单元测试")
class ExamServiceImplTest {

    @Mock private ExamPaperMapper examPaperMapper;
    @Mock private ExamPaperQuestionMapper examPaperQuestionMapper;
    @Mock private QuestionBankMapper questionBankMapper;
    @Mock private AssessmentMapper assessmentMapper;
    @Mock private AssessmentRecordMapper assessmentRecordMapper;
    @Mock private ExamAnswerMapper examAnswerMapper;
    @Mock private CourseStudentMapper courseStudentMapper;
    @Mock private StudentMapper studentMapper;
    @Mock private StudentWrongQuestionMapper studentWrongQuestionMapper;
    @Mock private CourseMapper courseMapper;
    @Mock private TeacherMapper teacherMapper;
    @Mock private TeachingAssistantMapper teachingAssistantMapper;
    @Mock private UserMapper userMapper;
    @Mock private NotificationService notificationService;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();
    @InjectMocks private ExamServiceImpl examService;

    private ExamPaper paper;
    private QuestionBank question;
    private Student student;

    @BeforeEach
    void setUp() {
        paper = new ExamPaper();
        paper.setId(1L);
        paper.setCourseId(1L);
        paper.setTeacherId(1L);
        paper.setPaperName("期中考试");
        paper.setTotalScore(new BigDecimal("100.00"));
        paper.setStatus("DRAFT");
        paper.setStartTime(LocalDateTime.now().minusHours(1));
        paper.setEndTime(LocalDateTime.now().plusHours(1));

        question = new QuestionBank();
        question.setId(10L);
        question.setCourseId(1L);
        question.setQuestionType("SINGLE");
        question.setContent("{\"stem\":\"1+1=?\",\"options\":[{\"label\":\"A\",\"text\":\"1\"}],\"answer\":\"2\"}");
        question.setUsageCount(0);

        student = new Student();
        student.setId(100L);
        student.setUserId(3L);
        student.setStudentNo("S2024001");
        student.setName("赵小明");
    }

    private Teacher teacherOf(Long userId) {
        Teacher teacher = new Teacher();
        teacher.setId(1L);
        teacher.setUserId(userId);
        return teacher;
    }

    @Nested
    @DisplayName("createPaper — 创建试卷")
    class CreatePaper {

        @Test
        @DisplayName("EX-01: 应创建试卷并关联题目")
        void shouldCreatePaperWithQuestions() {
            ExamPaperCreateDTO dto = new ExamPaperCreateDTO();
            dto.setPaperName("期中考试");
            dto.setCourseId(1L);
            ExamPaperCreateDTO.QuestionItem qi = new ExamPaperCreateDTO.QuestionItem();
            qi.setQuestionId(10L); qi.setQuestionNo(1); qi.setScore(new BigDecimal("5"));
            dto.setQuestions(List.of(qi));

            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(teacherOf(1L));
            when(questionBankMapper.selectById(10L)).thenReturn(question);

            ExamPaper result = examService.createPaper(1L, dto);

            assertNotNull(result);
            assertEquals("DRAFT", result.getStatus());
            verify(examPaperMapper).insert(any(ExamPaper.class));
            verify(examPaperQuestionMapper).insert(any(ExamPaperQuestion.class));
            verify(questionBankMapper).updateById(any(QuestionBank.class));
        }

        @Test
        @DisplayName("EX-21: 应落库题目内容快照")
        void shouldStoreContentOverride() {
            ExamPaperCreateDTO dto = new ExamPaperCreateDTO();
            dto.setPaperName("期中考试");
            dto.setCourseId(1L);
            ExamPaperCreateDTO.QuestionItem qi = new ExamPaperCreateDTO.QuestionItem();
            qi.setQuestionId(10L); qi.setQuestionNo(1); qi.setScore(new BigDecimal("5"));
            qi.setContent("{\"stem\":\"编辑后的题干\",\"options\":[{\"label\":\"A\",\"text\":\"1\"}],\"answer\":\"A\"}");
            dto.setQuestions(List.of(qi));

            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(teacherOf(1L));
            when(questionBankMapper.selectById(10L)).thenReturn(question);

            examService.createPaper(1L, dto);

            ArgumentCaptor<ExamPaperQuestion> captor = ArgumentCaptor.forClass(ExamPaperQuestion.class);
            verify(examPaperQuestionMapper).insert(captor.capture());
            assertEquals("{\"stem\":\"编辑后的题干\",\"options\":[{\"label\":\"A\",\"text\":\"1\"}],\"answer\":\"A\"}",
                    captor.getValue().getContentOverride());
        }
    }

    @Nested
    @DisplayName("publish/close — 发布与关闭")
    class PublishClose {

        @Test
        @DisplayName("EX-02: 应发布考试并创建考核")
        void shouldPublishAndCreateAssessment() {
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            ExamPaperQuestion epq = new ExamPaperQuestion();
            epq.setQuestionId(10L); epq.setQuestionNo(1); epq.setScore(new BigDecimal("10"));
            when(examPaperQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(epq));
            when(assessmentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

            examService.publishPaper(1L);

            verify(assessmentMapper).insert(any(Assessment.class));
            verify(examPaperMapper).updateById(any(ExamPaper.class));
            verify(notificationService).notifyExamPublished(paper);
            assertEquals("PUBLISHED", paper.getStatus());
        }

        @Test
        @DisplayName("EX-03: 结束时间早于当前时间应拒绝发布")
        void shouldRejectPublish_WhenEndTimePassed() {
            paper.setEndTime(LocalDateTime.now().minusMinutes(10));
            when(examPaperMapper.selectById(1L)).thenReturn(paper);

            assertThrows(BusinessException.class, () -> examService.publishPaper(1L));
            verify(examPaperMapper, never()).updateById(any(ExamPaper.class));
        }

        @Test
        @DisplayName("EX-04: 应结束考试")
        void shouldClose() {
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            when(assessmentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

            examService.closePaper(1L);

            assertEquals("ENDED", paper.getStatus());
            verify(examPaperMapper).updateById(any(ExamPaper.class));
        }

        @Test
        @DisplayName("EX-05: 试卷不存在应抛出异常")
        void shouldThrowException_WhenPaperNotFound() {
            when(examPaperMapper.selectById(999L)).thenReturn(null);
            assertThrows(BusinessException.class, () -> examService.publishPaper(999L));
        }
    }

    @Nested
    @DisplayName("getPendingExams — 学生待考列表")
    class GetPendingExams {

        @Test
        @DisplayName("EX-06: 应返回学生课程的已发布考试")
        void shouldReturnPublishedExams() {
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(new CourseStudent() {{
                        setCourseId(1L); setStudentId(100L);
                    }}));
            paper.setStatus("PUBLISHED");
            when(examPaperMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(paper));
            when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            List<ExamPaper> result = examService.getPendingExams(3L);

            assertEquals(1, result.size());
            assertEquals("PUBLISHED", result.get(0).getStatus());
        }

        @Test
        @DisplayName("EX-34: 已交卷试卷应移出待考")
        void shouldExcludeSubmittedPaperFromPending() {
            paper.setStatus("PUBLISHED");
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(new CourseStudent() {{
                        setCourseId(1L); setStudentId(100L);
                    }}));
            when(examPaperMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(paper));

            AssessmentRecord record = new AssessmentRecord();
            record.setStudentId(100L);
            record.setAssessmentId(1L);
            when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(record));

            Assessment assessment = new Assessment();
            assessment.setId(1L);
            assessment.setPaperId(1L);
            when(assessmentMapper.selectBatchIds(any())).thenReturn(List.of(assessment));

            List<ExamPaper> result = examService.getPendingExams(3L);

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @DisplayName("getExamForStudent — 学生取卷")
    class GetExamForStudent {

        @Test
        @DisplayName("EX-07: 应返回含题目但不含答案的卷面")
        void shouldReturnPaperWithQuestions() {
            paper.setStatus("PUBLISHED");
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(new CourseStudent() {{
                        setCourseId(1L); setStudentId(100L);
                    }}));
            ExamPaperQuestion epq = new ExamPaperQuestion();
            epq.setQuestionId(10L); epq.setQuestionNo(1); epq.setScore(new BigDecimal("5"));
            when(examPaperQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(epq));
            when(questionBankMapper.selectBatchIds(any())).thenReturn(List.of(question));

            var vo = examService.getExamForStudent(1L, 3L);

            assertEquals(1, vo.getQuestions().size());
            assertEquals("1+1=?", vo.getQuestions().get(0).getStem());
            assertNotNull(vo.getQuestions().get(0).getOptions());
        }

        @Test
        @DisplayName("EX-22: 应返回题目快照覆盖题库题干")
        void shouldReturnOverriddenStem() {
            paper.setStatus("PUBLISHED");
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(new CourseStudent() {{
                        setCourseId(1L); setStudentId(100L);
                    }}));
            ExamPaperQuestion epq = new ExamPaperQuestion();
            epq.setQuestionId(10L); epq.setQuestionNo(1); epq.setScore(new BigDecimal("5"));
            epq.setContentOverride("{\"stem\":\"编辑后的题干\",\"options\":[{\"label\":\"A\",\"text\":\"1\"}]}");
            when(examPaperQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(epq));
            when(questionBankMapper.selectBatchIds(any())).thenReturn(List.of(question));

            var vo = examService.getExamForStudent(1L, 3L);

            assertEquals("编辑后的题干", vo.getQuestions().get(0).getStem());
        }

        @Test
        @DisplayName("EX-35: 已交卷学生应禁止再次进入")
        void shouldRejectAlreadySubmittedStudent() {
            paper.setStatus("PUBLISHED");
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(examPaperMapper.selectById(1L)).thenReturn(paper);

            AssessmentRecord record = new AssessmentRecord();
            record.setStudentId(100L);
            record.setAssessmentId(1L);
            when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(record));
            Assessment assessment = new Assessment();
            assessment.setId(1L);
            assessment.setPaperId(1L);
            when(assessmentMapper.selectBatchIds(any())).thenReturn(List.of(assessment));

            assertThrows(BusinessException.class, () -> examService.getExamForStudent(1L, 3L));
        }
    }

    @Nested
    @DisplayName("submitExam — 学生交卷")
    class SubmitExam {

        private Assessment assessment;

        @BeforeEach
        void setUp() {
            paper.setStatus("PUBLISHED");
            assessment = new Assessment();
            assessment.setId(1L);
            assessment.setPaperId(1L);
        }

        @Test
        @DisplayName("EX-08: 客观题答对应得满分并落库")
        void shouldGetFullScore_WhenAllCorrect() {
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            when(assessmentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(assessment);
            when(assessmentRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

            ExamPaperQuestion epq = new ExamPaperQuestion();
            epq.setQuestionId(10L); epq.setQuestionNo(1); epq.setScore(new BigDecimal("10"));
            when(examPaperQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(epq));
            when(questionBankMapper.selectById(10L)).thenReturn(question);

            SubmitExamResultDTO result = examService.submitExam(1L, 3L, Map.of(10L, "2"));

            assertEquals(new BigDecimal("10"), result.getObjectiveScore());
            assertEquals(1, result.getObjectiveCount());
            assertEquals(0, result.getSubjectiveCount());
            verify(examAnswerMapper).insert(any(ExamAnswer.class));
            verify(assessmentRecordMapper).insert(any(AssessmentRecord.class));
            verify(studentWrongQuestionMapper, never()).insert(any(StudentWrongQuestion.class));
        }

        @Test
        @DisplayName("EX-09: 答案错误应得零分并写错题本")
        void shouldGetZeroScore_WhenWrong() {
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            when(assessmentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(assessment);
            when(assessmentRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

            ExamPaperQuestion epq = new ExamPaperQuestion();
            epq.setQuestionId(10L); epq.setQuestionNo(1); epq.setScore(new BigDecimal("10"));
            when(examPaperQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(epq));
            when(questionBankMapper.selectById(10L)).thenReturn(question);
            when(studentWrongQuestionMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

            examService.submitExam(1L, 3L, Map.of(10L, "wrong"));

            verify(studentWrongQuestionMapper).insert(any(StudentWrongQuestion.class));
            ArgumentCaptor<ExamAnswer> captor = ArgumentCaptor.forClass(ExamAnswer.class);
            verify(examAnswerMapper).insert(captor.capture());
            assertEquals(0, captor.getValue().getIsCorrect());
            assertEquals(BigDecimal.ZERO, captor.getValue().getScore());
        }

        @Test
        @DisplayName("EX-10: 多选题答案顺序不同也判对")
        void shouldGradeMultiSelectIgnoringOrder() {
            QuestionBank multi = new QuestionBank();
            multi.setId(20L);
            multi.setCourseId(1L);
            multi.setQuestionType("MULTI");
            multi.setContent("{\"stem\":\"多选\",\"answer\":\"A,C\"}");

            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            when(assessmentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(assessment);
            when(assessmentRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

            ExamPaperQuestion epq = new ExamPaperQuestion();
            epq.setQuestionId(20L); epq.setQuestionNo(1); epq.setScore(new BigDecimal("10"));
            when(examPaperQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(epq));
            when(questionBankMapper.selectById(20L)).thenReturn(multi);

            examService.submitExam(1L, 3L, Map.of(20L, "C,A"));

            ArgumentCaptor<ExamAnswer> captor = ArgumentCaptor.forClass(ExamAnswer.class);
            verify(examAnswerMapper).insert(captor.capture());
            assertEquals(1, captor.getValue().getIsCorrect());
            assertEquals(new BigDecimal("10"), captor.getValue().getScore());
        }

        @Test
        @DisplayName("EX-11: 主观题交卷不判分，待批阅")
        void shouldNotGradeSubjective() {
            QuestionBank shortQ = new QuestionBank();
            shortQ.setId(30L);
            shortQ.setCourseId(1L);
            shortQ.setQuestionType("SHORT");
            shortQ.setContent("{\"stem\":\"简述TCP三次握手\",\"answer\":\"参考\"}");

            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            when(assessmentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(assessment);
            when(assessmentRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

            ExamPaperQuestion epq = new ExamPaperQuestion();
            epq.setQuestionId(30L); epq.setQuestionNo(1); epq.setScore(new BigDecimal("10"));
            when(examPaperQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(epq));
            when(questionBankMapper.selectById(30L)).thenReturn(shortQ);

            SubmitExamResultDTO result = examService.submitExam(1L, 3L, Map.of(30L, "握手过程"));

            assertEquals(BigDecimal.ZERO, result.getObjectiveScore());
            assertEquals(0, result.getObjectiveCount());
            assertEquals(1, result.getSubjectiveCount());

            ArgumentCaptor<ExamAnswer> captor = ArgumentCaptor.forClass(ExamAnswer.class);
            verify(examAnswerMapper).insert(captor.capture());
            assertNull(captor.getValue().getScore());
            assertEquals(0, captor.getValue().getGraded());
        }

        @Test
        @DisplayName("EX-23: 客观题按快照答案判分")
        void shouldGradeUsingOverrideAnswer() {
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            when(assessmentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(assessment);
            when(assessmentRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

            // 题库原答案 "2"，但本卷快照把答案改成 "A"
            ExamPaperQuestion epq = new ExamPaperQuestion();
            epq.setQuestionId(10L); epq.setQuestionNo(1); epq.setScore(new BigDecimal("10"));
            epq.setContentOverride("{\"stem\":\"1+1=?\",\"options\":[{\"label\":\"A\",\"text\":\"2\"}],\"answer\":\"A\"}");
            when(examPaperQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(epq));
            when(questionBankMapper.selectById(10L)).thenReturn(question);

            SubmitExamResultDTO result = examService.submitExam(1L, 3L, Map.of(10L, "A"));

            assertEquals(new BigDecimal("10"), result.getObjectiveScore());
            assertEquals(1, result.getObjectiveCount());
        }

        @Test
        @DisplayName("EX-12: 重复交卷应抛出异常")
        void shouldRejectDuplicateSubmit() {
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            when(assessmentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(assessment);
            when(assessmentRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);

            assertThrows(BusinessException.class,
                    () -> examService.submitExam(1L, 3L, Map.of(10L, "2")));
            verify(assessmentRecordMapper, never()).insert(any(AssessmentRecord.class));
        }

        @Test
        @DisplayName("EX-36: 截止后2分钟宽限期内仍可交卷")
        void shouldAllowSubmitWithinGrace() {
            paper.setEndTime(LocalDateTime.now().minusMinutes(1));
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            when(assessmentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(assessment);
            when(assessmentRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

            ExamPaperQuestion epq = new ExamPaperQuestion();
            epq.setQuestionId(10L); epq.setQuestionNo(1); epq.setScore(new BigDecimal("10"));
            when(examPaperQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(epq));
            when(questionBankMapper.selectById(10L)).thenReturn(question);

            SubmitExamResultDTO result = examService.submitExam(1L, 3L, Map.of(10L, "2"));

            assertEquals(new BigDecimal("10"), result.getObjectiveScore());
        }

        @Test
        @DisplayName("EX-37: 超过宽限期应拒绝交卷")
        void shouldRejectSubmitAfterGrace() {
            paper.setEndTime(LocalDateTime.now().minusMinutes(10));
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(examPaperMapper.selectById(1L)).thenReturn(paper);

            assertThrows(BusinessException.class, () -> examService.submitExam(1L, 3L, Map.of(10L, "2")));
        }
    }

    @Nested
    @DisplayName("getExamResults — 考试结果统计")
    class GetExamResults {

        @Test
        @DisplayName("EX-13: 应计算正确的统计值")
        void shouldCalculateStatistics() {
            when(examPaperMapper.selectById(1L)).thenReturn(paper);

            Assessment assessment = new Assessment();
            assessment.setId(1L);
            when(assessmentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(assessment);

            AssessmentRecord r1 = new AssessmentRecord();
            r1.setStudentId(100L); r1.setTotalScore(new BigDecimal("90"));
            AssessmentRecord r2 = new AssessmentRecord();
            r2.setStudentId(101L); r2.setTotalScore(new BigDecimal("70"));
            when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(r1, r2));
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            when(studentMapper.selectBatchIds(any())).thenReturn(List.of());

            ExamResultDTO result = examService.getExamResults(1L);

            assertEquals(new BigDecimal("80.00"), result.getAverageScore());
            assertTrue(result.getMaxScore().compareTo(new BigDecimal("90.00")) == 0);
            assertTrue(result.getMinScore().compareTo(new BigDecimal("70.00")) == 0);
        }

        @Test
        @DisplayName("EX-14: 无考核记录时应返回空统计")
        void shouldReturnEmptyStats_WhenNoAssessment() {
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            when(assessmentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

            ExamResultDTO result = examService.getExamResults(1L);

            assertEquals(BigDecimal.ZERO, result.getAverageScore());
            assertEquals(0, result.getTotalStudents());
        }
    }

    @Nested
    @DisplayName("submitGrade — 批阅主观题")
    class SubmitGrade {

        @Test
        @DisplayName("EX-15: 应更新分数并重算总分")
        void shouldUpdateScoreAndRecalculateTotal() {
            ExamAnswer answer = new ExamAnswer();
            answer.setId(1L);
            answer.setRecordId(9L);
            answer.setQuestionType("SHORT");
            answer.setGraded(0);
            answer.setMaxScore(new BigDecimal("15"));
            when(examAnswerMapper.selectById(1L)).thenReturn(answer);
            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(teacherOf(1L));

            ExamAnswer graded = new ExamAnswer();
            graded.setScore(new BigDecimal("12"));
            when(examAnswerMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(graded));

            AssessmentRecord record = new AssessmentRecord();
            record.setId(9L);
            when(assessmentRecordMapper.selectById(9L)).thenReturn(record);

            examService.submitGrade(1L, 1L, new BigDecimal("12"), "回答完整");

            assertEquals(1, answer.getGraded());
            verify(examAnswerMapper).updateById(answer);
            verify(assessmentRecordMapper).updateById(record);
            assertEquals(new BigDecimal("12"), record.getTotalScore());
        }
    }

    @Nested
    @DisplayName("getGradingList — 待批阅列表")
    class GetGradingList {

        @Test
        @DisplayName("EX-16: 应返回该课程下待批主观题")
        void shouldReturnUngradedSubjective() {
            when(examPaperMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(paper));
            ExamAnswer answer = new ExamAnswer();
            answer.setId(1L);
            answer.setPaperId(1L);
            answer.setStudentId(100L);
            answer.setQuestionId(30L);
            answer.setQuestionNo(1);
            answer.setQuestionType("SHORT");
            answer.setStudentAnswer("握手过程");
            answer.setGraded(0);
            when(examAnswerMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(answer));
            when(examPaperMapper.selectBatchIds(any())).thenReturn(List.of(paper));
            when(studentMapper.selectBatchIds(any())).thenReturn(List.of(student));
            QuestionBank shortQ = new QuestionBank();
            shortQ.setId(30L);
            shortQ.setContent("{\"stem\":\"简述TCP三次握手\",\"answer\":\"参考\"}");
            when(questionBankMapper.selectBatchIds(any())).thenReturn(List.of(shortQ));

            List<GradingItemVO> result = examService.getGradingList(1L, null);

            assertEquals(1, result.size());
            assertEquals("握手过程", result.get(0).getStudentAnswer());
            assertEquals("简述TCP三次握手", result.get(0).getQuestionStem());
        }
    }

    @Nested
    @DisplayName("getMyExamRecords — 学生历史考试")
    class GetMyExamRecords {

        @Test
        @DisplayName("EX-17: 应返回历史记录并汇总得分与待批数")
        void shouldReturnRecordsWithSummary() {
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);

            AssessmentRecord record = new AssessmentRecord();
            record.setId(1L);
            record.setAssessmentId(1L);
            record.setStudentId(100L);
            record.setTotalScore(new BigDecimal("10"));
            record.setSubmitStatus("ON_TIME");
            record.setSubmitTime(LocalDateTime.now());
            when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(record));

            Assessment assessment = new Assessment();
            assessment.setId(1L);
            assessment.setPaperId(1L);
            assessment.setCourseId(1L);
            assessment.setAssessmentName("期中考试");
            assessment.setTotalScore(new BigDecimal("100"));
            when(assessmentMapper.selectBatchIds(any())).thenReturn(List.of(assessment));

            ExamPaper p = new ExamPaper();
            p.setId(1L);
            p.setPaperName("期中考试");
            p.setTotalScore(new BigDecimal("100"));
            when(examPaperMapper.selectBatchIds(any())).thenReturn(List.of(p));

            Course course = new Course();
            course.setId(1L);
            course.setCourseName("计算机网络");
            when(courseMapper.selectBatchIds(any())).thenReturn(List.of(course));

            ExamAnswer objective = new ExamAnswer();
            objective.setRecordId(1L);
            objective.setQuestionType("SINGLE");
            objective.setScore(new BigDecimal("10"));
            objective.setGraded(1);
            ExamAnswer subjective = new ExamAnswer();
            subjective.setRecordId(1L);
            subjective.setQuestionType("SHORT");
            subjective.setScore(null);
            subjective.setGraded(0);
            when(examAnswerMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(objective, subjective));

            List<StudentExamRecordVO> result = examService.getMyExamRecords(3L);

            assertEquals(1, result.size());
            assertEquals(new BigDecimal("10"), result.get(0).getMyScore());
            assertEquals(new BigDecimal("10"), result.get(0).getObjectiveScore());
            assertEquals(1, result.get(0).getSubjectivePending());
            assertEquals("GRADING", result.get(0).getStatus());
            assertEquals("计算机网络", result.get(0).getCourseName());
        }

        @Test
        @DisplayName("EX-18: 无记录应返回空列表")
        void shouldReturnEmpty_WhenNoRecords() {
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            List<StudentExamRecordVO> result = examService.getMyExamRecords(3L);

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @DisplayName("getMyExamResult — 学生回看试卷")
    class GetMyExamResult {

        private Assessment assessment;
        private AssessmentRecord record;

        @BeforeEach
        void setUp() {
            assessment = new Assessment();
            assessment.setId(1L);
            assessment.setPaperId(1L);

            record = new AssessmentRecord();
            record.setId(9L);
            record.setAssessmentId(1L);
            record.setStudentId(100L);
            record.setSubmitTime(LocalDateTime.now());
        }

        @Test
        @DisplayName("EX-19: 应返回每题作答与批阅结果")
        void shouldReturnPerQuestionDetail() {
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            when(assessmentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(assessment);
            when(assessmentRecordMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(record);

            ExamAnswer objective = new ExamAnswer();
            objective.setQuestionNo(1);
            objective.setQuestionType("SINGLE");
            objective.setStudentAnswer("2");
            objective.setCorrectAnswer("2");
            objective.setScore(new BigDecimal("10"));
            objective.setMaxScore(new BigDecimal("10"));
            objective.setIsCorrect(1);
            objective.setGraded(1);
            ExamAnswer subjective = new ExamAnswer();
            subjective.setQuestionNo(2);
            subjective.setQuestionType("SHORT");
            subjective.setStudentAnswer("握手过程");
            subjective.setScore(null);
            subjective.setGraded(0);
            when(examAnswerMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(objective, subjective));

            when(questionBankMapper.selectBatchIds(any())).thenReturn(List.of(question));

            StudentExamResultVO result = examService.getMyExamResult(1L, 3L);

            assertEquals(2, result.getAnswers().size());
            assertEquals(new BigDecimal("10"), result.getMyScore());
            assertEquals(1, result.getSubjectivePending());
        }

        @Test
        @DisplayName("EX-20: 未参加该考试应抛出异常")
        void shouldThrow_WhenNotParticipated() {
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            when(assessmentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(assessment);
            when(assessmentRecordMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

            assertThrows(BusinessException.class, () -> examService.getMyExamResult(1L, 3L));
        }
    }

    @Nested
    @DisplayName("getPendingExams — 班级可见性")
    class PendingExamsVisibility {

        @Test
        @DisplayName("EX-24: 学生不在目标班级应看不到考试")
        void shouldHideExamWhenNotInTargetClass() {
            paper.setStatus("PUBLISHED");
            paper.setTargetClasses("2,3");
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(new CourseStudent() {{
                        setCourseId(1L); setStudentId(100L);
                    }}));
            when(examPaperMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(paper));
            when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            List<ExamPaper> result = examService.getPendingExams(3L);

            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("EX-25: 学生在目标班级应看到考试")
        void shouldShowExamWhenInTargetClass() {
            paper.setStatus("PUBLISHED");
            paper.setTargetClasses("1,2");
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(new CourseStudent() {{
                        setCourseId(1L); setStudentId(100L);
                    }}));
            when(examPaperMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(paper));
            when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            List<ExamPaper> result = examService.getPendingExams(3L);

            assertEquals(1, result.size());
        }
    }

    @Nested
    @DisplayName("getExamResults — 及格线与花名册")
    class ExamResultsPassAndRoster {

        @Test
        @DisplayName("EX-26: 及格率按总分60%且含未交卷学生")
        void shouldUsePercentPassAndIncludeAbsent() {
            paper.setTotalScore(new BigDecimal("100.00"));
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            Assessment assessment = new Assessment();
            assessment.setId(1L);
            when(assessmentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(assessment);

            AssessmentRecord r1 = new AssessmentRecord();
            r1.setStudentId(100L); r1.setTotalScore(new BigDecimal("59.99"));
            when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(r1));

            CourseStudent cs1 = new CourseStudent();
            cs1.setCourseId(1L); cs1.setStudentId(100L);
            CourseStudent cs2 = new CourseStudent();
            cs2.setCourseId(1L); cs2.setStudentId(101L);
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(cs1, cs2));

            Student s1 = new Student();
            s1.setId(100L); s1.setStudentNo("S001"); s1.setName("甲");
            Student s2 = new Student();
            s2.setId(101L); s2.setStudentNo("S002"); s2.setName("乙");
            when(studentMapper.selectBatchIds(any())).thenReturn(List.of(s1, s2));

            ExamResultDTO result = examService.getExamResults(1L);

            assertEquals(2, result.getTotalStudents());
            assertEquals(1, result.getSubmittedCount());
            assertEquals(0, result.getPassRate().compareTo(new BigDecimal("0.0")));
            ExamResultDTO.StudentScoreItem absent = result.getStudentScores().stream()
                    .filter(x -> x.getStudentId() == 101L).findFirst().orElse(null);
            assertNotNull(absent);
            assertEquals(BigDecimal.ZERO, absent.getTotalScore());
            assertEquals("ABSENT", absent.getSubmitStatus());
        }
    }

    @Nested
    @DisplayName("getPaperGrading — 按学生整卷批阅")
    class GetPaperGrading {

        @Test
        @DisplayName("EX-27: 应按学生分组返回整卷批阅数据")
        void shouldReturnGroupedGrading() {
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            Assessment assessment = new Assessment();
            assessment.setId(1L);
            when(assessmentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(assessment);

            AssessmentRecord record = new AssessmentRecord();
            record.setId(9L); record.setStudentId(100L); record.setTotalScore(BigDecimal.ZERO);
            when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(record));
            when(studentMapper.selectBatchIds(any())).thenReturn(List.of(student));

            ExamAnswer subjective = new ExamAnswer();
            subjective.setId(1L); subjective.setRecordId(9L); subjective.setQuestionId(30L);
            subjective.setQuestionNo(1); subjective.setQuestionType("SHORT");
            subjective.setStudentAnswer("握手"); subjective.setGraded(0);
            when(examAnswerMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(subjective));

            QuestionBank shortQ = new QuestionBank();
            shortQ.setId(30L);
            shortQ.setContent("{\"stem\":\"简述TCP\",\"answer\":\"参考\"}");
            when(questionBankMapper.selectBatchIds(any())).thenReturn(List.of(shortQ));
            when(examPaperQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            PaperGradingVO result = examService.getPaperGrading(1L, 2L);

            assertEquals(1, result.getStudents().size());
            assertEquals(1, result.getStudents().get(0).getPendingCount());
            assertEquals("握手", result.getStudents().get(0).getQuestions().get(0).getStudentAnswer());
        }
    }

    @Nested
    @DisplayName("getPaperQuestions — 试卷题目编辑")
    class GetPaperQuestions {

        @Test
        @DisplayName("EX-28: 应返回试卷题目编辑内容")
        void shouldReturnPaperQuestions() {
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            ExamPaperQuestion epq = new ExamPaperQuestion();
            epq.setQuestionId(10L); epq.setQuestionNo(1); epq.setScore(new BigDecimal("5"));
            epq.setContentOverride("{\"stem\":\"编辑题干\",\"options\":[{\"label\":\"A\",\"text\":\"1\"}],\"answer\":\"A\",\"analysis\":\"解析\"}");
            when(examPaperQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(epq));
            when(questionBankMapper.selectBatchIds(any())).thenReturn(List.of(question));

            List<PaperQuestionEditVO> result = examService.getPaperQuestions(1L);

            assertEquals(1, result.size());
            assertEquals("编辑题干", result.get(0).getStem());
            assertEquals("A", result.get(0).getAnswer());
        }
    }

    @Nested
    @DisplayName("getPaperById — 惰性结束")
    class AutoEndPaper {

        @Test
        @DisplayName("EX-29: 过期已发布试卷自动转为结束")
        void shouldAutoEndExpiredPaper() {
            paper.setStatus("PUBLISHED");
            paper.setEndTime(LocalDateTime.now().minusMinutes(1));
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            when(assessmentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

            ExamPaper result = examService.getPaperById(1L);

            assertEquals("ENDED", result.getStatus());
            verify(examPaperMapper).updateById(paper);
        }
    }

    @Nested
    @DisplayName("updatePaper — 编辑试卷")
    class UpdatePaper {

        @Test
        @DisplayName("EX-30: 应物理删除旧题目再重建，避免唯一键冲突")
        void shouldPhysicallyDeleteOldQuestionsThenReinsert() {
            when(examPaperMapper.selectById(1L)).thenReturn(paper);

            ExamPaperCreateDTO dto = new ExamPaperCreateDTO();
            dto.setPaperName("期中考试（改）");
            dto.setCourseId(1L);
            ExamPaperCreateDTO.QuestionItem qi = new ExamPaperCreateDTO.QuestionItem();
            qi.setQuestionId(10L); qi.setQuestionNo(1); qi.setScore(new BigDecimal("5"));
            dto.setQuestions(List.of(qi));

            ExamPaper result = examService.updatePaper(1L, dto);

            assertEquals("期中考试（改）", result.getPaperName());
            verify(examPaperMapper).updateById(paper);
            verify(examPaperQuestionMapper).physicalDeleteByPaperId(1L);
            verify(examPaperQuestionMapper).insert(any(ExamPaperQuestion.class));
        }
    }

    @Nested
    @DisplayName("targetStudents — 按学生分配考试")
    class TargetStudents {

        @Test
        @DisplayName("EX-31: targetStudents 非空时仅目标学生可见待考")
        void shouldShowExamOnlyForTargetStudents() {
            paper.setStatus("PUBLISHED");
            paper.setTargetStudents("100");
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(new CourseStudent() {{
                        setCourseId(1L); setStudentId(100L);
                    }}));
            when(examPaperMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(paper));
            when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            List<ExamPaper> result = examService.getPendingExams(3L);

            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("EX-32: targetStudents 未包含学生应不可见")
        void shouldHideExamWhenNotInTargetStudents() {
            paper.setStatus("PUBLISHED");
            paper.setTargetStudents("101,102");
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(new CourseStudent() {{
                        setCourseId(1L); setStudentId(100L);
                    }}));
            when(examPaperMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(paper));
            when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            List<ExamPaper> result = examService.getPendingExams(3L);

            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("EX-33: getExamResults 花名册直接取 targetStudents")
        void shouldUseTargetStudentsForRoster() {
            paper.setTargetStudents("100,101");
            when(examPaperMapper.selectById(1L)).thenReturn(paper);
            Assessment assessment = new Assessment();
            assessment.setId(1L);
            when(assessmentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(assessment);

            AssessmentRecord r1 = new AssessmentRecord();
            r1.setStudentId(100L); r1.setTotalScore(new BigDecimal("80"));
            when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(r1));

            Student s1 = new Student();
            s1.setId(100L); s1.setStudentNo("S001"); s1.setName("甲");
            Student s2 = new Student();
            s2.setId(101L); s2.setStudentNo("S002"); s2.setName("乙");
            when(studentMapper.selectBatchIds(any())).thenReturn(List.of(s1, s2));

            ExamResultDTO result = examService.getExamResults(1L);

            assertEquals(2, result.getTotalStudents());
            verify(courseStudentMapper, never()).selectList(any(LambdaQueryWrapper.class));
        }
    }
}
