package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.entity.*;
import com.example.aitaes.mapper.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WarningCheckService 单元测试")
class WarningCheckServiceImplTest {

    @Mock private CourseStudentMapper courseStudentMapper;
    @Mock private AttendanceMapper attendanceMapper;
    @Mock private AssessmentMapper assessmentMapper;
    @Mock private AssessmentRecordMapper assessmentRecordMapper;
    @Mock private StudentKpMasteryMapper studentKpMasteryMapper;
    @Mock private WarningRecordMapper warningRecordMapper;
    @Mock private SystemConfigMapper systemConfigMapper;
    @InjectMocks private WarningCheckServiceImpl warningCheckService;

    /**
     * 构造 SystemConfig mock 返回值，使 getConfigInt 返回指定值
     */
    private void stubConfig(String key, String value) {
        SystemConfig cfg = new SystemConfig();
        cfg.setConfigKey(key);
        cfg.setConfigValue(value);
        when(systemConfigMapper.selectOne(argThat((LambdaQueryWrapper<SystemConfig> w) ->
                w != null && w.toString().contains(key)))).thenReturn(cfg);
    }

    /**
     * 让所有配置返回默认值（selectOne 返回 null → 走默认值）
     */
    private void stubDefaultConfigs() {
        when(systemConfigMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
    }

    private CourseStudent buildCourseStudent(Long studentId) {
        CourseStudent cs = new CourseStudent();
        cs.setStudentId(studentId);
        cs.setCourseId(1L);
        return cs;
    }

    @Nested
    @DisplayName("checkAndGenerateWarnings — 整体预警检查")
    class CheckAndGenerateWarnings {

        @Test
        @DisplayName("WT-01: 课程无学生时应返回0")
        void shouldReturnZero_WhenNoStudents() {
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList());

            int result = warningCheckService.checkAndGenerateWarnings(1L);

            assertEquals(0, result);
            verify(warningRecordMapper, never()).insert(any(WarningRecord.class));
        }

        @Test
        @DisplayName("WT-02: 缺勤次数达到阈值时应生成预警")
        void shouldGenerateAttendanceWarning() {
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(buildCourseStudent(10L)));
            stubDefaultConfigs();
            // 缺勤4次（默认阈值3）
            when(attendanceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(4L);
            // 无已有预警
            when(warningRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

            int result = warningCheckService.checkAndGenerateWarnings(1L);

            assertTrue(result >= 1);
            verify(warningRecordMapper).insert(argThat((WarningRecord r) ->
                    "ATTENDANCE".equals(r.getWarningType()) && "MEDIUM".equals(r.getSeverity())));
        }

        @Test
        @DisplayName("WT-03: 缺勤次数达到阈值2倍时严重程度应为HIGH")
        void shouldSetHighSeverity_WhenAttendanceDoubleThreshold() {
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(buildCourseStudent(10L)));
            stubDefaultConfigs();
            // 缺勤6次（默认阈值3的2倍）
            when(attendanceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(6L);
            when(warningRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

            warningCheckService.checkAndGenerateWarnings(1L);

            verify(warningRecordMapper).insert(argThat((WarningRecord r) ->
                    "ATTENDANCE".equals(r.getWarningType()) && "HIGH".equals(r.getSeverity())));
        }

        @Test
        @DisplayName("WT-04: 缺勤次数未达阈值时不应生成预警")
        void shouldNotGenerateAttendanceWarning_WhenBelowThreshold() {
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(buildCourseStudent(10L)));
            stubDefaultConfigs();
            // 缺勤2次（低于默认阈值3）
            when(attendanceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(2L);
            when(assessmentMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(Collections.emptyList());
            when(studentKpMasteryMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(Collections.emptyList());

            int result = warningCheckService.checkAndGenerateWarnings(1L);

            assertEquals(0, result);
            verify(warningRecordMapper, never()).insert(any(WarningRecord.class));
        }
    }

    @Nested
    @DisplayName("成绩下滑预警")
    class ScoreDropWarning {

        @Test
        @DisplayName("WT-05: 成绩连续下滑应生成SCORE_DROP预警")
        void shouldGenerateScoreDropWarning() {
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(buildCourseStudent(10L)));
            stubDefaultConfigs();
            when(attendanceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

            // 构造3次考核，成绩持续下滑：100 → 70 → 50
            Assessment a1 = new Assessment(); a1.setId(1L); a1.setAssessmentNo(1);
            Assessment a2 = new Assessment(); a2.setId(2L); a2.setAssessmentNo(2);
            Assessment a3 = new Assessment(); a3.setId(3L); a3.setAssessmentNo(3);
            when(assessmentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(a1, a2, a3));

            AssessmentRecord r1 = new AssessmentRecord(); r1.setTotalScore(new BigDecimal("100"));
            AssessmentRecord r2 = new AssessmentRecord(); r2.setTotalScore(new BigDecimal("70"));
            AssessmentRecord r3 = new AssessmentRecord(); r3.setTotalScore(new BigDecimal("50"));
            when(assessmentRecordMapper.selectOne(any(LambdaQueryWrapper.class)))
                    .thenReturn(r1)
                    .thenReturn(r2)
                    .thenReturn(r3);

            when(warningRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(studentKpMasteryMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(Collections.emptyList());

            int result = warningCheckService.checkAndGenerateWarnings(1L);

            assertTrue(result >= 1);
            verify(warningRecordMapper).insert(argThat((WarningRecord r) ->
                    "SCORE_DROP".equals(r.getWarningType())));
        }

        @Test
        @DisplayName("WT-06: 成绩稳定时不应生成SCORE_DROP预警")
        void shouldNotGenerateScoreDropWarning_WhenStable() {
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(buildCourseStudent(10L)));
            stubDefaultConfigs();
            when(attendanceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

            Assessment a1 = new Assessment(); a1.setId(1L); a1.setAssessmentNo(1);
            Assessment a2 = new Assessment(); a2.setId(2L); a2.setAssessmentNo(2);
            when(assessmentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(a1, a2));

            AssessmentRecord r1 = new AssessmentRecord(); r1.setTotalScore(new BigDecimal("80"));
            AssessmentRecord r2 = new AssessmentRecord(); r2.setTotalScore(new BigDecimal("82"));
            when(assessmentRecordMapper.selectOne(any(LambdaQueryWrapper.class)))
                    .thenReturn(r1)
                    .thenReturn(r2);

            when(studentKpMasteryMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(Collections.emptyList());

            int result = warningCheckService.checkAndGenerateWarnings(1L);

            assertEquals(0, result);
        }
    }

    @Nested
    @DisplayName("作业未交预警")
    class HomeworkMissWarning {

        @Test
        @DisplayName("WT-07: 连续3次作业未交应生成HOMEWORK_MISS预警")
        void shouldGenerateHomeworkMissWarning() {
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(buildCourseStudent(10L)));
            stubDefaultConfigs();
            when(attendanceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(studentKpMasteryMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList());

            // 作业类型考核
            Assessment hw1 = new Assessment(); hw1.setId(1L); hw1.setAssessmentType("HOMEWORK"); hw1.setAssessmentNo(1);
            Assessment hw2 = new Assessment(); hw2.setId(2L); hw2.setAssessmentType("HOMEWORK"); hw2.setAssessmentNo(2);
            Assessment hw3 = new Assessment(); hw3.setId(3L); hw3.setAssessmentType("HOMEWORK"); hw3.setAssessmentNo(3);
            // assessmentMapper.selectList 被多次调用：第一次返回空（成绩下滑规则），第二次返回作业列表
            when(assessmentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList())  // checkScoreDropWarning → 无考核
                    .thenReturn(List.of(hw1, hw2, hw3));  // checkHomeworkMissWarning → 3次作业

            // 3次作业均未交
            AssessmentRecord absent = new AssessmentRecord();
            absent.setSubmitStatus("ABSENT");
            when(assessmentRecordMapper.selectOne(any(LambdaQueryWrapper.class)))
                    .thenReturn(absent)
                    .thenReturn(absent)
                    .thenReturn(absent);

            when(warningRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

            int result = warningCheckService.checkAndGenerateWarnings(1L);

            assertTrue(result >= 1);
            verify(warningRecordMapper).insert(argThat((WarningRecord r) ->
                    "HOMEWORK_MISS".equals(r.getWarningType())));
        }
    }

    @Nested
    @DisplayName("知识点薄弱预警")
    class KpWeakWarning {

        @Test
        @DisplayName("WT-08: 知识点掌握率低于阈值应生成KP_WEAK预警")
        void shouldGenerateKpWeakWarning() {
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(buildCourseStudent(10L)));
            stubDefaultConfigs();
            when(attendanceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(assessmentMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(Collections.emptyList());

            StudentKpMastery weak = new StudentKpMastery();
            weak.setKpName("TCP协议");
            weak.setMasteryRate(new BigDecimal("20"));
            when(studentKpMasteryMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(weak));
            when(warningRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

            int result = warningCheckService.checkAndGenerateWarnings(1L);

            assertTrue(result >= 1);
            verify(warningRecordMapper).insert(argThat((WarningRecord r) ->
                    "KP_WEAK".equals(r.getWarningType()) && "MEDIUM".equals(r.getSeverity())));
        }

        @Test
        @DisplayName("WT-09: 知识点掌握率极低(<15%)时严重程度应为HIGH")
        void shouldSetHighSeverity_WhenKpVeryWeak() {
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(buildCourseStudent(10L)));
            stubDefaultConfigs();
            when(attendanceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(assessmentMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(Collections.emptyList());

            StudentKpMastery weak = new StudentKpMastery();
            weak.setKpName("IP路由");
            weak.setMasteryRate(new BigDecimal("10"));
            when(studentKpMasteryMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(weak));
            when(warningRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

            warningCheckService.checkAndGenerateWarnings(1L);

            verify(warningRecordMapper).insert(argThat((WarningRecord r) ->
                    "KP_WEAK".equals(r.getWarningType()) && "HIGH".equals(r.getSeverity())));
        }
    }

    @Nested
    @DisplayName("去重机制")
    class Deduplication {

        @Test
        @DisplayName("WT-10: 已有未解除的同类预警时不应重复创建")
        void shouldNotDuplicate_WhenExistingUnresolved() {
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(buildCourseStudent(10L)));
            stubDefaultConfigs();
            // 缺勤达标
            when(attendanceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(5L);
            // 已有未解除的同类预警
            when(warningRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);

            int result = warningCheckService.checkAndGenerateWarnings(1L);

            assertEquals(0, result);
            verify(warningRecordMapper, never()).insert(any(WarningRecord.class));
        }
    }

    @Nested
    @DisplayName("checkStudentWarnings — 单学生检查")
    class CheckStudentWarnings {

        @Test
        @DisplayName("WT-11: 单学生检查应正常执行")
        void shouldExecuteWithoutError() {
            stubDefaultConfigs();
            when(attendanceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(assessmentMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(Collections.emptyList());
            when(studentKpMasteryMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(Collections.emptyList());

            assertDoesNotThrow(() -> warningCheckService.checkStudentWarnings(1L, 10L));
        }
    }
}
