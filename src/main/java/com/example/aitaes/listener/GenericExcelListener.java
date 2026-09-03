package com.example.aitaes.listener;

import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.exception.ExcelDataConvertException;
import com.alibaba.excel.read.listener.ReadListener;
import com.example.aitaes.dto.ImportResultDTO;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;

/**
 * 通用 EasyExcel 读取监听器
 * <p>
 * 通过回调模式 {@link RowBatchProcessor} 实现与业务逻辑的完全解耦。
 * 支持批量处理、行级容错、诚实的行级统计计数：批处理回调通过
 * {@link RowResultCollector} 逐行上报成功/失败/跳过，导入结果与数据库
 * 实际写入保持一致（不再出现"插入失败仍计成功"）。
 *
 * @param <T> Excel 行数据对应的 DTO 类型
 */
@Slf4j
public class GenericExcelListener<T> implements ReadListener<T> {

    /** 携带真实 Excel 行号（1 起）的行数据 */
    public record ExcelRow<T>(int rowNo, T data) {
    }

    /** 批处理回调：处理一批行数据，并通过 collector 逐行上报结果 */
    @FunctionalInterface
    public interface RowBatchProcessor<T> {
        void process(List<ExcelRow<T>> batch, RowResultCollector collector);
    }

    private final int batchSize;
    private final List<ExcelRow<T>> batch;
    private final RowBatchProcessor<T> batchProcessor;
    private final RowResultCollector collector = new RowResultCollector();
    private int totalRows = 0;

    /**
     * @param batchSize      每批处理的行数
     * @param batchProcessor 批处理回调，接收当前批次数据列表和结果收集器
     */
    public GenericExcelListener(int batchSize, RowBatchProcessor<T> batchProcessor) {
        this.batchSize = batchSize;
        this.batchProcessor = batchProcessor;
        this.batch = new ArrayList<>(batchSize);
    }

    @Override
    public void invoke(T data, AnalysisContext context) {
        totalRows++;
        int rowNo = context.readRowHolder().getRowIndex() + 1;
        batch.add(new ExcelRow<>(rowNo, data));
        if (batch.size() >= batchSize) {
            flushBatch();
        }
    }

    @Override
    public void doAfterAllAnalysed(AnalysisContext context) {
        if (!batch.isEmpty()) {
            flushBatch();
        }
        log.info("Excel 解析完成: 共{}行, 成功{}, 失败{}, 跳过{}", totalRows,
                collector.getSuccessCount(), collector.getFailCount(), collector.getSkipCount());
    }

    /**
     * EasyExcel 解析级别异常处理（数据类型转换失败等）
     * 不抛出异常则 EasyExcel 继续处理后续行
     */
    @Override
    public void onException(Exception exception, AnalysisContext context) throws Exception {
        totalRows++;
        if (exception instanceof ExcelDataConvertException ex) {
            collector.fail(ex.getRowIndex() + 1, String.format("第%d列数据格式错误 - %s",
                    ex.getColumnIndex() + 1, ex.getMessage()));
            log.warn("第{}行第{}列数据格式错误", ex.getRowIndex() + 1, ex.getColumnIndex() + 1);
        } else {
            int rowNo = context.readRowHolder() != null
                    ? context.readRowHolder().getRowIndex() + 1 : 0;
            collector.fail(rowNo, "解析错误 - " + exception.getMessage());
            log.warn("Excel 解析错误", exception);
        }
        // 不抛出异常，继续处理后续行
    }

    private void flushBatch() {
        List<ExcelRow<T>> current = new ArrayList<>(batch);
        batch.clear();
        try {
            batchProcessor.process(current, collector);
        } catch (Exception e) {
            // 批处理器整体抛异常时保底：该批全部计失败
            for (ExcelRow<T> row : current) {
                collector.fail(row.rowNo(), "批次保存失败: " + e.getMessage());
            }
            log.error("批次保存失败，共{}行", current.size(), e);
        }
    }

    /** 按统一规则汇总导入结果（totalRows==0 视为 FAILED） */
    public ImportResultDTO buildResult() {
        return ImportResultDTO.of(totalRows, collector.getSuccessCount(),
                collector.getFailCount(), collector.getSkipCount(),
                collector.getErrors(), collector.getWarnings());
    }

    // ===== 统计信息获取 =====

    public int getTotalRows() {
        return totalRows;
    }

    public int getSuccessCount() {
        return collector.getSuccessCount();
    }

    public int getFailCount() {
        return collector.getFailCount();
    }

    public List<String> getErrorMessages() {
        return new ArrayList<>(collector.getErrors());
    }
}
