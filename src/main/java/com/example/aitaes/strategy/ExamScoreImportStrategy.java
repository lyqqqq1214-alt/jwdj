package com.example.aitaes.strategy;

import com.example.aitaes.enums.ImportType;
import com.example.aitaes.mapper.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 考试成绩导入策略（期中/期末）
 * <p>
 * 继承 {@link AbstractAssessmentImportStrategy}，assessment_type = MIDTERM 或 FINAL。
 * 考核类型优先来自页面参数（{@link ImportContext#getAssessmentType()}），
 * 回退文件名解析；两者均无法确定时返回 FAILED。
 * <p>
 * 兼容的文件名格式：
 * <ul>
 *   <li>{课程编号}_MIDTERM_{名称}.xlsx / {课程编号}_FINAL_{名称}.xlsx</li>
 *   <li>{课程编号}_EXAM_SCORE[_MIDTERM|_FINAL]_{名称}.xlsx（EXAM_SCORE 本身含下划线，占两段）</li>
 * </ul>
 */
@Slf4j
@Component
public class ExamScoreImportStrategy extends AbstractAssessmentImportStrategy {

    public ExamScoreImportStrategy(AssessmentMapper assessmentMapper,
                                    AssessmentRecordMapper recordMapper,
                                    RecordKpDeductionMapper deductionMapper,
                                    StudentMapper studentMapper,
                                    CourseMapper courseMapper,
                                    StudentKpMasteryMapper masteryMapper,
                                    CourseResolver courseResolver) {
        super(assessmentMapper, recordMapper, deductionMapper,
                studentMapper, courseMapper, masteryMapper, courseResolver);
    }

    @Override
    public ImportType getSupportedType() {
        return ImportType.EXAM_SCORE;
    }

    @Override
    protected void resolveAssessmentInfo(ImportContext ctx, AssessmentSession session) {
        // 1. 页面参数优先（MIDTERM / FINAL）
        if (ctx.getAssessmentType() != null) {
            String type = ctx.getAssessmentType().trim().toUpperCase();
            if ("MIDTERM".equals(type) || "FINAL".equals(type)) {
                session.assessmentType = type;
            }
        }

        // 2. 文件名约定回退
        String[] parts = splitFilename(ctx.getOriginalFilename());
        if (parts == null || parts.length < 3) {
            return;
        }
        if ("MIDTERM".equalsIgnoreCase(parts[1]) || "FINAL".equalsIgnoreCase(parts[1])) {
            // {课程编号}_MIDTERM_{名称}.xlsx
            if (session.assessmentType == null) {
                session.assessmentType = parts[1].toUpperCase();
            }
            if (session.assessmentName == null) {
                session.assessmentName = parts[2];
            }
        } else if ("EXAM".equalsIgnoreCase(parts[1]) && "SCORE".equalsIgnoreCase(parts[2])) {
            // {课程编号}_EXAM_SCORE[_MIDTERM|_FINAL]_{名称}.xlsx
            if (parts.length >= 4
                    && ("MIDTERM".equalsIgnoreCase(parts[3]) || "FINAL".equalsIgnoreCase(parts[3]))) {
                if (session.assessmentType == null) {
                    session.assessmentType = parts[3].toUpperCase();
                }
                if (session.assessmentName == null) {
                    session.assessmentName = parts.length >= 5 ? parts[4] : parts[3];
                }
            } else {
                if (session.assessmentType == null) {
                    session.assessmentType = "MIDTERM";
                }
                if (session.assessmentName == null) {
                    session.assessmentName = parts.length >= 4 ? parts[3] : "考试成绩";
                }
            }
            log.info("解析考试成绩文件名: courseNo={}, type={}, name={}",
                    parts[0], session.assessmentType, session.assessmentName);
        }
    }
}
