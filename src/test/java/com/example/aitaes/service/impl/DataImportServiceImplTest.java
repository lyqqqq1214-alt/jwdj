package com.example.aitaes.service.impl;

import com.example.aitaes.common.BusinessException;
import com.example.aitaes.dto.ImportResultDTO;
import com.example.aitaes.entity.DataImportLog;
import com.example.aitaes.mapper.DataImportLogMapper;
import com.example.aitaes.strategy.ImportContext;
import com.example.aitaes.strategy.ImportStrategy;
import com.example.aitaes.strategy.ImportStrategyFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * 数据导入服务单元测试
 *
 * 覆盖：文件校验、类型路由、策略调用、日志记录、异常处理
 * 测试方法：等价类划分 + 边界值分析
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("数据导入服务")
class DataImportServiceImplTest {

    @Mock private ImportStrategyFactory strategyFactory;
    @Mock private DataImportLogMapper logMapper;
    @Mock private ImportStrategy mockStrategy;

    @InjectMocks
    private DataImportServiceImpl service;

    private static final byte[] SAMPLE_CONTENT = "学号,姓名\n2024001,张三\n".getBytes();

    /** 创建合法的 MultipartFile */
    private MultipartFile validFile(String filename) {
        return new MockMultipartFile("file", filename,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                SAMPLE_CONTENT);
    }

    @Nested
    @DisplayName("文件校验 - validateFile")
    class FileValidation {

        @Test
        @DisplayName("DI-01: 上传空文件 → 抛出 BusinessException")
        void shouldReject_WhenFileIsEmpty() {
            MultipartFile emptyFile = new MockMultipartFile("file", "test.xlsx",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    new byte[0]);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> service.importFile(emptyFile, "TEACHER", null));

            assertTrue(ex.getMessage().contains("不能为空"),
                    "错误消息应包含'不能为空'，实际: " + ex.getMessage());
            verify(strategyFactory, never()).getStrategy(any());
        }

        @Test
        @DisplayName("DI-02: 上传 .pdf 文件 → 抛出 BusinessException")
        void shouldReject_WhenFileTypeNotSupported() {
            MultipartFile pdfFile = new MockMultipartFile("file", "test.pdf",
                    "application/pdf", SAMPLE_CONTENT);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> service.importFile(pdfFile, "TEACHER", null));

