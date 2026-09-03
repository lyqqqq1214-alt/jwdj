package com.example.aitaes.common;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

/**
 * 全局异常处理器
 * 统一将各类异常转换为 Result 响应，保证前端接收一致的 JSON 格式
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** 业务异常 */
    @ExceptionHandler(BusinessException.class)
    public Result<?> handleBusinessException(BusinessException e) {
        log.warn("业务异常: code={}, message={}", e.getCode(), e.getMessage());
        return Result.error(e.getCode(), e.getMessage());
    }

    /** 参数校验异常 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<?> handleValidationException(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("参数校验失败");
        log.warn("参数校验异常: {}", msg);
        return Result.error(ResultCode.BAD_REQUEST.getCode(), msg);
    }

    /** 文件大小超限异常 */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public Result<?> handleFileSizeException(MaxUploadSizeExceededException e) {
        log.warn("文件大小超限: {}", e.getMessage());
        return Result.error(ResultCode.BAD_REQUEST.getCode(), "上传文件大小超出限制（最大10MB）");
    }

    /** 缺少请求参数异常 */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public Result<?> handleMissingParamException(MissingServletRequestParameterException e) {
        log.warn("缺少请求参数: {}", e.getParameterName());
        return Result.error(ResultCode.BAD_REQUEST.getCode(),
                "缺少必填参数: " + e.getParameterName());
    }

    /** 缺少上传文件异常（multipart 请求中缺少 file 字段） */
    @ExceptionHandler(MissingServletRequestPartException.class)
    public Result<?> handleMissingServletRequestPartException(MissingServletRequestPartException e) {
        log.warn("缺少上传文件: {}", e.getRequestPartName());
        return Result.error(ResultCode.BAD_REQUEST.getCode(), "上传文件不能为空");
    }

    /** 非 multipart 请求异常（请求未包含文件时） */
    @ExceptionHandler(MultipartException.class)
    public Result<?> handleMultipartException(MultipartException e) {
        log.warn("文件上传异常: {}", e.getMessage());
        return Result.error(ResultCode.BAD_REQUEST.getCode(), "上传文件不能为空");
    }

    /** 兜底异常 */
    @ExceptionHandler(Exception.class)
    public Result<?> handleGenericException(Exception e) {
        log.error("未预期的异常", e);
        return Result.error(ResultCode.INTERNAL_ERROR);
    }
}
