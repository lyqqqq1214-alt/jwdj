package com.example.aitaes.controller;

import com.example.aitaes.common.Result;
import com.example.aitaes.dto.ChangePasswordDTO;
import com.example.aitaes.dto.LoginRequestDTO;
import com.example.aitaes.dto.LoginResponseDTO;
import com.example.aitaes.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器 — 登录 / 登出 / 修改密码
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public Result<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        log.info("登录请求: username={}", request.getUsername());
        LoginResponseDTO response = authService.login(request);
        return Result.success("登录成功", response);
    }

    /**
     * 用户登出（前端清除 Token 即可，后端仅记录日志）
     */
    @PostMapping("/logout")
    public Result<Void> logout() {
        return Result.success();
    }

    /**
     * 修改密码（需登录）
     */
    @PutMapping("/change-password")
    public Result<Void> changePassword(@RequestAttribute("userId") Long userId,
                                       @Valid @RequestBody ChangePasswordDTO request) {
        authService.changePassword(userId, request);
        return Result.success("密码修改成功", null);
    }
}
