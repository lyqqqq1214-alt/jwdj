package com.example.aitaes.aspect;

import com.example.aitaes.entity.OperationLog;
import com.example.aitaes.mapper.OperationLogMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * 操作日志 AOP 切面 — 异步记录操作日志
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class OperationLogAspect {

    private final OperationLogMapper operationLogMapper;

    @Around("@annotation(com.example.aitaes.annotation.OperationLog)")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        Object result = joinPoint.proceed();
        saveLogAsync();
        return result;
    }

    @Async
    public void saveLogAsync() {
        try {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) return;

            HttpServletRequest request = attributes.getRequest();
            Long userId = (Long) request.getAttribute("userId");
            String username = (String) request.getAttribute("username");

            OperationLog logEntity = new OperationLog();
            logEntity.setLogType("OPERATION");
            logEntity.setUserId(userId);
            logEntity.setUsername(username);
            logEntity.setAction(request.getMethod() + " " + request.getRequestURI());
            logEntity.setTargetType("API");
            logEntity.setIpAddress(getClientIp(request));
            operationLogMapper.insert(logEntity);
        } catch (Exception e) {
            log.warn("记录操作日志失败: {}", e.getMessage());
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
