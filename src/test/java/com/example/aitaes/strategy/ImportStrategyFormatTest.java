package com.example.aitaes.strategy;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.support.ExcelTypeEnum;
import com.example.aitaes.dto.ImportResultDTO;
import com.example.aitaes.dto.excel.AttendanceExcelDTO;
import com.example.aitaes.dto.excel.ClassStudentExcelDTO;
import com.example.aitaes.dto.excel.ExperimentExcelDTO;
import com.example.aitaes.dto.excel.TeacherExcelDTO;
import com.example.aitaes.entity.Assessment;
import com.example.aitaes.entity.AssessmentRecord;
import com.example.aitaes.entity.Attendance;
import com.example.aitaes.entity.Course;
import com.example.aitaes.entity.CourseStudent;
import com.example.aitaes.entity.Experiment;
import com.example.aitaes.entity.RecordKpDeduction;
import com.example.aitaes.entity.Student;
import com.example.aitaes.entity.Teacher;
import com.example.aitaes.entity.User;
import com.example.aitaes.enums.ImportStatus;
import com.example.aitaes.enums.ImportType;
import com.example.aitaes.mapper.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * 导入策略文件格式覆盖测试
 * <p>
 * 回归验证：
 * <ul>
 *   <li>getExcelType() 对 .csv/.xls/.xlsx 的推断（修复前 .xls 被强制按 XLSX 解析）</li>
 *   <li>CSV 从 InputStream 读取（修复前未传 excelType 的策略抛 Convert excel format exception）</li>
 *   <li>EXAM_SCORE 文件名解析（修复前 "EXAM_SCORE" 含下划线导致永远匹配失败）</li>
 * </ul>
 * Excel/CSV 字节均在内存生成，不依赖外部文件。
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("导入策略文件格式覆盖")
class ImportStrategyFormatTest {

    // ===== 测试数据工厂 =====

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

