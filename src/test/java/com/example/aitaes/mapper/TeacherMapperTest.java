package com.example.aitaes.mapper;

import com.example.aitaes.entity.Teacher;
import com.example.aitaes.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * DAO 层集成测试 — 验证 MyBatis Plus SQL 映射正确性
 *
 * 使用 H2 内存数据库，无需 MySQL
 * @Sql 在每个测试前加载测试数据
 */
@SpringBootTest
@ActiveProfiles("test")
@Sql(scripts = {"/schema-h2.sql", "/test-data.sql"})
@DisplayName("TeacherMapper 集成测试")
class TeacherMapperTest {

    @Autowired
    private TeacherMapper teacherMapper;

    @Autowired
    private UserMapper userMapper;

    @Test
    @DisplayName("查询全部教师 → 返回测试数据中的 2 条")
    void shouldFindAllTeachers() {
        List<Teacher> teachers = teacherMapper.selectList(null);

        assertNotNull(teachers);
        assertEquals(2, teachers.size());
    }

    @Test
    @DisplayName("按工号查询 → 返回唯一教师")
    void shouldFindByTeacherNo() {
        Teacher teacher = teacherMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Teacher>()
                        .eq(Teacher::getTeacherNo, "T001")
        ).stream().findFirst().orElse(null);

        assertNotNull(teacher);
        assertEquals("张建国", teacher.getName());
        assertEquals("计算机学院", teacher.getCollege());
        assertEquals("教授", teacher.getTitle());
    }

    @Test
    @DisplayName("查询不存在的工号 → 返回 null")
    void shouldReturnNull_WhenTeacherNoNotExists() {
        Teacher teacher = teacherMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Teacher>()
                        .eq(Teacher::getTeacherNo, "T999")
        ).stream().findFirst().orElse(null);

        assertNull(teacher);
    }

    @Test
    @DisplayName("插入新教师 → 可查询到")
    void shouldInsertAndQuery() {
        // 先创建 t_user 账号
        User user = new User();
        user.setUsername("T003");
        user.setPassword("$2a$10$dummy");
        user.setRole("TEACHER");
        userMapper.insert(user);

        Teacher newTeacher = new Teacher();
        newTeacher.setUserId(user.getId());
        newTeacher.setTeacherNo("T003");
        newTeacher.setName("测试教师");
        newTeacher.setCollege("测试学院");
        newTeacher.setTitle("讲师");

        int rows = teacherMapper.insert(newTeacher);
        assertEquals(1, rows);
        assertNotNull(newTeacher.getId(), "插入后应自动回填 ID");

        // 查询验证
        Teacher found = teacherMapper.selectById(newTeacher.getId());
        assertNotNull(found);
        assertEquals("测试教师", found.getName());
    }

    @Test
    @DisplayName("按学院查询 → 返回该学院教师")
    void shouldFindByCollege() {
        List<Teacher> csTeachers = teacherMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Teacher>()
                        .eq(Teacher::getCollege, "计算机学院")
        );

        assertEquals(2, csTeachers.size());
    }
}
