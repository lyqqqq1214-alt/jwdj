package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 通用图表数据项
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChartItem {

    private String name;
    private BigDecimal value;
    private String color;
}
