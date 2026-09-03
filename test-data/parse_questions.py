#!/usr/bin/env python3
"""
Parse Computer Networks question bank DOC files and output structured JSON.
Uses antiword to extract text, then regex to parse questions.

Output: test-data/parsed_questions.json
"""

import subprocess
import re
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_DIR = os.path.join(BASE_DIR, '..', 'docs')

# Knowledge point keyword mapping (keyword_in_stem -> kp_name)
KP_KEYWORDS = {
    # Chapter 1: Overview
    '拓扑': '网络拓扑结构',
    '计算机网络.*组成': '计算机网络组成',
    'OSI.*参考模型': 'OSI参考模型',
    '参考模型': 'OSI参考模型',
    'TCP/IP.*模型': 'TCP/IP参考模型',
    'TCP/IP.*体系': 'TCP/IP参考模型',

    # Chapter 2: Physical Layer
    '多路复用': '信道复用技术',
    '频分': '信道复用技术',
    '时分': '信道复用技术',
    '双绞线': '物理层传输介质',
    '同轴电缆': '物理层传输介质',
    '光纤': '物理层传输介质',
    '调制解调器': '物理层设备',
    '中继器': '物理层设备',
    '集线器': '物理层设备',

    # Chapter 3: Data Link Layer
    'CSMA/CD': 'CSMA/CD协议',
    'CRC': 'CRC校验',
    '循环冗余': 'CRC校验',
    'MAC地址': 'IP地址与MAC地址',
    'MAC.*地址': 'IP地址与MAC地址',
    '以太网': 'CSMA/CD协议',
    '帧中继': '广域网技术',
    'HDLC': '广域网技术',
    'PPP': '广域网技术',
    '网桥': '数据链路层设备',
    '交换机': '数据链路层设备',
    'VLAN': 'VLAN技术',

    # Chapter 4: Network Layer
    'IP地址': '子网IP地址计算',
    'IP.*地址': '子网IP地址计算',
    '子网': '子网划分与路由算法',
    '掩码': '子网IP地址计算',
    '子网掩码': '子网IP地址计算',
    'IP数据': 'IP数据报分片',
    '分片': 'IP数据报分片',
    'ICMP': 'ICMP协议',
    'PING': 'ICMP协议',
    'ARP': 'ARP协议',
    'RARP': 'ARP协议',
    '路由选择': '子网划分与路由算法',
    '路由表': '子网划分与路由算法',
    'OSPF': 'OSPF与BGP协议',
    'BGP': 'OSPF与BGP协议',
    'RIP': 'OSPF与BGP协议',
    '距离向量': '距离向量路由算法',
    'NAT': 'NAT协议',
    'IPv6': 'IPv4/IPv6协议',
    'IPv4': 'IPv4/IPv6协议',
    'CIDR': '子网划分与路由算法',
    '广播': 'IP地址与MAC地址',
    '组播': 'IP地址与MAC地址',

    # Chapter 5: Transport Layer
    'TCP': 'TCP/UDP协议',
    'UDP': 'TCP/UDP协议',
    '三次握手': 'TCP三次握手/四次挥手',
    '握手': 'TCP三次握手/四次挥手',
    '四次挥手': 'TCP三次握手/四次挥手',
    '拥塞控制': 'TCP拥塞控制',
    '流量控制': 'TCP流量控制',
    '滑动窗口': 'TCP流量控制',
    '端口': 'TCP/UDP协议',
    '端口号': 'TCP/UDP协议',
    '运输层': 'TCP/UDP协议',
    '传输层': 'TCP/UDP协议',
    '面向连接': 'TCP/UDP协议',
    '无连接': '无连接传输协议',
    '可靠传输': '可靠传输技术',
    'GBN': 'GBN协议',

    # Chapter 6: Application Layer
    'DNS': 'DNS协议',
    '域名': 'DNS协议',
    'HTTP': 'HTTP协议',
    'WWW': 'HTTP协议',
    '浏览器': 'HTTP协议',
    'FTP': '文件传输协议',
    'SMTP': '电子邮件协议',
    'POP3': '电子邮件协议',
    '电子邮件': '电子邮件协议',
    'TELNET': '远程登录协议',
    'SNMP': '网络管理协议',
    'DHCP': '应用层协议',
    'URL': 'HTTP协议',
}

