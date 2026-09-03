#!/usr/bin/env python3
"""
Generate SQL seed data for t_question_bank from markdown question bank files.

This script parses 5 Chinese question bank files and generates a MySQL SQL file
that inserts questions into the t_question_bank table.

Sources:
  1. docs/计算机网络试题库含答案2026.md — single/multi/fill/tf/short
  2. docs/计算机网络基础试题(十套试卷-附答案).md — 10 exam sets
  3. docs/2023年计算机408统考真题.md + 2023年计算机408统考真题解析.md — 408 2023
  4. docs/2024考研真题.md — 408 2024
  5. docs/2025年408计算机考研真题及答案.md — 408 2025

Output: test-data/question_bank_seed.sql
"""

import re
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_DIR = os.path.join(BASE_DIR, '..', 'docs')
OUTPUT_FILE = os.path.join(BASE_DIR, 'question_bank_seed.sql')

# ============================================================
# Knowledge point keyword mapping
# ============================================================
KP_KEYWORDS = [
    # Chapter 1: Overview
    (r'拓扑', '网络拓扑结构'),
    (r'计算机网络.*组成', '计算机网络组成'),
    (r'OSI.*参考模型|OSI.*模型|七层|层次结构', 'OSI参考模型'),
    (r'TCP/IP.*模型|TCP/IP.*体系|TCP/IP协议', 'TCP/IP参考模型'),
    (r'协议.*要素|语法.*语义.*时序|协议三要素', '网络协议'),
    (r'三网融合', '网络分类'),
    (r'广域网.*城域网.*局域网|LAN.*MAN.*WAN', '网络分类'),
    (r'总线.*结构|星型.*结构|环型.*结构|网状.*结构|网络拓扑', '网络拓扑结构'),

    # Chapter 2: Physical Layer
    (r'多路复用|频分|时分|波分|码分|FDM|TDM|WDM|CDMA', '信道复用技术'),
    (r'双绞线|UTP|STP|5类|超5类|6类|RJ-45', '物理层传输介质'),
    (r'同轴电缆|光纤|光缆|单模|多模', '物理层传输介质'),
    (r'调制解调器|ADSL|HFC|Cable.*Modem|机顶盒', '物理层设备'),
    (r'中继器|集线器|HUB|hub', '物理层设备'),
    (r'曼彻斯特|差分曼彻斯特|归零码|不归零码|PCM编码|数字数据编码|编码技术', '数据编码技术'),
    (r'基带|宽带|带宽.*信道|奈奎斯|香农', '信道容量与带宽'),
    (r'单工|半双工|全双工|通信方式', '通信方式'),
    (r'10BASE|100BASE|1000BASE|以太网.*标准|IEEE802\.3|IEEE 802\.3', '以太网标准'),

    # Chapter 3: Data Link Layer
    (r'CSMA/CD|CSMA.*CD|冲突检测|载波侦听', 'CSMA/CD协议'),
    (r'CSMA/CA', 'CSMA/CA协议'),
    (r'CRC|循环冗余|校验码|差错控制编码|海明码|FEC|ARQ|检错码|纠错码', '差错控制技术'),
    (r'MAC地址|MAC.*地址|物理地址.*硬件地址|网卡.*地址', 'MAC地址与物理地址'),
    (r'以太网(?!标准)(?!地址)', 'CSMA/CD协议'),
    (r'帧中继|Frame.*Relay|FR', '广域网技术'),
    (r'HDLC|LAPB|LAPD|LAPF', '广域网技术'),
    (r'PPP(?!协议)|SLIP', '广域网技术'),
    (r'网桥', '数据链路层设备'),
    (r'交换机|二层交换|交换式局域网|以太网交换机', '数据链路层设备'),
    (r'VLAN|虚拟局域网', 'VLAN技术'),
    (r'PPP协议|点对点协议', 'PPP协议'),
    (r'令牌环|令牌总线|FDDI|IEEE802\.5|IEEE802\.4', '令牌环网'),
    (r'GBN|后退N帧|Go.*Back.*N', 'GBN协议'),
    (r'SR协议|选择重传|Selective', 'SR协议'),
    (r'二进制指数退避|退避算法|冲突.*退避', 'CSMA/CD协议'),

    # Chapter 4: Network Layer
    (r'IP地址.*分类|A类.*B类.*C类|A类地址|B类地址|C类地址|A类IP|B类IP|C类IP',
     'IP地址分类'),
    (r'子网|子网掩码|CIDR|子网划分|掩码', '子网划分与路由算法'),
    (r'IP数据报|IP分组|IP报文|分片|IP数据', 'IP数据报分片'),
    (r'ICMP|PING|ping|网际控制|网际控制协议', 'ICMP协议'),
    (r'ARP|RARP|地址解析', 'ARP协议'),
    (r'路由选择|路由协议|路由表|RIP|OSPF|BGP|距离向量|路由.*协议|静态路由|动态路由',
     '路由算法与协议'),
    (r'NAT|网络地址转换', 'NAT协议'),
    (r'IPv6|IPv4|IP协议版本', 'IPv4/IPv6协议'),
    (r'广播地址|组播|多播|224\.|D类地址', 'IP地址分类'),
    (r'路由器(?!.*交换)(?!.*距离)|三层交换|路由.*转发', '网络层设备'),
    (r'虚电路|数据报|电路交换|分组交换|报文交换', '数据交换技术'),
    (r'私有地址|私网地址|10\.0\.|172\.16\.|192\.168\.', 'IP地址分类'),

    # Chapter 5: Transport Layer
    (r'TCP协议|TCP.*特点|TCP.*连接|TCP.*可靠|TCP.*面向|传输控制协议', 'TCP/UDP协议'),
    (r'UDP|用户数据报', 'TCP/UDP协议'),
    (r'三次握手|握手|SYN|连接建立|TCP.*建立', 'TCP三次握手/四次挥手'),
    (r'四次挥手|FIN|连接释放|TCP.*释放|TCP.*断开', 'TCP三次握手/四次挥手'),
    (r'拥塞控制|慢开始|拥塞避免|快重传|快恢复|ssthresh|cwnd', 'TCP拥塞控制'),
    (r'流量控制|滑动窗口|rwnd|窗口', 'TCP流量控制'),
    (r'端口|端口号|套接字|socket', 'TCP/UDP协议'),
    (r'运输层|传输层(?!.*协议)(?!.*设备)|TCP/IP.*层次', 'TCP/UDP协议'),
    (r'面向连接|无连接|可靠传输|停止.*等待|停等协议', '可靠传输技术'),
    (r'校验和|UDP.*校验', 'UDP校验和'),

    # Chapter 6: Application Layer
    (r'DNS|域名(?!.*MAC)|域名解析|域名系统|域名服务器|域名地址|域名.*转换|域名.*映射',
     'DNS协议'),
    (r'HTTP|WWW|万维网|浏览器|URL|网页|HTML|超文本|http|web页|WEB', 'HTTP协议'),
    (r'FTP|文件传输(?!协议)', '文件传输协议'),
    (r'SMTP|电子邮件|E.*mail|POP3|IMAP|邮箱|邮件服务器|邮件|SMTP|POP', '电子邮件协议'),
    (r'TELNET|远程登录|远程终端', '远程登录协议'),
    (r'SNMP|网络管理', '网络管理协议'),
    (r'DHCP', '应用层协议'),
    (r'BBS|电子公告|电子布告', '应用层协议'),
    (r'ISP|因特网服务', '应用层协议'),

    # 408 subject keywords
    (r'数据结构|二叉树|链表|图.*算法|栈|队列|排序|查找|折半查找|B树|B\+树|哈夫曼|散列|哈希|哈希表|拓扑排序|KMP|next数组|败者树|归并段|堆|大根堆|小根堆|完全二叉树|邻接矩阵|邻接表|最小生成树|最短路径|普里姆|克鲁斯卡尔|快速排序|归并排序|堆排序|希尔排序|基数排序|冒泡排序|插入排序|选择排序|有向图|无向图|森林|二叉树|二叉搜索树|二叉排序树|平衡二叉树|AVL|红黑树|稀疏矩阵|三元组|广义表', '数据结构'),
    (r'计算机组成原理|指令.*流水线|CPU|cache|Cache|TLB|MMU|主存|内存.*管理|总线|DMA|中断|I/O|浮点|补码|原码|反码|流水线|ALU|寄存器|微程序|微指令|RISC|CISC|指令系统|寻址方式|立即数|相对寻址|程序计数器|PC|内存.*地址|虚拟.*地址|物理.*地址|页表|页式.*存储|段式.*存储|虚拟存储|缺页|IEEE754|机器数|机器码|主频|CPI|MIPS|GIPS|存储器|磁盘|RAID|Cache.*映射|Cache.*写|组相联|全相联|直接映射|写回|写直达|指令.*格式|定长指令|变长指令|操作数|控制器|数据通路|冒险|旁路|转发|阻塞|流水线.*数据', '计算机组成原理'),
    (r'操作系统|进程|线程|死锁|内存管理|文件系统|页式|段式|虚拟内存|虚拟页式|磁盘.*调度|进程调度|时间片|RR调度|优先权|信号量|PV操作|wait.*signal|临界区|互斥|同步|系统调用|内核态|用户态|PCB|进程控制块|缺页异常|缺页.*处理|页面置换|LRU|FIFO|OPT|CLOCK|伙伴算法|位图|文件.*打开|文件.*关闭|文件.*读写|文件.*系统调用|文件.*目录|索引节点|inode|FAT|文件分配表|空闲块|外存|I/O.*控制|程序查询|中断驱动|SPOOLing|设备.*独立性|设备.*驱动|磁盘.*臂|磁盘.*寻道|CSCAN|SCAN|C-SCAN|SSTF|FCFS|VFS|虚拟文件系统|内存映射|mmap', '操作系统'),
]

