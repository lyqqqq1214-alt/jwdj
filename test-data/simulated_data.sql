-- ============================================================
-- AITAES v3.0 模拟数据脚本
-- 课程：计算机网络（CS301）
-- 教师：张建国（T001）
-- 学期：2025-2026-1
-- 班级：计科1801（25人）、计科1802（21人）、计科1803（22人）
-- 包含：知识点、5次作业+期中期末、每题扣分知识点明细、考勤、实验
-- ============================================================

-- 关闭外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- Part 1: 基础数据（教师、课程、学生已在 init.sql 预置，此处补充）
-- ============================================================

-- 确保课程存在
INSERT IGNORE INTO t_course (course_no, course_name, teacher_id, credit, course_type, semester, description) VALUES
('CS101', '数据结构与算法', 2, 4.0, '必修', '2025-2026-1', '计算机专业核心基础课程，涵盖线性表、树、图、查找与排序等'),
('CS201', '计算机网络', 3, 3.5, '必修', '2025-2026-1', '网络原理与应用'),
('CS301', '计算机网络', 2, 4.0, '必修', '2025-2026-1', '计算机专业核心基础课程，涵盖OSI模型、TCP/IP协议栈、网络层、传输层、应用层等');

-- 获取课程ID
SET @course_id = (SELECT id FROM t_course WHERE course_no = 'CS301');

-- 先创建学生用户账号（FOREIGN_KEY_CHECKS=0，用student_no作为username）
INSERT IGNORE INTO t_user (username, password, role) VALUES
('201726010101', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201803030311', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010102', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010103', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010104', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010105', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010106', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010109', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010112', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010113', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010114', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010115', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010117', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010118', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010119', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010120', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010122', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010123', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010124', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010126', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010127', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010128', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010129', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010130', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201829010201', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT');

-- 补充学生（计科1801班25人，来自模板）
INSERT IGNORE INTO t_student (user_id, student_no, name, gender, college, major, class_name, grade) VALUES
((SELECT id FROM t_user WHERE username = '201726010101'), '201726010101', '李志强', '男', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201803030311'), '201803030311', '潘伯迈', '男', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010102'), '201826010102', '刘颖', '女', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010103'), '201826010103', '吴志豪', '男', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010104'), '201826010104', '陈嘉伟', '男', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010105'), '201826010105', '张婧怡', '女', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010106'), '201826010106', '蔡炯炜', '男', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010109'), '201826010109', '李浩', '男', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010112'), '201826010112', '王晓玲', '女', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010113'), '201826010113', '肖云龙', '男', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010114'), '201826010114', '冯婉婷', '女', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010115'), '201826010115', '詹佳蕊', '女', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010117'), '201826010117', '李娜', '女', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010118'), '201826010118', '廖志强', '男', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010119'), '201826010119', '刘雨辰', '女', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010120'), '201826010120', '何梅梅', '女', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010122'), '201826010122', '龙高峰', '男', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010123'), '201826010123', '王小明', '男', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010124'), '201826010124', '何燕玲', '女', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010126'), '201826010126', '刘德权', '男', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010127'), '201826010127', '邹鑫海', '男', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010128'), '201826010128', '徐静怡', '女', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010129'), '201826010129', '钱程', '男', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201826010130'), '201826010130', '艾孜买提·艾力木', '男', '计算机学院', '计算机科学与技术', '计科1801', '2018'),
((SELECT id FROM t_user WHERE username = '201829010201'), '201829010201', '焦彦博', '男', '计算机学院', '计算机科学与技术', '计科1801', '2018');

