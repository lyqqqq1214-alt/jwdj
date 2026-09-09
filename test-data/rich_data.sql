-- ============================================================
-- AITAES 富数据脚本（rich_data.sql）—— 由 generate_rich_data.py 生成
-- 规模：3 门课程 × 2 个班 × 20 名学生 = 120 名学生
-- 每名学生：3 次作业 + 2 次测验 + 期中/期末 + 10 次考勤 + 2 次实验
-- 幂等：全部使用 INSERT IGNORE / NOT EXISTS 守卫，可重复执行
-- ============================================================

USE aitaes_db;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- Part 1: 课程（3 门，均归属教师 T00001 张建国）
-- ============================================================
INSERT IGNORE INTO t_course (course_no, course_name, teacher_id, credit, course_type, semester, description)
SELECT 'CS05112', '操作系统', id, '4.0', '必修', '2025-2026-1', '进程与线程、处理机调度、内存管理、文件系统与设备管理'
FROM t_teacher WHERE teacher_no = 'T00001';

INSERT IGNORE INTO t_course (course_no, course_name, teacher_id, credit, course_type, semester, description)
SELECT 'CS05113', '计算机组成原理', id, '4.0', '必修', '2025-2026-1', '数据表示与运算、存储系统、指令系统、CPU 结构与总线 I/O'
FROM t_teacher WHERE teacher_no = 'T00001';

INSERT IGNORE INTO t_course (course_no, course_name, teacher_id, credit, course_type, semester, description)
SELECT 'CS05114', '算法设计与分析', id, '3.5', '必修', '2025-2026-1', '分治、动态规划、贪心、图算法、回溯与分支限界'
FROM t_teacher WHERE teacher_no = 'T00001';

-- ============================================================
-- Part 2: 知识点（每门课程若干章 + 三级知识点）
-- ============================================================
-- CS05112 操作系统
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, level, difficulty, sort_order)
SELECT c.id, '第1章 进程管理', '进程管理', 1, 'MEDIUM', 1 FROM t_course c WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, level, difficulty, sort_order)
SELECT c.id, '第2章 内存管理', '内存管理', 1, 'MEDIUM', 2 FROM t_course c WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, level, difficulty, sort_order)
SELECT c.id, '第3章 文件与设备管理', '文件系统', 1, 'MEDIUM', 3 FROM t_course c WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '进程与线程', '进程管理', p.id, 3, 'MEDIUM', 1
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第1章 进程管理'
WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '进程同步与互斥', '进程管理', p.id, 3, 'MEDIUM', 2
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第1章 进程管理'
WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '信号量与PV操作', '进程管理', p.id, 3, 'MEDIUM', 3
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第1章 进程管理'
WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '处理机调度算法', '进程管理', p.id, 3, 'MEDIUM', 4
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第1章 进程管理'
WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '死锁与银行家算法', '进程管理', p.id, 3, 'MEDIUM', 5
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第1章 进程管理'
WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '分页存储管理', '内存管理', p.id, 3, 'MEDIUM', 1
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第2章 内存管理'
WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '分段存储管理', '内存管理', p.id, 3, 'MEDIUM', 2
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第2章 内存管理'
WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '虚拟内存', '内存管理', p.id, 3, 'MEDIUM', 3
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第2章 内存管理'
WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '页面置换算法', '内存管理', p.id, 3, 'MEDIUM', 4
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第2章 内存管理'
WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '文件系统结构', '文件系统', p.id, 3, 'MEDIUM', 1
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第3章 文件与设备管理'
WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '磁盘调度算法', '文件系统', p.id, 3, 'MEDIUM', 2
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第3章 文件与设备管理'
WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, 'I/O控制方式', '文件系统', p.id, 3, 'MEDIUM', 3
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第3章 文件与设备管理'
WHERE c.course_no = 'CS05112';

-- CS05113 计算机组成原理
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, level, difficulty, sort_order)
SELECT c.id, '第1章 数据表示与运算', '数据表示', 1, 'MEDIUM', 1 FROM t_course c WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, level, difficulty, sort_order)
SELECT c.id, '第2章 存储系统', '存储系统', 1, 'MEDIUM', 2 FROM t_course c WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, level, difficulty, sort_order)
SELECT c.id, '第3章 指令系统与CPU', '指令系统', 1, 'MEDIUM', 3 FROM t_course c WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, level, difficulty, sort_order)
SELECT c.id, '第4章 总线与I/O', '总线I/O', 1, 'MEDIUM', 4 FROM t_course c WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '数制与编码', '数据表示', p.id, 3, 'MEDIUM', 1
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第1章 数据表示与运算'
WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '定点数运算', '数据表示', p.id, 3, 'MEDIUM', 2
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第1章 数据表示与运算'
WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '浮点数表示', '数据表示', p.id, 3, 'MEDIUM', 3
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第1章 数据表示与运算'
WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '算术逻辑运算', '数据表示', p.id, 3, 'MEDIUM', 4
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第1章 数据表示与运算'
WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '存储层次结构', '存储系统', p.id, 3, 'MEDIUM', 1
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第2章 存储系统'
WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, 'Cache工作原理', '存储系统', p.id, 3, 'MEDIUM', 2
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第2章 存储系统'
WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '主存扩展与芯片', '存储系统', p.id, 3, 'MEDIUM', 3
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第2章 存储系统'
WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '指令系统', '指令系统', p.id, 3, 'MEDIUM', 1
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第3章 指令系统与CPU'
WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '微程序控制', '指令系统', p.id, 3, 'MEDIUM', 2
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第3章 指令系统与CPU'
WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '流水线技术', '指令系统', p.id, 3, 'MEDIUM', 3
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第3章 指令系统与CPU'
WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '总线仲裁', '总线I/O', p.id, 3, 'MEDIUM', 1
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第4章 总线与I/O'
WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '中断系统', '总线I/O', p.id, 3, 'MEDIUM', 2
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第4章 总线与I/O'
WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, 'DMA方式', '总线I/O', p.id, 3, 'MEDIUM', 3
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第4章 总线与I/O'
WHERE c.course_no = 'CS05113';

-- CS05114 算法设计与分析
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, level, difficulty, sort_order)
SELECT c.id, '第1章 算法基础', '算法基础', 1, 'MEDIUM', 1 FROM t_course c WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, level, difficulty, sort_order)
SELECT c.id, '第2章 动态规划', '动态规划', 1, 'MEDIUM', 2 FROM t_course c WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, level, difficulty, sort_order)
SELECT c.id, '第3章 贪心与图算法', '贪心图算法', 1, 'MEDIUM', 3 FROM t_course c WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, level, difficulty, sort_order)
SELECT c.id, '第4章 回溯与分支限界', '回溯分支限界', 1, 'MEDIUM', 4 FROM t_course c WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '时间复杂度分析', '算法基础', p.id, 3, 'MEDIUM', 1
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第1章 算法基础'
WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '递归与分治', '算法基础', p.id, 3, 'MEDIUM', 2
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第1章 算法基础'
WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '分治法应用', '算法基础', p.id, 3, 'MEDIUM', 3
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第1章 算法基础'
WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '动态规划基本思想', '动态规划', p.id, 3, 'MEDIUM', 1
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第2章 动态规划'
WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '最优子结构', '动态规划', p.id, 3, 'MEDIUM', 2
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第2章 动态规划'
WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '经典DP问题', '动态规划', p.id, 3, 'MEDIUM', 3
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第2章 动态规划'
WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '贪心算法', '贪心图算法', p.id, 3, 'MEDIUM', 1
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第3章 贪心与图算法'
WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '图遍历算法', '贪心图算法', p.id, 3, 'MEDIUM', 2
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第3章 贪心与图算法'
WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '最短路径算法', '贪心图算法', p.id, 3, 'MEDIUM', 3
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第3章 贪心与图算法'
WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '最小生成树', '贪心图算法', p.id, 3, 'MEDIUM', 4
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第3章 贪心与图算法'
WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '回溯法', '回溯分支限界', p.id, 3, 'MEDIUM', 1
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第4章 回溯与分支限界'
WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)
SELECT c.id, '分支限界法', '回溯分支限界', p.id, 3, 'MEDIUM', 2
FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = '第4章 回溯与分支限界'
WHERE c.course_no = 'CS05114';

