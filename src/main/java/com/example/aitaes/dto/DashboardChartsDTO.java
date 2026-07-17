package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 驾驶舱图表数据
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardChartsDTO {

    /** 成绩分布：key=分数段, value=人数 */
    private List<ChartItem> scoreDistribution;

    /** 成绩趋势：每次考核的平均分 */
    private List<ChartItem> scoreTrend;

    /** 考勤统计：key=状态(出勤/迟到/请假/缺勤), value=次数 */
    private List<ChartItem> attendanceStats;

    /** 作业提交统计：每次作业的提交情况 */
    private List<HomeworkSubmitStat> homeworkStats;

    /** 知识点掌握度雷达：key=知识点, value=班级平均掌握度 */
    private List<ChartItem> knowledgeRadar;

    /** 实验统计：每次实验的平均分、提交情况 */
    private List<ExperimentStat> experimentStats;
}
