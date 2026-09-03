package com.example.aitaes.service.impl;

import com.example.aitaes.common.BusinessException;
import com.example.aitaes.config.OllamaProperties;
import com.example.aitaes.dto.AiAnalysisReportDTO;
import com.example.aitaes.dto.QuestionBankAuditDTO;
import com.example.aitaes.entity.*;
import com.example.aitaes.mapper.*;
import com.example.aitaes.service.OllamaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * AI 智能分析引擎单元测试
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AiAnalysisServiceImpl 智能分析引擎")
class AiAnalysisServiceImplTest {

    @Mock
    private CourseMapper courseMapper;
    @Mock
    private CourseStudentMapper courseStudentMapper;
    @Mock
    private StudentMapper studentMapper;
    @Mock
    private AttendanceMapper attendanceMapper;
    @Mock
    private AssessmentMapper assessmentMapper;
    @Mock
    private AssessmentRecordMapper assessmentRecordMapper;
    @Mock
    private StudentKpMasteryMapper studentKpMasteryMapper;
    @Mock
    private QuestionBankMapper questionBankMapper;
    @Mock
    private KnowledgePointMapper knowledgePointMapper;
    @Mock
    private AiAnalysisResultMapper aiAnalysisResultMapper;
    @Mock
    private OllamaService ollamaService;

    private AiAnalysisServiceImpl service;

    private Course course;
    private Student student1;
    private Student student2;

    @BeforeEach
    void setUp() {
        service = new AiAnalysisServiceImpl(courseMapper, courseStudentMapper, studentMapper,
                attendanceMapper, assessmentMapper, assessmentRecordMapper, studentKpMasteryMapper,
                questionBankMapper, knowledgePointMapper, aiAnalysisResultMapper,
                ollamaService, new OllamaProperties(), new ObjectMapper());

        course = buildCourse();
        student1 = buildStudent(1L, "202426010101", "张伟");
        student2 = buildStudent(2L, "202407010101", "李娜");
    }

    // ─── 测试数据工厂 ────────────────────────────────────────────────────────

    private Course buildCourse() {
        Course c = new Course();
        c.setId(1L);
        c.setCourseNo("CS05101");
        c.setCourseName("数据结构与算法");
        c.setSemester("2025-2026-1");
        return c;
    }

    private Student buildStudent(Long id, String no, String name) {
        Student s = new Student();
        s.setId(id);
        s.setStudentNo(no);
        s.setName(name);
        return s;
    }

    private CourseStudent buildCourseStudent(Long studentId) {
        CourseStudent cs = new CourseStudent();
        cs.setCourseId(1L);
        cs.setStudentId(studentId);
        return cs;
    }

    private Attendance buildAttendance(Long studentId, String status) {
        Attendance a = new Attendance();
        a.setCourseId(1L);
        a.setStudentId(studentId);
        a.setAttendanceDate(LocalDate.of(2025, 9, 1));
        a.setStatus(status);
        return a;
    }

    private Assessment buildAssessment(Long id, String name, String type, double totalScore) {
        Assessment a = new Assessment();
        a.setId(id);
        a.setCourseId(1L);
        a.setAssessmentName(name);
        a.setAssessmentType(type);
        a.setTotalScore(BigDecimal.valueOf(totalScore));
        return a;
    }

    private AssessmentRecord buildRecord(Long assessmentId, Long studentId, double score, String submitStatus) {
        AssessmentRecord r = new AssessmentRecord();
        r.setAssessmentId(assessmentId);
        r.setStudentId(studentId);
        r.setTotalScore(BigDecimal.valueOf(score));
        r.setSubmitStatus(submitStatus);
        return r;
    }

    private StudentKpMastery buildMastery(Long studentId, String kpName, double rate) {
        StudentKpMastery m = new StudentKpMastery();
        m.setStudentId(studentId);
        m.setCourseId(1L);
        m.setKpName(kpName);
        m.setMasteryRate(BigDecimal.valueOf(rate));
        return m;
    }

    private QuestionBank buildQuestion(Long id, String type, String content, String kps,
                                       Integer aiGenerated, String status, Integer clarity) {
        QuestionBank q = new QuestionBank();
        q.setId(id);
        q.setCourseId(1L);
        q.setQuestionType(type);
        q.setContent(content);
        q.setKnowledgePoints(kps);
        q.setAiGenerated(aiGenerated);
        q.setStatus(status);
        q.setQualityClarity(clarity);
        return q;
    }

