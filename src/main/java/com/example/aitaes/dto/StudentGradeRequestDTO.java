package com.example.aitaes.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 按学生整卷批阅请求
 */
@Data
public class StudentGradeRequestDTO {

    @NotNull(message = "批阅列表不能为空")
    private List<GradeItem> grades;

    @Data
    public static class GradeItem {
        private Long answerId;
        private BigDecimal score;
        private String comment;
    }
}
