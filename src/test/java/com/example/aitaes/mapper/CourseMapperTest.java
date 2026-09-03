package com.example.aitaes.mapper;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.entity.Course;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * CourseMapper 集成测试 — 验证课程表 SQL 映射
 */
@SpringBootTest
@ActiveProfiles("test")
@Sql(scripts = {"/schema-h2.sql", "/test-data.sql"})
@DisplayName("CourseMapper 集成测试")
class CourseMapperTest {

    @Autowired
    private CourseMapper courseMapper;

    @Test
    @DisplayName("查询全部课程 → 返回测试数据中的记录")
    void shouldFindAllCourses() {
        List<Course> courses = courseMapper.selectList(null);

        assertNotNull(courses);
        assertTrue(courses.size() >= 2, "测试数据应有至少 2 门课程");
    }

    @Test
    @DisplayName("按教师 ID 查询 → 返回该教师全部课程")
    void shouldFindByTeacherId() {
        List<Course> courses = courseMapper.selectList(
                new LambdaQueryWrapper<Course>()
                        .eq(Course::getTeacherId, 1L)
        );

        assertNotNull(courses);
        assertFalse(courses.isEmpty(), "教师 1 应有课程");
        courses.forEach(c -> assertEquals(1L, c.getTeacherId()));
    }

    @Test
    @DisplayName("按学期过滤 → 返回该学期课程")
    void shouldFilterBySemester() {
        List<Course> courses = courseMapper.selectList(
                new LambdaQueryWrapper<Course>()
                        .eq(Course::getSemester, "2025-2026-1")
        );

        assertNotNull(courses);
        assertFalse(courses.isEmpty());
    }

    @Test
    @DisplayName("插入新课程 → 可查询到")
    void shouldInsertAndQuery() {
        Course course = new Course();
        course.setCourseNo("CS999");
        course.setCourseName("测试课程");
        course.setTeacherId(1L);
        course.setSemester("2025-2026-2");
        course.setCredit(java.math.BigDecimal.valueOf(3));

        int rows = courseMapper.insert(course);
        assertEquals(1, rows);
        assertNotNull(course.getId(), "插入后应自动回填 ID");

        Course found = courseMapper.selectById(course.getId());
        assertNotNull(found);
        assertEquals("测试课程", found.getCourseName());
        assertEquals("2025-2026-2", found.getSemester());
    }
}