    private void stubReportCommon() {
        when(courseMapper.selectById(1L)).thenReturn(course);
        when(courseStudentMapper.selectList(any())).thenReturn(List.of(
                buildCourseStudent(1L), buildCourseStudent(2L)));
        when(studentMapper.selectBatchIds(any())).thenReturn(List.of(student1, student2));
        when(attendanceMapper.selectList(any())).thenReturn(List.of(
                // 学生1：5 次全勤
                buildAttendance(1L, "出勤"), buildAttendance(1L, "出勤"), buildAttendance(1L, "出勤"),
                buildAttendance(1L, "出勤"), buildAttendance(1L, "出勤"),
                // 学生2：2 次出勤、3 次缺勤
                buildAttendance(2L, "出勤"), buildAttendance(2L, "出勤"),
                buildAttendance(2L, "缺勤"), buildAttendance(2L, "缺勤"), buildAttendance(2L, "缺勤")));
        when(assessmentMapper.selectList(any())).thenReturn(List.of(
                buildAssessment(11L, "第3次作业-传输层", "HOMEWORK", 100),
                buildAssessment(12L, "期末考试", "FINAL", 100)));
        when(assessmentRecordMapper.selectList(any())).thenReturn(List.of(
                buildRecord(11L, 1L, 90, "ON_TIME"),
                buildRecord(11L, 2L, 50, "ON_TIME"),
                buildRecord(12L, 1L, 95, "ON_TIME"),
                buildRecord(12L, 2L, 45, "ABSENT")));
        when(studentKpMasteryMapper.selectList(any())).thenReturn(List.of(
                buildMastery(1L, "TCP三次握手", 40),
                buildMastery(2L, "TCP三次握手", 30),
                buildMastery(1L, "UDP协议", 90),
                buildMastery(2L, "UDP协议", 85)));
    }

    // ─── 课程智能分析报告 ────────────────────────────────────────────────────

    @Nested
    @DisplayName("生成智能分析报告")
    class GenerateReport {

