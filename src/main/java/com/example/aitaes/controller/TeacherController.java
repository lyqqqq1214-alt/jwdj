package com.example.aitaes.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.annotation.RequireRole;
import com.example.aitaes.common.Result;
import com.example.aitaes.dto.TeacherCreateDTO;
import com.example.aitaes.dto.TeacherUpdateDTO;
import com.example.aitaes.dto.TeacherVO;
import com.example.aitaes.service.TeacherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 教师账号管理控制器（仅系统管理员可访问）
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/teachers")
@RequiredArgsConstructor
@RequireRole("ADMIN")
public class TeacherController {

    private final TeacherService teacherService;

    /**
     * 分页搜索教师列表
     */
    @GetMapping
    public Result<IPage<TeacherVO>> list(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String keyword) {
        return Result.success(teacherService.page(pageNum, pageSize, keyword));
    }

    /**
     * 教师详情
     */
    @GetMapping("/{id}")
    public Result<TeacherVO> getById(@PathVariable Long id) {
        return Result.success(teacherService.getById(id));
    }

    /**
     * 手动添加教师
     */
    @PostMapping
    public Result<TeacherVO> create(@Valid @RequestBody TeacherCreateDTO dto) {
        return Result.success("教师添加成功", teacherService.create(dto));
    }

    /**
     * 编辑教师信息
     */
    @PutMapping("/{id}")
    public Result<TeacherVO> update(@PathVariable Long id,
                                    @Valid @RequestBody TeacherUpdateDTO dto) {
        return Result.success("教师信息更新成功", teacherService.update(id, dto));
    }

    /**
     * 删除教师（逻辑删除）
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        teacherService.delete(id);
        return Result.success("教师删除成功", null);
    }

    /**
     * 禁用/启用教师账号
     */
    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id,
                                     @RequestBody Map<String, String> body) {
        String status = body.get("status");
        teacherService.updateStatus(id, status);
        return Result.success("ACTIVE".equals(status) ? "账号已启用" : "账号已禁用", null);
    }

    /**
     * 重置密码
     */
    @PutMapping("/{id}/reset-password")
    public Result<Map<String, String>> resetPassword(@PathVariable Long id) {
        String newPassword = teacherService.resetPassword(id);
        return Result.success("密码重置成功", Map.of("newPassword", newPassword));
    }
}