            assertTrue(ex.getMessage().contains("不支持的文件格式"),
                    "错误消息应包含'不支持的文件格式'，实际: " + ex.getMessage());
        }

        @Test
        @DisplayName("DI-02b: 上传 .txt 文件 → 应拒绝")
        void shouldReject_WhenFileIsTxt() {
            MultipartFile txtFile = validFile("data.txt");

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> service.importFile(txtFile, "TEACHER", null));

            assertTrue(ex.getMessage().contains("不支持的文件格式"));
        }

        @Test
        @DisplayName("DI-02c: 上传无扩展名文件 → 应拒绝")
        void shouldReject_WhenNoExtension() {
            MultipartFile noExtFile = new MockMultipartFile("file", "noextension",
                    "application/octet-stream", SAMPLE_CONTENT);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> service.importFile(noExtFile, "TEACHER", null));

            assertTrue(ex.getMessage().contains("不支持的文件格式"));
        }

        @Test
        @DisplayName("文件名为空字符串 → 抛 BusinessException（不支持格式）")
        void shouldReject_WhenFilenameIsNull() {
            MultipartFile nullNameFile = new MockMultipartFile("file", "",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    SAMPLE_CONTENT);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> service.importFile(nullNameFile, "TEACHER", null));

            assertTrue(ex.getMessage().contains("不支持的文件格式"),
                    "空文件名应被拒绝，实际: " + ex.getMessage());
        }

        @Test
        @DisplayName("支持的文件扩展名：.xlsx/.xls/.csv 都应通过")
        void shouldAccept_AllSupportedExtensions() throws Exception {
            for (String ext : new String[]{".xlsx", ".xls", ".csv"}) {
                when(strategyFactory.getStrategy(any())).thenReturn(mockStrategy);
                ImportResultDTO mockResult = new ImportResultDTO();
                mockResult.setTotalRows(2);
                mockResult.setSuccessRows(2);
                mockResult.setFailRows(0);
                mockResult.setStatus("SUCCESS");
                when(mockStrategy.execute(any(InputStream.class), any(ImportContext.class))).thenReturn(mockResult);

                MultipartFile file = validFile("data" + ext);
                ImportResultDTO result = service.importFile(file, "TEACHER", null);

                assertNotNull(result);
                assertEquals(2, result.getSuccessRows());
            }
            // 三种扩展名各调用一次 getStrategy
            verify(strategyFactory, times(3)).getStrategy(any());
        }
    }

    @Nested
    @DisplayName("导入类型路由")
    class TypeRouting {

        @Test
        @DisplayName("DI-04: 不支持的导入类型 → 抛出 BusinessException")
        void shouldReject_WhenInvalidImportType() {
            MultipartFile file = validFile("test.xlsx");

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> service.importFile(file, "INVALID_TYPE", null));

            assertTrue(ex.getMessage().contains("不支持的导入类型"),
                    "错误消息应包含'不支持的导入类型'，实际: " + ex.getMessage());
            verify(strategyFactory, never()).getStrategy(any());
        }

        @Test
        @DisplayName("导入类型大小写不敏感 → TEACHER 和 teacher 等价")
        void shouldBeCaseInsensitive() throws Exception {
            when(strategyFactory.getStrategy(any())).thenReturn(mockStrategy);
            ImportResultDTO mockResult = new ImportResultDTO();
            mockResult.setTotalRows(1);
            mockResult.setSuccessRows(1);
            mockResult.setFailRows(0);
            mockResult.setStatus("SUCCESS");
            when(mockStrategy.execute(any(InputStream.class), any(ImportContext.class))).thenReturn(mockResult);

            MultipartFile file = validFile("test.xlsx");
            // 小写也能识别
            ImportResultDTO result = service.importFile(file, "teacher", null);

            assertNotNull(result);
            verify(strategyFactory).getStrategy(any());
        }
    }

    @Nested
    @DisplayName("策略执行与日志")
    class StrategyExecution {

        @Test
        @DisplayName("DI-05: 正常导入 → 调用策略 + 记录日志")
        void shouldExecuteStrategyAndLog() throws Exception {
            when(strategyFactory.getStrategy(any())).thenReturn(mockStrategy);

            ImportResultDTO mockResult = new ImportResultDTO();
            mockResult.setTotalRows(10);
            mockResult.setSuccessRows(9);
            mockResult.setFailRows(1);
            mockResult.setStatus("PARTIAL");
            mockResult.setErrors(java.util.List.of("第5行: 学号格式错误"));

            when(mockStrategy.execute(any(InputStream.class),
                    argThat((ImportContext ctx) -> ctx != null && "test.xlsx".equals(ctx.getOriginalFilename()))))
                    .thenReturn(mockResult);

            MultipartFile file = validFile("test.xlsx");

            // When（courseId/sourceId 透传到 ImportContext）
            ImportContext context = ImportContext.builder().sourceId(1L).courseId(10L).build();
            ImportResultDTO result = service.importFile(file, "TEACHER", context);

            // Then
            assertNotNull(result);
            assertEquals(10, result.getTotalRows());
            assertEquals(9, result.getSuccessRows());
            assertEquals(1, result.getFailRows());
            assertEquals("PARTIAL", result.getStatus());
            assertEquals(10L, context.getCourseId(), "courseId 应保留在上下文中");

            // 验证策略被调用且拿到补全后的上下文
            verify(mockStrategy).execute(any(InputStream.class),
                    argThat((ImportContext ctx) -> "test.xlsx".equals(ctx.getOriginalFilename())
                            && ctx.getCourseId() == 10L));
            // 验证日志被记录
            verify(logMapper, atLeastOnce()).insert(any(DataImportLog.class));
        }

        @Test
        @DisplayName("DI-06: 策略抛异常 → 日志记录失败状态")
        void shouldLogFailure_WhenStrategyThrows() throws Exception {
            when(strategyFactory.getStrategy(any())).thenReturn(mockStrategy);
            when(mockStrategy.execute(any(InputStream.class), any(ImportContext.class)))
                    .thenThrow(new RuntimeException("模拟 Excel 解析异常"));

            MultipartFile file = validFile("test.xlsx");

            // When & Then
            assertThrows(RuntimeException.class,
                    () -> service.importFile(file, "TEACHER", null));

            // 策略抛异常后不应记录日志（异常在 execute 阶段抛出，未到日志阶段）
            verify(logMapper, never()).insert(any(DataImportLog.class));
        }

        @Test
        @DisplayName("日志记录自身失败 → 不影响导入结果返回")
        void shouldNotAffectResult_WhenLogInsertFails() throws Exception {
            when(strategyFactory.getStrategy(any())).thenReturn(mockStrategy);

            ImportResultDTO mockResult = new ImportResultDTO();
            mockResult.setTotalRows(5);
            mockResult.setSuccessRows(5);
            mockResult.setFailRows(0);
            mockResult.setStatus("SUCCESS");

            when(mockStrategy.execute(any(InputStream.class), any(ImportContext.class)))
                    .thenReturn(mockResult);
            doThrow(new RuntimeException("DB连接失败")).when(logMapper).insert(any(DataImportLog.class));

            MultipartFile file = validFile("test.xlsx");

            // 日志异常不应抛出，导入结果正常返回
            ImportResultDTO result = service.importFile(file, "TEACHER", null);

            assertNotNull(result);
            assertEquals(5, result.getSuccessRows());
        }
    }

    @Nested
    @DisplayName("文件读取异常")
    class FileReadException {

        @Test
        @DisplayName("IO 异常 → 包装为 BusinessException")
        void shouldWrapIOException() throws Exception {
            when(strategyFactory.getStrategy(any())).thenReturn(mockStrategy);
            // 使用会抛 IOException 的 mock 文件
            MultipartFile brokenFile = mock(MultipartFile.class);
            when(brokenFile.isEmpty()).thenReturn(false);
            when(brokenFile.getOriginalFilename()).thenReturn("test.xlsx");
            when(brokenFile.getInputStream()).thenThrow(new IOException("磁盘读取错误"));

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> service.importFile(brokenFile, "TEACHER", null));

            assertTrue(ex.getMessage().contains("文件读取失败"));
        }
    }
}
