package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.dto.*;
import com.example.aitaes.entity.*;
import com.example.aitaes.listener.GenericExcelListener;
import com.example.aitaes.mapper.*;
import com.example.aitaes.service.ClassService;
import com.example.aitaes.util.PasswordUtil;
import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.support.ExcelTypeEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 班级管理服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClassServiceImpl implements ClassService {

    private final CourseMapper courseMapper;
    private final CourseStudentMapper courseStudentMapper;
    private final StudentMapper studentMapper;
    private final UserMapper userMapper;
    private final TeacherMapper teacherMapper;
    private final TeachingAssistantMapper teachingAssistantMapper;
    private final SystemConfigMapper systemConfigMapper;

    // ===== 班级管理 =====

    /**
     * 将 t_user.id 解析为 t_teacher.id
     * Controller 层传递的是 userId（t_user.id），Service 需要的是 teacherId（t_teacher.id）
     * 支持 TEACHER 和 ASSISTANT 两种角色
     */
    private Long resolveTeacherId(Long userId) {
        // 先尝试通过 user 表判断角色
        User user = userMapper.selectById(userId);
        if (user != null) {
            if ("TEACHER".equals(user.getRole())) {
                Teacher teacher = teacherMapper.selectOne(
                        new LambdaQueryWrapper<Teacher>()
                                .eq(Teacher::getUserId, userId));
                if (teacher == null) {
                    throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "教师不存在");
                }
                return teacher.getId();
            } else if ("ASSISTANT".equals(user.getRole())) {
                TeachingAssistant ta = teachingAssistantMapper.selectOne(
                        new LambdaQueryWrapper<TeachingAssistant>()
                                .eq(TeachingAssistant::getUserId, userId));
                if (ta == null) {
                    throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "助教不存在");
                }
                return ta.getTeacherId();
            } else {
                throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "角色不支持");
            }
        }

        // fallback：兼容旧逻辑，直接查 teacher 表
        Teacher teacher = teacherMapper.selectOne(
                new LambdaQueryWrapper<Teacher>()
                        .eq(Teacher::getUserId, userId));
        if (teacher == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "教师不存在");
        }
        return teacher.getId();
    }

    @Override
    public List<ClassVO> listMyClasses(Long userId) {
        Long teacherId = resolveTeacherId(userId);

        List<Course> courses = courseMapper.selectList(
                new LambdaQueryWrapper<Course>()
                        .eq(Course::getTeacherId, teacherId)
                        .orderByDesc(Course::getCreateTime));

        // 批量查询学生人数，避免 N+1 问题
        List<Long> courseIds = courses.stream().map(Course::getId).collect(Collectors.toList());
        Map<Long, Long> countMap = courseIds.isEmpty() ? Collections.emptyMap()
                : courseStudentMapper.selectList(
                        new LambdaQueryWrapper<CourseStudent>().in(CourseStudent::getCourseId, courseIds))
                        .stream().collect(Collectors.groupingBy(CourseStudent::getCourseId, Collectors.counting()));

        return courses.stream().map(course -> {
            long studentCount = countMap.getOrDefault(course.getId(), 0L);
            return toClassVO(course, (int) studentCount);
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ClassVO create(Long userId, ClassCreateDTO dto) {
        Long teacherId = resolveTeacherId(userId);

        // 生成课程编号
        String courseNo = "C" + System.currentTimeMillis() % 100000;

        Course course = new Course();
        course.setCourseNo(courseNo);
        course.setCourseName(dto.getCourseName());
        course.setClassName(dto.getClassName());
        course.setTeacherId(teacherId);
        course.setCredit(dto.getCredit());
        course.setCourseType(dto.getCourseType());
        course.setSemester(dto.getSemester());
        course.setDescription(dto.getDescription());
        courseMapper.insert(course);

        log.info("创建班级: courseId={}, courseName={}, teacherId={}", course.getId(), dto.getCourseName(), teacherId);
        return toClassVO(course, 0);
    }

    @Override
    public ClassVO update(Long classId, Long userId, ClassCreateDTO dto) {
        Course course = getMyCourse(classId, userId);
        course.setCourseName(dto.getCourseName());
        if (dto.getClassName() != null) course.setClassName(dto.getClassName());
        if (dto.getCredit() != null) course.setCredit(dto.getCredit());
        if (dto.getCourseType() != null) course.setCourseType(dto.getCourseType());
        if (dto.getSemester() != null) course.setSemester(dto.getSemester());
        if (dto.getDescription() != null) course.setDescription(dto.getDescription());
        courseMapper.updateById(course);

        Long studentCount = courseStudentMapper.selectCount(
                new LambdaQueryWrapper<CourseStudent>()
                        .eq(CourseStudent::getCourseId, classId));
        return toClassVO(course, studentCount.intValue());
    }

    @Override
    @Transactional
    public void delete(Long classId, Long userId) {
        getMyCourse(classId, userId);
        courseMapper.deleteById(classId);
        // 同时删除关联关系
        courseStudentMapper.delete(new LambdaQueryWrapper<CourseStudent>()
                .eq(CourseStudent::getCourseId, classId));
        log.info("删除班级: courseId={}", classId);
    }

    // ===== 学生名单管理 =====

    @Override
    public List<StudentVO> listStudents(Long classId, String keyword) {
        List<CourseStudent> mappings = courseStudentMapper.selectList(
                new LambdaQueryWrapper<CourseStudent>()
                        .eq(CourseStudent::getCourseId, classId));
        if (mappings.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> studentIds = mappings.stream()
                .map(CourseStudent::getStudentId).collect(Collectors.toList());
        Map<Long, CourseStudent> mappingMap = mappings.stream()
                .collect(Collectors.toMap(CourseStudent::getStudentId, cs -> cs));

        LambdaQueryWrapper<Student> studentWrapper = new LambdaQueryWrapper<Student>()
                .in(Student::getId, studentIds);
        if (StringUtils.hasText(keyword)) {
            studentWrapper.and(w -> w
                    .like(Student::getStudentNo, keyword)
                    .or()
                    .like(Student::getName, keyword));
        }
        List<Student> students = studentMapper.selectList(studentWrapper);

        return students.stream().map(s -> {
            CourseStudent cs = mappingMap.get(s.getId());
            return toStudentVO(s, cs);
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public StudentVO addStudent(Long classId, Long userId, StudentAddDTO dto) {
        getMyCourse(classId, userId);

        // 查找或创建学生
        Student student = studentMapper.selectOne(
                new LambdaQueryWrapper<Student>().eq(Student::getStudentNo, dto.getStudentNo()));
        if (student == null) {
            // 创建新学生账号
            student = createStudentAccount(dto);
        }

        // 检查是否已在班级中
        CourseStudent existing = courseStudentMapper.selectOne(
                new LambdaQueryWrapper<CourseStudent>()
                        .eq(CourseStudent::getCourseId, classId)
                        .eq(CourseStudent::getStudentId, student.getId()));
        if (existing != null) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "该学生已在班级中");
        }

        // 关联到班级
        Course course = courseMapper.selectById(classId);
        CourseStudent cs = new CourseStudent();
        cs.setCourseId(classId);
        cs.setStudentId(student.getId());
        cs.setClassName(course != null ? course.getCourseName() : null);
        cs.setSemester(course != null ? course.getSemester() : null);
        courseStudentMapper.insert(cs);

        return toStudentVO(student, cs);
    }

    @Override
    @Transactional
    public void removeStudent(Long classId, Long studentId, Long userId) {
        getMyCourse(classId, userId);
        courseStudentMapper.delete(
                new LambdaQueryWrapper<CourseStudent>()
                        .eq(CourseStudent::getCourseId, classId)
                        .eq(CourseStudent::getStudentId, studentId));
        log.info("移除学生: courseId={}, studentId={}", classId, studentId);
    }

    @Override
    @Transactional
    public List<StudentVO> batchImportStudents(Long classId, Long userId,
                                                java.io.InputStream inputStream, String filename) {
        getMyCourse(classId, userId);
        Course course = courseMapper.selectById(classId);

        List<StudentVO> results = new ArrayList<>();
        GenericExcelListener<com.example.aitaes.dto.excel.StudentExcelDTO> listener =
                new GenericExcelListener<>(500, batch -> {
                    for (com.example.aitaes.dto.excel.StudentExcelDTO dto : batch) {
                        try {
                            // 查找或创建学生
                            Student student = studentMapper.selectOne(
                                    new LambdaQueryWrapper<Student>()
                                            .eq(Student::getStudentNo, dto.getStudentNo()));
                            if (student == null) {
                                StudentAddDTO addDto = new StudentAddDTO();
                                addDto.setStudentNo(dto.getStudentNo());
                                addDto.setName(dto.getName());
                                addDto.setGender(dto.getGender());
                                addDto.setCollege(dto.getCollege());
                                addDto.setMajor(dto.getMajor());
                                addDto.setGrade(dto.getGrade());
                                student = createStudentAccount(addDto);
                            }

                            // 关联到班级（跳过已存在的）
                            CourseStudent existing = courseStudentMapper.selectOne(
                                    new LambdaQueryWrapper<CourseStudent>()
                                            .eq(CourseStudent::getCourseId, classId)
                                            .eq(CourseStudent::getStudentId, student.getId()));
                            if (existing == null) {
                                CourseStudent cs = new CourseStudent();
                                cs.setCourseId(classId);
                                cs.setStudentId(student.getId());
                                cs.setClassName(course != null ? course.getCourseName() : null);
                                cs.setSemester(course != null ? course.getSemester() : null);
                                courseStudentMapper.insert(cs);
                            }
                            results.add(toStudentVO(student, null));
                        } catch (Exception e) {
                            log.warn("导入学生失败: studentNo={}, error={}", dto.getStudentNo(), e.getMessage());
                        }
                    }
                });

        ExcelTypeEnum excelType = filename.toLowerCase().endsWith(".csv")
                ? ExcelTypeEnum.CSV : ExcelTypeEnum.XLSX;
        EasyExcel.read(inputStream, com.example.aitaes.dto.excel.StudentExcelDTO.class, listener)
                .excelType(excelType).sheet().doRead();

        log.info("批量导入学生: courseId={}, 成功={}, 失败={}", classId,
                listener.getSuccessCount(), listener.getFailCount());
        return results;
    }

    // ===== 私有方法 =====

    private Course getMyCourse(Long classId, Long userId) {
        Course course = courseMapper.selectById(classId);
        if (course == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "班级不存在");
        }
        Long teacherId = resolveTeacherId(userId);
        if (!teacherId.equals(course.getTeacherId())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "无权操作该班级");
        }
        return course;
    }

    private Student createStudentAccount(StudentAddDTO dto) {
        // 创建 User
        User user = new User();
        user.setUsername(dto.getStudentNo());
        user.setPassword(PasswordUtil.encode(getDefaultPassword()));
        user.setRole("STUDENT");
        user.setStatus("ACTIVE");
        user.setFirstLogin(1);
        userMapper.insert(user);

        // 创建 Student
        Student student = new Student();
        student.setUserId(user.getId());
        student.setStudentNo(dto.getStudentNo());
        student.setName(dto.getName());
        student.setGender(dto.getGender());
        student.setCollege(dto.getCollege());
        student.setMajor(dto.getMajor());
        student.setGrade(dto.getGrade());
        student.setEmail(dto.getEmail());
        studentMapper.insert(student);

        log.info("创建学生账号: studentNo={}, userId={}", dto.getStudentNo(), user.getId());
        return student;
    }

    private String getDefaultPassword() {
        try {
            SystemConfig config = systemConfigMapper.selectOne(
                    new LambdaQueryWrapper<SystemConfig>()
                            .eq(SystemConfig::getConfigKey, "default_password"));
            if (config != null && StringUtils.hasText(config.getConfigValue())) {
                return config.getConfigValue();
            }
        } catch (Exception e) {
            log.warn("读取默认密码配置失败");
        }
        return "123456";
    }

    private ClassVO toClassVO(Course course, int studentCount) {
        return ClassVO.builder()
                .id(course.getId())
                .courseNo(course.getCourseNo())
                .courseName(course.getCourseName())
                .className(course.getClassName() != null ? course.getClassName() : course.getCourseName())
                .semester(course.getSemester())
                .credit(course.getCredit())
                .courseType(course.getCourseType())
                .studentCount(studentCount)
                .createTime(course.getCreateTime())
                .build();
    }

    private StudentVO toStudentVO(Student student, CourseStudent cs) {
        return StudentVO.builder()
                .id(cs != null ? cs.getId() : null)
                .studentId(student.getId())
                .studentNo(student.getStudentNo())
                .name(student.getName())
                .gender(student.getGender())
                .college(student.getCollege())
                .major(student.getMajor())
                .className(student.getClassName())
                .grade(student.getGrade())
                .email(student.getEmail())
                .isFocus(cs != null && cs.getIsFocus() != null && cs.getIsFocus() == 1)
                .importedTypes(Collections.emptyList())
                .createTime(cs != null ? cs.getCreateTime() : null)
                .build();
    }
}
