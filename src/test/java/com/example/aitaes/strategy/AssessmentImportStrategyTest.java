package com.example.aitaes.strategy;

import com.alibaba.excel.EasyExcel;
import com.example.aitaes.dto.ImportResultDTO;
import com.example.aitaes.entity.Assessment;
import com.example.aitaes.entity.AssessmentRecord;
import com.example.aitaes.entity.Course;
import com.example.aitaes.entity.RecordKpDeduction;
import com.example.aitaes.entity.Student;
import com.example.aitaes.enums.ImportStatus;
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
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * 考核成绩导入策略测试（AbstractAssessmentImportStrategy）
 * <p>
 * 覆盖修复项：
 * <ul>
 *   <li>页面参数（courseId/assessmentName/assessmentType）优先于文件名解析</li>
 *   <li>课程/考核名无法确定 → 返回 FAILED（不再抛异常）</li>
 *   <li>空文件（仅表头）→ FAILED，不创建空考核</li>
 *   <li>按表头列名定位（对旧模板列序鲁棒）</li>
 *   <li>学生不存在 → 计失败并携带真实行号</li>
 *   <li>重复成绩记录 → 跳过并计入警告</li>
 *   <li>单例无跨请求脏状态（连续两次导入不同课程互不污染）</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("考核成绩导入策略")
class AssessmentImportStrategyTest {

    @Mock private AssessmentMapper assessmentMapper;
    @Mock private AssessmentRecordMapper recordMapper;
    @Mock private RecordKpDeductionMapper deductionMapper;
    @Mock private StudentMapper studentMapper;
    @Mock private CourseMapper courseMapper;
    @Mock private StudentKpMasteryMapper masteryMapper;

    private AssessmentImportStrategy strategy;

    @BeforeEach
    void setUp() {
        strategy = new AssessmentImportStrategy(assessmentMapper, recordMapper,
                deductionMapper, studentMapper, courseMapper, masteryMapper,
                new CourseResolver(courseMapper));
    }

    // ===== 测试数据工厂 =====

    private static Course buildCourse(Long id, String courseNo) {
        Course course = new Course();
        course.setId(id);
        course.setCourseNo(courseNo);
        course.setSemester("2025-2026-1");
        return course;
    }

    private static Student buildStudent(Long id, String studentNo) {
        Student student = new Student();
        student.setId(id);
        student.setStudentNo(studentNo);
        return student;
    }

    /** 生成标准列序 xlsx：序号|学号|姓名|第1~2题(得分,扣分知识点)|总成绩|最薄弱知识点 */
    private static byte[] standardXlsx(String... studentNos) {
        List<List<String>> head = new ArrayList<>();
        head.add(List.of("序号"));
        head.add(List.of("学号"));
        head.add(List.of("姓名"));
        for (int q = 1; q <= 2; q++) {
            head.add(List.of("第" + q + "题得分"));
            head.add(List.of("扣分主要知识点"));
        }
        head.add(List.of("总成绩"));
        head.add(List.of("最薄弱知识点"));

        List<List<Object>> rows = new ArrayList<>();
        int i = 1;
        for (String no : studentNos) {
            rows.add(List.of(i++, no, "学生" + no, 18, "线性表", 20, "", 90, "线性表"));
        }
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        EasyExcel.write(baos).head(head).sheet("Sheet1").doWrite(rows);
        return baos.toByteArray();
    }

    /** 生成旧模板列序 xlsx：序号|学号|姓名|总成绩|最薄弱知识点|第1题得分|扣分主要知识点 */
    private static byte[] legacyOrderXlsx(String studentNo) {
        List<List<String>> head = new ArrayList<>();
        head.add(List.of("序号"));
        head.add(List.of("学号"));
        head.add(List.of("姓名"));
        head.add(List.of("总成绩"));
        head.add(List.of("最薄弱知识点"));
        head.add(List.of("第1题得分"));
        head.add(List.of("扣分主要知识点"));

        List<List<Object>> rows = List.of(
                List.of(1, studentNo, "学生" + studentNo, 90, "线性表", 18, "线性表"));
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        EasyExcel.write(baos).head(head).sheet("Sheet1").doWrite(rows);
        return baos.toByteArray();
    }

