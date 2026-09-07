-- 第四周：将题库扁平知识点统一为“一级模块/二级知识点”。
-- 可重复执行：已含“/”的标签不会再被改写。

-- 1. 直接使用课程知识点树中的分类（精确匹配优先）。
UPDATE t_question_bank q
JOIN t_knowledge_point kp
  ON kp.course_id = q.course_id
 AND kp.deleted = 0
 AND q.knowledge_points = kp.kp_name
SET q.knowledge_points = CONCAT(kp.kp_category, '/', kp.kp_name)
WHERE q.deleted = 0
  AND q.knowledge_points NOT LIKE '%/%';

-- 2. 处理题库中与标准知识点名称不同的常见别名。
UPDATE t_question_bank
SET knowledge_points = CASE knowledge_points
  WHEN '计算机网络基础' THEN '概述/计算机网络基础'
  WHEN '计算机网络' THEN '概述/计算机网络'
  WHEN 'OSI参考模型' THEN '概述/OSI参考模型'
  WHEN 'TCP/IP参考模型' THEN '概述/TCP/IP参考模型'
  WHEN '物理层设备' THEN '物理层/物理层设备'
  WHEN '物理层传输介质' THEN '物理层/传输介质'
  WHEN '数据编码技术' THEN '物理层/数据编码技术'
  WHEN '信道容量与带宽' THEN '物理层/信道容量与带宽'
  WHEN '信道复用技术' THEN '物理层/信道复用技术'
  WHEN '数据链路层设备' THEN '数据链路层/数据链路层设备'
  WHEN 'CSMA/CD协议' THEN '数据链路层/CSMA/CD协议'
  WHEN '以太网标准' THEN '数据链路层/以太网标准'
  WHEN 'VLAN技术' THEN '数据链路层/VLAN技术'
  WHEN '数据交换技术' THEN '数据链路层/数据交换技术'
  WHEN '子网划分与路由算法' THEN '网络层/子网划分与路由算法'
  WHEN 'IPv4/IPv6协议' THEN '网络层/IPv4/IPv6协议'
  WHEN 'IP地址分类' THEN '网络层/IP地址分类'
  WHEN '路由算法与协议' THEN '网络层/路由算法与协议'
  WHEN 'ICMP协议' THEN '网络层/ICMP协议'
  WHEN 'TCP/UDP协议' THEN '传输层/TCP/UDP协议'
  WHEN '电子邮件协议' THEN '应用层/电子邮件协议'
  WHEN 'DNS协议' THEN '应用层/DNS协议'
  WHEN 'HTTP协议' THEN '应用层/HTTP协议'
  ELSE knowledge_points
END
WHERE deleted = 0 AND knowledge_points NOT LIKE '%/%';

-- 3. 其他课程或无法可靠识别的历史题目不丢弃原始含义，统一收进待人工整理目录。
UPDATE t_question_bank
SET knowledge_points = CONCAT('未分类/', TRIM(knowledge_points))
WHERE deleted = 0
  AND knowledge_points IS NOT NULL
  AND TRIM(knowledge_points) <> ''
  AND knowledge_points NOT LIKE '%/%';

-- 4. 输出迁移核验结果：不应再有无层级标签的数据。
SELECT COUNT(*) AS total_questions,
       SUM(knowledge_points LIKE '%/%') AS hierarchical_questions,
       SUM(knowledge_points LIKE '未分类/%') AS pending_manual_review
FROM t_question_bank
WHERE deleted = 0;
