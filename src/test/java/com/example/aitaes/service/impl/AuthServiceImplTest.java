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
import com.example.aitaes.util.PasswordUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * AuthService 单元测试
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService 单元测试")
class AuthServiceImplTest {

    @Mock
    private UserMapper userMapper;

    @Mock
    private TeacherMapper teacherMapper;

    @Mock
    private StudentMapper studentMapper;

    @InjectMocks
    private AuthServiceImpl authService;

    private User activeTeacherUser;
    private Teacher teacher;

    @BeforeEach
    void setUp() {
        activeTeacherUser = new User();
        activeTeacherUser.setId(1L);
        activeTeacherUser.setUsername("T001");
        activeTeacherUser.setPassword(PasswordUtil.encode("123456"));
        activeTeacherUser.setRole("TEACHER");
        activeTeacherUser.setStatus("ACTIVE");
        activeTeacherUser.setFirstLogin(0);

        teacher = new Teacher();
        teacher.setId(1L);
        teacher.setUserId(1L);
        teacher.setName("张建国");
    }

    // ===== 登录测试 =====

    @Nested
    @DisplayName("login — 用户登录")
    class Login {

        @Test
        @DisplayName("AUTH-01: 应成功登录并返回Token")
        void shouldLoginSuccessfully_WhenValidCredentials() {
            LoginRequestDTO request = new LoginRequestDTO();
            request.setUsername("T001");
            request.setPassword("123456");

            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(activeTeacherUser);
            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(teacher);

            LoginResponseDTO response = authService.login(request);

            assertNotNull(response.getToken());
            assertEquals(1L, response.getUserId());
            assertEquals("TEACHER", response.getRole());
            assertEquals("张建国", response.getDisplayName());
            assertFalse(response.getFirstLogin());

            verify(userMapper).updateById(any(User.class));
        }

        @Test
        @DisplayName("AUTH-02: 账号不存在时应抛出异常")
        void shouldThrowException_WhenUserNotFound() {
            LoginRequestDTO request = new LoginRequestDTO();
            request.setUsername("UNKNOWN");
            request.setPassword("123456");

            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> authService.login(request));
            assertEquals(ResultCode.UNAUTHORIZED.getCode(), ex.getCode());
        }

        @Test
        @DisplayName("AUTH-03: 密码错误时应抛出异常")
        void shouldThrowException_WhenWrongPassword() {
            LoginRequestDTO request = new LoginRequestDTO();
            request.setUsername("T001");
            request.setPassword("wrong_password");

            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(activeTeacherUser);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> authService.login(request));
            assertEquals(ResultCode.UNAUTHORIZED.getCode(), ex.getCode());
        }

        @Test
        @DisplayName("AUTH-04: 账号被禁用时应抛出异常")
        void shouldThrowException_WhenUserDisabled() {
            activeTeacherUser.setStatus("DISABLED");
            LoginRequestDTO request = new LoginRequestDTO();
            request.setUsername("T001");
            request.setPassword("123456");

            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(activeTeacherUser);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> authService.login(request));
            assertEquals(ResultCode.FORBIDDEN.getCode(), ex.getCode());
        }

        @Test
        @DisplayName("AUTH-05: 首次登录应返回 firstLogin=true")
        void shouldReturnFirstLoginTrue_WhenFirstLogin() {
            activeTeacherUser.setFirstLogin(1);
            LoginRequestDTO request = new LoginRequestDTO();
            request.setUsername("T001");
            request.setPassword("123456");

            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(activeTeacherUser);
            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(teacher);

            LoginResponseDTO response = authService.login(request);

            assertTrue(response.getFirstLogin());
        }
    }

    // ===== 修改密码测试 =====

    @Nested
    @DisplayName("changePassword — 修改密码")
    class ChangePassword {

        @Test
        @DisplayName("AUTH-06: 原密码正确时应成功修改")
        void shouldChangePasswordSuccessfully_WhenOldPasswordCorrect() {
            ChangePasswordDTO request = new ChangePasswordDTO();
            request.setOldPassword("123456");
            request.setNewPassword("new_password");

            when(userMapper.selectById(1L)).thenReturn(activeTeacherUser);

            assertDoesNotThrow(() -> authService.changePassword(1L, request));

            verify(userMapper).updateById(any(User.class));
        }

        @Test
        @DisplayName("AUTH-07: 原密码错误时应抛出异常")
        void shouldThrowException_WhenOldPasswordWrong() {
            ChangePasswordDTO request = new ChangePasswordDTO();
            request.setOldPassword("wrong_old");
            request.setNewPassword("new_password");

            when(userMapper.selectById(1L)).thenReturn(activeTeacherUser);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> authService.changePassword(1L, request));
            assertEquals(ResultCode.BAD_REQUEST.getCode(), ex.getCode());
            assertEquals("原密码错误", ex.getMessage());
        }

        @Test
        @DisplayName("AUTH-08: 用户不存在时应抛出异常")
        void shouldThrowException_WhenUserNotFound() {
            ChangePasswordDTO request = new ChangePasswordDTO();
            request.setOldPassword("123456");
            request.setNewPassword("new_password");

            when(userMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> authService.changePassword(999L, request));
            assertEquals(ResultCode.NOT_FOUND.getCode(), ex.getCode());
        }
    }
}
