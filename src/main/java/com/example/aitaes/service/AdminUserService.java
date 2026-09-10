package com.example.aitaes.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.dto.AdminUserCreateDTO;
import com.example.aitaes.dto.AdminUserUpdateDTO;
import com.example.aitaes.dto.AdminUserVO;

public interface AdminUserService {
    IPage<AdminUserVO> page(int pageNum, int pageSize, String keyword, String role);
    AdminUserVO create(AdminUserCreateDTO request);
    AdminUserVO update(Long id, AdminUserUpdateDTO request);
    void updateStatus(Long id, String status, Long operatorId);
    String resetPassword(Long id);
    void delete(Long id, Long operatorId);
}
