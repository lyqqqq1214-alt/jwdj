package com.example.aitaes.interceptor;

import com.example.aitaes.annotation.RequireRole;
import com.example.aitaes.common.Result;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.util.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Arrays;
import java.util.List;

/**
 * JWT 认证拦截器
 * <p>
 * 从 Authorization header 提取 Bearer Token，验证并解析用户信息注入 request attribute。
 * 支持 {@link RequireRole} 注解进行角色校验。
 */
@Slf4j
@Component
public class AuthInterceptor implements HandlerInterceptor {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) throws Exception {
        // 放行非 Controller 方法
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }

        // OPTIONS 预检请求直接放行
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        // 提取 Token
        String token = extractToken(request);
        if (token == null || !JwtUtil.validateToken(token)) {
            sendUnauthorized(response, "请先登录");
            return false;
        }

        // 解析用户信息
        Long userId = JwtUtil.getUserId(token);
        String username = JwtUtil.getUsername(token);
        String role = JwtUtil.getRole(token);

        // 角色校验（优先方法级别，其次类级别）
        HandlerMethod handlerMethod = (HandlerMethod) handler;
        RequireRole requireRole = handlerMethod.getMethodAnnotation(RequireRole.class);
        if (requireRole == null) {
            requireRole = handlerMethod.getBeanType().getAnnotation(RequireRole.class);
        }
        if (requireRole != null && requireRole.value().length > 0) {
            List<String> allowedRoles = Arrays.asList(requireRole.value());
            if (!allowedRoles.contains(role)) {
                sendForbidden(response, "无访问权限，需要角色: " + String.join(", ", allowedRoles));
                return false;
            }
        }

        // 注入 request attribute 供 Controller 使用
        request.setAttribute("userId", userId);
        request.setAttribute("username", username);
        request.setAttribute("role", role);

        return true;
    }

    /**
     * 从 Authorization header 提取 Bearer Token
     */
    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws Exception {
        response.setStatus(200); // 业务层 401，HTTP 仍返回 200
        response.setContentType("application/json;charset=UTF-8");
        Result<Void> result = Result.error(ResultCode.UNAUTHORIZED.getCode(), message);
        response.getWriter().write(OBJECT_MAPPER.writeValueAsString(result));
    }

    private void sendForbidden(HttpServletResponse response, String message) throws Exception {
        response.setStatus(200);
        response.setContentType("application/json;charset=UTF-8");
        Result<Void> result = Result.error(ResultCode.FORBIDDEN.getCode(), message);
        response.getWriter().write(OBJECT_MAPPER.writeValueAsString(result));
    }
}
