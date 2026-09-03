package com.example.aitaes.dto.excel;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

/**
 * 教师信息 Excel DTO（EasyExcel 列映射）
 */
@Data
public class TeacherExcelDTO {

    @ExcelProperty("工号")
    private String teacherNo;

    @ExcelProperty("姓名")
    private String name;

    @ExcelProperty("性别")
    private String gender;

    @ExcelProperty("学院")
    private String college;

    @ExcelProperty("系/部门")
    private String department;

    @ExcelProperty("职称")
    private String title;

    @ExcelProperty("邮箱")
    private String email;

    @ExcelProperty("联系电话")
    private String phone;
}