SUBJECT_408 = {
    '数据结构': ['线性表', '链表', '栈', '队列', '树', '二叉树', '图', '查找', '排序', 'B树', '哈夫曼', '散列', '哈希', '拓扑', 'KMP', 'next', '败者树', '归并段', '堆', '完全二叉树', '邻接矩阵', '邻接表', '最小生成树', '最短路径', '普里姆', '克鲁斯卡尔', '快速排序', '归并排序', '堆排序', '希尔排序', '基数排序', '冒泡排序', '插入排序', '选择排序', '有向图', '无向图', '森林', '二叉搜索树', '二叉排序树', '平衡二叉树', 'AVL', '红黑树', '稀疏矩阵', '三元组', '广义表', '折半', '二分查找'],
    '计算机组成原理': ['指令', '流水线', 'CPU', 'cache', 'Cache', 'TLB', 'MMU', '主存', '总线', 'DMA', '中断', 'I/O', '浮点', '补码', '原码', '反码', 'ALU', '寄存器', '微程序', '微指令', 'RISC', 'CISC', '指令系统', '寻址方式', '立即数', '相对寻址', '程序计数器', 'PC', '存储器', '磁盘', 'RAID', 'IEEE754', '机器数', '机器码', '主频', 'CPI', 'MIPS', 'GIPS', '海明', '数据通路', '冒险', '旁路', '转发', '字长', '编址', '地址线', '数据线'],
    '操作系统': ['进程', '线程', '死锁', '文件系统', '虚拟内存', '虚拟页式', '磁盘调度', '进程调度', '时间片', 'RR调度', '优先权', '信号量', 'PV操作', 'wait', 'signal', '临界区', '互斥', '同步', '系统调用', '内核态', '用户态', 'PCB', '进程控制块', '缺页异常', '缺页', '页面置换', 'LRU', 'FIFO', 'OPT', 'CLOCK', '伙伴算法', '位图', '索引节点', 'inode', 'FAT', '文件分配表', '空闲块', '外存', 'SPOOLing', 'CSCAN', 'SCAN', 'SSTF', 'FCFS', 'VFS', '虚拟文件系统', '内存映射', 'mmap', '驱动程序', '键盘中断'],
    '计算机网络': ['OSI', 'TCP', 'UDP', 'IP', 'HTTP', 'DNS', 'FTP', 'SMTP', 'POP3', 'ICMP', 'ARP', 'RARP', 'CSMA', '以太网', '令牌', 'FDDI', 'VLAN', 'NAT', 'IPv4', 'IPv6', '子网', 'CIDR', '路由', 'RIP', 'OSPF', 'BGP', '拥塞控制', '流量控制', '三次握手', '端口', '曼彻斯特', '调制', '解调', 'ADSL', 'HFC', 'DHCP', 'SNMP', 'TELNET', 'WWW', 'URL', 'CRC', '校验', 'GBN', '选择重传', '停等', 'RTT', 'MSS', '吞吐量', '二进制指数退避', 'FSK', 'ASK', 'PSK', 'DPSK', 'UDP校验', 'POP', 'IMAP', 'Cable', 'Modem', '帧中继', 'HDLC', 'PPP', '10Base', '100Base', '网桥', '交换机', '路由器', '集线器', '中继器', '网关', '组播', '广播'],
}


def resolve_kp(stem):
    """Map question stem to knowledge point name based on keywords."""
    for pattern, kp_name in KP_KEYWORDS:
        if re.search(pattern, stem, re.IGNORECASE):
            return kp_name
    return '计算机网络基础'


def resolve_408_subject(stem):
    """Determine which 408 subject a question belongs to."""
    for subject, keywords in SUBJECT_408.items():
        for kw in keywords:
            if kw in stem:
                return subject
    return '计算机网络'


