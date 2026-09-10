package com.example.aitaes.service;

import com.example.aitaes.dto.ClassCreateDTO;
import com.example.aitaes.dto.ClassVO;
import com.example.aitaes.dto.StudentAddDTO;
import com.example.aitaes.dto.StudentVO;

import java.util.List;

/**
 * 班级管理服务接口
 */
public interface ClassService {

    /**
     * 获取当前教师所带班级列表
     */
    List<ClassVO> listMyClasses(Long userId);

    /**
     * 新增班级（创建课程）
     */
    ClassVO create(Long userId, ClassCreateDTO dto);

    /**
     * 编辑班级信息
     */
    ClassVO update(Long classId, Long userId, ClassCreateDTO dto);

    /**
     * 删除班级
     */
    void delete(Long classId, Long userId);

    /**
     * 获取班级学生名单
     *
     * @param classId   课程ID（班级归属的课程）
     * @param className 班级名（可选，按 t_course_student.class_name 过滤）
     * @param keyword   学号/姓名搜索关键字
     */
    List<StudentVO> listStudents(Long classId, String className, String keyword);

    /**
     * 手动添加学生
     */
    StudentVO addStudent(Long classId, Long userId, StudentAddDTO dto);

    /**
     * 移除学生（仅移除关联，不删除账号）
     */
    void removeStudent(Long classId, Long studentId, Long userId);

    /**
     * 批量导入学生名单
     */
    List<StudentVO> batchImportStudents(Long classId, Long userId, java.io.InputStream inputStream, String filename);
}
