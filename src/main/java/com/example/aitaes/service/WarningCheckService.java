package com.example.aitaes.service;

/**
 * 预警检查服务接口
 * <p>
 * 根据预警规则自动检查学生数据，生成预警记录
 */
public interface WarningCheckService {

    /**
     * 检查指定课程的所有学生，生成预警记录
     *
     * @param courseId 课程ID
     * @return 新增预警记录数
     */
    int checkAndGenerateWarnings(Long courseId);

    /**
     * 检查指定课程中指定学生的预警情况
     *
     * @param courseId  课程ID
     * @param studentId 学生ID
     */
    void checkStudentWarnings(Long courseId, Long studentId);
}
