package com.example.aitaes.dto.excel;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

/**
 * 实验报告 Excel DTO
 * <p>
 * 模板字段：学号, 姓名, 实验名称, 分数, 提交时间
 */
@Data
public class ExperimentExcelDTO {

    @ExcelProperty("学号")
    private String studentNo;

    @ExcelProperty("姓名")
    private String name;

    @ExcelProperty("实验名称")
    private String experimentName;

    @ExcelProperty("实验次数")
    private Integer experimentNo;

    @ExcelProperty("分数")
    private String score;

    @ExcelProperty("提交时间")
    private String submitTime;

    @ExcelProperty("备注")
    private String remark;
}