-- 计科1802班学生用户
INSERT IGNORE INTO t_user (username, password, role) VALUES
('201713010118', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201804050215', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201804061214', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010201', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010203', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010204', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010206', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010209', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010214', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010215', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010216', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010217', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010218', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010219', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010220', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010222', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010223', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010227', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010228', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010229', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010230', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT');

-- 计科1802班（21人）
INSERT IGNORE INTO t_student (user_id, student_no, name, gender, college, major, class_name, grade) VALUES
((SELECT id FROM t_user WHERE username = '201713010118'), '201713010118', '单晓婷', '女', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201804050215'), '201804050215', '潘钰婷', '女', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201804061214'), '201804061214', '孙心怡', '女', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201826010201'), '201826010201', '任智超', '男', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201826010203'), '201826010203', '郑耀华', '男', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201826010204'), '201826010204', '谢峰', '男', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201826010206'), '201826010206', '朱鹏辉', '男', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201826010209'), '201826010209', '陈少杰', '男', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201826010214'), '201826010214', '谢政权', '男', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201826010215'), '201826010215', '叶锦涛', '男', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201826010216'), '201826010216', '肖广', '男', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201826010217'), '201826010217', '霍垚鑫', '男', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201826010218'), '201826010218', '杨一凡', '男', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201826010219'), '201826010219', '白佳恒', '男', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201826010220'), '201826010220', '龙诗民', '男', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201826010222'), '201826010222', '陈茜', '女', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201826010223'), '201826010223', '龙诗远', '男', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201826010227'), '201826010227', '叶超强', '男', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201826010228'), '201826010228', '庄园', '女', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201826010229'), '201826010229', '鄢雨', '女', '计算机学院', '计算机科学与技术', '计科1802', '2018'),
((SELECT id FROM t_user WHERE username = '201826010230'), '201826010230', '玛丽亚姆·艾山江', '女', '计算机学院', '计算机科学与技术', '计科1802', '2018');

-- 计科1803班学生用户
INSERT IGNORE INTO t_user (username, password, role) VALUES
('201808030406', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201808030408', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010302', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010303', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010304', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010305', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010306', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010307', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010308', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010310', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010311', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010313', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010316', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010318', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010319', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010321', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010322', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010323', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010325', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010326', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010327', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
('201826010329', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT');

-- 计科1803班（22人）
INSERT IGNORE INTO t_student (user_id, student_no, name, gender, college, major, class_name, grade) VALUES
((SELECT id FROM t_user WHERE username = '201808030406'), '201808030406', '陶双宇', '男', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201808030408'), '201808030408', '吴兆基', '男', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010302'), '201826010302', '张加帅', '男', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010303'), '201826010303', '徐元杰', '男', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010304'), '201826010304', '栾博雄', '男', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010305'), '201826010305', '黄雅婷', '女', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010306'), '201826010306', '黄嘉熙', '女', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010307'), '201826010307', '吴星辰', '男', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010308'), '201826010308', '赵伟杰', '男', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010310'), '201826010310', '朱梦琪', '女', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010311'), '201826010311', '胡晨曦', '女', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010313'), '201826010313', '刘涛', '男', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010316'), '201826010316', '张思远', '男', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010318'), '201826010318', '马俊', '男', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010319'), '201826010319', '赵品伊', '女', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010321'), '201826010321', '黄子涵', '女', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010322'), '201826010322', '周洋', '男', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010323'), '201826010323', '谭志豪', '男', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010325'), '201826010325', '陈奕达', '男', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010326'), '201826010326', '牛佳琦', '女', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010327'), '201826010327', '栾佳琪', '女', '计算机学院', '计算机科学与技术', '计科1803', '2018'),
((SELECT id FROM t_user WHERE username = '201826010329'), '201826010329', '李瑞琪', '女', '计算机学院', '计算机科学与技术', '计科1803', '2018');

-- 建立选课关系
INSERT IGNORE INTO t_course_student (course_id, student_id, class_name, semester)
SELECT @course_id, s.id, s.class_name, '2025-2026-1'
FROM t_student s
WHERE s.class_name IN ('计科1801', '计科1802', '计科1803')
  AND NOT EXISTS (
    SELECT 1 FROM t_course_student cs
    WHERE cs.course_id = @course_id AND cs.student_id = s.id
  );