# ============================================================
# Question data class
# ============================================================
class Question:
    def __init__(self, stem, question_type, answer, options=None, analysis=None,
                 knowledge_points=None, difficulty='MEDIUM', source=''):
        self.stem = stem
        self.question_type = question_type
        self.answer = answer
        self.options = options or []
        self.analysis = analysis
        self.knowledge_points = knowledge_points
        self.difficulty = difficulty
        self.source = source

    def to_content_json(self):
        # Truncate very long stems (comprehensive questions with full code listings)
        stem = self.stem
        if len(stem) > 2000:
            stem = stem[:2000] + '...（题目内容过长，已截断）'

        # Clean markdown tables and HTML from stem
        stem = re.sub(r'\|[^|]+\|', ' ', stem)  # Remove markdown table rows
        stem = re.sub(r'<br/?>', ' ', stem)  # Remove <br> tags
        stem = re.sub(r'&nbsp;', ' ', stem)  # Remove &nbsp;
        # Replace literal double quotes with Chinese quotes to avoid JSON issues
        stem = stem.replace('"', '“').replace('"', '”')
        stem = stem.replace('"', '“').replace('"', '”')
        stem = clean_text(stem)
        stem = re.sub(r'\\+$', '', stem)

        obj = {"stem": stem}
        if self.options:
            clean_opts = []
            for o in self.options:
                ot = clean_text(re.sub(r'<br/?>', ' ', o['text']))
                ot = ot.replace('"', '“').replace('"', '”')
                ot = re.sub(r'\\+$', '', ot)
                clean_opts.append({'label': o['label'], 'text': ot})
            obj["options"] = clean_opts

        # Clean answer - remove problematic markdown backslash sequences
        answer = self.answer
        answer = re.sub(r'\\[_\*]', '', answer)  # Remove \_ and \* markdown escapes
        answer = answer.replace('"', '“').replace('"', '”')
        answer = clean_text(answer)
        obj["answer"] = answer

        if self.analysis:
            analysis = clean_text(self.analysis[:2000])
            analysis = analysis.replace('"', '“').replace('"', '”')
            analysis = re.sub(r'\\+$', '', analysis)
            obj["analysis"] = analysis

        return json.dumps(obj, ensure_ascii=False)

    def to_sql(self, course_var='@net_course_id'):
        content_json = self.to_content_json()
        kp = self.knowledge_points or resolve_kp(self.stem)
        ai = 0
        status = 'APPROVED'
        # Escape for SQL: backslashes FIRST, then single quotes
        content_escaped = content_json.replace('\\', '\\\\').replace("'", "\\'")
        kp_escaped = (kp or '').replace('\\', '\\\\').replace("'", "\\'")
        stem_preview = self.stem[:60].replace('\\', '\\\\').replace("'", "\\'")

        return (
            f"INSERT INTO `t_question_bank` "
            f"(`course_id`, `teacher_id`, `question_type`, `difficulty`, `content`, "
            f"`knowledge_points`, `ai_generated`, `status`, `create_time`) VALUES (\n"
            f"  {course_var}, @teacher_id, '{self.question_type}', '{self.difficulty}',\n"
            f"  '{content_escaped}',\n"
            f"  '{kp_escaped}', {ai}, '{status}', NOW()\n"
            f"); -- {self.source}: {stem_preview}\n"
        )


def clean_text(text):
    if not text:
        return ''
    # Remove markdown escape sequences
    text = re.sub(r'\\[_*]', '', text)  # \_ \* escapes
    text = re.sub(r'\\{2,}', '\\\\', text)  # Normalize multiple backslashes
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def parse_option_line(line):
    """Parse option labels and text from a line."""
    options = []
    # Split by option label pattern but keep label with text
    pattern = r'(?<=[;；\s])(?=[A-H][.、\s])'
    parts = re.split(pattern, line)

    for part in parts:
        part = part.strip().rstrip(';；')
        if not part:
            continue
        match = re.match(r'^([A-H])[.、\s]\s*(.*)', part)
        if match:
            label = match.group(1)
            text = match.group(2).strip()
            text = re.sub(r'[;；]\s*$', '', text)
            if text and len(text) > 0:
                options.append({'label': label, 'text': clean_text(text)})
        elif re.match(r'^[A-H]$', part):
            pass
        elif options:
            options[-1]['text'] += ' ' + clean_text(part)

    return options


# ============================================================
# Parser: 计算机网络试题库含答案2026.md
# ============================================================
def parse_network_quiz_bank(filepath):
    print(f"\n{'='*60}")
    print(f"Parsing: 计算机网络试题库含答案2026.md")

    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    questions = []
    lines = text.split('\n')
    section = None

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Detect section headers
        if re.match(r'^#\s*多项选择题\s*$', line):
            section = 'MULTI'
            i += 1; continue
        elif re.match(r'^#\s*填空题\s*$', line):
            section = 'FILL'
            i += 1; continue
        elif re.match(r'^#\s*判断题\s*$', line):
            section = 'TRUE_FALSE'
            i += 1; continue
        elif re.match(r'^#\s*简答题\s*$', line):
            section = 'SHORT'
            i += 1; continue
        elif re.match(r'^#\s*\d*单项选择题\s*$', line):
            section = 'SINGLE'
            i += 1; continue
        elif re.match(r'^#\s', line):
            section = None
            i += 1; continue

        # Parse by section
        if section == 'SINGLE':
            q, i = parse_quiz_single(lines, i)
            if q: questions.append(q)
            else: i += 1
        elif section == 'MULTI':
            q, i = parse_quiz_multi(lines, i)
            if q: questions.append(q)
            else: i += 1
        elif section == 'FILL':
            q, i = parse_quiz_fill(lines, i)
            if q: questions.append(q)
            else: i += 1
        elif section == 'TRUE_FALSE':
            q, i = parse_quiz_tf(lines, i)
            if q: questions.append(q)
            else: i += 1
        elif section == 'SHORT':
            q, i = parse_quiz_short(lines, i)
            if q: questions.append(q)
            else: i += 1
        else:
            i += 1

    # Set source for all
    for q in questions:
        q.source = '计算机网络试题库含答案2026'

    print(f"  Parsed {len(questions)} questions")
    types = {}
    for q in questions: types[q.question_type] = types.get(q.question_type, 0) + 1
    for t, c in sorted(types.items()): print(f"    {t}: {c}")
    return questions


def extract_answer_from_stem(stem):
    """Extract answer letter(s) from stem. Returns (answer, cleaned_stem)."""
    # Try （A）, （ B ）, （AB）, （B D）, [AC], etc.
    for pat, is_multi in [
        (r'[（(]\s*([A-H])\s*[）)]', False),
        (r'[（(]\s*([A-H]\s+[A-H](?:\s+[A-H])*)\s*[）)]', True),
        (r'[（(]\s*([A-H]{2,4})\s*[）)]', True),
        (r'[\[［]\s*([A-H]{1,4})\s*[\]］]', True),
    ]:
        m = re.search(pat, stem)
        if m:
            ans = m.group(1)
            if is_multi:
                ans = re.sub(r'\s+', '', ans)  # Remove spaces: "B D" -> "BD"
            stem = stem[:m.start()] + stem[m.end():]
            return ans.strip(), stem.strip()
    return None, stem


def parse_quiz_single(lines, start_i):
    """Parse single choice question from quiz bank."""
    if start_i >= len(lines): return None, start_i

    line = lines[start_i].strip()
    if not line.startswith('##'): return None, start_i

    stem = line[2:].strip()
    if not stem: return None, start_i + 1

    answer, stem = extract_answer_from_stem(stem)
    if not answer: return None, start_i + 1

    # Read options
    options = []
    j = start_i + 1
    while j < len(lines) and j < start_i + 15:
        oline = lines[j].strip()
        if oline.startswith('##') or oline.startswith('# ') or oline == '':
            if options: break
            j += 1; continue

        parsed = parse_option_line(oline)
        if parsed:
            options.extend(parsed)
        elif options and oline:
            options[-1]['text'] += ' ' + oline
        j += 1
        if len(options) >= 4: break

    # Deduplicate and filter
    seen = set()
    clean_opts = []
    for o in options:
        if o['label'] in 'ABCD' and o['label'] not in seen:
            seen.add(o['label'])
            clean_opts.append(o)

    stem = clean_text(stem)
    if not stem or len(clean_opts) < 2: return None, j

    return Question(stem=stem, question_type='SINGLE', answer=answer,
                    options=clean_opts, difficulty='EASY' if len(stem) < 20 else 'MEDIUM'), j


def parse_quiz_multi(lines, start_i):
    """Parse multiple choice question from quiz bank."""
    if start_i >= len(lines): return None, start_i

    line = lines[start_i].strip()
    if not line.startswith('##'): return None, start_i

    stem = line[2:].strip()
    if not stem: return None, start_i + 1

    answer, stem = extract_answer_from_stem(stem)
    if not answer or len(answer) < 2: return None, start_i + 1

    options, j = collect_options(lines, start_i)
    stem = clean_text(stem)
    if not stem: return None, j

    analysis = None
    # Check for analysis lines after options
    for k in range(j, min(j + 5, len(lines))):
        if lines[k].strip().startswith('解析'):
            analysis = clean_text(lines[k].strip())

    return Question(stem=stem, question_type='MULTI', answer=answer,
                    options=options, analysis=analysis), j


