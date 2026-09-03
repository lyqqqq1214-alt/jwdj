package com.example.aitaes.dto;

import com.example.aitaes.enums.ImportStatus;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * 导入结果 DTO
 */
@Data
public class ImportResultDTO {

    /** 单次返回的错误/警告明细上限 */
    private static final int MAX_MESSAGES = 100;

    /** 总行数（成功 + 失败 + 跳过） */
    private int totalRows;

    /** 成功行数 */
    private int successRows;

    /** 失败行数 */
    private int failRows;

    /** 跳过行数（重复数据等非致命情况） */
    private int skippedRows;

    /** 状态：SUCCESS / PARTIAL / FAILED */
    private String status;

    /** 错误信息列表（最多返回前 100 条） */
    private List<String> errors = new ArrayList<>();

    /** 警告信息列表（跳过原因等，最多返回前 100 条） */
    private List<String> warnings = new ArrayList<>();

    /**
     * 按统一规则构建导入结果：
     * <ul>
     *   <li>totalRows == 0 → FAILED（未解析到任何数据行）</li>
     *   <li>failRows == 0 → SUCCESS</li>
     *   <li>successRows == 0 → FAILED</li>
     *   <li>其余 → PARTIAL</li>
     * </ul>
     */
    public static ImportResultDTO of(int totalRows, int successRows, int failRows,
                                     int skippedRows, List<String> errors, List<String> warnings) {
        ImportResultDTO result = new ImportResultDTO();
        result.setTotalRows(totalRows);
        result.setSuccessRows(successRows);
        result.setFailRows(failRows);
        result.setSkippedRows(skippedRows);
        result.setErrors(truncate(errors));
        result.setWarnings(truncate(warnings));

        if (totalRows == 0) {
            result.setStatus(ImportStatus.FAILED.getCode());
            result.getErrors().add("未解析到任何数据行，请检查文件是否使用了正确的模板表头");
        } else if (failRows == 0) {
            result.setStatus(ImportStatus.SUCCESS.getCode());
        } else if (successRows == 0) {
            result.setStatus(ImportStatus.FAILED.getCode());
        } else {
            result.setStatus(ImportStatus.PARTIAL.getCode());
        }
        return result;
    }

    /** 构建整体失败结果（如无法确定课程、表头缺失等前置校验失败） */
    public static ImportResultDTO failed(String error) {
        ImportResultDTO result = new ImportResultDTO();
        result.setStatus(ImportStatus.FAILED.getCode());
        result.getErrors().add(error);
        return result;
    }

    private static List<String> truncate(List<String> messages) {
        if (messages == null) {
            return new ArrayList<>();
        }
        return new ArrayList<>(messages.size() > MAX_MESSAGES
                ? messages.subList(0, MAX_MESSAGES) : messages);
    }
}