    private void stubHappyPath() {
        when(assessmentMapper.selectOne(any())).thenReturn(null);
        when(assessmentMapper.insert(any(Assessment.class))).thenAnswer(inv -> {
            Assessment a = inv.getArgument(0);
            a.setId(100L);
            return 1;
        });
        when(studentMapper.selectOne(any())).thenReturn(buildStudent(1L, "S001"));
        when(recordMapper.selectOne(any())).thenReturn(null);
        when(recordMapper.insert(any(AssessmentRecord.class))).thenAnswer(inv -> {
            AssessmentRecord r = inv.getArgument(0);
            r.setId(200L);
            return 1;
        });
        when(recordMapper.selectList(any())).thenReturn(List.of());
    }

    @Nested
    @DisplayName("导入上下文优先级")
    class ContextPriority {

        @Test
        @DisplayName("AS-01: 页面传 courseId + assessmentName → 优先于文件名，文件名可随意")
        void shouldUseContextParams_OverFilename() {
            // Given
            when(courseMapper.selectById(10L)).thenReturn(buildCourse(10L, "CS101"));
            stubHappyPath();
            when(deductionMapper.insert(any(RecordKpDeduction.class))).thenReturn(1);

            ImportContext ctx = ImportContext.builder()
                    .originalFilename("随便的文件名.xlsx")
                    .courseId(10L)
                    .assessmentName("第1次作业")
                    .build();

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(standardXlsx("S001")), ctx);

            // Then
            assertEquals(ImportStatus.SUCCESS.getCode(), result.getStatus());
            assertEquals(1, result.getSuccessRows());

            ArgumentCaptor<Assessment> captor = ArgumentCaptor.forClass(Assessment.class);
            verify(assessmentMapper).insert(captor.capture());
            assertEquals(10L, captor.getValue().getCourseId(), "应使用页面传入的 courseId");
            assertEquals("第1次作业", captor.getValue().getAssessmentName());
            assertEquals("HOMEWORK", captor.getValue().getAssessmentType());
            // 不应走文件名查课程（selectOne 未被调用）
            verify(courseMapper, never()).selectOne(any());
        }

        @Test
        @DisplayName("AS-02: 页面传的 courseId 不存在 → FAILED，不回退文件名")
        void shouldFail_WhenContextCourseIdNotFound() {
            // Given
            when(courseMapper.selectById(999L)).thenReturn(null);

            ImportContext ctx = ImportContext.builder()
                    .originalFilename("CS101_HOMEWORK_第1次作业.xlsx")
                    .courseId(999L)
                    .build();

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(standardXlsx("S001")), ctx);

