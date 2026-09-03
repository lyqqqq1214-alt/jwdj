package com.example.aitaes.dto;

import lombok.Data;

/** 学生手动录入错题的请求。 */
@Data
public class ManualWrongQuestionRequest {
    /** 可不传；不传时保存到个人错题本测试课程。 */
    private Long courseId;
    private String question;
    /** 每行一个选项，可带 A. / B. 前缀。 */
    private String options;
    private String correctAnswer;
    private String studentAnswer;
    private String knowledgePoints;
    private String remark;
    /** MANUAL 或 AI_GENERATE。 */
    private String source;
}
