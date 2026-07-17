package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 考勤记录实体
 */
@Data
@TableName("t_attendance")
public class Attendance {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 课程ID */
    private Long courseId;

    /** 学生ID */
    private Long studentId;

    /** 日期 */
    private LocalDate attendanceDate;

    /** 状态：出勤/迟到/请假/缺勤 */
    private String status;

    /** 第几周 */
    private Integer weekNo;

    /** 节次（如"第1-2节"） */
    private String period;

    /** 学期 */
    private String semester;

    /** 备注 */
    private String remark;

    private LocalDateTime createTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
