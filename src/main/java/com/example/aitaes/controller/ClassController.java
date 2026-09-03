package com.example.aitaes.controller;

import com.example.aitaes.annotation.RequireRole;
import com.example.aitaes.common.Result;
import com.example.aitaes.dto.ClassCreateDTO;
import com.example.aitaes.dto.ClassVO;
import com.example.aitaes.dto.StudentAddDTO;
import com.example.aitaes.dto.StudentVO;
import com.example.aitaes.service.ClassService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * 班级管理控制器（教师/助教）
 */
@Slf4j
@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
@RequireRole({"TEACHER", "ASSISTANT"})
public class ClassController {

    private final ClassService classService;

    /**
     * 获取当前教师所带班级列表
     */
    @GetMapping
    public Result<List<ClassVO>> list(@RequestAttribute("userId") Long userId) {
        return Result.success(classService.listMyClasses(userId));
    }

    /**
     * 新增班级
     */
    @PostMapping
    public Result<ClassVO> create(@RequestAttribute("userId") Long userId,
                                  @Valid @RequestBody ClassCreateDTO dto) {
        return Result.success("班级创建成功", classService.create(userId, dto));
    }

    /**
     * 编辑班级信息
     */
    @PutMapping("/{id}")
    public Result<ClassVO> update(@PathVariable Long id,
                                  @RequestAttribute("userId") Long userId,
                                  @Valid @RequestBody ClassCreateDTO dto) {
        return Result.success("班级信息更新成功", classService.update(id, userId, dto));
    }

    /**
     * 删除班级
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id,
                               @RequestAttribute("userId") Long userId) {
        classService.delete(id, userId);
        return Result.success("班级已删除", null);
    }

    // ===== 学生名单管理 =====

    /**
     * 获取班级学生名单
     */
    @GetMapping("/{id}/students")
    public Result<List<StudentVO>> listStudents(@PathVariable Long id,
                                                 @RequestParam(required = false) String keyword) {
        return Result.success(classService.listStudents(id, keyword));
    }

    /**
     * 手动添加学生
     */
    @PostMapping("/{id}/students")
    public Result<StudentVO> addStudent(@PathVariable Long id,
                                        @RequestAttribute("userId") Long userId,
                                        @Valid @RequestBody StudentAddDTO dto) {
        return Result.success("学生添加成功", classService.addStudent(id, userId, dto));
    }

    /**
     * 批量导入学生名单
     */
    @PostMapping("/{id}/students/batch-import")
    public Result<List<StudentVO>> batchImport(@PathVariable Long id,
                                                @RequestAttribute("userId") Long userId,
                                                @RequestParam("file") MultipartFile file) throws IOException {
        List<StudentVO> results = classService.batchImportStudents(
                id, userId, file.getInputStream(), file.getOriginalFilename());
        return Result.success("导入完成，共 " + results.size() + " 名学生", results);
    }

    /**
     * 移除学生
     */
    @DeleteMapping("/{id}/students/{studentId}")
    public Result<Void> removeStudent(@PathVariable Long id,
                                       @PathVariable Long studentId,
                                       @RequestAttribute("userId") Long userId) {
        classService.removeStudent(id, studentId, userId);
        return Result.success("学生已移除", null);
    }
}
