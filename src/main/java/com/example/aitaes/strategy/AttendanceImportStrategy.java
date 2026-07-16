package com.example.aitaes.strategy;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.dto.ImportResultDTO;
import com.example.aitaes.dto.excel.AttendanceExcelDTO;
import com.example.aitaes.entity.Attendance;
import com.example.aitaes.entity.Student;
import com.example.aitaes.enums.ImportType;
import com.example.aitaes.listener.GenericExcelListener;
import com.example.aitaes.listener.GenericExcelListener.ExcelRow;
import com.example.aitaes.listener.RowResultCollector;
import com.example.aitaes.mapper.AttendanceMapper;
import com.example.aitaes.mapper.StudentMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 考勤记录导入策略
 * <p>
 * 课程优先来自页面参数（{@link ImportContext#getCourseId()}），
 * 回退文件名格式：{课程编号}_ATTENDANCE_{描述}.xlsx，如 CS-NET-001_ATTENDANCE_计科1801.xlsx
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AttendanceImportStrategy implements ImportStrategy {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final AttendanceMapper attendanceMapper;
    private final StudentMapper studentMapper;
    private final CourseResolver courseResolver;

    @Override
    public ImportType getSupportedType() {
        return ImportType.ATTENDANCE;
    }

    @Override
    public ImportResultDTO execute(InputStream inputStream, ImportContext ctx) {
        CourseResolver.ResolvedCourse course = courseResolver.resolve(ctx);
        if (course == null) {
            return ImportResultDTO.failed(CourseResolver.COURSE_NOT_FOUND_MSG);
        }

        GenericExcelListener<AttendanceExcelDTO> listener = new GenericExcelListener<>(
                500, (batch, collector) -> saveBatch(batch, course, collector));
        EasyExcel.read(inputStream, AttendanceExcelDTO.class, listener)
                .excelType(getExcelType(ctx.getOriginalFilename()))
                .sheet().doRead();
        return listener.buildResult();
    }

    private void saveBatch(List<ExcelRow<AttendanceExcelDTO>> batch,
                           CourseResolver.ResolvedCourse course, RowResultCollector collector) {
        for (ExcelRow<AttendanceExcelDTO> row : batch) {
            AttendanceExcelDTO dto = row.data();
            try {
                if (dto.getStudentNo() == null || dto.getStudentNo().isBlank()) {
                    collector.skip(row.rowNo(), "学号为空，跳过");
                    continue;
                }

                Student student = studentMapper.selectOne(
                        new LambdaQueryWrapper<Student>()
                                .eq(Student::getStudentNo, dto.getStudentNo()));
                if (student == null) {
                    collector.fail(row.rowNo(), "学生不存在: " + dto.getStudentNo() + "（请先导入学生名单）");
                    continue;
                }

                if (dto.getAttendanceDate() == null || dto.getAttendanceDate().isBlank()) {
                    collector.fail(row.rowNo(), "考勤日期不能为空");
                    continue;
                }
                LocalDate attendanceDate;
                try {
                    attendanceDate = LocalDate.parse(dto.getAttendanceDate().trim(), DATE_FORMAT);
                } catch (Exception e) {
                    collector.fail(row.rowNo(), "日期格式错误，应为 yyyy-MM-dd: " + dto.getAttendanceDate());
                    continue;
                }

                // 检查是否已存在（同课程+同学生+同日期）
                Attendance existing = attendanceMapper.selectOne(
                        new LambdaQueryWrapper<Attendance>()
                                .eq(Attendance::getCourseId, course.courseId())
                                .eq(Attendance::getStudentId, student.getId())
                                .eq(Attendance::getAttendanceDate, attendanceDate));
                if (existing != null) {
                    collector.skip(row.rowNo(), "该学生当日已有考勤记录，跳过: "
                            + dto.getStudentNo() + " " + dto.getAttendanceDate());
                    continue;
                }

                Attendance att = new Attendance();
                att.setCourseId(course.courseId());
                att.setStudentId(student.getId());
                att.setAttendanceDate(attendanceDate);
                att.setStatus(dto.getStatus());
                att.setWeekNo(dto.getWeekNo());
                att.setPeriod(dto.getPeriod());
                att.setSemester(course.semester());
                att.setRemark(dto.getRemark());
                attendanceMapper.insert(att);
                collector.success();
            } catch (Exception e) {
                collector.fail(row.rowNo(), "考勤记录插入失败: " + e.getMessage());
                log.warn("考勤记录插入失败: 第{}行", row.rowNo(), e);
            }
        }
    }
}
