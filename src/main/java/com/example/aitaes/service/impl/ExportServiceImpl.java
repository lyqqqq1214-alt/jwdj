package com.example.aitaes.service.impl;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.ExcelWriter;
import com.alibaba.excel.write.metadata.WriteSheet;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.dto.ChartItem;
import com.example.aitaes.dto.DashboardChartsDTO;
import com.example.aitaes.dto.DashboardOverviewDTO;
import com.example.aitaes.dto.StudentProfileVO;
import com.example.aitaes.dto.WarningStudentDTO;
import com.example.aitaes.entity.Course;
import com.example.aitaes.mapper.CourseMapper;
import com.example.aitaes.service.DashboardService;
import com.example.aitaes.service.ExportService;
import com.example.aitaes.service.PortraitService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** 基于真实驾驶舱与画像数据生成 Excel 报告。 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExportServiceImpl implements ExportService {
    private final CourseMapper courseMapper;
    private final DashboardService dashboardService;
    private final PortraitService portraitService;

    @Override
    public void exportCourse(Long courseId, HttpServletResponse response) throws IOException {
        Course course = requireCourse(courseId);
        DashboardOverviewDTO overview = dashboardService.getOverview(courseId, null);
        DashboardChartsDTO charts = dashboardService.getCharts(courseId, null);
        List<WarningStudentDTO> warnings = dashboardService.getWarnings(courseId, null);
        setResponseHeaders(response, "班级驾驶舱报告_" + course.getCourseNo() + ".xlsx");
        ExcelWriter writer = EasyExcel.write(response.getOutputStream()).build();
        try {
            write(writer, "班级概览", List.of("指标", "数值"), List.of(
                    row("课程", course.getCourseName()), row("课程编号", course.getCourseNo()),
                    row("学期", course.getSemester()), row("班级人数", overview.getStudentCount()),
                    row("最近考核平均分", overview.getAverageScore()), row("到课率(%)", overview.getAttendanceRate()),
                    row("作业提交率(%)", overview.getHomeworkRate()), row("预警学生数", overview.getWarningCount())));
            write(writer, "成绩趋势", List.of("考核", "班级平均分"), chartRows(charts.getScoreTrend()));
            write(writer, "知识点掌握度", List.of("知识点", "班级掌握度(%)"), chartRows(charts.getKnowledgeRadar()));
            List<List<Object>> warningRows = new ArrayList<>();
            for (WarningStudentDTO w : warnings) warningRows.add(row(w.getStudentNo(), w.getName(), w.getWarningType(), w.getSeverity(), w.getWarningMsg(), w.getCreateTime()));
            write(writer, "预警学生", List.of("学号", "姓名", "预警类型", "严重程度", "预警原因", "触发时间"), warningRows);
        } finally { writer.finish(); }
    }

    @Override
    public void exportStudentProfile(Long studentId, Long courseId, HttpServletResponse response) throws IOException {
        Course course = requireCourse(courseId);
        StudentProfileVO p = portraitService.getProfile(studentId, courseId);
        List<WarningStudentDTO> warnings = dashboardService.getWarnings(courseId, null).stream()
                .filter(w -> studentId.equals(w.getStudentId())).toList();
        setResponseHeaders(response, "学生画像报告_" + p.getStudentNo() + "_" + course.getCourseNo() + ".xlsx");
        ExcelWriter writer = EasyExcel.write(response.getOutputStream()).build();
        try {
            write(writer, "个人概览", List.of("指标", "内容"), List.of(
                    row("姓名", p.getName()), row("学号", p.getStudentNo()), row("班级", p.getClassName()),
                    row("课程", course.getCourseName()), row("总评成绩", p.getTotalScore()),
                    row("班级排名", p.getClassRank() + " / " + p.getClassTotal()), row("到课率(%)", p.getAttendanceRate()),
                    row("作业提交率(%)", p.getHomeworkRate()), row("AI综合评价", p.getAiEvaluation()), row("AI学习建议", p.getAiSuggestions())));
            write(writer, "知识点掌握度", List.of("知识点", "个人掌握度(%)"), chartRows(p.getKnowledgeRadar()));
            List<List<Object>> attendanceRows = new ArrayList<>();
            for (StudentProfileVO.AttendanceItem a : p.getAttendanceList()) attendanceRows.add(row(a.getDate(), a.getStatus(), a.getWeekNo(), a.getRemark()));
            write(writer, "考勤记录", List.of("日期", "状态", "周次", "备注"), attendanceRows);
            List<List<Object>> warningRows = new ArrayList<>();
            for (WarningStudentDTO w : warnings) warningRows.add(row(w.getWarningType(), w.getSeverity(), w.getWarningMsg(), w.getCreateTime()));
            write(writer, "个人预警", List.of("预警类型", "严重程度", "预警原因", "触发时间"), warningRows);
        } finally { writer.finish(); }
    }

    @Override public void exportTeacher(Long teacherId, HttpServletResponse response) throws IOException { setResponseHeaders(response, "教师评价_" + teacherId + ".xlsx"); writeSingle(response, "教师评价", List.of("说明"), List.of(row("请按课程导出班级驾驶舱报告。"))); }
    @Override public void exportCollege(HttpServletResponse response) throws IOException { setResponseHeaders(response, "学院排名.xlsx"); writeSingle(response, "学院排名", List.of("说明"), List.of(row("暂无学院汇总数据。"))); }
    @Override public void exportSemester(String semester, HttpServletResponse response) throws IOException { setResponseHeaders(response, "学期报告_" + semester + ".xlsx"); writeSingle(response, "学期报告", List.of("学期", "说明"), List.of(row(semester, "请按课程导出班级驾驶舱报告。"))); }

    private Course requireCourse(Long id) { Course c = courseMapper.selectById(id); if (c == null) throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "课程不存在"); return c; }
    private void writeSingle(HttpServletResponse r, String name, List<String> head, List<List<Object>> rows) throws IOException { EasyExcel.write(r.getOutputStream()).head(head(head)).sheet(name).doWrite(rows); }
    private void write(ExcelWriter writer, String name, List<String> head, List<List<Object>> rows) { writer.write(rows, EasyExcel.writerSheet(name).head(head(head)).build()); }
    private List<List<String>> head(List<String> values) { return values.stream().map(v -> List.of(v)).toList(); }
    private List<List<Object>> chartRows(List<ChartItem> items) { if (items == null) return List.of(); return items.stream().map(i -> row(i.getName(), i.getValue())).toList(); }
    /** List.of 不允许 null；导出的业务字段可为空，因此使用可空列表。 */
    private List<Object> row(Object... values) {
        List<Object> row = new ArrayList<>();
        Collections.addAll(row, values);
        return row;
    }
    private void setResponseHeaders(HttpServletResponse response, String fileName) { response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); response.setCharacterEncoding("UTF-8"); response.setHeader("Content-Disposition", "attachment; filename=" + URLEncoder.encode(fileName, StandardCharsets.UTF_8)); }
}
