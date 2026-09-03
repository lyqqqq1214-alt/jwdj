package com.example.aitaes.mapper;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.entity.Student;
import com.example.aitaes.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * StudentMapper 集成测试 — 验证学生表 SQL 映射及 t_user 关联
 */
@SpringBootTest
@ActiveProfiles("test")
@Sql(scripts = {"/schema-h2.sql", "/test-data.sql"})
@DisplayName("StudentMapper 集成测试")
class StudentMapperTest {

    @Autowired
    private StudentMapper studentMapper;

    @Autowired
    private UserMapper userMapper;

    @Test
    @DisplayName("查询全部学生 → 返回测试数据")
    void shouldFindAllStudents() {
        List<Student> students = studentMapper.selectList(null);

        assertNotNull(students);
        assertTrue(students.size() >= 3, "测试数据应有至少 3 名学生");
    }

    @Test
    @DisplayName("按学号查询 → 返回唯一学生")
    void shouldFindByStudentNo() {
        Student student = studentMapper.selectList(
                new LambdaQueryWrapper<Student>()
                        .eq(Student::getStudentNo, "S2024001")
        ).stream().findFirst().orElse(null);

        assertNotNull(student);
        assertEquals("赵小明", student.getName());
    }

    @Test
    @DisplayName("查询不存在的学号 → 返回 null")
    void shouldReturnNull_WhenStudentNoNotExists() {
        Student student = studentMapper.selectList(
                new LambdaQueryWrapper<Student>()
                        .eq(Student::getStudentNo, "S999")
        ).stream().findFirst().orElse(null);

        assertNull(student);
    }

    @Test
    @DisplayName("关联 t_user 插入 → user_id 正确关联")
    void shouldInsertWithUserAssociation() {
        // 先创建用户
        User user = new User();
        user.setUsername("S999");
        user.setPassword("$2a$10$dummy");
        user.setRole("STUDENT");
        userMapper.insert(user);

        // 再创建学生
        Student student = new Student();
        student.setUserId(user.getId());
        student.setStudentNo("S999");
        student.setName("测试学生");
        student.setCollege("计算机学院");
        student.setMajor("软件工程");

        int rows = studentMapper.insert(student);
        assertEquals(1, rows);
        assertNotNull(student.getId());

        // 验证关联
        Student found = studentMapper.selectById(student.getId());
        assertNotNull(found);
        assertEquals(user.getId(), found.getUserId());
    }
}
