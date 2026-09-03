package com.example.aitaes.service;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Excel 导出服务接口
 */
public interface ExportService {

    /**
     * 导出课程评价 Excel
     */
    void exportCourse(Long courseId, HttpServletResponse response) throws IOException;

    /**
     * 导出教师评价 Excel
     */
    void exportTeacher(Long teacherId, HttpServletResponse response) throws IOException;

    /**
     * 导出学院排名 Excel
     */
    void exportCollege(HttpServletResponse response) throws IOException;

    /**
     * 导出学期全课程 Excel
     */
    void exportSemester(String semester, HttpServletResponse response) throws IOException;
}
