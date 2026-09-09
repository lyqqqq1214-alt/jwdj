-- ============================================================
-- AITAES 题库种子数据 — 计算机网络 & 408考研真题
-- 自动生成于: generate_question_bank_sql.py
-- 数据来源:
--   1. 计算机网络试题库含答案2026.md
--   2. 计算机网络基础试题(十套试卷-附答案).md
--   3. 2023/2024/2025年408计算机考研真题
-- ============================================================

USE aitaes_db;
SET NAMES utf8mb4;

-- 确保教师账号存在
INSERT INTO `t_user` (`username`, `password`, `role`, `first_login`) VALUES
('T00001', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'TEACHER', 0)
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);

INSERT INTO `t_teacher` (`user_id`, `teacher_no`, `name`, `gender`, `college`, `department`, `title`, `email`)
SELECT u.id, 'T00001', '张建国', '男', '计算机学院', '软件工程系', '教授', 'zjg@university.edu.cn'
FROM `t_user` u WHERE u.username = 'T00001'
ON DUPLICATE KEY UPDATE `teacher_no` = VALUES(`teacher_no`);

-- 创建课程
INSERT INTO `t_course` (`course_no`, `course_name`, `teacher_id`, `credit`, `course_type`, `semester`, `description`)
SELECT 'CS05102', '计算机网络', t.id, 4.0, '必修', '2025-2026-1', '计算机网络课程，涵盖OSI参考模型、TCP/IP协议栈、物理层、数据链路层、网络层、传输层、应用层等核心知识'
FROM `t_teacher` t WHERE t.teacher_no = 'T00001'
ON DUPLICATE KEY UPDATE `course_no` = VALUES(`course_no`);

INSERT INTO `t_course` (`course_no`, `course_name`, `teacher_id`, `credit`, `course_type`, `semester`, `description`)
SELECT 'CS05101', '数据结构', t.id, 4.0, '必修', '2025-2026-1', '数据结构课程，涵盖线性表、树、图、查找、排序等核心知识'
FROM `t_teacher` t WHERE t.teacher_no = 'T00001'
ON DUPLICATE KEY UPDATE `course_no` = VALUES(`course_no`);

INSERT INTO `t_course` (`course_no`, `course_name`, `teacher_id`, `credit`, `course_type`, `semester`, `description`)
SELECT 'CS05104', '计算机组成原理', t.id, 4.0, '必修', '2025-2026-1', '计算机组成原理课程，涵盖数据表示、指令系统、CPU、存储器、总线、I/O等'
FROM `t_teacher` t WHERE t.teacher_no = 'T00001'
ON DUPLICATE KEY UPDATE `course_no` = VALUES(`course_no`);

INSERT INTO `t_course` (`course_no`, `course_name`, `teacher_id`, `credit`, `course_type`, `semester`, `description`)
SELECT 'CS05105', '操作系统', t.id, 4.0, '必修', '2025-2026-1', '操作系统课程，涵盖进程管理、内存管理、文件系统、设备管理、I/O等'
FROM `t_teacher` t WHERE t.teacher_no = 'T00001'
ON DUPLICATE KEY UPDATE `course_no` = VALUES(`course_no`);

SET @net_course_id = (SELECT id FROM `t_course` WHERE course_no = 'CS05102' LIMIT 1);
SET @ds_course_id = (SELECT id FROM `t_course` WHERE course_no = 'CS05101' LIMIT 1);
SET @co_course_id = (SELECT id FROM `t_course` WHERE course_no = 'CS05104' LIMIT 1);
SET @os_course_id = (SELECT id FROM `t_course` WHERE course_no = 'CS05105' LIMIT 1);
SET @teacher_id = (SELECT id FROM `t_teacher` WHERE teacher_no = 'T00001' LIMIT 1);