def collect_options(lines, start_i):
    """Collect option lines until next ## or empty line after options."""
    options = []
    j = start_i + 1
    while j < len(lines) and j < start_i + 15:
        oline = lines[j].strip()
        if oline.startswith('##') or oline.startswith('# '):
            if options: break
            j += 1; continue
        if oline == '' and options: break
        if oline == '':
            j += 1; continue

        parsed = parse_option_line(oline)
        if parsed:
            options.extend(parsed)
        elif options and oline:
            options[-1]['text'] += ' ' + oline
        j += 1

    seen = set()
    clean_opts = []
    for o in options:
        if o['label'] not in seen:
            seen.add(o['label'])
            clean_opts.append(o)
    return clean_opts, j


def parse_quiz_fill(lines, start_i):
    """Parse fill-in-blank from quiz bank."""
    if start_i >= len(lines): return None, start_i

    line = lines[start_i].strip()
    if not line or line.startswith('#'): return None, start_i + 1

    # Must be numbered
    m = re.match(r'^(\d{1,3})[\.\s、]+(.*)', line)
    if not m: return None, start_i + 1

    stem = m.group(2)
    if not stem or len(stem) < 5: return None, start_i + 1

    # Extract answers from various formats
    answers = []

    # （answer） or (answer)
    for a in re.findall(r'[（(]\s*([^（）()]{1,60}?)\s*[）)]', stem):
        a = clean_text(a)
        if len(a) > 1 and not re.match(r'^[A-Z]{2,}(/[A-Z]+)*$', a):
            answers.append(a)

    # **answer**
    if not answers:
        for a in re.findall(r'\*{2}([^*]+?)\*{2}', stem):
            a = clean_text(a)
            if len(a) > 1: answers.append(a)

    # ___answer___
    if not answers:
        for a in re.findall(r'_{1,2}\s*(\S[^_]*?\S)\s*_{1,2}', stem):
            a = clean_text(a)
            if len(a) > 1: answers.append(a)

    # Whitespace-separated answers embedded in text
    if not answers:
        # Try finding space-separated phrases after key patterns
        parts = re.split(r'[（(][^）)]*[）)]|__.*?__', stem)
        # Just use common patterns
        inline = re.findall(r'(?:是|为|称为|即|有|包括|如|分为|概括为|概括)\s+(.{3,40}?)(?:[。，；\s]|$)', stem)
        for a in inline:
            a = clean_text(a)
            if a and len(a) > 1 and not re.match(r'^[A-Z]+$', a):
                answers.append(a)

    if not answers: return None, start_i + 1

    answer = '；'.join(answers)
    # Clean stem
    stem = re.sub(r'[（(]\s*[\w一-鿿\s\-+/*.]{1,60}?\s*[）)]', '（  ）', stem)
    stem = re.sub(r'\*{2}[^*]+?\*{2}', '___', stem)
    stem = re.sub(r'_{1,2}\s*\S[^_]*?\S\s*_{1,2}', '___', stem)
    stem = clean_text(stem)

    return Question(stem=stem, question_type='FILL', answer=answer, difficulty='MEDIUM'), start_i + 1


def parse_quiz_tf(lines, start_i):
    """Parse true/false from quiz bank."""
    if start_i >= len(lines): return None, start_i

    line = lines[start_i].strip()
    stem = line[2:].strip() if line.startswith('##') else line
    if not stem: return None, start_i + 1

    # Check for T/F markers
    tf_match = re.search(r'[（(]\s*([RrTtFfEe√×])\s*[）)]', stem)
    if not tf_match:
        tf_match = re.search(r'[（(]\s*(正确|错误)\s*[）)]', stem)

    if not tf_match: return None, start_i + 1

    marker = tf_match.group(1)
    is_true = marker.upper() in ('R', 'T', '√') or marker == '正确'
    stem = stem[:tf_match.start()] + stem[tf_match.end():]

    # If multiple T/F markers in one line, this is a compound question
    remaining = re.findall(r'[（(]\s*([RrTtFfEe√×正确错误])\s*[）)]', stem)
    if remaining:
        # Multiple T/F items - parse as single question with sub-items
        pass

    stem = clean_text(stem)
    if not stem or len(stem) < 3: return None, start_i + 1

    return Question(stem=stem, question_type='SINGLE',
                    answer='A' if is_true else 'B',
                    options=[{'label': 'A', 'text': '正确'}, {'label': 'B', 'text': '错误'}],
                    difficulty='EASY'), start_i + 1


def parse_quiz_short(lines, start_i):
    """Parse short answer from quiz bank."""
    if start_i >= len(lines): return None, start_i

    line = lines[start_i].strip()
    if not line.startswith('##'): return None, start_i

    stem = line[2:].strip()
    if not stem or len(stem) < 5: return None, start_i + 1

    # Extract answer from next lines
    j = start_i + 1
    answer_lines = []
    while j < len(lines) and j < start_i + 25:
        nline = lines[j].strip()
        if nline.startswith('##') or nline.startswith('# '):
            if answer_lines: break
            j += 1; continue

        if nline.startswith('答：') or nline.startswith('答:') or nline.startswith('答案'):
            answer_lines.append(re.sub(r'^(答|答案)[：:]\s*', '', nline))
        elif answer_lines:
            if nline == '' and j + 1 < len(lines) and not lines[j + 1].strip():
                break
            answer_lines.append(nline)
        j += 1

    if not answer_lines: return None, j

    answer = clean_text(' '.join(answer_lines))
    stem = clean_text(stem)

    return Question(stem=stem, question_type='SHORT', answer=answer,
                    difficulty='HARD'), j


# ============================================================
# Parser: 计算机网络基础试题(十套试卷-附答案).md
# ============================================================
def parse_exam_sets(filepath):
    print(f"\n{'='*60}")
    print(f"Parsing: 计算机网络基础试题(十套试卷-附答案).md")

    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    questions = []
    lines = text.split('\n')
    current_exam = None
    current_section = None

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Exam header: **计算机网络试题《N》**
        m = re.match(r'\*{0,2}计算机网络试题[《〈]([^》〉]+)[》〉]\*{0,2}', line)
        if m:
            current_exam = m.group(1)
            current_section = None
            i += 1; continue

        # Section headers
        if re.search(r'单项选择题|单选题', line) and not re.match(r'^\d', line):
            current_section = 'SINGLE'
            i += 1; continue
        elif re.search(r'多项选择题|多选题', line) and not re.match(r'^\d', line):
            current_section = 'MULTI'
            i += 1; continue
        elif re.search(r'填空题', line) and not re.match(r'^\d', line):
            current_section = 'FILL'
            i += 1; continue
        elif re.search(r'判断题', line) and not re.match(r'^\d', line):
            current_section = 'TRUE_FALSE'
            i += 1; continue
        elif re.search(r'简答题|综合题|论述题|问答题|名词解释|概念解释', line) and not re.match(r'^\d', line):
            current_section = 'SHORT'
            i += 1; continue
        elif re.match(r'^[一二三四五六七八九十]、', line):
            i += 1; continue
        elif re.match(r'^答案', line) or re.search(r'参考答案', line):
            current_section = None
            i += 1; continue

        # Parse based on section
        src = f'计算机网络基础试题{current_exam}' if current_exam else '计算机网络基础试题'
        if current_section == 'SINGLE':
            q, i = parse_exam_single(lines, i, src)
            if q: questions.append(q)
            else: i += 1
        elif current_section == 'MULTI':
            q, i = parse_exam_multi(lines, i, src)
            if q: questions.append(q)
            else: i += 1
        elif current_section == 'FILL':
            q, i = parse_exam_fill(lines, i, src)
            if q: questions.append(q)
            else: i += 1
        elif current_section == 'TRUE_FALSE':
            q, i = parse_exam_tf(lines, i, src)
            if q: questions.append(q)
            else: i += 1
        elif current_section == 'SHORT':
            q, i = parse_exam_short(lines, i, src)
            if q: questions.append(q)
            else: i += 1
        else:
            i += 1

    print(f"  Parsed {len(questions)} questions")
    types = {}
    for q in questions: types[q.question_type] = types.get(q.question_type, 0) + 1
    for t, c in sorted(types.items()): print(f"    {t}: {c}")
    return questions


