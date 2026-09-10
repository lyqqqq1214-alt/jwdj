-- ============================================================
-- AITAES v3.0 数据补充脚本（enrich_data.sql）
-- 目的：保证每张业务表至少有 10 条数据（演示/测试更饱满）
--
-- 执行顺序依赖：必须放在 init.sql、simulated_data.sql、
-- question_bank_seed.sql 之后执行（init-db.bat 中为第 5 步）。
-- 原因：本脚本的试卷题目、考试作答等要引用题库 t_question_bank 的数据。
--
-- 幂等说明：脚本整体使用 INSERT IGNORE / ON DUPLICATE + NOT EXISTS 守卫，
-- 可在「一键重建」流程中安全重复执行（init.sql 会先 DROP 重建）。
-- ============================================================

USE aitaes_db;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 统一密码哈希（= 明文 123456，与 init.sql 保持一致）
-- 实际 hash 直接在每条 INSERT 中写出，避免 MySQL 变量拼接。

-- ============================================================
-- Part 1: 教师（t_user + t_teacher）—— 2 → 10
-- ============================================================
INSERT IGNORE INTO t_user (username, password, role, first_login) VALUES
('T00003', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'TEACHER', 0),
('T00004', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'TEACHER', 0),
('T00005', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'TEACHER', 0),
('T00006', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'TEACHER', 0),
('T00007', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'TEACHER', 0),
('T00008', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'TEACHER', 0),
('T00009', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'TEACHER', 0),
('T00010', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'TEACHER', 0);

INSERT IGNORE INTO t_teacher (user_id, teacher_no, name, gender, college, department, title, email, phone)
SELECT u.id, t.teacher_no, t.name, t.gender, t.college, t.department, t.title, t.email, t.phone
FROM t_user u
JOIN (
    SELECT 'T00003' teacher_no, '王强' name, '男' gender, '计算机学院' college, '计算机科学与技术系' department, '教授' title, 'wangq@university.edu.cn' email, '13800000003' phone
    UNION ALL SELECT 'T00004', '陈静', '女', '计算机学院', '软件工程系', '副教授', 'chenj@university.edu.cn', '13800000004'
    UNION ALL SELECT 'T00005', '刘洋', '男', '计算机学院', '人工智能系', '讲师', 'liuy@university.edu.cn', '13800000005'
    UNION ALL SELECT 'T00006', '赵磊', '男', '数学学院', '应用数学系', '教授', 'zhaol@university.edu.cn', '13800000006'
    UNION ALL SELECT 'T00007', '孙丽', '女', '计算机学院', '网络工程系', '副教授', 'sunl@university.edu.cn', '13800000007'
    UNION ALL SELECT 'T00008', '周杰', '男', '计算机学院', '大数据系', '讲师', 'zhouj@university.edu.cn', '13800000008'
    UNION ALL SELECT 'T00009', '吴敏', '女', '数学学院', '信息与计算科学系', '教授', 'wum@university.edu.cn', '13800000009'
    UNION ALL SELECT 'T00010', '郑华', '男', '计算机学院', '软件工程系', '讲师', 'zhengh@university.edu.cn', '13800000010'
) t ON u.username = t.teacher_no;

-- ============================================================
-- Part 2: 助教（t_user + t_teaching_assistant）—— 3 → 10
-- ============================================================
INSERT IGNORE INTO t_user (username, password, role, first_login) VALUES
('A00004', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'ASSISTANT', 1),
('A00005', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'ASSISTANT', 1),
('A00006', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'ASSISTANT', 1),
('A00007', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'ASSISTANT', 1),
('A00008', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'ASSISTANT', 1),
('A00009', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'ASSISTANT', 1),
('A00010', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'ASSISTANT', 1);

