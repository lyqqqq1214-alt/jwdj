package com.example.aitaes.dto.excel;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

/**
 * 知识点 Excel DTO
 * <p>
 * 模板字段：知识点名称, 章节, 父级知识点, 层级, 难度
 */
@Data
public class KnowledgePointExcelDTO {

    @ExcelProperty("知识点名称")
    private String kpName;

    @ExcelProperty("章节")
    private String kpCategory;

    @ExcelProperty("父级知识点")
    private String parentKpName;

    @ExcelProperty("层级")
    private Integer level;

    @ExcelProperty("难度")
    private String difficulty;

    @ExcelProperty("说明")
    private String description;
}