def parse_exam_single(lines, start_i, source):
    """Parse single choice from exam sets."""
    if start_i >= len(lines): return None, start_i

    line = lines[start_i].strip()
    if not line: return None, start_i

    # Numbered question: "01." or "1." or "1、" or "1．"
    m = re.match(r'^(\d{1,3})[\.、．\s）)]+\*?\*?(.*)', line)
    if not m: return None, start_i

    stem = m.group(2).strip()
    if not stem or len(stem) < 3: return None, start_i

    # Extract embedded answer: （A）, _A_, etc.
    answer = None
    ans_m = re.search(r'[（(]\s*_\s*([A-D])\s*_\s*[）)]', stem)  # _（B）_
    if not ans_m:
        ans_m = re.search(r'[（(]\s*([A-D])\s*[）)]', stem)  # （A）
    if not ans_m:
        ans_m = re.search(r'_\s*_\s*([A-D])\s*_\s*_', stem)  # _ _A_ _
    if ans_m:
        answer = ans_m.group(1)
        stem = stem[:ans_m.start()] + stem[ans_m.end():]

    # Collect options from subsequent lines
    options, j = collect_options(lines, start_i)

    stem = clean_text(stem)
    if not stem: return None, j

    if len(options) < 2:
        # Create placeholder options
        options = [{'label': l, 'text': f'选项{l}'} for l in 'ABCD']

    if not answer:
        answer = '?'  # Unknown

    return Question(stem=stem, question_type='SINGLE', answer=answer,
                    options=options, difficulty='EASY' if len(stem) < 25 else 'MEDIUM',
                    source=source), j


def parse_exam_multi(lines, start_i, source):
    """Parse multiple choice from exam sets."""
    if start_i >= len(lines): return None, start_i

    line = lines[start_i].strip()
    m = re.match(r'^(\d{1,3})[\.、．\s）)]+(.*)', line)
    if not m: return None, start_i

    stem = m.group(2).strip()
    if not stem or len(stem) < 3: return None, start_i

    answer = None
    ans_m = re.search(r'[（(]\s*([A-D]{2,4})\s*[）)]', stem)
    if ans_m:
        answer = ans_m.group(1)
        stem = stem[:ans_m.start()] + stem[ans_m.end():]

    options, j = collect_options(lines, start_i)
    stem = clean_text(stem)
    if not stem or len(options) < 2: return None, j

    return Question(stem=stem, question_type='MULTI', answer=answer or '?',
                    options=options, source=source), j


def parse_exam_fill(lines, start_i, source):
    """Parse fill-in from exam sets."""
    if start_i >= len(lines): return None, start_i

    line = lines[start_i].strip()
    if not line: return None, start_i

    m = re.match(r'^(\d{1,3})[\.、．\s]+(.*)', line)
    if not m: return None, start_i

    stem = m.group(2).strip()
    if not stem or len(stem) < 5: return None, start_i

    answers = []
    # （answer）
    for a in re.findall(r'[（(]\s*([^（）()]{1,60}?)\s*[）)]', stem):
        a = clean_text(a)
        if len(a) > 1 and not re.match(r'^[A-Z]{2,}(/[A-Z]+)*$', a):
            answers.append(a)

    # Embedded bold/underline answers
    for a in re.findall(r'\*{2}([^*]+?)\*{2}', stem):
        a = clean_text(a)
        if len(a) > 1: answers.append(a)

    # Detect answers separated by spaces or Chinese commas
    if not answers:
        # Answers might be inline without parens: "是XXX、YYY和ZZZ"
        for a in re.findall(r'(?:是|为|称为|即|包括|如|分为|概括为|有|分成|可以分成)\s+(.{2,50}?)(?:[。，；]|$)', stem):
            answers.append(clean_text(a))

    if not answers: return None, start_i + 1

    answer = '；'.join(answers)
    stem = clean_text(stem)

    return Question(stem=stem, question_type='FILL', answer=answer,
                    difficulty='MEDIUM', source=source), start_i + 1


def parse_exam_tf(lines, start_i, source):
    """Parse true/false from exam sets."""
    if start_i >= len(lines): return None, start_i

    line = lines[start_i].strip()
    if not line: return None, start_i

    m = re.match(r'^(\d{1,3})[\.、．\s]+(.*)', line)
    if not m: return None, start_i

    stem = m.group(2).strip()
    if not stem: return None, start_i

    is_true = None
    if re.search(r'[（(]\s*[√RrTt]\s*[）)]', stem):
        is_true = True
        stem = re.sub(r'[（(]\s*[√RrTt]\s*[）)]', '', stem)
    elif re.search(r'[（(]\s*[×EeFf]\s*[）)]', stem):
        is_true = False
        stem = re.sub(r'[（(]\s*[×EeFf]\s*[）)]', '', stem)
    elif re.search(r'[（(]\s*正确\s*[）)]', stem):
        is_true = True
        stem = re.sub(r'[（(]\s*正确\s*[）)]', '', stem)
    elif re.search(r'[（(]\s*错误\s*[）)]', stem):
        is_true = False
        stem = re.sub(r'[（(]\s*错误\s*[）)]', '', stem)

    stem = clean_text(stem)
    if not stem or len(stem) < 3: return None, start_i + 1

    if is_true is None: return None, start_i + 1

    return Question(stem=stem, question_type='SINGLE',
                    answer='A' if is_true else 'B',
                    options=[{'label': 'A', 'text': '正确'}, {'label': 'B', 'text': '错误'}],
                    difficulty='EASY', source=source), start_i + 1


def parse_exam_short(lines, start_i, source):
    """Parse short answer from exam sets."""
    if start_i >= len(lines): return None, start_i

    line = lines[start_i].strip()
    if not line: return None, start_i

    m = re.match(r'^(\d{1,3})[\.、．\s]+(.*)', line)
    if not m: return None, start_i

    stem = m.group(2).strip()
    if not stem or len(stem) < 5: return None, start_i

    # Try to find answer
    j = start_i + 1
    answer_lines = []
    while j < len(lines) and j < start_i + 20:
        nline = lines[j].strip()
        if re.match(r'^(\d{1,3})[\.、．\s]', nline): break
        if re.search(r'^(一|二|三|四|五)[、.]', nline): break
        if nline.startswith('答：') or nline.startswith('答:'):
            answer_lines.append(re.sub(r'^(答)[：:]\s*', '', nline))
        elif answer_lines:
            if nline == '' and j + 1 < len(lines) and not lines[j + 1].strip(): break
            answer_lines.append(nline)
        elif nline and not nline.startswith('#') and len(nline) > 15:
            answer_lines.append(nline)
        j += 1
        if answer_lines and j < len(lines) and not lines[j].strip(): break

    if not answer_lines: return None, j

    answer = clean_text(' '.join(answer_lines))
    stem = clean_text(stem)

    return Question(stem=stem, question_type='SHORT', answer=answer,
                    difficulty='HARD', source=source), j


