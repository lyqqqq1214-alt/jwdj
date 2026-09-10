package com.example.aitaes.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.annotation.RequireRole;
import com.example.aitaes.common.Result;
import com.example.aitaes.dto.AdminUserCreateDTO;
import com.example.aitaes.dto.AdminUserUpdateDTO;
import com.example.aitaes.dto.AdminUserVO;
import com.example.aitaes.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequireRole("ADMIN")
@RequiredArgsConstructor
public class AdminUserController {
    private final AdminUserService adminUserService;

    @GetMapping
    public Result<IPage<AdminUserVO>> page(@RequestParam(defaultValue = "1") int pageNum,
                                            @RequestParam(defaultValue = "20") int pageSize,
                                            @RequestParam(required = false) String keyword,
                                            @RequestParam(required = false) String role) {
        return Result.success(adminUserService.page(pageNum, pageSize, keyword, role));
    }

    @PostMapping
    public Result<AdminUserVO> create(@Valid @RequestBody AdminUserCreateDTO request) {
        return Result.success("用户创建成功", adminUserService.create(request));
    }

    @PutMapping("/{id}")
    public Result<AdminUserVO> update(@PathVariable Long id, @Valid @RequestBody AdminUserUpdateDTO request) {
        return Result.success("用户信息已更新", adminUserService.update(id, request));
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestAttribute("userId") Long operatorId,
                                     @RequestBody Map<String, String> body) {
        adminUserService.updateStatus(id, body.get("status"), operatorId);
        return Result.success("账号状态已更新", null);
    }

    @PutMapping("/{id}/reset-password")
    public Result<Map<String, String>> resetPassword(@PathVariable Long id) {
        return Result.success("密码重置成功", Map.of("newPassword", adminUserService.resetPassword(id)));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id, @RequestAttribute("userId") Long operatorId) {
        adminUserService.delete(id, operatorId);
        return Result.success("用户已删除", null);
    }
}
