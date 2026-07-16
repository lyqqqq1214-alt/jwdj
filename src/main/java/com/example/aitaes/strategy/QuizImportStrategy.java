package com.example.aitaes.strategy;

import com.example.aitaes.enums.ImportType;
import com.example.aitaes.mapper.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 测验成绩导入策略
 * <p>
 * 继承 {@link AbstractAssessmentImportStrategy}，assessment_type = QUIZ。
 * Excel 格式与作业成绩相同。
 * <p>
 * 课程与考核名称优先来自页面参数，回退文件名格式：{课程编号}_QUIZ_{考核名称}.xlsx
 * 如：CS-NET-001_QUIZ_第1次测验.xlsx
 */
@Slf4j
@Component
public class QuizImportStrategy extends AbstractAssessmentImportStrategy {

    public QuizImportStrategy(AssessmentMapper assessmentMapper,
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
        return ImportType.QUIZ;
    }
}
