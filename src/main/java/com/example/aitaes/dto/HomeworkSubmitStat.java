package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 作业提交统计
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomeworkSubmitStat {

    /** 作业名称 */
    private String homeworkName;

    /** 按时提交数 */
    private Integer onTimeCount;

    /** 迟交数 */
    private Integer lateCount;

    /** 未交数 */
    private Integer absentCount;
}
