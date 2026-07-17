package com.example.aitaes.strategy;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.dto.ImportResultDTO;
import com.example.aitaes.dto.excel.ExperimentExcelDTO;
import com.example.aitaes.entity.Experiment;
import com.example.aitaes.entity.Student;
import com.example.aitaes.enums.ImportType;
import com.example.aitaes.listener.GenericExcelListener;
import com.example.aitaes.listener.GenericExcelListener.ExcelRow;
import com.example.aitaes.listener.RowResultCollector;
import com.example.aitaes.mapper.ExperimentMapper;
import com.example.aitaes.mapper.StudentMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 实验报告导入策略
 * <p>
 * 课程优先来自页面参数（{@link ImportContext#getCourseId()}），
 * 回退文件名格式：{课程编号}_EXPERIMENT_{描述}.xlsx，如 CS-NET-001_EXPERIMENT_计科1801.xlsx
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExperimentImportStrategy implements ImportStrategy {

    private static final DateTimeFormatter DATETIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final ExperimentMapper experimentMapper;
    private final StudentMapper studentMapper;
    private final CourseResolver courseResolver;

    @Override
    public ImportType getSupportedType() {
        return ImportType.EXPERIMENT;
    }

    @Override
    public ImportResultDTO execute(InputStream inputStream, ImportContext ctx) {
        CourseResolver.ResolvedCourse course = courseResolver.resolve(ctx);
        if (course == null) {
            return ImportResultDTO.failed(CourseResolver.COURSE_NOT_FOUND_MSG);
        }

        GenericExcelListener<ExperimentExcelDTO> listener = new GenericExcelListener<>(
                500, (batch, collector) -> saveBatch(batch, course, collector));
        EasyExcel.read(inputStream, ExperimentExcelDTO.class, listener)
                .excelType(getExcelType(ctx.getOriginalFilename()))
                .sheet().doRead();
        return listener.buildResult();
    }

    private void saveBatch(List<ExcelRow<ExperimentExcelDTO>> batch,
                           CourseResolver.ResolvedCourse course, RowResultCollector collector) {
        for (ExcelRow<ExperimentExcelDTO> row : batch) {
            ExperimentExcelDTO dto = row.data();
            try {
                String studentNo = dto.getStudentNo() != null ? dto.getStudentNo().trim() : null;
                if (studentNo == null || studentNo.isBlank()) {
                    collector.skip(row.rowNo(), "学号为空，跳过");
                    continue;
                }

                Student student = studentMapper.selectOne(
                        new LambdaQueryWrapper<Student>()
                                .eq(Student::getStudentNo, studentNo));
                if (student == null) {
                    collector.fail(row.rowNo(), "学生不存在: " + studentNo + "（请先导入学生名单）");
                    continue;
                }

                Experiment exp = new Experiment();
                exp.setCourseId(course.courseId());
                exp.setStudentId(student.getId());
                exp.setExperimentName(dto.getExperimentName());
                exp.setExperimentNo(dto.getExperimentNo());
                exp.setSemester(course.semester());
                exp.setRemark(dto.getRemark());

                if (dto.getScore() != null && !dto.getScore().isBlank()) {
                    try {
                        exp.setScore(new BigDecimal(dto.getScore().trim()));
                    } catch (NumberFormatException e) {
                        collector.fail(row.rowNo(), "分数格式错误: " + dto.getScore());
                        continue;
                    }
                }

                if (dto.getSubmitTime() != null && !dto.getSubmitTime().isBlank()) {
                    try {
                        exp.setSubmitTime(LocalDateTime.parse(dto.getSubmitTime().trim(), DATETIME_FORMAT));
                    } catch (Exception e) {
                        collector.fail(row.rowNo(),
                                "提交时间格式错误，应为 yyyy-MM-dd HH:mm:ss: " + dto.getSubmitTime());
                        continue;
                    }
                }

                experimentMapper.insert(exp);
                collector.success();
            } catch (Exception e) {
                collector.fail(row.rowNo(), "实验报告插入失败: " + e.getMessage());
                log.warn("实验报告插入失败: 第{}行", row.rowNo(), e);
            }
        }
    }
}