def resolve_kp(stem):
    """Map question stem to knowledge point name based on keywords."""
    for pattern, kp_name in KP_KEYWORDS.items():
        if re.search(pattern, stem, re.IGNORECASE):
            return kp_name
    return None


def extract_with_antiword(filepath):
    """Run antiword via bash redirect to temp file, then read with Python.
    This avoids Windows subprocess encoding issues with Chinese characters."""
    import tempfile
    tmpfile = os.path.join(tempfile.gettempdir(), 'aitaes_antiword_output.txt')
    # Use bash shell to run antiword and redirect to temp file
    abs_path = os.path.abspath(filepath)
    cmd = f'antiword -m UTF-8 "{abs_path}" > "{tmpfile}"'
    subprocess.run(cmd, shell=True, capture_output=True)

    if not os.path.exists(tmpfile) or os.path.getsize(tmpfile) < 100:
        print(f"  WARNING: antiword failed for {filepath}")
        return ''

    # Try encodings for reading
    for enc in ['utf-8', 'gbk', 'gb18030', 'cp936']:
        try:
            with open(tmpfile, 'r', encoding=enc) as f:
                text = f.read()
            if len(text) > 100:
                return text
        except (UnicodeDecodeError, LookupError):
            continue

    # Last resort
    with open(tmpfile, 'r', encoding='utf-8', errors='replace') as f:
        return f.read()


def parse_single_choice_section(text, start_line):
    """
    Parse single-choice questions from the quiz bank.
    Pattern: number + question stem ending with (answer_letter) + options A/B/C/D
    Returns (questions, end_line)
    """
    questions = []
    lines = text.split('\n')
    i = start_line
    current_stem = ''
    current_number = None
    options = []
    answer = None
    in_options = False

    while i < len(lines):
        line = lines[i].strip()

        # Detect section end - next section header
        if re.match(r'^\s*多项选择题\s*$', line) or re.match(r'^\s*填空题\s*$', line):
            break

        # Detect numbered question start: "数字  " or "数字."
        match = re.match(r'^(\d{1,3})\s{2,}(.*)', line)
        if not match:
            match = re.match(r'^(\d{1,3})\.\s*(.*)', line)

        if match:
            # Save previous question
            if current_number and current_stem and answer:
                questions.append({
                    'number': current_number,
                    'type': 'SINGLE',
                    'stem': clean_text(current_stem.strip()),
                    'options': options,
                    'answer': answer,
                    'source': '计算机网络试题库'
                })
            current_number = int(match.group(1))
            current_stem = match.group(2)
            options = []
            answer = None
            in_options = False

            # Extract answer from stem: （A）or （AB）
            ans_match = re.search(r'[（(]([A-D]{1,2})[）)]', current_stem)
            if ans_match:
                answer = ans_match.group(1)
                current_stem = re.sub(r'[（(][A-D]{1,2}[）)]', '', current_stem).strip()

            i += 1
            continue

        # Detect option line: "A. xxx" or "A、xxx"
        opt_match = re.match(r'^([A-D])[.、]\s*(.*)', line)
        if opt_match and current_number:
            options.append({
                'label': opt_match.group(1),
                'text': clean_text(opt_match.group(2).strip())
            })
            in_options = True
            # Some options all on one line: "A. xxx   B. xxx   C. xxx   D. xxx"
            i += 1
            continue

        # Check if line continues options from previous line
        # Like: "A、令牌环       B、FDDI" on one line
        all_inline_opts = re.findall(r'([A-D])[、.]\s*([^A-D]+?)(?=\s{2,}[A-D][、.]|$)', line)
        if all_inline_opts and current_number:
            if not options:  # clear any partial
                pass
            for label, text in all_inline_opts:
                options.append({
                    'label': label,
                    'text': clean_text(text.strip().rstrip(';；'))
                })
            i += 1
            continue

        # Continue stem (multi-line question)
        if current_number and not in_options:
            current_stem += ' ' + line
        elif current_number and in_options:
            # Might be a continuation of the last option
            if options:
                options[-1]['text'] += ' ' + line

        i += 1

    # Save last question
    if current_number and current_stem and answer:
        questions.append({
            'number': current_number,
            'type': 'SINGLE',
            'stem': clean_text(current_stem.strip()),
            'options': options,
            'answer': answer,
            'source': '计算机网络试题库'
        })

    return questions, i


