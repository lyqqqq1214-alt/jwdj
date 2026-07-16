package com.example.aitaes.strategy;

import com.example.aitaes.enums.ImportType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 导入上下文参数对象
 * <p>
 * 承载一次导入请求的所有输入参数，替代原先仅传文件名的方式。
 * 前端显式传入的参数（courseId / assessmentName / assessmentType）优先级
 * 高于文件名约定解析（文件名解析仅作为向后兼容的回退路径）。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportContext {

    /** 导入类型 */
    private ImportType importType;

    /** 上传文件的原始文件名（用于格式推断与文件名约定回退解析） */
    private String originalFilename;

    /** 目标课程 ID（前端课程选择器传入，优先于文件名解析） */
    private Long courseId;

    /** 考核名称（成绩类导入：HOMEWORK/QUIZ/EXAM_SCORE） */
    private String assessmentName;

    /** 考核类型（仅 EXAM_SCORE 使用：MIDTERM / FINAL） */
    private String assessmentType;

    /** 数据源 ID（可选，用于追踪来源） */
    private Long sourceId;
}