        @Test
        @DisplayName("课程不存在时抛出业务异常")
        void shouldThrow_WhenCourseNotExists() {
            when(courseMapper.selectById(99L)).thenReturn(null);

            assertThatThrownBy(() -> service.generateReport(99L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("课程不存在");
        }

        @Test
        @DisplayName("AI不可用时报告完整生成并降级为规则总结")
        void shouldGenerateReport_WithFallback_WhenAiUnavailable() {
            stubReportCommon();
            when(ollamaService.generate(anyString()))
                    .thenThrow(new RuntimeException("503 Service Unavailable"));

            AiAnalysisReportDTO report = service.generateReport(1L);

            // 基础信息
            assertThat(report.getCourseName()).isEqualTo("数据结构与算法");
            assertThat(report.getAiAvailable()).isFalse();
            assertThat(report.getAiSummary()).contains("建议重点再讲");

            // 模块一：到课率（参考项 = 7 出勤 / 10 总记录 = 70%）
            assertThat(report.getAttendance().getClassAvgRate())
                    .isEqualByComparingTo(new BigDecimal("70.0"));
            assertThat(report.getAttendance().getStudents()).hasSize(2);
            AiAnalysisReportDTO.StudentAttendance worst = report.getAttendance().getStudents().get(0);
            assertThat(worst.getName()).isEqualTo("李娜");
            assertThat(worst.getAttendanceRate()).isEqualByComparingTo(new BigDecimal("40.0"));
            assertThat(worst.getLevel()).isEqualTo("预警");
            assertThat(worst.getAbsentCount()).isEqualTo(3);

            // 模块二：知识点再讲建议（TCP 均值 35% → RETEACH，UDP 87.5% → OK）
            assertThat(report.getKnowledge()).hasSize(2);
            AiAnalysisReportDTO.KpAdvice first = report.getKnowledge().get(0);
            assertThat(first.getKpName()).isEqualTo("TCP三次握手");
            assertThat(first.getClassAvgRate()).isEqualByComparingTo(new BigDecimal("35.0"));
            assertThat(first.getSuggestion()).isEqualTo("RETEACH");
            assertThat(first.getWeakStudentCount()).isEqualTo(2);

            // 模块三：学生综合预警（李娜 到课率40% + 缺勤3次 + 作业50分 → HIGH）
            assertThat(report.getAlerts()).hasSize(1);
            AiAnalysisReportDTO.StudentRisk risk = report.getAlerts().get(0);
            assertThat(risk.getName()).isEqualTo("李娜");
            assertThat(risk.getRiskLevel()).isEqualTo("HIGH");
            assertThat(risk.getReasons()).hasSize(3);
            assertThat(risk.getExamAvg()).isNull(); // 缺考不计入均分

            // 模块四：成绩分析（作业 90/50 → 得分率 70%；期末缺考 1 人）
            assertThat(report.getScores()).hasSize(2);
            AiAnalysisReportDTO.AssessmentStat hw = report.getScores().stream()
                    .filter(s -> "HOMEWORK".equals(s.getAssessmentType())).findFirst().orElseThrow();
            assertThat(hw.getScoreRate()).isEqualByComparingTo(new BigDecimal("70.0"));
            assertThat(hw.getLowScoreCount()).isEqualTo(1);
            AiAnalysisReportDTO.AssessmentStat fin = report.getScores().stream()
                    .filter(s -> "FINAL".equals(s.getAssessmentType())).findFirst().orElseThrow();
            assertThat(fin.getAbsentCount()).isEqualTo(1);
            assertThat(fin.getScoreRate()).isEqualByComparingTo(new BigDecimal("95.0"));

            // 模块五：评价反馈（无最薄弱知识点数据 → 空）
            assertThat(report.getFeedback()).isEmpty();
        }

        @Test
        @DisplayName("AI可用时使用AI总评")
        void shouldUseAiSummary_WhenAiAvailable() {
            stubReportCommon();
            when(ollamaService.generate(anyString())).thenReturn("本次课程整体到课率偏低的根本原因在于……");

            AiAnalysisReportDTO report = service.generateReport(1L);

            assertThat(report.getAiAvailable()).isTrue();
            assertThat(report.getAiSummary()).contains("到课率偏低");
        }

        @Test
        @DisplayName("评价反馈模块聚合最薄弱知识点")
        void shouldAggregateWeakestKp() {
            stubReportCommon();
            when(ollamaService.generate(anyString())).thenThrow(new RuntimeException("AI 不可用"));
            // 期末考试两条记录补充最薄弱知识点
            when(assessmentRecordMapper.selectList(any())).thenReturn(List.of(
                    buildRecord(11L, 1L, 90, "ON_TIME"),
                    buildRecord(11L, 2L, 50, "ON_TIME"),
                    recordWithKp(12L, 1L, 95, "TCP三次握手", "概念理解"),
                    recordWithKp(12L, 2L, 55, "TCP三次握手", "计算能力")));

            AiAnalysisReportDTO report = service.generateReport(1L);

            assertThat(report.getFeedback()).hasSize(1);
            AiAnalysisReportDTO.KpFeedback fb = report.getFeedback().get(0);
            assertThat(fb.getKpName()).isEqualTo("TCP三次握手");
            assertThat(fb.getCount()).isEqualTo(2);
        }

        private AssessmentRecord recordWithKp(Long assessmentId, Long studentId, double score,
                                              String kp, String aspect) {
            AssessmentRecord r = buildRecord(assessmentId, studentId, score, "ON_TIME");
            r.setWeakestKp(kp);
            r.setWeakestAspect(aspect);
            return r;
        }
    }

    // ─── 题库整理判断 ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("题库整理判断")
    class AuditQuestionBank {

        @Test
        @DisplayName("课程不存在时抛出业务异常")
        void shouldThrow_WhenCourseNotExists() {
            when(courseMapper.selectById(99L)).thenReturn(null);

            assertThatThrownBy(() -> service.auditQuestionBank(99L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("课程不存在");
        }

        @Test
        @DisplayName("题库体检识别重复题、未覆盖知识点并降级为规则建议")
        void shouldAuditQuestionBank_WithRules() {
            when(courseMapper.selectById(1L)).thenReturn(course);
            when(questionBankMapper.selectList(any())).thenReturn(List.of(
                    buildQuestion(101L, "SINGLE", "{\"stem\":\"TCP 三次握手 的过程？\",\"options\":{}}",
                            "TCP", 1, "APPROVED", 4),
                    buildQuestion(102L, "SINGLE", "{\"stem\":\"TCP三次握手的过程？\",\"options\":{}}",
                            "TCP", 1, "DRAFT", null),
                    buildQuestion(103L, "SHORT", "{\"stem\":\"简述滑动窗口原理\",\"options\":{}}",
                            "UDP", 0, "APPROVED", null)));
            when(knowledgePointMapper.selectList(any())).thenReturn(List.of(
                    kp("TCP"), kp("滑动窗口")));
            when(ollamaService.generate(anyString()))
                    .thenThrow(new RuntimeException("503 Service Unavailable"));

            QuestionBankAuditDTO audit = service.auditQuestionBank(1L);

            assertThat(audit.getTotal()).isEqualTo(3);
            assertThat(audit.getAiGenerated()).isEqualTo(2);
            assertThat(audit.getPendingReview()).isEqualTo(1);
            assertThat(audit.getAiAvailable()).isFalse();
            assertThat(audit.getAiJudgment()).isNotBlank();

            // 题干空格归一化后识别为同一题 → 1 组重复、2 个题目ID
            assertThat(audit.getDuplicates()).hasSize(1);
            assertThat(audit.getDuplicates().get(0).getQuestionIds()).containsExactly(101L, 102L);

            // 知识点覆盖：TCP×2、UDP×1；「滑动窗口」未覆盖
            assertThat(audit.getKpCoverage()).hasSize(2);
            assertThat(audit.getUncoveredKps()).containsExactly("滑动窗口");

            // 规则建议包含未覆盖与待审核提示
            assertThat(audit.getSuggestions()).anyMatch(s -> s.contains("没有对应题目"));
            assertThat(audit.getSuggestions()).anyMatch(s -> s.contains("待审核"));

            // 题型分布：SINGLE×2 最多
            assertThat(audit.getTypeDistribution().get(0).getQuestionType()).isEqualTo("SINGLE");
            assertThat(audit.getTypeDistribution().get(0).getCount()).isEqualTo(2);

            // 质量均分：仅 1 题有清晰度评分
            assertThat(audit.getAvgClarity()).isEqualByComparingTo(new BigDecimal("4.0"));
        }

        private KnowledgePoint kp(String name) {
            KnowledgePoint k = new KnowledgePoint();
            k.setCourseId(1L);
            k.setKpName(name);
            return k;
        }
    }
}
