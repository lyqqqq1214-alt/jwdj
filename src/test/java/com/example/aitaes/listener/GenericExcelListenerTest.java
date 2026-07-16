package com.example.aitaes.listener;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.support.ExcelTypeEnum;
import com.example.aitaes.dto.ImportResultDTO;
import com.example.aitaes.dto.excel.StudentExcelDTO;
import com.example.aitaes.enums.ImportStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 通用 Excel 监听器测试
 * <p>
 * 覆盖：行级结果收集（成功/失败/跳过）、批处理器整体异常保底、
 * 真实行号透传、空文件统一 FAILED。
 */
@DisplayName("通用 Excel 监听器")
class GenericExcelListenerTest {

    /** 生成学生 DTO 的 xlsx 字节 */
    private static byte[] studentXlsx(String... studentNos) {
        List<StudentExcelDTO> rows = new ArrayList<>();
        for (String no : studentNos) {
            StudentExcelDTO dto = new StudentExcelDTO();
            dto.setStudentNo(no);
            dto.setName("学生" + no);
            rows.add(dto);
        }
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        EasyExcel.write(baos, StudentExcelDTO.class)
                .excelType(ExcelTypeEnum.XLSX).sheet("Sheet1").doWrite(rows);
        return baos.toByteArray();
    }

    private static void read(byte[] bytes, GenericExcelListener<StudentExcelDTO> listener) {
        EasyExcel.read(new ByteArrayInputStream(bytes), StudentExcelDTO.class, listener)
                .excelType(ExcelTypeEnum.XLSX).sheet().doRead();
    }

    @Nested
    @DisplayName("行级结果收集")
    class RowLevelCollecting {

        @Test
        @DisplayName("GL-01: 成功/失败/跳过逐行计数，结果与上报一致")
        void shouldCountPerRow() {
            // Given：3 行数据，第 1 行成功、第 2 行失败、第 3 行跳过
            GenericExcelListener<StudentExcelDTO> listener = new GenericExcelListener<>(500,
                    (batch, collector) -> {
                        collector.success();
                        collector.fail(batch.get(1).rowNo(), "学生不存在");
                        collector.skip(batch.get(2).rowNo(), "重复数据");
                    });

            // When
            read(studentXlsx("S001", "S002", "S003"), listener);
            ImportResultDTO result = listener.buildResult();

            // Then
            assertEquals(3, result.getTotalRows());
            assertEquals(1, result.getSuccessRows());
            assertEquals(1, result.getFailRows());
            assertEquals(1, result.getSkippedRows());
            assertEquals(ImportStatus.PARTIAL.getCode(), result.getStatus());
            // 数据行从 Excel 第 2 行开始（第 1 行为表头）
            assertTrue(result.getErrors().get(0).startsWith("第3行"),
                    "错误应携带真实 Excel 行号，实际: " + result.getErrors().get(0));
            assertTrue(result.getWarnings().get(0).startsWith("第4行"));
        }

        @Test
        @DisplayName("GL-02: 批处理器整体抛异常 → 该批全部计失败（保底）")
        void shouldFailWholeBatch_WhenProcessorThrows() {
            // Given
            GenericExcelListener<StudentExcelDTO> listener = new GenericExcelListener<>(500,
                    (batch, collector) -> {
                        throw new RuntimeException("数据库连接失败");
                    });

            // When
            read(studentXlsx("S001", "S002"), listener);
            ImportResultDTO result = listener.buildResult();

            // Then
            assertEquals(2, result.getTotalRows());
            assertEquals(0, result.getSuccessRows());
            assertEquals(2, result.getFailRows());
            assertEquals(ImportStatus.FAILED.getCode(), result.getStatus());
            assertTrue(result.getErrors().get(0).contains("批次保存失败"));
        }
    }

    @Nested
    @DisplayName("空文件处理")
    class EmptyFile {

        @Test
        @DisplayName("GL-03: 仅表头无数据行 → FAILED（修复前返回 SUCCESS 共0行）")
        void shouldFail_WhenNoDataRows() {
            // Given
            GenericExcelListener<StudentExcelDTO> listener = new GenericExcelListener<>(500,
                    (batch, collector) -> batch.forEach(r -> collector.success()));

            // When
            read(studentXlsx(), listener);
            ImportResultDTO result = listener.buildResult();

            // Then
            assertEquals(0, result.getTotalRows());
            assertEquals(ImportStatus.FAILED.getCode(), result.getStatus());
            assertTrue(result.getErrors().get(0).contains("未解析到任何数据行"));
        }
    }
}