def parse_multiple_choice_section(text, start_line):
    """Parse multiple-choice questions (multi-letter answers)."""
    questions = []
    lines = text.split('\n')
    i = start_line
    current_stem = ''
    current_number = None
    options = []
    answer = None
    in_stem = True

    while i < len(lines):
        line = lines[i].strip()

        # Section end
        if re.match(r'^\s*填空题\s*$', line) or re.match(r'^\s*判断题\s*$', line):
            break

        # Numbered question
        match = re.match(r'^(\d{1,3})\s{2,}(.*)', line)
        if not match:
            match = re.match(r'^(\d{1,3})\.\s*(.*)', line)

        if match:
            if current_number and current_stem and answer and options:
                questions.append({
                    'number': current_number,
                    'type': 'MULTI',
                    'stem': clean_text(current_stem.strip()),
                    'options': options,
                    'answer': answer,
                    'source': '计算机网络试题库'
                })
            current_number = int(match.group(1))
            current_stem = match.group(2)
            options = []
            answer = None
            in_stem = True

            # Extract answer: （BD）or (ABC)
            ans_match = re.search(r'[（(]([A-D]{2,4})[）)]', current_stem)
            if ans_match:
                answer = ans_match.group(1)
                current_stem = re.sub(r'[（(][A-D]{2,4}[）)]', '', current_stem).strip()

            i += 1
            continue

        # Option lines
        if re.match(r'^[A-H][、.]', line) or re.match(r'^[A-H]\s', line):
            in_stem = False
            # Parse multi-label inline options
            all_inline = re.findall(r'([A-H])[、.]?\s*(.+?)(?=\s{2,}[A-H][、.]?\s|$)', line)
            for label, text in all_inline:
                options.append({
                    'label': label,
                    'text': clean_text(text.strip().rstrip(';；'))
                })
        elif in_stem and current_number:
            current_stem += ' ' + line
        elif not in_stem and options:
            options[-1]['text'] += ' ' + line

        i += 1

    if current_number and current_stem and answer and options:
        questions.append({
            'number': current_number,
            'type': 'MULTI',
            'stem': clean_text(current_stem.strip()),
            'options': options,
            'answer': answer,
            'source': '计算机网络试题库'
        })

    return questions, i


def parse_fill_blank_section(text, start_line):
    """
    Parse fill-in-the-blank questions.
    These have answers embedded in ___ or （） markers.
    """
    questions = []
    lines = text.split('\n')
    i = start_line
    current_stem = ''
    answer = ''

    while i < len(lines):
        line = lines[i].strip()

        # Section end markers
        if re.match(r'^\s*判断题\s*$', line) or re.match(r'^\s*简答题\s*$', line):
            break

        # Skip empty lines
        if not line:
            if current_stem:
                questions.append({
                    'number': len(questions) + 1,
                    'type': 'FILL',
                    'stem': clean_text(current_stem.strip()),
                    'options': [],
                    'answer': answer.strip(),
                    'source': '计算机网络试题库'
                })
                current_stem = ''
                answer = ''
            i += 1
            continue

        # Lines with embedded answers in ___ or （） or （...）
        # Pattern: text with ___ gaps or text （answer）
        has_embedded_answer = False

        # Extract answers in ___标记___ format
        underlined = re.findall(r'_{2,}\s*(\S[^_]*?\S)\s*_{2,}', line)
        if underlined:
            answer += '；'.join(underlined) + '；'
            has_embedded_answer = True

        # Extract answers in （答案）format
        paren_answers = re.findall(r'[（(]\s*([^（）()]{1,30}?)\s*[）)]', line)
        if paren_answers:
            # Filter out non-answer parens (like "TCP/IP", "CSMA/CD")
            real_answers = [a for a in paren_answers if not re.match(r'^[A-Z]{2,}(/[A-Z]+)*$', a) and len(a) > 1]
            if real_answers:
                answer += '；'.join(real_answers) + '；'
                has_embedded_answer = True

        # Append to current stem
        current_stem += ' ' + line

        i += 1

    if current_stem:
        questions.append({
            'number': len(questions) + 1,
            'type': 'FILL',
            'stem': clean_text(current_stem.strip()),
            'options': [],
            'answer': answer.strip().rstrip('；'),
            'source': '计算机网络试题库'
        })

    return questions, i


