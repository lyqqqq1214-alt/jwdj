package com.example.aitaes.dto;

import lombok.Data;

import java.util.List;

/**
 * 发送通知请求体
 * <p>
 * recipientScope：ALL / TEACHERS / COURSE / STUDENTS
 * courseId：COURSE 范围使用
 * classNames：COURSE 范围可选，按行政班名（t_course_student.class_name）过滤，空=全部班级
 * studentIds：COURSE 范围可选，按 t_student.id 过滤，空=全部学生；STUDENTS 范围为 t_user.id（原语义）
 */
@Data
public class NotificationSendDTO {

    private String title;

    private String content;

    /** ALL / TEACHERS / COURSE / STUDENTS */
    private String recipientScope;

    /** COURSE 范围使用 */
    private Long courseId;

    /** COURSE 范围可选：班级过滤 */
    private List<String> classNames;

    /** COURSE 范围可选：学生过滤（t_student.id）；STUDENTS 范围：t_user.id */
    private List<Long> studentIds;
}