# ============================================================
# Parser: 2023/2024/2025 408 Exam Papers
# ============================================================
def parse_408_both_2023():
    """Parse 2023 408 exam from both question file and analysis file."""
    qfile = os.path.join(DOCS_DIR, '2023年计算机408统考真题.md')
    afile = os.path.join(DOCS_DIR, '2023年计算机408统考真题解析.md')

    if not os.path.exists(qfile):
        print("WARNING: 2023 question file not found")
        return []

    if not os.path.exists(afile):
        print("WARNING: 2023 analysis file not found")
        return []

    print(f"\n{'='*60}")
    print(f"Parsing: 2023年408统考 (question + analysis files)")

    # Step 1: Extract answer map from analysis file
    with open(afile, 'r', encoding='utf-8') as f:
        atext = f.read()

    answer_map = {}
    analysis_map = {}

    # Parse the answer line: "01.D 02.C 03.A 04.B 05.A ..."
    for line in atext.split('\n'):
        line = line.strip()
        for m in re.finditer(r'(\d{1,2})[\.\s]+([A-D])(?=\s|\.|$|[A-Z])', line):
            qnum = int(m.group(1))
            ans = m.group(2)
            if qnum <= 47 and qnum not in answer_map:
                answer_map[qnum] = ans

    # Parse analysis: "01. D。【解析】...text..."
    for m in re.finditer(r'(\d{1,2})[\.\s]+([A-D])[.。\s]*[【\[]解析[】\]](.*?)(?=\d{1,2}[\.\s]+[A-D][.。\s]*[【\[]解析|$)', atext, re.DOTALL):
        qnum = int(m.group(1))
        analysis = m.group(3).strip()
        if qnum not in analysis_map:
            analysis_map[qnum] = analysis

    # Also try line-by-line analysis parsing
    for line in atext.split('\n'):
        line = line.strip()
        m = re.match(r'^(\d{1,2})[\.\s]+([A-D])[.。\s]*[【\[]解析[】\]](.*)', line)
        if m:
            qnum = int(m.group(1))
            if qnum not in analysis_map:
                analysis_map[qnum] = m.group(3).strip()

    print(f"  Found {len(answer_map)} answers, {len(analysis_map)} analyses")

    # Step 2: Parse questions from question file using a state machine approach
    with open(qfile, 'r', encoding='utf-8') as f:
        qtext = f.read()

    qlines = qtext.split('\n')
    questions = []

    # First pass: find all question start lines
    # Question numbers are 01-40 (single choice) and 41-47 (comprehensive)
    # Skip the instruction section (before real questions start)
    in_question_section = False
    question_starts = []
    for i, line in enumerate(qlines):
        line = line.strip()
        # Detect the real question section header
        if '单项选择题' in line and '01' in line:
            in_question_section = True
            continue
        if '综合应用题' in line:
            in_question_section = True
            continue
        if not in_question_section:
            continue

        # Match "01." or "01\. " at start of line
        m = re.match(r'^0?(\d{1,2})\\?[\.\s、]+(.+)$', line)
        if m:
            qnum = int(m.group(1))
            stem = m.group(2).strip()
            # Filter: valid range, Chinese chars, and NOT exam instruction keywords
            if 1 <= qnum <= 47 and re.search(r'[一-鿿]', stem):
                # Skip lines that are exam instructions, not actual questions
                skip_keywords = ['答题前', '考生须', '选择题的答案', '填.*写部分', '考试结束',
                               '考生编号', '考生姓名', '以下信息', '考生注意事项']
                is_instruction = any(re.search(kw, stem) for kw in skip_keywords)
                if not is_instruction:
                    question_starts.append((i, qnum, stem))

    # Deduplicate by question number (take the first occurrence)
    seen_nums = set()
    unique_starts = []
    for idx, qnum, stem in question_starts:
        if qnum not in seen_nums:
            seen_nums.add(qnum)
            unique_starts.append((idx, qnum, stem))

    print(f"  Found {len(unique_starts)} question starts")

    # Process each question
    for idx, qnum, stem_start in unique_starts:
        stem_lines = [stem_start]
        options = []
        j = idx + 1

        # Determine the next question's line index
        next_idx = None
        for nidx, nqnum, _ in unique_starts:
            if nqnum > qnum:
                next_idx = nidx
                break

        max_j = next_idx if next_idx else idx + 40

        while j < len(qlines) and j < max_j:
            nline = qlines[j].strip()

            # Collect options
            parsed = parse_option_line(nline)
            if parsed:
                options.extend(parsed)
            elif not parsed and not options and nline and '页' not in nline:
                # Continue stem - skip page markers
                if not re.match(r'^第\d+页', nline) and '考生' not in nline:
                    stem_lines.append(nline)
            elif options and nline and '页' not in nline:
                # Might be continuation of last option
                if nline and not re.match(r'^[A-H][.、\s]', nline):
                    options[-1]['text'] += ' ' + nline

            j += 1

        # Clean options - deduplicate
        seen = set()
        clean_opts = []
        for o in options:
            if o['label'] in 'ABCD' and o['label'] not in seen:
                seen.add(o['label'])
                clean_opts.append(o)

        # Build stem
        stem = clean_text(' '.join(stem_lines))

        # Get answer and analysis
        answer = answer_map.get(qnum, '')

        # Try to find analysis
        analysis = None
        if qnum in analysis_map:
            analysis = clean_text(analysis_map[qnum])
        else:
            # Search for analysis in surrounding text
            for k in range(idx, min(idx + 50, len(qlines))):
                aline = qlines[k].strip()
                if f'解析' in aline and qnum <= 40:
                    analysis = clean_text(aline)

        # Determine subject
        subject = resolve_408_subject(stem)

        if stem and len(stem) > 10:
            if len(clean_opts) < 2 and qnum <= 40:
                clean_opts = [{'label': l, 'text': f'选项{l}'} for l in 'ABCD']

            prefix = f'（2023年408统考第{qnum}题）'
            questions.append(Question(
                stem=prefix + stem,
                question_type='SINGLE' if qnum <= 40 else 'COMPREHENSIVE',
                answer=answer if answer else '?',
                options=clean_opts,
                analysis=analysis,
                knowledge_points=subject,
                difficulty='MEDIUM',
                source='2023年408统考真题'
            ))

    # Also parse comprehensive questions (41-47) from the analysis file
    # The analysis file has full answers for these
    comp_section = False
    comp_stem = []
    comp_answer = []
    comp_qnum = 0

    for line in atext.split('\n'):
        line = line.strip()
        m = re.match(r'^(\d{2})[\.\s]+[【\[]解析[】\]]', line)
        if m:
            qnum = int(m.group(1))
            if 41 <= qnum <= 47:
                # Save previous comprehensive question
                if comp_qnum >= 41 and comp_stem and comp_answer:
                    stem = clean_text(' '.join(comp_stem))
                    answer = clean_text(' '.join(comp_answer))
                    if stem and answer and not any(q.source == '2023年408统考真题' and f'第{comp_qnum}题' in q.stem for q in questions):
                        questions.append(Question(
                            stem=f'（2023年408统考第{comp_qnum}题）{stem}',
                            question_type='COMPREHENSIVE',
                            answer=answer,
                            options=[],
                            knowledge_points=resolve_408_subject(stem),
                            difficulty='HARD',
                            source='2023年408统考真题'
                        ))

                comp_qnum = qnum
                comp_stem = []
                comp_answer = []
                # Rest of line is stem
                rest = line[m.end():].strip()
                if rest:
                    comp_stem.append(rest)
                comp_section = True
                continue

        if comp_section and not re.match(r'^\d{2}[\.\s]', line):
            # Check if this is answer section
            if comp_answer or re.search(r'[（(]\d+[）)]', line):
                comp_answer.append(line)
            else:
                comp_stem.append(line)

    # Save last comprehensive question
    if comp_qnum >= 41 and comp_stem and comp_answer:
        stem = clean_text(' '.join(comp_stem))
        answer = clean_text(' '.join(comp_answer))
        if stem and answer and not any(q.source == '2023年408统考真题' and f'第{comp_qnum}题' in q.stem for q in questions):
            questions.append(Question(
                stem=f'（2023年408统考第{comp_qnum}题）{stem}',
                question_type='COMPREHENSIVE',
                answer=answer,
                options=[],
                knowledge_points=resolve_408_subject(stem),
                difficulty='HARD',
                source='2023年408统考真题'
            ))

    print(f"  Parsed {len(questions)} questions (including comprehensive)")
    return questions


