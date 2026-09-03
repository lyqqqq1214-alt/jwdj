package com.example.aitaes.dto.excel;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 课程信息 Excel DTO（EasyExcel 列映射）
 * 注：teacherNo 在导入策略中解析为 teacherId
 */
@Data
public class CourseExcelDTO {

    @ExcelProperty("课程编号")
    private String courseNo;

    @ExcelProperty("课程名称")
    private String courseName;

    @ExcelProperty("授课教师工号")
    private String teacherNo;

    @ExcelProperty("学分")
    private BigDecimal credit;

    @ExcelProperty("课程类型")
    private String courseType;

    @ExcelProperty("学期")
    private String semester;

    @ExcelProperty("课程描述")
    private String description;
}
