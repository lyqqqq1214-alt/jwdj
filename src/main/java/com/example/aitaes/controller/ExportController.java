package com.example.aitaes.controller;

import com.example.aitaes.annotation.RequireRole;
import com.example.aitaes.service.ExportService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

/**
 * Excel 导出控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
@RequireRole({"TEACHER", "ASSISTANT"})
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/course/{courseId}")
    public void exportCourse(@PathVariable Long courseId,
                              HttpServletResponse response) throws IOException {
        exportService.exportCourse(courseId, response);
    }

    @GetMapping("/teacher/{teacherId}")
    public void exportTeacher(@PathVariable Long teacherId,
                               HttpServletResponse response) throws IOException {
        exportService.exportTeacher(teacherId, response);
    }

    @GetMapping("/college")
    public void exportCollege(HttpServletResponse response) throws IOException {
        exportService.exportCollege(response);
    }

    @GetMapping("/semester/{semester}")
    public void exportSemester(@PathVariable String semester,
                                HttpServletResponse response) throws IOException {
        exportService.exportSemester(semester, response);
    }
}