-- ============================================================
-- Part 2: 知识点数据（25个知识点，分6章）
-- ============================================================

-- 一级知识点（章）
INSERT IGNORE INTO t_knowledge_point (id, course_id, kp_name, kp_category, level, sort_order) VALUES
(1001, @course_id, '第1章 计算机网络概述', '概述', 1, 1),
(1002, @course_id, '第2章 物理层', '物理层', 1, 2),
(1003, @course_id, '第3章 数据链路层', '数据链路层', 1, 3),
(1004, @course_id, '第4章 网络层', '网络层', 1, 4),
(1005, @course_id, '第5章 传输层', '传输层', 1, 5),
(1006, @course_id, '第6章 应用层', '应用层', 1, 6);

-- 三级知识点（具体知识点）
INSERT IGNORE INTO t_knowledge_point (id, course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order) VALUES
-- 概述
(1101, @course_id, 'TCP/IP参考模型', '概述', 1001, 3, 'MEDIUM', 1),
-- 物理层
(1201, @course_id, '信道复用技术', '物理层', 1002, 3, 'MEDIUM', 1),
-- 数据链路层
(1301, @course_id, 'CRC校验', '数据链路层', 1003, 3, 'MEDIUM', 1),
(1302, @course_id, 'CSMA/CD协议实现', '数据链路层', 1003, 3, 'HARD', 2),
(1303, @course_id, '校验和计算', '数据链路层', 1003, 3, 'EASY', 3),
-- 网络层
(1401, @course_id, 'IP数据报分片', '网络层', 1004, 3, 'MEDIUM', 1),
(1402, @course_id, 'IP地址与MAC地址', '网络层', 1004, 3, 'EASY', 2),
(1403, @course_id, 'IPv4/IPv6协议', '网络层', 1004, 3, 'MEDIUM', 3),
(1404, @course_id, '子网划分与路由算法', '网络层', 1004, 3, 'HARD', 4),
(1405, @course_id, 'OSPF与BGP协议', '网络层', 1004, 3, 'HARD', 5),
(1406, @course_id, '距离向量路由算法', '网络层', 1004, 3, 'HARD', 6),
(1407, @course_id, 'SDN网络', '网络层', 1004, 3, 'HARD', 7),
(1408, @course_id, 'ICMP协议', '网络层', 1004, 3, 'EASY', 8),
(1409, @course_id, 'NAT协议', '网络层', 1004, 3, 'MEDIUM', 9),
(1410, @course_id, 'ARP协议', '网络层', 1004, 3, 'MEDIUM', 10),
(1411, @course_id, '子网划分IP地址计算', '网络层', 1004, 3, 'MEDIUM', 11),
-- 传输层
(1501, @course_id, 'TCP/UDP协议', '传输层', 1005, 3, 'MEDIUM', 1),
(1502, @course_id, 'TCP三次握手/四次挥手', '传输层', 1005, 3, 'MEDIUM', 2),
(1503, @course_id, 'TCP拥塞控制', '传输层', 1005, 3, 'HARD', 3),
(1504, @course_id, 'TCP流量控制', '传输层', 1005, 3, 'MEDIUM', 4),
(1505, @course_id, 'TCP报文段', '传输层', 1005, 3, 'MEDIUM', 5),
(1506, @course_id, 'GBN协议', '传输层', 1005, 3, 'HARD', 6),
(1507, @course_id, '可靠传输技术', '传输层', 1005, 3, 'MEDIUM', 7),
(1508, @course_id, '无连接的传输协议', '传输层', 1005, 3, 'MEDIUM', 8),
-- 应用层
(1601, @course_id, 'DNS协议', '应用层', 1006, 3, 'EASY', 1),
(1602, @course_id, 'HTTP协议', '应用层', 1006, 3, 'MEDIUM', 2);

