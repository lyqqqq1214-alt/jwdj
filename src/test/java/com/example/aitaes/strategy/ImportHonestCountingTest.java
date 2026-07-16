package com.example.aitaes.strategy;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.support.ExcelTypeEnum;
import com.example.aitaes.dto.ImportResultDTO;
import com.example.aitaes.dto.excel.AttendanceExcelDTO;
import com.example.aitaes.dto.excel.ExperimentExcelDTO;
import com.example.aitaes.dto.excel.StudentExcelDTO;
import com.example.aitaes.entity.Attendance;
import com.example.aitaes.entity.Course;
import com.example.aitaes.entity.Student;
import com.example.aitaes.enums.ImportStatus;
import com.example.aitaes.mapper.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * 导入策略诚实计数回归测试
 * <p>
 * 修复前的问题：课程/学生不存在被静默跳过仍计成功、插入异常被吞掉仍计成功、
 * 日期/分数解析失败静默兜底 → 前端显示"导入成功"但数据库无数据。
 * 本测试锁定修复后的行为：所有失败如实计入 failRows 并返回错误明细。
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("导入诚实计数回归")
class ImportHonestCountingTest {

    private static Course buildCourse() {
        Course course = new Course();
        course.setId(10L);
        course.setCourseNo("CS101");
        course.setSemester("2025-2026-1");
        return course;
    }

    private static Student buildStudent(Long id, String studentNo) {
        Student student = new Student();
        student.setId(id);
        student.setStudentNo(studentNo);
        return student;
    }

    private static ImportContext ctxOf(String filename) {
        return ImportContext.builder().originalFilename(filename).build();
    }

