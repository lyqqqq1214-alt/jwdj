package com.example.aitaes.service.impl;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.dto.ImportResultDTO;
import com.example.aitaes.dto.excel.*;
import com.example.aitaes.entity.DataImportLog;
import com.example.aitaes.enums.ImportType;
import com.example.aitaes.mapper.DataImportLogMapper;
import com.example.aitaes.service.DataImportService;
import com.example.aitaes.strategy.ImportContext;
import com.example.aitaes.strategy.ImportStrategy;
import com.example.aitaes.strategy.ImportStrategyFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * 数据导入服务实现
 * <p>
 * 职责：文件验证 → 类型路由 → 策略执行 → 日志记录
 * 每批次独立提交（不加 @Transactional），实现行级容错
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DataImportServiceImpl implements DataImportService {

    private final ImportStrategyFactory strategyFactory;
    private final DataImportLogMapper dataImportLogMapper;

    /** 支持的导入文件扩展名 */
    private static final List<String> SUPPORTED_EXTENSIONS =
            List.of(".xlsx", ".xls", ".csv");

    /** 导入类型 → 模板 DTO 类映射 */
    private static final Map<String, Class<?>> TEMPLATE_CLASS_MAP = Map.ofEntries(
            Map.entry("TEACHER", TeacherExcelDTO.class),
            Map.entry("STUDENT", StudentExcelDTO.class),
            Map.entry("COURSE", CourseExcelDTO.class),
            Map.entry("CLASS_STUDENT", ClassStudentExcelDTO.class),
            Map.entry("HOMEWORK", AssessmentRecordExcelDTO.class),
            Map.entry("QUIZ", AssessmentRecordExcelDTO.class),
            Map.entry("ATTENDANCE", AttendanceExcelDTO.class),
            Map.entry("EXPERIMENT", ExperimentExcelDTO.class),
            Map.entry("EXAM_SCORE", AssessmentRecordExcelDTO.class),
            Map.entry("KNOWLEDGE_POINT", KnowledgePointExcelDTO.class)
    );

    @Override
    public ImportResultDTO importFile(MultipartFile file, String importType, ImportContext context) {
        // 1. 文件校验
        validateFile(file);

        // 2. 解析导入类型
        ImportType type = ImportType.fromCode(importType.toUpperCase());

        // 3. 获取策略，补全导入上下文
        ImportStrategy strategy = strategyFactory.getStrategy(type);
        if (context == null) {
            context = new ImportContext();
        }
        context.setImportType(type);
        context.setOriginalFilename(file.getOriginalFilename());

        // 4. 执行导入
        ImportResultDTO result;
        try (InputStream inputStream = file.getInputStream()) {
            log.info("开始导入 {}: 文件={}, 类型={}, courseId={}", type.getDescription(),
                    file.getOriginalFilename(), type.getCode(), context.getCourseId());
            result = strategy.execute(inputStream, context);
            log.info("导入完成 {}: 总{}行, 成功{}行, 失败{}行, 跳过{}行",
                    type.getDescription(), result.getTotalRows(),
                    result.getSuccessRows(), result.getFailRows(), result.getSkippedRows());
        } catch (IOException e) {
            log.error("文件读取失败: {}", e.getMessage());
            throw new BusinessException("文件读取失败: " + e.getMessage());
        }

        // 5. 记录导入日志
        saveImportLog(file.getOriginalFilename(), type.getCode(), context.getSourceId(), result);

        return result;
    }

    @Override
    public IPage<DataImportLog> getHistory(int pageNum, int pageSize, String importType) {
        LambdaQueryWrapper<DataImportLog> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(importType)) {
            wrapper.eq(DataImportLog::getImportType, importType.toUpperCase());
        }
        wrapper.orderByDesc(DataImportLog::getImportTime);
        return dataImportLogMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public void generateTemplate(String importType, OutputStream outputStream) {
        Class<?> dtoClass = TEMPLATE_CLASS_MAP.get(importType.toUpperCase());
        if (dtoClass == null) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(),
                    "不支持的模板类型: " + importType);
        }
        EasyExcel.write(outputStream, dtoClass)
                .sheet("Sheet1")
                .doWrite(Collections.emptyList());
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "上传文件不能为空");
        }
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "文件名不能为空");
        }
        String lower = filename.toLowerCase();
        boolean supported = SUPPORTED_EXTENSIONS.stream().anyMatch(lower::endsWith);
        if (!supported) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(),
                    "不支持的文件格式，仅支持: .xlsx, .xls, .csv");
        }
    }

    private void saveImportLog(String fileName, String importType, Long sourceId,
                                ImportResultDTO result) {
        try {
            DataImportLog logEntity = new DataImportLog();
            logEntity.setSourceId(sourceId);
            logEntity.setFileName(fileName);
            logEntity.setImportType(importType);
            logEntity.setTotalRows(result.getTotalRows());
            logEntity.setSuccessRows(result.getSuccessRows());
            logEntity.setFailRows(result.getFailRows());
            logEntity.setStatus(result.getStatus());
            logEntity.setImportTime(LocalDateTime.now());

            // 错误信息截断
            if (result.getErrors() != null && !result.getErrors().isEmpty()) {
                String errorJson = result.getErrors().stream()
                        .limit(200)
                        .reduce((a, b) -> a + "\n" + b)
                        .orElse("");
                if (errorJson.length() > 60000) {
                    errorJson = errorJson.substring(0, 60000) + "\n...[已截断]";
                }
                logEntity.setErrorMsg(errorJson);
            }
            dataImportLogMapper.insert(logEntity);
        } catch (Exception e) {
            // 日志记录失败不影响导入结果
            log.warn("记录导入日志失败: {}", e.getMessage());
        }
    }
}
