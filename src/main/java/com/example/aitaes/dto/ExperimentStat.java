package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperimentStat {

    private String experimentName;

    private Integer experimentNo;

    private BigDecimal avgScore;

    private Integer submittedCount;

    private Integer totalCount;

    private BigDecimal submitRate;
}
