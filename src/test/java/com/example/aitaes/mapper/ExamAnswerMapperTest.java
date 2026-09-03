package com.example.aitaes.mapper;

import com.example.aitaes.entity.Assessment;
import com.example.aitaes.entity.AssessmentRecord;
import com.example.aitaes.entity.ExamAnswer;
import com.example.aitaes.entity.QuestionBank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Sql(scripts = {"/schema-h2.sql", "/test-data.sql"})
@DisplayName("ExamAnswerMapper 集成测试")
class ExamAnswerMapperTest {

    @Autowired private ExamAnswerMapper examAnswerMapper;
    @Autowired private QuestionBankMapper questionBankMapper;
    @Autowired private AssessmentMapper assessmentMapper;
    @Autowired private AssessmentRecordMapper assessmentRecordMapper;

    private Long questionId;
    private Long assessmentId;
    private Long recordId;

    @BeforeEach
    void setUp() {
        QuestionBank qb = new QuestionBank();
        qb.setCourseId(1L);
        qb.setTeacherId(1L);
        qb.setQuestionType("SINGLE");
        qb.setContent("{\"stem\":\"1+1=?\",\"answer\":\"2\"}");
        qb.setStatus("APPROVED");
        questionBankMapper.insert(qb);
        questionId = qb.getId();

        Assessment assessment = new Assessment();
        assessment.setCourseId(1L);
        assessment.setAssessmentName("测试考试");
        assessment.setAssessmentType("EXAM");
        assessmentMapper.insert(assessment);
        assessmentId = assessment.getId();

        AssessmentRecord record = new AssessmentRecord();
        record.setAssessmentId(assessmentId);
        record.setStudentId(1L);
        record.setTotalScore(BigDecimal.ZERO);
        record.setSubmitStatus("ON_TIME");
        assessmentRecordMapper.insert(record);
        recordId = record.getId();
    }

    @Test
    @DisplayName("插入作答记录 → 可查询到")
    void shouldInsertAndQuery() {
        ExamAnswer answer = new ExamAnswer();
        answer.setPaperId(1L);
        answer.setAssessmentId(assessmentId);
        answer.setRecordId(recordId);
        answer.setStudentId(1L);
        answer.setQuestionId(questionId);
        answer.setQuestionNo(1);
        answer.setQuestionType("SINGLE");
        answer.setStudentAnswer("2");
        answer.setCorrectAnswer("2");
        answer.setMaxScore(new BigDecimal("10"));
        answer.setScore(new BigDecimal("10"));
        answer.setIsCorrect(1);
        answer.setGraded(1);

        int rows = examAnswerMapper.insert(answer);

        assertEquals(1, rows);
        assertNotNull(answer.getId(), "插入后应自动回填 ID");

        List<ExamAnswer> list = examAnswerMapper.selectList(null);
        assertEquals(1, list.size());
        assertEquals("2", list.get(0).getStudentAnswer());
        assertEquals(1, list.get(0).getIsCorrect());
    }
}
