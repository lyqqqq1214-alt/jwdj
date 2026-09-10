package com.example.aitaes.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AdminUserVO {
    private Long id;
    private String username;
    private String name;
    private String role;
    private String status;
    private String college;
    private String major;
    private String className;
    private String grade;
    private LocalDateTime createTime;
    private LocalDateTime lastLoginTime;
}
