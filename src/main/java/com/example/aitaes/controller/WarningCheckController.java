package com.example.aitaes.controller;

import com.example.aitaes.common.Result;
import com.example.aitaes.service.WarningCheckService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * 预警检查控制器
 * <p>
 * 提供手动触发预警检查的API
 */
@Slf4j
@RestController
@RequestMapping("/api/warning")
@RequiredArgsConstructor
public class WarningCheckController {

    private final WarningCheckService warningCheckService;

    /**
     * 手动触发课程预警检查
     *
     * @param courseId 课程ID
     * @return 新增预警记录数
     */
    @PostMapping("/check/{courseId}")
    public Result<Integer> checkWarnings(@PathVariable Long courseId) {
        log.info("手动触发预警检查: courseId={}", courseId);
        int count = warningCheckService.checkAndGenerateWarnings(courseId);
        return Result.success("预警检查完成，新增" + count + "条预警记录", count);
    }

    /**
     * 手动触发单个学生的预警检查
     *
     * @param courseId  课程ID
     * @param studentId 学生ID
     * @return 操作结果
     */
    @PostMapping("/check/{courseId}/{studentId}")
    public Result<String> checkStudentWarnings(
            @PathVariable Long courseId,
            @PathVariable Long studentId) {
        log.info("手动触发学生预警检查: courseId={}, studentId={}", courseId, studentId);
        warningCheckService.checkStudentWarnings(courseId, studentId);
        return Result.success("学生预警检查完成", "ok");
    }
}