-- ============================================================
-- 题库题目数据
-- ============================================================
INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "以下属于物理层的设备是", "options": [{"label": "A", "text": "中继器"}, {"label": "B", "text": "以太网交换机"}, {"label": "C", "text": "桥"}, {"label": "D", "text": "网关"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 以下属于物理层的设备是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "在以太网中，是根据__地址来区分不同的设备的.", "options": [{"label": "A", "text": "LLC地址"}, {"label": "B", "text": "MAC地址"}], "answer": "B"}',
  'CSMA/CD协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在以太网中，是根据__地址来区分不同的设备的.

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "IEEE802.3u标准是指", "options": [{"label": "A", "text": "以太网"}, {"label": "B", "text": "快速以太网"}], "answer": "B"}',
  '以太网标准', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: IEEE802.3u标准是指

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "下面哪种LAN 是应用CSMA/CD协议的", "options": [{"label": "A", "text": "令牌环"}, {"label": "B", "text": "FDDI"}], "answer": "C"}',
  'CSMA/CD协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 下面哪种LAN 是应用CSMA/CD协议的

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "FDDI 使用的是__局域网技术。", "options": [{"label": "A", "text": "以太网"}, {"label": "B", "text": "快速以太网"}], "answer": "C"}',
  '令牌环网', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: FDDI 使用的是__局域网技术。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "TCP 和UDP 协议的相似之处是", "options": [{"label": "A", "text": "面向连接的协议"}, {"label": "B", "text": "面向非连接的协议"}], "answer": "C"}',
  'TCP/UDP协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: TCP 和UDP 协议的相似之处是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "应用程序PING 发出的是_报文。", "options": [{"label": "A", "text": "TCP 请求报文"}, {"label": "B", "text": "TCP 应答报文"}], "answer": "C"}',
  'ICMP协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 应用程序PING 发出的是_报文。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "小于__的TCP/UDP端口号已保留与现有服务一一对应，此数字以上的端口号可自由分配。", "options": [{"label": "A", "text": "199"}, {"label": "B", "text": "100"}, {"label": "C", "text": "1024"}, {"label": "D", "text": "2048"}], "answer": "C"}',
  'TCP/UDP协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 小于__的TCP/UDP端口号已保留与现有服务一一对应，此数字以上的端口号可自由分配。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "IEEE802.5 标准是指", "options": [{"label": "A", "text": "以太网"}, {"label": "B", "text": "令牌总线网C、令牌环网"}, {"label": "D", "text": "FDDI 网"}], "answer": "C"}',
  '令牌环网', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: IEEE802.5 标准是指

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "10BASE-T是指", "options": [{"label": "A", "text": "粗同轴电缆"}, {"label": "B", "text": "细同轴电缆"}], "answer": "C"}',
  '以太网标准', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 10BASE-T是指

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "帧中继的使用链路层协议是", "options": [{"label": "A", "text": "LAPB"}, {"label": "B", "text": "LAPD"}, {"label": "C", "text": "LAPF"}, {"label": "D", "text": "HDLC"}], "answer": "C"}',
  '广域网技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 帧中继的使用链路层协议是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "在windows95/98 的dos 窗口下，能用以下命令察看主机的路由表", "options": [{"label": "A", "text": "NETSTAT –R"}, {"label": "B", "text": "ARP -A"}], "answer": "D"}',
  '路由算法与协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在windows95/98 的dos 窗口下，能用以下命令察看主机的路由表

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "与10.110.12.29 mask 255.255.255.224 属于同一网段的主机IP 地址是", "options": [{"label": "A", "text": "10.110.12.0"}, {"label": "B", "text": "10.110.12.30"}], "answer": "B"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 与10.110.12.29 mask 255.255.255.224 属于同一网段的主机IP 地址是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "某公司申请到一个C 类IP 地址，但要连接6 个的子公司，最大的一个子公司有26 台计算机，每个子公司在一个网段中，则子网掩码应设为", "options": [{"label": "A", "text": "255.255.255.0"}, {"label": "B", "text": "255.255.255.128"}], "answer": "D"}',
  '子网划分与路由算法', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 某公司申请到一个C 类IP 地址，但要连接6 个的子公司，最大的一个子公司有26 台计算机，每个子公司在一个网段中，则子

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "224.0.0.5 代表的是__地址。", "options": [{"label": "A", "text": "主机地址"}, {"label": "B", "text": "网络地址"}], "answer": "C"}',
  'IP地址分类', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 224.0.0.5 代表的是__地址。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "在局域网中，MAC指的是。", "options": [{"label": "A", "text": "逻辑链路控制子层"}, {"label": "B", "text": "介质访问控制子层"}], "answer": "B"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在局域网中，MAC指的是。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "255.255.255.224可能代表的是。", "options": [{"label": "A", "text": "一个B类网络号"}, {"label": "B", "text": "一个C类网络中的广播"}], "answer": "C"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 255.255.255.224可能代表的是。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "IP地址为 140.111.0.0 的B类网络，若要切割为9个子网，而且都要 连上Internet，请问子网掩码设为。", "options": [{"label": "A", "text": "255.0.0.0"}, {"label": "B", "text": "255.255.0.0"}], "answer": "D"}',
  '子网划分与路由算法', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: IP地址为 140.111.0.0 的B类网络，若要切割为9个子网，而且都要 连上Internet，请问子网掩码设为。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "在Internet上浏览时，浏览器和WWW服务器之间传输网页使用的协议是。", "options": [{"label": "A", "text": "IP"}, {"label": "B", "text": "HTTP"}, {"label": "C", "text": "FTP"}, {"label": "D", "text": "Telnet"}], "answer": "B"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在Internet上浏览时，浏览器和WWW服务器之间传输网页使用的协议是。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "26\\\\. 在数据通信中，当发送数据出现差错时，发送端无需进行数据重发的差错控制方法为 。", "options": [{"label": "A", "text": "ARQ"}, {"label": "B", "text": "FEC"}, {"label": "C", "text": "BEC"}, {"label": "D", "text": "CRC"}], "answer": "B"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 26\\. 在数据通信中，当发送数据出现差错时，发送端无需进行数据重发的差错控制方法为 。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "浏览器与Web服务器之间使用的协议是。", "options": [{"label": "A", "text": "DNS"}, {"label": "B", "text": "SNMP"}, {"label": "C", "text": "HTTP"}, {"label": "D", "text": "SMTP"}], "answer": "C"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 浏览器与Web服务器之间使用的协议是。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "29\\\\. 相邻层间交换的数据单元称之为服务数据单元，其英文缩写为。", "options": [{"label": "A", "text": "SDU"}, {"label": "B", "text": "IDU"}, {"label": "C", "text": "PDU"}, {"label": "D", "text": ". ICI"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 29\\. 相邻层间交换的数据单元称之为服务数据单元，其英文缩写为。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "DNS服务器和客户机设置完毕后，有三个命令可以测试其设置是否正确，下面不是其中之一。", "options": [{"label": "A", "text": "PING"}, {"label": "B", "text": "LOGIN"}, {"label": "C", "text": "IPCONFIG"}, {"label": "D", "text": "NSLOOKUP"}], "answer": "B"}',
  'DNS协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: DNS服务器和客户机设置完毕后，有三个命令可以测试其设置是否正确，下面不是其中之一。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "31\\\\. 如果一个C类网络用掩码255.255.255.192划分子网，那么会有个可用的子网。（注：包括全0和全1的子网就有4个了^^）", "options": [{"label": "A", "text": "2"}, {"label": "B", "text": "4"}, {"label": "C", "text": "6"}, {"label": "D", "text": "8"}], "answer": "A"}',
  '子网划分与路由算法', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 31\\. 如果一个C类网络用掩码255.255.255.192划分子网，那么会有个可用的子网。（注：包括全0和全1的子网

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "32\\\\. 能从数据信号波形中提取同步信号的典型编码是。", "options": [{"label": "A", "text": "归零码"}, {"label": "B", "text": "不归零码"}, {"label": "C", "text": "定比码"}, {"label": "D", "text": "曼彻斯特编码"}], "answer": "D"}',
  '操作系统', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 32\\. 能从数据信号波形中提取同步信号的典型编码是。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "33\\\\. 世界上很多国家都相继组建了自己国家的公用数据网，现有的公用数据网大多采用。", "options": [{"label": "A", "text": "分组交换方式"}, {"label": "B", "text": "报文交换方式"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 33\\. 世界上很多国家都相继组建了自己国家的公用数据网，现有的公用数据网大多采用。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "在IP地址方案中，159.226.181.1是一个。", "options": [{"label": "A", "text": "A类地址"}, {"label": "B", "text": "B类地址"}, {"label": "C", "text": "C类地址"}, {"label": "D", "text": "D类地址"}], "answer": "B"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在IP地址方案中，159.226.181.1是一个。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "35\\\\. 在TCP/IP中，解决计算机到计算机之间通信问题的层次是。", "options": [{"label": "A", "text": "网络接口层"}, {"label": "B", "text": "网际层"}, {"label": "C", "text": "传输层"}, {"label": "D", "text": "应用层"}], "answer": "B"}',
  'TCP/UDP协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 35\\. 在TCP/IP中，解决计算机到计算机之间通信问题的层次是。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "36\\\\. 三次握手方法用于。", "options": [{"label": "A", "text": "传输层连接的建立"}, {"label": "B", "text": "数据链路层的流量控制"}], "answer": "A"}',
  'TCP三次握手/四次挥手', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 36\\. 三次握手方法用于。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "37\\\\. 在计算机网络中，所有的计算机均连接到一条通信传输线路上，在线路两端连有防止信号反射的装置。 这种连接结构被称为。", "options": [{"label": "A", "text": "总线结构"}, {"label": "B", "text": "环型结构"}, {"label": "C", "text": "星型结构"}, {"label": "D", "text": "网状结构"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 37\\. 在计算机网络中，所有的计算机均连接到一条通信传输线路上，在线路两端连有防止信号反射的装置。 这种连接结构被称为

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "38\\\\. 以下属于广域网技术的是。", "options": [{"label": "A", "text": "以太网"}, {"label": "B", "text": "令牌环网"}, {"label": "C", "text": "帧中继"}, {"label": "D", "text": "FDDI"}], "answer": "C"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 38\\. 以下属于广域网技术的是。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "39\\\\. TCP的协议数据单元被称为。", "options": [{"label": "A", "text": "比特"}, {"label": "B", "text": "帧"}, {"label": "C", "text": "分段"}, {"label": "D", "text": "字符"}], "answer": "C"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 39\\. TCP的协议数据单元被称为。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "下面提供FTP服务的默认TCP端口号是。", "options": [{"label": "A", "text": "21"}, {"label": "B", "text": "25"}, {"label": "C", "text": "23"}, {"label": "D", "text": "80"}], "answer": "A"}',
  'TCP/UDP协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 下面提供FTP服务的默认TCP端口号是。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "41\\\\. 在同一个信道上的同一时刻，能够进行双向数据传送的通信方式是。", "options": [{"label": "A", "text": "单工"}, {"label": "B", "text": "半双工"}, {"label": "C", "text": "全双工"}, {"label": "D", "text": "上述三种均不是"}], "answer": "C"}',
  '通信方式', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 41\\. 在同一个信道上的同一时刻，能够进行双向数据传送的通信方式是。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "42\\\\. 某部门申请到一个C类IP地址,若要分成8个子网,其掩码应为。", "options": [{"label": "A", "text": "255.255.255.255"}, {"label": "B", "text": "255.255.255.0"}], "answer": "C"}',
  'IP地址分类', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 42\\. 某部门申请到一个C类IP地址,若要分成8个子网,其掩码应为。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "44\\\\. 在OSI的七层参考模型中，工作在第三层以上的网间连接设备是。", "options": [{"label": "A", "text": "集线器"}, {"label": "B", "text": "网关"}, {"label": "C", "text": "网桥"}, {"label": "D", "text": "中继器"}], "answer": "C"}',
  'OSI参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 44\\. 在OSI的七层参考模型中，工作在第三层以上的网间连接设备是。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "45\\\\. 世界上第一个计算机网络是 。", "options": [{"label": "A", "text": "ARPANET"}, {"label": "B", "text": "ChinaNet"}, {"label": "C", "text": "Internet"}, {"label": "D", "text": "CERNET"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 45\\. 世界上第一个计算机网络是 。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "以太网媒体访问控制技术CSMA/CD的机制是。", "options": [{"label": "A", "text": "争用带宽"}, {"label": "B", "text": "预约带宽"}], "answer": "A"}',
  'CSMA/CD协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 以太网媒体访问控制技术CSMA/CD的机制是。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "48\\\\. www.tsinghua.edu.cn在这个完整名称（FQDN）里，是主机名.", "options": [{"label": "A", "text": "edu.cn"}, {"label": "B", "text": "tsinghua"}, {"label": "C", "text": "tsinghua.edu.cn"}, {"label": "D", "text": "www"}], "answer": "D"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 48\\. www.tsinghua.edu.cn在这个完整名称（FQDN）里，是主机名.

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "60.计算机网络通信系统是", "options": [{"label": "A", "text": "电信号传输系统"}, {"label": "B", "text": "文字通信系统"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 60.计算机网络通信系统是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "61.在TCP/IP协议簇的层次中，解决计算机之间通信问题是在", "options": [{"label": "A", "text": "网络接口层"}, {"label": "B", "text": "网际层"}, {"label": "C", "text": "传输层"}, {"label": "D", "text": "应用层"}], "answer": "B"}',
  'TCP/IP参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 61.在TCP/IP协议簇的层次中，解决计算机之间通信问题是在

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "62.在中继系统中，中继器处于", "options": [{"label": "A", "text": "物理层"}, {"label": "B", "text": "数据链路层"}, {"label": "C", "text": "网络层"}, {"label": "D", "text": "高层"}], "answer": "A"}',
  '物理层设备', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 62.在中继系统中，中继器处于

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "63．对于带宽为6MHz的信道，若用8种不同的状态来表示数据，在不考虑热噪声的情况下，该信道每秒最多能传送的位数为", "options": [{"label": "A", "text": "36×10<sup>6</sup>"}, {"label": "B", "text": "18×10<sup>6</sup>"}, {"label": "C", "text": "48×10<sup>6</sup>"}, {"label": "D", "text": "96×10<sup>6</sup>"}], "answer": "A"}',
  '信道容量与带宽', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 63．对于带宽为6MHz的信道，若用8种不同的状态来表示数据，在不考虑热噪声的情况下，该信道每秒最多能传送的位数为

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "一个VLAN可以看作是一个", "options": [{"label": "A", "text": "冲突域"}, {"label": "B", "text": "广播域"}, {"label": "C", "text": "管理域"}, {"label": "D", "text": "阻塞域"}], "answer": "B"}',
  'VLAN技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 一个VLAN可以看作是一个

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "双绞线分两种。", "options": [{"label": "A", "text": "基带和窄带"}, {"label": "B", "text": "粗和细"}], "answer": "C"}',
  '物理层传输介质', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 双绞线分两种。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "在internet的基本服务功能中，远程登录所使用的命令是。", "options": [{"label": "A", "text": "ftp"}, {"label": "B", "text": "telnet"}, {"label": "C", "text": "mail"}, {"label": "D", "text": "open"}], "answer": "B"}',
  '远程登录协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在internet的基本服务功能中，远程登录所使用的命令是。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "TCP/IP协议规定为。", "options": [{"label": "A", "text": "4层"}, {"label": "B", "text": "5层"}, {"label": "C", "text": "6层"}, {"label": "D", "text": "7层"}], "answer": "A"}',
  'TCP/IP参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: TCP/IP协议规定为。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "Internet网络是一种结构的网络。", "options": [{"label": "A", "text": "星型"}, {"label": "B", "text": "环型"}, {"label": "C", "text": "树型"}, {"label": "D", "text": "网型"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: Internet网络是一种结构的网络。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "以太网交换机的每一个端口可以看做一个", "options": [{"label": "A", "text": "冲突域"}, {"label": "B", "text": "广播域"}, {"label": "C", "text": "管理域"}, {"label": "D", "text": "阻塞域"}], "answer": "A"}',
  'CSMA/CD协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 以太网交换机的每一个端口可以看做一个

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "IP电话使用的数据交换技术是", "options": [{"label": "A", "text": "协议"}, {"label": "B", "text": "服务"}, {"label": "C", "text": "用户"}, {"label": "D", "text": "功能"}], "answer": "C"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: IP电话使用的数据交换技术是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "网卡是完成功能的 .", "options": [{"label": "A", "text": "物理层"}, {"label": "B", "text": "数据链路层"}], "answer": "C"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 网卡是完成功能的 .

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "当数据由计算机A传送至计算机B时，不参与数据封装工作的是.", "options": [{"label": "A", "text": "物理层"}, {"label": "B", "text": "数据链路层"}, {"label": "C", "text": "应用层"}, {"label": "D", "text": "网络层"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 当数据由计算机A传送至计算机B时，不参与数据封装工作的是.

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "CSMA/CD是IEEE802.3所定义的协议标准，它适用于 .", "options": [{"label": "A", "text": "令牌环网"}, {"label": "B", "text": "令牌总线网"}, {"label": "C", "text": "网络互连"}, {"label": "D", "text": "以太网"}], "answer": "D"}',
  '以太网标准', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: CSMA/CD是IEEE802.3所定义的协议标准，它适用于 .

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "100BASE-TX中，所用的传输介质是.", "options": [{"label": "A", "text": "3类双绞线"}, {"label": "B", "text": "5类双绞线"}], "answer": "B"}',
  '以太网标准', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 100BASE-TX中，所用的传输介质是.

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "世界上第一个网络是在年诞生。考", "options": [{"label": "A", "text": "1946"}, {"label": "B", "text": "1969"}, {"label": "C", "text": "1977"}, {"label": "D", "text": "1973"}], "answer": "B"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 世界上第一个网络是在年诞生。考

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "假如收到1000000000个码元，经检查有一个码元出错，则误码率为：", "options": [{"label": "A", "text": "十的负二次方"}, {"label": "B", "text": "十的负四次方"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 假如收到1000000000个码元，经检查有一个码元出错，则误码率为：

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "电话交换系统采用的是：技术", "options": [{"label": "A", "text": "线路交换"}, {"label": "B", "text": "报文交换"}, {"label": "C", "text": "分组交换D.信号交换"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 电话交换系统采用的是：技术

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "以下属于低层协议的是：", "options": [{"label": "A", "text": "FTP"}, {"label": "B", "text": "IP"}, {"label": "C", "text": "UDP"}, {"label": "D", "text": "TCP"}], "answer": "B"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 以下属于低层协议的是：

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "TCP/IP层的网络接口层对应OSI的。", "options": [{"label": "A", "text": "物理层"}, {"label": "B", "text": "链路层"}, {"label": "C", "text": "网络层"}, {"label": "D", "text": "物理层和链路层"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: TCP/IP层的网络接口层对应OSI的。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "若网络形状是由站点和连接站点的链路组成的一个闭合环，则称这种拓扑结构为", "options": [{"label": "A", "text": "星形拓扑"}, {"label": "B", "text": "总线拓扑"}, {"label": "C", "text": "环形拓扑"}, {"label": "D", "text": "树形拓扑"}], "answer": "C"}',
  '网络拓扑结构', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 若网络形状是由站点和连接站点的链路组成的一个闭合环，则称这种拓扑结构为

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "以下各项中，不是数据报操作特点的是", "options": [{"label": "A", "text": "每个分组自身携带有足够的信息，它的传送是被单独处理的"}, {"label": "B", "text": "在整个传送过程中，不需建立虚电路"}], "answer": "C"}',
  '数据交换技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 以下各项中，不是数据报操作特点的是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "对于基带CSMA/CD而言，为了确保发送站点在传输时能检测到可能存在的冲突，数据帧的传输时延至少要等于信号传播时延的", "options": [{"label": "A", "text": "1倍"}, {"label": "B", "text": "2倍"}, {"label": "C", "text": "4倍"}, {"label": "D", "text": "2.5倍"}], "answer": "B"}',
  '信道容量与带宽', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 对于基带CSMA/CD而言，为了确保发送站点在传输时能检测到可能存在的冲突，数据帧的传输时延至少要等于信号传播时延的

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "下列交换技术中，节点不采用“存储—转发”方式的是。", "options": [{"label": "A", "text": "电路交换技术"}, {"label": "B", "text": "报文交换技术"}], "answer": "A"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 下列交换技术中，节点不采用“存储—转发”方式的是。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "采用虚电路分组交换方式时，可以省去的阶段是。纠错", "options": [{"label": "A", "text": "建立逻辑连接"}, {"label": "B", "text": "结束本次连接"}], "answer": "D"}',
  '数据交换技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 采用虚电路分组交换方式时，可以省去的阶段是。纠错

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "因特网中完成域名地址和IP 地址转换的系统是", "options": [{"label": "A", "text": "POP"}, {"label": "B", "text": "DNS"}, {"label": "C", "text": "SLIP"}, {"label": "D", "text": "Usenet"}], "answer": "B"}',
  'DNS协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 因特网中完成域名地址和IP 地址转换的系统是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "Ipv6 将32 位地址空间扩展到。", "options": [{"label": "A", "text": "64 位"}, {"label": "B", "text": "128 位"}, {"label": "C", "text": "256 位"}, {"label": "D", "text": "1024 位"}], "answer": "B"}',
  'IPv4/IPv6协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: Ipv6 将32 位地址空间扩展到。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "双绞线由两根具有绝缘保护层的铜导线按一定密度互相绞在一起组成，这样可以。", "options": [{"label": "A", "text": "降低信号干扰的程度"}, {"label": "B", "text": "降低成本"}], "answer": "A"}',
  '物理层传输介质', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 双绞线由两根具有绝缘保护层的铜导线按一定密度互相绞在一起组成，这样可以。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "在OSI层次体系结构中,实际的通信是在实体间进行的 .", "options": [{"label": "A", "text": "物理层"}, {"label": "B", "text": "数据链路层"}, {"label": "C", "text": "网络层"}, {"label": "D", "text": "传输层"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在OSI层次体系结构中,实际的通信是在实体间进行的 .

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "下面关于CSMA/CD网络的叙述哪个是正确的?", "options": [{"label": "B", "text": "如果源节点知道目的地的IP和MAC地址的话，信号是直接送往目的地"}, {"label": "C", "text": "—个节点的数据发往最近的路由器，路由器将数据直接发到目的地"}, {"label": "D", "text": "信号都是以广播方式发送的"}], "answer": "A"}',
  'CSMA/CD协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 下面关于CSMA/CD网络的叙述哪个是正确的?

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "TELNET通过TCP/IP协议在客户机和远程登录服务器之间建立一个.", "options": [{"label": "A", "text": "UDP"}, {"label": "B", "text": "ARP"}, {"label": "C", "text": "TCP"}, {"label": "D", "text": "RARP"}], "answer": "C"}',
  'TCP/IP参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: TELNET通过TCP/IP协议在客户机和远程登录服务器之间建立一个.

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "出于安全的考试，管理员希望阻止由外网进入的PING嗅探，那么管理员需要阻止哪一类协议？", "options": [{"label": "A", "text": "TCP"}, {"label": "B", "text": "UDP"}, {"label": "C", "text": "IP"}, {"label": "D", "text": "ICMP"}], "answer": "D"}',
  'ICMP协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 出于安全的考试，管理员希望阻止由外网进入的PING嗅探，那么管理员需要阻止哪一类协议？

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "以下说法错误的是", "options": [{"label": "A", "text": "中继器是工作在物理层的设备"}], "answer": "BD"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 以下说法错误的是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "以下关于MAC地址的说法中正确的是", "options": [{"label": "A", "text": "MAC地址的一部分字节是各个厂家从IEEE得来的"}], "answer": "ABC"}',
  'MAC地址与物理地址', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 以下关于MAC地址的说法中正确的是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "关于共享式以太网说法正确的是", "options": [{"label": "A", "text": "需要进行冲突检测"}], "answer": "ABC"}',
  'CSMA/CD协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 关于共享式以太网说法正确的是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "以下为广域网协议的有", "options": [{"label": "A", "text": "PPP"}, {"label": "B", "text": "X.25"}, {"label": "C", "text": "SLIP"}, {"label": "D", "text": "Ethemetll"}], "answer": "ABCE"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 以下为广域网协议的有

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "下面选项中哪些是数据链路层的主要功能：", "options": [{"label": "A", "text": "提供对物理层的控制"}, {"label": "B", "text": "差错控制"}], "answer": "ABC"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 下面选项中哪些是数据链路层的主要功能：

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "能完成VLAN之间数据传递的设备有 。", "options": [{"label": "A", "text": "中继器"}, {"label": "B", "text": "三层交换器"}, {"label": "C", "text": "网桥"}, {"label": "D", "text": "路由器"}], "answer": "BD"}',
  'VLAN技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 能完成VLAN之间数据传递的设备有 。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "以下对交换机工作方式描述正确的是", "options": [{"label": "A", "text": "可以使用半双工方式工作"}], "answer": "ABD"}',
  '数据链路层设备', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 以下对交换机工作方式描述正确的是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "VLAN的主要作用有", "options": [{"label": "A", "text": "保证网络安全"}, {"label": "B", "text": "抑制广播风暴"}], "answer": "ABCD"}',
  'VLAN技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: VLAN的主要作用有

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "X.25与帧中继对比描述正确的是", "options": [{"label": "A", "text": "X.25是面向连接的协议，传输正确性、稳定性高于帧中继"}], "answer": "AC"}',
  '广域网技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: X.25与帧中继对比描述正确的是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "以下说法错误的是", "options": [{"label": "A", "text": "中继器是工作在物理层的设备"}], "answer": "BD"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 以下说法错误的是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "计算机网络从逻辑功能上分为。", "options": [{"label": "A", "text": "通信子网"}, {"label": "B", "text": "局域网"}, {"label": "C", "text": "资源子网"}, {"label": "D", "text": "对等网络"}], "answer": "AC"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 计算机网络从逻辑功能上分为。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "2\\\\. Internet的网络层含有四个重要的协议，分别为 。", "options": [{"label": "A", "text": "IP，ICMP"}, {"label": "B", "text": "TCP，ARP"}], "answer": "AD"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 2\\. Internet的网络层含有四个重要的协议，分别为 。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "网络拓扑结构设计对通信子网的有着重大的影响。", "options": [{"label": "A", "text": "网络性能"}, {"label": "B", "text": "网络体系结构"}], "answer": "ACD"}',
  '网络拓扑结构', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 网络拓扑结构设计对通信子网的有着重大的影响。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "局域网的基本特征是。", "options": [{"label": "A", "text": "有效范围较小"}, {"label": "B", "text": "传输速率较高"}], "answer": "AB"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 局域网的基本特征是。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "通过载波信号的相位值来表示数字信号的1，0的方法叫做。", "options": [{"label": "A", "text": "ASK"}, {"label": "B", "text": "FSK"}, {"label": "C", "text": "PSK"}, {"label": "D", "text": "ATM"}], "answer": "AB"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 通过载波信号的相位值来表示数字信号的1，0的方法叫做。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "等数字数据编码属于自含时钟编码。", "options": [{"label": "A", "text": "非归零编码"}, {"label": "B", "text": "曼彻斯特编码"}], "answer": "BD"}',
  '数据编码技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 等数字数据编码属于自含时钟编码。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "在计算机网络中，DTE设备兼备的作用。", "options": [{"label": "A", "text": "信源"}, {"label": "B", "text": "调制解调器"}, {"label": "C", "text": "传输媒体"}, {"label": "D", "text": "信宿"}], "answer": "AD"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在计算机网络中，DTE设备兼备的作用。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "网络协议由组成。", "options": [{"label": "A", "text": "语义"}, {"label": "B", "text": "语法"}, {"label": "C", "text": "交换规则"}, {"label": "D", "text": "网卡"}], "answer": "ABC"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 网络协议由组成。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "物理层的技术特性有。", "options": [{"label": "A", "text": "基带处理"}, {"label": "B", "text": "调制解调"}, {"label": "C", "text": "信号放大"}, {"label": "D", "text": "均衡"}], "answer": "ABCD", "analysis": "解析：调制解调器是为数据通信的数字信号在具有有限带宽的模拟信道上进行远距离传输而设计的，它一般由基带处理、调制解调、信号放大和滤波、均衡等几部分组成。调制是将数字信号与音频载波组合，产生适合于电话线上传输的音频信号（模拟信号），解调是从音频信号中恢复出数字信号。调制解调器一般分为外置式、内置式和PC卡式三种。"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 物理层的技术特性有。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "网络层的内在功能包括。", "options": [{"label": "A", "text": "逻辑环的初始化"}, {"label": "B", "text": "站点的入环"}], "answer": "ABC"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 网络层的内在功能包括。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "决定局域特性的主要技术要素是。", "options": [{"label": "A", "text": "网络拓扑"}, {"label": "B", "text": "网络应用"}], "answer": "ACD"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 决定局域特性的主要技术要素是。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "Ethernet的物理层协议主要有。", "options": [{"label": "A", "text": "10BASE-T"}, {"label": "B", "text": "1000BASE-T"}], "answer": "ABCD"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: Ethernet的物理层协议主要有。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "WINDOWS NT采用了系统模型。", "options": [{"label": "A", "text": "文件服务器"}, {"label": "B", "text": "客户服务器模型"}], "answer": "BCD"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: WINDOWS NT采用了系统模型。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "用户帐号包含等数据。", "options": [{"label": "A", "text": "名称"}, {"label": "B", "text": "密码"}, {"label": "C", "text": "用户权力"}, {"label": "D", "text": "访问权限"}], "answer": "ABCD"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 用户帐号包含等数据。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "用户帐号可以帐号可以登录域的多少可分为帐号类。", "options": [{"label": "A", "text": "administrator"}, {"label": "B", "text": "guest"}, {"label": "C", "text": "user"}, {"label": "D", "text": "domain"}], "answer": "AD"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 用户帐号可以帐号可以登录域的多少可分为帐号类。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "WINDOWS NT SERVER 4.0中文版所支持的网络通信协议有。", "options": [{"label": "A", "text": "TCP/IP"}, {"label": "B", "text": "NWLINK"}, {"label": "C", "text": "NETBEUI"}, {"label": "D", "text": "DLC"}], "answer": "ABCD"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: WINDOWS NT SERVER 4.0中文版所支持的网络通信协议有。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "NT网中，帐号策略（规则）包括等。", "options": [{"label": "A", "text": "最长（最短）密码期限"}, {"label": "B", "text": "从网络访问此计算机"}], "answer": "ACD"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: NT网中，帐号策略（规则）包括等。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "目前用于网络互连的设备主要有等。", "options": [{"label": "A", "text": "中继器"}, {"label": "B", "text": "集线器"}, {"label": "C", "text": "网桥"}, {"label": "D", "text": "路由器"}], "answer": "ABCD"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 目前用于网络互连的设备主要有等。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "实现同一网络不同网段间物理层连接的互连设备是。", "options": [{"label": "A", "text": "中继器"}, {"label": "B", "text": "集线器"}, {"label": "C", "text": "网桥"}, {"label": "D", "text": "路由器"}], "answer": "AB"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 实现同一网络不同网段间物理层连接的互连设备是。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "IP协议组包括协议。", "options": [{"label": "A", "text": "IP"}, {"label": "B", "text": "ICMP"}, {"label": "C", "text": "ARP"}, {"label": "D", "text": "RARP"}], "answer": "ABCD"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: IP协议组包括协议。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "TCP协议组包括协议。", "options": [{"label": "A", "text": "ICMP"}, {"label": "B", "text": "TCP"}, {"label": "C", "text": "UDP"}, {"label": "D", "text": "ARP"}], "answer": "BC"}',
  'TCP/UDP协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: TCP协议组包括协议。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "关于子网掩码的说法，以下正确的是：", "options": [{"label": "A", "text": "点对点传输网络"}, {"label": "B", "text": "广播式传输网络"}], "answer": "AB"}',
  '子网划分与路由算法', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 关于子网掩码的说法，以下正确的是：

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "用一个共享式集线器把几台计算机连接成网，对于网络的结构，下列说法正确的是：", "options": [{"label": "A", "text": "1.接口 2.协议 3.服务 4.关系 5.调用 6.连接"}], "answer": "AC"}',
  '物理层设备', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 用一个共享式集线器把几台计算机连接成网，对于网络的结构，下列说法正确的是：

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "IP 协议是：", "options": [{"label": "A", "text": "中继器是工作在物理层的设备"}], "answer": "AD"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: IP 协议是：

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "关于共享式以太网说法正确的是", "options": [{"label": "A", "text": "需要进行冲突检测"}], "answer": "ABC"}',
  'CSMA/CD协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 关于共享式以太网说法正确的是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "下面选项中哪些是数据链路层的主要功能：", "options": [{"label": "A", "text": "提供对物理层的控制"}, {"label": "B", "text": "差错控制"}], "answer": "ABC"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 下面选项中哪些是数据链路层的主要功能：

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "通信子网的虚电路操作方式和数据报操作方式与网络层提供的虚电路服务和数据报服务，在下列有关阐述中，正确。", "options": [{"label": "A", "text": "虚电路提供了可靠的通信功能，能保证每个分组正确到达，且保持原来顺序，而数据报方式中，数据报不能保证数据分组按序到达，数据的丢失也不会被立即发现。"}], "answer": "ABC"}',
  '子网划分与路由算法', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 通信子网的虚电路操作方式和数据报操作方式与网络层提供的虚电路服务和数据报服务，在下列有关阐述中，正确。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "下列有关物理传输介质描述正确的是", "options": [{"label": "A", "text": "物理传输介质一般分为有线传输介质和无线传输介质"}], "answer": "ABCD"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 下列有关物理传输介质描述正确的是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "下面有关多路复用技术描述正确的有", "options": [{"label": "A", "text": "FDM 的前提是传输介质的可用带宽要大于多路给定信号所需带宽的总和。"}], "answer": "ABCD"}',
  '信道复用技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 下面有关多路复用技术描述正确的有

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "在实际网络系统中，一般用到三种交换技术，包括", "options": [{"label": "A", "text": "电路交换技术"}, {"label": "B", "text": "地址交换技术"}], "answer": "ACD"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在实际网络系统中，一般用到三种交换技术，包括

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "虚电路交换一般分为三个阶段，下面哪些阶段包含在这三个阶段中", "options": [{"label": "A", "text": "分组交换"}, {"label": "B", "text": "路由选择"}, {"label": "C", "text": "拆除连接"}, {"label": "D", "text": "数据传输"}], "answer": "CD"}',
  '数据交换技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 虚电路交换一般分为三个阶段，下面哪些阶段包含在这三个阶段中

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "在ISO/OSI 参考模型中，对于传输层描述正确的有", "options": [{"label": "A", "text": "为系统之间提供面向连接的和无连接的数据传输服务。"}], "answer": "AD"}',
  'OSI参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在ISO/OSI 参考模型中，对于传输层描述正确的有

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "对于ICMP 协议的功能，说法正确的是", "options": [{"label": "A", "text": "差错纠正"}, {"label": "B", "text": "可探测某些网络节点的可达性"}], "answer": "BCD"}',
  'ICMP协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 对于ICMP 协议的功能，说法正确的是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "下面有关网络互连设备说法正确的有", "options": [{"label": "A", "text": "在物理层实现网络互连的主要设备有中继器和HUB"}], "answer": "ABCD"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 下面有关网络互连设备说法正确的有

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "TCP/IP 协议族中定义的层次结构中包含", "options": [{"label": "A", "text": "网络层"}, {"label": "B", "text": "应用层"}, {"label": "C", "text": "传输层"}, {"label": "D", "text": "物理层"}], "answer": "ABC"}',
  'OSI参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: TCP/IP 协议族中定义的层次结构中包含

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "下面对CSMA/CD 描述正确的有", "options": [{"label": "A", "text": "其含义为载波侦听、多路访问/冲突避免"}], "answer": "BCD"}',
  'CSMA/CD协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 下面对CSMA/CD 描述正确的有

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'MULTI', 'MEDIUM',
  '{"stem": "下面对路由选择算法描述正确的有", "options": [{"label": "A", "text": "路由选择算法一般分为静态路由选择算法和动态路由选择算法"}], "answer": "AD"}',
  '路由算法与协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 下面对路由选择算法描述正确的有

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "收发电子邮件，属于ISO/OSI RM中 __层的功能。", "answer": "_ 应用 \\\\"}',
  '电子邮件协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 收发电子邮件，属于ISO/OSI RM中 __层的功能。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "在TCP/IP层次模型中与OSI参考模型第四层相对应的主要协议有TCP（ ） 和UDP（ ） ，其中后者提供无连接的不可靠传输服。", "answer": "传输控制协议；用户数据报协议"}',
  'OSI参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在TCP/IP层次模型中与OSI参考模型第四层相对应的主要协议有TCP（ ） 和UDP（ ） ，其中后者提供无连接的不可

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "计算机网络系统由负责_______子网组成。", "answer": "信息传递；的通信子网和负责信息处理的；资源"}',
  '计算机网络组成', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 计算机网络系统由负责_______子网组成。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "OSI模型有_____数据链路层___.___. 运输层. 会话层. 表示层和应用层七个层次。", "answer": "物理层；.\\\\；网络层"}',
  'OSI参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: OSI模型有_____数据链路层___.___. 运输层. 会话层. 表示层和应用层七个层次。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "在局域网参考模型中，__与媒体无关，____则依赖于物理媒体和拓扑结构。", "answer": "LLC \\\\；MAC \\\\"}',
  '网络拓扑结构', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在局域网参考模型中，__与媒体无关，____则依赖于物理媒体和拓扑结构。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "国内最早的四大网络包括原邮电部的ChinaNet. 原电子部的ChinaGBN. 教育部的____和中科院的CSTnet。", "answer": "或中国教育科研网"}',
  'GBN协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 国内最早的四大网络包括原邮电部的ChinaNet. 原电子部的ChinaGBN. 教育部的____和中科院的CSTnet

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "复盖一个国家，地区或几个洲的计算机网络称为 广域网，在同一建筑或复盖几公里内范围的网络称为 局域网 ，而介于两者之间的是城域网。", "answer": "广域网；局域网"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 复盖一个国家，地区或几个洲的计算机网络称为 广域网，在同一建筑或复盖几公里内范围的网络称为 局域网 ，而介于两者之间的是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "现行解决“最后一公里”问题的接入技术有 综合业务数字网 、 高速数字接入设备 、 同轴电缆宽调制解调器 、 局域网 、 无线接入 。", "answer": "综合业务数字网"}',
  '物理层传输介质', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 现行解决“最后一公里”问题的接入技术有 综合业务数字网 、 高速数字接入设备 、 同轴电缆宽调制解调器 、 局域网 、 

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "OSI参考模型从高到低分别是 应用层、 表示层、 会话层 、传输层 、网络层、 数据链路层 和物理层。", "answer": "应用层、"}',
  'OSI参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: OSI参考模型从高到低分别是 应用层、 表示层、 会话层 、传输层 、网络层、 数据链路层 和物理层。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "串行数据通信的方向性结构有三种，即单工、 ________ 。", "answer": "_半双工；_ 和 \\\\；全双工 \\\\"}',
  '通信方式', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 串行数据通信的方向性结构有三种，即单工、 ________ 。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "在 TCP/IP 层次模型的第三层 （ ） 中包括的协议主要有 IP 、 ICMP 、 ARP 及 RARP 。", "answer": "网络层"}',
  'TCP/IP参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在 TCP/IP 层次模型的第三层 （ ） 中包括的协议主要有 IP 、 ICMP 、 ARP 及 RARP 。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "最常用的两种多路复用技术为 __和 __ ，其中，前者是同一时间同时传送多路信号，而后者是将一条物理信道按时间分成若干个时间片轮流分配给多个信号使用。", "answer": "频分多路复用 FDM \\\\；时分多路复用 TDM"}',
  '信道复用技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 最常用的两种多路复用技术为 __和 __ ，其中，前者是同一时间同时传送多路信号，而后者是将一条物理信道按时间分成若干个

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "计算机网络系统由通信子网和________子网组成。", "answer": "资源；_\\\\"}',
  '计算机网络组成', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 计算机网络系统由通信子网和________子网组成。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "通信系统中，称调制前的电信号为___基带_____信号，调制后的信号为调制信号。", "answer": "_\\\\"}',
  '信道容量与带宽', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 通信系统中，称调制前的电信号为___基带_____信号，调制后的信号为调制信号。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "ISP是掌握Internet___接口_____的机构。", "answer": "_\\\\"}',
  '应用层协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: ISP是掌握Internet___接口_____的机构。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "有两种基本的差错控制编码，即检错码和___纠错码___，在计算机网络和数据通信中广泛使用的一种检错码为___循环冗余码（ ）__。", "answer": "或CRC码"}',
  '差错控制技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 有两种基本的差错控制编码，即检错码和___纠错码___，在计算机网络和数据通信中广泛使用的一种检错码为___循环冗余码（

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "计算机网络是发展经历了（ ）、（ ）和（ ）三个阶段。", "answer": "面向终端的计算机通信系统；计算机-计算机通信网络；计算机网络"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 计算机网络是发展经历了（ ）、（ ）和（ ）三个阶段。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "计算机网络的主要功能包括（ ）、（ ）、（ ）、（ ）。", "answer": "数据交换和通信；资源共享；提高系统的可靠性；分布式网络处理和均衡负荷"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 计算机网络的主要功能包括（ ）、（ ）、（ ）、（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "计算机网络在逻辑功能上可以划分为（ ）子网和（ ）子网两个部份。", "answer": "资源；通信"}',
  '子网划分与路由算法', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 计算机网络在逻辑功能上可以划分为（ ）子网和（ ）子网两个部份。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "资源子网主要包括（ ）、（ ）、（ ）等。", "answer": "主机；终端控制器和终端；计算机外设"}',
  '子网划分与路由算法', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 资源子网主要包括（ ）、（ ）、（ ）等。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "通信子网主要包括（ ）、（ ）、（ ）等。", "answer": "网络结点；通信链路；信号变换设备"}',
  '子网划分与路由算法', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 通信子网主要包括（ ）、（ ）、（ ）等。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "计算机网络中的主要拓扑结构有：（ ）、（ ）、（ ）、（ ）、（ ）等。", "answer": "星形；环形；树形；线形；网型"}',
  '网络拓扑结构', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 计算机网络中的主要拓扑结构有：（ ）、（ ）、（ ）、（ ）、（ ）等。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "按照网络的分布地理范围，可以将计算机网络分为（ ）、（ ）和（ ）三种。", "answer": "局域网；城域网；广域网"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 按照网络的分布地理范围，可以将计算机网络分为（ ）、（ ）和（ ）三种。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "计算机内传输的信号是（ ），而公用电话系统的传输系统只能传输（ ）。", "answer": "数字信号；模拟信号"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 计算机内传输的信号是（ ），而公用电话系统的传输系统只能传输（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "在计算机通过线路控制器与远程终端直接相连的系统中，计算机既要进行（ ），又要承担（ ），主计算机负荷加重，实际工作效率下降，而且分散的终端都要单独战用一条通信线路，通信线路利用率低，费用高。", "answer": "数据处理；各终端间的通信"}',
  '远程登录协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在计算机通过线路控制器与远程终端直接相连的系统中，计算机既要进行（ ），又要承担（ ），主计算机负荷加重，实际工作效率下

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "在系统的主计算机前增设前端处理机FEP或通信控制器CCP，这些设备用来专门负责（ ）。", "answer": "通信工作"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在系统的主计算机前增设前端处理机FEP或通信控制器CCP，这些设备用来专门负责（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "1993年底，我国提出建设网络“三金”工程分别是：（ ）、（ ）、（ ）。", "answer": "金桥工程；金关工程；金卡工程"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 1993年底，我国提出建设网络“三金”工程分别是：（ ）、（ ）、（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "在数据通信系统中，信源和信宿是各种类型计算机和终，它被称为（ ）、简称（ ）。一个DTE通常既是信源又是信宿。由于在数据通信系统中以DTE发出和接收的都是（ ），所以，把DTE之间的通信称为（ ）。", "answer": "数据终端设备；数据；数据电路"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在数据通信系统中，信源和信宿是各种类型计算机和终，它被称为（ ）、简称（ ）。一个DTE通常既是信源又是信宿。由于在数据

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "数据从发出端出发到数据被接收端接收的整个过程称为（ ），通信过程中每次通信包含（ ）和（ ）两个内容。", "answer": "通信过程；传输数据；通信控制"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 数据从发出端出发到数据被接收端接收的整个过程称为（ ），通信过程中每次通信包含（ ）和（ ）两个内容。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "通信系统中，称调制前的电信号为（ ），调制后的信号叫（ ）。", "answer": "基带信号；调制信号"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 通信系统中，称调制前的电信号为（ ），调制后的信号叫（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "在数据通信中（ ），通信线路的通信方式有三种基本形式，即（ ）、（ ）和（ ）。", "answer": "串行通信；单工通信；半双工通信；全双工通信"}',
  '通信方式', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在数据通信中（ ），通信线路的通信方式有三种基本形式，即（ ）、（ ）和（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "数据通信的主要技术指标包括：（ ）、（ ）、（ ）、（ ）、（ ）以及（ ）。", "answer": "传输速率；信道带宽；信道容量；出错率；延迟；吞吐量"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 数据通信的主要技术指标包括：（ ）、（ ）、（ ）、（ ）、（ ）以及（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "将数字信号调制为模拟信号有三种方式，即（ ）、（ ）、（ ）。", "answer": "调幅；调频；调相"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 将数字信号调制为模拟信号有三种方式，即（ ）、（ ）、（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "宽带通常是指通过给定的通信线路发送的（ ）。从技术的角度年，宽带是通信信道的宽度，即为传输信道的（ ）之差，单位为赫兹（ ）。", "answer": "数据量；最高频率与最低频率"}',
  '信道容量与带宽', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 宽带通常是指通过给定的通信线路发送的（ ）。从技术的角度年，宽带是通信信道的宽度，即为传输信道的（ ）之差，单位为赫兹（

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "二进制数据编码技术中的三种主要编码方案是：（ ）、（ ）和（ ）。", "answer": "非归零编码；曼彻斯特编码；差分曼彻斯特编码"}',
  '数据编码技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 二进制数据编码技术中的三种主要编码方案是：（ ）、（ ）和（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "PCM编码过程为（ ）、（ ）和（ ）。", "answer": "采样；量化；编码"}',
  '数据编码技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: PCM编码过程为（ ）、（ ）和（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "觉的数据传输方式有（ ）和（ ）。两者都是为解决数据传输过程中同步问题的相关技术，其中（ ）方式的效率高，速度快。", "answer": "异步传输；同步传输；同步传输"}',
  '操作系统', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 觉的数据传输方式有（ ）和（ ）。两者都是为解决数据传输过程中同步问题的相关技术，其中（ ）方式的效率高，速度快。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "多路复用技术又分为（ ）和（ ）两种。", "answer": "频分多路复用；时分多路复用"}',
  '信道复用技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 多路复用技术又分为（ ）和（ ）两种。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "时分多路复用技术又分为（ ）和（ ），其中（ ）技术的效率高。", "answer": "同步时分多路复用；统计时分多路复用；统计时分多路复用"}',
  '信道复用技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 时分多路复用技术又分为（ ）和（ ），其中（ ）技术的效率高。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "交换是网络实现（ ）的一种手段。实现数据交换的三种技术是（ ），（ ）和（ ）。", "answer": "数据传输；线路交换；报文交换；分组交换"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 交换是网络实现（ ）的一种手段。实现数据交换的三种技术是（ ），（ ）和（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "线路交换是一种直接交换方式，是多个输入线和多个输出线之间直接形成传输信息的（ ），线路交换分（ ）、（ ）和（ ）三个阶段。", "answer": "物理链路；建立线路；传输数据；拆除线路"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 线路交换是一种直接交换方式，是多个输入线和多个输出线之间直接形成传输信息的（ ），线路交换分（ ）、（ ）和（ ）三个阶

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "报文交换方式中，（ ）是交换的单位，主要包括报文的正文信息，指明发和收节点的地址以及各种控制信息。由于报文一般者比较长，所以，该方式要求网络上每个结点包括转接中心者要有较大的（ ），以备暂存报文。报文传输要等目的线路有（ ）时转发，所以，（ ）。", "answer": "报文；存储容量；空闲；延时性强"}',
  '数据交换技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 报文交换方式中，（ ）是交换的单位，主要包括报文的正文信息，指明发和收节点的地址以及各种控制信息。由于报文一般者比较长，

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "报文分组交换方式是把长的报文分成若干个（ ）的报文组，（ ）是交换单位。它与报文交换方式不同的是，交换要包括（ ），各组报文可按不同的路径进行传输，不各组报文都有到达目的节点后，目的节点按报文分组编号重组报文。", "answer": "较短；报文分组；分组编号"}',
  '数据交换技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 报文分组交换方式是把长的报文分成若干个（ ）的报文组，（ ）是交换单位。它与报文交换方式不同的是，交换要包括（ ），各组

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "分组交换也存在一些缺点，如：分组交换在各节点存储转发时因排队而造成一定的（ ），由于分组数据中必须携带一些控制信息而产生一定的（ ），分组交换网的（ ）和（ ）比较复杂。", "answer": "延时；额外开销；管理；控制"}',
  '数据交换技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 分组交换也存在一些缺点，如：分组交换在各节点存储转发时因排队而造成一定的（ ），由于分组数据中必须携带一些控制信息而产生

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "分组交换的主要任务就是负责系统中分组数据的（ ）、（ ）、和（ ）。", "answer": "存储；转发；选择合适的分组传输路径"}',
  '数据交换技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 分组交换的主要任务就是负责系统中分组数据的（ ）、（ ）、和（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "在计算机网络中目前常用的传输媒体有（ ）、（ ）、（ ）、（ ）等。", "answer": "双绞线；同轴电缆；光导纤维电缆；无线电传输媒体"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在计算机网络中目前常用的传输媒体有（ ）、（ ）、（ ）、（ ）等。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "调制解调器是同时具有调制和解调两种功能的设备，它是一种（ ）设备。", "answer": "信号交换"}',
  '物理层设备', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 调制解调器是同时具有调制和解调两种功能的设备，它是一种（ ）设备。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "双绞线抗干扰作用（ ）。双绞线可以用于（ ）或（ ）传输，传输信号时，双绞线可以在几公里之内不用对信号进行放大。", "answer": "较短；模拟；数字"}',
  '物理层传输介质', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 双绞线抗干扰作用（ ）。双绞线可以用于（ ）或（ ）传输，传输信号时，双绞线可以在几公里之内不用对信号进行放大。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "基带同轴电缆是指（ ）Ω的同轴电缆。它主要用于（ ）传输系统。基带同轴电缆的抗干扰性能优于（ ），它被广泛用于（ ）。", "answer": "50；数字；双绞线；局域网"}',
  '物理层传输介质', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 基带同轴电缆是指（ ）Ω的同轴电缆。它主要用于（ ）传输系统。基带同轴电缆的抗干扰性能优于（ ），它被广泛用于（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "差错控制技术常采用冗余编码方案，常用的两种校验码是（ ）和（ ）。", "answer": "奇偶校验；循环冗余码校验"}',
  '差错控制技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 差错控制技术常采用冗余编码方案，常用的两种校验码是（ ）和（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "计算机网络系统是非常复杂的系统，计算机之间相互通信涉及到许多复杂的技术问题，为实现计算机网络通信，实现网络资源共享，计算机网络采用的是对解决复杂问题十分有效的（ ）的方法。", "answer": "分层解决问题"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 计算机网络系统是非常复杂的系统，计算机之间相互通信涉及到许多复杂的技术问题，为实现计算机网络通信，实现网络资源共享，计算

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "协议就是为实现网络中的数据交换而建立的（ ）或（ ）。", "answer": "规则；标准"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 协议就是为实现网络中的数据交换而建立的（ ）或（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "一般来说，协议由（ ）、语法和（ ）三部份组成。", "answer": "语义；交换规则"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 一般来说，协议由（ ）、语法和（ ）三部份组成。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "物理层并不是指连接计算机的具体的物理（ ），或具体的（ ），而是指在物理媒体之上的为上一层（ ）提供一个传输原始比特流的物理（ ）。", "answer": "设备；传输媒体；数据链路层；连接"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 物理层并不是指连接计算机的具体的物理（ ），或具体的（ ），而是指在物理媒体之上的为上一层（ ）提供一个传输原始比特流的

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "物理层协议是为了把信号一方经过（ ）传到另一方，物理层所关心的是把通信双方连接起来，为数据链路层实现（ ）的数据传输创造环境。物理层不负责（ ）和（ ）服务。", "answer": "物理媒体；无差错；检错；纠错"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 物理层协议是为了把信号一方经过（ ）传到另一方，物理层所关心的是把通信双方连接起来，为数据链路层实现（ ）的数据传输创造

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "ISO组织提出的物理层四个技术特性是（ ）、（ ）、（ ）和（ ）。", "answer": "机械特性；电气特性；功能特性；规程特性"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: ISO组织提出的物理层四个技术特性是（ ）、（ ）、（ ）和（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "数据链路层的功能包括（ ）、（ ）、（ ）、（ ）。", "answer": "链路的建立与释放；以帧为单位传送接收数据；差错控制功能；流量控制功能"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 数据链路层的功能包括（ ）、（ ）、（ ）、（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "数据链路层向高层提供的服务可分为三种，即：（ ）、（ ）、（ ）。", "answer": "无应答无连接服务；有应答无连接服务；面向连接服务"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 数据链路层向高层提供的服务可分为三种，即：（ ）、（ ）、（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "数据链路层协议有（ ）、（ ）、（ ），现在最常用的是（ ）。", "answer": "异步终端协议；同步的面向字符协议；同步的面向位协议；同步的面向位协议"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 数据链路层协议有（ ）、（ ）、（ ），现在最常用的是（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "HDLC站分（ ）、（ ）、（ ）三种类型。", "answer": "主站；从站；组合站"}',
  '广域网技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: HDLC站分（ ）、（ ）、（ ）三种类型。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "在通信过程中，HDLC链路结构根据站的类型和线路连接方式的不同，数据链路的结构被分为（ ）和（ ）。", "answer": "平衡链路结构；非平衡链路结构"}',
  '广域网技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在通信过程中，HDLC链路结构根据站的类型和线路连接方式的不同，数据链路的结构被分为（ ）和（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "网络层是（ ）的最高层，它在（ ）提供服务的基础上，向（ ）子网提供服务。", "answer": "通信子网；数据链路层；资源"}',
  '子网划分与路由算法', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 网络层是（ ）的最高层，它在（ ）提供服务的基础上，向（ ）子网提供服务。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "网络层向传输层提供的服务包括（ ）、（ ）及其服务。", "answer": "网络地址；网络连接"}',
  'TCP/UDP协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 网络层向传输层提供的服务包括（ ）、（ ）及其服务。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "网络层的功能包括（ ），对数据传输过程实施（ ）、（ ）、（ ）、（ ）以及对非正常发问的恢复处理。", "answer": "路由选择和中继功能；流量控制；差错控制；顺序控制；多路复用"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 网络层的功能包括（ ），对数据传输过程实施（ ）、（ ）、（ ）、（ ）以及对非正常发问的恢复处理。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "虚电路服务和数据报服务是（ ）向（ ）提供的服务，其中虚电路又分为（ ）和（ ）两大类。", "answer": "网络层；传输层；永久虚电路；呼叫虚电路"}',
  '数据交换技术', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 虚电路服务和数据报服务是（ ）向（ ）提供的服务，其中虚电路又分为（ ）和（ ）两大类。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "X.25协议是（ ）组织推出的一个协议建议，分为三个协议层，即（ ），（ ）和（ ）。", "answer": "物理层；链路层；分组层"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: X.25协议是（ ）组织推出的一个协议建议，分为三个协议层，即（ ），（ ）和（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "传输层是（ ）子网与（ ）子网间的桥梁，其作用就是在网络层的基础上完成（ ）的（ ）和（ ），实现两个终端系统间传送的分组无差错、无丢失、无重复、分组顺序无误。", "answer": "通信；资源；端对端；差错控制；流量控制"}',
  '子网划分与路由算法', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 传输层是（ ）子网与（ ）子网间的桥梁，其作用就是在网络层的基础上完成（ ）的（ ）和（ ），实现两个终端系统间传送的分

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "传输层以上各层协议统称为高层协议，它们主要考虑的问题是（ ）之间的协议问题。", "answer": "主机与主机"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 传输层以上各层协议统称为高层协议，它们主要考虑的问题是（ ）之间的协议问题。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "TCP/IP协议成功地（ ）之间难以互联的问题，实现了异网互联通信。", "answer": "不同网络"}',
  'TCP/IP参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: TCP/IP协议成功地（ ）之间难以互联的问题，实现了异网互联通信。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "事实上，局域网（ ）是在（ ）的基础上发展起来的。", "answer": "广域网"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 事实上，局域网（ ）是在（ ）的基础上发展起来的。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "局域网的层次结构中，通信子网只有相当于OSI/RM中的下三层中的（ ）与（ ），而且高层功能一般由（ ）实现。", "answer": "物理层；数据链路层；网络操作系统"}',
  'OSI参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 局域网的层次结构中，通信子网只有相当于OSI/RM中的下三层中的（ ）与（ ），而且高层功能一般由（ ）实现。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "局域网中物理层的信号编码采用的是（ ）。", "answer": "曼彻期特编码"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 局域网中物理层的信号编码采用的是（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "局域网中数据链路层又分为（ ）子层与（ ）子层，其中（ ）子层与硬件无关。", "answer": "逻辑链路控制；媒体访问控制子层"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 局域网中数据链路层又分为（ ）子层与（ ）子层，其中（ ）子层与硬件无关。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "载体侦听多路访问技术，是为了减少（ ），它是在源结点发送报文之前，侦听信道是否（忙（ ）），如果侦听到信道上有信号，则（ ）发送报文。", "answer": "碰撞；有冲突；推迟"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 载体侦听多路访问技术，是为了减少（ ），它是在源结点发送报文之前，侦听信道是否（忙（ ）），如果侦听到信道上有信号，则（

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "对局域网来说网络服务器是网络控制的（ ），一个局域网至少需有一个服务器，特别是一个局域网至少配备一个（ ），没有服务器控制的通信局域，则为（ ）。", "answer": "核心；文件服务器；对等网"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 对局域网来说网络服务器是网络控制的（ ），一个局域网至少需有一个服务器，特别是一个局域网至少配备一个（ ），没有服务器控

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "在局域网中，从功能的角度上来说，网卡起着（ ）的作用，工作站或服务器连接到网络上，实现资源共享和相互通信都是通过（ ）实现的。", "answer": "通信控制处理机；网卡"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在局域网中，从功能的角度上来说，网卡起着（ ）的作用，工作站或服务器连接到网络上，实现资源共享和相互通信都是通过（ ）实

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "10BASE5 Ethernet表示使用粗同轴电缆的以太网络，其中“10”代表（ ），“BASE”代表（ ），“5”代表（ ）。", "answer": "传输速率为10M；基带传输；最大传输距离为500M"}',
  '物理层传输介质', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 10BASE5 Ethernet表示使用粗同轴电缆的以太网络，其中“10”代表（ ），“BASE”代表（ ），“5”代表

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "令牌访问技术可用于（ ）和（ ）两种拓扑结构网，这种访问方式在环形和总线形网中建立起来的（“环”）是一种（ ）。", "answer": "环形；总线型；“环”；逻辑环"}',
  '网络拓扑结构', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 令牌访问技术可用于（ ）和（ ）两种拓扑结构网，这种访问方式在环形和总线形网中建立起来的（“环”）是一种（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "FDDI是一种（ ）网，是1982年ANSI组织X3T9.5委员会制订的（ ）标准，该标准和IEEE802.5十分相似，以（ ）作为传输媒体。", "answer": "高速令牌环；高速环形局域网；光纤"}',
  '令牌环网', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: FDDI是一种（ ）网，是1982年ANSI组织X3T9.5委员会制订的（ ）标准，该标准和IEEE802.5十分相似，

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "快速以太网是指速度在（ ）以上的以太网，采用的是（ ）标准。", "answer": "100Mbps；IEEE802.3μ"}',
  '以太网标准', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 快速以太网是指速度在（ ）以上的以太网，采用的是（ ）标准。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "千兆以太网标准是现行（ ）标准的扩展，经过修改的MAC子层仍然使用（ ）协议，支持（ ）和（ ）通信。", "answer": "IEEE802.3；全双工；半双工"}',
  '以太网标准', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 千兆以太网标准是现行（ ）标准的扩展，经过修改的MAC子层仍然使用（ ）协议，支持（ ）和（ ）通信。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "NOVELL网的核心是（ ）。", "answer": "NETWARE网络操作系统"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: NOVELL网的核心是（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "NETWARE网络操作系统管理工作站与服务器之间的通信，它的功能是向工作站用户提供网络服务，包括（ ）、（ ）和（ ）等。", "answer": "通信服务；网络管理服务；网络应用服务"}',
  '操作系统', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: NETWARE网络操作系统管理工作站与服务器之间的通信，它的功能是向工作站用户提供网络服务，包括（ ）、（ ）和（ ）等

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "Windows NT是（ ）位的（ ）操作系统。", "answer": "32；网络"}',
  '操作系统', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: Windows NT是（ ）位的（ ）操作系统。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "客户/服务器模式的工作流程包括以下几步，即：（ ）（ ）；（ ）（ ）；（ ）（ ）。", "answer": "请求；处理；结果"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 客户/服务器模式的工作流程包括以下几步，即：（ ）（ ）；（ ）（ ）；（ ）（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "在NT环境中，必须有一个服务器作为（ ）控制器，NT缺省安装的域名为（ ）。", "answer": "主域；domain"}',
  'DNS协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在NT环境中，必须有一个服务器作为（ ）控制器，NT缺省安装的域名为（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "Windows NT提供两套软件包，分别称为（ ）和（ ）。", "answer": "WINDOWS NT WORKSTATION；WINDOWS NT SERVER"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: Windows NT提供两套软件包，分别称为（ ）和（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "网络互联的目的是实现更广泛的（ ）。", "answer": "资源共享"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 网络互联的目的是实现更广泛的（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "目前用于网络互连的设备主要有（ ）、（ ）、（ ）、（ ）等。", "answer": "中继器；集线器；网桥；路由器"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 目前用于网络互连的设备主要有（ ）、（ ）、（ ）、（ ）等。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "中继器是运行在OSI模型的（ ）层上的。它扩展了网络传输的（ ），是最简单的网络互连产品。", "answer": "物理；长度"}',
  'OSI参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 中继器是运行在OSI模型的（ ）层上的。它扩展了网络传输的（ ），是最简单的网络互连产品。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "网桥也称桥接器，它是（ ）层上局域网之间的互连设备。网桥同中继器不同，网桥处理的是一个完整的（ ），并使用和计算机相同的（ ）设备。", "answer": "数据链路；接口"}',
  '物理层设备', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 网桥也称桥接器，它是（ ）层上局域网之间的互连设备。网桥同中继器不同，网桥处理的是一个完整的（ ），并使用和计算机相同的

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "互连网中，域名是对IP地址的命名，它采用（ ）结构，通常最高域名为（ ）。如CN代表（ ）；次高域名常用于标识行业，如COM代表（ ），EDU代表（ ）。", "answer": "层次；国家名；中国；商业；教育"}',
  'DNS协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 互连网中，域名是对IP地址的命名，它采用（ ）结构，通常最高域名为（ ）。如CN代表（ ）；次高域名常用于标识行业，如C

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "IP地址协议作网间网中（ ）层协议，提供无连接的数据报传输机制，IP数据报也分为（ ）和（ ）两个部分。", "answer": "网络；报头；数据区"}',
  'IP数据报分片', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: IP地址协议作网间网中（ ）层协议，提供无连接的数据报传输机制，IP数据报也分为（ ）和（ ）两个部分。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "Internet的应用分为两大类，即（ ）、（ ）。", "answer": "通信；使用网络资源"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: Internet的应用分为两大类，即（ ）、（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "电子邮件的传递都是要通过（ ）来完成的。", "answer": "邮件网关"}',
  '电子邮件协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 电子邮件的传递都是要通过（ ）来完成的。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "局域网使用的三种典型拓朴结构是（ ）、（ ）和（ ）。", "answer": "星型；环形；总线型"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 局域网使用的三种典型拓朴结构是（ ）、（ ）和（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "根据IP头部的结构，一个IP分组（ ）最大可以有 65535（即2<sup>16</sup>\\\\-1） 字节。", "answer": "包括头部；即2<sup>16</sup>\\\\-1"}',
  'IP数据报分片', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 根据IP头部的结构，一个IP分组（ ）最大可以有 65535（即2<sup>16</sup>\\-1） 字节。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "ICMP通常被认为是 网络 层的协议。", "answer": "网络 层的协议"}',
  'ICMP协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: ICMP通常被认为是 网络 层的协议。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "在OSI环境中发送方的应用进程依次从应用层逐层传至物理层，其中传输层的数据传输单元称为 ，网络层的数据传输单元称为 ，数据链路层的数据传输单元称为 ，物理层的数据传输单元称为 。", "answer": "，网络层的数据传输单元称为；，物理层的数据传输单元称为"}',
  'TCP/UDP协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在OSI环境中发送方的应用进程依次从应用层逐层传至物理层，其中传输层的数据传输单元称为 ，网络层的数据传输单元称为 ，数

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "数据链路层在局域网参考模型中被分成了两个子层：__媒体接入控制（ ）子层。", "answer": "逻辑链路控制（LLC）子层与"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 数据链路层在局域网参考模型中被分成了两个子层：__媒体接入控制（ ）子层。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "WWW采用的是___的工作模式。", "answer": "客户机/服务器"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: WWW采用的是___的工作模式。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "信道复用技术主要有______ 和___四类。", "answer": "频分多路复用；时分多路复用；波分多路复用；码分多路复用"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 信道复用技术主要有______ 和___四类。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "电子邮件相关协议主要有______ 三种。", "answer": "SMTP；POP3；IMAP"}',
  '电子邮件协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 电子邮件相关协议主要有______ 三种。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "在TCP/IP层次模型的第三层网络层中包括的协议主要有______及 ___。", "answer": "IP；ICMP；ARP；RARP"}',
  'TCP/IP参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在TCP/IP层次模型的第三层网络层中包括的协议主要有______及 ___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "计算机网络采用____技术。", "answer": "分组交换；电路交换"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 计算机网络采用____技术。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "在计算机网络中数据的交换按交换方式来分类，可以分为______三种。", "answer": "电路交换；报文交换；报文分组交换"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 在计算机网络中数据的交换按交换方式来分类，可以分为______三种。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "802.3以太网最小传送的帧长度为 ___ 个8位bit。", "answer": "64"}',
  'CSMA/CD协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: 802.3以太网最小传送的帧长度为 ___ 个8位bit。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "Outlook等常用电子邮件软件接收邮件使用的协议是（ ），发送邮件时使用的协议是（ ）。", "answer": "POP3"}',
  '电子邮件协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: Outlook等常用电子邮件软件接收邮件使用的协议是（ ），发送邮件时使用的协议是（ ）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "（ ） 在接入Internet时，区域（ ）与区域（ ）相比，哪个区域的计算机安全性更好？", "answer": "2分"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: （ ） 在接入Internet时，区域（ ）与区域（ ）相比，哪个区域的计算机安全性更好？

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "（ ） IP地址为192.168.0.36的计算机发送到Internet上的IP数据包的源IP地址为（ ） ；", "answer": "4分"}',
  'IP数据报分片', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: （ ） IP地址为192.168.0.36的计算机发送到Internet上的IP数据包的源IP地址为（ ） ；

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "（ ）如果电信部门分配的公网IP地址为202.117.12.32/30，则图3-l的网络连接应做何改动？", "answer": "3分"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: （ ）如果电信部门分配的公网IP地址为202.117.12.32/30，则图3-l的网络连接应做何改动？

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "（ ）该网络的物理拓扑结构是什么类型？", "answer": "2分"}',
  '网络拓扑结构', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: （ ）该网络的物理拓扑结构是什么类型？

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "（ ）该公司在服务器上安装了DNS，以便把公司主页发布到Internet上。请问DNS的主要功能是什么？", "answer": "4分"}',
  'DNS协议', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: （ ）该公司在服务器上安装了DNS，以便把公司主页发布到Internet上。请问DNS的主要功能是什么？

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "（ ）给出“局域网上所有用户以共享同一IP地址方式来访问Internet”的两种解决方案。", "answer": "6分"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: （ ）给出“局域网上所有用户以共享同一IP地址方式来访问Internet”的两种解决方案。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "（ ）在服务器和Internet接入之间安装采用IP过滤技术的防火墙，请问IP过滤技术是如何实现的？", "answer": "4分"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络试题库含答案2026: （ ）在服务器和Internet接入之间安装采用IP过滤技术的防火墙，请问IP过滤技术是如何实现的？

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "1965年科学家提出超文本概念，其超文本的核心是____。", "options": [{"label": "A", "text": "链接"}, {"label": "B", "text": "网络"}, {"label": "C", "text": "图像"}, {"label": "D", "text": "声音"}], "answer": "A"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 1965年科学家提出超文本概念，其超文本的核心是__A__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "地址栏中输入的http://zjhk.school.com中，zjhk.school.com 是一个____。", "options": [{"label": "A", "text": "域名"}, {"label": "B", "text": "文件"}, {"label": "C", "text": "邮箱"}, {"label": "D", "text": "国家"}], "answer": "A"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 地址栏中输入的http://zjhk.school.com中，zjhk.school.com 是一个_A___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "通常所说的ADSL是指____。", "options": [{"label": "A", "text": "上网方式"}, {"label": "B", "text": "电脑品牌"}, {"label": "C", "text": "网络服务商"}, {"label": "D", "text": "网页制作技术"}], "answer": "A"}',
  '物理层设备', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 通常所说的ADSL是指_A__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "下列四项中表示电子邮件地址的是____。", "options": [{"label": "A", "text": "ks@183.net"}, {"label": "B", "text": "192.168.0.1"}, {"label": "C", "text": "www.gov.cn"}, {"label": "D", "text": "www.cctv.com"}], "answer": "A"}',
  '电子邮件协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 下列四项中表示电子邮件地址的是_A__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "浏览网页过程中，当鼠标移动到已设置了超链接的区域时，鼠标指针形状一般变为____。", "options": [{"label": "A", "text": "小手形状"}, {"label": "B", "text": "双向箭头"}, {"label": "C", "text": "禁止图案"}, {"label": "D", "text": "下拉箭头"}], "answer": "A"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 浏览网页过程中，当鼠标移动到已设置了超链接的区域时，鼠标指针形状一般变为__A__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "下列四项中表示域名的是____。", "options": [{"label": "A", "text": "www.cctv.com"}, {"label": "B", "text": "hk@zj.school.com"}], "answer": "A"}',
  'DNS协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 下列四项中表示域名的是_A___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "下列软件中可以查看WWW信息的是____。", "options": [{"label": "A", "text": "游戏软件"}, {"label": "B", "text": "财务软件"}, {"label": "C", "text": "杀毒软件"}, {"label": "D", "text": "浏览器软件"}], "answer": "D"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 下列软件中可以查看WWW信息的是_D_。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "设置文件夹共享属性时，可以选择的三种访问类型为完全控制、更改和____。", "options": [{"label": "A", "text": "共享"}, {"label": "B", "text": "只读"}, {"label": "C", "text": "不完全"}, {"label": "D", "text": "不共享"}], "answer": "B"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 设置文件夹共享属性时，可以选择的三种访问类型为完全控制、更改和_B_。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "计算机网络最突出的特点是____。", "options": [{"label": "A", "text": "资源共享"}, {"label": "B", "text": "运算精度高"}, {"label": "C", "text": "运算速度快"}, {"label": "D", "text": "内存容量大"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 计算机网络最突出的特点是_A__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "E-mail地址的格式是____。", "options": [{"label": "A", "text": "www.zjschool.cn"}, {"label": "B", "text": "网址&#8226;用户名"}], "answer": "C"}',
  '电子邮件协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: E-mail地址的格式是_C___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "为了使自己的文件让其他同学浏览，又不想让他们修改文件，一般可将包含该文件的文件夹共享属性的访问类型设置为____。", "options": [{"label": "A", "text": "隐藏"}, {"label": "B", "text": "完全"}, {"label": "C", "text": "只读"}, {"label": "D", "text": "不共享"}], "answer": "C"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 为了使自己的文件让其他同学浏览，又不想让他们修改文件，一般可将包含该文件的文件夹共享属性的访问类型设置为_C___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "Internet Explorer(IE)浏览器的收藏夹的主要作用是收藏____。", "options": [{"label": "A", "text": "图片"}, {"label": "B", "text": "邮件"}, {"label": "C", "text": "网址"}, {"label": "D", "text": "文档"}], "answer": "C"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: Internet Explorer(IE)浏览器的收藏夹的主要作用是收藏_C___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "网址www.pku.edu.cn中的cn表示____。", "options": [{"label": "A", "text": "英国"}, {"label": "B", "text": "美国"}, {"label": "C", "text": "日本"}, {"label": "D", "text": "中国"}], "answer": "D"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 网址www.pku.edu.cn中的cn表示_D___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "在因特网上专门用于传输文件的协议是____ 。", "options": [{"label": "A", "text": "FTP"}, {"label": "B", "text": "HTTP"}, {"label": "C", "text": "NEWS"}, {"label": "D", "text": "Word"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 在因特网上专门用于传输文件的协议是_A_ 。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "www.163.com是指____。", "options": [{"label": "A", "text": "域名"}, {"label": "B", "text": "程序语句"}, {"label": "C", "text": "电子邮件地址"}, {"label": "D", "text": "超文本传输协议"}], "answer": "A"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: www.163.com是指__ A___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "下列四项中主要用于在Internet上交流信息的是____。", "options": [{"label": "A", "text": "BBS"}, {"label": "B", "text": "DOS"}, {"label": "C", "text": "Word"}, {"label": "D", "text": "Excel"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 下列四项中主要用于在Internet上交流信息的是__A__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "电子邮件地址格式为：username@hostname,其中hostname为____。", "options": [{"label": "A", "text": "用户地址名"}, {"label": "B", "text": "某国家名"}, {"label": "C", "text": "某公司名"}, {"label": "D", "text": "ISP某台主机的域名"}], "answer": "D"}',
  '电子邮件协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 电子邮件地址格式为：username@hostname,其中hostname为__D__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "下列四项中主要用于在Internet上交流信息的是____。", "options": [{"label": "A", "text": "DOS"}, {"label": "B", "text": "Word"}, {"label": "C", "text": "Excel"}, {"label": "D", "text": "E-mail"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 下列四项中主要用于在Internet上交流信息的是_D___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "地址ftp://218.0.0.123中的ftp是指____。", "options": [{"label": "A", "text": "协议"}, {"label": "B", "text": "网址"}, {"label": "C", "text": "新闻组"}, {"label": "D", "text": "邮件信箱"}], "answer": "A"}',
  '文件传输协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 地址ftp://218.0.0.123中的ftp是指___A_。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "http是一种____。", "options": [{"label": "A", "text": "域名"}, {"label": "B", "text": "高级语言"}, {"label": "C", "text": "服务器名称"}, {"label": "D", "text": "超文本传输协议"}], "answer": "D"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: http是一种_D___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "上因特网浏览信息时，常用的浏览器是____。", "options": [{"label": "A", "text": "KV3000"}, {"label": "B", "text": "Word 97"}, {"label": "C", "text": "WPS 2000"}, {"label": "D", "text": "Internet Explorer"}], "answer": "D"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 上因特网浏览信息时，常用的浏览器是_D___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "发送电子邮件时，如果接收方没有开机，那么邮件将____。", "options": [{"label": "A", "text": "丢失"}, {"label": "B", "text": "退回给发件人"}, {"label": "C", "text": "开机时重新发送"}, {"label": "D", "text": "保存在邮件服务器上"}], "answer": "D"}',
  '电子邮件协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 发送电子邮件时，如果接收方没有开机，那么邮件将__D__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "如果允许其他用户通过网上邻居来读取某一共享文件夹中的信息，但不能对该文件夹中的文件作任何修改，应将该文件夹的共享属性设置为____。", "options": [{"label": "A", "text": "隐藏"}, {"label": "B", "text": "完全"}, {"label": "C", "text": "只读"}, {"label": "D", "text": "系统"}], "answer": "C"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 如果允许其他用户通过网上邻居来读取某一共享文件夹中的信息，但不能对该文件夹中的文件作任何修改，应将该文件夹的共享属性设置

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "下列属于计算机网络通信设备的是____。", "options": [{"label": "A", "text": "显卡"}, {"label": "B", "text": "网线"}, {"label": "C", "text": "音箱"}, {"label": "D", "text": "声卡"}], "answer": "B"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 下列属于计算机网络通信设备的是_B___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "个人计算机通过电话线拨号方式接入因特网时，应使用的设备是____。", "options": [{"label": "A", "text": "交换机"}, {"label": "B", "text": "调制解调器"}, {"label": "C", "text": "电话机"}, {"label": "D", "text": "浏览器软件"}], "answer": "B"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 个人计算机通过电话线拨号方式接入因特网时，应使用的设备是_B___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "用IE浏览器浏览网页，在地址栏中输入网址时，通常可以省略的是____。", "options": [{"label": "A", "text": "http://"}, {"label": "B", "text": "ftp://"}, {"label": "C", "text": "mailto://"}, {"label": "D", "text": "news://"}], "answer": "A"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 用IE浏览器浏览网页，在地址栏中输入网址时，通常可以省略的是_A___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "网卡属于计算机的____。", "options": [{"label": "A", "text": "显示设备"}, {"label": "B", "text": "存储设备"}, {"label": "C", "text": "打印设备"}, {"label": "D", "text": "网络设备"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 网卡属于计算机的_D__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "Internet中URL的含义是____。", "options": [{"label": "A", "text": "统一资源定位器"}, {"label": "B", "text": "Internet 协议"}], "answer": "A"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: Internet中URL的含义是_A___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "ADSL可以在普通电话线上提供10M bps的下行速率，即意味着理论上ADSL可以提供下载文件的速度达到每秒____。", "options": [{"label": "A", "text": "1024字节"}, {"label": "B", "text": "10×1024字节"}, {"label": "C", "text": "10×1024位"}, {"label": "D", "text": "10×1024×1024位"}], "answer": "D"}',
  '物理层设备', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: ADSL可以在普通电话线上提供10M bps的下行速率，即意味着理论上ADSL可以提供下载文件的速度达到每秒___D_。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "要能顺利发送和接收电子邮件，下列设备必需的是____。", "options": [{"label": "A", "text": "打印机"}, {"label": "B", "text": "邮件服务器"}, {"label": "C", "text": "扫描仪"}, {"label": "D", "text": "Web服务器"}], "answer": "B"}',
  '电子邮件协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 要能顺利发送和接收电子邮件，下列设备必需的是_B___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "区分局域网（LAN）和广域网（WAN）的依据是____。", "options": [{"label": "A", "text": "网络用户"}, {"label": "B", "text": "传输协议"}, {"label": "C", "text": "联网设备"}, {"label": "D", "text": "联网范围"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 区分局域网（LAN）和广域网（WAN）的依据是__ D__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "关于Internet, 以下说法正确的是____。", "options": [{"label": "A", "text": "Internet 属于美国"}, {"label": "B", "text": "Internet属于联合国"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 关于Internet, 以下说法正确的是_D___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "要给某人发送一封E-mail,必须知道他的____。", "options": [{"label": "A", "text": "姓名"}, {"label": "B", "text": "邮政编码"}, {"label": "C", "text": "家庭地址"}, {"label": "D", "text": "电子邮件地址"}], "answer": "D"}',
  '电子邮件协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 要给某人发送一封E-mail,必须知道他的_D___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "Internet的中文规范译名为____。", "options": [{"label": "A", "text": "因特网"}, {"label": "B", "text": "教科网"}, {"label": "C", "text": "局域网"}, {"label": "D", "text": "广域网"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: Internet的中文规范译名为_A___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "学校的校园网络属于____。", "options": [{"label": "A", "text": "局域网"}, {"label": "B", "text": "广域网"}, {"label": "C", "text": "城域网"}, {"label": "D", "text": "电话网"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 学校的校园网络属于__A__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "连接到Internet的计算机中，必须安装的协议是____。", "options": [{"label": "A", "text": "双边协议"}, {"label": "B", "text": "TCP/IP协议"}, {"label": "C", "text": "NetBEUI协议"}, {"label": "D", "text": "SPSS协议"}], "answer": "B"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 连接到Internet的计算机中，必须安装的协议是__B__。


INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "在地址栏中显示http://www.sina.com.cn/,则所采用的协议是____。", "options": [{"label": "A", "text": "HTTP"}, {"label": "B", "text": "FTP"}, {"label": "C", "text": "WWW"}, {"label": "D", "text": "电子邮件"}], "answer": "C"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 在地址栏中显示http://www.sina.com.cn/,则所采用的协议是__C__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "WWW最初是由____实验室研制的。", "options": [{"label": "A", "text": "CERN"}, {"label": "B", "text": "AT&T"}, {"label": "C", "text": "ARPA"}, {"label": "D", "text": "Microsoft Internet Lab"}], "answer": "C"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: WWW最初是由_C__实验室研制的。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "Internet 起源于____。", "options": [{"label": "A", "text": "美国"}, {"label": "B", "text": "英国"}, {"label": "C", "text": "德国"}, {"label": "D", "text": "澳大利亚"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: Internet 起源于__A__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "下列IP地址中书写正确的是____。", "options": [{"label": "A", "text": "16819201"}, {"label": "B", "text": "325.255.231.0"}, {"label": "C", "text": "192.168.1"}, {"label": "D", "text": "255.255.255.0"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 下列IP地址中书写正确的是_D___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "构成计算机网络的要素主要有：通信主体、通信设备和通信协议，其中通信主体指的是____。", "options": [{"label": "A", "text": "交换机"}, {"label": "B", "text": "双绞线"}, {"label": "C", "text": "计算机"}, {"label": "D", "text": "网卡"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 构成计算机网络的要素主要有：通信主体、通信设备和通信协议，其中通信主体指的是_D_。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "下列说法错误的____。", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 下列说法错误的_D__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "计算机网络的主要目标是____。", "options": [{"label": "A", "text": "分布处理"}, {"label": "B", "text": "将多台计算机连接起来"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题一: 计算机网络的主要目标是_D___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "1965年科学家提出超文本概念，其超文本的核心是____。", "options": [{"label": "A", "text": "链接"}, {"label": "B", "text": "网络"}, {"label": "C", "text": "图像"}, {"label": "D", "text": "声音"}], "answer": "A"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 1965年科学家提出超文本概念，其超文本的核心是_A___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "地址栏中输入的http://zjhk.school.com中，zjhk.school.com 是一个____。", "options": [{"label": "A", "text": "域名"}, {"label": "B", "text": "文件"}, {"label": "C", "text": "邮箱"}, {"label": "D", "text": "国家"}], "answer": "A"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 地址栏中输入的http://zjhk.school.com中，zjhk.school.com 是一个__A__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "通常所说的ADSL是指____。", "options": [{"label": "A", "text": "上网方式"}, {"label": "B", "text": "电脑品牌"}, {"label": "C", "text": "网络服务商"}, {"label": "D", "text": "网页制作技术"}], "answer": "A"}',
  '物理层设备', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 通常所说的ADSL是指__A_。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "下列四项中表示电子邮件地址的是____。", "options": [{"label": "A", "text": "ks@183.net"}, {"label": "B", "text": "192.168.0.1"}, {"label": "C", "text": "www.gov.cn"}], "answer": "A"}',
  '电子邮件协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 下列四项中表示电子邮件地址的是___A_。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "浏览网页过程中，当鼠标移动到已设置了超链接的区域时，鼠标指针形状一般变为____。", "options": [{"label": "A", "text": "小手形状"}, {"label": "B", "text": "双向箭头"}, {"label": "C", "text": "禁止图案"}, {"label": "D", "text": "下拉箭头"}], "answer": "A"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 浏览网页过程中，当鼠标移动到已设置了超链接的区域时，鼠标指针形状一般变为__A__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "下列四项中表示域名的是____。", "options": [{"label": "A", "text": "www.cctv.com"}, {"label": "B", "text": "hk@zj.school.com"}, {"label": "C", "text": "zjwww@china.com"}], "answer": "A"}',
  'DNS协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 下列四项中表示域名的是_A___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "下列软件中可以查看WWW信息的是____。", "options": [{"label": "A", "text": "游戏软件"}, {"label": "B", "text": "财务软件"}, {"label": "C", "text": "杀毒软件"}, {"label": "D", "text": "浏览器软件"}], "answer": "D"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 下列软件中可以查看WWW信息的是__D___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "设置文件夹共享属性时，可以选择的三种访问类型为完全控制、更改和____。", "options": [{"label": "A", "text": "共享"}, {"label": "B", "text": "只读"}, {"label": "C", "text": "不完全"}, {"label": "D", "text": "不共享"}], "answer": "B"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 设置文件夹共享属性时，可以选择的三种访问类型为完全控制、更改和_B_。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "计算机网络最突出的特点是____。", "options": [{"label": "A", "text": "资源共享"}, {"label": "B", "text": "运算精度高"}, {"label": "C", "text": "运算速度快"}, {"label": "D", "text": "内存容量大"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 计算机网络最突出的特点是_A__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "E-mail地址的格式是____。", "options": [{"label": "A", "text": "www.zjschool.cn"}, {"label": "B", "text": "网址&#8226;用户名"}], "answer": "C"}',
  '电子邮件协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: E-mail地址的格式是_C___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "为了使自己的文件让其他同学浏览，又不想让他们修改文件，一般可将包含该文件的文件夹共享属性的访问类型设置为____。", "options": [{"label": "A", "text": "隐藏"}, {"label": "B", "text": "完全"}, {"label": "C", "text": "只读"}, {"label": "D", "text": "不共享"}], "answer": "C"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 为了使自己的文件让其他同学浏览，又不想让他们修改文件，一般可将包含该文件的文件夹共享属性的访问类型设置为_C___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "Internet Explorer(IE)浏览器的收藏夹的主要作用是收藏____。", "options": [{"label": "A", "text": "图片"}, {"label": "B", "text": "邮件"}, {"label": "C", "text": "网址"}, {"label": "D", "text": "文档"}], "answer": "C"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: Internet Explorer(IE)浏览器的收藏夹的主要作用是收藏_C___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "网址www.pku.edu.cn中的cn表示____。", "options": [{"label": "A", "text": "英国"}, {"label": "B", "text": "美国"}, {"label": "C", "text": "日本"}, {"label": "D", "text": "中国"}], "answer": "D"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 网址www.pku.edu.cn中的cn表示__D__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "在因特网上专门用于传输文件的协议是____。", "options": [{"label": "A", "text": "FTP"}, {"label": "B", "text": "HTTP"}, {"label": "C", "text": "NEWS"}, {"label": "D", "text": "Word"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 在因特网上专门用于传输文件的协议是_A___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "www.163.com是指____。", "options": [{"label": "A", "text": "域名"}, {"label": "B", "text": "程序语句"}, {"label": "C", "text": "电子邮件地址"}, {"label": "D", "text": "超文本传输协议"}], "answer": "A"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: www.163.com是指_A___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "下列四项中主要用于在Internet上交流信息的是____。", "options": [{"label": "A", "text": "BBS"}, {"label": "B", "text": "DOS"}, {"label": "C", "text": "Word"}, {"label": "D", "text": "Excel"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 下列四项中主要用于在Internet上交流信息的是_A___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "电子邮件地址格式为：username@hostname,其中hostname为____。", "options": [{"label": "A", "text": "用户地址名"}, {"label": "B", "text": "某国家名"}, {"label": "C", "text": "某公司名"}, {"label": "D", "text": "ISP某台主机的域名"}], "answer": "D"}',
  '电子邮件协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 电子邮件地址格式为：username@hostname,其中hostname为__D__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "下列四项中主要用于在Internet上交流信息的是____。", "options": [{"label": "A", "text": "DOS"}, {"label": "B", "text": "Word"}, {"label": "C", "text": "Excel"}, {"label": "D", "text": "E-mail"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 下列四项中主要用于在Internet上交流信息的是_D___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "地址ftp://218.0.0.123中的ftp是指____。", "options": [{"label": "A", "text": "协议"}, {"label": "B", "text": "网址"}, {"label": "C", "text": "新闻组"}, {"label": "D", "text": "邮件信箱"}], "answer": "A"}',
  '文件传输协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 地址ftp://218.0.0.123中的ftp是指__A__。


INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "上因特网浏览信息时，常用的浏览器是____。", "options": [{"label": "A", "text": "KV3000"}, {"label": "B", "text": "Word 97"}, {"label": "C", "text": "WPS 2000"}], "answer": "D"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 上因特网浏览信息时，常用的浏览器是__D__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "发送电子邮件时，如果接收方没有开机，那么邮件将____。", "options": [{"label": "A", "text": "丢失"}, {"label": "B", "text": "退回给发件人"}, {"label": "C", "text": "开机时重新发送"}], "answer": "D"}',
  '电子邮件协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 发送电子邮件时，如果接收方没有开机，那么邮件将_D___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "如果允许其他用户通过网上邻居来读取某一共享文件夹中的信息，但不能对该文件夹中的文件作任何修改，应将该文件夹的共享属性设置为____。", "options": [{"label": "A", "text": "隐藏"}, {"label": "B", "text": "完全"}, {"label": "C", "text": "只读"}, {"label": "D", "text": "系统"}], "answer": "C"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 如果允许其他用户通过网上邻居来读取某一共享文件夹中的信息，但不能对该文件夹中的文件作任何修改，应将该文件夹的共享属性设置

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "下列属于计算机网络通信设备的是____。", "options": [{"label": "A", "text": "显卡"}, {"label": "B", "text": "网线"}, {"label": "C", "text": "音箱"}, {"label": "D", "text": "声卡"}], "answer": "B"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 下列属于计算机网络通信设备的是_B___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "个人计算机通过电话线拨号方式接入因特网时，应使用的设备是____。", "options": [{"label": "A", "text": "交换机"}, {"label": "B", "text": "调制解调器"}, {"label": "C", "text": "电话机"}, {"label": "D", "text": "浏览器软件"}], "answer": "B"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 个人计算机通过电话线拨号方式接入因特网时，应使用的设备是_B___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "用IE浏览器浏览网页，在地址栏中输入网址时，通常可以省略的是____。", "options": [{"label": "A", "text": "http://"}, {"label": "B", "text": "ftp://"}, {"label": "C", "text": "mailto://"}, {"label": "D", "text": "news://"}], "answer": "A"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 用IE浏览器浏览网页，在地址栏中输入网址时，通常可以省略的是_A___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "网卡属于计算机的____。", "options": [{"label": "A", "text": "显示设备"}, {"label": "B", "text": "存储设备"}, {"label": "C", "text": "打印设备"}, {"label": "D", "text": "网络设备"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 网卡属于计算机的_D__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "Internet中URL的含义是____。", "options": [{"label": "A", "text": "统一资源定位器"}, {"label": "B", "text": "Internet 协议"}], "answer": "A"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: Internet中URL的含义是__A__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "ADSL可以在普通电话线上提供10M bps的下行速率，即意味着理论上ADSL可以提供下载文件的速度达到每秒____。", "options": [{"label": "A", "text": "1024字节"}, {"label": "B", "text": "10×1024字节"}, {"label": "C", "text": "10×1024位"}], "answer": "D"}',
  '物理层设备', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: ADSL可以在普通电话线上提供10M bps的下行速率，即意味着理论上ADSL可以提供下载文件的速度达到每秒__D__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "要能顺利发送和接收电子邮件，下列设备必需的是____。", "options": [{"label": "A", "text": "打印机"}, {"label": "B", "text": "邮件服务器"}, {"label": "C", "text": "扫描仪"}, {"label": "D", "text": "Web服务器"}], "answer": "B"}',
  '电子邮件协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 要能顺利发送和接收电子邮件，下列设备必需的是_B___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "构成计算机网络的要素主要有通信协议、通信设备和____。", "options": [{"label": "A", "text": "通信线路"}, {"label": "B", "text": "通信人才"}, {"label": "C", "text": "通信主体"}, {"label": "D", "text": "通信卫星"}], "answer": "C"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 构成计算机网络的要素主要有通信协议、通信设备和__C__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "区分局域网（LAN）和广域网（WAN）的依据是____。", "options": [{"label": "A", "text": "网络用户"}, {"label": "B", "text": "传输协议"}, {"label": "C", "text": "联网设备"}, {"label": "D", "text": "联网范围"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 区分局域网（LAN）和广域网（WAN）的依据是_D___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "以下能将模拟信号与数字信号互相转换的设备是____。", "options": [{"label": "A", "text": "硬盘"}, {"label": "B", "text": "鼠标"}, {"label": "C", "text": "打印机"}, {"label": "D", "text": "调制解调器"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 以下能将模拟信号与数字信号互相转换的设备是_D___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "关于Internet, 以下说法正确的是____。", "options": [{"label": "A", "text": "Internet 属于美国"}, {"label": "B", "text": "Internet属于联合国"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 关于Internet, 以下说法正确的是__D__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "要给某人发送一封E-mail,必须知道他的____。", "options": [{"label": "A", "text": "姓名"}, {"label": "B", "text": "邮政编码"}, {"label": "C", "text": "家庭地址"}, {"label": "D", "text": "电子邮件地址"}], "answer": "D"}',
  '电子邮件协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 要给某人发送一封E-mail,必须知道他的_D___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "Internet的中文规范译名为____。", "options": [{"label": "A", "text": "因特网"}, {"label": "B", "text": "教科网"}, {"label": "C", "text": "局域网"}, {"label": "D", "text": "广域网"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: Internet的中文规范译名为_A___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "学校的校园网络属于____。", "options": [{"label": "A", "text": "局域网"}, {"label": "B", "text": "广域网"}, {"label": "C", "text": "城域网"}, {"label": "D", "text": "电话网"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 学校的校园网络属于_A___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "连接到Internet的计算机中，必须安装的协议是____。", "options": [{"label": "A", "text": "双边协议"}, {"label": "B", "text": "TCP/IP协议"}, {"label": "C", "text": "NetBEUI协议"}, {"label": "D", "text": "SPSS协议"}], "answer": "B"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 连接到Internet的计算机中，必须安装的协议是__B__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "下面是某单位的主页的Web地址URL,其中符合URL格式的是____。", "options": [{"label": "A", "text": "Http//www.jnu.edu.cn"}, {"label": "B", "text": "Http:www.jnu.edu.cn"}], "answer": "C"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 下面是某单位的主页的Web地址URL,其中符合URL格式的是__C__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "在地址栏中显示http://www.sina.com.cn/,则所采用的协议是____。", "options": [{"label": "A", "text": "HTTP"}, {"label": "B", "text": "FTP"}, {"label": "C", "text": "WWW"}, {"label": "D", "text": "电子邮件"}], "answer": "A"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 在地址栏中显示http://www.sina.com.cn/,则所采用的协议是_A___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "WWW最初是由____实验室研制的。", "options": [{"label": "A", "text": "CERN"}, {"label": "B", "text": "AT&T"}, {"label": "C", "text": "ARPA"}, {"label": "D", "text": "Microsoft Internet Lab"}], "answer": "C"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: WWW最初是由_C__实验室研制的。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "Internet 起源于____。", "options": [{"label": "A", "text": "美国"}, {"label": "B", "text": "英国"}, {"label": "C", "text": "德国"}, {"label": "D", "text": "澳大利亚"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: Internet 起源于__A__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "下列IP地址中书写正确的是____。", "options": [{"label": "A", "text": "1681920"}, {"label": "B", "text": "325.255.231.0"}, {"label": "C", "text": "192.168.1"}, {"label": "D", "text": "255.255.255.0"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 下列IP地址中书写正确的是_D___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "以下软件中不属于浏览器的是____。", "options": [{"label": "A", "text": "InternetExplorer"}, {"label": "B", "text": "NetscapeNavigator"}, {"label": "C", "text": "Opera"}, {"label": "D", "text": "CuteFtp"}], "answer": "D"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 以下软件中不属于浏览器的是_D___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "构成计算机网络的要素主要有：通信主体、通信设备和通信协议，其中通信主体指的是____。", "options": [{"label": "A", "text": "交换机"}, {"label": "B", "text": "双绞线"}, {"label": "C", "text": "计算机"}, {"label": "D", "text": "网卡"}], "answer": "C"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 构成计算机网络的要素主要有：通信主体、通信设备和通信协议，其中通信主体指的是__C__。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "下列说法错误的____。", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 下列说法错误的_D___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "计算机网络的主要目标是____。", "options": [{"label": "A", "text": "分布处理"}, {"label": "B", "text": "将多台计算机连接起来"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题二: 计算机网络的主要目标是_D___。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "IP地址126.168.0.1属于哪一类IP地址", "answer": "D", "options": [{"label": "A", "text": "D类"}, {"label": "B", "text": "C类型"}, {"label": "C", "text": "B类"}, {"label": "D", "text": "A类"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: IP地址126.168.0.1属于哪一类IP地址（D ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "以下哪一个设置不是上互联网所必须的", "answer": "B", "options": [{"label": "A", "text": "IP地址"}, {"label": "B", "text": "工作组"}, {"label": "C", "text": "子网掩码"}, {"label": "D", "text": "网关"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 以下哪一个设置不是上互联网所必须的（B ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "以下关于网络的说法错误的是", "answer": "A", "options": [{"label": "A", "text": "将两台电脑用网线联在一起就是一个网络"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 以下关于网络的说法错误的是 （A ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "OSI模型和TCP/IP协议体系分别分成几层", "answer": "C", "options": [{"label": "A", "text": "7 和 7"}, {"label": "B", "text": "4和 7"}, {"label": "C", "text": "7 和 4"}, {"label": "D", "text": "4 和 4"}]}',
  'OSI参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: OSI模型和TCP/IP协议体系分别分成几层 （ C）
























INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "模拟信号的电平随时间连续变化，语音信号是典型的模拟信号。能传输模拟信号的信道称为模拟信道。强果利用模拟信道传送数字信号，必须经过数字与模拟信号之间的变换（A/D变换器），例如，调制解调过程。", "answer": "离散的数字信号在计算机中指由0、1二进制代码组成的数字序列。能传输离散的数字信号的信道称为数字信道。当利用数字信道传输数字信号是不需要进行变换。数字信道适宜于数字信号的传输，史需解决数字信道与计算机之间的接口问题。"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 模拟信号的电平随时间连续变化，语音信号是典型的模拟信号。能传输模拟信号的信道称为模拟信道。强果利用模拟信道传送数字信号，

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "Internet 协议IPv6 将从原来的32位地址扩展到了（ ）位", "answer": "B", "options": [{"label": "A", "text": "64"}, {"label": "B", "text": "128"}, {"label": "C", "text": "512"}, {"label": "D", "text": "256"}]}',
  'IPv4/IPv6协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: Internet 协议IPv6 将从原来的32位地址扩展到了（ ）位 （ B ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "在Internet上浏览时，浏览器和WWW服务器之间传输网页使用的协议是", "answer": "D", "options": [{"label": "A", "text": "IP"}, {"label": "B", "text": "Telnet"}, {"label": "C", "text": "FTP"}, {"label": "D", "text": "HTTP"}]}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 在Internet上浏览时，浏览器和WWW服务器之间传输网页使用的协议是（ D ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "我们将IP地址分为A、B、C三类，其中B类的IP地址第一字节取值范围是", "answer": "B", "options": [{"label": "A", "text": "127—191"}, {"label": "B", "text": "128—191"}, {"label": "C", "text": "129—191"}, {"label": "D", "text": "126—191"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 我们将IP地址分为A、B、C三类，其中B类的IP地址第一字节取值范围是 （ B ）


INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "ftp常用于数据上传，其中在进行数据上传时需进行身份验证，如果以匿名者方式登陆其输入用户名是", "answer": "A", "options": [{"label": "A", "text": "Anonymous"}, {"label": "B", "text": "Anonymouse"}, {"label": "C", "text": "GUEST"}, {"label": "D", "text": "以上都对"}]}',
  '文件传输协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: ftp常用于数据上传，其中在进行数据上传时需进行身份验证，如果以匿名者方式登陆其输入用户名是 （ A ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "IP地址共5类，常用的有（ ）类，其余留作其他用途", "answer": "C", "options": [{"label": "A", "text": "1"}, {"label": "B", "text": "2"}, {"label": "C", "text": "3"}, {"label": "D", "text": "4"}]}',
  '物理层传输介质', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: IP地址共5类，常用的有（ ）类，其余留作其他用途 （ C ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "文件传输协议是（ ）上的协议", "answer": "C", "options": [{"label": "A", "text": "网络层"}, {"label": "B", "text": "运输层"}, {"label": "C", "text": "应用层"}, {"label": "D", "text": "物理层"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 文件传输协议是（ ）上的协议 （ C ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "对于一个主机域名smt.scut.edu.cn来说，其中（ ）表示主机名", "answer": "D", "options": [{"label": "A", "text": "cn"}, {"label": "B", "text": "edu"}, {"label": "C", "text": "scut"}, {"label": "D", "text": "smt"}]}',
  'DNS协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 对于一个主机域名smt.scut.edu.cn来说，其中（ ）表示主机名 （ D ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "Internet 的前身是", "answer": "D", "options": [{"label": "A", "text": "Intranet"}, {"label": "B", "text": "Ethernet"}, {"label": "C", "text": "Cernet"}, {"label": "D", "text": "Arpanet"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: Internet 的前身是 （ D ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "在如下网络拓朴结构中，具有一定集中控制功能的网络是", "answer": "B", "options": [{"label": "A", "text": "总线型网络"}, {"label": "B", "text": "星型网络"}, {"label": "C", "text": "环形网络"}, {"label": "D", "text": "全连接型网络"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 在如下网络拓朴结构中，具有一定集中控制功能的网络是 （ B ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "下述协议中，不建立于IP协议之上的协议是", "answer": "A", "options": [{"label": "A", "text": "ARP"}, {"label": "B", "text": "ICMP"}, {"label": "C", "text": "SNMP"}, {"label": "D", "text": "TCP"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 下述协议中，不建立于IP协议之上的协议是 （ A ）


INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "在网络互联中，中继器一般工作在", "answer": "D", "options": [{"label": "A", "text": "链路层"}, {"label": "B", "text": "运输层"}, {"label": "C", "text": "网络层"}, {"label": "D", "text": "物理层"}]}',
  '物理层设备', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 在网络互联中，中继器一般工作在 （ D ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "下述协议中不属于应用层协议的是", "answer": "A", "options": [{"label": "A", "text": "ICMP"}, {"label": "B", "text": "SNMP"}, {"label": "C", "text": "TELNET"}, {"label": "D", "text": "FIP"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 下述协议中不属于应用层协议的是 （A ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "网桥及一般的二层交换机在进行数据包转发时，识别的数据包包头中的什么内容进行数据包的转发", "answer": "A", "options": [{"label": "A", "text": "MAC地址"}, {"label": "B", "text": "IP地址"}, {"label": "C", "text": "网络号Net ID"}, {"label": "D", "text": "主机号Host ID"}]}',
  '数据链路层设备', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 网桥及一般的二层交换机在进行数据包转发时，识别的数据包包头中的什么内容进行数据包的转发 （ A ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "在数据传输过程中路由是在（ ）实现的", "answer": "C", "options": [{"label": "A", "text": "运输层"}, {"label": "B", "text": "物理层"}, {"label": "C", "text": "网络层"}, {"label": "D", "text": "应用层"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 在数据传输过程中路由是在（ ）实现的 （ C ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "B类地址中，在默认子网掩码下用（ ）位来标识网络中的一台主机", "answer": "C", "options": [{"label": "A", "text": "8"}, {"label": "B", "text": "14"}, {"label": "C", "text": "16"}, {"label": "D", "text": "24"}]}',
  'IP地址分类', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: B类地址中，在默认子网掩码下用（ ）位来标识网络中的一台主机 （ C ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "负责电子邮件的应用层协议是", "answer": "C", "options": [{"label": "A", "text": "FTP"}, {"label": "B", "text": "PPP"}, {"label": "C", "text": "SMTP"}, {"label": "D", "text": "IP"}]}',
  '电子邮件协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 负责电子邮件的应用层协议是 （ C ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "下列哪一项不属于网络安全的内容", "answer": "D", "options": [{"label": "A", "text": "软件安全"}, {"label": "B", "text": "保密性"}, {"label": "C", "text": "可用性"}, {"label": "D", "text": "可靠性"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 下列哪一项不属于网络安全的内容 （ D）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "在顶级域名中，表示教育机构的是", "answer": "D", "options": [{"label": "A", "text": "com"}, {"label": "B", "text": "org"}, {"label": "C", "text": "int"}, {"label": "D", "text": "edu"}]}',
  'DNS协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 在顶级域名中，表示教育机构的是 （ D ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "在IP地址方案中，210.42.194.22表示一个（ ）地址", "answer": "C", "options": [{"label": "A", "text": "A类"}, {"label": "B", "text": "B类"}, {"label": "C", "text": "C类"}, {"label": "D", "text": "D类"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 在IP地址方案中，210.42.194.22表示一个（ ）地址 （ C ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "在顶级域名中，表示商业机构的是", "answer": "A", "options": [{"label": "A", "text": "com"}, {"label": "B", "text": "org"}, {"label": "C", "text": "net"}, {"label": "D", "text": "edu"}]}',
  'DNS协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 在顶级域名中，表示商业机构的是 （ A ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "两台计算机利用电话线路传输数据信号时，必备的设备是", "answer": "B", "options": [{"label": "A", "text": "网卡"}, {"label": "B", "text": "调制解调器"}, {"label": "C", "text": "中继器"}, {"label": "D", "text": "随机错"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 两台计算机利用电话线路传输数据信号时，必备的设备是 （ B）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "网桥是用于（ ）的互连设备", "answer": "D", "options": [{"label": "A", "text": "物理层"}, {"label": "B", "text": "网络层"}, {"label": "C", "text": "应用层"}, {"label": "D", "text": "数据链路层"}]}',
  '数据链路层设备', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 网桥是用于（ ）的互连设备 （ D ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "物理层的主要功能是实现（ ）的正确的传输", "answer": "A", "options": [{"label": "A", "text": "位流"}, {"label": "B", "text": "帧"}, {"label": "C", "text": "分组"}, {"label": "D", "text": "报文"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 物理层的主要功能是实现（ ）的正确的传输 （ A）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "Ethernet局域网采用的媒体访问控制方式为", "answer": "B", "options": [{"label": "A", "text": "CSMA"}, {"label": "B", "text": "CSMA/CD"}, {"label": "C", "text": "CDMA"}, {"label": "D", "text": "CSMA/CA"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: Ethernet局域网采用的媒体访问控制方式为 （ B ）


INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "（ ）是一种环形结构的局域网技术", "answer": "B", "options": [{"label": "A", "text": "Ethernet"}, {"label": "B", "text": "FDDI"}, {"label": "C", "text": "ATM"}, {"label": "D", "text": "DQDB"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: （ ）是一种环形结构的局域网技术 （ B ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "如果IP地址为202.130.191.33，子网掩码为255.255.255.0，那么网络地址是", "answer": "D", "options": [{"label": "A", "text": "202.130.0.0"}, {"label": "B", "text": "202.0.0.0"}, {"label": "C", "text": "202.130.191.33"}, {"label": "D", "text": "202.130.191.0"}]}',
  '子网划分与路由算法', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 如果IP地址为202.130.191.33，子网掩码为255.255.255.0，那么网络地址是 （ D ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "在OSI参考模型的层次中，数据链路层的数据传送单位是", "answer": "B", "options": [{"label": "A", "text": "位"}, {"label": "B", "text": "帧"}, {"label": "C", "text": "分组"}, {"label": "D", "text": "报文"}]}',
  'OSI参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 在OSI参考模型的层次中，数据链路层的数据传送单位是 （ B ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "交换机一般工作在", "answer": "B", "options": [{"label": "A", "text": "物理层"}, {"label": "B", "text": "数据链路层"}, {"label": "C", "text": "网络层"}, {"label": "D", "text": "高层"}]}',
  '数据链路层设备', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 交换机一般工作在 （ B ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "ISDN的基本速率为", "answer": "A", "options": [{"label": "A", "text": "64kbps"}, {"label": "B", "text": "128kbps"}, {"label": "C", "text": "144kbps"}, {"label": "D", "text": "384kbps"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: ISDN的基本速率为 （ A ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "用五类双绞线实现的100M以太网中，单根网线的最大长度为", "answer": "C", "options": [{"label": "A", "text": "200M"}, {"label": "B", "text": "185M"}, {"label": "C", "text": "100M"}, {"label": "D", "text": "500M"}]}',
  '物理层传输介质', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 用五类双绞线实现的100M以太网中，单根网线的最大长度为 （ C ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "星形、总线型、环形和网状形是按照（ ）分类", "answer": "D", "options": [{"label": "A", "text": "网络功能"}, {"label": "B", "text": "管理性质"}, {"label": "C", "text": "网络跨度"}, {"label": "D", "text": "网络拓扑"}]}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 星形、总线型、环形和网状形是按照（ ）分类 （ D ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "100Base-T使用（ ）传输介质", "answer": "B", "options": [{"label": "A", "text": "同轴电缆线路"}, {"label": "B", "text": "双绞线"}, {"label": "C", "text": "光纤"}, {"label": "D", "text": "红外线"}]}',
  '以太网标准', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 100Base-T使用（ ）传输介质 （ B ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "ATM传输数据的单位是信元，每个信元净荷是（ ）个字节", "answer": "B", "options": [{"label": "A", "text": "5"}, {"label": "B", "text": "48"}, {"label": "C", "text": "53"}, {"label": "D", "text": "64"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: ATM传输数据的单位是信元，每个信元净荷是（ ）个字节 （B ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "通过执行传输层及以上各层协议转换，或者实现不同体系结构的网络协议转换的互连部件称为", "answer": "D", "options": [{"label": "A", "text": "集线器"}, {"label": "B", "text": "路由器"}, {"label": "C", "text": "交换器"}, {"label": "D", "text": "网关"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 通过执行传输层及以上各层协议转换，或者实现不同体系结构的网络协议转换的互连部件称为 （ D ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "在给主机分配IP地址时，下面哪一个是错误的", "answer": "D", "options": [{"label": "A", "text": "129.9.255.18"}, {"label": "B", "text": "125.21.19.109"}, {"label": "C", "text": "195.5.91.254"}, {"label": "D", "text": "220.258.2.56"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 在给主机分配IP地址时，下面哪一个是错误的 （ D ）


INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "你是一名公司的网络管理员，现在你的公司需要在某一分支办公室内铺设一个小型以太局域网，总共有4台PC机需要通过一台集线器连接起来。采用线缆类型为5类双绞线。则理论上任一两台PC机的最大间隔距离是", "answer": "C", "options": [{"label": "A", "text": "400米"}, {"label": "B", "text": "100米"}, {"label": "C", "text": "200米"}, {"label": "D", "text": "500米"}]}',
  '物理层传输介质', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 你是一名公司的网络管理员，现在你的公司需要在某一分支办公室内铺设一个小型以太局域网，总共有4台PC机需要通过一台集线器连



INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "加密算法包括", "answer": "A", "options": [{"label": "A", "text": "公钥和私钥"}, {"label": "B", "text": "黑白密钥"}, {"label": "C", "text": "数字签名"}, {"label": "D", "text": "通用的和专用的密钥"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 加密算法包括 （ A ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "下列不属于局域网层次的是", "answer": "C", "options": [{"label": "A", "text": "物理层"}, {"label": "B", "text": "数据链路层"}, {"label": "C", "text": "传输层"}, {"label": "D", "text": "网络层"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 下列不属于局域网层次的是 （ C ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "目录服务的目标是", "answer": "B", "options": [{"label": "A", "text": "一个用户一个账号"}, {"label": "B", "text": "用户可以访问不同的域"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 目录服务的目标是 （ B ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "检查网络联通性的命令是", "answer": "D", "options": [{"label": "A", "text": "ipconfig"}, {"label": "B", "text": "route"}, {"label": "C", "text": "telnet"}, {"label": "D", "text": "ping"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 检查网络联通性的命令是 （ D ）


INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "可以在文件系统级实现文件安全性管理的文件系统是", "answer": "C", "options": [{"label": "A", "text": "FAT"}, {"label": "B", "text": "FAT32"}, {"label": "C", "text": "NTFS"}]}',
  '操作系统', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 可以在文件系统级实现文件安全性管理的文件系统是 （C ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "在Windows 2000中，使用什么工具可以创建本地用户帐户", "answer": "C", "options": [{"label": "A", "text": "计算机管理"}, {"label": "B", "text": "Active Directory用户和计算机"}, {"label": "C", "text": "本地用户管理器"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 在Windows 2000中，使用什么工具可以创建本地用户帐户 （ C ）


INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "您有一个Windows2000Server，它是一个成员服务器。您的域正在不断变大，您需要添加另外一台域控制器。下面哪些程序可以把成员服务器升级为域控制器？", "answer": "B", "options": [{"label": "A", "text": "PROMOTE.EXE"}, {"label": "B", "text": "DCPROMO.EXE"}]}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 您有一个Windows2000Server，它是一个成员服务器。您的域正在不断变大，您需要添加另外一台域控制器。下面哪些

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "在安装DNS服务前，必须在windows2000 sever计算机上安装和设置下列哪一项", "answer": "A", "options": [{"label": "A", "text": "IIS"}, {"label": "B", "text": "WINS"}, {"label": "C", "text": "DHCP"}, {"label": "D", "text": "TCP/IP"}]}',
  'DNS协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 在安装DNS服务前，必须在windows2000 sever计算机上安装和设置下列哪一项 （ A ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "测试DNS主要使用以下哪个命令", "answer": "C", "options": [{"label": "A", "text": "Ping"}, {"label": "B", "text": "IPcofig"}, {"label": "C", "text": "nslookup"}, {"label": "D", "text": "Winipcfg"}]}',
  'DNS协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 测试DNS主要使用以下哪个命令 （ C）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "局域网中为登录域的计算机分配动态 IP 地址的服务器为", "answer": "B", "options": [{"label": "A", "text": "DNS服务器"}, {"label": "B", "text": "DHCP服务器"}, {"label": "C", "text": "WWW服务器"}, {"label": "D", "text": "WINS服务器"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 局域网中为登录域的计算机分配动态 IP 地址的服务器为 （ B ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "判断下面哪一句话是正确的", "answer": "B", "options": [{"label": "A", "text": "Internet中的一台主机只能有一个IP地址"}, {"label": "B", "text": "一个合法的IP地址在一个时刻只能分配给一台主机"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 判断下面哪一句话是正确的 （ B）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "在网络中提供域名与IP地址解析服务的服务器是", "answer": "C", "options": [{"label": "A", "text": "WWW服务器"}, {"label": "B", "text": "FTP服务器"}, {"label": "C", "text": "DNS服务器"}, {"label": "D", "text": "DHCP服务器"}]}',
  'ARP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 在网络中提供域名与IP地址解析服务的服务器是 （ C ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "Windows 2000 Server为管理员提供的名称是", "answer": "C", "options": [{"label": "A", "text": "Gues"}, {"label": "B", "text": "TsInternetUser"}, {"label": "C", "text": "Administrator"}, {"label": "D", "text": "Domain Admins"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: Windows 2000 Server为管理员提供的名称是 （ C ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "通过哪种方法安装活动目录", "answer": "A", "options": [{"label": "A", "text": "管理工具/配置服务器"}, {"label": "B", "text": "管理工具/计算机管理"}]}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 通过哪种方法安装活动目录 （ A ）


INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "应用层DNS协议主要用于实现哪种网络服务功能", "answer": "A", "options": [{"label": "A", "text": "网络设备名字到IP地址的映射"}, {"label": "B", "text": "网络硬件地址到IP地址的映射"}]}',
  'DNS协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 应用层DNS协议主要用于实现哪种网络服务功能 （ A ）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "简述为什么要对计算机网络进行分层，以及分层的一般原则。", "answer": "a．因为计算机网络是一个复杂的系统，采用层次化结构的方法来描述它，可以将复杂的网络间题分解为许多比较小的、界线比较清晰简单的部分来处理。"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 简述为什么要对计算机网络进行分层，以及分层的一般原则。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "ISO的OSI参考模型为几层？请由低到高顺序写出所有层次。", "answer": "分为以下7层：物理层、数据链路层、网络层、传输层、会话层、表示层、应用层"}',
  'OSI参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: ISO的OSI参考模型为几层？请由低到高顺序写出所有层次。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "在TCP/IP网络体系模型中，因特网定义了五个层次。写出这五层的名称，以及各层的主要功能。并分别说明1～5层信息格式的名称。", "answer": "一共分为四层，分别是主机至网络层（网络接口层）、网络层、运输层、应用层。"}',
  'TCP/IP参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 在TCP/IP网络体系模型中，因特网定义了五个层次。写出这五层的名称，以及各层的主要功能。并分别说明1～5层信息格式的名

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "简述星形网络的结构及其优缺点。", "answer": "用每条线路将各个节点和中心节点相连的结构，任何两节点的通信都要通过中心节点。"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 简述星形网络的结构及其优缺点。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "数字数据在模拟信道传输时，为什么要进行调制？", "answer": "为了将数字数据变换成与模拟信道特性相匹配的模拟信号进行传输，需要进行调制。"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 数字数据在模拟信道传输时，为什么要进行调制？

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "物理层的功能是什么？物理层的接口规定了哪些特性？", "answer": "功能：实现物理上互连系统间的信息传输，涉及通信在信道上传输的原始比特流。"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 物理层的功能是什么？物理层的接口规定了哪些特性？

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "说明中继器、网桥、路由器和网关的主要功能，以及分别工作在网络体系结构的哪一层？", "answer": "a．网桥是一种将两个局域网连接起来并按MAC（介质访问控制）地址转发帧的设备，工作在链路层。"}',
  '物理层设备', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 说明中继器、网桥、路由器和网关的主要功能，以及分别工作在网络体系结构的哪一层？

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "举出网络高层应用中最基本的几种应用，并准确说明这些应用所涉及协议的中文名称与英文缩写。", "answer": "电子邮件——简单邮件传输协议SMTP，个人邮局协议POP"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 举出网络高层应用中最基本的几种应用，并准确说明这些应用所涉及协议的中文名称与英文缩写。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "简述以太网中，CSMA/CD的工作方式、工作特点以及优缺点。", "answer": "工作方式：当一台正在发送的计算机检测到冲突时立即停止传输。这样监测电缆就是所谓的冲突检测CD，这种以太网机制就是所谓的带冲突检测的载波侦听多路访问CSMA/CD。CSMA/CD不仅只检测冲突，也能从冲突中恢复。在一个冲突发生后，计算机必须等待电缆再次空闲后才能传输帧。为了防止多次冲突，以太网要求每台计算机在冲突后延迟一段时间才尝试传输。"}',
  'CSMA/CD协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 简述以太网中，CSMA/CD的工作方式、工作特点以及优缺点。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "简述对等网模式、客户机/服务器模式、浏览器/服务器模式的特点。", "answer": "在对等网中没有专用的服务器、每台计算机地位平等、每台计算机既可充当服务器又可充当客户机的网络工作模式。"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 简述对等网模式、客户机/服务器模式、浏览器/服务器模式的特点。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "简述虚拟局域网与普通局域网的差异。", "answer": "虚拟局域网与普通局域网的差异主要表现在以下几个方面："}',
  'VLAN技术', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 简述虚拟局域网与普通局域网的差异。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "简述广域网的定义和组成。", "answer": "广域网（WAN），有时也称远程网，是覆盖地理范围相对较广的数据通信网络。广域网一般由主机和通信子网组成。"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 简述广域网的定义和组成。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "子网掩码的用途是什么？", "answer": "在网络的配置中，必须建立一个由主机和路由器使用的子网掩码（Subnet mask）。本质上，子网掩码是一个32位的模板，与IP地址进行一个逻辑与（AND）运算就可以迅速得到一个路由决定。对应于网络号部分，掩码中的值为1，而对应于主机号部分，掩码中的值为0"}',
  '子网划分与路由算法', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 子网掩码的用途是什么？

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "邮件服务器使用的基本协议有哪几个?", "answer": "与邮件服务器产品有关的网络服务协议主要有以下3个："}',
  '电子邮件协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 邮件服务器使用的基本协议有哪几个?

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "简述代理服务器技术的优点。", "answer": "(1) 通过一个IP地址或一个因特网帐户供给多个用户同时访问"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 简述代理服务器技术的优点。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "用户账户与计算机账户的区别。", "answer": "计算机帐户是一台计算机加入到域中的先决条件，一台计算机加入到域只能使用一个计算机帐户，而一个用户可拥有多个用户帐户，且可在不同的计算机上使用自己的用户帐户进行网络登录。"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 用户账户与计算机账户的区别。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "组和组织单位的区别。", "answer": "组主要用于权限设置，而组织单位则主要用于网络构建，组织单位只表示单个域中的对象集合，而组可以包含用户、计算机、本地服务器上的共享资源，以及单个域、域目录树或目录林。"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 组和组织单位的区别。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "什么叫上传、下载？", "answer": "将文件从自己的计算机上发送到另一台计算机上，称为文件的上传；用户从服务器上把文件或资源传送到客户机上，称为FTP的下载。"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 什么叫上传、下载？

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "简述DNS服务器的工作过程？", "answer": "用户要想通过使用InternetExplorer来访问万维网服务器，则用户必须首先获得与万维网服务器的正式域名相关的IP地址，依靠DNS及WINS将主机名称转换为IP地址，这个过程被称为主机名称解析（NameResolution）。一旦用户的计算机将WWW服务器的正式名称解析为它的IP地址，它就可以与WWW服务器建立起TCP/IP网络通信。"}',
  'DNS协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 简述DNS服务器的工作过程？

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "为了安装DHCP服务，必须在运行 Windows 2000 Server 的计算机上配置哪些内容？", "answer": "在你安装DHCP服务前，你必须为计算机指定一个静态IP地址和子网掩码。如果DHCP服务器将为多个子网的客户端分配IP地址，你还必须为网络适配器指定一个默认网关。"}',
  '应用层协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 为了安装DHCP服务，必须在运行 Windows 2000 Server 的计算机上配置哪些内容？

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "将十进制IP地址61.149.143.20转换成二进制形式，并用十六进制数表示，并说明是哪一类IP地址，该类地址最大网络和每个网络中的最大主机数。", "answer": "（1）00111101.10010101.10001111.00010100 3D958F14"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 将十进制IP地址61.149.143.20转换成二进制形式，并用十六进制数表示，并说明是哪一类IP地址，该类地址最大网络

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "在活动目录中如何创建共享文件夹？", "answer": "⑴打开Active?Directory用户和计算机窗口。⑵在控制台树中，双击域节点。⑶鼠标右击想在其中添加共享文件夹的文件夹，在弹出的快捷菜单中新建，并单击共享文件夹。⑷键入文件夹的名称、网络路径。⑸单击确定按钮完成操作"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 在活动目录中如何创建共享文件夹？

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "如何安装和设置网络协议、客户、服务。", "answer": "右击网上邻居图标，从弹出的快捷菜单中选择属性命令，打开网络和拨号连接窗口，右击本地连接图标，选择属性命令，打开本地连接属性对话框，点击安装按钮，打开选择网络组件类型对话框，选择协议（或客户或服务），单击添加按钮。"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 如何安装和设置网络协议、客户、服务。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "如何建立并使用一台网络打印机。", "answer": "提供网络打印机的计算机应将该打印机设置为共享，远程端若想使用该打印机应将该共享打印机添加到本地计算机当中。"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 如何建立并使用一台网络打印机。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "如何配置IP地址？", "answer": "鼠标右击网上邻居，选择属性/网络和拨号连接/本地连接/属性/此连接使用下列选定的组件/Internet协议（TCP/IP）/属性。"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 如何配置IP地址？

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "如何安装DHCP服务器?", "answer": "选择开始/设置/控制面板/添加或删除程序，选择添加/删除Windows组件，然后选择网络服务/详细信息，出现设置网络服务对话框时，在此选择动态主机配置协议（DHCP）复选框，单击确定按钮"}',
  '应用层协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 如何安装DHCP服务器?

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "如何建立一个Web服务器？", "answer": "（1）在服务器上安装了IIS。"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 如何建立一个Web服务器？

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "局域网组网常用网络设备", "answer": "中继器：中继器是一个能持续检测电缆中模拟信号的硬设备，工作于网络的物理层，当它检测到一根电缆中有信号来时，中继器便转发一个放大的信号到另一根电缆。现在已经被集线器代替"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题三: 局域网组网常用网络设备

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "计算机网络按地理范围可分为 局域 网和 广域 网，其中 局域 网主要用来构造一个单位的内部网。", "answer": "局域 网和 广域 网"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题五: 计算机网络按地理范围可分为 局域 网和 广域 网，其中 局域 网主要用来构造一个单位的内部网。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "常见的网络拓扑结构为 星型 、环型 和 总线型 。", "answer": "星型 、环型 和 总线型"}',
  '网络拓扑结构', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题五: 常见的网络拓扑结构为 星型 、环型 和 总线型 。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "介质访问控制技术是局域网的最重要的基本技术。", "options": [{"label": "A", "text": "正确"}, {"label": "B", "text": "错误"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题五: 介质访问控制技术是局域网的最重要的基本技术。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "在数字通信中发送端和接收端必需以某种方式保持同步。", "options": [{"label": "A", "text": "正确"}, {"label": "B", "text": "错误"}], "answer": "A"}',
  '操作系统', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题五: 在数字通信中发送端和接收端必需以某种方式保持同步。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "CRC码主要用于数据链路层控制协议中。", "options": [{"label": "A", "text": "正确"}, {"label": "B", "text": "错误"}], "answer": "A"}',
  '差错控制技术', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题五: CRC码主要用于数据链路层控制协议中。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "LAN和WAN的主要区别是通信距离和传输速率。", "options": [{"label": "A", "text": "正确"}, {"label": "B", "text": "错误"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题五: LAN和WAN的主要区别是通信距离和传输速率。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "度量传输速度的单位是波特，有时也可称作调制率。", "options": [{"label": "A", "text": "正确"}, {"label": "B", "text": "错误"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题五: 度量传输速度的单位是波特，有时也可称作调制率。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "白噪声在任意传输速率上强度相等。", "options": [{"label": "A", "text": "正确"}, {"label": "B", "text": "错误"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题五: 白噪声在任意传输速率上强度相等。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "差错控制是一种主动的防范措施。", "options": [{"label": "A", "text": "正确"}, {"label": "B", "text": "错误"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题五: 差错控制是一种主动的防范措施。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "双绞线不仅可以传输数字信号，而且也可以传输模拟信号。", "options": [{"label": "A", "text": "正确"}, {"label": "B", "text": "错误"}], "answer": "A"}',
  '物理层传输介质', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题五: 双绞线不仅可以传输数字信号，而且也可以传输模拟信号。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "TCP/IP是一个工业标准而非国际标准。", "options": [{"label": "A", "text": "正确"}, {"label": "B", "text": "错误"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题五: TCP/IP是一个工业标准而非国际标准。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "TCP/IP不符合国际标准化组织OSI的标准。", "options": [{"label": "A", "text": "正确"}, {"label": "B", "text": "错误"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题五: TCP/IP不符合国际标准化组织OSI的标准。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "半双工与全双工都有两个传输通道。", "options": [{"label": "A", "text": "正确"}, {"label": "B", "text": "错误"}], "answer": "A"}',
  '通信方式', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题五: 半双工与全双工都有两个传输通道。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "模拟数据是指在某个区间产生的连续的值。", "options": [{"label": "A", "text": "正确"}, {"label": "B", "text": "错误"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题五: 模拟数据是指在某个区间产生的连续的值。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "报文交换的线路利用率高于线路交换。", "options": [{"label": "A", "text": "正确"}, {"label": "B", "text": "错误"}], "answer": "A"}',
  '数据交换技术', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题五: 报文交换的线路利用率高于线路交换。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "线路交换在数据传送之前必须建立一条完全的通路。", "options": [{"label": "A", "text": "正确"}, {"label": "B", "text": "错误"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题五: 线路交换在数据传送之前必须建立一条完全的通路。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "网络协议的关键要素是什么？（3分）", "answer": "网络协议的关键要素分别是 语法、 语义 和 定时。"}',
  '网络协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题五: 网络协议的关键要素是什么？（3分）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "OSI共有几层？分别是什么？（7分）", "answer": "OSI共有_7_层，它们分别是：物理层、数据链路层、"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题五: OSI共有几层？分别是什么？（7分）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "快速以太网的介质访问控制方法是。", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "A"}',
  'CSMA/CD协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: 快速以太网的介质访问控制方法是。


INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "在OSI的七层参考模型中，工作在第二层上的网间连接设备是", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "C"}',
  'OSI参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: 在OSI的七层参考模型中，工作在第二层上的网间连接设备是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "100BASE-T4的最大网段长度是：", "options": [{"label": "A", "text": "25米"}, {"label": "B", "text": "100米"}], "answer": "B"}',
  '以太网标准', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: 100BASE-T4的最大网段长度是：

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "ARP协议实现的功能是：", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "C"}',
  'ARP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: ARP协议实现的功能是：

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "学校内的一个计算机网络系统，属于", "options": [{"label": "A", "text": "PAN"}, {"label": "B", "text": "LAN"}], "answer": "B"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: 学校内的一个计算机网络系统，属于

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "下列那项是局域网的特征", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: 下列那项是局域网的特征

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "ATM采用信元作为数据传输的基本单位，它的长度为。", "options": [{"label": "A", "text": "43字节"}, {"label": "B", "text": "5字节"}], "answer": "D"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: ATM采用信元作为数据传输的基本单位，它的长度为。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "在常用的传输介质中，带宽最小、信号传输衰减最大、抗干扰能力最弱的一类传输介质是", "options": [{"label": "A", "text": "双绞线"}, {"label": "B", "text": "光纤"}], "answer": "C"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: 在常用的传输介质中，带宽最小、信号传输衰减最大、抗干扰能力最弱的一类传输介质是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "在OSI/RM参考模型中，处于模型的最底层。", "options": [{"label": "A", "text": "物理层"}, {"label": "B", "text": "网络层"}], "answer": "A"}',
  'OSI参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: 在OSI/RM参考模型中，处于模型的最底层。


INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "在OSI的七层参考模型中，工作在第三层上的网间连接设备是", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "B"}',
  'OSI参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: 在OSI的七层参考模型中，工作在第三层上的网间连接设备是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "下面说法错误的是", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "C"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: 下面说法错误的是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "交换式局域网的核心设备是", "options": [{"label": "A", "text": "中继器"}, {"label": "B", "text": "局域网交换机"}], "answer": "B"}',
  '数据链路层设备', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: 交换式局域网的核心设备是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "异步传输模式（ATM）实际上是两种交换技术的结合，这两种交换技术是", "options": [{"label": "A", "text": "电路交换与分组交换"}, {"label": "B", "text": "分组交换与帧交换"}], "answer": "A"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: 异步传输模式（ATM）实际上是两种交换技术的结合，这两种交换技术是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "IPv4地址由位二进制数值组成。", "options": [{"label": "A", "text": "16位"}, {"label": "B", "text": "8位"}], "answer": "C"}',
  'IPv4/IPv6协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: IPv4地址由位二进制数值组成。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "决定局域网特性的主要技术一般认为有三个 , 它们是 。", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "C"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: 决定局域网特性的主要技术一般认为有三个 , 它们是 。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "对令牌环网，下列说法正确的是", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "B"}',
  '令牌环网', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: 对令牌环网，下列说法正确的是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "网桥是在上实现不同网络的互连设备。", "options": [{"label": "A", "text": "数据链路层"}, {"label": "B", "text": "网络层"}], "answer": "A"}',
  '数据链路层设备', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: 网桥是在上实现不同网络的互连设备。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "NOVELL NETWARE 是操作系统。", "options": [{"label": "A", "text": "网络"}, {"label": "B", "text": "通用"}, {"label": "C", "text": "实时"}, {"label": "D", "text": "分时"}], "answer": "A"}',
  '操作系统', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: NOVELL NETWARE 是操作系统。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'EASY',
  '{"stem": "关于WWW服务，以下哪种说法是错误的？", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "C"}',
  'HTTP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题六: 关于WWW服务，以下哪种说法是错误的？

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "VLAN（虚拟局域网）是一种将局域网从_逻辑上划分网段，而不是从_物理上划分网段，从而实现虚拟工作组的新兴数据交换技术。", "answer": "虚拟局域网"}',
  'VLAN技术', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题七: VLAN（虚拟局域网）是一种将局域网从_逻辑上划分网段，而不是从_物理上划分网段，从而实现虚拟工作组的新兴数据交换技术。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SHORT', 'HARD',
  '{"stem": "1系统漏洞2黑客攻击3病毒入侵4网络配置管理不当（6分）", "answer": "37\\\\. 、由子网掩码可以判断出主机地址部分被划分出2个二进制作为子网地址位，所以可以划分出22-2=2个子网。（5分）"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题七: 1系统漏洞2黑客攻击3病毒入侵4网络配置管理不当（6分）

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "计算机网络按作用范围可分为 广域网 、局域网、城域网。", "answer": "广域网 、局域网、城域网"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: 计算机网络按作用范围可分为 广域网 、局域网、城域网。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "数据交换有 电路交换 、 报文交换 、 分组交换 三种主要交换技术。", "answer": "电路交换 、 报文交换 、 分组交换 三种主要交换技术"}',
  '数据交换技术', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: 数据交换有 电路交换 、 报文交换 、 分组交换 三种主要交换技术。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "计算机网络最主要的两个性能指标是 带宽 和时延 。", "answer": "带宽 和时延"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: 计算机网络最主要的两个性能指标是 带宽 和时延 。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "网络协议的三要素是 语法 、 语义 、 同步 。", "answer": "语法 、 语义 、 同步"}',
  '网络协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: 网络协议的三要素是 语法 、 语义 、 同步 。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "数据传输系统分为 模拟传输 系统和 数字传输 系统两种。", "answer": "模拟传输 系统和 数字传输 系统两种"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: 数据传输系统分为 模拟传输 系统和 数字传输 系统两种。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "现在的数字传输系统都采用脉码调制PCM体制，它有两个互不兼容的国际标准，分别是 北美的24路PCM 和 欧洲的30路PCM 。", "answer": "北美的24路PCM 和 欧洲的30路PCM"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: 现在的数字传输系统都采用脉码调制PCM体制，它有两个互不兼容的国际标准，分别是 北美的24路PCM 和 欧洲的30路PC

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "信息传输速率的单位是 比特/秒 ，码元传输速率的单位是 波特 。", "answer": "比特/秒；波特"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: 信息传输速率的单位是 比特/秒 ，码元传输速率的单位是 波特 。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "数据通信可分为 同步通信和异步通信两大类。", "answer": "同步通信和异步通信两大类"}',
  '操作系统', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: 数据通信可分为 同步通信和异步通信两大类。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "CIDR将 网络前缀 都相同的连续的IP地址组成“CIDR”地址块，路由表就利用CIDR地址块来查找目的网络，这种地址的聚合常称为 路由聚合 ，也称为构成超网。", "answer": "路由聚合"}',
  '子网划分与路由算法', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: CIDR将 网络前缀 都相同的连续的IP地址组成“CIDR”地址块，路由表就利用CIDR地址块来查找目的网络，这种地址的

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "运输层为 应用进程 之间提供逻辑通信，网络层为 主机 之间提供逻辑通信。", "answer": "应用进程 之间提供逻辑通信；主机 之间提供逻辑通信"}',
  'TCP/UDP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: 运输层为 应用进程 之间提供逻辑通信，网络层为 主机 之间提供逻辑通信。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "以太网端到端的往返时延2t称为 争用期 ，又称为碰撞窗口。以太网取 51.2u争用期的长度，并规定凡长度小于 64 字节的帧都是无效帧。", "answer": "争用期"}',
  'CSMA/CD协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: 以太网端到端的往返时延2t称为 争用期 ，又称为碰撞窗口。以太网取 51.2u争用期的长度，并规定凡长度小于 64 字节

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "TCP在进行流量控制和拥塞控制时，发送端的发送窗口上限值应取“接收方窗口”和“拥塞窗口”中较小的一个，前者是来自 接收 方的流量控制，后者是来自 发送方的流量控制。为更好地在运输层进行拥塞控制，因特网标准定义了4种算法，即 快启动 、 快重传 、 拥塞避免 、 快恢复 。", "answer": "快启动 、 快重传 、 拥塞避免 、 快恢复"}',
  'TCP拥塞控制', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: TCP在进行流量控制和拥塞控制时，发送端的发送窗口上限值应取“接收方窗口”和“拥塞窗口”中较小的一个，前者是来自 接收 

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "时分多路复用技术可分为 同步时分复用 和异步时分复用 。 P57 23、计算机网络原理体系结构共分为五层，它们是 应用层 、 运输层 、 网络层 、 数据链路层 和 物理层。", "answer": "同步时分复用 和异步时分复用；应用层 、 运输层 、 网络层 、 数据链路层 和 物理层"}',
  '信道复用技术', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: 时分多路复用技术可分为 同步时分复用 和异步时分复用 。 P57 23、计算机网络原理体系结构共分为五层，它们是 应用层

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "为进行网络中的数据交换而建立的规则、标准或约定称为 协议 。 26、TCP/IP 模型分为四层，它们是 应用层 、 运输层 、 网际层 、 网络接口层 。", "answer": "协议；应用层 、 运输层 、 网际层 、 网络接口层"}',
  'TCP/IP参考模型', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: 为进行网络中的数据交换而建立的规则、标准或约定称为 协议 。 26、TCP/IP 模型分为四层，它们是 应用层 、 运输

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "PING 命令使用了 ICMP 的 Echo 请求和 Echo 回答报文。 31、TCP/IP 运输层有两个不同的协议，即 用户数据报协议UDP 和 传输控制协议TCP 。", "answer": "用户数据报协议UDP 和 传输控制协议TCP"}',
  'ICMP协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: PING 命令使用了 ICMP 的 Echo 请求和 Echo 回答报文。 31、TCP/IP 运输层有两个不同的协议，

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "为了便于进行路由选择， I nternet 将整个网络划分为许多较小的单位，即 AS 。由此，路由选择协议也分为两大类，即 内部网关协议IGP 和 外部网关协议EGP 。", "answer": "AS；内部网关协议IGP 和 外部网关协议EGP"}',
  '路由算法与协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: 为了便于进行路由选择， I nternet 将整个网络划分为许多较小的单位，即 AS 。由此，路由选择协议也分为两大类，

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "通常路由选择算法分为两大类，即 静态 和 动态 。", "answer": "静态 和 动态"}',
  '路由算法与协议', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: 通常路由选择算法分为两大类，即 静态 和 动态 。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "信道复用有 时分复用、频分复用、 码分复用、波分复用等方式。 44、ATM以传输 53 字节固定长的 信元 而不是可变长的数据帧来传输信息。", "answer": "时分复用、频分复用、 码分复用、波分复用等方式"}',
  '信道复用技术', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: 信道复用有 时分复用、频分复用、 码分复用、波分复用等方式。 44、ATM以传输 53 字节固定长的 信元 而不是可变长

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "计算机内传输的信号是 数字信号 ，而公用电话传输系统传输的信号是 模拟信号。", "answer": "数字信号；模拟信号"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: 计算机内传输的信号是 数字信号 ，而公用电话传输系统传输的信号是 模拟信号。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "将数字信号调制为模拟信号有三种方式，即 调频 、 调幅 、 调相 。", "answer": "调频 、 调幅 、 调相"}',
  '计算机网络基础', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: 将数字信号调制为模拟信号有三种方式，即 调频 、 调幅 、 调相 。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "PCM编码过程为 采样 、 量化 和 编码 。", "answer": "采样 、 量化 和 编码"}',
  '数据编码技术', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: PCM编码过程为 采样 、 量化 和 编码 。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'FILL', 'MEDIUM',
  '{"stem": "在局域网中，硬件地址又称为 物理地址 或 MAC地址 。", "answer": "物理地址 或 MAC地址"}',
  'MAC地址与物理地址', 0, 'APPROVED', NOW()
); -- 计算机网络基础试题九: 在局域网中，硬件地址又称为 物理地址 或 MAC地址 。

























INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第1题）下列对顺序存储的有序表(长度为n) 实现给定操作的算法中，平均时间复杂度为0(1)的是()。", "options": [{"label": "A", "text": "查找包含指定值元素的算法"}, {"label": "B", "text": "插入包含指定值元素的算法"}, {"label": "C", "text": "删除第i(1≤i≤n) 个元素的算法"}, {"label": "D", "text": "获取第i(1≤i≤n) 个元素的算法 ,prev是指向直接前驱结点的指针，"}], "answer": "D"}',
  '计算机网络', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第1题）下列对顺序存储的有序表(长度为n) 实现给定操作的算法中，平均时间复杂度为0(1)的是()

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第2题）现有非空双向链表L,其结点结构为： --- data next是指向后继结点的指针。若要在L中指针p所指向的节点(非尾结点)之后插入指针s指 向的新结点，则在执行了语句序列“s->next=p->next;p->next=s” 后，下列语句序列中还需 要执行的是()。", "options": [{"label": "A", "text": "s->next ->prev=p;s->prev=p"}, {"label": "B", "text": "p->next ->prev=s;s->prev=p"}, {"label": "C", "text": "s->prev=s->next->prev;s->next->prev=s"}, {"label": "D", "text": "p->next->prev=s->prev;s->next->prev=p"}], "answer": "C"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第2题）现有非空双向链表L,其结点结构为： | | | | | --- | --- | --- |

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第3题）若采用三元组表存储结构存储稀疏矩阵M, 则除三元组表外，下列数据中还需要保存的是()。 I. M的行数 IⅡ.M 中包含非零元素的行数 ⅢI.M的列数 IV.M 中包含非零元素的列数", "options": [{"label": "A", "text": "仅I 、Ⅲ"}, {"label": "B", "text": "仅I 、IV"}, {"label": "C", "text": "仅Ⅱ、IV"}, {"label": "D", "text": "I 、Ⅱ 、Ⅲ 、IV"}], "answer": "A"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第3题）若采用三元组表存储结构存储稀疏矩阵M, 则除三元组表外，下列数据中还需要保存的是()。 I

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第4题）在由6个字符组成的字符集S 中，各字符出现的频次分别为3,4,5,6,8,10,为S 构造的哈 夫曼编码的加权平均长度为()。", "options": [{"label": "A", "text": "2.4"}, {"label": "B", "text": "2.5"}, {"label": "C", "text": "2.67"}, {"label": "D", "text": "2.75 05.已知一棵二叉树的树形如右图所示，若其后序遍历序列为f,d,b,e,c,a, 则其先(前)序遍历序列是()。"}], "answer": "B"}',
  '计算机网络', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第4题）在由6个字符组成的字符集S 中，各字符出现的频次分别为3,4,5,6,8,10,为S 构造

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第6题）已知无向连通图G 中各边的权值均为1。下列算法中，一定能够求出图G 中从某顶点到其余各 个顶点最短路径的是()。 I. 普里姆( Prim) 算 法 Ⅱ.克鲁斯卡尔( Kruskal) 算法 Ⅲ.广度优先搜索算法", "options": [{"label": "A", "text": "仅I"}, {"label": "B", "text": "仅 Ⅲ"}, {"label": "C", "text": "仅I、Ⅱ"}, {"label": "D", "text": "I 、Ⅱ 、Ⅲ"}], "answer": "B"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第6题）已知无向连通图G 中各边的权值均为1。下列算法中，一定能够求出图G 中从某顶点到其余各 个

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第7题）下列非空B 树的叙述中，正确的是()。 I. 插入操作可能增加树的高度 II. 删除操作一定会导致叶结点的变化 Ⅲ.查找某关键字总是要查找到叶结点 IV.插入的新关键字最终位于叶结点中", "options": [{"label": "A", "text": "仅I"}, {"label": "B", "text": "仅I 、Ⅱ"}, {"label": "C", "text": "仅Ⅲ、IV"}, {"label": "D", "text": "仅 I 、Ⅱ 、IV"}], "answer": "B"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第7题）下列非空B 树的叙述中，正确的是()。 I. 插入操作可能增加树的高度 II. 删除操作一

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第8题）对含有600个元素的有序顺序表进行折半查找，关键字间的比较次数最多是()。", "options": [{"label": "A", "text": "9"}, {"label": "B", "text": "10"}, {"label": "C", "text": "30"}, {"label": "D", "text": "300"}], "answer": "B"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第8题）对含有600个元素的有序顺序表进行折半查找，关键字间的比较次数最多是()。


INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第10题）下列排序算法中，不稳定的是()。 I. 希尔排序 Ⅱ.归并排序 Ⅲ.快速排序 IV. 堆排序 V. 基数排序", "options": [{"label": "A", "text": "仅I 、Ⅱ"}, {"label": "B", "text": "仅Ⅱ、V"}, {"label": "C", "text": "仅 I 、Ⅲ 、IV"}, {"label": "D", "text": "仅Ⅲ、IV、V"}], "answer": "C"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第10题）下列排序算法中，不稳定的是()。 I. 希尔排序 Ⅱ.归并排序 Ⅲ.快速排序 IV. 堆

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第11题）使用快速排序算法对数据进行升序排序，若经过一次划分后得到的数据序列是68,11,70,23, 80,77,48,81,93,88,则该次划分的枢轴是()。", "options": [{"label": "A", "text": "11"}, {"label": "B", "text": "70"}, {"label": "C", "text": "80"}, {"label": "D", "text": "81"}], "answer": "D", "analysis": "在快速排序算法中，划分过程通常选择一个枢轴元素来将待排序序列划分为两个子 序列。因为是升序排序，所以枢纽元素的前半个子序列的值需要都小于枢轴值，后半个子序列 的值需要都大于枢轴值。分别从每个选项来看，A 选项的枢轴值为11,前半个子序列的值只有 68,大于枢轴值11,不符合。B 选项的枢轴值为70,前半个子序列都小于70,但后半个子序列 存在23和48小于70,不符合。C 选项的枢轴值为80,前半个子序列的值都小于80,但是后半 个子序列存在48小于80,不符合。D 选项的枢轴值为81,81前面的元素都小于81,81后面的 元素都大于81,符合。因此本题的正确选项为D。 12\\\\. C。【解析】P 每条指令平均需要1.2个时钟周期，机器M 的主频为1.5GHz, 代表每秒共有1.5G 个时钟周期，则每秒能执行1.5G/1.2=1.25G 条指令。执行P 程序共需要5×10⁵×1.2=6×10⁵个 时钟周期，每秒有1.5G个时钟周期，则6×10⁵个时钟周期共需要6×10⁵/1.5G=0.4ms 。所以 本题的正确答案为C。 13\\\\. A。【解析】机器数是计算机内部用来表示和存储数值的二进制形式。对于有符号的short 型变 量，通常采用补码表示法。对于给定的short 型变量x=-8190, 我们需要将其转换为二进制的 补码表示。因为short 型变量为2B, 即16位，所以8190=0001111111111110B, 然后取其二 进制补码(负数取反后加1),补码为111000000000010B, 转化为16进制为E002H 。 因此正 确选项为A。 14\\\\. A。【解析】给定的机器数为80200000H, 表示一个32位的二进制数。我们需要将其转换为float 型变量的值。 80200000H=100000000100000000000000000B 。根据IEEE754 单精度浮 点数格式，首位表示符号位，接下来的8位表示指数部分，剩下的23位表示尾数部分。拆分该 二进制表示，我们得到以下部分，符号位：1(表示负数),指数部分：00000000B ( 十进制值为 0),尾数部分：01000000000000000000000B。本题考查的点为IEEE 754 单精度浮点数的表 示，因为指数部分为0,尾数部分不为0,所以为非规格化的表示，所以尾数部分的形式为0.M, 不是1.M, 同时指数部分是-126,而不是-127,则真值为-0.01×2-126=-2-128,正确答案为 A 选项。 15\\\\. C。【解析】由于CPU有30根地址线，每根地址线可以表示2个不同的状态(0或1)。因此，CPU 的地址线共有2³0个不同的地址。根据RAM和ROM的分配比，RAM区占据整个地址空间的3/4, 而ROM区占据剩下的1/4,我们可以选取高位的两根地址线，00、01、10分配给连续低地址的 RAM, 则高位只剩下11可以分配，所以可以分配的地址范围为110...00(28个0)～11..1(30个1), 十六进制表示为30000000H～3FFFFFFFH。故本题的正确选项为C。 16\\\\. B。【解析】CF 表示无符号整数运算时的进位/借位，因此计算CF 的时候，需要把x 和y 当成无 符号数进行计算,x 的二进制表示为000000000000000000000000001010B,y 的二进制表 示为1111111111111111111111111101100,因为 x不够减 y, 所以 CF=1 。 x−y=30 ,不 超过int 的最大值，不会产生溢出，所以OF=0 。 所以本题的正确选项为B。 17\\\\. A。【解析】指令中包含特定的寻址特征字段，指示该条指令的寻址方式，因此对于寄存器中取 出的内容，可以根据不同的寻址方式解释为操作数或操作数的地址。所以本题的正确选项为A。 18\\\\. B。【解析】组合逻辑元件是那些仅由组合逻辑电路组成的元件，其输出仅取决于当前的输入，而 不受存储器或时钟信号的影响。算术逻辑部件ALU 和多路选择器MUX都属于组合逻辑元件， 它们的输出仅由当前输入决定。程序计数器PC 和通用寄存器是时序逻辑元件，也称为状态元 件。它们的输出不仅取决于当前输入，还受存储器或时钟信号的影响，并且具有状态或存储功 能。因此本题选B。 19\\\\. C。【解析】旁路技术通过在流水线中引入旁路( Forwarding) 路径，将之前指令的结果直接传 递给后续需要使用的指令，避免了流水线停顿。具体来说，当检测到数据相关时，旁路技术将 结果从执行阶段的功能单元(如算术逻辑单元)直接转发给需要使用该结果的指令，绕过了中 间的寄存器阶段。I1和I2 存在数据相关，可以通过旁路技术，获取到执行阶段R\\\\[S2\\\\]的值，解 决数据相关。I2"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第11题）使用快速排序算法对数据进行升序排序，若经过一次划分后得到的数据序列是68,11,70,2

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第12题）若机器M的主频为1.5GHz, 在M 上执行程序P 指令数为5×10⁵,P 的平均CPI为1.2,则P 在 M 上的指令执行速度和用户CPU时间分别为()。", "options": [{"label": "A", "text": "0.8GIPS,0.4ms"}, {"label": "B", "text": "0.8GIPS,0.4μs"}, {"label": "C", "text": "1.25GIPS,0.4ms"}, {"label": "D", "text": "1.25GIPS,0.4 μs"}], "answer": "C"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第12题）若机器M的主频为1.5GHz, 在M 上执行程序P 指令数为5×10⁵,P 的平均CPI

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第13题）若 short 型变量x=-8190, 则 x 的机器数是()。", "options": [{"label": "A", "text": "E002H"}, {"label": "B", "text": "E001H"}, {"label": "C", "text": "9FFFH"}, {"label": "D", "text": "9FFEH"}], "answer": "A"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第13题）若 short 型变量x=-8190, 则 x 的机器数是()。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第14题）已知float型变量用IEEE 754单精度浮点数格式表示。若float型变量x 的机器数为80200000H, 则x 的值是()。", "options": [{"label": "A", "text": "-2- 128"}, {"label": "B", "text": "- 1.01×2- 127"}, {"label": "C", "text": "-1.01×2-126"}, {"label": "D", "text": "非数(NaN)"}], "answer": "A"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第14题）已知float型变量用IEEE 754单精度浮点数格式表示。若float型变量x 的机器

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第15题）某计算机的CPU 有30根地址线，按字节编址，CPU 和主存芯片连接时，要求主存芯片占满所 有可能存储地址空间，并且RAM区和ROM区所分配的空间大小比为3:1。若RAM在连续低 地址区，ROM在连续高地址区，则ROM的地址范围是()。", "options": [{"label": "A", "text": "00000000H～0FFF FFFFH"}, {"label": "B", "text": "10000000H～2FFF FFFFH"}, {"label": "C", "text": "30000000H～3FFF FFFFH"}, {"label": "D", "text": "40000000H～4FFF FFFFH"}], "answer": "C"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第15题）某计算机的CPU 有30根地址线，按字节编址，CPU 和主存芯片连接时，要求主存芯片占满

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第16题）已知x、y 为int 类型，当x=100,y=200 时，执行x-y 指令得到的溢出标志OF 和借位标志 CF分别为0、1,那么当x=10,y=-20 时，执行该指令得到的OF 和CF分别是()。", "options": [{"label": "A", "text": "OF=0,CF=0"}, {"label": "B", "text": "OF=0,CF=1"}, {"label": "C", "text": "OF=1,CF=0"}, {"label": "D", "text": "OF=1,CF=1"}], "answer": "B"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第16题）已知x、y 为int 类型，当x=100,y=200 时，执行x-y 指令得到的溢出标志

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第17题）某运算类型指令中有一个地址码为通用寄存器编号，对应通用寄存器中存放的是操作数或操作 数地址，CPU 区分两者的依据是()。", "options": [{"label": "A", "text": "操作数的寻址方式"}, {"label": "B", "text": "操作数的编码方式"}, {"label": "C", "text": "通用寄存器的编号"}, {"label": "D", "text": "通用寄存器的内容"}], "answer": "A"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第17题）某运算类型指令中有一个地址码为通用寄存器编号，对应通用寄存器中存放的是操作数或操作 数地

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第18题）数据通路由组合逻辑元件(操作元件)和时序逻辑元件(状态元件)组成。下列给出的元件中， 属于操作元件的是()。 I. 算术逻辑部件( ALU) Ⅱ.程序计数器( PC) ⅢI.通用寄存器组( GPRs) IV.多路选择器( MUX)", "options": [{"label": "A", "text": "仅I,Ⅱ"}, {"label": "B", "text": "仅I,IV"}, {"label": "C", "text": "仅Ⅱ,Ⅲ **D.I,Ⅱ,** IV"}], "answer": "B"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第18题）数据通路由组合逻辑元件(操作元件)和时序逻辑元件(状态元件)组成。下列给出的元件中， 属

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第19题）在采用“取指、译码/取数、执行、访存、写回”5段流水线的RISC处理器中，执行如下指令序 列(第一列为指令序号),其中SO、S1、S2、S3和t2 表示寄存器编号。若采用转发(旁路)技 术处理数据冒险，采用硬件阻塞方式处理控制冒险，则在I1～I4执行过程中，发生流水线阻塞 的指令有()。 //R\\\\[S21 ←RS11+RIS⁰\\\\] //if R\\\\[t2\\\\]=R\\\\[S3\\\\]jump to //R\\\\[t2\\\\]←R\\\\[t2\\\\]+20 L1: S2,S1,S0 S3, 0(S2) t2,S3,L1 t2,t2,20 add load beq addi I1 I2 I3 I4 I5 L1", "options": [{"label": "A", "text": "仅I3"}, {"label": "B", "text": "仅I2 和I4"}, {"label": "C", "text": "仅I3 和I4"}, {"label": "D", "text": "仅I2 、I3和I4"}], "answer": "C"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第19题）在采用“取指、译码/取数、执行、访存、写回”5段流水线的RISC处理器中，执行如下指令序

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第20题）某存储总线宽度为64位，总线时钟频率为1GHz, 在总线上传输一个数据或地址需要一个时钟 周期，不支持突发传送方式。若通过该总线连接CPU 和主存，主存每次准备一个64位数据需 要 6ns, 主存块大小为32B, 则读取一个主存块时间是()。", "options": [{"label": "A", "text": "8ns"}, {"label": "B", "text": "11ns"}, {"label": "C", "text": "26ns"}, {"label": "D", "text": "32ns"}], "answer": "D"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第20题）某存储总线宽度为64位，总线时钟频率为1GHz, 在总线上传输一个数据或地址需要一个时钟

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第21题）下列关于硬件和异常/中断关系的叙述中，错误的是()。", "options": [{"label": "A", "text": "CPU 在执行一条指令过程中检测异常事件"}, {"label": "B", "text": "CPU在执行完一条指令时检测中断请求信号"}, {"label": "C", "text": "开中断中CPU 检测到中断请求后就进行中断响应"}, {"label": "D", "text": "外部设备通过中断控制器向CPU发中断结束信号"}], "answer": "D"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第21题）下列关于硬件和异常/中断关系的叙述中，错误的是()。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第22题）下列关于I/O 控制方式的叙述中，错误的是()。", "options": [{"label": "A", "text": "查询方式下，通过CPU执行查询程序进行I/O操作"}, {"label": "B", "text": "中断方式下，通过CPU 执行中断服务程序进行I/O 操作"}, {"label": "C", "text": "DMA 方式下，通过CPU执行DMA传送程序进行I/O 操作"}, {"label": "D", "text": "对于SSD、网络适配器等高速设备，采用DMA方式输入/输出"}], "answer": "C"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第22题）下列关于I/O 控制方式的叙述中，错误的是()。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第23题）与宏内核操作系统相比，下列特征中，微内核操作系统具有的是()。 I. 较好的性能 Ⅱ.较高的可靠性 Ⅲ.较高的安全性 IV.较强的可扩展性", "options": [{"label": "A", "text": "仅Ⅱ,IV"}, {"label": "B", "text": "仅I,Ⅱ,Ⅲ"}, {"label": "C", "text": "仅I,Ⅲ,IV"}, {"label": "D", "text": "仅Ⅱ,Ⅲ,IV"}], "answer": "D"}',
  '计算机网络', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第23题）与宏内核操作系统相比，下列特征中，微内核操作系统具有的是()。 I. 较好的性能 Ⅱ.较

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第24题）在操作系统内核中，中断向量表适合采用的数据结构是()。", "options": [{"label": "A", "text": "数组"}, {"label": "B", "text": "队列"}, {"label": "C", "text": "单向链表"}, {"label": "D", "text": "双向链表"}], "answer": "A"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第24题）在操作系统内核中，中断向量表适合采用的数据结构是()。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第25题）某系统采用页式存储管理，用位图管理空闲页框。若页大小为4KB, 物理内存大小为16GB, 则 位图所占空间的大小是()。", "options": [{"label": "A", "text": "128B"}, {"label": "B", "text": "128KB"}, {"label": "C", "text": "512KB"}, {"label": "D", "text": "4MB"}], "answer": "C"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第25题）某系统采用页式存储管理，用位图管理空闲页框。若页大小为4KB, 物理内存大小为16GB,

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第26题）下列操作完成时，导致CPU从内核态转为用户态的是()。", "options": [{"label": "A", "text": "阻塞进程"}, {"label": "B", "text": "执行CPU调度"}, {"label": "C", "text": "唤醒进程"}, {"label": "D", "text": "执行系统调用"}], "answer": "D"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第26题）下列操作完成时，导致CPU从内核态转为用户态的是()。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第27题）下列由当前线程引起的事件或执行的操作中，可能导致该线程由执行态变为就绪态的是()。", "options": [{"label": "A", "text": "键盘输入"}, {"label": "B", "text": "缺页异常"}, {"label": "C", "text": "主动出让CPU"}, {"label": "D", "text": "执行信号量的wait()操作"}], "answer": "C"}',
  '操作系统', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第27题）下列由当前线程引起的事件或执行的操作中，可能导致该线程由执行态变为就绪态的是()。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第28题）对于采用虚拟内存管理方式的系统，下列关于进程虚拟地址空间的叙述中，错误的是()。", "options": [{"label": "A", "text": "每个进程都有自己独立的虚拟地址空间"}, {"label": "B", "text": "C 语言中malloc()函数返回的是虚拟地址"}, {"label": "C", "text": "进程对数据段和代码段可以有不同的访问权限"}, {"label": "D", "text": "虚拟地址的大小由内存和硬盘的大小决定"}], "answer": "D"}',
  '操作系统', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第28题）对于采用虚拟内存管理方式的系统，下列关于进程虚拟地址空间的叙述中，错误的是()。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第29题）进程P1,P2 和P3 进入就绪队列的时刻、优先值(值越大优先权越高)以及CPU的执行时间如 下表所示。 --- --- 进入就绪队列的时刻 CPU的执行时间 P1 1 20ms 42ms P3 100 若系统采用基于优先权的抢占式CPU调度算法，从0ms时刻开始进行调度，则P1、P2和P3的 平均周转时间为()。", "options": [{"label": "A", "text": "60ms"}, {"label": "B", "text": "61ms"}, {"label": "C", "text": "70ms"}, {"label": "D", "text": "71ms"}], "answer": "B"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第29题）进程P1,P2 和P3 进入就绪队列的时刻、优先值(值越大优先权越高)以及CPU的执行时

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第30题）进程R 和S 共享数据data, 若 data在R 和S 中所在页的页号分别为p1 和p2, 两个页所对应的 页框号分别为f1 和f2, 则下列叙述中，正确的是()。", "options": [{"label": "A", "text": "p1 和p2 一定相等，f1 和f2 一定相等"}, {"label": "B", "text": "p1 和 p2一定相等，f1 和f2 不一定相等"}, {"label": "C", "text": "p1 和p2 不一定相等，f1 和f2 一定相等"}, {"label": "D", "text": "p1 和p2不一定相等，f1 和f2 不一定相等 31. 若文件F 仅被进程P 打开并访问，则当进程P 关闭F 时，下列操作中，文件系统需要完成的 是()。"}], "answer": "C"}',
  '操作系统', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第30题）进程R 和S 共享数据data, 若 data在R 和S 中所在页的页号分别为p1 和p

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第32题）下列因素中，设备分配需要考虑的是()。 I. 设备类型 IⅡ. 设备的访问权限 Ⅲ.设备的占用状态 IV.逻辑设备与物理设备的映射关系", "options": [{"label": "A", "text": ".仅I 、Ⅱ"}, {"label": "B", "text": "仅Ⅱ、Ⅲ"}, {"label": "C", "text": "仅Ⅲ、IV"}, {"label": "D", "text": "I 、I 、Ⅲ 、IV"}], "answer": "D"}',
  '计算机网络', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第32题）下列因素中，设备分配需要考虑的是()。 I. 设备类型 IⅡ. 设备的访问权限 Ⅲ.设备

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第33题）在下图所示的分组交换网络中，主机H1 和H2 通过路由器互连，2段链路的带宽均为100Mbps, 时延带宽积(即单向传播时延×带宽)均为1000bits。若H1向H2 发送1个大小为1MB的文 件，分组长度为1000B, 则从H1开始发送时刻起到H2 收到文件全部数据时刻止，所需的时间 至少是(注：M=10⁶)()。", "options": [{"label": "A", "text": "80.02ms"}, {"label": "B", "text": "80.08ms"}, {"label": "C", "text": "80.09ms"}, {"label": "D", "text": "80.10ms"}], "answer": "D"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第33题）在下图所示的分组交换网络中，主机H1 和H2 通过路由器互连，2段链路的带宽均为100M

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第34题）某无噪声理想信道带宽为4MHz, 采 用QAM调制，若该信道的最大数据传输率是48Mbps, 则 该信道采用的QAM调制方案是()。", "options": [{"label": "A", "text": "QAM-16"}, {"label": "B", "text": "QAM-32"}, {"label": "C", "text": "QAM-64"}, {"label": "D", "text": "QAM-128"}], "answer": "C"}',
  '计算机网络', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第34题）某无噪声理想信道带宽为4MHz, 采 用QAM调制，若该信道的最大数据传输率是48Mbp

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第35题）假设通过同一信道，数据链路层分别采用停止-等待协议、GBN 协议和SR 协议(发送窗口和 接收窗口相等)传输数据，三个协议的数据帧长相同，忽略确认帧长度，帧序号位数为3比特。 若对应三个协议的发送方最大信道利用率分别是U1 、U2和U3, 则U1 、U2和U3满足的关系 是()。", "options": [{"label": "A", "text": "U1≤U2≤U3"}, {"label": "B", "text": "U1≤U3≤U2"}, {"label": "C", "text": "U2≤U3≤U1"}, {"label": "D", "text": "U3≤U2≤U1"}], "answer": "B"}',
  '计算机网络', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第35题）假设通过同一信道，数据链路层分别采用停止-等待协议、GBN 协议和SR 协议(发送窗口和

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第36题）已知10BaseT以太网的争用时间片为51.2us。若网卡在发送某帧时发生了连续4次冲突，则基 于二进制指数退避算法确定的再次尝试重发该帧前等待的最长时间是()。", "options": [{"label": "A", "text": "51.2us"}, {"label": "B", "text": "204.8us"}, {"label": "C", "text": "768us"}, {"label": "D", "text": "819.2 **us**"}], "answer": "C"}',
  '操作系统', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第36题）已知10BaseT以太网的争用时间片为51.2us。若网卡在发送某帧时发生了连续4次冲突

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第37题）若甲向乙发送数据时采用CRC校验，生成多项式为G(x)=x⁴+x+1 ( 即 G=10011), 则乙接 收到下列比特串时，可以断定其在传输过程中未发生错误的是()。", "options": [{"label": "A", "text": "101110000"}, {"label": "B", "text": "101110100"}, {"label": "C", "text": "101111000"}, {"label": "D", "text": "101111100"}], "answer": "D"}',
  '计算机网络', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第37题）若甲向乙发送数据时采用CRC校验，生成多项式为G(x)=x⁴+x+1 ( 即 G=100

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第38题）某网络拓扑如下图所示，其中路由器R2实现NAT功能。若主机H 向Internet发送一个IP分组， 则经过R2 转发后，该IP 分组的源IP 地址是()。 [192.168.0.1](192.168.0.1) Internet - R2 [192.168.0.3](192.168.0.3) [195.123.0.34/30](195.123.0.34/30) NAT R1 H", "options": [{"label": "A", "text": "195.123.0.33"}, {"label": "B", "text": "195.123.0.35"}, {"label": "C", "text": "192.168.0.1"}, {"label": "D", "text": "192.168.0.3"}], "answer": "A"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第38题）某网络拓扑如下图所示，其中路由器R2实现NAT功能。若主机H 向Internet发送一个

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第39题）主机168.16.84.24/20所在子网的最小可分配IP 地址和最大可分配IP 地址分别是()。", "options": [{"label": "A", "text": "168.16.80.1, [168.16.84.254](168.16.84.254)"}, {"label": "B", "text": "168.16.80.1, [168.16.95.254](168.16.95.254)"}, {"label": "C", "text": "168.16.84.1, [168.16.84.254](168.16.84.254)"}, {"label": "D", "text": "168.16.84.1, [168.16.95.254](168.16.95.254)"}], "answer": "B"}',
  '计算机网络', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第39题）主机168.16.84.24/20所在子网的最小可分配IP 地址和最大可分配IP 地址分

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2023年408统考第40题）下列关于IPv4 和 IPv6 的叙述中，正确的是()。 I.IPv6 地址空间是IPv4 地址空间的96倍 Ⅱ.IPv4 首部和IPv6 的基本首部的长度均可变 Ⅲ.IPv4向 IPv6 过渡可以采双协议栈和隧道技术 IV.IPv6 首部的Hop-Limit 字段等价于IPv4 首部的TTL 字段", "options": [{"label": "A", "text": "仅I、Ⅱ"}, {"label": "B", "text": "仅I 、IV"}, {"label": "C", "text": "仅Ⅱ、Ⅲ"}, {"label": "D", "text": "仅Ⅲ、IV 二 、综合应用题：41～47小题，共70分。"}], "answer": "D"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2023年408统考真题: （2023年408统考第40题）下列关于IPv4 和 IPv6 的叙述中，正确的是()。 I.IPv6 地址空间是IPv














INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第2题）x+y（z-u）/v的等价后缀：", "options": [{"label": "A", "text": "xyzu-v/+"}, {"label": "B", "text": "xuzu-v/+"}, {"label": "C", "text": "+x/y-zuv"}, {"label": "D", "text": "+xy/-zuv"}], "answer": "A"}',
  '计算机网络', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第2题）x+y（z-u）/v的等价后缀：


INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第5题）不适用于折半查找的是()", "options": [{"label": "A", "text": "有序链表"}, {"label": "B", "text": "无序数组"}, {"label": "C", "text": "有序静态链表"}, {"label": "D", "text": "无序静态链表"}], "answer": "D"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第5题）不适用于折半查找的是()

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第6题）KMP算法使用修正后的next数组进行模式匹配，模式串s：“aabaab“，主串中某字符与s中某字符失去配对， s右滑最长距离为：", "options": [{"label": "A", "text": "5"}, {"label": "B", "text": "4"}, {"label": "C", "text": "3"}, {"label": "D", "text": "2"}], "answer": "A"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第6题）KMP算法使用修正后的next数组进行模式匹配，模式串s："aabaab"，主串中某字符与

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第7题）一棵二叉搜索树如下图所示，K1 、K2 、K3分别是对应结点中保存的关键字。子树T的任一结点中保存的关键字X满足的是", "options": [{"label": "A", "text": "、X<K1"}, {"label": "B", "text": "、X>K2"}, {"label": "C", "text": "、K1<X<K3"}, {"label": "D", "text": "、K3<X<K2"}], "answer": "D"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第7题）一棵二叉搜索树如下图所示，K1 、K2 、K3分别是对应结点中保存的关键字。子树T的任一结

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第8题）使用快速排序算法对含N（N23）个元素的数组M进行排序， 若第一趟排序将M中除枢轴外的N-1个元素划分为均不空的P和Q两块，则下列叙述中， 正确的是()", "options": [{"label": "A", "text": "、P与Q块间有序"}, {"label": "B", "text": "、P与Q均块内有序"}, {"label": "C", "text": "、P和Q的元素个数大致相等"}, {"label": "D", "text": "、P和Q中均不存在相等的元素"}], "answer": "A"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第8题）使用快速排序算法对含N（N23）个元素的数组M进行排序， 若第一趟排序将M中除枢轴外的N-

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第9题）已知关键字序列28 ，22 ，20 ，19 ，8 ，12 ，15 ，5是大根堆（最大堆），对该堆进行两次删除操作后，得到的新堆是()", "options": [{"label": "A", "text": "20 ，19 ，15 ，12 ，8 ，5"}, {"label": "B", "text": "20 ，19 ，15 ，5 ，8 ，1 ，2"}, {"label": "C", "text": "20 ，19 ，12 ，15 ，8 ，5"}, {"label": "D", "text": "20 ，19 ，8 ，12 ，15 ，5"}], "answer": "B"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第9题）已知关键字序列28 ，22 ，20 ，19 ，8 ，12 ，15 ，5是大根堆（最大堆），

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第10题）现有由关键字组成的3个有序序列（3 ，5）、（7 ，9）、和（6），若按从左至右的次序选择有序序列进二路归并排序， 则关键字之间的总比较次数是()", "options": [{"label": "A", "text": "3"}, {"label": "B", "text": "4"}, {"label": "C", "text": "5"}, {"label": "D", "text": "6"}], "answer": "C"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第10题）现有由关键字组成的3个有序序列（3 ，5）、（7 ，9）、和（6），若按从左至右的次序选

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第11题）外部排序使用败者树进行升序归并，记录“冠军”节点保存的是（ ）。", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "D"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第11题）外部排序使用败者树进行升序归并，记录“冠军”节点保存的是（ ）。 【皮皮灰】D. 最小关

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第12题）C 语言代码如下： int i=32777； short si= i； int j= si； 执行上述代码段后，j的值是", "options": [{"label": "A", "text": "-32777"}, {"label": "B", "text": "-32759"}, {"label": "C", "text": "32759"}, {"label": "D", "text": "32777"}], "answer": "B"}',
  '计算机网络', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第12题）C 语言代码如下： int i=32777； short si= i； int j= s

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第13题）将汇编语言程序中实现特定功能的指令序列定义成一条伪指令。下列选项中，CPU能理解并直接执行的是 I.伪指令 II.微指令 III.机器指令 IV.汇编指令", "options": [{"label": "A", "text": "仅I和 IV"}, {"label": "B", "text": "仅II和III"}, {"label": "C", "text": "仅III和IV"}, {"label": "D", "text": "仅I 、III和IV"}], "answer": "B"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第13题）将汇编语言程序中实现特定功能的指令序列定义成一条伪指令。下列选项中，CPU能理解并直接执

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第15题）下列关于整数乘法运算的叙述中，错误的是", "options": [{"label": "A", "text": "用阵列乘法器实现乘运算可以在一个时钟周期内完成"}, {"label": "B", "text": "用ALU和位移器实现的乘运算无法在一个时钟周期内完成"}, {"label": "C", "text": "变量与常数的乘运算可以编译优化为若干条移位及加/减运算指令"}, {"label": "D", "text": "两个变量的乘运算无法编译转换为位移及加法等指令的循环实现"}], "answer": "B"}',
  '计算机网络', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第15题）下列关于整数乘法运算的叙述中，错误的是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第16题）对于页式虚拟存储管理系统，下列关于存储器层次结构的叙述中，错误的是", "options": [{"label": "A", "text": "Cache-主存层次的交换单位为主存块，主存-外存层次的交换单位为页"}, {"label": "B", "text": "Cache-主存层次替换算法由硬件实现，主存-外存层次由软件实现"}, {"label": "C", "text": "Cache-主存层次可采用回写法写策略，主存-外存层次通常采用回写法写策略"}, {"label": "D", "text": "Cache-主存层次可采用直接映射方式，主存-外存层次通常采用直接映射方式"}], "answer": "D"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第16题）对于页式虚拟存储管理系统，下列关于存储器层次结构的叙述中，错误的是

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第17题）某计算机按字节编址，采用页式虚拟存储管理方式，虚拟地址为32位，主存地址为30位，页大小为1 KB。若TLB共有32个表项，采用4路组相联映射方式，则TLB表项中标记字段的位数至少是()", "options": [{"label": "A", "text": "17"}, {"label": "B", "text": "18"}, {"label": "C", "text": "19"}, {"label": "D", "text": "20"}], "answer": "C"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第17题）某计算机按字节编址，采用页式虚拟存储管理方式，虚拟地址为32位，主存地址为30位，页大小

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第19题）5段流水线RISC说法错误的是（）。", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "C"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第19题）5段流水线RISC说法错误的是（）。 【皮皮灰】C.所有数据冒险都可以通过加入转发（旁路

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第20题）存储器总线的时钟频率为 420MHz，总线宽度为 64 位，每个时钟周期传送2 次数据，支持突发传输， 最多传8 次，第一个时钟传地址和读写命令， 从第 4~7 个始终连续传8 次。总线带宽最大传输速率为（）。", "options": [{"label": "A", "text": "3.84GB/s"}, {"label": "B", "text": "6.72GB/s"}, {"label": "C", "text": "30.72GB/s"}, {"label": "D", "text": "53.76GB/s"}], "answer": "A"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第20题）存储器总线的时钟频率为 420MHz，总线宽度为 64 位，每个时钟周期传送2 次数据，

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第21题）关于中断1/O方式，错误的是（）。", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "A"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第21题）关于中断1/O方式，错误的是（）。 【皮皮灰】A. 中断屏蔽字决定中断响应顺序

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第22题）DMA 方式中，DMA控制器控制的数据传输通路位于（）。", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "C"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第22题）DMA 方式中，DMA控制器控制的数据传输通路位于（）。 【皮皮灰】C.设备接口和主存之

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第23题）下面关于中断和异常的说法中，错误的是（）。", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "A"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第23题）下面关于中断和异常的说法中，错误的是（）。 【皮皮灰】A中断或异常发生时，CPU处于内核

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第24题）终止进程时，不一定执行的是（）。", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "A"}',
  '操作系统', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第24题）终止进程时，不一定执行的是（）。 【皮皮灰】A.终止子进程

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @os_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第25题）支持页式存储管理的系统，进程切换时OS要执行（）。", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "D"}',
  '操作系统', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第25题）支持页式存储管理的系统，进程切换时OS要执行（）。 【皮皮灰】D.I 、 Ⅱ 、Ⅲ


INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第28题）进程P有一个线程T，打开文件后获得fd，再创建线程Ta，Tb，则线程Ta， Tb可共享的资源是（）。 I.进程 P的地址空间 聂.线程T的栈 Ⅲfd", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "B"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第28题）进程P有一个线程T，打开文件后获得fd，再创建线程Ta，Tb，则线程Ta， Tb可共享的


INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第30题）RR 调度，时间片为5ms，有 10个进程，初始状态均处于就绪队列，执行结束前仅处于执行态或就绪态，队尾进程 P所需 CPU 时间最短，为 25ms，不考虑系统开销，则 P 的周转时间为（）。", "options": [{"label": "A", "text": "选项A"}, {"label": "B", "text": "选项B"}, {"label": "C", "text": "选项C"}, {"label": "D", "text": "选项D"}], "answer": "C"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第30题）RR 调度，时间片为5ms，有 10个进程，初始状态均处于就绪队列，执行结束前仅处于执行

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @co_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第31题）键盘中断服务例程执行结束时，所输入的数据存放位置是（）。", "options": [{"label": "A", "text": "用户缓冲区"}, {"label": "B", "text": "CPU的通用膏存器"}, {"label": "C", "text": "内核缓中区"}, {"label": "D", "text": "键盘控制器的数据缓冲区"}], "answer": "B"}',
  '计算机组成原理', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第31题）键盘中断服务例程执行结束时，所输入的数据存放位置是（）。

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第32题）磁道数400（号为0-399），用循环扫描算法（CSCAN）进行调度，完成对200号磁道的请求后， 磁头想磁道号减小的方向移动， 若还有7个请求，磁道号分别为300 ，120 ，110 ，0 ，160 ，210 ，399，则完成上述请求后磁头移动的距离", "options": [{"label": "A", "text": "599"}, {"label": "B", "text": "619"}, {"label": "C", "text": "788D. 799"}], "answer": "C"}',
  '操作系统', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第32题）磁道数400（号为0-399），用循环扫描算法（CSCAN）进行调度，完成对200号磁道

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第34题）在下列二进制数字调制方法中，需要2个不同频率载波的()", "options": [{"label": "A", "text": "、ASK"}, {"label": "B", "text": "PSK"}, {"label": "C", "text": "FSK"}, {"label": "D", "text": "DPSK"}], "answer": "D"}',
  '计算机网络', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第34题）在下列二进制数字调制方法中，需要2个不同频率载波的()

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2024年408统考第40题）若浏览器不支持并行TCP连接，便用非持久的[HTTP/.10](HTTP/.10)协议请求浏览1个web页，该页中引用同一个网站上7个小图像文件， 则从浏览器传输web页请求建立TCP连接开始后，到接收完所有内容为止。所需要的往返时间RTT数至少是", "options": [{"label": "A", "text": "4"}, {"label": "B", "text": "9"}, {"label": "C", "text": "14"}, {"label": "D", "text": "16"}], "answer": "D"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2024年408统考真题: （2024年408统考第40题）若浏览器不支持并行TCP连接，便用非持久的[HTTP/.10](HTTP/.10)协议请





INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @ds_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2025年408统考第9题）下面关于散列表的说法正确的是 ( )", "options": [{"label": "A", "text": "只要线性表不满，线性探查再散列一定能找到一个空闲位置"}, {"label": "B", "text": "只要线性表不满，平方探查再散列一定能找到一个空闲位置"}, {"label": "C", "text": "线性探测法的冲突一定是同义词和同义词比较"}, {"label": "D", "text": "平方探测法的冲突一定是同义词和同义词比较 【解析】"}], "answer": "D"}',
  '数据结构', 0, 'APPROVED', NOW()
); -- 2025年408统考真题: （2025年408统考第9题）下面关于散列表的说法正确的是 ( )

INSERT INTO `t_question_bank` (`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, `knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (
  @net_course_id, @teacher_id, 'SINGLE', 'MEDIUM',
  '{"stem": "（2025年408统考第10题）在最坏情况下，移动次数最少的是 ( )", "options": [{"label": "A", "text": "冒泡排序"}, {"label": "B", "text": "直接插入排序"}, {"label": "C", "text": "快速排序"}, {"label": "D", "text": "简单选择排序 【解析】 冒泡排序、直接插入排序和快速排序在最坏情况下移动次数均为 n(n-1)/2 ，而简单选择排序在最坏情况下移动次数为 0 。因为简单选择排序每次都是从待排序列 \\\\- 3 - 官方网站:[www.youlu.com](https://www.youlu.com) 优路考研公众号 \\\\- 4 - 中选择最小（或最大）的一个元素，然后将其与当前位置的元素交换，所以它不会移动比待排序列长度更多的元素。因此，在最坏情况下移动次数最少的是简单选择排序。故正确答案为 D。"}], "answer": "D"}',
  '计算机网络', 0, 'APPROVED', NOW()
); -- 2025年408统考真题: （2025年408统考第10题）在最坏情况下，移动次数最少的是 ( )









































-- 总计: 652 道题目
--   计算机网络: 510
--   数据结构: 64
--   计算机组成原理: 46
--   操作系统: 32
