package com.example.aitaes.strategy;

import com.alibaba.excel.support.ExcelTypeEnum;
import com.example.aitaes.dto.ImportResultDTO;
import com.example.aitaes.enums.ImportType;

import java.io.InputStream;

/**
 * 导入策略接口 - 每种导入数据类型对应一个实现
 */
public interface ImportStrategy {

    /** 本策略支持的导入类型 */
    ImportType getSupportedType();

    /** 执行导入，返回导入结果统计 */
    ImportResultDTO execute(InputStream inputStream, ImportContext context);

    /**
     * 根据文件名后缀推断 EasyExcel 格式类型
     * 解决用 InputStream 读取 CSV 时 EasyExcel 无法根据文件名自动推断格式的问题
     */
    default ExcelTypeEnum getExcelType(String filename) {
        if (filename == null) {
            return ExcelTypeEnum.XLSX;
        }
        String lower = filename.toLowerCase();
        if (lower.endsWith(".csv")) {
            return ExcelTypeEnum.CSV;
        }
        if (lower.endsWith(".xls")) {
            return ExcelTypeEnum.XLS;
        }
        return ExcelTypeEnum.XLSX;
    }
}
