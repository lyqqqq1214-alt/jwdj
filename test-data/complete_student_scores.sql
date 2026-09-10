-- ============================================================
-- AITAES 学生成绩补全脚本（complete_student_scores.sql）
--
-- 目标：保证单课程「计算机网络」(CS05102) 下每一名选课学生都拥有
--       作业成绩、测验成绩、期中成绩、期末成绩（考勤与实验已在
--       simulated_data.sql / rich_data.sql 中补齐，本脚本不动）。
--
-- 背景：migrate-to-single-course.sql 把操作系统/组成原理/算法等课程的
--       考核（assessment_id 2017~2035）合并进了 CS05102，导致本课出现
--       重复的「第X次作业/测验」，而本课自己的 9 个考核（第1~5次作业、
--       2次测验、期中、期末）几乎没有任何成绩记录。
--
-- 幂等：DELETE 对不存在行是空操作；INSERT 使用 NOT EXISTS 守卫，
--       可安全重复执行。
-- ============================================================

USE aitaes_db;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

SET @course_id := (SELECT id FROM t_course WHERE course_no = 'CS05102' AND deleted = 0 LIMIT 1);

-- ============================================================
-- Part 1: 清理合并进来的外来考核（操作系统/组成原理/算法遗留）
-- 只保留 CS05102 计算机网络自身的 9 个考核。
-- ============================================================
DELETE FROM t_assessment
WHERE course_id = @course_id
  AND assessment_name NOT IN (
      '第1次作业-网络层基础',
      '第2次作业-传输层',
      '第3次作业-应用层',
      '第4次作业-综合练习',
      '第5次作业-期末复习',
      '第1次测验-网络基础',
      '第2次测验-传输层',
      '期中考试',
      '期末考试'
  );

-- ============================================================
-- Part 2: 补齐「第1次作业-网络层基础」的元数据
-- （simulated_data.sql 未写入 assessment_date / status）
-- ============================================================
UPDATE t_assessment
SET assessment_date = '2025-09-10', status = 'PUBLISHED'
WHERE course_id = @course_id AND assessment_name = '第1次作业-网络层基础';

-- ============================================================
-- Part 3: 为全部选课学生补齐 9 个考核的成绩记录
--   * 成绩按学生 + 考核确定性地生成（可重复、稳定），范围大致 35~100；
--   * 已预置的 3 名预警学生（王小明/艾孜买提/焦彦博）保持低分（25~59）；
--   * 提交状态大多数为 ON_TIME，少量 LATE，预警学生部分 ABSENT。
-- ============================================================
INSERT INTO t_assessment_record
    (assessment_id, student_id, total_score, submit_status, weakest_kp, submit_time)
SELECT
    a.id,
    s.id,
    CASE
        WHEN s.student_no IN ('201826010123', '201826010130', '201826010125')
            THEN GREATEST(25.00, ROUND(30 + MOD(s.id * 11 + a.id * 7, 30), 1))
        ELSE LEAST(100.00, GREATEST(35.00, ROUND(58 + MOD(s.id * 37 + a.id * 13, 58), 1)))
    END,
    CASE
        WHEN s.student_no IN ('201826010130', '201826010125') AND a.assessment_no >= 4 THEN 'ABSENT'
        WHEN s.student_no = '201826010123' AND a.assessment_type IN ('MIDTERM', 'FINAL') THEN 'ABSENT'
        WHEN MOD(s.id + a.id, 20) = 0 THEN 'LATE'
        ELSE 'ON_TIME'
    END,
    NULL,
    TIMESTAMP(DATE_ADD(a.assessment_date, INTERVAL 1 DAY), '20:00:00')
FROM t_assessment a
JOIN t_course_student cs ON cs.course_id = a.course_id
JOIN t_student s        ON s.id = cs.student_id
WHERE a.course_id = @course_id
  AND a.assessment_name IN (
      '第1次作业-网络层基础',
      '第2次作业-传输层',
      '第3次作业-应用层',
      '第4次作业-综合练习',
      '第5次作业-期末复习',
      '第1次测验-网络基础',
      '第2次测验-传输层',
      '期中考试',
      '期末考试'
  )
  AND NOT EXISTS (
      SELECT 1 FROM t_assessment_record r
      WHERE r.assessment_id = a.id AND r.student_id = s.id
  );

SET FOREIGN_KEY_CHECKS = 1;
