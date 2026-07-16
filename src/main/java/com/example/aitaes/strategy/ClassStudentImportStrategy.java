package com.example.aitaes.strategy;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.dto.ImportResultDTO;
import com.example.aitaes.dto.excel.ClassStudentExcelDTO;
import com.example.aitaes.entity.*;
import com.example.aitaes.enums.ImportStatus;
import com.example.aitaes.enums.ImportType;
import com.example.aitaes.listener.GenericExcelListener;
import com.example.aitaes.mapper.*;
import com.example.aitaes.util.PasswordUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 班级学生名单导入策略
 * <p>
 * 导入一个课程的学生花名册。对于每个学生：
 * <ul>
 *   <li>学号已存在于 t_student → 直接关联到课程（创建 t_course_student）</li>
 *   <li>学号不存在 → 自动创建 t_user 账号（BCrypt 加密初始密码）+ t_student + t_course_student</li>
 * </ul>
 * <p>
 * 文件名格式：{课程编号}_CLASS_STUDENT_{班级}.xlsx
 * 如：CS-NET-001_CLASS_STUDENT_计科1801.xlsx
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ClassStudentImportStrategy implements ImportStrategy {

    private final StudentMapper studentMapper;
    private final UserMapper userMapper;
    private final CourseMapper courseMapper;
    private final CourseStudentMapper courseStudentMapper;
    private final SystemConfigMapper systemConfigMapper;

    private Long courseId;
    private String semester;
    private String cachedDefaultPassword;
    private boolean passwordLoaded;

    @Override
    public ImportType getSupportedType() {
        return ImportType.CLASS_STUDENT;
    }

    @Override
    public ImportResultDTO execute(InputStream inputStream, String originalFilename) {
        parseFileName(originalFilename);

        if (courseId == null) {
            ImportResultDTO error = new ImportResultDTO();
            error.setTotalRows(0);
            error.setSuccessRows(0);
            error.setFailRows(0);
            error.setStatus(ImportStatus.FAILED.getCode());
            error.setErrors(List.of("无法从文件名解析课程信息，请使用格式: {课程编号}_CLASS_STUDENT_{班级}.xlsx"));
            return error;
        }

        GenericExcelListener<ClassStudentExcelDTO> listener =
                new GenericExcelListener<>(500, this::saveBatch);
        EasyExcel.read(inputStream, ClassStudentExcelDTO.class, listener)
                .excelType(getExcelType(originalFilename))
                .sheet().doRead();
        return buildResult(listener);
    }

    /**
     * 从文件名解析课程信息：{课程编号}_CLASS_STUDENT_{班级}.xlsx
     */
    private void parseFileName(String filename) {
        if (filename == null) return;
        String name = filename.replaceAll("(?i)\\.(xlsx|xls|csv)$", "");
        String[] parts = name.split("_");
        if (parts.length >= 2) {
            Course course = courseMapper.selectOne(
                    new LambdaQueryWrapper<Course>().eq(Course::getCourseNo, parts[0]));
            if (course != null) {
                this.courseId = course.getId();
                this.semester = course.getSemester();
                log.info("解析文件名: courseNo={}, courseId={}, semester={}", parts[0], courseId, semester);
            } else {
                log.warn("未找到课程: courseNo={}", parts[0]);
            }
        }
    }

    /**
     * 批量处理学生名单
     */
    private void saveBatch(List<ClassStudentExcelDTO> dtoList) {
        // 1. 预查数据库中已有学号
        List<String> studentNos = dtoList.stream()
                .map(ClassStudentExcelDTO::getStudentNo)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Set<String> existingNos;
        if (!studentNos.isEmpty()) {
            existingNos = studentMapper.selectList(
                    new LambdaQueryWrapper<Student>()
                            .in(Student::getStudentNo, studentNos)
            ).stream().map(Student::getStudentNo).collect(Collectors.toSet());
        } else {
            existingNos = Set.of();
        }

        String defaultPassword = getDefaultPassword();
        int createdAccounts = 0;
        int linkedStudents = 0;

        for (ClassStudentExcelDTO dto : dtoList) {
            if (dto.getStudentNo() == null || dto.getStudentNo().isBlank()) continue;

            try {
                Long studentId;

                if (!existingNos.contains(dto.getStudentNo())) {
                    // 2a. 新学生：创建 t_user + t_student
                    User user = new User();
                    user.setUsername(dto.getStudentNo());
                    user.setPassword(PasswordUtil.encode(defaultPassword));
                    user.setRole("STUDENT");
                    user.setStatus("ACTIVE");
                    user.setFirstLogin(1);
                    user.setCreateTime(LocalDateTime.now());
                    userMapper.insert(user);

                    Student student = new Student();
                    student.setUserId(user.getId());
                    student.setStudentNo(dto.getStudentNo());
                    student.setName(dto.getName());
                    student.setGender(dto.getGender());
                    student.setCollege(dto.getCollege());
                    student.setMajor(dto.getMajor());
                    student.setClassName(dto.getClassName());
                    student.setGrade(dto.getGrade());
                    student.setEmail(dto.getEmail());
                    student.setCreateTime(LocalDateTime.now());
                    studentMapper.insert(student);

                    studentId = student.getId();
                    existingNos.add(dto.getStudentNo()); // 避免同批次重复创建
                    createdAccounts++;
                    log.debug("创建学生账号: studentNo={}, name={}", dto.getStudentNo(), dto.getName());
                } else {
                    // 2b. 已有学生：查 ID
                    Student existing = studentMapper.selectOne(
                            new LambdaQueryWrapper<Student>()
                                    .eq(Student::getStudentNo, dto.getStudentNo()));
                    studentId = existing.getId();
                }

                // 3. 关联课程-学生（已存在则更新班级）
                CourseStudent existingLink = courseStudentMapper.selectOne(
                        new LambdaQueryWrapper<CourseStudent>()
                                .eq(CourseStudent::getCourseId, courseId)
                                .eq(CourseStudent::getStudentId, studentId));

                if (existingLink != null) {
                    // 更新班级信息
                    if (dto.getClassName() != null && !dto.getClassName().isBlank()) {
                        existingLink.setClassName(dto.getClassName());
                        courseStudentMapper.updateById(existingLink);
                    }
                } else {
                    CourseStudent cs = new CourseStudent();
                    cs.setCourseId(courseId);
                    cs.setStudentId(studentId);
                    cs.setClassName(dto.getClassName());
                    cs.setSemester(semester);
                    cs.setCreateTime(LocalDateTime.now());
                    courseStudentMapper.insert(cs);
                }
                linkedStudents++;

            } catch (Exception e) {
                log.warn("处理学生名单行失败: studentNo={}, 原因: {}", dto.getStudentNo(), e.getMessage());
            }
        }

        log.info("学生名单导入: 创建账号{}个, 关联课程{}人", createdAccounts, linkedStudents);
    }

    /**
     * 从系统配置读取默认初始密码，带缓存
     */
    private String getDefaultPassword() {
        if (!passwordLoaded) {
            try {
                SystemConfig config = systemConfigMapper.selectOne(
                        new LambdaQueryWrapper<SystemConfig>()
                                .eq(SystemConfig::getConfigKey, "default.password"));
                if (config != null && config.getConfigValue() != null
                        && !config.getConfigValue().isBlank()) {
                    cachedDefaultPassword = config.getConfigValue();
                }
            } catch (Exception e) {
                log.warn("读取默认密码配置失败，使用 fallback: 123456");
            }
            if (cachedDefaultPassword == null || cachedDefaultPassword.isBlank()) {
                cachedDefaultPassword = "123456";
            }
            passwordLoaded = true;
        }
        return cachedDefaultPassword;
    }

    private ImportResultDTO buildResult(GenericExcelListener<?> listener) {
        ImportResultDTO result = new ImportResultDTO();
        result.setTotalRows(listener.getTotalRows());
        result.setSuccessRows(listener.getSuccessCount());
        result.setFailRows(listener.getFailCount());

        if (listener.getFailCount() == 0) {
            result.setStatus(ImportStatus.SUCCESS.getCode());
        } else if (listener.getSuccessCount() == 0) {
            result.setStatus(ImportStatus.FAILED.getCode());
        } else {
            result.setStatus(ImportStatus.PARTIAL.getCode());
        }

        List<String> allErrors = listener.getErrorMessages();
        result.setErrors(allErrors.size() > 100 ? allErrors.subList(0, 100) : allErrors);
        return result;
    }
}