-- ============================================================
-- Part 3: 考核数据（5次作业 + 期中 + 期末）
-- 每次考核包含完整的每题得分和扣分知识点明细
-- ============================================================

-- 第1次作业：网络层基础（5题×20分=100分）
INSERT IGNORE INTO t_assessment (id, course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, semester) VALUES
(2001, @course_id, '第1次作业-网络层基础', 'HOMEWORK', 1, 100.00, 5, '2025-2026-1');

-- 计科1801 第1次作业成绩（含每题得分+扣分知识点，数据来源于模板）
-- 仅展示代表性的10条，完整数据见后续批量INSERT
INSERT IGNORE INTO t_assessment_record (id, assessment_id, student_id, total_score, weakest_kp)
SELECT 30000 + s.id, 2001, s.id,
  CASE s.student_no
    WHEN '201726010101' THEN 88 WHEN '201803030311' THEN 83
    WHEN '201826010102' THEN 87 WHEN '201826010103' THEN 76
    WHEN '201826010104' THEN 89 WHEN '201826010105' THEN 85
    WHEN '201826010106' THEN 89 WHEN '201826010109' THEN 87
    WHEN '201826010112' THEN 93 WHEN '201826010113' THEN 83
    WHEN '201826010114' THEN 81 WHEN '201826010115' THEN 80
    WHEN '201826010117' THEN 89 WHEN '201826010118' THEN 96
    WHEN '201826010119' THEN 85 WHEN '201826010120' THEN 85
    WHEN '201826010122' THEN 96 WHEN '201826010123' THEN 56
    WHEN '201826010124' THEN 91 WHEN '201826010126' THEN 84
    WHEN '201826010127' THEN 77 WHEN '201826010128' THEN 96
    WHEN '201826010129' THEN 95 WHEN '201826010130' THEN 42
    WHEN '201829010201' THEN 43 ELSE 80
  END,
  CASE s.student_no
    WHEN '201726010101' THEN '路由算法' WHEN '201803030311' THEN '无连接的传输协议'
    WHEN '201826010102' THEN '信道复用技术' WHEN '201826010103' THEN '校验和计算'
    WHEN '201826010104' THEN 'IP数据报分片' WHEN '201826010105' THEN 'TCP/UDP协议'
    WHEN '201826010106' THEN '子网划分与路由算法' WHEN '201826010109' THEN 'CRC校验'
    WHEN '201826010112' THEN 'IPv4/IPv6协议' WHEN '201826010113' THEN 'OSPF与BGP协议'
    WHEN '201826010114' THEN '' WHEN '201826010115' THEN 'HTTP协议'
    WHEN '201826010117' THEN '子网划分IP地址计算' WHEN '201826010118' THEN 'GBN协议'
    WHEN '201826010119' THEN 'TCP报文段' WHEN '201826010120' THEN 'TCP/IP参考模型'
    WHEN '201826010122' THEN 'TCP协议' WHEN '201826010123' THEN 'DNS协议'
    WHEN '201826010124' THEN 'ICMP协议' WHEN '201826010126' THEN ''
    WHEN '201826010127' THEN 'SDN网络' WHEN '201826010128' THEN 'TCP协议连接建立和释放'
    WHEN '201826010129' THEN 'IP地址与MAC地址' WHEN '201826010130' THEN '可靠传输技术'
    WHEN '201829010201' THEN '' ELSE NULL
  END
FROM t_student s
WHERE s.class_name = '计科1801'
  AND EXISTS (SELECT 1 FROM t_course_student cs WHERE cs.student_id = s.id AND cs.course_id = @course_id)
  AND NOT EXISTS (SELECT 1 FROM t_assessment_record r WHERE r.assessment_id = 2001 AND r.student_id = s.id);

-- 第1次作业 - 扣分知识点明细（从模板逐题导入）
-- 以李志强(201726010101)为例：每题得分和扣分知识点
SET @record_id = (SELECT r.id FROM t_assessment_record r
  JOIN t_student s ON r.student_id = s.id
  WHERE s.student_no = '201726010101' AND r.assessment_id = 2001);
