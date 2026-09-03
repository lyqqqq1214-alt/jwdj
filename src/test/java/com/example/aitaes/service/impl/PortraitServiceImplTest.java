package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.dto.StudentProfileVO;
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
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PortraitService 单元测试")
class PortraitServiceImplTest {

    @Mock private StudentMapper studentMapper;
    @Mock private CourseStudentMapper courseStudentMapper;
    @Mock private AssessmentRecordMapper assessmentRecordMapper;
    @Mock private AssessmentMapper assessmentMapper;
    @Mock private AttendanceMapper attendanceMapper;
    @Mock private ExperimentMapper experimentMapper;
    @Mock private StudentKpMasteryMapper studentKpMasteryMapper;
    @InjectMocks private PortraitServiceImpl portraitService;

    private Student student;
    private CourseStudent courseStudent;

    @BeforeEach
    void setUp() {
        student = new Student();
        student.setId(100L);
        student.setUserId(200L);
        student.setStudentNo("S001");
        student.setName("赵同学");
        student.setGender("男");
        student.setCollege("计算机学院");
        student.setMajor("软件工程");

        courseStudent = new CourseStudent();
        courseStudent.setId(1L);
        courseStudent.setCourseId(1L);
        courseStudent.setStudentId(100L);
        courseStudent.setIsFocus(1);
    }

    @Nested
    @DisplayName("getProfile — 学生画像")
    class GetProfile {

        @Test
        @DisplayName("PT-01: 应返回完整画像含各维度数据")
        void shouldReturnFullProfile() {
            when(studentMapper.selectById(100L)).thenReturn(student);
            when(courseStudentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(courseStudent);
            when(attendanceMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            when(assessmentMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            when(experimentMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            when(studentKpMasteryMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            StudentProfileVO result = portraitService.getProfile(100L, 1L);

            assertEquals("赵同学", result.getName());
            assertEquals("S001", result.getStudentNo());
            assertTrue(result.getIsFocus());
            assertNotNull(result.getKnowledgeRadar());
            assertNotNull(result.getClassAvgRadar());
        }

        @Test
        @DisplayName("PT-02: 学生不存在应抛出异常")
        void shouldThrowException_WhenStudentNotFound() {
            when(studentMapper.selectById(999L)).thenReturn(null);
            assertThrows(BusinessException.class, () -> portraitService.getProfile(999L, 1L));
        }

        @Test
        @DisplayName("PT-03: 未标记重点关注时isFocus应为false")
        void shouldReturnIsFocusFalse_WhenNotMarked() {
            courseStudent.setIsFocus(0);
            when(studentMapper.selectById(100L)).thenReturn(student);
            when(courseStudentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(courseStudent);
            when(attendanceMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            when(assessmentMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            when(experimentMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            when(studentKpMasteryMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            StudentProfileVO result = portraitService.getProfile(100L, 1L);

            assertFalse(result.getIsFocus());
        }
    }

    @Nested
    @DisplayName("toggleFocus — 重点关注")
    class ToggleFocus {

        @Test
        @DisplayName("PT-04: 应标记为重点关注")
        void shouldMarkAsFocus() {
            when(courseStudentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(courseStudent);

            portraitService.toggleFocus(100L, 1L, true);

            verify(courseStudentMapper).updateById(any(CourseStudent.class));
        }

        @Test
        @DisplayName("PT-05: 应取消重点关注")
        void shouldUnmarkFocus() {
            courseStudent.setIsFocus(1);
            when(courseStudentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(courseStudent);

            portraitService.toggleFocus(100L, 1L, false);

            verify(courseStudentMapper).updateById(any(CourseStudent.class));
        }

        @Test
        @DisplayName("PT-06: 学生不在班级中应抛出异常")
        void shouldThrowException_WhenStudentNotInClass() {
            when(courseStudentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
            assertThrows(BusinessException.class, () -> portraitService.toggleFocus(100L, 1L, true));
        }
    }
}
