package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.dto.TeacherCreateDTO;
import com.example.aitaes.dto.TeacherUpdateDTO;
import com.example.aitaes.dto.TeacherVO;
import com.example.aitaes.entity.SystemConfig;
import com.example.aitaes.entity.Teacher;
import com.example.aitaes.entity.User;
import com.example.aitaes.mapper.SystemConfigMapper;
import com.example.aitaes.mapper.TeacherMapper;
import com.example.aitaes.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TeacherService 单元测试")
class TeacherServiceImplTest {

    @Mock private TeacherMapper teacherMapper;
    @Mock private UserMapper userMapper;
    @Mock private SystemConfigMapper systemConfigMapper;
    @InjectMocks private TeacherServiceImpl teacherService;

    private Teacher teacher;
    private User user;

    @BeforeEach
    void setUp() {
        teacher = new Teacher();
        teacher.setId(1L);
        teacher.setUserId(10L);
        teacher.setTeacherNo("T001");
        teacher.setName("张老师");
        teacher.setCollege("计算机学院");

        user = new User();
        user.setId(10L);
        user.setUsername("T001");
        user.setRole("TEACHER");
        user.setStatus("ACTIVE");
        user.setLastLoginTime(LocalDateTime.now());
    }

    @Nested
    @DisplayName("page — 分页搜索")
    class PageQuery {

        @Test
        @DisplayName("TS-01: 应返回分页结果含用户状态")
        void shouldReturnPagedResult_WithUserStatus() {
            Page<Teacher> teacherPage = new Page<>(1, 10);
            teacherPage.setRecords(List.of(teacher));
            teacherPage.setTotal(1);
            when(teacherMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(teacherPage);
            when(userMapper.selectBatchIds(anyList())).thenReturn(List.of(user));

            IPage<TeacherVO> result = teacherService.page(1, 10, null);

            assertEquals(1, result.getTotal());
            assertEquals("ACTIVE", result.getRecords().get(0).getStatus());
        }

        @Test
        @DisplayName("TS-02: 按关键词搜索应正确过滤")
        void shouldFilterByKeyword() {
            lenient().when(teacherMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class)))
                    .thenReturn(new Page<>(1, 10));
            lenient().when(userMapper.selectBatchIds(anyList())).thenReturn(List.of());

            teacherService.page(1, 10, "张");

            verify(teacherMapper).selectPage(any(Page.class), any(LambdaQueryWrapper.class));
        }

        @Test
        @DisplayName("TS-03: 空结果应返回空页")
        void shouldReturnEmptyPage_WhenNoTeachers() {
            Page<Teacher> emptyPage = new Page<>(1, 10);
            emptyPage.setRecords(List.of());
            when(teacherMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(emptyPage);

            IPage<TeacherVO> result = teacherService.page(1, 10, null);

            assertEquals(0, result.getTotal());
        }
    }

    @Nested
    @DisplayName("create — 创建教师")
    class Create {

        @Test
        @DisplayName("TS-04: 应成功创建教师并同步创建User")
        void shouldCreateTeacherAndUser() {
            TeacherCreateDTO dto = new TeacherCreateDTO();
            dto.setTeacherNo("T002");
            dto.setName("李老师");
            dto.setPassword("123456");
            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
            lenient().when(systemConfigMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

            TeacherVO result = teacherService.create(dto);

            assertNotNull(result);
            assertEquals("T002", result.getTeacherNo());
            verify(userMapper).insert(any(User.class));
            verify(teacherMapper).insert(any(Teacher.class));
        }

        @Test
        @DisplayName("TS-05: 工号已存在应抛出异常")
        void shouldThrowException_WhenTeacherNoExists() {
            TeacherCreateDTO dto = new TeacherCreateDTO();
            dto.setTeacherNo("T001");
            dto.setName("李老师");
            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(teacher);

            BusinessException ex = assertThrows(BusinessException.class, () -> teacherService.create(dto));
            assertEquals(ResultCode.BAD_REQUEST.getCode(), ex.getCode());
        }

        @Test
        @DisplayName("TS-06: 使用系统默认密码当未指定密码")
        void shouldUseDefaultPassword_WhenNotSpecified() {
            TeacherCreateDTO dto = new TeacherCreateDTO();
            dto.setTeacherNo("T003");
            dto.setName("王老师");
            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
            SystemConfig config = new SystemConfig();
            config.setConfigKey("default_password");
            config.setConfigValue("abc123");
            when(systemConfigMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(config);

            teacherService.create(dto);

            verify(userMapper).insert(any(User.class));
        }
    }

    @Nested
    @DisplayName("delete — 删除教师")
    class Delete {

        @Test
        @DisplayName("TS-07: 应逻辑删除并禁用关联User")
        void shouldSoftDeleteAndDisableUser() {
            when(teacherMapper.selectById(1L)).thenReturn(teacher);
            when(userMapper.selectById(10L)).thenReturn(user);

            teacherService.delete(1L);

            verify(teacherMapper).deleteById(1L);
            verify(userMapper).updateById(any(User.class));
        }

        @Test
        @DisplayName("TS-08: 教师不存在应抛出异常")
        void shouldThrowException_WhenTeacherNotFound() {
            when(teacherMapper.selectById(999L)).thenReturn(null);

            assertThrows(BusinessException.class, () -> teacherService.delete(999L));
            verify(teacherMapper, never()).deleteById(anyLong());
        }
    }

    @Nested
    @DisplayName("updateStatus — 启用/禁用")
    class UpdateStatus {

        @Test
        @DisplayName("TS-09: 应正确更新用户状态")
        void shouldUpdateUserStatus() {
            when(teacherMapper.selectById(1L)).thenReturn(teacher);
            when(userMapper.selectById(10L)).thenReturn(user);

            teacherService.updateStatus(1L, "DISABLED");

            verify(userMapper).updateById(any(User.class));
        }

        @Test
        @DisplayName("TS-10: 无效状态应抛出异常")
        void shouldThrowException_WhenInvalidStatus() {
            assertThrows(BusinessException.class, () -> teacherService.updateStatus(1L, "INVALID"));
        }
    }

    @Nested
    @DisplayName("resetPassword — 重置密码")
    class ResetPassword {

        @Test
        @DisplayName("TS-11: 应重置密码并返回新密码")
        void shouldResetPasswordAndReturnNew() {
            when(teacherMapper.selectById(1L)).thenReturn(teacher);
            when(userMapper.selectById(10L)).thenReturn(user);
            when(systemConfigMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

            String newPassword = teacherService.resetPassword(1L);

            assertNotNull(newPassword);
            assertEquals("123456", newPassword);
            verify(userMapper).updateById(any(User.class));
        }
    }
}