            // Then
            assertEquals(ImportStatus.FAILED.getCode(), result.getStatus());
            assertFalse(result.getErrors().isEmpty());
            verify(assessmentMapper, never()).insert(any(Assessment.class));
        }

        @Test
        @DisplayName("AS-03: 无 courseId 且文件名查不到课程 → FAILED 并提示选择课程")
        void shouldFail_WhenCourseUnresolvable() {
            // Given
            when(courseMapper.selectOne(any())).thenReturn(null);

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(standardXlsx("S001")),
                    ImportContext.builder().originalFilename("UNKNOWN_HOMEWORK_第1次作业.xlsx").build());

            // Then
            assertEquals(ImportStatus.FAILED.getCode(), result.getStatus());
            assertTrue(result.getErrors().get(0).contains("无法确定归属课程"));
        }

        @Test
        @DisplayName("AS-04: 有课程但无考核名称（页面/文件名均未提供）→ FAILED")
        void shouldFail_WhenAssessmentNameMissing() {
            // Given
            when(courseMapper.selectById(10L)).thenReturn(buildCourse(10L, "CS101"));

            ImportContext ctx = ImportContext.builder()
                    .originalFilename("成绩.xlsx")
                    .courseId(10L)
                    .build();

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(standardXlsx("S001")), ctx);

            // Then
            assertEquals(ImportStatus.FAILED.getCode(), result.getStatus());
            assertTrue(result.getErrors().get(0).contains("考核名称"));
        }
    }

    @Nested
    @DisplayName("诚实计数与容错")
    class HonestCounting {

        @Test
        @DisplayName("AS-05: 空文件（仅表头）→ FAILED，不创建空考核")
        void shouldFail_WhenNoDataRows() {
            // Given
            when(courseMapper.selectById(10L)).thenReturn(buildCourse(10L, "CS101"));

            ImportContext ctx = ImportContext.builder()
                    .originalFilename("空表.xlsx")
                    .courseId(10L)
                    .assessmentName("第1次作业")
                    .build();

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(standardXlsx()), ctx);

            // Then
            assertEquals(ImportStatus.FAILED.getCode(), result.getStatus());
            assertEquals(0, result.getTotalRows());
            assertTrue(result.getErrors().get(0).contains("未解析到任何数据行"));
            verify(assessmentMapper, never()).insert(any(Assessment.class));
        }

        @Test
        @DisplayName("AS-06: 学生不存在 → 计失败且错误带真实行号")
        void shouldCountFail_WhenStudentNotFound() {
            // Given
            when(courseMapper.selectById(10L)).thenReturn(buildCourse(10L, "CS101"));
            when(assessmentMapper.selectOne(any())).thenReturn(null);
            when(assessmentMapper.insert(any(Assessment.class))).thenReturn(1);
            when(studentMapper.selectOne(any())).thenReturn(null);

            ImportContext ctx = ImportContext.builder()
                    .originalFilename("成绩.xlsx")
                    .courseId(10L)
                    .assessmentName("第1次作业")
                    .build();

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(standardXlsx("S404")), ctx);

            // Then
            assertEquals(ImportStatus.FAILED.getCode(), result.getStatus());
            assertEquals(1, result.getTotalRows());
            assertEquals(0, result.getSuccessRows());
            assertEquals(1, result.getFailRows());
            // 数据行在 Excel 第 2 行（第 1 行为表头）
            assertTrue(result.getErrors().get(0).contains("第2行"),
                    "错误应携带真实 Excel 行号，实际: " + result.getErrors().get(0));
            assertTrue(result.getErrors().get(0).contains("学生不存在"));
        }

        @Test
        @DisplayName("AS-07: 重复导入同一考核同一学生 → 跳过并计入警告")
        void shouldSkip_WhenRecordAlreadyExists() {
            // Given
            when(courseMapper.selectById(10L)).thenReturn(buildCourse(10L, "CS101"));
            when(assessmentMapper.selectOne(any())).thenReturn(null);
            when(assessmentMapper.insert(any(Assessment.class))).thenAnswer(inv -> {
                Assessment a = inv.getArgument(0);
                a.setId(100L);
                return 1;
            });
            when(studentMapper.selectOne(any())).thenReturn(buildStudent(1L, "S001"));
            AssessmentRecord existing = new AssessmentRecord();
            existing.setId(200L);
            when(recordMapper.selectOne(any())).thenReturn(existing);

            ImportContext ctx = ImportContext.builder()
                    .originalFilename("成绩.xlsx")
                    .courseId(10L)
                    .assessmentName("第1次作业")
                    .build();

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(standardXlsx("S001")), ctx);

            // Then
            assertEquals(1, result.getSkippedRows());
            assertEquals(0, result.getSuccessRows());
            assertEquals(0, result.getFailRows());
            assertEquals(ImportStatus.SUCCESS.getCode(), result.getStatus());
            assertTrue(result.getWarnings().get(0).contains("已有成绩记录"));
            verify(recordMapper, never()).insert(any(AssessmentRecord.class));
        }
    }

    @Nested
    @DisplayName("表头列名定位")
    class HeaderLayout {

        @Test
        @DisplayName("AS-08: 旧模板列序（总成绩在前）→ 仍能正确取到总成绩")
        void shouldParseCorrectly_WhenLegacyColumnOrder() {
            // Given
            when(courseMapper.selectById(10L)).thenReturn(buildCourse(10L, "CS101"));
            stubHappyPath();
            when(deductionMapper.insert(any(RecordKpDeduction.class))).thenReturn(1);

            ImportContext ctx = ImportContext.builder()
                    .originalFilename("成绩.xlsx")
                    .courseId(10L)
                    .assessmentName("第1次作业")
                    .build();

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(legacyOrderXlsx("S001")), ctx);

            // Then
            assertEquals(1, result.getSuccessRows());
            ArgumentCaptor<AssessmentRecord> captor = ArgumentCaptor.forClass(AssessmentRecord.class);
            verify(recordMapper).insert(captor.capture());
            assertEquals(0, new BigDecimal("90").compareTo(captor.getValue().getTotalScore()),
                    "总成绩应取自\"总成绩\"列而非按固定列序取值");
            assertEquals("线性表", captor.getValue().getWeakestKp());
        }

        @Test
        @DisplayName("AS-09: 表头缺少学号列 → FAILED 并提示使用官方模板")
        void shouldFail_WhenStudentNoColumnMissing() {
            // Given
            when(courseMapper.selectById(10L)).thenReturn(buildCourse(10L, "CS101"));

            List<List<String>> head = new ArrayList<>();
            head.add(List.of("编号"));
            head.add(List.of("名字"));
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            EasyExcel.write(baos).head(head).sheet("Sheet1")
                    .doWrite(List.of(List.of(1, "张三")));

            ImportContext ctx = ImportContext.builder()
                    .originalFilename("成绩.xlsx")
                    .courseId(10L)
                    .assessmentName("第1次作业")
                    .build();

            // When
            ImportResultDTO result = strategy.execute(
                    new ByteArrayInputStream(baos.toByteArray()), ctx);

            // Then
            assertEquals(ImportStatus.FAILED.getCode(), result.getStatus());
            assertTrue(result.getErrors().get(0).contains("学号"));
        }
    }

    @Nested
    @DisplayName("单例脏状态回归")
    class StaleStateRegression {

        @Test
        @DisplayName("AS-10: 同一实例连续导入两个课程 → 第二次不残留第一次的上下文")
        void shouldNotLeakState_BetweenExecutions() {
            // Given
            when(courseMapper.selectById(10L)).thenReturn(buildCourse(10L, "CS101"));
            when(courseMapper.selectById(20L)).thenReturn(buildCourse(20L, "CS202"));
            stubHappyPath();
            when(deductionMapper.insert(any(RecordKpDeduction.class))).thenReturn(1);

            // When：第一次导入课程 10
            strategy.execute(new ByteArrayInputStream(standardXlsx("S001")),
                    ImportContext.builder().originalFilename("a.xlsx")
                            .courseId(10L).assessmentName("第1次作业").build());
            // 第二次导入课程 20
            strategy.execute(new ByteArrayInputStream(standardXlsx("S001")),
                    ImportContext.builder().originalFilename("b.xlsx")
                            .courseId(20L).assessmentName("第2次作业").build());

            // Then：两次创建的考核分别归属各自课程
            ArgumentCaptor<Assessment> captor = ArgumentCaptor.forClass(Assessment.class);
            verify(assessmentMapper, times(2)).insert(captor.capture());
            assertEquals(10L, captor.getAllValues().get(0).getCourseId());
            assertEquals("第1次作业", captor.getAllValues().get(0).getAssessmentName());
            assertEquals(20L, captor.getAllValues().get(1).getCourseId());
            assertEquals("第2次作业", captor.getAllValues().get(1).getAssessmentName());
        }
    }

    @Nested
    @DisplayName("期中/期末考核类型")
    class ExamType {

        @Test
        @DisplayName("AS-11: EXAM_SCORE 页面选择 FINAL → assessmentType=FINAL")
        void shouldUseContextExamType() {
            // Given
            ExamScoreImportStrategy examStrategy = new ExamScoreImportStrategy(assessmentMapper,
                    recordMapper, deductionMapper, studentMapper, courseMapper, masteryMapper,
                    new CourseResolver(courseMapper));
            when(courseMapper.selectById(10L)).thenReturn(buildCourse(10L, "CS101"));
            stubHappyPath();
            when(deductionMapper.insert(any(RecordKpDeduction.class))).thenReturn(1);

            ImportContext ctx = ImportContext.builder()
                    .originalFilename("期末成绩.xlsx")
                    .courseId(10L)
                    .assessmentName("期末考试")
                    .assessmentType("FINAL")
                    .build();

            // When
            ImportResultDTO result = examStrategy.execute(
                    new ByteArrayInputStream(standardXlsx("S001")), ctx);

            // Then
            assertEquals(1, result.getSuccessRows());
            ArgumentCaptor<Assessment> captor = ArgumentCaptor.forClass(Assessment.class);
            verify(assessmentMapper).insert(captor.capture());
            assertEquals("FINAL", captor.getValue().getAssessmentType());
        }

        @Test
        @DisplayName("AS-12: EXAM_SCORE 页面/文件名均未提供类型 → FAILED 提示选择期中/期末")
        void shouldFail_WhenExamTypeUnresolvable() {
            // Given
            ExamScoreImportStrategy examStrategy = new ExamScoreImportStrategy(assessmentMapper,
                    recordMapper, deductionMapper, studentMapper, courseMapper, masteryMapper,
                    new CourseResolver(courseMapper));
            when(courseMapper.selectById(10L)).thenReturn(buildCourse(10L, "CS101"));

            ImportContext ctx = ImportContext.builder()
                    .originalFilename("期末成绩.xlsx")
                    .courseId(10L)
                    .assessmentName("期末考试")
                    .build();

            // When
            ImportResultDTO result = examStrategy.execute(
                    new ByteArrayInputStream(standardXlsx("S001")), ctx);

            // Then
            assertEquals(ImportStatus.FAILED.getCode(), result.getStatus());
            assertTrue(result.getErrors().get(0).contains("期中") || result.getErrors().get(0).contains("考核类型"));
        }
    }
}