def parse_true_false_section(text, start_line):
    """Parse true/false questions."""
    questions = []
    lines = text.split('\n')
    i = start_line
    current_stem = ''
    answer = ''

    while i < len(lines):
        line = lines[i].strip()

        if re.match(r'^\s*简答题\s*$', line) or re.match(r'^\s*综合题\s*$', line):
            break

        # Match answer pattern: （T）or（F）
        tf_match = re.search(r'[（(]\s*([TFtf])\s*[）)]', line)
        if tf_match and current_stem:
            answer = 'TRUE' if tf_match.group(1).upper() == 'T' else 'FALSE'
            questions.append({
                'number': len(questions) + 1,
                'type': 'TRUE_FALSE',
                'stem': clean_text(current_stem.strip()),
                'options': [],
                'answer': answer,
                'source': '计算机网络试题库'
            })
            current_stem = ''
            answer = ''
            i += 1
            continue

        # Numbered question with just stem
        num_match = re.match(r'^\d{1,3}[\.、\s]+(.*)', line)
        if num_match:
            if current_stem:
                # Save previous without answer (answer might be on next line)
                questions.append({
                    'number': len(questions) + 1,
                    'type': 'TRUE_FALSE',
                    'stem': clean_text(current_stem.strip()),
                    'options': [],
                    'answer': '',
                    'source': '计算机网络试题库'
                })
            current_stem = num_match.group(1)
        elif current_stem:
            current_stem += ' ' + line

        i += 1

    if current_stem:
        questions.append({
            'number': len(questions) + 1,
            'type': 'TRUE_FALSE',
            'stem': clean_text(current_stem.strip()),
            'options': [],
            'answer': answer if answer else '',
            'source': '计算机网络试题库'
        })

    return questions, i


def clean_text(text):
    """Clean up text by removing excessive whitespace and formatting."""
    text = re.sub(r'\s+', ' ', text)
    text = text.replace('_', '').strip()
    text = re.sub(r'[（(]\s*[）)]', '', text)  # empty parens
    return text.strip()


def parse_quiz_bank(filepath):
    """Main parser for the quiz bank DOC file."""
    print(f"Extracting text from: {filepath}")
    text = extract_with_antiword(filepath)
    lines = text.split('\n')
    print(f"Extracted {len(lines)} lines")

    all_questions = []
    sections_found = []

    # Find section headers
    for i, line in enumerate(lines):
        stripped = line.strip()
        if re.match(r'^\s*\d*单项选择题\s*$', stripped):
            sections_found.append(('SINGLE', i))
        elif re.match(r'^\s*多项选择题\s*$', stripped):
            sections_found.append(('MULTI', i))
        elif re.match(r'^\s*填空题\s*$', stripped):
            sections_found.append(('FILL', i))
        elif re.match(r'^\s*判断题\s*$', stripped):
            sections_found.append(('TRUE_FALSE', i))

    print(f"Found sections: {[s[0] for s in sections_found]}")

    for section_type, start_idx in sections_found:
        try:
            if section_type == 'SINGLE':
                qs, _ = parse_single_choice_section(text, start_idx)
            elif section_type == 'MULTI':
                qs, _ = parse_multiple_choice_section(text, start_idx)
            elif section_type == 'FILL':
                qs, _ = parse_fill_blank_section(text, start_idx)
            elif section_type == 'TRUE_FALSE':
                qs, _ = parse_true_false_section(text, start_idx)
            else:
                continue

            # Resolve knowledge points
            for q in qs:
                q['knowledgePoint'] = resolve_kp(q['stem'])

            all_questions.extend(qs)
            print(f"  {section_type}: {len(qs)} questions parsed")
        except Exception as e:
            print(f"  Error parsing {section_type}: {e}")
            import traceback
            traceback.print_exc()

    # Re-number globally
    for i, q in enumerate(all_questions, 1):
        q['globalId'] = i

    return all_questions


