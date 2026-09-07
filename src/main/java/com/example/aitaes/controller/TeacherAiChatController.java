package com.example.aitaes.controller;

import com.example.aitaes.annotation.RequireRole;
import com.example.aitaes.common.Result;
import com.example.aitaes.dto.TeacherChatRequest;
import com.example.aitaes.dto.TeacherChatResponse;
import com.example.aitaes.service.OllamaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 教师端基础 AI 问答接口。学生端不暴露该接口。 */
@RestController
@RequestMapping("/api/teacher/ai-chat")
@RequiredArgsConstructor
@RequireRole("TEACHER")
public class TeacherAiChatController {
    private final OllamaService ollamaService;

    @PostMapping
    public Result<TeacherChatResponse> chat(@Valid @RequestBody TeacherChatRequest request) {
        String prompt = """
                你是高校教师的教学助手。请用中文简洁、专业地回答教师问题。
                不要编造系统中不存在的学生姓名、成绩或统计数据；当问题需要具体数据时，说明应先在教学分析页面查看对应课程数据。
                教师问题：%s
                """.formatted(request.getMessage().trim());
        return Result.success(new TeacherChatResponse(ollamaService.generate(prompt)));
    }
}
