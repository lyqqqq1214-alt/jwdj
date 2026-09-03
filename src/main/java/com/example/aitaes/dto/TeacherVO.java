package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 教师列表/详情返回对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherVO {

    private Long id;
    private Long userId;
    private String teacherNo;
    private String name;
    private String gender;
    private String college;
    private String department;
    private String title;
    private String email;
    private String phone;

    /** t_user 账号 */
    private String username;

    /** t_user 状态：ACTIVE / DISABLED */
    private String status;

    /** 最近登录时间 */
    private LocalDateTime lastLoginTime;

    /** 创建时间 */
    private LocalDateTime createTime;
}
