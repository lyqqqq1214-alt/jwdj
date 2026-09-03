package com.example.aitaes.dto.excel;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

/**
 * 考勤记录 Excel DTO
 * <p>
 * 模板字段：学号, 姓名, 日期, 状态, 节次, 第几周
 */
@Data
public class AttendanceExcelDTO {

    @ExcelProperty("学号")
    private String studentNo;

    @ExcelProperty("姓名")
    private String name;

    @ExcelProperty("日期")
    private String attendanceDate;

    @ExcelProperty("状态")
    private String status;

    @ExcelProperty("节次")
    private String period;

    @ExcelProperty("第几周")
    private Integer weekNo;

    @ExcelProperty("备注")
    private String remark;
}