INSERT IGNORE INTO t_teaching_assistant (user_id, teacher_id, name)
SELECT u.id, tch.id, ta.name
FROM t_user u
JOIN (
    SELECT 'A00004' uname, 'T00003' tno, '高翔' name
    UNION ALL SELECT 'A00005', 'T00004', '林悦'
    UNION ALL SELECT 'A00006', 'T00005', '何平'
    UNION ALL SELECT 'A00007', 'T00001', '宋佳'
    UNION ALL SELECT 'A00008', 'T00002', '郭涛'
    UNION ALL SELECT 'A00009', 'T00006', '罗雪'
    UNION ALL SELECT 'A00010', 'T00007', '蒋峰'
) ta ON u.username = ta.uname
JOIN t_teacher tch ON tch.teacher_no = ta.tno;

-- ============================================================
-- Part 3: 课程（t_course）—— 5 → 11
-- ============================================================
INSERT IGNORE INTO t_course (course_no, course_name, teacher_id, credit, course_type, semester, description)
SELECT m.course_no, m.course_name, tch.id, m.credit, m.course_type, '2025-2026-1', m.description
FROM (
    SELECT 'CS05106' course_no, '数据库原理' course_name, 'T00003' tno, 4.0 credit, '必修' course_type, '关系模型、SQL、事务与并发控制、索引与查询优化' description
    UNION ALL SELECT 'CS05107', '编译原理', 'T00004', 3.5, '必修', '词法分析、语法分析、语义分析与代码生成'
    UNION ALL SELECT 'CS05108', '人工智能导论', 'T00005', 3.0, '选修', '搜索、知识表示、机器学习基础、神经网络'
    UNION ALL SELECT 'CS05109', '高等数学', 'T00006', 5.0, '必修', '微积分、级数、多元函数与微分方程'
    UNION ALL SELECT 'CS05110', '软件工程', 'T00007', 3.5, '必修', '需求分析、软件设计、测试与项目管理'
    UNION ALL SELECT 'CS05111', '大数据技术', 'T00008', 3.0, '选修', 'Hadoop、Spark、分布式存储与计算'
) m
JOIN t_teacher tch ON tch.teacher_no = m.tno;

-- ============================================================
-- Part 4: 助教权限（t_assistant_permission）—— 4 → 11
-- ============================================================
INSERT IGNORE INTO t_assistant_permission (assistant_id, course_id, can_view_data, can_import_data, can_grade, can_view_portrait)
SELECT ta.id, c.id, m.can_view_data, m.can_import_data, m.can_grade, m.can_view_portrait
FROM (
    SELECT 'A00004' uname, 'CS05102' cno, 1 can_view_data, 1 can_import_data, 0 can_grade, 1 can_view_portrait
    UNION ALL SELECT 'A00005', 'CS05101', 1, 0, 1, 1
    UNION ALL SELECT 'A00006', 'CS05106', 1, 1, 1, 0
    UNION ALL SELECT 'A00007', 'CS05102', 1, 0, 0, 1
    UNION ALL SELECT 'A00008', 'CS05103', 1, 1, 0, 0
    UNION ALL SELECT 'A00009', 'CS05109', 1, 0, 0, 1
    UNION ALL SELECT 'A00010', 'CS05107', 1, 1, 1, 1
) m
JOIN t_user u ON u.username = m.uname
JOIN t_teaching_assistant ta ON ta.user_id = u.id
JOIN t_course c ON c.course_no = m.cno;

