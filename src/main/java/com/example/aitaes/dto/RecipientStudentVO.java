package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 通知收件人候选学生（课程下按行政班聚合用）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipientStudentVO {

    /** t_student.id（发送时回传用） */
    private Long studentId;

    /** 学号 */
    private String studentNo;

    /** 姓名 */
    private String name;

    /** 行政班名（t_course_student.class_name） */
    private String className;
}
