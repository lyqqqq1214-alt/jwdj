package com.example.aitaes.listener;

import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

/**
 * 行级导入结果收集器
 * <p>
 * 由批处理回调逐行上报处理结果，保证导入统计与数据库实际写入一致：
 * <ul>
 *   <li>{@link #success()} - 该行数据成功写入</li>
 *   <li>{@link #fail(int, String)} - 该行处理失败（学生不存在、格式错误、插入异常等）</li>
 *   <li>{@link #skip(int, String)} - 该行被跳过（重复数据等非致命情况），计入警告</li>
 * </ul>
 */
@Getter
public class RowResultCollector {

    private int successCount;
    private int failCount;
    private int skipCount;
    private final List<String> errors = new ArrayList<>();
    private final List<String> warnings = new ArrayList<>();

    /** 该行成功写入 */
    public void success() {
        successCount++;
    }

    /** 该行处理失败 */
    public void fail(int rowNo, String message) {
        failCount++;
        errors.add(String.format("第%d行: %s", rowNo, message));
    }

    /** 该行被跳过（重复数据等），计入警告 */
    public void skip(int rowNo, String message) {
        skipCount++;
        warnings.add(String.format("第%d行: %s", rowNo, message));
    }
}
