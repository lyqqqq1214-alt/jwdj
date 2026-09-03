package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.dto.*;
import com.example.aitaes.entity.*;
import com.example.aitaes.mapper.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DashboardService 单元测试")
class DashboardServiceImplTest {

    @Mock private CourseStudentMapper courseStudentMapper;
    @Mock private AssessmentMapper assessmentMapper;
    @Mock private AssessmentRecordMapper assessmentRecordMapper;
    @Mock private AttendanceMapper attendanceMapper;
    @Mock private StudentKpMasteryMapper studentKpMasteryMapper;
    @Mock private WarningRecordMapper warningRecordMapper;
    @Mock private StudentMapper studentMapper;
    @Mock private CourseMapper courseMapper;
    @Mock private TeacherMapper teacherMapper;
    @Mock private TeachingAssistantMapper teachingAssistantMapper;
    @Mock private UserMapper userMapper;
    @Mock private ExperimentMapper experimentMapper;
    @InjectMocks private DashboardServiceImpl dashboardService;

    @Nested
    @DisplayName("getOverview — 概览统计")
    class GetOverview {

        @Test
        @DisplayName("DB-01: 应正确计算各项指标")
        void shouldCalculateAllMetrics() {
            when(courseStudentMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(30L);

            Assessment assessment = new Assessment();
            assessment.setId(1L);
            assessment.setAssessmentDate(LocalDate.now());
            when(assessmentMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(assessment));

            AssessmentRecord record = new AssessmentRecord();
            record.setTotalScore(new BigDecimal("85"));
            when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(record));

            when(attendanceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(10L, 9L);
            when(warningRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(2L);

            DashboardOverviewDTO result = dashboardService.getOverview(1L);

            assertEquals(30, result.getStudentCount());
            assertEquals(new BigDecimal("85.00"), result.getAverageScore());
            assertEquals(new BigDecimal("90.0"), result.getAttendanceRate());
            assertEquals(2, result.getWarningCount());
        }

        @Test
        @DisplayName("DB-02: 空数据应返回零值不抛异常")
        void shouldReturnZeros_WhenNoData() {
            when(courseStudentMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(assessmentMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            when(attendanceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(warningRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

            DashboardOverviewDTO result = dashboardService.getOverview(1L);

            assertEquals(0, result.getStudentCount());
            assertEquals(BigDecimal.ZERO, result.getAverageScore());
            assertEquals(0, result.getWarningCount());
        }
    }

    @Nested
    @DisplayName("getCharts — 图表数据")
    class GetCharts {

        @Test
        @DisplayName("DB-03: 应返回完整图表数据结构")
        void shouldReturnAllChartData() {
            when(assessmentMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            when(attendanceMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            when(studentKpMasteryMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            DashboardChartsDTO result = dashboardService.getCharts(1L);

            assertNotNull(result.getScoreDistribution());
            assertNotNull(result.getScoreTrend());
            assertNotNull(result.getAttendanceStats());
            assertNotNull(result.getHomeworkStats());
            assertNotNull(result.getKnowledgeRadar());
        }
    }

    @Nested
    @DisplayName("getWarnings — 预警列表")
    class GetWarnings {

        @Test
        @DisplayName("DB-04: 应返回预警含学生信息")
        void shouldReturnWarningsWithStudentInfo() {
            WarningRecord wr = new WarningRecord();
            wr.setStudentId(100L);
            wr.setCourseId(1L);
            wr.setWarningType("成绩下滑");
            wr.setSeverity("HIGH");
            wr.setWarningMsg("连续两次成绩下降");
            when(warningRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(wr));

            Student student = new Student();
            student.setId(100L);
            student.setStudentNo("S001");
            student.setName("赵同学");
            when(studentMapper.selectBatchIds(anyList())).thenReturn(List.of(student));

            List<WarningStudentDTO> result = dashboardService.getWarnings(1L);

            assertEquals(1, result.size());
            assertEquals("赵同学", result.get(0).getName());
            assertEquals("HIGH", result.get(0).getSeverity());
        }

        @Test
        @DisplayName("DB-05: 无预警时应返回空列表")
        void shouldReturnEmpty_WhenNoWarnings() {
            when(warningRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            assertTrue(dashboardService.getWarnings(1L).isEmpty());
        }
    }

    @Nested
    @DisplayName("getMyCourses — 班级切换器")
    class GetMyCourses {

        @Test
        @DisplayName("DB-06: 应返回教师可选班级")
        void shouldReturnTeacherCourses() {
            User user = new User();
            user.setId(1L);
            user.setRole("TEACHER");
            when(userMapper.selectById(1L)).thenReturn(user);
            Teacher teacher = new Teacher();
            teacher.setId(1L);
            teacher.setUserId(1L);
            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(teacher);
            Course c = new Course();
            c.setId(1L); c.setCourseNo("CS101"); c.setCourseName("数据结构");
            c.setSemester("2025-2026-1");
            when(courseMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(c));
            CourseStudent cs1 = new CourseStudent();
            cs1.setCourseId(1L); cs1.setStudentId(100L);
            CourseStudent cs2 = new CourseStudent();
            cs2.setCourseId(1L); cs2.setStudentId(101L);
            CourseStudent cs3 = new CourseStudent();
            cs3.setCourseId(1L); cs3.setStudentId(102L);
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(cs1, cs2, cs3));

            List<ClassVO> result = dashboardService.getMyCourses(1L);

            assertEquals(1, result.size());
            assertEquals(3, result.get(0).getStudentCount());
        }
    }
}
