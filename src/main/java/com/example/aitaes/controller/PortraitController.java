package com.example.aitaes.controller;

import com.example.aitaes.annotation.RequireRole;
import com.example.aitaes.common.Result;
import com.example.aitaes.dto.StudentProfileVO;
import com.example.aitaes.service.PortraitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 学生画像控制器（教师/助教）
 */
@Slf4j
@RestController
@RequestMapping("/api/portrait")
@RequiredArgsConstructor
@RequireRole({"TEACHER", "ASSISTANT"})
public class PortraitController {

    private final PortraitService portraitService;

    /**
     * 学生完整画像
     */
    @GetMapping("/student/{studentId}")
    public Result<StudentProfileVO> getProfile(@PathVariable Long studentId,
                                                @RequestParam Long courseId) {
        return Result.success(portraitService.getProfile(studentId, courseId));
    }

    /**
     * 标记/取消重点关注学生 (UC08)
     */
    @PutMapping("/student/{studentId}/focus")
    public Result<Void> toggleFocus(@PathVariable Long studentId,
                                     @RequestParam Long courseId,
                                     @RequestBody Map<String, Boolean> body) {
        boolean focus = body.getOrDefault("focus", false);
        portraitService.toggleFocus(studentId, courseId, focus);
        return Result.success(focus ? "已标记为重点关注" : "已取消重点关注", null);
    }

    /**
     * 生成AI学情综合评价
     */
    @PostMapping("/student/{studentId}/ai-evaluation")
    public Result<String> generateAiEvaluation(@PathVariable Long studentId,
                                                @RequestParam Long courseId) {
        return Result.success("AI评价生成成功",
                portraitService.generateAiEvaluation(studentId, courseId));
    }
}