def parse_408_2024():
    """Parse 2024 408 exam."""
    filepath = os.path.join(DOCS_DIR, '2024考研真题.md')
    if not os.path.exists(filepath):
        print("WARNING: 2024 exam file not found")
        return []

    print(f"\n{'='*60}")
    print(f"Parsing: 2024考研真题.md")

    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    lines = text.split('\n')
    questions = []

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        m = re.match(r'^(\d{1,2})[\.、\s]+(.+)$', line)
        if m and 1 <= int(m.group(1)) <= 47:
            qnum = int(m.group(1))
            stem_start = m.group(2).strip()

            if len(stem_start) < 5: i += 1; continue

            stem_lines = [stem_start]
            options = []
            j = i + 1

            while j < len(lines) and j < i + 30:
                nline = lines[j].strip()
                nm = re.match(r'^(\d{1,2})[\.、\s]', nline)
                if nm and int(nm.group(1)) in range(1, 48): break

                parsed = parse_option_line(nline)
                if parsed:
                    options.extend(parsed)
                elif not parsed and not options and nline and '2024' not in nline and '页' not in nline:
                    stem_lines.append(nline)
                elif options and nline and '页' not in nline:
                    options[-1]['text'] += ' ' + nline
                j += 1

            stem = clean_text(' '.join(stem_lines))
            seen = set()
            clean_opts = []
            for o in options:
                if o['label'] in 'ABCD' and o['label'] not in seen:
                    seen.add(o['label'])
                    clean_opts.append(o)

            # Look for answer from 皮皮灰 section
            answer = '?'
            for k in range(j, min(j + 50, len(lines))):
                kline = lines[k].strip()
                if f'{qnum}' in kline and '皮皮灰' in kline and len(kline) < 10:
                    # Answer is on this line: "74.【皮皮灰】D"
                    am = re.search(r'】([A-D])', kline)
                    if am:
                        answer = am.group(1)
                        break

            subject = resolve_408_subject(stem)

            if stem and len(stem) > 10:
                if len(clean_opts) < 2:
                    clean_opts = [{'label': l, 'text': f'选项{l}'} for l in 'ABCD']

                questions.append(Question(
                    stem=f'（2024年408统考第{qnum}题）{stem}',
                    question_type='SINGLE',
                    answer=answer,
                    options=clean_opts,
                    knowledge_points=subject,
                    difficulty='MEDIUM',
                    source='2024年408统考真题'
                ))

            i = j
            continue

        i += 1

    print(f"  Parsed {len(questions)} questions")
    return questions


def parse_408_2025():
    """Parse 2025 408 exam."""
    filepath = os.path.join(DOCS_DIR, '2025年408计算机考研真题及答案.md')
    if not os.path.exists(filepath):
        print("WARNING: 2025 exam file not found")
        return []

    print(f"\n{'='*60}")
    print(f"Parsing: 2025年408计算机考研真题及答案.md")

    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    lines = text.split('\n')
    questions = []

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        m = re.match(r'^(\d{1,2})[\.、\s]+(.+)$', line)
        if m and 1 <= int(m.group(1)) <= 47:
            qnum = int(m.group(1))
            stem_start = m.group(2).strip()

            if len(stem_start) < 5: i += 1; continue

            stem_lines = [stem_start]
            options = []
            j = i + 1

            while j < len(lines) and j < i + 30:
                nline = lines[j].strip()
                nm = re.match(r'^(\d{1,2})[\.、\s]', nline)
                if nm and int(nm.group(1)) in range(1, 48): break

                parsed = parse_option_line(nline)
                if parsed:
                    options.extend(parsed)
                elif not parsed and not options and nline:
                    stem_lines.append(nline)
                elif options and nline:
                    options[-1]['text'] += ' ' + nline
                j += 1

            stem = clean_text(' '.join(stem_lines))
            seen = set()
            clean_opts = []
            for o in options:
                if o['label'] in 'ABCD' and o['label'] not in seen:
                    seen.add(o['label'])
                    clean_opts.append(o)

            # Look for answer in nearby text
            answer = '?'
            # Search forward for "故正确答案为 X" or "【皮皮灰】X"
            for k in range(j, min(j + 40, len(lines))):
                kline = lines[k].strip()
                am = re.search(r'正确答案为\s*([A-D])', kline)
                if am: answer = am.group(1); break
                am = re.search(r'皮皮灰】([A-D])', kline)
                if am: answer = am.group(1); break
                am = re.search(r'【答案】.*?选\s*([A-D])', kline)
                if am: answer = am.group(1); break

            subject = resolve_408_subject(stem)

            if stem and len(stem) > 10:
                if len(clean_opts) < 2:
                    clean_opts = [{'label': l, 'text': f'选项{l}'} for l in 'ABCD']

                questions.append(Question(
                    stem=f'（2025年408统考第{qnum}题）{stem}',
                    question_type='SINGLE',
                    answer=answer,
                    options=clean_opts,
                    knowledge_points=subject,
                    difficulty='MEDIUM',
                    source='2025年408统考真题'
                ))

            i = j
            continue

        i += 1

    print(f"  Parsed {len(questions)} questions")
    return questions


