package com.example.aitaes.strategy;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.entity.Course;
import com.example.aitaes.mapper.CourseMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 课程解析器
 * <p>
 * 统一"确定导入数据归属课程"的逻辑，消除各策略中重复的文件名解析代码：
 * <ol>
 *   <li>优先使用 {@link ImportContext#getCourseId()}（前端课程选择器传入），按 ID 校验课程存在；</li>
 *   <li>回退：按文件名第一段（{课程编号}_...）查 t_course.course_no（向后兼容旧文件名约定）；</li>
 *   <li>均失败 → 返回 null，由策略返回 FAILED 结果。</li>
 * </ol>
 * 注意：显式传入 courseId 但课程不存在时不回退文件名解析（避免把数据导入错误课程），直接返回 null。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CourseResolver {

    /** 课程无法确定时的统一错误提示 */
    public static final String COURSE_NOT_FOUND_MSG =
            "无法确定归属课程：请在页面选择课程后重新上传（或将文件命名为 {课程编号}_类型_名称.xlsx）";

    private final CourseMapper courseMapper;

    /** 解析结果：课程 ID + 学期 */
    public record ResolvedCourse(Long courseId, String semester) {
    }

    /**
     * 解析导入目标课程，无法确定时返回 null
     */
    public ResolvedCourse resolve(ImportContext ctx) {
        if (ctx == null) {
            return null;
        }
        // 1. 显式参数优先
        if (ctx.getCourseId() != null) {
            Course course = courseMapper.selectById(ctx.getCourseId());
            if (course != null) {
                return new ResolvedCourse(course.getId(), course.getSemester());
            }
            log.warn("指定的课程不存在: courseId={}", ctx.getCourseId());
            return null;
        }
        // 2. 回退：文件名第一段为课程编号
        String filename = ctx.getOriginalFilename();
        if (filename == null) {
            return null;
        }
        String name = filename.replaceAll("(?i)\\.(xlsx|xls|csv)$", "");
        String[] parts = name.split("_");
        if (parts.length >= 2) {
            Course course = courseMapper.selectOne(
                    new LambdaQueryWrapper<Course>().eq(Course::getCourseNo, parts[0]));
            if (course != null) {
                log.info("从文件名解析课程: courseNo={}, courseId={}", parts[0], course.getId());
                return new ResolvedCourse(course.getId(), course.getSemester());
            }
            log.warn("未找到课程: courseNo={}", parts[0]);
        }
        return null;
    }
}