    /** 用 EasyExcel 在内存中生成 DTO 映射的 Excel 字节 */
    private static byte[] writeExcel(Class<?> dtoClass, List<?> rows, ExcelTypeEnum type) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        EasyExcel.write(baos, dtoClass).excelType(type).sheet("Sheet1").doWrite(rows);
        return baos.toByteArray();
    }

    @Nested
    @DisplayName("getExcelType - 文件格式推断")
    class GetExcelType {

        /** 匿名实现，仅为调用接口 default 方法 */
        private final ImportStrategy strategy = new ImportStrategy() {
            @Override
            public ImportType getSupportedType() {
                return null;
            }

            @Override
            public ImportResultDTO execute(InputStream inputStream, String originalFilename) {
                return null;
            }
        };

        @Test
        @DisplayName("FMT-01: .csv/.CSV → CSV")
        void shouldReturnCsv_WhenCsvExtension() {
            assertEquals(ExcelTypeEnum.CSV, strategy.getExcelType("teacher.csv"));
            assertEquals(ExcelTypeEnum.CSV, strategy.getExcelType("TEACHER.CSV"));
        }

        @Test
        @DisplayName("FMT-02: .xls → XLS（修复前误判为 XLSX）")
        void shouldReturnXls_WhenXlsExtension() {
            assertEquals(ExcelTypeEnum.XLS, strategy.getExcelType("teacher.xls"));
            assertEquals(ExcelTypeEnum.XLS, strategy.getExcelType("TEACHER.XLS"));
        }

        @Test
        @DisplayName("FMT-03: .xlsx / null → XLSX")
        void shouldReturnXlsx_WhenXlsxOrNull() {
            assertEquals(ExcelTypeEnum.XLSX, strategy.getExcelType("teacher.xlsx"));
            assertEquals(ExcelTypeEnum.XLSX, strategy.getExcelType(null));
        }
    }

    @Nested
    @DisplayName("实验报告导入 - CSV/XLSX")
    class ExperimentFormats {

        @Mock private ExperimentMapper experimentMapper;
        @Mock private StudentMapper studentMapper;
        @Mock private CourseMapper courseMapper;

        private ExperimentImportStrategy strategy;

        @BeforeEach
        void setUp() {
            strategy = new ExperimentImportStrategy(experimentMapper, studentMapper, courseMapper);
        }

        @Test
        @DisplayName("FMT-04: CSV 导入成功（修复前抛 Convert excel format exception）")
        void shouldImportCsv_WhenExperimentStrategy() {
            // Given
            when(courseMapper.selectOne(any())).thenReturn(buildCourse());
            when(studentMapper.selectOne(any()))
                    .thenReturn(buildStudent(1L, "S2024001"), buildStudent(2L, "S2024002"));
            when(experimentMapper.insert(any(Experiment.class))).thenReturn(1);

            String csv = "学号,姓名,实验名称,实验次数,分数,提交时间,备注\n"
                    + "S2024001,赵小明,实验一,1,85,2025-09-15 20:30:00,按时提交\n"
                    + "S2024002,钱小红,实验一,1,90,2025-09-15 20:35:00,\n";
            InputStream in = new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));

            // When
            ImportResultDTO result = strategy.execute(in, "CS101_EXPERIMENT_实验一.csv");

            // Then
            assertEquals(2, result.getTotalRows());
            assertEquals(2, result.getSuccessRows());
            assertEquals(ImportStatus.SUCCESS.getCode(), result.getStatus());
            verify(experimentMapper, times(2)).insert(any(Experiment.class));
        }

        @Test
        @DisplayName("FMT-05: XLSX 导入成功")
        void shouldImportXlsx_WhenExperimentStrategy() {
            // Given
            when(courseMapper.selectOne(any())).thenReturn(buildCourse());
            when(studentMapper.selectOne(any())).thenReturn(buildStudent(1L, "S2024001"));
            when(experimentMapper.insert(any(Experiment.class))).thenReturn(1);

            ExperimentExcelDTO dto = new ExperimentExcelDTO();
            dto.setStudentNo("S2024001");
            dto.setName("赵小明");
            dto.setExperimentName("实验一");
            dto.setExperimentNo(1);
            dto.setScore("85");
            dto.setSubmitTime("2025-09-15 20:30:00");
            byte[] bytes = writeExcel(ExperimentExcelDTO.class, List.of(dto), ExcelTypeEnum.XLSX);

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(bytes), "CS101_EXPERIMENT_实验一.xlsx");

            // Then
            assertEquals(1, result.getSuccessRows());
            assertEquals(ImportStatus.SUCCESS.getCode(), result.getStatus());
            verify(experimentMapper).insert(any(Experiment.class));
        }
    }

    @Nested
    @DisplayName("教师导入 - XLS 老格式")
    class TeacherXlsFormat {

        @Mock private TeacherMapper teacherMapper;
        @Mock private UserMapper userMapper;
        @Mock private SystemConfigMapper systemConfigMapper;

        private TeacherImportStrategy strategy;

        @BeforeEach
        void setUp() {
            strategy = new TeacherImportStrategy(teacherMapper, userMapper, systemConfigMapper);
        }

        @Test
        @DisplayName("FMT-06: .xls 导入成功（修复前被强制按 XLSX 解析而失败）")
        void shouldImportXls_WhenTeacherStrategy() {
            // Given
            when(teacherMapper.selectList(any())).thenReturn(List.of());
            when(systemConfigMapper.selectOne(any())).thenReturn(null);
            when(userMapper.insert(any(User.class))).thenReturn(1);
            when(teacherMapper.insert(any(Teacher.class))).thenReturn(1);

            TeacherExcelDTO dto = new TeacherExcelDTO();
            dto.setTeacherNo("T101");
            dto.setName("王建军");
            dto.setGender("男");
            dto.setCollege("计算机学院");
            byte[] bytes = writeExcel(TeacherExcelDTO.class, List.of(dto), ExcelTypeEnum.XLS);

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(bytes), "teacher.xls");

            // Then
            assertEquals(1, result.getTotalRows());
            assertEquals(1, result.getSuccessRows());
            assertEquals(ImportStatus.SUCCESS.getCode(), result.getStatus());
            verify(userMapper).insert(any(User.class));
            verify(teacherMapper).insert(any(Teacher.class));
        }
    }

    @Nested
    @DisplayName("考勤导入 - XLSX")
    class AttendanceXlsxFormat {

        @Mock private AttendanceMapper attendanceMapper;
        @Mock private StudentMapper studentMapper;
        @Mock private CourseMapper courseMapper;

        private AttendanceImportStrategy strategy;

        @BeforeEach
        void setUp() {
            strategy = new AttendanceImportStrategy(attendanceMapper, studentMapper, courseMapper);
        }

        @Test
        @DisplayName("FMT-07: XLSX 导入成功")
        void shouldImportXlsx_WhenAttendanceStrategy() {
            // Given
            when(courseMapper.selectOne(any())).thenReturn(buildCourse());
            when(studentMapper.selectOne(any())).thenReturn(buildStudent(1L, "S2024001"));
            when(attendanceMapper.selectOne(any())).thenReturn(null);
            when(attendanceMapper.insert(any(Attendance.class))).thenReturn(1);

            AttendanceExcelDTO dto = new AttendanceExcelDTO();
            dto.setStudentNo("S2024001");
            dto.setName("赵小明");
            dto.setAttendanceDate("2025-09-08");
            dto.setStatus("出勤");
            dto.setPeriod("1-2节");
            dto.setWeekNo(1);
            byte[] bytes = writeExcel(AttendanceExcelDTO.class, List.of(dto), ExcelTypeEnum.XLSX);

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(bytes), "CS101_ATTENDANCE_第1周.xlsx");

            // Then
            assertEquals(1, result.getSuccessRows());
            verify(attendanceMapper).insert(any(Attendance.class));
        }
    }

    @Nested
    @DisplayName("班级学生名单导入 - XLSX")
    class ClassStudentXlsxFormat {

        @Mock private StudentMapper studentMapper;
        @Mock private UserMapper userMapper;
        @Mock private CourseMapper courseMapper;
        @Mock private CourseStudentMapper courseStudentMapper;
        @Mock private SystemConfigMapper systemConfigMapper;

        private ClassStudentImportStrategy strategy;

        @BeforeEach
        void setUp() {
            strategy = new ClassStudentImportStrategy(studentMapper, userMapper,
                    courseMapper, courseStudentMapper, systemConfigMapper);
        }

        @Test
        @DisplayName("FMT-08: XLSX 导入成功（新学生自动建账号并关联课程）")
        void shouldImportXlsx_WhenClassStudentStrategy() {
            // Given
            when(courseMapper.selectOne(any())).thenReturn(buildCourse());
            when(studentMapper.selectList(any())).thenReturn(List.of());
            when(systemConfigMapper.selectOne(any())).thenReturn(null);
            when(userMapper.insert(any(User.class))).thenReturn(1);
            when(studentMapper.insert(any(Student.class))).thenAnswer(inv -> {
                Student s = inv.getArgument(0);
                s.setId(99L);
                return 1;
            });
            when(courseStudentMapper.selectOne(any())).thenReturn(null);
            when(courseStudentMapper.insert(any(CourseStudent.class))).thenReturn(1);

            ClassStudentExcelDTO dto = new ClassStudentExcelDTO();
            dto.setStudentNo("S2025001");
            dto.setName("陈晨");
            dto.setGender("男");
            dto.setClassName("软件2201");
            byte[] bytes = writeExcel(ClassStudentExcelDTO.class, List.of(dto), ExcelTypeEnum.XLSX);

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(bytes), "CS101_CLASS_STUDENT_软件2101.xlsx");

            // Then
            assertEquals(1, result.getSuccessRows());
            verify(userMapper).insert(any(User.class));
            verify(studentMapper).insert(any(Student.class));
            verify(courseStudentMapper).insert(any(CourseStudent.class));
        }
    }

    @Nested
    @DisplayName("考核成绩导入 - 动态表头格式")
    class AssessmentFormats {

        @Mock private AssessmentMapper assessmentMapper;
        @Mock private AssessmentRecordMapper recordMapper;
        @Mock private RecordKpDeductionMapper deductionMapper;
        @Mock private StudentMapper studentMapper;
        @Mock private CourseMapper courseMapper;
        @Mock private StudentKpMasteryMapper masteryMapper;

        /** 生成考核成绩格式 xlsx：序号|学号|姓名|第1~5题(得分,扣分知识点)|总成绩|最薄弱知识点 */
        private byte[] assessmentXlsx(int studentCount) {
            List<List<String>> head = new ArrayList<>();
            head.add(List.of("序号"));
            head.add(List.of("学号"));
            head.add(List.of("姓名"));
            for (int q = 1; q <= 5; q++) {
                head.add(List.of("第" + q + "题得分"));
                head.add(List.of("扣分知识点"));
            }
            head.add(List.of("总成绩"));
            head.add(List.of("最薄弱知识点"));

            List<List<Object>> rows = new ArrayList<>();
            for (int i = 1; i <= studentCount; i++) {
                List<Object> row = new ArrayList<>(
                        List.of(i, "S202400" + i, "学生" + i));
                for (int q = 1; q <= 5; q++) {
                    row.add(18);
                    row.add("线性表");
                }
                row.add(90);
                row.add("线性表");
                rows.add(row);
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            EasyExcel.write(baos).head(head).sheet("软件2101").doWrite(rows);
            return baos.toByteArray();
        }

        private void stubCommonMappers() {
            when(courseMapper.selectOne(any())).thenReturn(buildCourse());
            when(assessmentMapper.selectOne(any())).thenReturn(null);
            when(assessmentMapper.insert(any(Assessment.class))).thenAnswer(inv -> {
                Assessment a = inv.getArgument(0);
                a.setId(100L);
                return 1;
            });
            when(studentMapper.selectOne(any())).thenReturn(buildStudent(1L, "S2024001"));
            when(recordMapper.insert(any(AssessmentRecord.class))).thenAnswer(inv -> {
                AssessmentRecord r = inv.getArgument(0);
                r.setId(200L);
                return 1;
            });
            when(deductionMapper.insert(any(RecordKpDeduction.class))).thenReturn(1);
            // 掌握度重算查不到记录 → 短路
            when(recordMapper.selectList(any())).thenReturn(List.of());
        }

        @Test
        @DisplayName("FMT-09: QUIZ 导入 3 名学生全部成功，题目数检测为 5")
        void shouldImportAllRows_WhenQuizXlsx() {
            // Given
            QuizImportStrategy strategy = new QuizImportStrategy(assessmentMapper,
                    recordMapper, deductionMapper, studentMapper, courseMapper, masteryMapper);
            stubCommonMappers();

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(assessmentXlsx(3)), "CS101_QUIZ_第1次测验.xlsx");

            // Then
            assertEquals(3, result.getTotalRows(), "表头行不应吞掉第一个学生行");
            assertEquals(3, result.getSuccessRows());
            assertEquals(ImportStatus.SUCCESS.getCode(), result.getStatus());

            ArgumentCaptor<Assessment> captor = ArgumentCaptor.forClass(Assessment.class);
            verify(assessmentMapper).insert(captor.capture());
            assertEquals(5, captor.getValue().getQuestionCount(), "应从表头检测出 5 题");
            assertEquals("QUIZ", captor.getValue().getAssessmentType());
            verify(recordMapper, times(3)).insert(any(AssessmentRecord.class));
        }

        @Test
        @DisplayName("FMT-10: EXAM_SCORE 文件名解析成功（修复前 EXAM_SCORE 含下划线导致必失败）")
        void shouldParseFileName_WhenExamScoreWithUnderscore() {
            // Given
            ExamScoreImportStrategy strategy = new ExamScoreImportStrategy(assessmentMapper,
                    recordMapper, deductionMapper, studentMapper, courseMapper, masteryMapper);
            stubCommonMappers();

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(assessmentXlsx(2)),
                    "CS101_EXAM_SCORE_MIDTERM_期中考试.xlsx");

            // Then
            assertEquals(2, result.getSuccessRows());

            ArgumentCaptor<Assessment> captor = ArgumentCaptor.forClass(Assessment.class);
            verify(assessmentMapper).insert(captor.capture());
            assertEquals("MIDTERM", captor.getValue().getAssessmentType());
            assertEquals("期中考试", captor.getValue().getAssessmentName());
            assertEquals(10L, captor.getValue().getCourseId(), "应通过文件名第一段查到课程");
        }
    }
}
