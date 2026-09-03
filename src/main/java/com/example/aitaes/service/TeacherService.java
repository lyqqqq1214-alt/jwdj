package com.example.aitaes.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.dto.TeacherCreateDTO;
import com.example.aitaes.dto.TeacherUpdateDTO;
import com.example.aitaes.dto.TeacherVO;

/**
 * 教师账号管理服务接口
 */
public interface TeacherService {

    /**
     * 分页搜索教师列表
     */
    IPage<TeacherVO> page(int pageNum, int pageSize, String keyword);

    /**
     * 教师详情
     */
    TeacherVO getById(Long id);

    /**
     * 手动添加教师（创建 t_user + t_teacher）
     */
    TeacherVO create(TeacherCreateDTO dto);

    /**
     * 编辑教师信息（工号不可修改）
     */
    TeacherVO update(Long id, TeacherUpdateDTO dto);

    /**
     * 删除教师（逻辑删除 teacher + 禁用 user）
     */
    void delete(Long id);

    /**
     * 禁用/启用教师账号
     */
    void updateStatus(Long id, String status);

    /**
     * 重置教师密码
     *
     * @return 新密码（明文，用于展示给管理员）
     */
    String resetPassword(Long id);
}