-- ============================================================
-- Part 3: 学生账号（t_user）+ 学生（t_student）
-- ============================================================
INSERT IGNORE INTO t_user (username, password, role) VALUES
  ('202026010101', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010102', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010103', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010104', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010105', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010106', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026010107', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010108', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010109', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010110', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010111', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010112', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026010113', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010114', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010115', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010116', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010117', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010118', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026010119', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010120', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010201', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010202', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010203', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010204', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026010205', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010206', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010207', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010208', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010209', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010210', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026010211', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010212', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010213', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010214', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010215', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010216', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026010217', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010218', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010219', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010220', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010301', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010302', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026010303', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010304', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010305', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010306', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010307', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010308', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026010309', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010310', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010311', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010312', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010313', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010314', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026010315', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010316', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010317', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010318', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010319', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010320', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026010401', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010402', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010403', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010404', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010405', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010406', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026010407', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010408', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010409', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010410', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010411', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010412', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026010413', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010414', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010415', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010416', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010417', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010418', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026010419', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026010420', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020101', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020102', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020103', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020104', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026020105', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020106', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020107', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020108', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020109', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020110', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026020111', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020112', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020113', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020114', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020115', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020116', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026020117', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020118', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020119', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020120', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020201', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020202', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026020203', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020204', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020205', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020206', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020207', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020208', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026020209', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020210', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020211', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020212', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020213', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020214', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'),
  ('202026020215', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020216', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020217', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020218', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020219', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT'), ('202026020220', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'STUDENT');

INSERT IGNORE INTO t_student (user_id, student_no, name, gender, college, major, class_name, grade)
SELECT u.id, s.student_no, s.name, s.gender, s.college, s.major, s.class_name, '2020'
FROM t_user u
JOIN (
  SELECT '202026010101' student_no, '柳佳' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010102' student_no, '鲁明鑫' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010103' student_no, '葛明嘉' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010104' student_no, '孙琳红' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010105' student_no, '马雨梅' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010106' student_no, '方鑫豪' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010107' student_no, '袁文' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010108' student_no, '戚远' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010109' student_no, '凤超洋' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010110' student_no, '潘强平' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010111' student_no, '姜娟静' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010112' student_no, '华曦强' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010113' student_no, '凤军' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010114' student_no, '施欣德' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010115' student_no, '喻磊磊' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010116' student_no, '施杰杰' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010117' student_no, '魏涵' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010118' student_no, '马轩' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010119' student_no, '马婉怡' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010120' student_no, '李海梅' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2001' class_name
  UNION ALL
  SELECT '202026010201' student_no, '奚琳' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010202' student_no, '奚强静' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010203' student_no, '苗磊' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010204' student_no, '魏静博' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010205' student_no, '王强英' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010206' student_no, '戚嘉浩' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010207' student_no, '陶子' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010208' student_no, '潘军德' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010209' student_no, '俞英' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010210' student_no, '凤洋斌' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010211' student_no, '陶刚' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010212' student_no, '马雪嘉' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010213' student_no, '陈曦玉' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010214' student_no, '卫涛' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010215' student_no, '奚宇' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010216' student_no, '孙艳' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010217' student_no, '尤萍' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010218' student_no, '吕雅' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010219' student_no, '张娟' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010220' student_no, '吕涵' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2002' class_name
  UNION ALL
  SELECT '202026010301' student_no, '魏丽' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010302' student_no, '尤平刚' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010303' student_no, '金伟' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010304' student_no, '方敏萍' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010305' student_no, '何志' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010306' student_no, '秦轩' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010307' student_no, '鲁桐欣' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010308' student_no, '水桐' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010309' student_no, '喻丽' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010310' student_no, '俞娟' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010311' student_no, '彭文雅' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010312' student_no, '陈静远' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010313' student_no, '魏伟磊' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010314' student_no, '方云' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010315' student_no, '窦云' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010316' student_no, '杨子轩' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010317' student_no, '潘秀敏' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010318' student_no, '尤权' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010319' student_no, '范芳' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010320' student_no, '许雨子' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2003' class_name
  UNION ALL
  SELECT '202026010401' student_no, '昌轩' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010402' student_no, '陶鑫英' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010403' student_no, '郑怡' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010404' student_no, '袁静' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010405' student_no, '柳琳' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010406' student_no, '花曦' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010407' student_no, '华敏' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010408' student_no, '严玉海' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010409' student_no, '曹鑫' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010410' student_no, '卫涛' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010411' student_no, '曹涛' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010412' student_no, '郎子婷' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010413' student_no, '朱琪怡' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010414' student_no, '戚敏' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010415' student_no, '陈涵洋' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010416' student_no, '许俊丽' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010417' student_no, '沈玉' name, '女' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010418' student_no, '施玉轩' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010419' student_no, '秦曦伟' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026010420' student_no, '施杰' name, '男' gender, '计算机学院' college, '计算机科学与技术' major, '计科2004' class_name
  UNION ALL
  SELECT '202026020101' student_no, '周佳英' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020102' student_no, '王洋雅' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020103' student_no, '鲁涵嘉' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020104' student_no, '彭怡怡' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020105' student_no, '云权' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020106' student_no, '郑丽' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020107' student_no, '周怡婷' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020108' student_no, '方志' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020109' student_no, '奚静' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020110' student_no, '章伟豪' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020111' student_no, '孔宇欣' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020112' student_no, '窦磊' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020113' student_no, '魏雨思' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020114' student_no, '水豪云' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020115' student_no, '华涛婷' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020116' student_no, '朱博博' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020117' student_no, '云蕊' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020118' student_no, '俞婉' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020119' student_no, '冯怡涵' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020120' student_no, '昌思宇' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2001' class_name
  UNION ALL
  SELECT '202026020201' student_no, '苏明' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020202' student_no, '王志' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020203' student_no, '邹芳霞' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020204' student_no, '花艳怡' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020205' student_no, '陶晨涛' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020206' student_no, '杨芳' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020207' student_no, '邹英洋' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020208' student_no, '苏雨' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020209' student_no, '柳秀' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020210' student_no, '袁丽军' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020211' student_no, '秦刚' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020212' student_no, '郑琳' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020213' student_no, '任雨' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020214' student_no, '孔远' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020215' student_no, '孔思' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020216' student_no, '姜思平' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020217' student_no, '卫曦伟' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020218' student_no, '王刚' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020219' student_no, '凤博' name, '女' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
  UNION ALL
  SELECT '202026020220' student_no, '俞娜' name, '男' gender, '计算机学院' college, '软件工程' major, '软件2002' class_name
) s ON u.username = s.student_no;

-- ============================================================
-- Part 4: 选课关系（t_course_student）
-- ============================================================
INSERT IGNORE INTO t_course_student (course_id, student_id, class_name, semester)
SELECT c.id, st.id, st.class_name, '2025-2026-1'
FROM t_course c JOIN t_student st ON st.class_name IN ('计科2001', '计科2002')
WHERE c.course_no = 'CS05112';

INSERT IGNORE INTO t_course_student (course_id, student_id, class_name, semester)
SELECT c.id, st.id, st.class_name, '2025-2026-1'
FROM t_course c JOIN t_student st ON st.class_name IN ('计科2003', '计科2004')
WHERE c.course_no = 'CS05113';

INSERT IGNORE INTO t_course_student (course_id, student_id, class_name, semester)
SELECT c.id, st.id, st.class_name, '2025-2026-1'
FROM t_course c JOIN t_student st ON st.class_name IN ('软件2001', '软件2002')
WHERE c.course_no = 'CS05114';

-- ============================================================
-- Part 5: 考核（t_assessment）：3 作业 + 2 测验 + 期中 + 期末
-- ============================================================
-- CS05112 操作系统
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '第1次作业-进程管理', 'HOMEWORK', 1, 100.00, 5, '2025-09-20', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '第2次作业-内存管理', 'HOMEWORK', 2, 100.00, 5, '2025-10-11', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '第3次作业-文件系统', 'HOMEWORK', 3, 100.00, 5, '2025-11-01', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '第1次测验-进程与同步', 'QUIZ', 1, 100.00, 10, '2025-10-15', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '第2次测验-内存与虚拟内存', 'QUIZ', 2, 100.00, 10, '2025-11-25', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '期中考试', 'MIDTERM', 1, 100.00, 20, '2025-11-12', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05112';
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '期末考试', 'FINAL', 1, 100.00, 25, '2026-01-08', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05112';

-- CS05113 计算机组成原理
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '第1次作业-数据表示与运算', 'HOMEWORK', 1, 100.00, 5, '2025-09-20', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '第2次作业-存储系统', 'HOMEWORK', 2, 100.00, 5, '2025-10-11', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '第3次作业-指令系统与CPU', 'HOMEWORK', 3, 100.00, 5, '2025-11-01', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '第1次测验-数据表示', 'QUIZ', 1, 100.00, 10, '2025-10-15', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '第2次测验-存储与Cache', 'QUIZ', 2, 100.00, 10, '2025-11-25', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '期中考试', 'MIDTERM', 1, 100.00, 20, '2025-11-12', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05113';
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '期末考试', 'FINAL', 1, 100.00, 25, '2026-01-08', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05113';

-- CS05114 算法设计与分析
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '第1次作业-分治与递归', 'HOMEWORK', 1, 100.00, 5, '2025-09-20', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '第2次作业-动态规划', 'HOMEWORK', 2, 100.00, 5, '2025-10-11', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '第3次作业-贪心与图算法', 'HOMEWORK', 3, 100.00, 5, '2025-11-01', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '第1次测验-分治与DP', 'QUIZ', 1, 100.00, 10, '2025-10-15', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '第2次测验-图算法与回溯', 'QUIZ', 2, 100.00, 10, '2025-11-25', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '期中考试', 'MIDTERM', 1, 100.00, 20, '2025-11-12', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05114';
INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)
SELECT c.id, '期末考试', 'FINAL', 1, 100.00, 25, '2026-01-08', '2025-2026-1', 'PUBLISHED'
FROM t_course c WHERE c.course_no = 'CS05114';

