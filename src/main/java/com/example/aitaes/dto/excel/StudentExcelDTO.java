package com.example.aitaes.dto.excel;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

/**
 * 学生信息 Excel DTO（EasyExcel 列映射）
 */
@Data
public class StudentExcelDTO {

    @ExcelProperty("学号")
    private String studentNo;

    @ExcelProperty("姓名")
    private String name;

    @ExcelProperty("性别")
    private String gender;

    @ExcelProperty("学院")
    private String college;

    @ExcelProperty("专业")
    private String major;

    @ExcelProperty("班级")
    private String className;

    @ExcelProperty("年级")
    private String grade;

    @ExcelProperty("邮箱")
    private String email;
}