def parse_exam_sets(filepath):
    """Parse the 10 exam sets DOC file, extracting questions with section info."""
    print(f"\nExtracting text from: {filepath}")
    text = extract_with_antiword(filepath)
    lines = text.split('\n')
    print(f"Extracted {len(lines)} lines")

    exams = []
    current_exam = None
    current_section = None
    current_stem = ''
    current_number = None
    options = []
    answer = ''

    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue

        # Detect exam header: "计算机网络试题《X》"
        exam_match = re.match(r'计算机网络试题[《〈]([^》〉]+)[》〉]', stripped)
        if exam_match:
            if current_exam:
                exams.append(current_exam)
            current_exam = {
                'name': f"计算机网络试题{exam_match.group(1)}",
                'sections': []
            }
            current_section = None
            continue

        # Detect answer section
        if re.match(r'^答案[：:]', stripped):
            # Extract answers
            answer_lines = '\n'.join(lines[i:i+30])
            if current_exam and current_exam['sections']:
                current_exam['sections'][-1]['answerBlock'] = answer_lines[:500]
            continue

        # Detect section headers in exam
        sec_match = re.match(r'^[一二三四五六七八九十]、(.+)', stripped)
        if sec_match:
            current_section = {
                'title': sec_match.group(1),
                'questions': []
            }
            if current_exam:
                current_exam['sections'].append(current_section)
            continue

        # Skip non-question content
        if not current_exam or not current_section:
            continue

    if current_exam:
        exams.append(current_exam)

    print(f"Found {len(exams)} exam papers")
    for ex in exams:
        print(f"  {ex['name']}: {len(ex['sections'])} sections")

    return exams


def main():
    quiz_bank_path = os.path.join(DOCS_DIR, '计算机网络试题库含答案2026.docx')
    exam_sets_path = os.path.join(DOCS_DIR, '计算机网络基础试题(十套试卷-附答案).docx')

    # Parse quiz bank
    if os.path.exists(quiz_bank_path):
        questions = parse_quiz_bank(quiz_bank_path)
    else:
        print(f"ERROR: Quiz bank not found at {quiz_bank_path}")
        sys.exit(1)

    # Parse exam sets
    exam_papers = []
    if os.path.exists(exam_sets_path):
        exam_papers = parse_exam_sets(exam_sets_path)

    # Report
    print(f"\n{'='*60}")
    print(f"TOTAL QUESTIONS PARSED: {len(questions)}")
    types = {}
    for q in questions:
        t = q['type']
        types[t] = types.get(t, 0) + 1
    for t, c in sorted(types.items()):
        print(f"  {t}: {c}")

    kp_count = sum(1 for q in questions if q.get('knowledgePoint'))
    print(f"  With knowledge point: {kp_count}")
    print(f"  Without knowledge point: {len(questions) - kp_count}")

    # Save
    output = {
        'questions': questions,
        'examPapers': exam_papers,
        'metadata': {
            'totalQuestions': len(questions),
            'typeCounts': types,
            'questionTypes': list(types.keys()),
            'sourceFiles': [
                '计算机网络试题库含答案2026.docx',
                '计算机网络基础试题(十套试卷-附答案).docx'
            ]
        }
    }

    output_path = os.path.join(BASE_DIR, 'parsed_questions.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\nSaved to: {output_path}")


if __name__ == '__main__':
    main()