-- ============================================================
-- Part 5: 考核（t_assessment）—— 1 → 10（补充 CS05102 计算机网络其余考核）
-- ============================================================
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status, description)
SELECT c.id, m.name, m.type, m.no, 100.00, m.qc, m.date, '2025-2026-1', 'PUBLISHED', m.description
FROM (
    SELECT 'CS05102' cno, '第2次作业-传输层' name, 'HOMEWORK' type, 2 no, 5 qc, '2025-09-25' date, 'TCP/UDP、拥塞控制与流量控制' description
    UNION ALL SELECT 'CS05102', '第3次作业-应用层', 'HOMEWORK', 3, 5, '2025-10-10', 'DNS、HTTP 等应用层协议'
    UNION ALL SELECT 'CS05102', '第4次作业-综合练习', 'HOMEWORK', 4, 5, '2025-10-30', '全书知识点综合练习'
    UNION ALL SELECT 'CS05102', '第5次作业-期末复习', 'HOMEWORK', 5, 5, '2025-12-20', '期末冲刺复习题'
    UNION ALL SELECT 'CS05102', '第1次测验-网络基础', 'QUIZ', 1, 10, '2025-10-15', '第一章至第三章'
    UNION ALL SELECT 'CS05102', '第2次测验-传输层', 'QUIZ', 2, 10, '2025-11-20', '第四章传输层'
    UNION ALL SELECT 'CS05102', '期中考试', 'MIDTERM', 1, 20, '2025-11-12', '第一至四章综合'
    UNION ALL SELECT 'CS05102', '期末考试', 'FINAL', 1, 25, '2026-01-08', '全书综合'
    UNION ALL SELECT 'CS05102', '实验综合考核', 'EXPERIMENT', 1, 4, '2025-12-25', '实验报告综合评分'
) m
JOIN t_course c ON c.course_no = m.cno;
-- ============================================================
-- Part 6: 试卷（t_exam_paper）—— 0 → 10
-- ============================================================
INSERT INTO t_exam_paper (course_id, teacher_id, paper_name, total_score, duration_minutes, start_time, end_time, target_classes, status)
SELECT c.id, c.teacher_id, p.paper_name, 100.00, p.duration_minutes, p.start_time, p.end_time, '计科1801,计科1802,计科1803', 'PUBLISHED'
FROM t_course c
JOIN (
    SELECT 'CS05102' course_no, '计算机网络-期中考试卷' paper_name, 120 duration_minutes, '2025-11-10 09:00:00' start_time, '2025-11-10 11:00:00' end_time
    UNION ALL SELECT 'CS05102', '计算机网络-期末考试卷', 120, '2026-01-05 09:00:00', '2026-01-05 11:00:00'
    UNION ALL SELECT 'CS05102', '计算机网络-第1次在线测验卷', 45, '2025-10-15 09:00:00', '2025-10-15 09:45:00'
    UNION ALL SELECT 'CS05102', '计算机网络-第2次在线测验卷', 45, '2025-12-01 09:00:00', '2025-12-01 09:45:00'
    UNION ALL SELECT 'CS05101', '数据结构-期中考试卷', 120, '2025-11-08 09:00:00', '2025-11-08 11:00:00'
    UNION ALL SELECT 'CS05101', '数据结构-期末考试卷', 120, '2026-01-06 09:00:00', '2026-01-06 11:00:00'
    UNION ALL SELECT 'CS05104', '计算机组成原理-期中考试卷', 120, '2025-11-11 09:00:00', '2025-11-11 11:00:00'
    UNION ALL SELECT 'CS05105', '操作系统-期中考试卷', 120, '2025-11-12 14:00:00', '2025-11-12 16:00:00'
    UNION ALL SELECT 'CS05106', '数据库原理-期中考试卷', 120, '2025-11-13 09:00:00', '2025-11-13 11:00:00'
    UNION ALL SELECT 'CS05110', '软件工程-期末考试卷', 120, '2026-01-07 09:00:00', '2026-01-07 11:00:00'
) p ON c.course_no = p.course_no
WHERE NOT EXISTS (SELECT 1 FROM t_exam_paper);

-- ============================================================
-- Part 7: 试卷题目关联（t_exam_paper_question）—— 0 → 每卷最多5题
-- 每张试卷取对应课程题库前 5 题，每题 20 分
-- ============================================================
INSERT IGNORE INTO t_exam_paper_question (paper_id, question_id, question_no, score)
SELECT ep.id, qn.id, qn.rn, 20.00
FROM t_exam_paper ep
JOIN (
    SELECT id, course_id, ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY id) AS rn
    FROM t_question_bank
) qn ON qn.course_id = ep.course_id
WHERE qn.rn <= 5
  AND NOT EXISTS (SELECT 1 FROM t_exam_paper_question);