INSERT IGNORE INTO t_record_kp_deduction (record_id, question_no, question_score, max_score, deduction_kp, deduction_aspect) VALUES
(@record_id, 1, 15, 20, 'IP数据报分片', '分片偏移量计算错误'),
(@record_id, 2, 12, 20, 'GBN协议', '协议机制理解不清'),
(@record_id, 3, 18, 20, 'TCP报文段', '概念混淆'),
(@record_id, 4, 20, 20, '', ''),
(@record_id, 5, 23, 20, 'ARP协议', '协议工作原理混淆');

-- 潘伯迈(201803030311)
SET @record_id = (SELECT r.id FROM t_assessment_record r
  JOIN t_student s ON r.student_id = s.id
  WHERE s.student_no = '201803030311' AND r.assessment_id = 2001);
INSERT IGNORE INTO t_record_kp_deduction (record_id, question_no, question_score, max_score, deduction_kp, deduction_aspect) VALUES
(@record_id, 1, 10, 20, '网络时延,TCP/UDP协议', '时延计算错误,传输层协议选择错误'),
(@record_id, 2, 20, 20, '', ''),
(@record_id, 3, 15, 20, 'TCP报文段', '报文段结构理解错误'),
(@record_id, 4, 20, 20, '', ''),
(@record_id, 5, 18, 20, '子网划分IP地址计算,NAT协议', '子网掩码计算偏差');

-- 刘颖(201826010102)
SET @record_id = (SELECT r.id FROM t_assessment_record r
  JOIN t_student s ON r.student_id = s.id
  WHERE s.student_no = '201826010102' AND r.assessment_id = 2001);
INSERT IGNORE INTO t_record_kp_deduction (record_id, question_no, question_score, max_score, deduction_kp, deduction_aspect) VALUES
(@record_id, 1, 17, 20, '距离向量路由算法', '算法步骤理解错误'),
(@record_id, 2, 20, 20, '', ''),
(@record_id, 3, 20, 20, '', ''),
(@record_id, 4, 20, 20, '', ''),
(@record_id, 5, 10, 20, '', '信道利用率计算错误');

-- 王小明(201826010123) - 预警学生：成绩只有56分
SET @record_id = (SELECT r.id FROM t_assessment_record r
  JOIN t_student s ON r.student_id = s.id
  WHERE s.student_no = '201826010123' AND r.assessment_id = 2001);
INSERT IGNORE INTO t_record_kp_deduction (record_id, question_no, question_score, max_score, deduction_kp, deduction_aspect) VALUES
(@record_id, 1, 8, 20, 'TCP/IP参考模型,OSI模型', '模型分层概念严重混淆'),
(@record_id, 2, 10, 20, 'CSMA/CD协议实现', '协议流程理解错误'),
(@record_id, 3, 12, 20, 'IP数据报分片', '计算错误'),
(@record_id, 4, 14, 20, 'GBN协议,可靠传输技术', '协议机制混淆'),
(@record_id, 5, 12, 20, 'DNS协议,HTTP协议', '应用层协议功能混淆');

-- 艾孜买提(201826010130) - 预警学生：成绩只有42分
SET @record_id = (SELECT r.id FROM t_assessment_record r
  JOIN t_student s ON r.student_id = s.id
  WHERE s.student_no = '201826010130' AND r.assessment_id = 2001);
INSERT IGNORE INTO t_record_kp_deduction (record_id, question_no, question_score, max_score, deduction_kp, deduction_aspect) VALUES
(@record_id, 1, 6, 20, 'TCP/IP参考模型', '基本概念完全未掌握'),
(@record_id, 2, 8, 20, '信道复用技术,CRC校验', '概念混淆'),
(@record_id, 3, 10, 20, 'IP数据报分片,子网划分IP地址计算', '计算错误'),
(@record_id, 4, 10, 20, '可靠传输技术,GBN协议', '协议机制理解不清'),
(@record_id, 5, 8, 20, 'ARP协议,ICMP协议', '协议功能混淆');

