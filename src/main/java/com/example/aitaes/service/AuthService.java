package com.example.aitaes.service;

import com.example.aitaes.dto.ChangePasswordDTO;
import com.example.aitaes.dto.LoginRequestDTO;
import com.example.aitaes.dto.LoginResponseDTO;

/**
 * 认证服务接口
 */
public interface AuthService {

    /**
     * 用户登录
     *
     * @param request 登录请求（账号 + 密码）
     * @return 登录响应（Token + 用户信息）
     */
    LoginResponseDTO login(LoginRequestDTO request);

    /**
     * 修改密码
     *
     * @param userId  当前用户 ID
     * @param request 新旧密码
     */
    void changePassword(Long userId, ChangePasswordDTO request);
}