-- ============================================================
-- Part 8: 考试作答（t_exam_answer）—— 0 → 15
-- 以「计算机网络-期中考试卷」为例，3 名学生 × 5 题，客观题自动判分
-- ============================================================
INSERT IGNORE INTO t_exam_answer (
    paper_id, assessment_id, record_id, student_id, question_id, question_no,
    question_type, student_answer, correct_answer, score, max_score, is_correct, graded, grader_id, create_time
)
SELECT ep.id, 2001, r.id, r.student_id, pq.question_id, pq.question_no,
       q.question_type, 'A', 'A', pq.score, pq.score, 1, 1, ep.teacher_id, NOW()
FROM t_exam_paper ep
JOIN t_exam_paper_question pq ON pq.paper_id = ep.id
JOIN t_question_bank q        ON q.id = pq.question_id
JOIN t_assessment_record r    ON r.assessment_id = 2001
JOIN t_student s              ON s.id = r.student_id
WHERE ep.paper_name = '计算机网络-期中考试卷'
  AND s.student_no IN ('201826010101', '201826010107', '201826010102')
  AND NOT EXISTS (SELECT 1 FROM t_exam_answer);

-- ============================================================
-- Part 9: 错题本（t_student_wrong_question）—— 0 → 12
-- ============================================================
INSERT IGNORE INTO t_student_wrong_question (student_id, course_id, question_content, student_answer, correct_answer, knowledge_points, analysis, wrong_count, source)
SELECT s.id, c.id, LEFT(q.content, 500), 'B', 'A', q.knowledge_points, '概念混淆，建议重新学习对应章节', 1, 'AI_GENERATE'
FROM t_student s
JOIN t_course c ON c.course_no = 'CS05102'
JOIN t_question_bank q ON q.id = (SELECT MIN(id) FROM t_question_bank WHERE course_id = c.id)
WHERE s.student_no IN ('201826010123','201826010130','201826010125','201826010101','201826010107','201826010102','201826010103','201826010104','201826010105','201826010106','201826010109','201826010112')
  AND NOT EXISTS (SELECT 1 FROM t_student_wrong_question);

-- ============================================================
-- Part 10: 预警规则（t_warning_rule）—— 4 → 10
-- ============================================================
INSERT INTO t_warning_rule (rule_name, rule_type, threshold, severity, is_active, description)
SELECT * FROM (
    SELECT '迟到多次预警' rule_name, 'ATTENDANCE' rule_type, '迟到次数>=5' threshold, 'MEDIUM' severity, 1 is_active, '迟到次数达到5次触发预警' description
    UNION ALL SELECT '实验报告连续未交预警', 'HOMEWORK_MISS', '连续2次实验未交', 'MEDIUM', 1, '连续2次实验报告未提交触发预警'
    UNION ALL SELECT '成绩单次大幅下滑预警', 'SCORE_DROP', '单次成绩下降>=30%', 'HIGH', 1, '单次考核成绩较前次下降超过30%触发预警'
    UNION ALL SELECT '多知识点薄弱预警', 'KP_WEAK', '3个以上知识点掌握率<40%', 'HIGH', 1, '同一课程3个以上知识点掌握率低于40%触发预警'
    UNION ALL SELECT '作业抄袭风险预警', 'HOMEWORK_MISS', '作业重复率>=90%', 'LOW', 1, '作业内容与他人重复率超过90%触发预警'
    UNION ALL SELECT '期末挂科风险预警', 'SCORE_DROP', '平时成绩<40分', 'HIGH', 1, '平时成绩低于40分提示挂科风险'
) x
WHERE NOT EXISTS (SELECT 1 FROM t_warning_rule WHERE rule_name = '迟到多次预警');