# ============================================================
# SQL Generation
# ============================================================
def get_course_var(q):
    """Determine course based on knowledge points."""
    kp = (q.knowledge_points or '').lower()
    stem = q.stem.lower()

    ds_kw = ['数据结构', '二叉树', '链表', '图', '栈', '队列', '排序', '查找', '哈夫曼', '散列',
             '哈希', 'B树', 'B+树', '拓扑', 'KMP', 'next', '败者树', '归并段', '堆', '完全二叉树',
             '邻接矩阵', '邻接表', '最小生成树', '最短路径', '快速排序', '归并排序', '堆排序',
             '希尔排序', '基数排序', '冒泡', '插入排序', '选择排序', '有向图', '无向图',
             '森林', '二叉搜索', '二叉排序', '平衡二叉树', 'AVL', '红黑', '稀疏矩阵', '三元组',
             '折半查找', '二分查找', '哈夫曼', '算法']
    co_kw = ['计算机组成原理', '指令', '流水线', 'cpu', 'cache', 'tlb', 'mmu', '主存',
             '总线', 'dma', '中断', '浮点', '补码', '原码', '反码', 'alu', '寄存器',
             '微程序', '微指令', 'risc', 'cisc', '指令系统', '寻址方式', '立即数',
             '相对寻址', '程序计数器', 'pc', '存储器', '磁盘', 'raid', 'ieee754',
             '机器数', '机器码', '主频', 'cpi', 'mips', 'gips', '数据通路',
             '冒险', '旁路', '转发', '字长', '编址', '地址线', '数据线', '阵列乘法']
    os_kw = ['操作系统', '进程', '线程', '死锁', '文件系统', '虚拟内存', '虚拟页式',
             '磁盘调度', '进程调度', '时间片', 'rr调度', '优先权', '信号量',
             'pv操作', 'wait', 'signal', '临界区', '互斥', '同步', '系统调用',
             '内核态', '用户态', 'pcb', '进程控制块', '缺页异常', '缺页', '页面置换',
             'lru', 'fifo', 'opt', 'clock', '伙伴算法', '位图', '索引节点', 'inode',
             'fat', '文件分配', '空闲块', '外存', 'spooling', 'cscan', 'scan',
             'sstf', 'fcfs', 'vfs', '虚拟文件系统', '内存映射', 'mmap', '驱动程序',
             '键盘中断', '设备驱动']

    for kw in ds_kw:
        if kw in kp or kw in stem:
            return '@ds_course_id'
    for kw in co_kw:
        if kw in kp or kw in stem:
            return '@co_course_id'
    for kw in os_kw:
        if kw in kp or kw in stem:
            return '@os_course_id'
    return '@net_course_id'


SQL_HEADER = """-- ============================================================
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
('T001', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5Eh', 'TEACHER', 0)
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `t_teacher` (`user_id`, `teacher_no`, `name`, `gender`, `college`, `department`, `title`, `email`)
SELECT u.id, 'T001', '张建国', '男', '计算机学院', '软件工程系', '教授', 'zjg@university.edu.cn'
FROM `t_user` u WHERE u.username = 'T001'
ON DUPLICATE KEY UPDATE `id`=`id`;

-- 创建课程
INSERT INTO `t_course` (`course_no`, `course_name`, `teacher_id`, `credit`, `course_type`, `semester`, `description`)
SELECT 'CS-NET-001', '计算机网络', t.id, 4.0, '必修', '2025-2026-1', '计算机网络课程，涵盖OSI参考模型、TCP/IP协议栈、物理层、数据链路层、网络层、传输层、应用层等核心知识'
FROM `t_teacher` t WHERE t.teacher_no = 'T001'
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `t_course` (`course_no`, `course_name`, `teacher_id`, `credit`, `course_type`, `semester`, `description`)
SELECT 'CS-DS-001', '数据结构', t.id, 4.0, '必修', '2025-2026-1', '数据结构课程，涵盖线性表、树、图、查找、排序等核心知识'
FROM `t_teacher` t WHERE t.teacher_no = 'T001'
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `t_course` (`course_no`, `course_name`, `teacher_id`, `credit`, `course_type`, `semester`, `description`)
SELECT 'CS-CO-001', '计算机组成原理', t.id, 4.0, '必修', '2025-2026-1', '计算机组成原理课程，涵盖数据表示、指令系统、CPU、存储器、总线、I/O等'
FROM `t_teacher` t WHERE t.teacher_no = 'T001'
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `t_course` (`course_no`, `course_name`, `teacher_id`, `credit`, `course_type`, `semester`, `description`)
SELECT 'CS-OS-001', '操作系统', t.id, 4.0, '必修', '2025-2026-1', '操作系统课程，涵盖进程管理、内存管理、文件系统、设备管理、I/O等'
FROM `t_teacher` t WHERE t.teacher_no = 'T001'
ON DUPLICATE KEY UPDATE `id`=`id`;

SET @net_course_id = (SELECT id FROM `t_course` WHERE course_no = 'CS-NET-001' LIMIT 1);
SET @ds_course_id = (SELECT id FROM `t_course` WHERE course_no = 'CS-DS-001' LIMIT 1);
SET @co_course_id = (SELECT id FROM `t_course` WHERE course_no = 'CS-CO-001' LIMIT 1);
SET @os_course_id = (SELECT id FROM `t_course` WHERE course_no = 'CS-OS-001' LIMIT 1);
SET @teacher_id = (SELECT id FROM `t_teacher` WHERE teacher_no = 'T001' LIMIT 1);

-- ============================================================
-- 题库题目数据
-- ============================================================
"""


def generate_all_sql(questions, output_path):
    print(f"\n{'='*60}")
    print(f"Generating SQL to: {output_path}")

    counts = {'@net_course_id': 0, '@ds_course_id': 0,
              '@co_course_id': 0, '@os_course_id': 0}

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(SQL_HEADER)

        for q in questions:
            cv = get_course_var(q)
            counts[cv] = counts.get(cv, 0) + 1
            f.write(q.to_sql(cv))
            f.write('\n')

        total = sum(counts.values())
        f.write(f"\n-- 总计: {total} 道题目\n")
        f.write(f"--   计算机网络: {counts['@net_course_id']}\n")
        f.write(f"--   数据结构: {counts['@ds_course_id']}\n")
        f.write(f"--   计算机组成原理: {counts['@co_course_id']}\n")
        f.write(f"--   操作系统: {counts['@os_course_id']}\n")

    print(f"  Total: {total} questions")
    for k, v in sorted(counts.items(), key=lambda x: -x[1]):
        label = {'@net_course_id': '计算机网络', '@ds_course_id': '数据结构',
                 '@co_course_id': '计算机组成原理', '@os_course_id': '操作系统'}.get(k, k)
        print(f"    {label}: {v}")
    print(f"  Output: {output_path}")


# ============================================================
# Main
# ============================================================
def main():
    all_questions = []

    # File 1: 计算机网络试题库含答案2026.md
    path = os.path.join(DOCS_DIR, '计算机网络试题库含答案2026.md')
    if os.path.exists(path):
        all_questions.extend(parse_network_quiz_bank(path))
    else:
        print(f"WARNING: {path} not found")

    # File 2: 计算机网络基础试题(十套试卷-附答案).md
    path = os.path.join(DOCS_DIR, '计算机网络基础试题(十套试卷-附答案).md')
    if os.path.exists(path):
        all_questions.extend(parse_exam_sets(path))
    else:
        print(f"WARNING: {path} not found")

    # File 3+4: 2023 408 (question file + analysis file)
    all_questions.extend(parse_408_both_2023())

    # File 5: 2024 408
    all_questions.extend(parse_408_2024())

    # File 6: 2025 408
    all_questions.extend(parse_408_2025())

    # Summary
    print(f"\n{'='*60}")
    print(f"PARSING COMPLETE — {len(all_questions)} total questions")
    type_counts = {}
    source_counts = {}
    for q in all_questions:
        type_counts[q.question_type] = type_counts.get(q.question_type, 0) + 1
        source_counts[q.source] = source_counts.get(q.source, 0) + 1
    for t, c in sorted(type_counts.items()):
        print(f"  {t}: {c}")
    print("By source:")
    for s, c in sorted(source_counts.items(), key=lambda x: -x[1])[:12]:
        print(f"  {s}: {c}")

    generate_all_sql(all_questions, OUTPUT_FILE)
    print(f"\nDone!")


if __name__ == '__main__':
    main()
