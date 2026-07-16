package com.example.aitaes.strategy;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.dto.ImportResultDTO;
import com.example.aitaes.dto.excel.CourseExcelDTO;
import com.example.aitaes.entity.Course;
import com.example.aitaes.entity.Teacher;
import com.example.aitaes.enums.ImportType;
import com.example.aitaes.listener.GenericExcelListener;
import com.example.aitaes.listener.GenericExcelListener.ExcelRow;
import com.example.aitaes.listener.RowResultCollector;
import com.example.aitaes.mapper.CourseMapper;
import com.example.aitaes.mapper.TeacherMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 课程数据导入策略
 * 需要解析 teacherNo → teacherId 外键
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CourseImportStrategy implements ImportStrategy {

    private final CourseMapper courseMapper;
    private final TeacherMapper teacherMapper;

    @Override
    public ImportType getSupportedType() {
        return ImportType.COURSE;
    }

    @Override
    public ImportResultDTO execute(InputStream inputStream, ImportContext ctx) {
        GenericExcelListener<CourseExcelDTO> listener =
                new GenericExcelListener<>(500, this::saveBatch);
        EasyExcel.read(inputStream, CourseExcelDTO.class, listener)
                .excelType(getExcelType(ctx.getOriginalFilename()))
                .sheet().doRead();
        return listener.buildResult();
    }

    private void saveBatch(List<ExcelRow<CourseExcelDTO>> batch, RowResultCollector collector) {
        // 1. 预查重复课程编号
        List<String> courseNos = batch.stream()
                .map(row -> row.data().getCourseNo())
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Set<String> existingNos;
        if (!courseNos.isEmpty()) {
            existingNos = courseMapper.selectList(
                    new LambdaQueryWrapper<Course>()
                            .in(Course::getCourseNo, courseNos)
            ).stream().map(Course::getCourseNo).collect(Collectors.toSet());
        } else {
            existingNos = Set.of();
        }

        // 2. 解析 teacherNo → teacherId
        List<String> teacherNos = batch.stream()
                .map(row -> row.data().getTeacherNo())
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<String, Long> teacherNoToId = Map.of();
        if (!teacherNos.isEmpty()) {
            teacherNoToId = teacherMapper.selectList(
                    new LambdaQueryWrapper<Teacher>()
                            .in(Teacher::getTeacherNo, teacherNos)
            ).stream().collect(Collectors.toMap(Teacher::getTeacherNo, Teacher::getId));
        }

        // 3. 逐行校验并插入（单行失败不影响其他行）
        for (ExcelRow<CourseExcelDTO> row : batch) {
            CourseExcelDTO dto = row.data();
            if (dto.getCourseNo() == null || dto.getCourseNo().isBlank()) {
                collector.skip(row.rowNo(), "课程编号为空，跳过");
                continue;
            }
            if (dto.getCourseName() == null || dto.getCourseName().isBlank()) {
                collector.fail(row.rowNo(), "课程名称为空: " + dto.getCourseNo());
                continue;
            }
            if (existingNos.contains(dto.getCourseNo())) {
                collector.skip(row.rowNo(), "课程编号已存在，跳过: " + dto.getCourseNo());
                continue;
            }
            // 有教师工号但解析失败 → 该行失败
            if (dto.getTeacherNo() != null && !dto.getTeacherNo().isBlank()
                    && !teacherNoToId.containsKey(dto.getTeacherNo())) {
                collector.fail(row.rowNo(), String.format("课程 %s 的教师 %s 不存在",
                        dto.getCourseNo(), dto.getTeacherNo()));
                continue;
            }

            try {
                courseMapper.insert(toEntity(dto, teacherNoToId));
                existingNos.add(dto.getCourseNo()); // 避免同批次重复插入
                collector.success();
            } catch (Exception e) {
                collector.fail(row.rowNo(), "插入课程失败: " + e.getMessage());
                log.warn("插入课程失败: courseNo={}, 原因: {}", dto.getCourseNo(), e.getMessage());
            }
        }
    }

    private Course toEntity(CourseExcelDTO dto, Map<String, Long> teacherNoToId) {
        Course course = new Course();
        BeanUtils.copyProperties(dto, course, "teacherNo");
        // 解析外键
        if (dto.getTeacherNo() != null && teacherNoToId.containsKey(dto.getTeacherNo())) {
            course.setTeacherId(teacherNoToId.get(dto.getTeacherNo()));
        }
        return course;
    }
}
