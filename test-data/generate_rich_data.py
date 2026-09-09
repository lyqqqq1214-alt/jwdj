#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 AITAES 富数据脚本 rich_data.sql（确定性、可重复执行）

覆盖规模：3 门课程 × 2 个班 × 20 名学生 = 120 名学生
每名学生数据：
  - 3 次作业（HOMEWORK）
  - 2 次测验（QUIZ）
  - 期中考试（MIDTERM）+ 期末考试（FINAL）
  - 10 次考勤（t_attendance）
  - 2 次实验报告（t_experiment）
另含：课程、知识点、选课关系、知识点掌握度、预警记录

用法：
    python generate_rich_data.py
输出：与本脚本同目录下的 rich_data.sql

数据均为确定性生成（固定随机种子），重复执行得到完全一致的结果；
脚本内部使用 INSERT IGNORE / NOT EXISTS 守卫，可幂等重复执行。
"""
import os
import random

# 明文 123456 的 BCrypt 哈希（与 init.sql / simulated_data.sql 保持一致）
PWD = '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG'
SEMESTER = '2025-2026-1'
rng = random.Random(20250909)

SURNAMES = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳'
GIVEN1 = '伟芳娜敏静丽强磊军洋勇艳杰娟涛明超秀英霞平刚玉萍红婷斌晨曦俊浩宇轩子涵欣怡雨桐思远博文雅雪梅琳嘉琪志豪嘉伟婧怡佳蕊婉婷云龙雨辰德权鑫海静怡'
GIVEN2 = '伟芳娜敏静丽强磊军洋勇艳杰娟涛明超秀英霞平刚玉萍红婷斌晨曦俊浩宇轩子涵欣怡雨桐思远博文雅雪梅琳嘉琪志豪嘉伟婧怡佳蕊婉婷云龙雨辰德权鑫海静怡'

WEEKS = [  # 10 次考勤（每周一次）
    (1, '2025-09-01'), (2, '2025-09-08'), (3, '2025-09-15'),
    (4, '2025-09-22'), (5, '2025-09-29'), (6, '2025-10-06'),
    (7, '2025-10-13'), (8, '2025-10-20'), (9, '2025-10-27'),
    (10, '2025-11-03'),
]

# 每门课程：课程号、名称、教师工号、学分、类型、学院、专业、描述、
#          班级列表、知识点（章 -> [三级知识点]）、考核、实验
COURSES = [
    {
        'course_no': 'CS05112', 'course_name': '操作系统', 'teacher_no': 'T00001',
        'credit': '4.0', 'course_type': '必修',
        'college': '计算机学院', 'major': '计算机科学与技术',
        'description': '进程与线程、处理机调度、内存管理、文件系统与设备管理',
        'classes': ['计科2001', '计科2002'],
        'kps': [
            ('第1章 进程管理', '进程管理', ['进程与线程', '进程同步与互斥', '信号量与PV操作', '处理机调度算法', '死锁与银行家算法']),
            ('第2章 内存管理', '内存管理', ['分页存储管理', '分段存储管理', '虚拟内存', '页面置换算法']),
            ('第3章 文件与设备管理', '文件系统', ['文件系统结构', '磁盘调度算法', 'I/O控制方式']),
        ],
        'homeworks': ['第1次作业-进程管理', '第2次作业-内存管理', '第3次作业-文件系统'],
        'quizzes': ['第1次测验-进程与同步', '第2次测验-内存与虚拟内存'],
        'experiments': ['实验1-进程调度模拟', '实验2-页面置换算法模拟'],
    },
    {
        'course_no': 'CS05113', 'course_name': '计算机组成原理', 'teacher_no': 'T00001',
        'credit': '4.0', 'course_type': '必修',
        'college': '计算机学院', 'major': '计算机科学与技术',
        'description': '数据表示与运算、存储系统、指令系统、CPU 结构与总线 I/O',
        'classes': ['计科2003', '计科2004'],
        'kps': [
            ('第1章 数据表示与运算', '数据表示', ['数制与编码', '定点数运算', '浮点数表示', '算术逻辑运算']),
            ('第2章 存储系统', '存储系统', ['存储层次结构', 'Cache工作原理', '主存扩展与芯片']),
            ('第3章 指令系统与CPU', '指令系统', ['指令系统', '微程序控制', '流水线技术']),
            ('第4章 总线与I/O', '总线I/O', ['总线仲裁', '中断系统', 'DMA方式']),
        ],
        'homeworks': ['第1次作业-数据表示与运算', '第2次作业-存储系统', '第3次作业-指令系统与CPU'],
        'quizzes': ['第1次测验-数据表示', '第2次测验-存储与Cache'],
        'experiments': ['实验1-算术逻辑单元设计', '实验2-存储系统设计'],
    },
    {
        'course_no': 'CS05114', 'course_name': '算法设计与分析', 'teacher_no': 'T00001',
        'credit': '3.5', 'course_type': '必修',
        'college': '计算机学院', 'major': '软件工程',
        'description': '分治、动态规划、贪心、图算法、回溯与分支限界',
        'classes': ['软件2001', '软件2002'],
        'kps': [
            ('第1章 算法基础', '算法基础', ['时间复杂度分析', '递归与分治', '分治法应用']),
            ('第2章 动态规划', '动态规划', ['动态规划基本思想', '最优子结构', '经典DP问题']),
            ('第3章 贪心与图算法', '贪心图算法', ['贪心算法', '图遍历算法', '最短路径算法', '最小生成树']),
            ('第4章 回溯与分支限界', '回溯分支限界', ['回溯法', '分支限界法']),
        ],
        'homeworks': ['第1次作业-分治与递归', '第2次作业-动态规划', '第3次作业-贪心与图算法'],
        'quizzes': ['第1次测验-分治与DP', '第2次测验-图算法与回溯'],
        'experiments': ['实验1-排序算法比较', '实验2-最短路径算法实现'],
    },
]


def gen_name(used):
    while True:
        name = rng.choice(SURNAMES) + rng.choice(GIVEN1)
        if rng.random() < 0.55:
            name += rng.choice(GIVEN2)
        if name not in used:
            used.add(name)
            return name


def build_students(course):
    """为某门课程生成 2 个班 × 20 名学生的学号/姓名/性别，并标记弱生/优生。"""
    students = []
    used = set()
    college_code = '1' if course['major'] == '计算机科学与技术' else '2'
    for class_name in course['classes']:
        class_code = int(class_name[-2:])
        for seq in range(1, 21):
            student_no = '2020260%s%02d%02d' % (college_code, class_code, seq)
            # 标记：第 1 名优生、第 6/16 名弱生（预警演示）
            if seq == 1:
                ability = rng.uniform(90, 98); flag = 'excellent'
            elif seq in (6, 16):
                ability = rng.uniform(40, 56); flag = 'weak'
            else:
                ability = rng.uniform(62, 90); flag = 'normal'
            gender = '男' if rng.random() < 0.6 else '女'
            students.append({
                'no': student_no,
                'name': gen_name(used),
                'gender': gender,
                'class_name': class_name,
                'college': course['college'],
                'major': course['major'],
                'ability': round(ability, 1),
                'flag': flag,
            })
    return students


def clamp(v):
    return max(30.0, min(100.0, v))


def score_for(student, atype):
    base = student['ability']
    if atype == 'HOMEWORK':
        s = base + rng.uniform(-6, 6)
    elif atype == 'QUIZ':
        s = base + rng.uniform(-8, 6)
    elif atype == 'MIDTERM':
        s = base + rng.uniform(-10, 4)
    else:  # FINAL
        s = base + rng.uniform(-12, 4)
    return round(clamp(s), 1)


def submit_status(student, atype, no):
    if student['flag'] == 'weak':
        if atype == 'HOMEWORK' and no == 3:
            return 'ABSENT'
        if atype == 'HOMEWORK' and no == 2:
            return 'LATE'
        if atype == 'FINAL':
            return 'ABSENT'
    return 'ON_TIME'


def esc(v):
    return str(v).replace("'", "''")


def q(v):
    return "'" + esc(v) + "'"


def build():
    L = []
    A = L.append

    A('-- ============================================================')
    A('-- AITAES 富数据脚本（rich_data.sql）—— 由 generate_rich_data.py 生成')
    A('-- 规模：3 门课程 × 2 个班 × 20 名学生 = 120 名学生')
    A('-- 每名学生：3 次作业 + 2 次测验 + 期中/期末 + 10 次考勤 + 2 次实验')
    A('-- 幂等：全部使用 INSERT IGNORE / NOT EXISTS 守卫，可重复执行')
    A('-- ============================================================')
    A('')
    A('USE aitaes_db;')
    A('SET NAMES utf8mb4;')
    A('SET FOREIGN_KEY_CHECKS = 0;')
    A('')

    # 预生成所有学生，按课程分组
    data = {}
    for course in COURSES:
        data[course['course_no']] = build_students(course)
    all_students = [s for course in COURSES for s in data[course['course_no']]]

    # ---------- Part 1: 课程 ----------
    A('-- ============================================================')
    A('-- Part 1: 课程（3 门，均归属教师 T00001 张建国）')
    A('-- ============================================================')
    for course in COURSES:
        A('INSERT IGNORE INTO t_course (course_no, course_name, teacher_id, credit, course_type, semester, description)')
        A('SELECT %s, %s, id, %s, %s, %s, %s' % (
            q(course['course_no']), q(course['course_name']),
            q(course['credit']), q(course['course_type']),
            q(SEMESTER), q(course['description'])))
        A('FROM t_teacher WHERE teacher_no = %s;' % q(course['teacher_no']))
        A('')

    # ---------- Part 2: 知识点 ----------
    A('-- ============================================================')
    A('-- Part 2: 知识点（每门课程若干章 + 三级知识点）')
    A('-- ============================================================')
    for course in COURSES:
        cno = q(course['course_no'])
        A('-- %s %s' % (course['course_no'], course['course_name']))
        for i, (chapter, cat, _kps) in enumerate(course['kps'], start=1):
            A('INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, level, difficulty, sort_order)')
            A('SELECT c.id, %s, %s, 1, %s, %d FROM t_course c WHERE c.course_no = %s;' % (
                q(chapter), q(cat), q('MEDIUM'), i, cno))
        for (chapter, cat, kps) in course['kps']:
            for j, kp in enumerate(kps, start=1):
                A('INSERT IGNORE INTO t_knowledge_point (course_id, kp_name, kp_category, parent_id, level, difficulty, sort_order)')
                A('SELECT c.id, %s, %s, p.id, 3, %s, %d' % (q(kp), q(cat), q('MEDIUM'), j))
                A('FROM t_course c JOIN t_knowledge_point p ON p.course_id = c.id AND p.kp_name = %s' % q(chapter))
                A('WHERE c.course_no = %s;' % cno)
        A('')

    # ---------- Part 3: 学生账号 + 学生 ----------
    A('-- ============================================================')
    A('-- Part 3: 学生账号（t_user）+ 学生（t_student）')
    A('-- ============================================================')
    A('INSERT IGNORE INTO t_user (username, password, role) VALUES')
    rows = ['(' + q(s['no']) + ', ' + q(PWD) + ', ' + q('STUDENT') + ')' for s in all_students]
    for k in range(0, len(rows), 6):
        A('  ' + ', '.join(rows[k:k + 6]) + (',' if k + 6 < len(rows) else ';'))
    A('')

    A('INSERT IGNORE INTO t_student (user_id, student_no, name, gender, college, major, class_name, grade)')
    A('SELECT u.id, s.student_no, s.name, s.gender, s.college, s.major, s.class_name, %s' % q('2020'))
    A('FROM t_user u')
    A('JOIN (')
    stud_rows = ['  SELECT %s student_no, %s name, %s gender, %s college, %s major, %s class_name' % (
        q(s['no']), q(s['name']), q(s['gender']), q(s['college']), q(s['major']), q(s['class_name']))
        for s in all_students]
    A('\n  UNION ALL\n'.join(stud_rows))
    A(') s ON u.username = s.student_no;')
    A('')

    # ---------- Part 4: 选课关系 ----------
    A('-- ============================================================')
    A('-- Part 4: 选课关系（t_course_student）')
    A('-- ============================================================')
    for course in COURSES:
        classes = ', '.join(q(cl) for cl in course['classes'])
        A('INSERT IGNORE INTO t_course_student (course_id, student_id, class_name, semester)')
        A('SELECT c.id, st.id, st.class_name, %s' % q(SEMESTER))
        A('FROM t_course c JOIN t_student st ON st.class_name IN (%s)' % classes)
        A('WHERE c.course_no = %s;' % q(course['course_no']))
        A('')

    # ---------- Part 5: 考核定义 ----------
    A('-- ============================================================')
    A('-- Part 5: 考核（t_assessment）：3 作业 + 2 测验 + 期中 + 期末')
    A('-- ============================================================')
    for course in COURSES:
        cno = q(course['course_no'])
        A('-- %s %s' % (course['course_no'], course['course_name']))
        asms = []
        for i, hw in enumerate(course['homeworks'], start=1):
            asms.append((hw, 'HOMEWORK', i, ['2025-09-20', '2025-10-11', '2025-11-01'][i - 1], 5))
        for i, qz in enumerate(course['quizzes'], start=1):
            asms.append((qz, 'QUIZ', i, ['2025-10-15', '2025-11-25'][i - 1], 10))
        asms.append(('期中考试', 'MIDTERM', 1, '2025-11-12', 20))
        asms.append(('期末考试', 'FINAL', 1, '2026-01-08', 25))
        for name, atype, no, date, qc in asms:
            A('INSERT IGNORE INTO t_assessment (course_id, assessment_name, assessment_type, assessment_no, total_score, question_count, assessment_date, semester, status)')
            A('SELECT c.id, %s, %s, %d, 100.00, %d, %s, %s, %s' % (
                q(name), q(atype), no, qc, q(date), q(SEMESTER), q('PUBLISHED')))
            A('FROM t_course c WHERE c.course_no = %s;' % cno)
        A('')

    # ---------- Part 6: 成绩记录 ----------
    A('-- ============================================================')
    A('-- Part 6: 成绩记录（t_assessment_record）：每生 7 条（3作业+2测验+期中+期末）')
    A('-- ============================================================')
    for course in COURSES:
        cno = q(course['course_no'])
        students = data[course['course_no']]
        kp_names = [kp for (_ch, _cat, kps) in course['kps'] for kp in kps]
        A('-- %s %s' % (course['course_no'], course['course_name']))
        asms = []
        for i, hw in enumerate(course['homeworks'], start=1):
            asms.append((hw, 'HOMEWORK', i))
        for i, qz in enumerate(course['quizzes'], start=1):
            asms.append((qz, 'QUIZ', i))
        asms.append(('期中考试', 'MIDTERM', 1))
        asms.append(('期末考试', 'FINAL', 1))
        for name, atype, no in asms:
            A('INSERT IGNORE INTO t_assessment_record (assessment_id, student_id, total_score, submit_status, weakest_kp)')
            A('SELECT a.id, st.id, m.score, m.status, m.kp')
            A('FROM t_assessment a')
            A('JOIN t_course c ON a.course_id = c.id AND c.course_no = %s AND a.assessment_name = %s' % (cno, q(name)))
            A('JOIN (')
            rec_rows = []
            for s in students:
                score = score_for(s, atype)
                status = submit_status(s, atype, no)
                kp = q(rng.choice(kp_names)) if s['flag'] == 'weak' else 'NULL'
                rec_rows.append('  SELECT %s sno, %.1f score, %s status, %s kp' % (
                    q(s['no']), score, q(status), kp))
            A('\n  UNION ALL\n'.join(rec_rows))
            A(') m')
            A('JOIN t_student st ON st.student_no = m.sno;')
            A('')

    # ---------- Part 7: 考勤 ----------
    A('-- ============================================================')
    A('-- Part 7: 考勤（t_attendance）：每生 10 次（每周一次）')
    A('-- ============================================================')
    week_rows = ' UNION ALL '.join('SELECT %d n, %s d' % (n, q(d)) for (n, d) in WEEKS)
    for course in COURSES:
        cno = q(course['course_no'])
        students = data[course['course_no']]
        classes = ', '.join(q(cl) for cl in course['classes'])
        weak = [s for s in students if s['flag'] == 'weak']
        late = [s for s in students if s['flag'] == 'normal'][::9]
        weak_list = ', '.join(q(s['no']) for s in weak)
        late_list = ', '.join(q(s['no']) for s in late)
        A('-- %s %s' % (course['course_no'], course['course_name']))
        A('INSERT IGNORE INTO t_attendance (course_id, student_id, attendance_date, status, week_no, period, semester)')
        A('SELECT c.id, st.id, w.d,')
        A('  CASE')
        A('    WHEN st.student_no IN (%s) AND w.n IN (2,5,8) THEN %s' % (weak_list, q('缺勤')))
        A('    WHEN st.student_no IN (%s) AND w.n = 4 THEN %s' % (weak_list, q('迟到')))
        if late_list:
            A('    WHEN st.student_no IN (%s) AND w.n = 6 THEN %s' % (late_list, q('请假')))
        A('    ELSE %s' % q('出勤'))
        A('  END,')
        A('  w.n, %s, %s' % (q('第1-2节'), q(SEMESTER)))
        A('FROM t_course c')
        A('JOIN t_student st ON st.class_name IN (%s)' % classes)
        A('  AND EXISTS (SELECT 1 FROM t_course_student cs WHERE cs.student_id = st.id AND cs.course_id = c.id)')
        A('CROSS JOIN (')
        A('  ' + week_rows)
        A(') w')
        A('WHERE c.course_no = %s;' % cno)
        A('')

    # ---------- Part 8: 实验 ----------
    A('-- ============================================================')
    A('-- Part 8: 实验报告（t_experiment）：每生 2 次')
    A('-- ============================================================')
    for course in COURSES:
        cno = q(course['course_no'])
        students = data[course['course_no']]
        A('-- %s %s' % (course['course_no'], course['course_name']))
        for no, exp_name in enumerate(course['experiments'], start=1):
            A('INSERT IGNORE INTO t_experiment (course_id, student_id, experiment_name, experiment_no, score, semester)')
            A('SELECT c.id, st.id, %s, %d, m.score, %s' % (q(exp_name), no, q(SEMESTER)))
            A('FROM (')
            exp_rows = []
            for s in students:
                e = max(60, s['ability']) + rng.uniform(-4, 8)
                exp_rows.append('  SELECT %s sno, %.1f score' % (q(s['no']), round(clamp(e), 1)))
            A('\n  UNION ALL\n'.join(exp_rows))
            A(') m')
            A('JOIN t_student st ON st.student_no = m.sno')
            A('JOIN t_course c ON c.course_no = %s' % cno)
            A('WHERE NOT EXISTS (SELECT 1 FROM t_experiment e WHERE e.course_id = c.id AND e.student_id = st.id AND e.experiment_no = %d);' % no)
            A('')

    # ---------- Part 9: 知识点掌握度 ----------
    A('-- ============================================================')
    A('-- Part 9: 知识点掌握度（t_student_kp_mastery）：每生 × 每三级知识点')
    A('-- ============================================================')
    for course in COURSES:
        cno = q(course['course_no'])
        students = data[course['course_no']]
        classes = ', '.join(q(cl) for cl in course['classes'])
        exc = ', '.join(q(s['no']) for s in students if s['flag'] == 'excellent')
        weak = ', '.join(q(s['no']) for s in students if s['flag'] == 'weak')
        A('-- %s %s' % (course['course_no'], course['course_name']))
        A('INSERT IGNORE INTO t_student_kp_mastery (student_id, course_id, kp_name, mastery_rate, lose_count, total_question_count)')
        A('SELECT st.id, c.id, kp.kp_name,')
        A('  GREATEST(5.0, LEAST(100.0,')
        A('    (CASE')
        A('      WHEN st.student_no IN (%s) THEN 88' % exc)
        A('      WHEN st.student_no IN (%s) THEN 34' % weak)
        A('      ELSE 72')
        A('    END) + MOD(kp.sort_order * 7, 20) - 10')
        A('  )),')
        A('  MOD(kp.sort_order, 4), 5 + MOD(kp.sort_order, 6)')
        A('FROM t_course c')
        A('JOIN t_student st ON st.class_name IN (%s)' % classes)
        A('  AND EXISTS (SELECT 1 FROM t_course_student cs WHERE cs.student_id = st.id AND cs.course_id = c.id)')
        A('JOIN t_knowledge_point kp ON kp.course_id = c.id AND kp.level = 3')
        A('WHERE c.course_no = %s;' % cno)
        A('')

    # ---------- Part 10: 预警记录 ----------
    A('-- ============================================================')
    A('-- Part 10: 预警记录（t_warning_record）：针对每班的弱生生成')
    A('-- ============================================================')
    warn_rows = []
    for course in COURSES:
        for s in data[course['course_no']]:
            if s['flag'] != 'weak':
                continue
            warn_rows.append((s['no'], course['course_no'], '缺勤过多预警', 'HIGH',
                              '[预警] %s同学已缺勤3次，成绩偏低，建议重点关注' % s['name']))
            warn_rows.append((s['no'], course['course_no'], '知识点严重薄弱预警', 'MEDIUM',
                              '[预警] %s同学存在多个知识点掌握率低于30%%，建议安排辅导' % s['name']))
            warn_rows.append((s['no'], course['course_no'], '成绩持续下滑预警', 'HIGH',
                              '[预警] %s同学期末成绩较期中明显下滑，存在挂科风险' % s['name']))
    A('INSERT IGNORE INTO t_warning_record (student_id, course_id, rule_id, warning_type, severity, warning_msg)')
    A('SELECT st.id, c.id, wr.id, wr.rule_type, m.severity, m.msg')
    A('FROM (')
    rows = ['  SELECT %s sno, %s cno, %s rule_name, %s severity, %s msg' % (
        q(sno), q(cno), q(rule_name), q(sev), q(msg)) for sno, cno, rule_name, sev, msg in warn_rows]
    A('\n  UNION ALL\n'.join(rows))
    A(') m')
    A('JOIN t_student st ON st.student_no = m.sno')
    A('JOIN t_course c ON c.course_no = m.cno')
    A('JOIN t_warning_rule wr ON wr.rule_name = m.rule_name')
    A('WHERE NOT EXISTS (SELECT 1 FROM t_warning_record w WHERE w.student_id = st.id AND w.warning_msg = m.msg);')
    A('')

    A('SET FOREIGN_KEY_CHECKS = 1;')
    A('')
    A('-- ============================ 生成结束 ============================')

    return '\n'.join(L)


def main():
    sql = build()
    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'rich_data.sql')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(sql + '\n')
    print('生成完成：%s' % out_path)
    print('课程数：%d' % len(COURSES))
    print('班级数：%d' % sum(len(c['classes']) for c in COURSES))
    print('学生数：%d（每班 20 人）' % (len(COURSES) * 2 * 20))
    print('每名学生：3 作业 + 2 测验 + 期中 + 期末 + 10 考勤 + 2 实验')


if __name__ == '__main__':
    main()