-- ============================================================
-- Part 6: 成绩记录（t_assessment_record）：每生 7 条（3作业+2测验+期中+期末）
-- ============================================================
-- CS05112 操作系统
INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05112' AND a.assessment_name = '第1次作业-进程管理'
JOIN (
  SELECT '202026010101' sno, 92.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010102' sno, 76.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010103' sno, 87.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010104' sno, 73.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010105' sno, 70.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010106' sno, 43.9 score, 'ON_TIME' status, '进程与线程' kp
  UNION ALL
  SELECT '202026010107' sno, 71.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010108' sno, 67.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010109' sno, 72.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010110' sno, 80.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010111' sno, 57.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010112' sno, 81.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010113' sno, 86.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010114' sno, 83.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010115' sno, 67.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010116' sno, 35.6 score, 'ON_TIME' status, 'I/O控制方式' kp
  UNION ALL
  SELECT '202026010117' sno, 62.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010118' sno, 88.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010119' sno, 59.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010120' sno, 89.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010201' sno, 90.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010202' sno, 74.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010203' sno, 82.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010204' sno, 91.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010205' sno, 76.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010206' sno, 46.5 score, 'ON_TIME' status, '处理机调度算法' kp
  UNION ALL
  SELECT '202026010207' sno, 76.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010208' sno, 64.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010209' sno, 62.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010210' sno, 71.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010211' sno, 70.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010212' sno, 86.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010213' sno, 66.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010214' sno, 77.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010215' sno, 78.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010216' sno, 39.8 score, 'ON_TIME' status, '文件系统结构' kp
  UNION ALL
  SELECT '202026010217' sno, 61.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010218' sno, 60.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010219' sno, 65.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010220' sno, 70.9 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05112' AND a.assessment_name = '第2次作业-内存管理'
JOIN (
  SELECT '202026010101' sno, 93.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010102' sno, 67.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010103' sno, 83.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010104' sno, 79.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010105' sno, 72.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010106' sno, 38.2 score, 'LATE' status, 'I/O控制方式' kp
  UNION ALL
  SELECT '202026010107' sno, 70.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010108' sno, 74.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010109' sno, 62.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010110' sno, 78.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010111' sno, 58.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010112' sno, 83.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010113' sno, 77.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010114' sno, 87.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010115' sno, 63.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010116' sno, 45.2 score, 'LATE' status, '信号量与PV操作' kp
  UNION ALL
  SELECT '202026010117' sno, 69.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010118' sno, 89.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010119' sno, 64.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010120' sno, 84.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010201' sno, 93.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010202' sno, 74.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010203' sno, 85.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010204' sno, 84.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010205' sno, 74.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010206' sno, 39.4 score, 'LATE' status, 'I/O控制方式' kp
  UNION ALL
  SELECT '202026010207' sno, 83.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010208' sno, 66.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010209' sno, 70.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010210' sno, 61.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010211' sno, 72.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010212' sno, 83.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010213' sno, 64.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010214' sno, 76.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010215' sno, 85.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010216' sno, 43.9 score, 'LATE' status, '页面置换算法' kp
  UNION ALL
  SELECT '202026010217' sno, 62.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010218' sno, 70.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010219' sno, 65.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010220' sno, 78.4 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05112' AND a.assessment_name = '第3次作业-文件系统'
JOIN (
  SELECT '202026010101' sno, 100.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010102' sno, 68.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010103' sno, 83.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010104' sno, 80.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010105' sno, 71.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010106' sno, 39.9 score, 'ABSENT' status, 'I/O控制方式' kp
  UNION ALL
  SELECT '202026010107' sno, 69.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010108' sno, 73.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010109' sno, 64.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010110' sno, 79.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010111' sno, 62.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010112' sno, 89.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010113' sno, 86.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010114' sno, 91.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010115' sno, 67.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010116' sno, 41.4 score, 'ABSENT' status, '进程与线程' kp
  UNION ALL
  SELECT '202026010117' sno, 71.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010118' sno, 86.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010119' sno, 69.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010120' sno, 90.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010201' sno, 92.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010202' sno, 72.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010203' sno, 86.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010204' sno, 91.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010205' sno, 71.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010206' sno, 45.0 score, 'ABSENT' status, '进程同步与互斥' kp
  UNION ALL
  SELECT '202026010207' sno, 81.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010208' sno, 70.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010209' sno, 70.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010210' sno, 64.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010211' sno, 69.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010212' sno, 82.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010213' sno, 72.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010214' sno, 77.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010215' sno, 82.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010216' sno, 40.9 score, 'ABSENT' status, '进程与线程' kp
  UNION ALL
  SELECT '202026010217' sno, 63.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010218' sno, 60.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010219' sno, 59.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010220' sno, 73.9 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05112' AND a.assessment_name = '第1次测验-进程与同步'
JOIN (
  SELECT '202026010101' sno, 95.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010102' sno, 77.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010103' sno, 84.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010104' sno, 77.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010105' sno, 81.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010106' sno, 47.0 score, 'ON_TIME' status, '信号量与PV操作' kp
  UNION ALL
  SELECT '202026010107' sno, 66.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010108' sno, 70.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010109' sno, 70.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010110' sno, 75.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010111' sno, 66.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010112' sno, 81.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010113' sno, 80.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010114' sno, 83.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010115' sno, 73.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010116' sno, 35.9 score, 'ON_TIME' status, '死锁与银行家算法' kp
  UNION ALL
  SELECT '202026010117' sno, 60.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010118' sno, 81.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010119' sno, 60.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010120' sno, 83.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010201' sno, 89.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010202' sno, 69.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010203' sno, 92.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010204' sno, 86.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010205' sno, 78.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010206' sno, 44.1 score, 'ON_TIME' status, '虚拟内存' kp
  UNION ALL
  SELECT '202026010207' sno, 73.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010208' sno, 71.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010209' sno, 70.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010210' sno, 57.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010211' sno, 74.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010212' sno, 86.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010213' sno, 61.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010214' sno, 74.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010215' sno, 85.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010216' sno, 43.0 score, 'ON_TIME' status, '虚拟内存' kp
  UNION ALL
  SELECT '202026010217' sno, 63.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010218' sno, 58.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010219' sno, 61.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010220' sno, 68.7 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05112' AND a.assessment_name = '第2次测验-内存与虚拟内存'
JOIN (
  SELECT '202026010101' sno, 100.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010102' sno, 77.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010103' sno, 89.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010104' sno, 75.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010105' sno, 72.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010106' sno, 36.5 score, 'ON_TIME' status, '进程与线程' kp
  UNION ALL
  SELECT '202026010107' sno, 72.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010108' sno, 74.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010109' sno, 61.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010110' sno, 87.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010111' sno, 61.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010112' sno, 89.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010113' sno, 84.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010114' sno, 80.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010115' sno, 69.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010116' sno, 37.8 score, 'ON_TIME' status, 'I/O控制方式' kp
  UNION ALL
  SELECT '202026010117' sno, 67.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010118' sno, 80.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010119' sno, 62.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010120' sno, 89.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010201' sno, 95.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010202' sno, 66.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010203' sno, 86.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010204' sno, 92.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010205' sno, 66.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010206' sno, 43.7 score, 'ON_TIME' status, '页面置换算法' kp
  UNION ALL
  SELECT '202026010207' sno, 79.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010208' sno, 69.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010209' sno, 68.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010210' sno, 69.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010211' sno, 67.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010212' sno, 81.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010213' sno, 64.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010214' sno, 67.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010215' sno, 74.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010216' sno, 41.3 score, 'ON_TIME' status, '死锁与银行家算法' kp
  UNION ALL
  SELECT '202026010217' sno, 55.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010218' sno, 69.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010219' sno, 62.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010220' sno, 76.4 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05112' AND a.assessment_name = '期中考试'
JOIN (
  SELECT '202026010101' sno, 88.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010102' sno, 63.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010103' sno, 87.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010104' sno, 77.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010105' sno, 77.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010106' sno, 42.4 score, 'ON_TIME' status, '进程与线程' kp
  UNION ALL
  SELECT '202026010107' sno, 61.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010108' sno, 63.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010109' sno, 59.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010110' sno, 74.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010111' sno, 54.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010112' sno, 74.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010113' sno, 78.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010114' sno, 78.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010115' sno, 61.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010116' sno, 38.8 score, 'ON_TIME' status, '页面置换算法' kp
  UNION ALL
  SELECT '202026010117' sno, 63.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010118' sno, 86.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010119' sno, 60.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010120' sno, 76.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010201' sno, 88.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010202' sno, 64.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010203' sno, 76.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010204' sno, 93.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010205' sno, 70.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010206' sno, 36.3 score, 'ON_TIME' status, 'I/O控制方式' kp
  UNION ALL
  SELECT '202026010207' sno, 76.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010208' sno, 56.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010209' sno, 67.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010210' sno, 64.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010211' sno, 69.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010212' sno, 75.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010213' sno, 65.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010214' sno, 64.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010215' sno, 75.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010216' sno, 48.1 score, 'ON_TIME' status, 'I/O控制方式' kp
  UNION ALL
  SELECT '202026010217' sno, 57.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010218' sno, 56.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010219' sno, 57.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010220' sno, 74.9 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05112' AND a.assessment_name = '期末考试'
JOIN (
  SELECT '202026010101' sno, 92.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010102' sno, 67.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010103' sno, 73.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010104' sno, 64.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010105' sno, 79.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010106' sno, 41.5 score, 'ABSENT' status, '页面置换算法' kp
  UNION ALL
  SELECT '202026010107' sno, 67.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010108' sno, 69.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010109' sno, 56.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010110' sno, 83.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010111' sno, 59.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010112' sno, 81.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010113' sno, 80.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010114' sno, 81.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010115' sno, 71.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010116' sno, 39.3 score, 'ABSENT' status, 'I/O控制方式' kp
  UNION ALL
  SELECT '202026010117' sno, 57.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010118' sno, 79.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010119' sno, 68.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010120' sno, 77.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010201' sno, 84.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010202' sno, 64.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010203' sno, 74.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010204' sno, 85.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010205' sno, 65.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010206' sno, 45.7 score, 'ABSENT' status, '进程与线程' kp
  UNION ALL
  SELECT '202026010207' sno, 71.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010208' sno, 63.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010209' sno, 54.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010210' sno, 57.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010211' sno, 68.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010212' sno, 83.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010213' sno, 65.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010214' sno, 74.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010215' sno, 76.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010216' sno, 34.8 score, 'ABSENT' status, '虚拟内存' kp
  UNION ALL
  SELECT '202026010217' sno, 54.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010218' sno, 63.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010219' sno, 66.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010220' sno, 62.5 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

-- CS05113 计算机组成原理
INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05113' AND a.assessment_name = '第1次作业-数据表示与运算'
JOIN (
  SELECT '202026010301' sno, 93.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010302' sno, 83.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010303' sno, 73.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010304' sno, 67.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010305' sno, 66.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010306' sno, 42.8 score, 'ON_TIME' status, '流水线技术' kp
  UNION ALL
  SELECT '202026010307' sno, 81.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010308' sno, 69.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010309' sno, 88.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010310' sno, 65.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010311' sno, 67.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010312' sno, 75.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010313' sno, 84.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010314' sno, 86.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010315' sno, 71.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010316' sno, 51.7 score, 'ON_TIME' status, '定点数运算' kp
  UNION ALL
  SELECT '202026010317' sno, 74.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010318' sno, 86.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010319' sno, 69.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010320' sno, 81.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010401' sno, 91.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010402' sno, 57.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010403' sno, 66.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010404' sno, 80.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010405' sno, 78.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010406' sno, 41.5 score, 'ON_TIME' status, '存储层次结构' kp
  UNION ALL
  SELECT '202026010407' sno, 77.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010408' sno, 92.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010409' sno, 84.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010410' sno, 84.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010411' sno, 68.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010412' sno, 81.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010413' sno, 65.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010414' sno, 81.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010415' sno, 69.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010416' sno, 38.1 score, 'ON_TIME' status, '中断系统' kp
  UNION ALL
  SELECT '202026010417' sno, 73.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010418' sno, 67.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010419' sno, 86.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010420' sno, 69.3 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05113' AND a.assessment_name = '第2次作业-存储系统'
JOIN (
  SELECT '202026010301' sno, 98.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010302' sno, 87.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010303' sno, 75.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010304' sno, 73.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010305' sno, 66.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010306' sno, 48.6 score, 'LATE' status, '存储层次结构' kp
  UNION ALL
  SELECT '202026010307' sno, 80.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010308' sno, 76.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010309' sno, 80.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010310' sno, 67.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010311' sno, 71.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010312' sno, 83.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010313' sno, 94.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010314' sno, 89.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010315' sno, 75.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010316' sno, 53.6 score, 'LATE' status, '总线仲裁' kp
  UNION ALL
  SELECT '202026010317' sno, 78.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010318' sno, 87.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010319' sno, 65.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010320' sno, 71.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010401' sno, 95.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010402' sno, 64.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010403' sno, 69.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010404' sno, 78.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010405' sno, 78.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010406' sno, 46.5 score, 'LATE' status, '流水线技术' kp
  UNION ALL
  SELECT '202026010407' sno, 73.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010408' sno, 88.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010409' sno, 92.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010410' sno, 79.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010411' sno, 67.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010412' sno, 79.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010413' sno, 63.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010414' sno, 72.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010415' sno, 71.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010416' sno, 41.7 score, 'LATE' status, '微程序控制' kp
  UNION ALL
  SELECT '202026010417' sno, 70.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010418' sno, 63.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010419' sno, 80.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010420' sno, 72.4 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05113' AND a.assessment_name = '第3次作业-指令系统与CPU'
JOIN (
  SELECT '202026010301' sno, 92.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010302' sno, 92.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010303' sno, 65.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010304' sno, 73.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010305' sno, 59.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010306' sno, 39.1 score, 'ABSENT' status, '微程序控制' kp
  UNION ALL
  SELECT '202026010307' sno, 84.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010308' sno, 77.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010309' sno, 88.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010310' sno, 65.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010311' sno, 67.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010312' sno, 74.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010313' sno, 83.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010314' sno, 84.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010315' sno, 74.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010316' sno, 54.7 score, 'ABSENT' status, 'DMA方式' kp
  UNION ALL
  SELECT '202026010317' sno, 71.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010318' sno, 88.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010319' sno, 60.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010320' sno, 79.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010401' sno, 85.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010402' sno, 59.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010403' sno, 74.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010404' sno, 82.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010405' sno, 70.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010406' sno, 43.7 score, 'ABSENT' status, '主存扩展与芯片' kp
  UNION ALL
  SELECT '202026010407' sno, 74.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010408' sno, 88.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010409' sno, 84.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010410' sno, 81.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010411' sno, 66.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010412' sno, 85.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010413' sno, 59.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010414' sno, 75.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010415' sno, 69.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010416' sno, 41.3 score, 'ABSENT' status, 'DMA方式' kp
  UNION ALL
  SELECT '202026010417' sno, 71.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010418' sno, 60.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010419' sno, 85.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010420' sno, 68.3 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05113' AND a.assessment_name = '第1次测验-数据表示'
JOIN (
  SELECT '202026010301' sno, 93.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010302' sno, 87.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010303' sno, 69.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010304' sno, 74.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010305' sno, 59.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010306' sno, 37.9 score, 'ON_TIME' status, '微程序控制' kp
  UNION ALL
  SELECT '202026010307' sno, 74.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010308' sno, 66.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010309' sno, 78.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010310' sno, 61.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010311' sno, 68.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010312' sno, 76.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010313' sno, 90.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010314' sno, 87.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010315' sno, 67.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010316' sno, 45.2 score, 'ON_TIME' status, '主存扩展与芯片' kp
  UNION ALL
  SELECT '202026010317' sno, 65.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010318' sno, 85.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010319' sno, 63.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010320' sno, 70.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010401' sno, 87.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010402' sno, 65.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010403' sno, 67.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010404' sno, 79.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010405' sno, 70.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010406' sno, 44.2 score, 'ON_TIME' status, '存储层次结构' kp
  UNION ALL
  SELECT '202026010407' sno, 73.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010408' sno, 84.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010409' sno, 84.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010410' sno, 79.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010411' sno, 62.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010412' sno, 74.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010413' sno, 61.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010414' sno, 70.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010415' sno, 61.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010416' sno, 39.3 score, 'ON_TIME' status, '主存扩展与芯片' kp
  UNION ALL
  SELECT '202026010417' sno, 65.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010418' sno, 61.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010419' sno, 81.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010420' sno, 66.4 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05113' AND a.assessment_name = '第2次测验-存储与Cache'
JOIN (
  SELECT '202026010301' sno, 99.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010302' sno, 90.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010303' sno, 75.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010304' sno, 70.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010305' sno, 63.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010306' sno, 40.8 score, 'ON_TIME' status, '算术逻辑运算' kp
  UNION ALL
  SELECT '202026010307' sno, 84.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010308' sno, 65.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010309' sno, 82.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010310' sno, 66.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010311' sno, 63.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010312' sno, 73.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010313' sno, 84.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010314' sno, 82.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010315' sno, 69.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010316' sno, 52.9 score, 'ON_TIME' status, '浮点数表示' kp
  UNION ALL
  SELECT '202026010317' sno, 70.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010318' sno, 77.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010319' sno, 65.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010320' sno, 77.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010401' sno, 92.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010402' sno, 64.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010403' sno, 73.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010404' sno, 78.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010405' sno, 78.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010406' sno, 44.9 score, 'ON_TIME' status, '中断系统' kp
  UNION ALL
  SELECT '202026010407' sno, 79.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010408' sno, 90.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010409' sno, 90.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010410' sno, 80.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010411' sno, 62.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010412' sno, 80.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010413' sno, 56.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010414' sno, 80.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010415' sno, 68.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010416' sno, 48.7 score, 'ON_TIME' status, '主存扩展与芯片' kp
  UNION ALL
  SELECT '202026010417' sno, 74.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010418' sno, 67.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010419' sno, 78.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010420' sno, 60.9 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05113' AND a.assessment_name = '期中考试'
JOIN (
  SELECT '202026010301' sno, 90.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010302' sno, 87.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010303' sno, 71.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010304' sno, 76.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010305' sno, 66.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010306' sno, 34.8 score, 'ON_TIME' status, 'Cache工作原理' kp
  UNION ALL
  SELECT '202026010307' sno, 71.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010308' sno, 75.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010309' sno, 81.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010310' sno, 56.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010311' sno, 64.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010312' sno, 76.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010313' sno, 90.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010314' sno, 77.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010315' sno, 61.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010316' sno, 53.9 score, 'ON_TIME' status, '算术逻辑运算' kp
  UNION ALL
  SELECT '202026010317' sno, 72.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010318' sno, 83.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010319' sno, 61.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010320' sno, 76.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010401' sno, 92.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010402' sno, 53.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010403' sno, 62.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010404' sno, 82.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010405' sno, 71.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010406' sno, 47.9 score, 'ON_TIME' status, '微程序控制' kp
  UNION ALL
  SELECT '202026010407' sno, 72.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010408' sno, 89.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010409' sno, 86.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010410' sno, 85.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010411' sno, 66.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010412' sno, 77.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010413' sno, 54.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010414' sno, 75.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010415' sno, 59.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010416' sno, 43.5 score, 'ON_TIME' status, '数制与编码' kp
  UNION ALL
  SELECT '202026010417' sno, 67.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010418' sno, 60.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010419' sno, 84.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010420' sno, 68.2 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05113' AND a.assessment_name = '期末考试'
JOIN (
  SELECT '202026010301' sno, 98.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010302' sno, 75.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010303' sno, 73.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010304' sno, 73.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010305' sno, 64.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010306' sno, 45.1 score, 'ABSENT' status, 'DMA方式' kp
  UNION ALL
  SELECT '202026010307' sno, 73.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010308' sno, 62.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010309' sno, 80.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010310' sno, 52.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010311' sno, 72.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010312' sno, 79.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010313' sno, 87.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010314' sno, 77.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010315' sno, 66.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010316' sno, 40.5 score, 'ABSENT' status, '主存扩展与芯片' kp
  UNION ALL
  SELECT '202026010317' sno, 65.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010318' sno, 84.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010319' sno, 56.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010320' sno, 72.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010401' sno, 91.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010402' sno, 59.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010403' sno, 72.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010404' sno, 75.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010405' sno, 64.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010406' sno, 47.9 score, 'ABSENT' status, '浮点数表示' kp
  UNION ALL
  SELECT '202026010407' sno, 70.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010408' sno, 77.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010409' sno, 76.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010410' sno, 81.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010411' sno, 58.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010412' sno, 70.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010413' sno, 63.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010414' sno, 79.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010415' sno, 70.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010416' sno, 46.0 score, 'ABSENT' status, '定点数运算' kp
  UNION ALL
  SELECT '202026010417' sno, 69.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010418' sno, 63.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010419' sno, 74.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026010420' sno, 62.7 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

-- CS05114 算法设计与分析
INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05114' AND a.assessment_name = '第1次作业-分治与递归'
JOIN (
  SELECT '202026020101' sno, 93.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020102' sno, 69.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020103' sno, 86.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020104' sno, 92.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020105' sno, 68.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020106' sno, 57.0 score, 'ON_TIME' status, '动态规划基本思想' kp
  UNION ALL
  SELECT '202026020107' sno, 68.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020108' sno, 78.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020109' sno, 65.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020110' sno, 68.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020111' sno, 86.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020112' sno, 69.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020113' sno, 64.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020114' sno, 64.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020115' sno, 82.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020116' sno, 40.9 score, 'ON_TIME' status, '动态规划基本思想' kp
  UNION ALL
  SELECT '202026020117' sno, 70.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020118' sno, 81.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020119' sno, 67.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020120' sno, 85.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020201' sno, 91.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020202' sno, 82.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020203' sno, 63.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020204' sno, 76.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020205' sno, 61.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020206' sno, 39.1 score, 'ON_TIME' status, '分支限界法' kp
  UNION ALL
  SELECT '202026020207' sno, 87.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020208' sno, 76.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020209' sno, 85.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020210' sno, 81.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020211' sno, 72.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020212' sno, 72.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020213' sno, 61.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020214' sno, 68.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020215' sno, 79.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020216' sno, 59.4 score, 'ON_TIME' status, '图遍历算法' kp
  UNION ALL
  SELECT '202026020217' sno, 81.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020218' sno, 87.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020219' sno, 79.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020220' sno, 80.5 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05114' AND a.assessment_name = '第2次作业-动态规划'
JOIN (
  SELECT '202026020101' sno, 97.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020102' sno, 67.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020103' sno, 81.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020104' sno, 91.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020105' sno, 71.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020106' sno, 59.3 score, 'LATE' status, '贪心算法' kp
  UNION ALL
  SELECT '202026020107' sno, 68.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020108' sno, 81.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020109' sno, 68.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020110' sno, 67.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020111' sno, 92.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020112' sno, 71.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020113' sno, 60.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020114' sno, 57.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020115' sno, 83.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020116' sno, 46.0 score, 'LATE' status, '递归与分治' kp
  UNION ALL
  SELECT '202026020117' sno, 69.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020118' sno, 77.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020119' sno, 68.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020120' sno, 82.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020201' sno, 93.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020202' sno, 83.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020203' sno, 67.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020204' sno, 80.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020205' sno, 68.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020206' sno, 46.3 score, 'LATE' status, '时间复杂度分析' kp
  UNION ALL
  SELECT '202026020207' sno, 87.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020208' sno, 81.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020209' sno, 90.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020210' sno, 81.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020211' sno, 79.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020212' sno, 71.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020213' sno, 57.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020214' sno, 78.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020215' sno, 87.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020216' sno, 54.0 score, 'LATE' status, '图遍历算法' kp
  UNION ALL
  SELECT '202026020217' sno, 77.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020218' sno, 89.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020219' sno, 85.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020220' sno, 71.4 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05114' AND a.assessment_name = '第3次作业-贪心与图算法'
JOIN (
  SELECT '202026020101' sno, 92.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020102' sno, 72.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020103' sno, 87.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020104' sno, 88.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020105' sno, 63.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020106' sno, 56.9 score, 'ABSENT' status, '贪心算法' kp
  UNION ALL
  SELECT '202026020107' sno, 68.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020108' sno, 74.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020109' sno, 67.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020110' sno, 69.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020111' sno, 85.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020112' sno, 70.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020113' sno, 64.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020114' sno, 64.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020115' sno, 86.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020116' sno, 39.6 score, 'ABSENT' status, '最小生成树' kp
  UNION ALL
  SELECT '202026020117' sno, 75.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020118' sno, 84.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020119' sno, 67.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020120' sno, 83.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020201' sno, 100.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020202' sno, 84.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020203' sno, 58.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020204' sno, 78.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020205' sno, 69.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020206' sno, 47.6 score, 'ABSENT' status, '时间复杂度分析' kp
  UNION ALL
  SELECT '202026020207' sno, 89.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020208' sno, 76.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020209' sno, 93.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020210' sno, 76.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020211' sno, 78.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020212' sno, 75.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020213' sno, 61.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020214' sno, 71.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020215' sno, 80.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020216' sno, 59.4 score, 'ABSENT' status, '经典DP问题' kp
  UNION ALL
  SELECT '202026020217' sno, 80.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020218' sno, 82.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020219' sno, 80.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020220' sno, 71.9 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05114' AND a.assessment_name = '第1次测验-分治与DP'
JOIN (
  SELECT '202026020101' sno, 92.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020102' sno, 69.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020103' sno, 81.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020104' sno, 91.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020105' sno, 68.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020106' sno, 52.1 score, 'ON_TIME' status, '最小生成树' kp
  UNION ALL
  SELECT '202026020107' sno, 72.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020108' sno, 74.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020109' sno, 61.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020110' sno, 59.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020111' sno, 82.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020112' sno, 71.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020113' sno, 63.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020114' sno, 64.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020115' sno, 77.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020116' sno, 49.4 score, 'ON_TIME' status, '分治法应用' kp
  UNION ALL
  SELECT '202026020117' sno, 74.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020118' sno, 75.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020119' sno, 68.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020120' sno, 81.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020201' sno, 100.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020202' sno, 87.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020203' sno, 62.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020204' sno, 75.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020205' sno, 56.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020206' sno, 41.0 score, 'ON_TIME' status, '分治法应用' kp
  UNION ALL
  SELECT '202026020207' sno, 87.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020208' sno, 80.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020209' sno, 91.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020210' sno, 78.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020211' sno, 69.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020212' sno, 75.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020213' sno, 64.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020214' sno, 66.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020215' sno, 74.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020216' sno, 60.5 score, 'ON_TIME' status, '贪心算法' kp
  UNION ALL
  SELECT '202026020217' sno, 76.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020218' sno, 82.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020219' sno, 74.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020220' sno, 72.8 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05114' AND a.assessment_name = '第2次测验-图算法与回溯'
JOIN (
  SELECT '202026020101' sno, 99.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020102' sno, 66.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020103' sno, 80.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020104' sno, 80.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020105' sno, 61.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020106' sno, 49.1 score, 'ON_TIME' status, '分治法应用' kp
  UNION ALL
  SELECT '202026020107' sno, 61.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020108' sno, 72.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020109' sno, 68.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020110' sno, 60.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020111' sno, 80.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020112' sno, 67.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020113' sno, 69.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020114' sno, 62.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020115' sno, 87.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020116' sno, 38.0 score, 'ON_TIME' status, '回溯法' kp
  UNION ALL
  SELECT '202026020117' sno, 75.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020118' sno, 86.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020119' sno, 67.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020120' sno, 87.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020201' sno, 99.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020202' sno, 75.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020203' sno, 57.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020204' sno, 82.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020205' sno, 61.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020206' sno, 37.4 score, 'ON_TIME' status, '最小生成树' kp
  UNION ALL
  SELECT '202026020207' sno, 82.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020208' sno, 70.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020209' sno, 90.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020210' sno, 83.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020211' sno, 79.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020212' sno, 72.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020213' sno, 59.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020214' sno, 71.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020215' sno, 86.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020216' sno, 57.2 score, 'ON_TIME' status, '递归与分治' kp
  UNION ALL
  SELECT '202026020217' sno, 75.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020218' sno, 79.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020219' sno, 75.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020220' sno, 81.9 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05114' AND a.assessment_name = '期中考试'
JOIN (
  SELECT '202026020101' sno, 86.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020102' sno, 59.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020103' sno, 87.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020104' sno, 87.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020105' sno, 66.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020106' sno, 46.8 score, 'ON_TIME' status, '经典DP问题' kp
  UNION ALL
  SELECT '202026020107' sno, 71.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020108' sno, 72.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020109' sno, 68.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020110' sno, 59.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020111' sno, 86.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020112' sno, 71.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020113' sno, 66.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020114' sno, 52.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020115' sno, 82.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020116' sno, 38.2 score, 'ON_TIME' status, '递归与分治' kp
  UNION ALL
  SELECT '202026020117' sno, 65.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020118' sno, 73.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020119' sno, 55.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020120' sno, 80.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020201' sno, 100.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020202' sno, 78.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020203' sno, 53.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020204' sno, 79.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020205' sno, 58.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020206' sno, 34.6 score, 'ON_TIME' status, '经典DP问题' kp
  UNION ALL
  SELECT '202026020207' sno, 91.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020208' sno, 67.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020209' sno, 89.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020210' sno, 76.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020211' sno, 69.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020212' sno, 71.4 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020213' sno, 61.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020214' sno, 65.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020215' sno, 74.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020216' sno, 53.7 score, 'ON_TIME' status, '时间复杂度分析' kp
  UNION ALL
  SELECT '202026020217' sno, 84.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020218' sno, 76.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020219' sno, 71.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020220' sno, 66.9 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)
SELECT a.id, st.id, m.score, m.status, m.kp
FROM t_assessment a
JOIN t_course c ON a.course_id = c.id AND c.course_no = 'CS05114' AND a.assessment_name = '期末考试'
JOIN (
  SELECT '202026020101' sno, 84.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020102' sno, 68.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020103' sno, 77.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020104' sno, 84.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020105' sno, 66.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020106' sno, 48.3 score, 'ABSENT' status, '最短路径算法' kp
  UNION ALL
  SELECT '202026020107' sno, 56.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020108' sno, 65.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020109' sno, 54.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020110' sno, 70.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020111' sno, 81.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020112' sno, 63.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020113' sno, 67.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020114' sno, 52.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020115' sno, 71.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020116' sno, 37.9 score, 'ABSENT' status, '最小生成树' kp
  UNION ALL
  SELECT '202026020117' sno, 68.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020118' sno, 73.6 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020119' sno, 62.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020120' sno, 80.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020201' sno, 86.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020202' sno, 79.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020203' sno, 51.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020204' sno, 76.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020205' sno, 64.8 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020206' sno, 39.7 score, 'ABSENT' status, '分治法应用' kp
  UNION ALL
  SELECT '202026020207' sno, 80.2 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020208' sno, 79.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020209' sno, 84.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020210' sno, 81.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020211' sno, 66.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020212' sno, 74.3 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020213' sno, 62.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020214' sno, 64.0 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020215' sno, 76.5 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020216' sno, 59.9 score, 'ABSENT' status, '时间复杂度分析' kp
  UNION ALL
  SELECT '202026020217' sno, 70.7 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020218' sno, 87.1 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020219' sno, 82.9 score, 'ON_TIME' status, NULL kp
  UNION ALL
  SELECT '202026020220' sno, 69.6 score, 'ON_TIME' status, NULL kp
) m
JOIN t_student st ON st.student_no = m.sno;

-- ============================================================
-- Part 7: 考勤（t_attendance）：每生 10 次（每周一次）
-- ============================================================
-- CS05112 操作系统
INSERT IGNORE INTO t_attendance (course_id, student_id, attendance_date, status, week_no, period, semester)
SELECT c.id, st.id, w.d,
  CASE
    WHEN st.student_no IN ('202026010106', '202026010116', '202026010206', '202026010216') AND w.n IN (2,5,8) THEN '缺勤'
    WHEN st.student_no IN ('202026010106', '202026010116', '202026010206', '202026010216') AND w.n = 4 THEN '迟到'
    WHEN st.student_no IN ('202026010102', '202026010112', '202026010203', '202026010213') AND w.n = 6 THEN '请假'
    ELSE '出勤'
  END,
  w.n, '第1-2节', '2025-2026-1'
FROM t_course c
JOIN t_student st ON st.class_name IN ('计科2001', '计科2002')
  AND EXISTS (SELECT 1 FROM t_course_student cs WHERE cs.student_id = st.id AND cs.course_id = c.id)
CROSS JOIN (
  SELECT 1 n, '2025-09-01' d UNION ALL SELECT 2 n, '2025-09-08' d UNION ALL SELECT 3 n, '2025-09-15' d UNION ALL SELECT 4 n, '2025-09-22' d UNION ALL SELECT 5 n, '2025-09-29' d UNION ALL SELECT 6 n, '2025-10-06' d UNION ALL SELECT 7 n, '2025-10-13' d UNION ALL SELECT 8 n, '2025-10-20' d UNION ALL SELECT 9 n, '2025-10-27' d UNION ALL SELECT 10 n, '2025-11-03' d
) w
WHERE c.course_no = 'CS05112';

-- CS05113 计算机组成原理
INSERT IGNORE INTO t_attendance (course_id, student_id, attendance_date, status, week_no, period, semester)
SELECT c.id, st.id, w.d,
  CASE
    WHEN st.student_no IN ('202026010306', '202026010316', '202026010406', '202026010416') AND w.n IN (2,5,8) THEN '缺勤'
    WHEN st.student_no IN ('202026010306', '202026010316', '202026010406', '202026010416') AND w.n = 4 THEN '迟到'
    WHEN st.student_no IN ('202026010302', '202026010312', '202026010403', '202026010413') AND w.n = 6 THEN '请假'
    ELSE '出勤'
  END,
  w.n, '第1-2节', '2025-2026-1'
FROM t_course c
JOIN t_student st ON st.class_name IN ('计科2003', '计科2004')
  AND EXISTS (SELECT 1 FROM t_course_student cs WHERE cs.student_id = st.id AND cs.course_id = c.id)
CROSS JOIN (
  SELECT 1 n, '2025-09-01' d UNION ALL SELECT 2 n, '2025-09-08' d UNION ALL SELECT 3 n, '2025-09-15' d UNION ALL SELECT 4 n, '2025-09-22' d UNION ALL SELECT 5 n, '2025-09-29' d UNION ALL SELECT 6 n, '2025-10-06' d UNION ALL SELECT 7 n, '2025-10-13' d UNION ALL SELECT 8 n, '2025-10-20' d UNION ALL SELECT 9 n, '2025-10-27' d UNION ALL SELECT 10 n, '2025-11-03' d
) w
WHERE c.course_no = 'CS05113';

-- CS05114 算法设计与分析
INSERT IGNORE INTO t_attendance (course_id, student_id, attendance_date, status, week_no, period, semester)
SELECT c.id, st.id, w.d,
  CASE
    WHEN st.student_no IN ('202026020106', '202026020116', '202026020206', '202026020216') AND w.n IN (2,5,8) THEN '缺勤'
    WHEN st.student_no IN ('202026020106', '202026020116', '202026020206', '202026020216') AND w.n = 4 THEN '迟到'
    WHEN st.student_no IN ('202026020102', '202026020112', '202026020203', '202026020213') AND w.n = 6 THEN '请假'
    ELSE '出勤'
  END,
  w.n, '第1-2节', '2025-2026-1'
FROM t_course c
JOIN t_student st ON st.class_name IN ('软件2001', '软件2002')
  AND EXISTS (SELECT 1 FROM t_course_student cs WHERE cs.student_id = st.id AND cs.course_id = c.id)
CROSS JOIN (
  SELECT 1 n, '2025-09-01' d UNION ALL SELECT 2 n, '2025-09-08' d UNION ALL SELECT 3 n, '2025-09-15' d UNION ALL SELECT 4 n, '2025-09-22' d UNION ALL SELECT 5 n, '2025-09-29' d UNION ALL SELECT 6 n, '2025-10-06' d UNION ALL SELECT 7 n, '2025-10-13' d UNION ALL SELECT 8 n, '2025-10-20' d UNION ALL SELECT 9 n, '2025-10-27' d UNION ALL SELECT 10 n, '2025-11-03' d
) w
WHERE c.course_no = 'CS05114';

-- ============================================================
-- Part 8: 实验报告（t_experiment）：每生 2 次
-- ============================================================
-- CS05112 操作系统
INSERT IGNORE INTO t_experiment (course_id, student_id, experiment_name, experiment_no, score, semester)
SELECT c.id, st.id, '实验1-进程调度模拟', 1, m.score, '2025-2026-1'
FROM (
  SELECT '202026010101' sno, 100.0 score
  UNION ALL
  SELECT '202026010102' sno, 77.5 score
  UNION ALL
  SELECT '202026010103' sno, 85.8 score
  UNION ALL
  SELECT '202026010104' sno, 81.5 score
  UNION ALL
  SELECT '202026010105' sno, 79.8 score
  UNION ALL
  SELECT '202026010106' sno, 58.2 score
  UNION ALL
  SELECT '202026010107' sno, 69.9 score
  UNION ALL
  SELECT '202026010108' sno, 73.5 score
  UNION ALL
  SELECT '202026010109' sno, 69.2 score
  UNION ALL
  SELECT '202026010110' sno, 87.2 score
  UNION ALL
  SELECT '202026010111' sno, 61.3 score
  UNION ALL
  SELECT '202026010112' sno, 89.7 score
  UNION ALL
  SELECT '202026010113' sno, 88.5 score
  UNION ALL
  SELECT '202026010114' sno, 90.8 score
  UNION ALL
  SELECT '202026010115' sno, 72.6 score
  UNION ALL
  SELECT '202026010116' sno, 57.0 score
  UNION ALL
  SELECT '202026010117' sno, 64.3 score
  UNION ALL
  SELECT '202026010118' sno, 94.0 score
  UNION ALL
  SELECT '202026010119' sno, 62.3 score
  UNION ALL
  SELECT '202026010120' sno, 81.5 score
  UNION ALL
  SELECT '202026010201' sno, 93.9 score
  UNION ALL
  SELECT '202026010202' sno, 73.5 score
  UNION ALL
  SELECT '202026010203' sno, 91.7 score
  UNION ALL
  SELECT '202026010204' sno, 94.5 score
  UNION ALL
  SELECT '202026010205' sno, 78.0 score
  UNION ALL
  SELECT '202026010206' sno, 66.2 score
  UNION ALL
  SELECT '202026010207' sno, 83.7 score
  UNION ALL
  SELECT '202026010208' sno, 69.6 score
  UNION ALL
  SELECT '202026010209' sno, 66.4 score
  UNION ALL
  SELECT '202026010210' sno, 65.0 score
  UNION ALL
  SELECT '202026010211' sno, 69.4 score
  UNION ALL
  SELECT '202026010212' sno, 91.0 score
  UNION ALL
  SELECT '202026010213' sno, 76.1 score
  UNION ALL
  SELECT '202026010214' sno, 75.3 score
  UNION ALL
  SELECT '202026010215' sno, 84.0 score
  UNION ALL
  SELECT '202026010216' sno, 68.0 score
  UNION ALL
  SELECT '202026010217' sno, 60.9 score
  UNION ALL
  SELECT '202026010218' sno, 61.9 score
  UNION ALL
  SELECT '202026010219' sno, 62.7 score
  UNION ALL
  SELECT '202026010220' sno, 73.7 score
) m
JOIN t_student st ON st.student_no = m.sno
JOIN t_course c ON c.course_no = 'CS05112'
WHERE NOT EXISTS (SELECT 1 FROM t_experiment e WHERE e.course_id = c.id AND e.student_id = st.id AND e.experiment_no = 1);

INSERT IGNORE INTO t_experiment (course_id, student_id, experiment_name, experiment_no, score, semester)
SELECT c.id, st.id, '实验2-页面置换算法模拟', 2, m.score, '2025-2026-1'
FROM (
  SELECT '202026010101' sno, 98.7 score
  UNION ALL
  SELECT '202026010102' sno, 73.0 score
  UNION ALL
  SELECT '202026010103' sno, 90.2 score
  UNION ALL
  SELECT '202026010104' sno, 81.7 score
  UNION ALL
  SELECT '202026010105' sno, 75.9 score
  UNION ALL
  SELECT '202026010106' sno, 57.2 score
  UNION ALL
  SELECT '202026010107' sno, 65.5 score
  UNION ALL
  SELECT '202026010108' sno, 72.8 score
  UNION ALL
  SELECT '202026010109' sno, 75.3 score
  UNION ALL
  SELECT '202026010110' sno, 88.2 score
  UNION ALL
  SELECT '202026010111' sno, 63.0 score
  UNION ALL
  SELECT '202026010112' sno, 85.4 score
  UNION ALL
  SELECT '202026010113' sno, 78.4 score
  UNION ALL
  SELECT '202026010114' sno, 86.4 score
  UNION ALL
  SELECT '202026010115' sno, 68.4 score
  UNION ALL
  SELECT '202026010116' sno, 56.5 score
  UNION ALL
  SELECT '202026010117' sno, 65.5 score
  UNION ALL
  SELECT '202026010118' sno, 88.2 score
  UNION ALL
  SELECT '202026010119' sno, 63.9 score
  UNION ALL
  SELECT '202026010120' sno, 85.4 score
  UNION ALL
  SELECT '202026010201' sno, 100.0 score
  UNION ALL
  SELECT '202026010202' sno, 73.1 score
  UNION ALL
  SELECT '202026010203' sno, 86.3 score
  UNION ALL
  SELECT '202026010204' sno, 86.3 score
  UNION ALL
  SELECT '202026010205' sno, 72.2 score
  UNION ALL
  SELECT '202026010206' sno, 62.9 score
  UNION ALL
  SELECT '202026010207' sno, 78.3 score
  UNION ALL
  SELECT '202026010208' sno, 72.2 score
  UNION ALL
  SELECT '202026010209' sno, 69.0 score
  UNION ALL
  SELECT '202026010210' sno, 63.4 score
  UNION ALL
  SELECT '202026010211' sno, 68.4 score
  UNION ALL
  SELECT '202026010212' sno, 82.4 score
  UNION ALL
  SELECT '202026010213' sno, 75.6 score
  UNION ALL
  SELECT '202026010214' sno, 72.1 score
  UNION ALL
  SELECT '202026010215' sno, 81.2 score
  UNION ALL
  SELECT '202026010216' sno, 63.2 score
  UNION ALL
  SELECT '202026010217' sno, 66.3 score
  UNION ALL
  SELECT '202026010218' sno, 68.9 score
  UNION ALL
  SELECT '202026010219' sno, 61.0 score
  UNION ALL
  SELECT '202026010220' sno, 75.4 score
) m
JOIN t_student st ON st.student_no = m.sno
JOIN t_course c ON c.course_no = 'CS05112'
WHERE NOT EXISTS (SELECT 1 FROM t_experiment e WHERE e.course_id = c.id AND e.student_id = st.id AND e.experiment_no = 2);

-- CS05113 计算机组成原理
INSERT IGNORE INTO t_experiment (course_id, student_id, experiment_name, experiment_no, score, semester)
SELECT c.id, st.id, '实验1-算术逻辑单元设计', 1, m.score, '2025-2026-1'
FROM (
  SELECT '202026010301' sno, 97.2 score
  UNION ALL
  SELECT '202026010302' sno, 88.6 score
  UNION ALL
  SELECT '202026010303' sno, 71.1 score
  UNION ALL
  SELECT '202026010304' sno, 80.7 score
  UNION ALL
  SELECT '202026010305' sno, 65.5 score
  UNION ALL
  SELECT '202026010306' sno, 64.0 score
  UNION ALL
  SELECT '202026010307' sno, 84.1 score
  UNION ALL
  SELECT '202026010308' sno, 72.9 score
  UNION ALL
  SELECT '202026010309' sno, 88.5 score
  UNION ALL
  SELECT '202026010310' sno, 62.9 score
  UNION ALL
  SELECT '202026010311' sno, 77.9 score
  UNION ALL
  SELECT '202026010312' sno, 80.0 score
  UNION ALL
  SELECT '202026010313' sno, 91.5 score
  UNION ALL
  SELECT '202026010314' sno, 84.2 score
  UNION ALL
  SELECT '202026010315' sno, 75.1 score
  UNION ALL
  SELECT '202026010316' sno, 63.9 score
  UNION ALL
  SELECT '202026010317' sno, 72.7 score
  UNION ALL
  SELECT '202026010318' sno, 84.4 score
  UNION ALL
  SELECT '202026010319' sno, 65.2 score
  UNION ALL
  SELECT '202026010320' sno, 78.6 score
  UNION ALL
  SELECT '202026010401' sno, 93.2 score
  UNION ALL
  SELECT '202026010402' sno, 61.5 score
  UNION ALL
  SELECT '202026010403' sno, 73.1 score
  UNION ALL
  SELECT '202026010404' sno, 76.1 score
  UNION ALL
  SELECT '202026010405' sno, 70.9 score
  UNION ALL
  SELECT '202026010406' sno, 58.9 score
  UNION ALL
  SELECT '202026010407' sno, 84.8 score
  UNION ALL
  SELECT '202026010408' sno, 87.8 score
  UNION ALL
  SELECT '202026010409' sno, 91.1 score
  UNION ALL
  SELECT '202026010410' sno, 83.6 score
  UNION ALL
  SELECT '202026010411' sno, 72.3 score
  UNION ALL
  SELECT '202026010412' sno, 83.0 score
  UNION ALL
  SELECT '202026010413' sno, 63.2 score
  UNION ALL
  SELECT '202026010414' sno, 82.9 score
  UNION ALL
  SELECT '202026010415' sno, 76.7 score
  UNION ALL
  SELECT '202026010416' sno, 60.3 score
  UNION ALL
  SELECT '202026010417' sno, 73.0 score
  UNION ALL
  SELECT '202026010418' sno, 63.9 score
  UNION ALL
  SELECT '202026010419' sno, 80.6 score
  UNION ALL
  SELECT '202026010420' sno, 64.9 score
) m
JOIN t_student st ON st.student_no = m.sno
JOIN t_course c ON c.course_no = 'CS05113'
WHERE NOT EXISTS (SELECT 1 FROM t_experiment e WHERE e.course_id = c.id AND e.student_id = st.id AND e.experiment_no = 1);

INSERT IGNORE INTO t_experiment (course_id, student_id, experiment_name, experiment_no, score, semester)
SELECT c.id, st.id, '实验2-存储系统设计', 2, m.score, '2025-2026-1'
FROM (
  SELECT '202026010301' sno, 96.0 score
  UNION ALL
  SELECT '202026010302' sno, 92.5 score
  UNION ALL
  SELECT '202026010303' sno, 69.3 score
  UNION ALL
  SELECT '202026010304' sno, 80.5 score
  UNION ALL
  SELECT '202026010305' sno, 71.5 score
  UNION ALL
  SELECT '202026010306' sno, 62.2 score
  UNION ALL
  SELECT '202026010307' sno, 86.1 score
  UNION ALL
  SELECT '202026010308' sno, 76.7 score
  UNION ALL
  SELECT '202026010309' sno, 87.4 score
  UNION ALL
  SELECT '202026010310' sno, 65.6 score
  UNION ALL
  SELECT '202026010311' sno, 73.6 score
  UNION ALL
  SELECT '202026010312' sno, 75.1 score
  UNION ALL
  SELECT '202026010313' sno, 86.2 score
  UNION ALL
  SELECT '202026010314' sno, 89.8 score
  UNION ALL
  SELECT '202026010315' sno, 67.5 score
  UNION ALL
  SELECT '202026010316' sno, 57.8 score
  UNION ALL
  SELECT '202026010317' sno, 79.3 score
  UNION ALL
  SELECT '202026010318' sno, 83.8 score
  UNION ALL
  SELECT '202026010319' sno, 62.2 score
  UNION ALL
  SELECT '202026010320' sno, 79.4 score
  UNION ALL
  SELECT '202026010401' sno, 93.7 score
  UNION ALL
  SELECT '202026010402' sno, 65.2 score
  UNION ALL
  SELECT '202026010403' sno, 73.7 score
  UNION ALL
  SELECT '202026010404' sno, 82.0 score
  UNION ALL
  SELECT '202026010405' sno, 78.1 score
  UNION ALL
  SELECT '202026010406' sno, 61.8 score
  UNION ALL
  SELECT '202026010407' sno, 85.7 score
  UNION ALL
  SELECT '202026010408' sno, 94.1 score
  UNION ALL
  SELECT '202026010409' sno, 87.1 score
  UNION ALL
  SELECT '202026010410' sno, 82.4 score
  UNION ALL
  SELECT '202026010411' sno, 75.0 score
  UNION ALL
  SELECT '202026010412' sno, 86.6 score
  UNION ALL
  SELECT '202026010413' sno, 63.7 score
  UNION ALL
  SELECT '202026010414' sno, 79.6 score
  UNION ALL
  SELECT '202026010415' sno, 69.0 score
  UNION ALL
  SELECT '202026010416' sno, 65.5 score
  UNION ALL
  SELECT '202026010417' sno, 73.4 score
  UNION ALL
  SELECT '202026010418' sno, 61.7 score
  UNION ALL
  SELECT '202026010419' sno, 84.0 score
  UNION ALL
  SELECT '202026010420' sno, 66.5 score
) m
JOIN t_student st ON st.student_no = m.sno
JOIN t_course c ON c.course_no = 'CS05113'
WHERE NOT EXISTS (SELECT 1 FROM t_experiment e WHERE e.course_id = c.id AND e.student_id = st.id AND e.experiment_no = 2);

-- CS05114 算法设计与分析
INSERT IGNORE INTO t_experiment (course_id, student_id, experiment_name, experiment_no, score, semester)
SELECT c.id, st.id, '实验1-排序算法比较', 1, m.score, '2025-2026-1'
FROM (
  SELECT '202026020101' sno, 90.6 score
  UNION ALL
  SELECT '202026020102' sno, 68.9 score
  UNION ALL
  SELECT '202026020103' sno, 84.7 score
  UNION ALL
  SELECT '202026020104' sno, 88.2 score
  UNION ALL
  SELECT '202026020105' sno, 72.0 score
  UNION ALL
  SELECT '202026020106' sno, 64.1 score
  UNION ALL
  SELECT '202026020107' sno, 71.0 score
  UNION ALL
  SELECT '202026020108' sno, 73.5 score
  UNION ALL
  SELECT '202026020109' sno, 69.4 score
  UNION ALL
  SELECT '202026020110' sno, 69.7 score
  UNION ALL
  SELECT '202026020111' sno, 90.0 score
  UNION ALL
  SELECT '202026020112' sno, 80.2 score
  UNION ALL
  SELECT '202026020113' sno, 66.4 score
  UNION ALL
  SELECT '202026020114' sno, 61.3 score
  UNION ALL
  SELECT '202026020115' sno, 85.0 score
  UNION ALL
  SELECT '202026020116' sno, 59.1 score
  UNION ALL
  SELECT '202026020117' sno, 75.9 score
  UNION ALL
  SELECT '202026020118' sno, 85.8 score
  UNION ALL
  SELECT '202026020119' sno, 69.7 score
  UNION ALL
  SELECT '202026020120' sno, 88.3 score
  UNION ALL
  SELECT '202026020201' sno, 100.0 score
  UNION ALL
  SELECT '202026020202' sno, 89.2 score
  UNION ALL
  SELECT '202026020203' sno, 70.3 score
  UNION ALL
  SELECT '202026020204' sno, 75.6 score
  UNION ALL
  SELECT '202026020205' sno, 63.6 score
  UNION ALL
  SELECT '202026020206' sno, 65.1 score
  UNION ALL
  SELECT '202026020207' sno, 92.1 score
  UNION ALL
  SELECT '202026020208' sno, 74.3 score
  UNION ALL
  SELECT '202026020209' sno, 95.1 score
  UNION ALL
  SELECT '202026020210' sno, 83.2 score
  UNION ALL
  SELECT '202026020211' sno, 73.4 score
  UNION ALL
  SELECT '202026020212' sno, 76.5 score
  UNION ALL
  SELECT '202026020213' sno, 65.0 score
  UNION ALL
  SELECT '202026020214' sno, 79.7 score
  UNION ALL
  SELECT '202026020215' sno, 89.0 score
  UNION ALL
  SELECT '202026020216' sno, 65.1 score
  UNION ALL
  SELECT '202026020217' sno, 83.9 score
  UNION ALL
  SELECT '202026020218' sno, 84.6 score
  UNION ALL
  SELECT '202026020219' sno, 82.0 score
  UNION ALL
  SELECT '202026020220' sno, 84.2 score
) m
JOIN t_student st ON st.student_no = m.sno
JOIN t_course c ON c.course_no = 'CS05114'
WHERE NOT EXISTS (SELECT 1 FROM t_experiment e WHERE e.course_id = c.id AND e.student_id = st.id AND e.experiment_no = 1);

INSERT IGNORE INTO t_experiment (course_id, student_id, experiment_name, experiment_no, score, semester)
SELECT c.id, st.id, '实验2-最短路径算法实现', 2, m.score, '2025-2026-1'
FROM (
  SELECT '202026020101' sno, 97.4 score
  UNION ALL
  SELECT '202026020102' sno, 65.8 score
  UNION ALL
  SELECT '202026020103' sno, 89.8 score
  UNION ALL
  SELECT '202026020104' sno, 89.6 score
  UNION ALL
  SELECT '202026020105' sno, 72.8 score
  UNION ALL
  SELECT '202026020106' sno, 61.7 score
  UNION ALL
  SELECT '202026020107' sno, 72.7 score
  UNION ALL
  SELECT '202026020108' sno, 76.2 score
  UNION ALL
  SELECT '202026020109' sno, 72.6 score
  UNION ALL
  SELECT '202026020110' sno, 71.3 score
  UNION ALL
  SELECT '202026020111' sno, 87.4 score
  UNION ALL
  SELECT '202026020112' sno, 68.7 score
  UNION ALL
  SELECT '202026020113' sno, 68.1 score
  UNION ALL
  SELECT '202026020114' sno, 65.9 score
  UNION ALL
  SELECT '202026020115' sno, 89.2 score
  UNION ALL
  SELECT '202026020116' sno, 56.7 score
  UNION ALL
  SELECT '202026020117' sno, 72.4 score
  UNION ALL
  SELECT '202026020118' sno, 82.0 score
  UNION ALL
  SELECT '202026020119' sno, 70.4 score
  UNION ALL
  SELECT '202026020120' sno, 88.4 score
  UNION ALL
  SELECT '202026020201' sno, 99.6 score
  UNION ALL
  SELECT '202026020202' sno, 85.8 score
  UNION ALL
  SELECT '202026020203' sno, 69.8 score
  UNION ALL
  SELECT '202026020204' sno, 78.6 score
  UNION ALL
  SELECT '202026020205' sno, 70.9 score
  UNION ALL
  SELECT '202026020206' sno, 63.1 score
  UNION ALL
  SELECT '202026020207' sno, 86.5 score
  UNION ALL
  SELECT '202026020208' sno, 76.0 score
  UNION ALL
  SELECT '202026020209' sno, 93.0 score
  UNION ALL
  SELECT '202026020210' sno, 76.1 score
  UNION ALL
  SELECT '202026020211' sno, 78.4 score
  UNION ALL
  SELECT '202026020212' sno, 75.1 score
  UNION ALL
  SELECT '202026020213' sno, 65.9 score
  UNION ALL
  SELECT '202026020214' sno, 77.7 score
  UNION ALL
  SELECT '202026020215' sno, 80.5 score
  UNION ALL
  SELECT '202026020216' sno, 56.4 score
  UNION ALL
  SELECT '202026020217' sno, 80.8 score
  UNION ALL
  SELECT '202026020218' sno, 81.6 score
  UNION ALL
  SELECT '202026020219' sno, 78.0 score
  UNION ALL
  SELECT '202026020220' sno, 81.5 score
) m
JOIN t_student st ON st.student_no = m.sno
JOIN t_course c ON c.course_no = 'CS05114'
WHERE NOT EXISTS (SELECT 1 FROM t_experiment e WHERE e.course_id = c.id AND e.student_id = st.id AND e.experiment_no = 2);

-- ============================================================
-- Part 9: 知识点掌握度（t_student_kp_mastery）：每生 × 每三级知识点
-- ============================================================
-- CS05112 操作系统
INSERT IGNORE INTO t_student_kp_mastery (student_id, course_id, kp_name, mastery_rate, lose_count, total_question_count)
SELECT st.id, c.id, kp.kp_name,
  GREATEST(5.0, LEAST(100.0,
    (CASE
      WHEN st.student_no IN ('202026010101', '202026010201') THEN 88
      WHEN st.student_no IN ('202026010106', '202026010116', '202026010206', '202026010216') THEN 34
      ELSE 72
    END) + MOD(kp.sort_order * 7, 20) - 10
  )),
  MOD(kp.sort_order, 4), 5 + MOD(kp.sort_order, 6)
FROM t_course c
JOIN t_student st ON st.class_name IN ('计科2001', '计科2002')
  AND EXISTS (SELECT 1 FROM t_course_student cs WHERE cs.student_id = st.id AND cs.course_id = c.id)
JOIN t_knowledge_point kp ON kp.course_id = c.id AND kp.level = 3
WHERE c.course_no = 'CS05112';

-- CS05113 计算机组成原理
INSERT IGNORE INTO t_student_kp_mastery (student_id, course_id, kp_name, mastery_rate, lose_count, total_question_count)
SELECT st.id, c.id, kp.kp_name,
  GREATEST(5.0, LEAST(100.0,
    (CASE
      WHEN st.student_no IN ('202026010301', '202026010401') THEN 88
      WHEN st.student_no IN ('202026010306', '202026010316', '202026010406', '202026010416') THEN 34
      ELSE 72
    END) + MOD(kp.sort_order * 7, 20) - 10
  )),
  MOD(kp.sort_order, 4), 5 + MOD(kp.sort_order, 6)
FROM t_course c
JOIN t_student st ON st.class_name IN ('计科2003', '计科2004')
  AND EXISTS (SELECT 1 FROM t_course_student cs WHERE cs.student_id = st.id AND cs.course_id = c.id)
JOIN t_knowledge_point kp ON kp.course_id = c.id AND kp.level = 3
WHERE c.course_no = 'CS05113';

-- CS05114 算法设计与分析
INSERT IGNORE INTO t_student_kp_mastery (student_id, course_id, kp_name, mastery_rate, lose_count, total_question_count)
SELECT st.id, c.id, kp.kp_name,
  GREATEST(5.0, LEAST(100.0,
    (CASE
      WHEN st.student_no IN ('202026020101', '202026020201') THEN 88
      WHEN st.student_no IN ('202026020106', '202026020116', '202026020206', '202026020216') THEN 34
      ELSE 72
    END) + MOD(kp.sort_order * 7, 20) - 10
  )),
  MOD(kp.sort_order, 4), 5 + MOD(kp.sort_order, 6)
FROM t_course c
JOIN t_student st ON st.class_name IN ('软件2001', '软件2002')
  AND EXISTS (SELECT 1 FROM t_course_student cs WHERE cs.student_id = st.id AND cs.course_id = c.id)
JOIN t_knowledge_point kp ON kp.course_id = c.id AND kp.level = 3
WHERE c.course_no = 'CS05114';

-- ============================================================
-- Part 10: 预警记录（t_warning_record）：针对每班的弱生生成
-- ============================================================
INSERT IGNORE INTO t_warning_record (student_id, course_id, rule_id, warning_type, severity, warning_msg)
SELECT st.id, c.id, wr.id, wr.rule_type, m.severity, m.msg
FROM (
  SELECT '202026010106' sno, 'CS05112' cno, '缺勤过多预警' rule_name, 'HIGH' severity, '[预警] 方鑫豪同学已缺勤3次，成绩偏低，建议重点关注' msg
  UNION ALL
  SELECT '202026010106' sno, 'CS05112' cno, '知识点严重薄弱预警' rule_name, 'MEDIUM' severity, '[预警] 方鑫豪同学存在多个知识点掌握率低于30%，建议安排辅导' msg
  UNION ALL
  SELECT '202026010106' sno, 'CS05112' cno, '成绩持续下滑预警' rule_name, 'HIGH' severity, '[预警] 方鑫豪同学期末成绩较期中明显下滑，存在挂科风险' msg
  UNION ALL
  SELECT '202026010116' sno, 'CS05112' cno, '缺勤过多预警' rule_name, 'HIGH' severity, '[预警] 施杰杰同学已缺勤3次，成绩偏低，建议重点关注' msg
  UNION ALL
  SELECT '202026010116' sno, 'CS05112' cno, '知识点严重薄弱预警' rule_name, 'MEDIUM' severity, '[预警] 施杰杰同学存在多个知识点掌握率低于30%，建议安排辅导' msg
  UNION ALL
  SELECT '202026010116' sno, 'CS05112' cno, '成绩持续下滑预警' rule_name, 'HIGH' severity, '[预警] 施杰杰同学期末成绩较期中明显下滑，存在挂科风险' msg
  UNION ALL
  SELECT '202026010206' sno, 'CS05112' cno, '缺勤过多预警' rule_name, 'HIGH' severity, '[预警] 戚嘉浩同学已缺勤3次，成绩偏低，建议重点关注' msg
  UNION ALL
  SELECT '202026010206' sno, 'CS05112' cno, '知识点严重薄弱预警' rule_name, 'MEDIUM' severity, '[预警] 戚嘉浩同学存在多个知识点掌握率低于30%，建议安排辅导' msg
  UNION ALL
  SELECT '202026010206' sno, 'CS05112' cno, '成绩持续下滑预警' rule_name, 'HIGH' severity, '[预警] 戚嘉浩同学期末成绩较期中明显下滑，存在挂科风险' msg
  UNION ALL
  SELECT '202026010216' sno, 'CS05112' cno, '缺勤过多预警' rule_name, 'HIGH' severity, '[预警] 孙艳同学已缺勤3次，成绩偏低，建议重点关注' msg
  UNION ALL
  SELECT '202026010216' sno, 'CS05112' cno, '知识点严重薄弱预警' rule_name, 'MEDIUM' severity, '[预警] 孙艳同学存在多个知识点掌握率低于30%，建议安排辅导' msg
  UNION ALL
  SELECT '202026010216' sno, 'CS05112' cno, '成绩持续下滑预警' rule_name, 'HIGH' severity, '[预警] 孙艳同学期末成绩较期中明显下滑，存在挂科风险' msg
  UNION ALL
  SELECT '202026010306' sno, 'CS05113' cno, '缺勤过多预警' rule_name, 'HIGH' severity, '[预警] 秦轩同学已缺勤3次，成绩偏低，建议重点关注' msg
  UNION ALL
  SELECT '202026010306' sno, 'CS05113' cno, '知识点严重薄弱预警' rule_name, 'MEDIUM' severity, '[预警] 秦轩同学存在多个知识点掌握率低于30%，建议安排辅导' msg
  UNION ALL
  SELECT '202026010306' sno, 'CS05113' cno, '成绩持续下滑预警' rule_name, 'HIGH' severity, '[预警] 秦轩同学期末成绩较期中明显下滑，存在挂科风险' msg
  UNION ALL
  SELECT '202026010316' sno, 'CS05113' cno, '缺勤过多预警' rule_name, 'HIGH' severity, '[预警] 杨子轩同学已缺勤3次，成绩偏低，建议重点关注' msg
  UNION ALL
  SELECT '202026010316' sno, 'CS05113' cno, '知识点严重薄弱预警' rule_name, 'MEDIUM' severity, '[预警] 杨子轩同学存在多个知识点掌握率低于30%，建议安排辅导' msg
  UNION ALL
  SELECT '202026010316' sno, 'CS05113' cno, '成绩持续下滑预警' rule_name, 'HIGH' severity, '[预警] 杨子轩同学期末成绩较期中明显下滑，存在挂科风险' msg
  UNION ALL
  SELECT '202026010406' sno, 'CS05113' cno, '缺勤过多预警' rule_name, 'HIGH' severity, '[预警] 花曦同学已缺勤3次，成绩偏低，建议重点关注' msg
  UNION ALL
  SELECT '202026010406' sno, 'CS05113' cno, '知识点严重薄弱预警' rule_name, 'MEDIUM' severity, '[预警] 花曦同学存在多个知识点掌握率低于30%，建议安排辅导' msg
  UNION ALL
  SELECT '202026010406' sno, 'CS05113' cno, '成绩持续下滑预警' rule_name, 'HIGH' severity, '[预警] 花曦同学期末成绩较期中明显下滑，存在挂科风险' msg
  UNION ALL
  SELECT '202026010416' sno, 'CS05113' cno, '缺勤过多预警' rule_name, 'HIGH' severity, '[预警] 许俊丽同学已缺勤3次，成绩偏低，建议重点关注' msg
  UNION ALL
  SELECT '202026010416' sno, 'CS05113' cno, '知识点严重薄弱预警' rule_name, 'MEDIUM' severity, '[预警] 许俊丽同学存在多个知识点掌握率低于30%，建议安排辅导' msg
  UNION ALL
  SELECT '202026010416' sno, 'CS05113' cno, '成绩持续下滑预警' rule_name, 'HIGH' severity, '[预警] 许俊丽同学期末成绩较期中明显下滑，存在挂科风险' msg
  UNION ALL
  SELECT '202026020106' sno, 'CS05114' cno, '缺勤过多预警' rule_name, 'HIGH' severity, '[预警] 郑丽同学已缺勤3次，成绩偏低，建议重点关注' msg
  UNION ALL
  SELECT '202026020106' sno, 'CS05114' cno, '知识点严重薄弱预警' rule_name, 'MEDIUM' severity, '[预警] 郑丽同学存在多个知识点掌握率低于30%，建议安排辅导' msg
  UNION ALL
  SELECT '202026020106' sno, 'CS05114' cno, '成绩持续下滑预警' rule_name, 'HIGH' severity, '[预警] 郑丽同学期末成绩较期中明显下滑，存在挂科风险' msg
  UNION ALL
  SELECT '202026020116' sno, 'CS05114' cno, '缺勤过多预警' rule_name, 'HIGH' severity, '[预警] 朱博博同学已缺勤3次，成绩偏低，建议重点关注' msg
  UNION ALL
  SELECT '202026020116' sno, 'CS05114' cno, '知识点严重薄弱预警' rule_name, 'MEDIUM' severity, '[预警] 朱博博同学存在多个知识点掌握率低于30%，建议安排辅导' msg
  UNION ALL
  SELECT '202026020116' sno, 'CS05114' cno, '成绩持续下滑预警' rule_name, 'HIGH' severity, '[预警] 朱博博同学期末成绩较期中明显下滑，存在挂科风险' msg
  UNION ALL
  SELECT '202026020206' sno, 'CS05114' cno, '缺勤过多预警' rule_name, 'HIGH' severity, '[预警] 杨芳同学已缺勤3次，成绩偏低，建议重点关注' msg
  UNION ALL
  SELECT '202026020206' sno, 'CS05114' cno, '知识点严重薄弱预警' rule_name, 'MEDIUM' severity, '[预警] 杨芳同学存在多个知识点掌握率低于30%，建议安排辅导' msg
  UNION ALL
  SELECT '202026020206' sno, 'CS05114' cno, '成绩持续下滑预警' rule_name, 'HIGH' severity, '[预警] 杨芳同学期末成绩较期中明显下滑，存在挂科风险' msg
  UNION ALL
  SELECT '202026020216' sno, 'CS05114' cno, '缺勤过多预警' rule_name, 'HIGH' severity, '[预警] 姜思平同学已缺勤3次，成绩偏低，建议重点关注' msg
  UNION ALL
  SELECT '202026020216' sno, 'CS05114' cno, '知识点严重薄弱预警' rule_name, 'MEDIUM' severity, '[预警] 姜思平同学存在多个知识点掌握率低于30%，建议安排辅导' msg
  UNION ALL
  SELECT '202026020216' sno, 'CS05114' cno, '成绩持续下滑预警' rule_name, 'HIGH' severity, '[预警] 姜思平同学期末成绩较期中明显下滑，存在挂科风险' msg
) m
JOIN t_student st ON st.student_no = m.sno
JOIN t_course c ON c.course_no = m.cno
JOIN t_warning_rule wr ON wr.rule_name = m.rule_name
WHERE NOT EXISTS (SELECT 1 FROM t_warning_record w WHERE w.student_id = st.id AND w.warning_msg = m.msg);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================ 生成结束 ============================
