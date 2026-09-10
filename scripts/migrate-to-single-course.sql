-- ============================================================================
-- 一次性数据迁移：本项目只保留「计算机网络」(CS05102) 一门课
--
-- 把其它课程底下的业务数据全部改挂到 CS05102：
--   * 有课程级唯一约束的表：先删「与目标课程撞键」的行、再删「其他课程之间互相撞键」的行（保留最小 id），最后改挂；
--   * 无课程级唯一约束的表：直接改挂；
--   * 多态引用 t_ai_analysis_result(target_type='COURSE')：target_id 改挂；
--   * 最后删除其它课程记录（数据已全部改挂，外键级联不再有子行）。
--
-- 冲突策略：保留目标课程已有数据，其余跳过（丢弃）。
--
-- 运行方式（MySQL）：
--   先备份：mysqldump -uroot -p1234 aitaes_db > backup_before_migrate.sql
--   执行：  mysql -uroot -p1234 aitaes_db < scripts/migrate-to-single-course.sql
-- ============================================================================

-- 目标课程 ID。若 CS05102 不存在则 @target 为 NULL，下方 <> NULL 均不匹配，整脚本空跑（安全）。
SET @target := (SELECT id FROM t_course WHERE course_no = 'CS05102' AND deleted = 0 LIMIT 1);

-- 执行前可先确认目标课程：
-- SELECT id, course_no, course_name FROM t_course WHERE id = @target;

-- ============================================================================
-- 1. 有课程级唯一约束的表：删冲突(保留目标) -> 删其他课互相冲突(留最小id) -> 改挂
-- ============================================================================

-- 1.1 选课关联 t_course_student (uk_course_student: course_id, student_id)
DELETE a FROM t_course_student a
    JOIN t_course_student b ON a.student_id = b.student_id AND b.course_id = @target
    WHERE a.course_id <> @target;
DELETE a FROM t_course_student a
    JOIN t_course_student b ON a.student_id = b.student_id AND b.course_id <> @target AND a.id > b.id
    WHERE a.course_id <> @target;
UPDATE t_course_student SET course_id = @target WHERE course_id <> @target;

-- 1.2 助教权限 t_assistant_permission (uk_assistant_course: assistant_id, course_id)
DELETE a FROM t_assistant_permission a
    JOIN t_assistant_permission b ON a.assistant_id = b.assistant_id AND b.course_id = @target
    WHERE a.course_id <> @target;
DELETE a FROM t_assistant_permission a
    JOIN t_assistant_permission b ON a.assistant_id = b.assistant_id AND b.course_id <> @target AND a.id > b.id
    WHERE a.course_id <> @target;
UPDATE t_assistant_permission SET course_id = @target WHERE course_id <> @target;

-- 1.3 知识点 t_knowledge_point (uk_course_kp: course_id, kp_name)
DELETE a FROM t_knowledge_point a
    JOIN t_knowledge_point b ON a.kp_name = b.kp_name AND b.course_id = @target
    WHERE a.course_id <> @target;
DELETE a FROM t_knowledge_point a
    JOIN t_knowledge_point b ON a.kp_name = b.kp_name AND b.course_id <> @target AND a.id > b.id
    WHERE a.course_id <> @target;
UPDATE t_knowledge_point SET course_id = @target WHERE course_id <> @target;

-- 1.4 考核 t_assessment (uk_course_assessment: course_id, assessment_name)
DELETE a FROM t_assessment a
    JOIN t_assessment b ON a.assessment_name = b.assessment_name AND b.course_id = @target
    WHERE a.course_id <> @target;
DELETE a FROM t_assessment a
    JOIN t_assessment b ON a.assessment_name = b.assessment_name AND b.course_id <> @target AND a.id > b.id
    WHERE a.course_id <> @target;
UPDATE t_assessment SET course_id = @target WHERE course_id <> @target;

-- 1.5 学生知识点掌握度 t_student_kp_mastery (uk_student_kp: student_id, course_id, kp_name)
DELETE a FROM t_student_kp_mastery a
    JOIN t_student_kp_mastery b
        ON a.student_id = b.student_id AND a.kp_name = b.kp_name AND b.course_id = @target
    WHERE a.course_id <> @target;
DELETE a FROM t_student_kp_mastery a
    JOIN t_student_kp_mastery b
        ON a.student_id = b.student_id AND a.kp_name = b.kp_name AND b.course_id <> @target AND a.id > b.id
    WHERE a.course_id <> @target;
UPDATE t_student_kp_mastery SET course_id = @target WHERE course_id <> @target;

-- 1.6 考勤 t_attendance (uk_attendance: course_id, student_id, attendance_date)
DELETE a FROM t_attendance a
    JOIN t_attendance b
        ON a.student_id = b.student_id AND a.attendance_date = b.attendance_date AND b.course_id = @target
    WHERE a.course_id <> @target;
DELETE a FROM t_attendance a
    JOIN t_attendance b
        ON a.student_id = b.student_id AND a.attendance_date = b.attendance_date AND b.course_id <> @target AND a.id > b.id
    WHERE a.course_id <> @target;
UPDATE t_attendance SET course_id = @target WHERE course_id <> @target;

-- ============================================================================
-- 2. 无课程级唯一约束的表：直接改挂
-- ============================================================================
UPDATE t_experiment             SET course_id = @target WHERE course_id <> @target;
UPDATE t_exam_paper             SET course_id = @target WHERE course_id <> @target;
UPDATE t_question_bank          SET course_id = @target WHERE course_id <> @target;
UPDATE t_student_wrong_question SET course_id = @target WHERE course_id <> @target;
UPDATE t_warning_record         SET course_id = @target WHERE course_id <> @target;
-- 通知：仅 COURSE 范围的行有 course_id（可空）
UPDATE t_notification           SET course_id = @target WHERE course_id IS NOT NULL AND course_id <> @target;

-- ============================================================================
-- 3. 多态引用：AI 分析结果中指向课程的行
-- ============================================================================
UPDATE t_ai_analysis_result SET target_id = @target
    WHERE target_type = 'COURSE' AND target_id <> @target;

-- ============================================================================
-- 4. 删除其它课程（此时已无子行引用，级联为空）
-- ============================================================================
DELETE FROM t_course WHERE id <> @target;
