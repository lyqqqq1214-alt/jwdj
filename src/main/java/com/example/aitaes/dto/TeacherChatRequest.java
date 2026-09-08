package com.example.aitaes.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** 教师端 AI 助手请求。 */
@Data
public class TeacherChatRequest {
    @NotBlank(message = "问题不能为空")
    private String message;
}
