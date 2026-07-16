package com.example.aitaes.strategy;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.entity.Course;
import com.example.aitaes.enums.ImportType;
import com.example.aitaes.mapper.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 考试成绩导入策略（期中/期末）
 * <p>
 * 继承 {@link AbstractAssessmentImportStrategy}，assessment_type = MIDTERM 或 FINAL
 * （由文件名第二段决定）。
 * <p>
 * Excel 格式与作业成绩相同。
 * 文件名格式：{课程编号}_EXAM_SCORE_{描述}.xlsx
 * 如：CS-NET-001_EXAM_SCORE_期中考试.xlsx
 */
@Slf4j
@Component
public class ExamScoreImportStrategy extends AbstractAssessmentImportStrategy {

    public ExamScoreImportStrategy(AssessmentMapper assessmentMapper,
                                    AssessmentRecordMapper recordMapper,
                                    RecordKpDeductionMapper deductionMapper,
                                    StudentMapper studentMapper,
                                    CourseMapper courseMapper,
                                    StudentKpMasteryMapper masteryMapper) {
        super(assessmentMapper, recordMapper, deductionMapper,
                studentMapper, courseMapper, masteryMapper);
    }

    @Override
    public ImportType getSupportedType() {
        return ImportType.EXAM_SCORE;
    }

    @Override
    protected void parseFileName(String filename) {
        // 先调用基类解析（兼容 {课程编号}_MIDTERM_{名称}.xlsx / {课程编号}_FINAL_{名称}.xlsx）
        super.parseFileName(filename);
        // EXAM_SCORE 文件名格式：{课程编号}_EXAM_SCORE[_MIDTERM|_FINAL]_{名称}.xlsx
        // 注意 "EXAM_SCORE" 本身含下划线，按 "_" 切分后占 parts[1] 和 parts[2] 两段
        if (assessmentType == null && filename != null) {
            String name = filename.replaceAll("(?i)\\.(xlsx|xls|csv)$", "");
            String[] parts = name.split("_");
            if (parts.length >= 3
                    && "EXAM".equalsIgnoreCase(parts[1])
                    && "SCORE".equalsIgnoreCase(parts[2])) {
                // 基类未能识别 EXAM_SCORE 段，需在此补课程查找
                if (this.courseId == null) {
                    Course course = courseMapper.selectOne(
                            new LambdaQueryWrapper<Course>().eq(Course::getCourseNo, parts[0]));
                    if (course != null) {
                        this.courseId = course.getId();
                        this.semester = course.getSemester();
                    }
                }
                // 第四段可作为 assessmentType（MIDTERM/FINAL）
                if (parts.length >= 4
                        && ("MIDTERM".equalsIgnoreCase(parts[3]) || "FINAL".equalsIgnoreCase(parts[3]))) {
                    this.assessmentType = parts[3].toUpperCase();
                    this.assessmentName = parts.length >= 5 ? parts[4] : parts[3];
                } else {
                    this.assessmentType = "MIDTERM";
                    this.assessmentName = parts.length >= 4 ? parts[3] : "考试成绩";
                }
                log.info("解析考试成绩文件名: courseNo={}, type={}, name={}",
                        parts[0], assessmentType, assessmentName);
            }
        }
    }
}
