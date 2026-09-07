-- 在空间受限的 MySQL 环境下使用：不含 JOIN，不创建临时表。
UPDATE t_question_bank
SET knowledge_points = CASE knowledge_points
  WHEN '计算机网络基础' THEN '概述/计算机网络基础'
  WHEN '计算机网络' THEN '概述/计算机网络'
  WHEN 'OSI参考模型' THEN '概述/OSI参考模型'
  WHEN 'TCP/IP参考模型' THEN '概述/TCP/IP参考模型'
  WHEN '网络拓扑结构' THEN '概述/网络拓扑结构'
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

UPDATE t_question_bank
SET knowledge_points = CONCAT('未分类/', TRIM(knowledge_points))
WHERE deleted = 0
  AND knowledge_points IS NOT NULL AND TRIM(knowledge_points) <> ''
  AND knowledge_points NOT LIKE '%/%';