-- ============================================================
-- Part 11: 预警记录（t_warning_record）—— 4 → 12
-- ============================================================
INSERT INTO t_warning_record (student_id, course_id, rule_id, warning_type, severity, warning_msg, is_resolved, create_time)
SELECT s.id, c.id, wr.id, wr.rule_type, m.severity, m.msg, 0, NOW()
FROM (
    SELECT '201826010101' sno, 'CS05102' cno, '知识点严重薄弱预警' rname, 'MEDIUM' severity, '[预警] 李志强同学在「路由算法」知识点上掌握率偏低' msg
    UNION ALL SELECT '201826010107', 'CS05102', '多知识点薄弱预警', 'LOW', '[预警] 潘伯迈同学在「无连接的传输协议」知识点上掌握率偏低'
    UNION ALL SELECT '201826010102', 'CS05102', '作业连续未交预警', 'MEDIUM', '[预警] 刘颖同学连续2次作业未按时提交'
    UNION ALL SELECT '201826010103', 'CS05102', '成绩持续下滑预警', 'HIGH', '[预警] 吴志豪同学成绩较上次下降超过30%'
    UNION ALL SELECT '201826010104', 'CS05102', '迟到多次预警', 'MEDIUM', '[预警] 陈嘉伟同学迟到次数偏多，请关注'
    UNION ALL SELECT '201826010105', 'CS05102', '知识点严重薄弱预警', 'LOW', '[预警] 张婧怡同学在「TCP拥塞控制」知识点上掌握率偏低'
    UNION ALL SELECT '201826010106', 'CS05102', '成绩单次大幅下滑预警', 'MEDIUM', '[预警] 蔡炯炜同学成绩波动较大，建议关注'
    UNION ALL SELECT '201826010109', 'CS05102', '缺勤过多预警', 'MEDIUM', '[预警] 李浩同学已缺勤3次，建议沟通'
) m
JOIN t_student s        ON s.student_no = m.sno
JOIN t_course c         ON c.course_no = m.cno
JOIN t_warning_rule wr  ON wr.rule_name = m.rname
WHERE NOT EXISTS (SELECT 1 FROM t_warning_record WHERE warning_msg = '[预警] 李志强同学在「路由算法」知识点上掌握率偏低');

-- ============================================================
-- Part 12: 通知（t_notification）—— 4 → 12
-- ============================================================
INSERT INTO t_notification (sender_id, sender_name, title, content, notification_type, recipient_scope, course_id, create_time)
SELECT u.id, m.sender_name, m.title, m.content, m.ntype, m.scope, c.id, NOW()
FROM (
    SELECT 'T00001' sender_uname, '张建国' sender_name, '第2次作业已发布' title, '各位同学，第2次作业-传输层已发布，请按时完成并提交。' content, 'MANUAL' ntype, 'ALL' scope, 'CS05102' cno
    UNION ALL SELECT 'T00001', '张建国', '期中考试提醒', '计科1801、1802、1803班同学请注意：期中考试定于第10周进行，涵盖第1-4章内容。', 'EXAM_REMIND', 'ALL', 'CS05102'
    UNION ALL SELECT NULL, '系统', '[预警] 焦彦博同学缺勤较多', '焦彦博同学已缺勤3次，建议任课教师及时关注。', 'WARNING', 'STUDENTS', 'CS05102'
    UNION ALL SELECT 'T00002', '李美玲', '计算机网络实验通知', '请选修计算机网络的同学按实验分组按时参加实验课。', 'MANUAL', 'ALL', 'CS05103'
    UNION ALL SELECT NULL, '系统', '[预警] 刘颖同学知识点薄弱', '刘颖同学在「校验和计算」知识点上掌握率低于30%。', 'WARNING', 'STUDENTS', 'CS05102'
    UNION ALL SELECT 'T00001', '张建国', '期末复习安排', '期末考试临近，请同学们合理安排复习计划，重点关注传输层与应用层。', 'MANUAL', 'ALL', 'CS05102'
    UNION ALL SELECT NULL, '系统', '系统维护通知', '系统将于本周六凌晨2:00-4:00进行维护升级，请知悉。', 'SYSTEM', 'ALL', NULL
    UNION ALL SELECT 'T00003', '王强', '数据库原理课程开课通知', '数据库原理课程已开课，请选课同学及时加入课程群并查看教学大纲。', 'MANUAL', 'ALL', 'CS05106'
) m
LEFT JOIN t_user u ON u.username = m.sender_uname
LEFT JOIN t_course c ON c.course_no = m.cno
WHERE NOT EXISTS (SELECT 1 FROM t_notification WHERE title = '第2次作业已发布');

