package com.example.aitaes.service.impl;

import com.alibaba.excel.EasyExcel;
import com.example.aitaes.service.ExportService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

/**
 * Excel 导出服务实现
 */
@Slf4j
@Service
public class ExportServiceImpl implements ExportService {

    @Override
    public void exportCourse(Long courseId, HttpServletResponse response) throws IOException {
        setResponseHeaders(response, "课程评价_" + courseId + ".xlsx");
        EasyExcel.write(response.getOutputStream())
                .head(Collections.emptyList())
                .sheet("课程评价").doWrite(Collections.emptyList());
    }

    @Override
    public void exportTeacher(Long teacherId, HttpServletResponse response) throws IOException {
        setResponseHeaders(response, "教师评价_" + teacherId + ".xlsx");
        EasyExcel.write(response.getOutputStream())
                .head(Collections.emptyList())
                .sheet("教师评价").doWrite(Collections.emptyList());
    }

    @Override
    public void exportCollege(HttpServletResponse response) throws IOException {
        setResponseHeaders(response, "学院排名.xlsx");
        EasyExcel.write(response.getOutputStream())
                .head(Collections.emptyList())
                .sheet("学院排名").doWrite(Collections.emptyList());
    }

    @Override
    public void exportSemester(String semester, HttpServletResponse response) throws IOException {
        setResponseHeaders(response, "学期报告_" + semester + ".xlsx");
        EasyExcel.write(response.getOutputStream())
                .head(Collections.emptyList())
                .sheet("学期报告").doWrite(Collections.emptyList());
    }

    private void setResponseHeaders(HttpServletResponse response, String fileName) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Content-Disposition",
                "attachment; filename=" + URLEncoder.encode(fileName, StandardCharsets.UTF_8));
    }
}