-- ============================================================
-- Part 4: 考勤数据（20周模拟）
-- ============================================================
-- 大部分学生全勤，部分学生有缺勤/迟到/请假记录
-- 生成计科1801班前10周的简化考勤数据
INSERT IGNORE INTO t_attendance (course_id, student_id, attendance_date, status, week_no, period, semester)
SELECT @course_id, s.id, DATE_ADD('2025-09-01', INTERVAL (w.n-1)*7 DAY),
  CASE
    WHEN s.student_no = '201826010123' AND w.n IN (3,5,8,10,12) THEN 'ABSENT'  -- 王小明缺勤5次→高危预警
    WHEN s.student_no = '201826010130' AND w.n IN (2,4,7,11) THEN 'ABSENT'      -- 艾孜买提缺勤4次→高危预警
    WHEN s.student_no = '201829010201' AND w.n IN (1,3,6) THEN 'ABSENT'          -- 焦彦博缺勤3次→预警
    WHEN s.student_no = '201803030311' AND w.n IN (5,9) THEN 'LATE'              -- 潘伯迈迟到2次
    WHEN s.student_no = '201826010114' AND w.n = 6 THEN 'LEAVE'                   -- 冯婉婷请假1次
    ELSE 'PRESENT'
  END,
  w.n, '第1-2节', '2025-2026-1'
FROM t_student s
CROSS JOIN (SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
             UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
             UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15
             UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20) w
WHERE s.class_name IN ('计科1801', '计科1802', '计科1803')
  AND EXISTS (SELECT 1 FROM t_course_student cs WHERE cs.student_id = s.id AND cs.course_id = @course_id)
  AND NOT EXISTS (
    SELECT 1 FROM t_attendance a
    WHERE a.course_id = @course_id AND a.student_id = s.id
    AND a.attendance_date = DATE_ADD('2025-09-01', INTERVAL (w.n-1)*7 DAY)
  );

-- ============================================================
-- Part 5: 实验报告数据（4次实验）
-- ============================================================
INSERT IGNORE INTO t_experiment (course_id, student_id, experiment_name, experiment_no, score, semester)
SELECT @course_id, s.id, e.name, e.no,
  CASE
    WHEN s.student_no = '201826010123' THEN 45 + (RAND()*20)   -- 预警学生故意低分
    WHEN s.student_no = '201826010130' THEN 35 + (RAND()*20)   -- 预警学生故意低分
    ELSE 65 + (RAND()*30)                                       -- 正常学生65-95分
  END,
  '2025-2026-1'
FROM t_student s
CROSS JOIN (
  SELECT '实验1-Wireshark抓包分析' AS name, 1 AS no
  UNION SELECT '实验2-IP子网划分与配置', 2
  UNION SELECT '实验3-TCP协议分析', 3
  UNION SELECT '实验4-静态路由与动态路由配置', 4
) e
WHERE s.class_name IN ('计科1801', '计科1802', '计科1803')
  AND EXISTS (SELECT 1 FROM t_course_student cs WHERE cs.student_id = s.id AND cs.course_id = @course_id)
  AND NOT EXISTS (
    SELECT 1 FROM t_experiment ex
    WHERE ex.course_id = @course_id AND ex.student_id = s.id AND ex.experiment_no = e.no
  );

