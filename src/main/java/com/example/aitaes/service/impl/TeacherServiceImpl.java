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
import com.example.aitaes.service.TeacherService;
import com.example.aitaes.util.PasswordUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 教师账号管理服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TeacherServiceImpl implements TeacherService {

    private static final String DEFAULT_PASSWORD_KEY = "default_password";
    private static final String DEFAULT_PASSWORD = "123456";

    private final TeacherMapper teacherMapper;
    private final UserMapper userMapper;
    private final SystemConfigMapper systemConfigMapper;

    @Override
    public IPage<TeacherVO> page(int pageNum, int pageSize, String keyword) {
        // 1. 查询教师分页
        LambdaQueryWrapper<Teacher> teacherWrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            teacherWrapper.and(w -> w
                    .like(Teacher::getName, keyword)
                    .or()
                    .like(Teacher::getTeacherNo, keyword));
        }
        teacherWrapper.orderByDesc(Teacher::getCreateTime);

        Page<Teacher> teacherPage = new Page<>(pageNum, pageSize);
        IPage<Teacher> teacherResult = teacherMapper.selectPage(teacherPage, teacherWrapper);

        // 2. 批量查询关联 User
        List<Long> userIds = teacherResult.getRecords().stream()
                .map(Teacher::getUserId)
                .collect(Collectors.toList());
        final Map<Long, User> userMap;
        if (!userIds.isEmpty()) {
            List<User> users = userMapper.selectBatchIds(userIds);
            userMap = users.stream().collect(Collectors.toMap(User::getId, u -> u));
        } else {
            userMap = Collections.emptyMap();
        }

        // 3. 组装 VO
        final Map<Long, User> finalUserMap = userMap;
        List<TeacherVO> voList = teacherResult.getRecords().stream()
                .map(t -> toVO(t, finalUserMap.get(t.getUserId())))
                .collect(Collectors.toList());

        Page<TeacherVO> voPage = new Page<>(pageNum, pageSize, teacherResult.getTotal());
        voPage.setRecords(voList);
        return voPage;
    }

    @Override
    public TeacherVO getById(Long id) {
        Teacher teacher = teacherMapper.selectById(id);
        if (teacher == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "教师不存在");
        }
        User user = userMapper.selectById(teacher.getUserId());
        return toVO(teacher, user);
    }

    @Override
    @Transactional
    public TeacherVO create(TeacherCreateDTO dto) {
        // 检查工号唯一性
        Teacher existing = teacherMapper.selectOne(
                new LambdaQueryWrapper<Teacher>().eq(Teacher::getTeacherNo, dto.getTeacherNo()));
        if (existing != null) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "工号已存在: " + dto.getTeacherNo());
        }

        // 1. 创建 User
        User user = new User();
        user.setUsername(dto.getTeacherNo()); // 账号默认与工号相同
        user.setPassword(PasswordUtil.encode(
                StringUtils.hasText(dto.getPassword()) ? dto.getPassword() : getDefaultPassword()));
        user.setRole("TEACHER");
        user.setStatus("ACTIVE");
        user.setFirstLogin(1);
        userMapper.insert(user);

        // 2. 创建 Teacher
        Teacher teacher = new Teacher();
        teacher.setUserId(user.getId());
        teacher.setTeacherNo(dto.getTeacherNo());
        teacher.setName(dto.getName());
        teacher.setGender(dto.getGender());
        teacher.setCollege(dto.getCollege());
        teacher.setDepartment(dto.getDepartment());
        teacher.setTitle(dto.getTitle());
        teacher.setEmail(dto.getEmail());
        teacher.setPhone(dto.getPhone());
        teacherMapper.insert(teacher);

        log.info("创建教师成功: teacherNo={}, userId={}", dto.getTeacherNo(), user.getId());
        return toVO(teacher, user);
    }

    @Override
    public TeacherVO update(Long id, TeacherUpdateDTO dto) {
        Teacher teacher = teacherMapper.selectById(id);
        if (teacher == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "教师不存在");
        }

        if (StringUtils.hasText(dto.getName())) teacher.setName(dto.getName());
        if (dto.getGender() != null) teacher.setGender(dto.getGender());
        if (dto.getCollege() != null) teacher.setCollege(dto.getCollege());
        if (dto.getDepartment() != null) teacher.setDepartment(dto.getDepartment());
        if (dto.getTitle() != null) teacher.setTitle(dto.getTitle());
        if (dto.getEmail() != null) teacher.setEmail(dto.getEmail());
        if (dto.getPhone() != null) teacher.setPhone(dto.getPhone());

        teacherMapper.updateById(teacher);

        User user = userMapper.selectById(teacher.getUserId());
        log.info("更新教师信息: teacherNo={}", teacher.getTeacherNo());
        return toVO(teacher, user);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Teacher teacher = teacherMapper.selectById(id);
        if (teacher == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "教师不存在");
        }

        // 逻辑删除 Teacher
        teacherMapper.deleteById(id);

        // 禁用 User
        User user = userMapper.selectById(teacher.getUserId());
        if (user != null) {
            user.setStatus("DISABLED");
            userMapper.updateById(user);
        }

        log.info("删除教师: teacherNo={}", teacher.getTeacherNo());
    }

    @Override
    public void updateStatus(Long id, String status) {
        if (!"ACTIVE".equals(status) && !"DISABLED".equals(status)) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "状态值无效，需为 ACTIVE 或 DISABLED");
        }

        Teacher teacher = teacherMapper.selectById(id);
        if (teacher == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "教师不存在");
        }

        User user = userMapper.selectById(teacher.getUserId());
        if (user == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "关联用户不存在");
        }

        user.setStatus(status);
        userMapper.updateById(user);

        log.info("{} 教师账号: teacherNo={}", "ACTIVE".equals(status) ? "启用" : "禁用", teacher.getTeacherNo());
    }

    @Override
    public String resetPassword(Long id) {
        Teacher teacher = teacherMapper.selectById(id);
        if (teacher == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "教师不存在");
        }

        User user = userMapper.selectById(teacher.getUserId());
        if (user == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "关联用户不存在");
        }

        String newPassword = getDefaultPassword();
        user.setPassword(PasswordUtil.encode(newPassword));
        user.setFirstLogin(1); // 强制下次登录改密
        userMapper.updateById(user);

        log.info("重置教师密码: teacherNo={}", teacher.getTeacherNo());
        return newPassword;
    }

    // ===== 私有方法 =====

    private TeacherVO toVO(Teacher teacher, User user) {
        return TeacherVO.builder()
                .id(teacher.getId())
                .userId(teacher.getUserId())
                .teacherNo(teacher.getTeacherNo())
                .name(teacher.getName())
                .gender(teacher.getGender())
                .college(teacher.getCollege())
                .department(teacher.getDepartment())
                .title(teacher.getTitle())
                .email(teacher.getEmail())
                .phone(teacher.getPhone())
                .username(user != null ? user.getUsername() : null)
                .status(user != null ? user.getStatus() : null)
                .lastLoginTime(user != null ? user.getLastLoginTime() : null)
                .createTime(teacher.getCreateTime())
                .build();
    }

    private String getDefaultPassword() {
        try {
            SystemConfig config = systemConfigMapper.selectOne(
                    new LambdaQueryWrapper<SystemConfig>()
                            .eq(SystemConfig::getConfigKey, DEFAULT_PASSWORD_KEY));
            if (config != null && StringUtils.hasText(config.getConfigValue())) {
                return config.getConfigValue();
            }
        } catch (Exception e) {
            log.warn("读取默认密码配置失败，使用内置默认值");
        }
        return DEFAULT_PASSWORD;
    }
}