    private static byte[] writeExcel(Class<?> dtoClass, List<?> rows) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        EasyExcel.write(baos, dtoClass).excelType(ExcelTypeEnum.XLSX).sheet("Sheet1").doWrite(rows);
        return baos.toByteArray();
    }

    @Nested
    @DisplayName("考勤导入")
    class AttendanceHonesty {

        @Mock private AttendanceMapper attendanceMapper;
        @Mock private StudentMapper studentMapper;
        @Mock private CourseMapper courseMapper;

        private AttendanceImportStrategy strategy;

        @BeforeEach
        void setUp() {
            strategy = new AttendanceImportStrategy(attendanceMapper, studentMapper,
                    new CourseResolver(courseMapper));
        }

        private AttendanceExcelDTO buildDto(String studentNo, String date) {
            AttendanceExcelDTO dto = new AttendanceExcelDTO();
            dto.setStudentNo(studentNo);
            dto.setName("赵小明");
            dto.setAttendanceDate(date);
            dto.setStatus("出勤");
            return dto;
        }

        @Test
        @DisplayName("HC-01: 课程无法确定 → FAILED（修复前静默插入 courseId=null 的脏数据）")
        void shouldFail_WhenCourseUnresolvable() {
            // Given：文件名无课程编号段
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(writeExcel(AttendanceExcelDTO.class,
                            List.of(buildDto("S2024001", "2025-09-08")))),
                    ctxOf("考勤.xlsx"));

            // Then
            assertEquals(ImportStatus.FAILED.getCode(), result.getStatus());
            assertTrue(result.getErrors().get(0).contains("无法确定归属课程"));
            verify(attendanceMapper, never()).insert(any(Attendance.class));
        }

        @Test
        @DisplayName("HC-02: 学生不存在 → 计失败（修复前 continue 计成功）")
        void shouldCountFail_WhenStudentNotFound() {
            // Given
            when(courseMapper.selectOne(any())).thenReturn(buildCourse());
            when(studentMapper.selectOne(any())).thenReturn(null);

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(writeExcel(AttendanceExcelDTO.class,
                            List.of(buildDto("S404", "2025-09-08")))),
                    ctxOf("CS101_ATTENDANCE_第1周.xlsx"));

            // Then
            assertEquals(ImportStatus.FAILED.getCode(), result.getStatus());
            assertEquals(1, result.getFailRows());
            assertEquals(0, result.getSuccessRows());
            assertTrue(result.getErrors().get(0).contains("学生不存在"));
            verify(attendanceMapper, never()).insert(any(Attendance.class));
        }

        @Test
        @DisplayName("HC-03: 日期格式错误 → 计失败（修复前静默兜底为当天）")
        void shouldCountFail_WhenDateFormatInvalid() {
            // Given
            when(courseMapper.selectOne(any())).thenReturn(buildCourse());
            when(studentMapper.selectOne(any())).thenReturn(buildStudent(1L, "S2024001"));

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(writeExcel(AttendanceExcelDTO.class,
                            List.of(buildDto("S2024001", "2025/09/08")))),
                    ctxOf("CS101_ATTENDANCE_第1周.xlsx"));

            // Then
            assertEquals(1, result.getFailRows());
            assertTrue(result.getErrors().get(0).contains("日期格式错误"));
            verify(attendanceMapper, never()).insert(any(Attendance.class));
        }

        @Test
        @DisplayName("HC-04: 同日重复考勤 → 跳过并计入警告（不再计成功）")
        void shouldSkip_WhenDuplicateAttendance() {
            // Given
            when(courseMapper.selectOne(any())).thenReturn(buildCourse());
            when(studentMapper.selectOne(any())).thenReturn(buildStudent(1L, "S2024001"));
            when(attendanceMapper.selectOne(any())).thenReturn(new Attendance());

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(writeExcel(AttendanceExcelDTO.class,
                            List.of(buildDto("S2024001", "2025-09-08")))),
                    ctxOf("CS101_ATTENDANCE_第1周.xlsx"));

            // Then
            assertEquals(1, result.getSkippedRows());
            assertEquals(0, result.getSuccessRows());
            assertEquals(ImportStatus.SUCCESS.getCode(), result.getStatus());
            assertFalse(result.getWarnings().isEmpty());
            verify(attendanceMapper, never()).insert(any(Attendance.class));
        }
    }

    @Nested
    @DisplayName("实验报告导入")
    class ExperimentHonesty {

        @Mock private ExperimentMapper experimentMapper;
        @Mock private StudentMapper studentMapper;
        @Mock private CourseMapper courseMapper;

        private ExperimentImportStrategy strategy;

        @BeforeEach
        void setUp() {
            strategy = new ExperimentImportStrategy(experimentMapper, studentMapper,
                    new CourseResolver(courseMapper));
        }

        @Test
        @DisplayName("HC-05: 分数非数字 → 计失败（修复前抛异常被吞掉）")
        void shouldCountFail_WhenScoreNotNumeric() {
            // Given
            when(courseMapper.selectOne(any())).thenReturn(buildCourse());
            when(studentMapper.selectOne(any())).thenReturn(buildStudent(1L, "S2024001"));

            ExperimentExcelDTO dto = new ExperimentExcelDTO();
            dto.setStudentNo("S2024001");
            dto.setName("赵小明");
            dto.setExperimentName("实验一");
            dto.setScore("优秀");

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(writeExcel(ExperimentExcelDTO.class, List.of(dto))),
                    ctxOf("CS101_EXPERIMENT_实验一.xlsx"));

            // Then
            assertEquals(1, result.getFailRows());
            assertTrue(result.getErrors().get(0).contains("分数格式错误"));
            verify(experimentMapper, never()).insert(any(com.example.aitaes.entity.Experiment.class));
        }
    }

    @Nested
    @DisplayName("学生信息导入")
    class StudentHonesty {

        @Mock private StudentMapper studentMapper;
        @Mock private UserMapper userMapper;
        @Mock private SystemConfigMapper systemConfigMapper;

        private StudentImportStrategy strategy;

        @BeforeEach
        void setUp() {
            strategy = new StudentImportStrategy(studentMapper, userMapper, systemConfigMapper);
        }

        @Test
        @DisplayName("HC-06: 学号已存在 → 跳过并计入警告（修复前静默计成功）")
        void shouldSkip_WhenStudentNoExists() {
            // Given
            when(systemConfigMapper.selectOne(any())).thenReturn(null);
            when(studentMapper.selectList(any()))
                    .thenReturn(List.of(buildStudent(1L, "S2024001")));

            StudentExcelDTO dto = new StudentExcelDTO();
            dto.setStudentNo("S2024001");
            dto.setName("赵小明");

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(writeExcel(StudentExcelDTO.class, List.of(dto))),
                    ctxOf("students.xlsx"));

            // Then
            assertEquals(1, result.getSkippedRows());
            assertEquals(0, result.getSuccessRows());
            assertEquals(ImportStatus.SUCCESS.getCode(), result.getStatus());
            assertTrue(result.getWarnings().get(0).contains("学号已存在"));
            verify(userMapper, never()).insert(any(com.example.aitaes.entity.User.class));
            verify(studentMapper, never()).insert(any(Student.class));
        }

        @Test
        @DisplayName("HC-07: 插入异常 → 计失败（修复前 catch 吞掉计成功）")
        void shouldCountFail_WhenInsertThrows() {
            // Given
            when(systemConfigMapper.selectOne(any())).thenReturn(null);
            when(studentMapper.selectList(any())).thenReturn(List.of());
            when(userMapper.insert(any(com.example.aitaes.entity.User.class)))
                    .thenThrow(new RuntimeException("唯一键冲突"));

            StudentExcelDTO dto = new StudentExcelDTO();
            dto.setStudentNo("S2024002");
            dto.setName("钱小红");

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(writeExcel(StudentExcelDTO.class, List.of(dto))),
                    ctxOf("students.xlsx"));

            // Then
            assertEquals(ImportStatus.FAILED.getCode(), result.getStatus());
            assertEquals(1, result.getFailRows());
            assertTrue(result.getErrors().get(0).contains("创建学生账号失败"));
        }
    }
}
