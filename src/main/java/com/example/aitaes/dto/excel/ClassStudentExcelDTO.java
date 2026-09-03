package com.example.aitaes.dto.excel;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

/**
 * 班级学生名单 Excel DTO（EasyExcel 列映射）
 * <p>
 * 用于 CLASS_STUDENT 导入类型，将学生关联到指定课程。
 * Excel 列对应 t_student 表字段。
 */
@Data
public class ClassStudentExcelDTO {

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
