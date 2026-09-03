package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.dto.ChangePasswordDTO;
import com.example.aitaes.dto.LoginRequestDTO;
import com.example.aitaes.dto.LoginResponseDTO;
import com.example.aitaes.entity.Student;
import com.example.aitaes.entity.Teacher;
import com.example.aitaes.entity.User;
import com.example.aitaes.mapper.StudentMapper;
import com.example.aitaes.mapper.TeacherMapper;
import com.example.aitaes.mapper.UserMapper;
import com.example.aitaes.service.AuthService;
import com.example.aitaes.util.JwtUtil;
import com.example.aitaes.util.PasswordUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 认证服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final TeacherMapper teacherMapper;
    private final StudentMapper studentMapper;

    @Override
    public LoginResponseDTO login(LoginRequestDTO request) {
        // 1. 查用户
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, request.getUsername()));
        if (user == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED.getCode(), "账号或密码错误");
        }

        // 2. 校验密码
        if (!PasswordUtil.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(ResultCode.UNAUTHORIZED.getCode(), "账号或密码错误");
        }

        // 3. 检查账号状态
        if ("DISABLED".equals(user.getStatus())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "账号已被禁用，请联系管理员");
        }

        // 4. 生成 JWT
        String token = JwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());

        // 5. 更新最近登录时间
        user.setLastLoginTime(LocalDateTime.now());
        userMapper.updateById(user);

        // 6. 查询真实姓名
        String displayName = resolveDisplayName(user);

        log.info("用户登录成功: userId={}, role={}", user.getId(), user.getRole());

        return LoginResponseDTO.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .firstLogin(user.getFirstLogin() != null && user.getFirstLogin() == 1)
                .displayName(displayName)
                .build();
    }

    @Override
    public void changePassword(Long userId, ChangePasswordDTO request) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "用户不存在");
        }

        // 校验原密码
        if (!PasswordUtil.matches(request.getOldPassword(), user.getPassword())) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "原密码错误");
        }

        // 更新密码
        user.setPassword(PasswordUtil.encode(request.getNewPassword()));
        user.setFirstLogin(0); // 清除首次登录标记
        userMapper.updateById(user);

        log.info("用户修改密码成功: userId={}", userId);
    }

    /**
     * 根据用户角色查询真实姓名
     */
    private String resolveDisplayName(User user) {
        try {
            switch (user.getRole()) {
                case "ADMIN":
                    return "系统管理员";
                case "TEACHER": {
                    Teacher teacher = teacherMapper.selectOne(
                            new LambdaQueryWrapper<Teacher>().eq(Teacher::getUserId, user.getId()));
                    return teacher != null ? teacher.getName() : user.getUsername();
                }
                case "STUDENT": {
                    Student student = studentMapper.selectOne(
                            new LambdaQueryWrapper<Student>().eq(Student::getUserId, user.getId()));
                    return student != null ? student.getName() : user.getUsername();
                }
                case "ASSISTANT":
                    return user.getUsername(); // 助教暂无独立表
                default:
                    return user.getUsername();
            }
        } catch (Exception e) {
            log.warn("查询显示名称失败: userId={}", user.getId(), e);
            return user.getUsername();
        }
    }
}
