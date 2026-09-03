-- ============================================================
-- AITAES 集成测试数据
-- 每次集成测试前通过 @Sql 注解加载
-- ============================================================

-- 测试用户账号
INSERT INTO t_user (id, username, password, role) VALUES
(1, 'T001', '$2a$10$dummy', 'TEACHER'),
(2, 'T002', '$2a$10$dummy', 'TEACHER'),
(3, 'S2024001', '$2a$10$dummy', 'STUDENT'),
(4, 'S2024002', '$2a$10$dummy', 'STUDENT'),
(5, 'S2024003', '$2a$10$dummy', 'STUDENT');

-- 测试教师
INSERT INTO t_teacher (id, user_id, teacher_no, name, gender, college, department, title, email) VALUES
(1, 1, 'T001', '张建国', '男', '计算机学院', '软件工程系', '教授', 'zjg@university.edu.cn'),
(2, 2, 'T002', '李美玲', '女', '计算机学院', '网络工程系', '副教授', 'lml@university.edu.cn');

-- 测试学生
INSERT INTO t_student (id, user_id, student_no, name, gender, college, major, class_name, grade) VALUES
(1, 3, 'S2024001', '赵小明', '男', '计算机学院', '软件工程', '软件2101', '2024'),
(2, 4, 'S2024002', '钱小红', '女', '计算机学院', '软件工程', '软件2101', '2024'),
(3, 5, 'S2024003', '孙大伟', '男', '计算机学院', '网络工程', '网络2101', '2024');

-- 测试课程
INSERT INTO t_course (id, course_no, course_name, teacher_id, credit, course_type, semester) VALUES
(1, 'CS101', '数据结构与算法', 1, 4.0, '必修', '2025-2026-1'),
(2, 'CS201', '计算机网络',     2, 3.5, '必修', '2025-2026-1'),
(3, 'CS301', '软件工程导论',   1, 3.0, '必修', '2025-2026-1');
