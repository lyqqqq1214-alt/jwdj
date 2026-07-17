package com.example.aitaes.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.common.Result;
import com.example.aitaes.dto.ImportResultDTO;
import com.example.aitaes.entity.DataImportLog;
import com.example.aitaes.service.DataImportService;
import com.example.aitaes.strategy.ImportContext;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * 数据导入控制器
 * <p>
 * 支持上传 Excel(.xlsx/.xls) 和 CSV 文件，按类型导入数据
 */
@Slf4j
@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
public class DataImportController {

    private final DataImportService dataImportService;

    /**
     * 上传文件并导入数据
     * <p>
     * 无论导入结果是全部成功/部分成功/全部失败，HTTP 层与业务码均返回 200，
     * 导入结果由 data.status / successRows / failRows / skippedRows / errors 表达，
     * 保证前端始终能拿到错误明细。
     */
    @PostMapping("/upload")
    public Result<ImportResultDTO> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("importType") String importType,
            @RequestParam(value = "sourceId", required = false) Long sourceId,
            @RequestParam(value = "courseId", required = false) Long courseId,
            @RequestParam(value = "assessmentName", required = false) String assessmentName,
            @RequestParam(value = "assessmentType", required = false) String assessmentType) {

        log.info("收到导入请求: 文件={}, 类型={}, 课程ID={}, 考核名称={}, 考核类型={}, 数据源ID={}",
                file.getOriginalFilename(), importType, courseId, assessmentName, assessmentType, sourceId);

        ImportContext context = ImportContext.builder()
                .sourceId(sourceId)
                .courseId(courseId)
                .assessmentName(assessmentName)
                .assessmentType(assessmentType)
                .build();

        ImportResultDTO result = dataImportService.importFile(file, importType, context);

        String message = switch (result.getStatus()) {
            case "SUCCESS" -> String.format("导入成功: 成功%d行, 跳过%d行",
                    result.getSuccessRows(), result.getSkippedRows());
            case "PARTIAL" -> String.format("部分导入成功: 成功%d行, 失败%d行, 跳过%d行",
                    result.getSuccessRows(), result.getFailRows(), result.getSkippedRows());
            default -> "导入失败";
        };
        return Result.success(message, result);
    }

    /**
     * 查询导入历史 (UC29)
     */
    @GetMapping("/history")
    public Result<IPage<DataImportLog>> history(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String importType) {
        return Result.success(dataImportService.getHistory(pageNum, pageSize, importType));
    }

    /**
     * 下载导入模板 (UC28)
     */
    @GetMapping("/template/{importType}")
    public void downloadTemplate(@PathVariable String importType,
                                  HttpServletResponse response) throws IOException {
        String fileName = importType.toUpperCase() + "_导入模板.xlsx";
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Content-Disposition",
                "attachment; filename=" + URLEncoder.encode(fileName, StandardCharsets.UTF_8));
        dataImportService.generateTemplate(importType, response.getOutputStream());
    }
}
