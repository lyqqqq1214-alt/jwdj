package com.example.aitaes.dto.excel;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

/**
 * 考核成绩导入 Excel DTO
 * <p>
 * 对应模板格式（列序与导入解析约定一致）：序号, 学号, 姓名,
 * 第1题得分, 扣分主要知识点, ..., 第N题得分, 扣分主要知识点, 总成绩, 最薄弱知识点
 * <p>
 * 注意：该 DTO 仅用于生成下载模板（表头），实际导入解析在
 * {@link com.example.aitaes.strategy.AbstractAssessmentImportStrategy} 中按表头列名动态定位，
 * 对列顺序鲁棒。字段通过 index 显式固定模板列序。
 */
@Data
public class AssessmentRecordExcelDTO {

    @ExcelProperty(value = "序号", index = 0)
    private Integer seq;

    @ExcelProperty(value = "学号", index = 1)
    private String studentNo;

    @ExcelProperty(value = "姓名", index = 2)
    private String name;

    @ExcelProperty(value = "第1题得分", index = 3)
    private String q1Score;

    @ExcelProperty(value = "扣分主要知识点", index = 4)
    private String q1DeductionKp;

    @ExcelProperty(value = "第2题得分", index = 5)
    private String q2Score;

    @ExcelProperty(value = "扣分主要知识点", index = 6)
    private String q2DeductionKp;

    @ExcelProperty(value = "第3题得分", index = 7)
    private String q3Score;

    @ExcelProperty(value = "扣分主要知识点", index = 8)
    private String q3DeductionKp;

    @ExcelProperty(value = "第4题得分", index = 9)
    private String q4Score;

    @ExcelProperty(value = "扣分主要知识点", index = 10)
    private String q4DeductionKp;

    @ExcelProperty(value = "第5题得分", index = 11)
    private String q5Score;

    @ExcelProperty(value = "扣分主要知识点", index = 12)
    private String q5DeductionKp;

    /** 总成绩 */
    @ExcelProperty(value = "总成绩", index = 13)
    private String totalScore;

    /** 最薄弱知识点 */
    @ExcelProperty(value = "最薄弱知识点", index = 14)
    private String weakestKp;
}
