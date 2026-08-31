package com.example.aitaes.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 主观题逐题批阅请求
 */
@Data
public class GradeRequestDTO {

    @NotNull(message = "分数不能为空")
    private BigDecimal score;

    /** 评语 */
    private String comment;
}