-- ============================================================
-- Part 13: 通知接收者（t_notification_recipient）—— 2 → 14
-- ============================================================
INSERT IGNORE INTO t_notification_recipient (notification_id, recipient_id, is_read)
SELECT n.id, u.id, 0
FROM (
    SELECT '[预警] 焦彦博同学缺勤较多' title, '201826010125' uname
    UNION ALL SELECT '[预警] 刘颖同学知识点薄弱', '201826010102'
    UNION ALL SELECT '期中考试提醒', '201826010101'
    UNION ALL SELECT '期中考试提醒', '201826010107'
    UNION ALL SELECT '期中考试提醒', '201826010103'
    UNION ALL SELECT '第2次作业已发布', '201826010104'
    UNION ALL SELECT '第2次作业已发布', '201826010105'
    UNION ALL SELECT '期末复习安排', '201826010106'
    UNION ALL SELECT '期末复习安排', '201826010109'
    UNION ALL SELECT '计算机网络实验通知', '201826010112'
    UNION ALL SELECT '系统维护通知', '201826010101'
    UNION ALL SELECT '数据库原理课程开课通知', '201826010113'
) m
JOIN t_notification n ON n.title = m.title
JOIN t_user u ON u.username = m.uname;

-- ============================================================
-- Part 14: 操作日志（t_operation_log）—— 0 → 12
-- ============================================================
INSERT INTO t_operation_log (log_type, user_id, username, action, target_type, target_id, detail, ip_address, create_time)
SELECT m.log_type, u.id, u.username, m.action, m.target_type, NULL, m.detail, '127.0.0.1', NOW()
FROM (
    SELECT 'OPERATION' log_type, 'admin' username, '登录系统' action, 'USER' target_type, '{}' detail
    UNION ALL SELECT 'OPERATION', 'T00001', '导入学生数据', 'CLASS_STUDENT', '{"file":"student.csv"}'
    UNION ALL SELECT 'OPERATION', 'T00001', '发布第1次作业成绩', 'ASSESSMENT', '{"assessment":"第1次作业-网络层基础"}'
    UNION ALL SELECT 'OPERATION', 'T00002', '创建课程', 'COURSE', '{"course":"CS05103"}'
    UNION ALL SELECT 'AI_CALL', 'T00001', '调用大模型生成学生画像', 'STUDENT_PORTRAIT', '{"model":"deepseek-v4-pro"}'
    UNION ALL SELECT 'AI_CALL', 'T00001', 'AI组卷', 'QUESTION_GENERATE', '{"count":20}'
    UNION ALL SELECT 'ERROR', 'admin', '数据导入失败', 'DATA_IMPORT', '{"error":"文件格式错误"}'
    UNION ALL SELECT 'OPERATION', 'T00003', '创建题库题目', 'QUESTION_BANK', '{"count":10}'
    UNION ALL SELECT 'OPERATION', 'T00001', '批阅主观题', 'EXAM_ANSWER', '{"graded":15}'
    UNION ALL SELECT 'OPERATION', 'admin', '导出成绩报表', 'ASSESSMENT', '{"semester":"2025-2026-1"}'
    UNION ALL SELECT 'AI_CALL', 'T00005', '生成知识点掌握度分析', 'KP_MASTERY', '{"model":"deepseek-v4-pro"}'
    UNION ALL SELECT 'OPERATION', 'T00001', '发布考试通知', 'NOTIFICATION', '{"title":"期中考试提醒"}'
) m
JOIN t_user u ON u.username = m.username
WHERE NOT EXISTS (SELECT 1 FROM t_operation_log);

