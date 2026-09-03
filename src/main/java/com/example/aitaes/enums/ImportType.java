package com.example.aitaes.enums;

import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import lombok.Getter;

/**
 * 导入数据类型枚举
 */
@Getter
public enum ImportType {

    TEACHER("TEACHER", "教师信息"),
    STUDENT("STUDENT", "学生信息"),
    COURSE("COURSE", "课程信息"),
    // ==== v3.0 新增导入类型 ====
    HOMEWORK("HOMEWORK", "作业成绩"),
    QUIZ("QUIZ", "测验成绩"),
    ATTENDANCE("ATTENDANCE", "考勤记录"),
    EXPERIMENT("EXPERIMENT", "实验报告"),
    EXAM_SCORE("EXAM_SCORE", "考试成绩"),
    KNOWLEDGE_POINT("KNOWLEDGE_POINT", "知识点"),
    CLASS_STUDENT("CLASS_STUDENT", "班级学生名单");

    private final String code;
    private final String description;

    ImportType(String code, String description) {
        this.code = code;
        this.description = description;
    }

    /**
     * 根据编码查找导入类型，不区分大小写
     */
    public static ImportType fromCode(String code) {
        for (ImportType type : values()) {
            if (type.code.equalsIgnoreCase(code)) {
                return type;
            }
        }
        throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "不支持的导入类型: " + code);
    }
}
