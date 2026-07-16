package com.example.aitaes.strategy;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.dto.ImportResultDTO;
import com.example.aitaes.dto.excel.StudentExcelDTO;
import com.example.aitaes.entity.Student;
import com.example.aitaes.entity.SystemConfig;
import com.example.aitaes.entity.User;
import com.example.aitaes.enums.ImportType;
import com.example.aitaes.listener.GenericExcelListener;
import com.example.aitaes.listener.GenericExcelListener.ExcelRow;
import com.example.aitaes.listener.RowResultCollector;
import com.example.aitaes.mapper.StudentMapper;
import com.example.aitaes.mapper.SystemConfigMapper;
import com.example.aitaes.mapper.UserMapper;
import com.example.aitaes.util.PasswordUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 学生数据导入策略
 * <p>
 * 对于新学生（学号在 t_student 中不存在），自动创建 t_user 认证账号，
 * 使用系统配置的默认密码（BCrypt 加密），角色设为 STUDENT，标记首次登录。
 * 已存在的学号跳过并计入警告（不再静默计为成功）。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StudentImportStrategy implements ImportStrategy {

    private final StudentMapper studentMapper;
    private final UserMapper userMapper;
    private final SystemConfigMapper systemConfigMapper;

    @Override
    public ImportType getSupportedType() {
        return ImportType.STUDENT;
    }

    @Override
    public ImportResultDTO execute(InputStream inputStream, ImportContext ctx) {
        // 每次导入读取一次默认密码（局部变量，避免单例缓存导致配置变更需重启）
        String defaultPassword = loadDefaultPassword();

        GenericExcelListener<StudentExcelDTO> listener = new GenericExcelListener<>(
                500, (batch, collector) -> saveBatch(batch, defaultPassword, collector));
        EasyExcel.read(inputStream, StudentExcelDTO.class, listener)
                .excelType(getExcelType(ctx.getOriginalFilename()))
                .sheet().doRead();
        return listener.buildResult();
    }

    private void saveBatch(List<ExcelRow<StudentExcelDTO>> batch, String defaultPassword,
                           RowResultCollector collector) {
        // 1. 预查数据库中已有学号
        List<String> studentNos = batch.stream()
                .map(row -> row.data().getStudentNo())
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

        // 2. 对每个新学生：创建 t_user → t_student
        int createdCount = 0;

        for (ExcelRow<StudentExcelDTO> row : batch) {
            StudentExcelDTO dto = row.data();
            if (dto.getStudentNo() == null || dto.getStudentNo().isBlank()) {
                collector.skip(row.rowNo(), "学号为空，跳过");
                continue;
            }
            if (existingNos.contains(dto.getStudentNo())) {
                collector.skip(row.rowNo(), "学号已存在，跳过: " + dto.getStudentNo());
                continue;
            }

            try {
                // 2a. 创建 t_user 认证账号
                User user = new User();
                user.setUsername(dto.getStudentNo());
                user.setPassword(PasswordUtil.encode(defaultPassword));
                user.setRole("STUDENT");
                user.setStatus("ACTIVE");
                user.setFirstLogin(1);
                user.setCreateTime(LocalDateTime.now());
                userMapper.insert(user);

                // 2b. 创建 t_student，关联 user_id
                Student student = new Student();
                BeanUtils.copyProperties(dto, student);
                student.setUserId(user.getId());
                student.setCreateTime(LocalDateTime.now());
                studentMapper.insert(student);

                existingNos.add(dto.getStudentNo()); // 避免同批次重复创建
                createdCount++;
                collector.success();
            } catch (Exception e) {
                collector.fail(row.rowNo(), "创建学生账号失败: " + e.getMessage());
                log.warn("创建学生账号失败: studentNo={}, 原因: {}", dto.getStudentNo(), e.getMessage());
            }
        }

        if (createdCount > 0) {
            log.info("批量创建学生账号 {} 条（含 t_user + t_student）", createdCount);
        }
    }

    /**
     * 从系统配置读取默认初始密码
     */
    private String loadDefaultPassword() {
        try {
            SystemConfig config = systemConfigMapper.selectOne(
                    new LambdaQueryWrapper<SystemConfig>()
                            .eq(SystemConfig::getConfigKey, "default.password"));
            if (config != null && config.getConfigValue() != null
                    && !config.getConfigValue().isBlank()) {
                return config.getConfigValue();
            }
        } catch (Exception e) {
            log.warn("读取默认密码配置失败，使用 fallback: 123456");
        }
        return "123456";
    }
}
