package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
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
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ClassService 单元测试")
class ClassServiceImplTest {

    @Mock private CourseMapper courseMapper;
    @Mock private CourseStudentMapper courseStudentMapper;
    @Mock private StudentMapper studentMapper;
    @Mock private UserMapper userMapper;
    @Mock private TeacherMapper teacherMapper;
    @Mock private SystemConfigMapper systemConfigMapper;
    @InjectMocks private ClassServiceImpl classService;

    private Teacher teacher;
    private Course course;
    private Student student;
    private CourseStudent courseStudent;

    @BeforeEach
    void setUp() {
        teacher = new Teacher();
        teacher.setId(1L);
        teacher.setUserId(1L);
        teacher.setTeacherNo("T001");
        teacher.setName("张老师");

        course = new Course();
        course.setId(1L);
        course.setCourseNo("CS101");
        course.setCourseName("数据结构");
        course.setTeacherId(1L);
        course.setSemester("2025-2026-1");

        student = new Student();
        student.setId(100L);
        student.setUserId(200L);
        student.setStudentNo("S001");
        student.setName("赵同学");

        courseStudent = new CourseStudent();
        courseStudent.setId(1L);
        courseStudent.setCourseId(1L);
        courseStudent.setStudentId(100L);
        courseStudent.setIsFocus(0);
    }

    @Nested
    @DisplayName("listMyClasses — 我的班级")
    class ListMyClasses {

        @Test
        @DisplayName("CS-01: 应返回班级列表含人数")
        void shouldReturnClassesWithStudentCount() {
            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(teacher);
            when(courseMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(course));
            // 实现为批量查询选课记录后按 courseId 分组计数（避免 N+1），mock 30 条选课记录
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(
                    java.util.stream.LongStream.rangeClosed(1, 30).mapToObj(i -> {
                        CourseStudent cs = new CourseStudent();
                        cs.setCourseId(1L);
                        cs.setStudentId(i);
                        return cs;
                    }).toList());

            List<ClassVO> result = classService.listMyClasses(1L);

            assertEquals(1, result.size());
            assertEquals("数据结构", result.get(0).getCourseName());
            assertEquals(30, result.get(0).getStudentCount());
        }

        @Test
        @DisplayName("CS-02: 无班级时应返回空列表")
        void shouldReturnEmpty_WhenNoCourses() {
            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(teacher);
            when(courseMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            assertTrue(classService.listMyClasses(1L).isEmpty());
        }
    }

    @Nested
    @DisplayName("create — 创建班级")
    class Create {

        @Test
        @DisplayName("CS-03: 应成功创建班级")
        void shouldCreateClass() {
            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(teacher);
            ClassCreateDTO dto = new ClassCreateDTO();
            dto.setClassName("软工2101");
            dto.setCourseName("软件工程");
            dto.setSemester("2025-2026-1");

            ClassVO result = classService.create(1L, dto);

            assertNotNull(result);
            verify(courseMapper).insert(any(Course.class));
        }

        @Test
        @DisplayName("CS-04: 教师不存在应抛出异常")
        void shouldThrowException_WhenTeacherNotFound() {
            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
            ClassCreateDTO dto = new ClassCreateDTO();
            dto.setClassName("X"); dto.setCourseName("Y"); dto.setSemester("S");

            assertThrows(BusinessException.class, () -> classService.create(999L, dto));
        }
    }

    @Nested
    @DisplayName("delete — 删除班级")
    class Delete {

        @Test
        @DisplayName("CS-05: 非班级所有者应被拒绝")
        void shouldRejectNonOwner() {
            when(courseMapper.selectById(1L)).thenReturn(course);
            Teacher otherTeacher = new Teacher();
            otherTeacher.setId(999L);
            otherTeacher.setUserId(999L);
            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(otherTeacher);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> classService.delete(1L, 999L));
            assertEquals(ResultCode.FORBIDDEN.getCode(), ex.getCode());
        }

        @Test
        @DisplayName("CS-06: 应清理关联关系")
        void shouldDeleteWithRelations() {
            when(courseMapper.selectById(1L)).thenReturn(course);
            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(teacher);

            classService.delete(1L, 1L);

            verify(courseMapper).deleteById(1L);
            verify(courseStudentMapper).delete(any(LambdaQueryWrapper.class));
        }
    }

    @Nested
    @DisplayName("addStudent — 添加学生")
    class AddStudent {

        @Test
        @DisplayName("CS-07: 学生已存在时应直接关联")
        void shouldLinkExistingStudent() {
            when(courseMapper.selectById(1L)).thenReturn(course);
            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(teacher);
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(courseStudentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

            StudentAddDTO dto = new StudentAddDTO();
            dto.setStudentNo("S001");
            dto.setName("赵同学");

            StudentVO result = classService.addStudent(1L, 1L, dto);

            assertNotNull(result);
            verify(userMapper, never()).insert(any(User.class));
            verify(courseStudentMapper).insert(any(CourseStudent.class));
        }

        @Test
        @DisplayName("CS-08: 学生在班级中已存在应抛出异常")
        void shouldThrowException_WhenAlreadyInClass() {
            when(courseMapper.selectById(1L)).thenReturn(course);
            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(teacher);
            when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
            when(courseStudentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(courseStudent);

            StudentAddDTO dto = new StudentAddDTO();
            dto.setStudentNo("S001"); dto.setName("赵同学");

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> classService.addStudent(1L, 1L, dto));
            assertEquals(ResultCode.BAD_REQUEST.getCode(), ex.getCode());
        }
    }

    @Nested
    @DisplayName("removeStudent — 移除学生")
    class RemoveStudent {

        @Test
        @DisplayName("CS-09: 应移除关联不删除账号")
        void shouldRemoveRelationNotAccount() {
            when(courseMapper.selectById(1L)).thenReturn(course);
            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(teacher);

            classService.removeStudent(1L, 100L, 1L);

            verify(courseStudentMapper).delete(any(LambdaQueryWrapper.class));
            verify(studentMapper, never()).deleteById(anyLong());
        }
    }
}
