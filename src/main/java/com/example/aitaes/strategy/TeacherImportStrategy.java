package com.example.aitaes.strategy;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.dto.ImportResultDTO;
import com.example.aitaes.dto.excel.TeacherExcelDTO;
import com.example.aitaes.entity.SystemConfig;
import com.example.aitaes.entity.Teacher;
import com.example.aitaes.entity.User;
import com.example.aitaes.enums.ImportType;
import com.example.aitaes.listener.GenericExcelListener;
import com.example.aitaes.listener.GenericExcelListener.ExcelRow;
import com.example.aitaes.listener.RowResultCollector;
import com.example.aitaes.mapper.SystemConfigMapper;
import com.example.aitaes.mapper.TeacherMapper;
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
 * 教师数据导入策略
 * <p>
 * 对于新教师（工号在 t_teacher 中不存在），自动创建 t_user 认证账号，
 * 使用系统配置的默认密码（BCrypt 加密），角色设为 TEACHER。
 * 已存在的工号跳过并计入警告（不再静默计为成功）。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TeacherImportStrategy implements ImportStrategy {

    private final TeacherMapper teacherMapper;
    private final UserMapper userMapper;
    private final SystemConfigMapper systemConfigMapper;

    @Override
    public ImportType getSupportedType() {
        return ImportType.TEACHER;
    }

    @Override
    public ImportResultDTO execute(InputStream inputStream, ImportContext ctx) {
        // 每次导入读取一次默认密码（局部变量，避免单例缓存导致配置变更需重启）
        String defaultPassword = loadDefaultPassword();

        GenericExcelListener<TeacherExcelDTO> listener = new GenericExcelListener<>(
                500, (batch, collector) -> saveBatch(batch, defaultPassword, collector));
        EasyExcel.read(inputStream, TeacherExcelDTO.class, listener)
                .excelType(getExcelType(ctx.getOriginalFilename()))
                .sheet().doRead();
        return listener.buildResult();
    }

    private void saveBatch(List<ExcelRow<TeacherExcelDTO>> batch, String defaultPassword,
                           RowResultCollector collector) {
        // 1. 预查重复工号
        List<String> teacherNos = batch.stream()
                .map(row -> row.data().getTeacherNo())
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Set<String> existingNos;
        if (!teacherNos.isEmpty()) {
            existingNos = teacherMapper.selectList(
                    new LambdaQueryWrapper<Teacher>()
                            .in(Teacher::getTeacherNo, teacherNos)
            ).stream().map(Teacher::getTeacherNo).collect(Collectors.toSet());
        } else {
            existingNos = Set.of();
        }

        // 2. 对每个新教师：创建 t_user → t_teacher
        int createdCount = 0;

        for (ExcelRow<TeacherExcelDTO> row : batch) {
            TeacherExcelDTO dto = row.data();
            if (dto.getTeacherNo() == null || dto.getTeacherNo().isBlank()) {
                collector.skip(row.rowNo(), "工号为空，跳过");
                continue;
            }
            if (existingNos.contains(dto.getTeacherNo())) {
                collector.skip(row.rowNo(), "工号已存在，跳过: " + dto.getTeacherNo());
                continue;
            }

            try {
                // 2a. 创建 t_user 认证账号
                User user = new User();
                user.setUsername(dto.getTeacherNo());
                user.setPassword(PasswordUtil.encode(defaultPassword));
                user.setRole("TEACHER");
                user.setStatus("ACTIVE");
                user.setFirstLogin(1);
                user.setCreateTime(LocalDateTime.now());
                userMapper.insert(user);

                // 2b. 创建 t_teacher，关联 user_id
                Teacher teacher = new Teacher();
                BeanUtils.copyProperties(dto, teacher);
                teacher.setUserId(user.getId());
                teacher.setCreateTime(LocalDateTime.now());
                teacherMapper.insert(teacher);

                existingNos.add(dto.getTeacherNo()); // 避免同批次重复创建
                createdCount++;
                collector.success();
            } catch (Exception e) {
                collector.fail(row.rowNo(), "创建教师账号失败: " + e.getMessage());
                log.warn("创建教师账号失败: teacherNo={}, 原因: {}", dto.getTeacherNo(), e.getMessage());
            }
        }

        if (createdCount > 0) {
            log.info("批量创建教师账号 {} 条（含 t_user + t_teacher）", createdCount);
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