-- ============================================================
-- Part 15: 数据源（t_data_source）—— 0 → 10
-- ============================================================
INSERT INTO t_data_source (source_name, source_type, file_path, description, status)
SELECT * FROM (
    SELECT '计算机网络作业数据源' source_name, 'EXCEL' source_type, '/data/excel/CS101_HOMEWORK_第1次作业.xlsx' file_path, '作业成绩导入源' description, 'ACTIVE' status
    UNION ALL SELECT '计算机网络考勤数据源', 'EXCEL', '/data/excel/CS101_ATTENDANCE_第1周.xlsx', '考勤数据源', 'ACTIVE'
    UNION ALL SELECT '计算机网络期中成绩数据源', 'EXCEL', '/data/excel/CS101_EXAM_SCORE_MIDTERM_期中考试.xlsx', '期中考试成绩', 'ACTIVE'
    UNION ALL SELECT '计算机网络实验数据源', 'EXCEL', '/data/excel/CS101_EXPERIMENT_实验一.xlsx', '实验报告成绩', 'ACTIVE'
    UNION ALL SELECT '计算机网络测验数据源', 'EXCEL', '/data/excel/CS101_QUIZ_第1次测验.xlsx', '课堂测验成绩', 'ACTIVE'
    UNION ALL SELECT '学生名单数据源', 'EXCEL', '/data/excel/student.xlsx', '学生基础信息', 'ACTIVE'
    UNION ALL SELECT '教师名单数据源', 'EXCEL', '/data/excel/teacher.xlsx', '教师基础信息', 'ACTIVE'
    UNION ALL SELECT '课程名单数据源', 'EXCEL', '/data/excel/course.xlsx', '课程基础信息', 'ACTIVE'
    UNION ALL SELECT '历史成绩数据库', 'DATABASE', 'jdbc:mysql://localhost:3306/legacy_db', '历史成绩归档库', 'ACTIVE'
    UNION ALL SELECT '教务系统同步源', 'DATABASE', 'jdbc:mysql://10.0.0.5:3306/jwxt', '教务系统定期同步', 'INACTIVE'
) x
WHERE NOT EXISTS (SELECT 1 FROM t_data_source);

-- ============================================================
-- Part 16: 数据导入日志（t_data_import_log）—— 0 → 12
-- ============================================================
INSERT INTO t_data_import_log (source_id, user_id, file_name, import_type, total_rows, success_rows, fail_rows, status, error_msg, import_time)
SELECT ds.id, u.id, m.file_name, m.import_type, m.total_rows, m.success_rows, m.fail_rows, m.status, NULL, NOW()
FROM (
    SELECT '计算机网络作业数据源' source_name, 'T00001' username, 'CS101_HOMEWORK_第1次作业.xlsx' file_name, 'HOMEWORK' import_type, 25 total_rows, 25 success_rows, 0 fail_rows, 'SUCCESS' status
    UNION ALL SELECT '计算机网络考勤数据源', 'T00001', 'CS101_ATTENDANCE_第1周.xlsx', 'ATTENDANCE', 68, 68, 0, 'SUCCESS'
    UNION ALL SELECT '计算机网络期中成绩数据源', 'T00001', 'CS101_EXAM_SCORE_MIDTERM_期中考试.xlsx', 'EXAM_SCORE', 68, 68, 0, 'SUCCESS'
    UNION ALL SELECT '计算机网络实验数据源', 'T00001', 'CS101_EXPERIMENT_实验一.xlsx', 'EXPERIMENT', 68, 66, 2, 'PARTIAL'
    UNION ALL SELECT '计算机网络测验数据源', 'T00001', 'CS101_QUIZ_第1次测验.xlsx', 'QUIZ', 68, 68, 0, 'SUCCESS'
    UNION ALL SELECT '学生名单数据源', 'admin', 'student.xlsx', 'STUDENT', 68, 68, 0, 'SUCCESS'
    UNION ALL SELECT '教师名单数据源', 'admin', 'teacher.xlsx', 'TEACHER', 10, 10, 0, 'SUCCESS'
    UNION ALL SELECT '课程名单数据源', 'admin', 'course.xlsx', 'COURSE', 11, 11, 0, 'SUCCESS'
    UNION ALL SELECT '学生名单数据源', 'T00001', '计科1801补录.xlsx', 'CLASS_STUDENT', 5, 5, 0, 'SUCCESS'
    UNION ALL SELECT '计算机网络作业数据源', 'A00004', 'CS101_HOMEWORK_第2次作业.xlsx', 'HOMEWORK', 25, 24, 1, 'PARTIAL'
    UNION ALL SELECT '计算机网络考勤数据源', 'A00004', 'CS101_ATTENDANCE_第2周.xlsx', 'ATTENDANCE', 68, 68, 0, 'SUCCESS'
    UNION ALL SELECT '计算机网络作业数据源', 'T00001', 'CS101_HOMEWORK_错误格式.xlsx', 'HOMEWORK', 0, 0, 0, 'FAILED'
) m
JOIN t_data_source ds ON ds.source_name = m.source_name
JOIN t_user u ON u.username = m.username
WHERE NOT EXISTS (SELECT 1 FROM t_data_import_log);

