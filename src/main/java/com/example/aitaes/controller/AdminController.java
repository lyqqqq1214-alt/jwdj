package com.example.aitaes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.aitaes.annotation.RequireRole;
import com.example.aitaes.common.Result;
import com.example.aitaes.entity.Course;
import com.example.aitaes.entity.Student;
import com.example.aitaes.entity.Teacher;
import com.example.aitaes.entity.User;
import com.example.aitaes.mapper.CourseMapper;
import com.example.aitaes.mapper.CourseStudentMapper;
import com.example.aitaes.mapper.StudentMapper;
import com.example.aitaes.mapper.TeacherMapper;
import com.example.aitaes.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 管理员综合控制器：系统统计、课程管理、学生管理
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@RequireRole("ADMIN")
public class AdminController {

    private final CourseMapper courseMapper;
    private final StudentMapper studentMapper;
    private final TeacherMapper teacherMapper;
    private final UserMapper userMapper;
    private final CourseStudentMapper courseStudentMapper;

    /**
     * 系统总览统计
     */
    @GetMapping("/dashboard/stats")
    public Result<Map<String, Object>> dashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("teacherCount", teacherMapper.selectCount(null));
        stats.put("studentCount", studentMapper.selectCount(null));
        stats.put("courseCount", courseMapper.selectCount(null));
        stats.put("examCount", courseMapper.selectCount(null) > 0 ? 0 : 0);

        // 用户按角色统计
        List<User> allUsers = userMapper.selectList(null);
        long adminCount = allUsers.stream().filter(u -> "ADMIN".equals(u.getRole())).count();
        long teacherCount = allUsers.stream().filter(u -> "TEACHER".equals(u.getRole())).count();
        long assistantCount = allUsers.stream().filter(u -> "ASSISTANT".equals(u.getRole())).count();
        long studentUserCount = allUsers.stream().filter(u -> "STUDENT".equals(u.getRole())).count();
        stats.put("adminCount", adminCount);
        stats.put("teacherUserCount", teacherCount);
        stats.put("assistantCount", assistantCount);
        stats.put("studentUserCount", studentUserCount);

        // 活跃用户（最近7天登录）
        long activeCount = allUsers.stream()
                .filter(u -> u.getLastLoginTime() != null
                        && u.getLastLoginTime().isAfter(java.time.LocalDateTime.now().minusDays(7)))
                .count();
        stats.put("activeUserCount", activeCount);

        return Result.success(stats);
    }

    /**
     * 全部课程列表（管理员）
     */
    @GetMapping("/courses")
    public Result<IPage<Map<String, Object>>> listCourses(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String keyword) {
        LambdaQueryWrapper<Course> wrapper = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w.like(Course::getCourseName, keyword)
                    .or().like(Course::getCourseNo, keyword)
                    .or().like(Course::getClassName, keyword));
        }
        wrapper.orderByDesc(Course::getCreateTime);
        IPage<Course> page = courseMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);

        // 补充教师姓名和学生人数
        IPage<Map<String, Object>> result = page.convert(course -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", course.getId());
            m.put("courseNo", course.getCourseNo());
            m.put("courseName", course.getCourseName());
            m.put("className", course.getClassName());
            m.put("semester", course.getSemester());
            m.put("credit", course.getCredit());
            m.put("courseType", course.getCourseType());
            m.put("teacherId", course.getTeacherId());
            if (course.getTeacherId() != null) {
                Teacher t = teacherMapper.selectById(course.getTeacherId());
                m.put("teacherName", t != null ? t.getName() : null);
            }
            // 选课人数
            Long studentCount = courseStudentMapper.selectCount(
                    new LambdaQueryWrapper<com.example.aitaes.entity.CourseStudent>()
                            .eq(com.example.aitaes.entity.CourseStudent::getCourseId, course.getId()));
            m.put("studentCount", studentCount);
            return m;
        });
        return Result.success(result);
    }

    /**
     * 删除课程
     */
    @DeleteMapping("/courses/{id}")
    public Result<Void> deleteCourse(@PathVariable Long id) {
        courseMapper.deleteById(id);
        log.info("管理员删除课程: id={}", id);
        return Result.success("删除成功", null);
    }

    /**
     * 全部学生列表（管理员）
     */
    @GetMapping("/students")
    public Result<IPage<Map<String, Object>>> listStudents(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String keyword) {
        LambdaQueryWrapper<Student> wrapper = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w.like(Student::getName, keyword)
                    .or().like(Student::getStudentNo, keyword));
        }
        wrapper.orderByDesc(Student::getCreateTime);
        IPage<Student> page = studentMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);

        IPage<Map<String, Object>> result = page.convert(student -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", student.getId());
            m.put("studentNo", student.getStudentNo());
            m.put("name", student.getName());
            m.put("gender", student.getGender());
            m.put("college", student.getCollege());
            m.put("major", student.getMajor());
            m.put("className", student.getClassName());
            m.put("grade", student.getGrade());
            m.put("createTime", student.getCreateTime());
            // 关联用户状态
            if (student.getUserId() != null) {
                User u = userMapper.selectById(student.getUserId());
                m.put("status", u != null ? u.getStatus() : "ACTIVE");
            } else {
                m.put("status", "ACTIVE");
            }
            return m;
        });
        return Result.success(result);
    }

    /**
     * 删除学生（同时删除关联用户）
     */
    @DeleteMapping("/students/{id}")
    public Result<Void> deleteStudent(@PathVariable Long id) {
        Student student = studentMapper.selectById(id);
        if (student != null && student.getUserId() != null) {
            userMapper.deleteById(student.getUserId());
        }
        studentMapper.deleteById(id);
        log.info("管理员删除学生: id={}", id);
        return Result.success("删除成功", null);
    }
}
