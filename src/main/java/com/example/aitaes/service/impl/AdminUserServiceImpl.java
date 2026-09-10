package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.dto.AdminUserCreateDTO;
import com.example.aitaes.dto.AdminUserUpdateDTO;
import com.example.aitaes.dto.AdminUserVO;
import com.example.aitaes.entity.Student;
import com.example.aitaes.entity.Teacher;
import com.example.aitaes.entity.TeachingAssistant;
import com.example.aitaes.entity.User;
import com.example.aitaes.mapper.StudentMapper;
import com.example.aitaes.mapper.TeacherMapper;
import com.example.aitaes.mapper.TeachingAssistantMapper;
import com.example.aitaes.mapper.UserMapper;
import com.example.aitaes.service.AdminUserService;
import com.example.aitaes.util.PasswordUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {
    private static final List<String> ROLES = List.of("ADMIN", "TEACHER", "ASSISTANT", "STUDENT");
    private final UserMapper userMapper;
    private final TeacherMapper teacherMapper;
    private final StudentMapper studentMapper;
    private final TeachingAssistantMapper teachingAssistantMapper;

    @Override
    public IPage<AdminUserVO> page(int pageNum, int pageSize, String keyword, String role) {
        LambdaQueryWrapper<User> query = new LambdaQueryWrapper<User>().orderByDesc(User::getCreateTime);
        if (StringUtils.hasText(role)) {
            validateRole(role);
            query.eq(User::getRole, role);
        }
        // 姓名分散在教师、学生、助教资料表，管理员用户规模通常较小，统一映射后再过滤可保证按姓名搜索准确。
        List<AdminUserVO> all = userMapper.selectList(query).stream()
                .map(this::toVO)
                .filter(vo -> !StringUtils.hasText(keyword) || matches(vo, keyword))
                .toList();
        int from = (pageNum - 1) * pageSize;
        List<AdminUserVO> records = from >= all.size() ? List.of() : all.subList(from, Math.min(from + pageSize, all.size()));
        Page<AdminUserVO> result = new Page<>(pageNum, pageSize, all.size());
        result.setRecords(records);
        return result;
    }

    @Override
    @Transactional
    public AdminUserVO create(AdminUserCreateDTO request) {
        String role = request.getRole().trim().toUpperCase();
        validateRole(role);
        if (userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, request.getUsername().trim())) != null) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "账号已存在");
        }
        if (!"ADMIN".equals(role) && !StringUtils.hasText(request.getName())) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "教师、学生和助教必须填写姓名");
        }
        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setPassword(PasswordUtil.encode(request.getPassword()));
        user.setRole(role);
        user.setStatus("ACTIVE");
        user.setFirstLogin(1);
        userMapper.insert(user);
        createProfile(user, request);
        return toVO(user);
    }

    @Override
    @Transactional
    public AdminUserVO update(Long id, AdminUserUpdateDTO request) {
        User user = requireUser(id);
        switch (user.getRole()) {
            case "TEACHER" -> {
                Teacher teacher = teacherMapper.selectOne(new LambdaQueryWrapper<Teacher>().eq(Teacher::getUserId, id));
                if (teacher == null) throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "教师资料不存在");
                teacher.setName(request.getName().trim()); teacher.setCollege(request.getCollege()); teacherMapper.updateById(teacher);
            }
            case "STUDENT" -> {
                Student student = studentMapper.selectOne(new LambdaQueryWrapper<Student>().eq(Student::getUserId, id));
                if (student == null) throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "学生资料不存在");
                student.setName(request.getName().trim()); student.setCollege(request.getCollege()); student.setMajor(request.getMajor());
                student.setClassName(request.getClassName()); student.setGrade(request.getGrade()); studentMapper.updateById(student);
            }
            case "ASSISTANT" -> {
                TeachingAssistant assistant = teachingAssistantMapper.selectOne(new LambdaQueryWrapper<TeachingAssistant>().eq(TeachingAssistant::getUserId, id));
                if (assistant == null) throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "助教资料不存在");
                assistant.setName(request.getName().trim()); teachingAssistantMapper.updateById(assistant);
            }
            default -> throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "管理员账号不需要维护个人资料");
        }
        return toVO(user);
    }

    @Override
    public void updateStatus(Long id, String status, Long operatorId) {
        if (!"ACTIVE".equals(status) && !"DISABLED".equals(status)) throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "状态必须为 ACTIVE 或 DISABLED");
        if (id.equals(operatorId)) throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "不能禁用自己的账号");
        User user = requireUser(id); user.setStatus(status); userMapper.updateById(user);
    }

    @Override
    public String resetPassword(Long id) {
        User user = requireUser(id);
        String password = "123456";
        user.setPassword(PasswordUtil.encode(password)); user.setFirstLogin(1); userMapper.updateById(user);
        return password;
    }

    @Override
    @Transactional
    public void delete(Long id, Long operatorId) {
        if (id.equals(operatorId)) throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "不能删除当前登录的管理员账号");
        User user = requireUser(id);
        switch (user.getRole()) {
            case "TEACHER" -> { Teacher v = teacherMapper.selectOne(new LambdaQueryWrapper<Teacher>().eq(Teacher::getUserId, id)); if (v != null) teacherMapper.deleteById(v.getId()); }
            case "STUDENT" -> { Student v = studentMapper.selectOne(new LambdaQueryWrapper<Student>().eq(Student::getUserId, id)); if (v != null) studentMapper.deleteById(v.getId()); }
            case "ASSISTANT" -> { TeachingAssistant v = teachingAssistantMapper.selectOne(new LambdaQueryWrapper<TeachingAssistant>().eq(TeachingAssistant::getUserId, id)); if (v != null) teachingAssistantMapper.deleteById(v.getId()); }
        }
        userMapper.deleteById(id);
    }

    private void createProfile(User user, AdminUserCreateDTO request) {
        if ("TEACHER".equals(user.getRole())) { Teacher v = new Teacher(); v.setUserId(user.getId()); v.setTeacherNo(user.getUsername()); v.setName(request.getName().trim()); v.setCollege(request.getCollege()); teacherMapper.insert(v); }
        if ("STUDENT".equals(user.getRole())) { Student v = new Student(); v.setUserId(user.getId()); v.setStudentNo(user.getUsername()); v.setName(request.getName().trim()); v.setCollege(request.getCollege()); v.setMajor(request.getMajor()); v.setClassName(request.getClassName()); v.setGrade(request.getGrade()); studentMapper.insert(v); }
        if ("ASSISTANT".equals(user.getRole())) { TeachingAssistant v = new TeachingAssistant(); v.setUserId(user.getId()); v.setName(request.getName().trim()); teachingAssistantMapper.insert(v); }
    }
    private User requireUser(Long id) { User user = userMapper.selectById(id); if (user == null) throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "用户不存在"); return user; }
    private void validateRole(String role) { if (!ROLES.contains(role)) throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "角色无效"); }
    private boolean matches(AdminUserVO vo, String keyword) { String q = keyword.toLowerCase(); return (vo.getUsername() != null && vo.getUsername().toLowerCase().contains(q)) || (vo.getName() != null && vo.getName().toLowerCase().contains(q)); }
    private AdminUserVO toVO(User user) {
        String name = user.getUsername(), college = null, major = null, className = null, grade = null;
        if ("TEACHER".equals(user.getRole())) { Teacher v = teacherMapper.selectOne(new LambdaQueryWrapper<Teacher>().eq(Teacher::getUserId, user.getId())); if (v != null) { name = v.getName(); college = v.getCollege(); } }
        if ("STUDENT".equals(user.getRole())) { Student v = studentMapper.selectOne(new LambdaQueryWrapper<Student>().eq(Student::getUserId, user.getId())); if (v != null) { name = v.getName(); college = v.getCollege(); major = v.getMajor(); className = v.getClassName(); grade = v.getGrade(); } }
        if ("ASSISTANT".equals(user.getRole())) { TeachingAssistant v = teachingAssistantMapper.selectOne(new LambdaQueryWrapper<TeachingAssistant>().eq(TeachingAssistant::getUserId, user.getId())); if (v != null) name = v.getName(); }
        return AdminUserVO.builder().id(user.getId()).username(user.getUsername()).name(name).role(user.getRole()).status(user.getStatus()).college(college).major(major).className(className).grade(grade).createTime(user.getCreateTime()).lastLoginTime(user.getLastLoginTime()).build();
    }
}