-- ============================================================
-- Part 17: AI 分析结果（t_ai_analysis_result）—— 0 → 12
-- ============================================================
INSERT INTO t_ai_analysis_result (analysis_type, target_type, target_id, result_data, model_name, process_time_ms)
SELECT * FROM (
    SELECT 'KP_MASTERY' analysis_type, 'STUDENT' target_type, 1 target_id, '{"mastery_rate": 0.72, "weak_kp": ["子网划分"]}' result_data, 'deepseek-v4-pro' model_name, 1523 process_time_ms
    UNION ALL SELECT 'KP_MASTERY', 'STUDENT', 2, '{"mastery_rate": 0.85, "weak_kp": []}', 'deepseek-v4-pro', 1410
    UNION ALL SELECT 'WRONG_QUESTION', 'STUDENT', 1, '{"wrong_count": 3, "top_kp": "TCP拥塞控制"}', 'deepseek-v4-pro', 980
    UNION ALL SELECT 'STUDENT_PORTRAIT', 'STUDENT', 1, '{"strength": "协议机制", "weakness": "计算题"}', 'deepseek-v4-pro', 2310
    UNION ALL SELECT 'STUDENT_PORTRAIT', 'STUDENT', 5, '{"strength": "概念理解", "weakness": "综合应用"}', 'deepseek-v4-pro', 2205
    UNION ALL SELECT 'QUESTION_GENERATE', 'COURSE', 1, '{"generated": 10, "difficulty": "MEDIUM"}', 'deepseek-v4-pro', 4520
    UNION ALL SELECT 'EXAM_ANALYSIS', 'ASSESSMENT', 2001, '{"avg": 82.5, "max": 96, "min": 42}', 'deepseek-v4-pro', 3120
    UNION ALL SELECT 'EXAM_ANALYSIS', 'ASSESSMENT', 2001, '{"kp_weakest": "可靠传输技术", "mastery": 0.55}', 'deepseek-v4-pro', 2980
    UNION ALL SELECT 'SOCRATIC_QUESTION', 'STUDENT', 3, '{"chain_len": 3}', 'deepseek-v4-pro', 760
    UNION ALL SELECT 'KP_MASTERY', 'COURSE', 1, '{"class_avg": 0.74, "kp_count": 25}', 'deepseek-v4-pro', 3890
    UNION ALL SELECT 'STUDENT_PORTRAIT', 'STUDENT', 8, '{"strength": "记忆性知识", "weakness": "计算与推导"}', 'deepseek-v4-pro', 2050
    UNION ALL SELECT 'WRONG_QUESTION', 'COURSE', 1, '{"total_wrong": 45, "top_kp": "IP数据报分片"}', 'deepseek-v4-pro', 1340
) x
WHERE NOT EXISTS (SELECT 1 FROM t_ai_analysis_result);

SET FOREIGN_KEY_CHECKS = 1;
