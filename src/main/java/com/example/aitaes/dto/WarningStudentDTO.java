package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 预警学生列表项
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarningStudentDTO {

    private Long studentId;
    private String studentNo;
    private String name;
    private Long courseId;
    private String warningType;
    private String severity;
    private String warningMsg;
    private LocalDateTime createTime;
}
