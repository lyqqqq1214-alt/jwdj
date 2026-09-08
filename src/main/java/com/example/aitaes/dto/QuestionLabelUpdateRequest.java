package com.example.aitaes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/** 题库题目的知识点与难度双维标注更新请求。 */
@Data
public class QuestionLabelUpdateRequest {

    /** 一级模块/二级知识点，多个标签以逗号分隔，最多三个。 */
    @NotBlank(message = "知识点不能为空")
    private String knowledgePoints;

    @NotBlank(message = "难度不能为空")
    @Pattern(regexp = "EASY|MEDIUM|HARD", message = "难度只能是EASY、MEDIUM或HARD")
    private String difficulty;
}
