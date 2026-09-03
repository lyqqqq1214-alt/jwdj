package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 学生列表/详情返回对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentVO {

    private Long id;
    private Long studentId;
    private String studentNo;
    private String name;
    private String gender;
    private String college;
    private String major;
    private String className;
    private String grade;
    private String email;
    private Boolean isFocus;

    /** 已导入的数据类型标签 */
    private List<String> importedTypes;

    /** 加入时间 */
    private LocalDateTime createTime;
}