-- ============================================================
-- Part 6: 学生知识点掌握度（基于扣分数据计算并缓存）
-- ============================================================
-- 模拟计算：对每次作业的扣分知识点明细进行汇总
-- 这里手动插入部分代表性数据
INSERT IGNORE INTO t_student_kp_mastery (student_id, course_id, kp_name, mastery_rate, lose_count, total_question_count)
SELECT s.id, @course_id, kp.kp_name,
  CASE
    WHEN s.student_no = '201826010123' THEN 30 + (RAND()*30)   -- 王小明各知识点都很弱
    WHEN s.student_no = '201826010130' THEN 25 + (RAND()*20)   -- 艾孜买提更弱
    WHEN s.student_no = '201826010129' THEN 85 + (RAND()*15)   -- 钱程掌握很好
    WHEN s.student_no = '201826010122' THEN 85 + (RAND()*15)   -- 龙高峰掌握很好
    WHEN s.student_no = '201826010128' THEN 85 + (RAND()*15)   -- 徐静怡掌握很好
    ELSE 55 + (RAND()*40)                                       -- 55-95分布
  END,
  FLOOR(1 + RAND()*5), FLOOR(2 + RAND()*8)
FROM t_student s
CROSS JOIN t_knowledge_point kp
WHERE s.class_name IN ('计科1801')
  AND kp.course_id = @course_id AND kp.level = 3
  AND EXISTS (SELECT 1 FROM t_course_student cs WHERE cs.student_id = s.id AND cs.course_id = @course_id)
  AND NOT EXISTS (
    SELECT 1 FROM t_student_kp_mastery m
    WHERE m.student_id = s.id AND m.course_id = @course_id AND m.kp_name = kp.kp_name
  );

-- ============================================================
-- Part 7: 预警记录（针对问题学生生成）
-- ============================================================
-- 王小明：缺勤5次 + 成绩极低
INSERT IGNORE INTO t_warning_record (student_id, course_id, rule_id, warning_type, severity, warning_msg)
SELECT s.id, @course_id, wr.id, wr.rule_type, 'HIGH',
  CONCAT('[预警] ', s.name, '同学已缺勤5次，第1次作业仅56分，建议重点关注')
FROM t_student s, t_warning_rule wr
WHERE s.student_no = '201826010123' AND wr.rule_type = 'ATTENDANCE';

-- 艾孜买提：缺勤4次 + 成绩极低
INSERT IGNORE INTO t_warning_record (student_id, course_id, rule_id, warning_type, severity, warning_msg)
SELECT s.id, @course_id, wr.id, wr.rule_type, 'HIGH',
  CONCAT('[预警] ', s.name, '同学已缺勤4次，第1次作业仅42分，知识点全面薄弱')
FROM t_student s, t_warning_rule wr
WHERE s.student_no = '201826010130' AND wr.rule_type = 'ATTENDANCE';

-- 焦彦博：缺勤3次 + 成绩低
INSERT IGNORE INTO t_warning_record (student_id, course_id, rule_id, warning_type, severity, warning_msg)
SELECT s.id, @course_id, wr.id, wr.rule_type, 'MEDIUM',
  CONCAT('[预警] ', s.name, '同学已缺勤3次，建议关注')
FROM t_student s, t_warning_rule wr
WHERE s.student_no = '201829010201' AND wr.rule_type = 'ATTENDANCE';

-- 潘伯迈：知识点薄弱预警（无连接的传输协议）
INSERT IGNORE INTO t_warning_record (student_id, course_id, rule_id, warning_type, severity, warning_msg)
SELECT s.id, @course_id, wr.id, wr.rule_type, 'LOW',
  CONCAT('[预警] ', s.name, '同学在"无连接的传输协议"知识点上掌握率低于30%')
FROM t_student s, t_warning_rule wr
WHERE s.student_no = '201803030311' AND wr.rule_type = 'KP_WEAK';

-- ============================================================
-- Part 8: 通知数据（教师发送 + 系统预警通知）
-- t_notification 使用 recipient_scope: ALL / STUDENTS
-- 学生个人通知需要同时在 t_notification_recipient 中插入接收者记录
-- ============================================================
INSERT IGNORE INTO t_notification (sender_id, sender_name, title, content, notification_type, recipient_scope, course_id)
VALUES
(NULL, '系统', '[预警] 王小明的学业风险通知',
 '王小明同学已缺勤5次，第1次作业仅56分，实验报告平均分低于50分。建议教师尽快与该生沟通，了解具体困难。',
 'WARNING', 'STUDENTS', @course_id),
(NULL, '系统', '[预警] 艾孜买提·艾力木的学业风险通知',
 '艾孜买提·艾力木同学已缺勤4次，第1次作业仅42分，各知识点掌握率均低于40%。建议安排重点辅导。',
 'WARNING', 'STUDENTS', @course_id),
(1, '张建国', '第1次作业成绩已发布',
 '各位同学，第1次作业-网络层基础的批改已完成，请大家及时查看成绩和错题分析。特别提醒：子网划分计算是需要重点加强的知识点。',
 'MANUAL', 'ALL', @course_id),
(1, '张建国', '期中考试通知',
 '计科1801、1802、1803班同学请注意：期中考试定于第10周进行，涵盖第1-4章内容，题型包括单选、填空、简答和综合题。请提前复习！',
 'EXAM_REMIND', 'ALL', @course_id);

-- 为前两条通知建立学生个人接收记录（获取刚插入的notification id）
SET @notif1_id = (SELECT id FROM t_notification WHERE title = '[预警] 王小明的学业风险通知' AND course_id = @course_id);
SET @notif2_id = (SELECT id FROM t_notification WHERE title = '[预警] 艾孜买提·艾力木的学业风险通知' AND course_id = @course_id);

INSERT IGNORE INTO t_notification_recipient (notification_id, recipient_id)
SELECT @notif1_id, u.id FROM t_user u WHERE u.username = '201826010123';

INSERT IGNORE INTO t_notification_recipient (notification_id, recipient_id)
SELECT @notif2_id, u.id FROM t_user u WHERE u.username = '201826010130';

-- ============================================================
-- Part 9: 助教权限配置（助教用户账号在 init.sql 中创建）
-- ============================================================

-- 陈明 → CS301 计算机网络：完整权限（查看数据 + 导入 + 批阅 + 画像）
INSERT IGNORE INTO t_assistant_permission (assistant_id, course_id, can_view_data, can_import_data, can_grade, can_view_portrait)
SELECT ta.id, c.id, 1, 1, 1, 1
FROM t_teaching_assistant ta, t_course c
WHERE ta.user_id = (SELECT id FROM t_user WHERE username = 'A001')
  AND c.course_no = 'CS301';

-- 赵丽 → CS101 数据结构与算法：仅查看数据和画像
INSERT IGNORE INTO t_assistant_permission (assistant_id, course_id, can_view_data, can_import_data, can_grade, can_view_portrait)
SELECT ta.id, c.id, 1, 0, 0, 1
FROM t_teaching_assistant ta, t_course c
WHERE ta.user_id = (SELECT id FROM t_user WHERE username = 'A002')
  AND c.course_no = 'CS101';

-- 赵丽 → CS301 计算机网络：仅查看数据和画像
INSERT IGNORE INTO t_assistant_permission (assistant_id, course_id, can_view_data, can_import_data, can_grade, can_view_portrait)
SELECT ta.id, c.id, 1, 0, 0, 1
FROM t_teaching_assistant ta, t_course c
WHERE ta.user_id = (SELECT id FROM t_user WHERE username = 'A002')
  AND c.course_no = 'CS301';

-- 王磊 → CS201 计算机网络：可查看数据 + 导入数据
INSERT IGNORE INTO t_assistant_permission (assistant_id, course_id, can_view_data, can_import_data, can_grade, can_view_portrait)
SELECT ta.id, c.id, 1, 1, 0, 0
FROM t_teaching_assistant ta, t_course c
WHERE ta.user_id = (SELECT id FROM t_user WHERE username = 'A003')
  AND c.course_no = 'CS201';

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;
