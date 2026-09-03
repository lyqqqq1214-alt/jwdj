# -*- coding: utf-8 -*-
"""
Excel 导入测试数据生成器

在 test-data/excel/ 下生成全部 9 种导入类型的 .xlsx 测试文件，
可直接通过 POST /api/import/upload 验证导入功能。

用法:
    python test-data/generate_test_excel.py

注意:
- 表头文字必须与各 ExcelDTO 的 @ExcelProperty 注解完全一致，改动表头会导致字段映射失败
- 考核类文件（作业/测验/考试成绩）的文件名本身携带元数据: {课程编号}_{类型}_{名称}.xlsx
- 数据为确定性生成（无随机），多次运行输出一致
- 详细格式约定见 test-data/excel/README.md
"""
import os

from openpyxl import Workbook

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "excel")

# 学号, 姓名, 性别, 专业, 班级, 年级 — 前 4 人与 test-data/student.csv 一致（覆盖“已有学生”去重分支）
STUDENTS = [
    ("S2024001", "赵小明", "男", "软件工程", "软件2101", "2024"),
    ("S2024002", "钱小红", "女", "软件工程", "软件2101", "2024"),
    ("S2024003", "孙大伟", "男", "网络工程", "网络2101", "2024"),
    ("S2024004", "李芳芳", "女", "网络工程", "网络2101", "2024"),
    ("S2025001", "陈晨",   "男", "软件工程", "软件2201", "2025"),
    ("S2025002", "林薇",   "女", "软件工程", "软件2201", "2025"),
    ("S2025003", "王浩然", "男", "软件工程", "软件2201", "2025"),
    ("S2025004", "张雨欣", "女", "软件工程", "软件2201", "2025"),
    ("S2025005", "刘子豪", "男", "软件工程", "软件2201", "2025"),
    ("S2025006", "黄诗琪", "女", "软件工程", "软件2201", "2025"),
]

# 作业/测验/考试成绩的知识点池（对应第 1~5 题）
KNOWLEDGE_POINTS = ["线性表", "栈与队列", "树与二叉树", "图论基础", "排序算法"]


def write_sheet(filename, sheet_name, header, rows):
    """写单 Sheet xlsx 文件"""
    wb = Workbook()
    ws = wb.active
    ws.title = sheet_name
    ws.append(header)
    for row in rows:
        ws.append(row)
    path = os.path.join(OUTPUT_DIR, filename)
    wb.save(path)
    print(f"  生成 {filename}: {len(rows)} 行")


def gen_teacher():
    """teacher.xlsx — importType=TEACHER（表头对应 TeacherExcelDTO）"""
    header = ["工号", "姓名", "性别", "学院", "系/部门", "职称", "邮箱", "联系电话"]
    rows = [
        ("T101", "王建军", "男", "计算机学院", "软件工程系", "教授",   "wjj@university.edu.cn", "13900002001"),
        ("T102", "李晓红", "女", "计算机学院", "网络工程系", "副教授", "lxh@university.edu.cn", "13900002002"),
        ("T103", "陈志强", "男", "计算机学院", "计算机系",   "讲师",   "czq@university.edu.cn", "13900002003"),
        ("T104", "刘丽娜", "女", "计算机学院", "软件工程系", "副教授", "lln@university.edu.cn", "13900002004"),
        ("T105", "赵国庆", "男", "计算机学院", "计算机系",   "教授",   "zgq@university.edu.cn", "13900002005"),
    ]
    write_sheet("teacher.xlsx", "教师信息", header, rows)


def gen_student():
    """student.xlsx — importType=STUDENT（表头对应 StudentExcelDTO）"""
    header = ["学号", "姓名", "性别", "学院", "专业", "班级", "年级", "邮箱"]
    rows = [
        (no, name, gender, "计算机学院", major, clazz, grade, f"{no.lower()}@stu.edu.cn")
        for no, name, gender, major, clazz, grade in STUDENTS
    ]
    write_sheet("student.xlsx", "学生信息", header, rows)


def gen_course():
    """course.xlsx — importType=COURSE（表头对应 CourseExcelDTO，教师工号依赖 teacher.xlsx）"""
    header = ["课程编号", "课程名称", "授课教师工号", "学分", "课程类型", "学期", "课程描述"]
    rows = [
        ("CS401", "人工智能导论", "T101", 3.0, "必修", "2025-2026-1", "AI 基础理论与应用"),
        ("CS402", "数据库原理",   "T102", 4.0, "必修", "2025-2026-1", "关系数据库设计与SQL"),
        ("CS403", "编译原理",     "T103", 3.5, "选修", "2025-2026-1", "词法/语法分析与代码生成"),
    ]
    write_sheet("course.xlsx", "课程信息", header, rows)


def gen_class_student():
    """CS101_CLASS_STUDENT_软件2101.xlsx — importType=CLASS_STUDENT（关联种子课程 CS101）"""
    header = ["学号", "姓名", "性别", "学院", "专业", "班级", "年级", "邮箱"]
    rows = [
        (no, name, gender, "计算机学院", major, clazz, grade, f"{no.lower()}@stu.edu.cn")
        for no, name, gender, major, clazz, grade in STUDENTS
    ]
    write_sheet("CS101_CLASS_STUDENT_软件2101.xlsx", "软件2101", header, rows)


def gen_attendance():
    """CS101_ATTENDANCE_第1周.xlsx — importType=ATTENDANCE（覆盖出勤/迟到/缺勤/请假）"""
    header = ["学号", "姓名", "日期", "状态", "节次", "第几周", "备注"]
    status_by_index = {3: "迟到", 5: "缺勤", 6: "请假"}
    rows = []
    for i, (no, name, *_rest) in enumerate(STUDENTS):
        status = status_by_index.get(i % 7, "出勤")
        remark = "未请假缺席" if status == "缺勤" else None
        rows.append((no, name, "2025-09-08", status, "1-2节", 1, remark))
    write_sheet("CS101_ATTENDANCE_第1周.xlsx", "第1周", header, rows)


def gen_experiment():
    """CS101_EXPERIMENT_实验一.xlsx — importType=EXPERIMENT"""
    header = ["学号", "姓名", "实验名称", "实验次数", "分数", "提交时间", "备注"]
    rows = []
    for i, (no, name, *_rest) in enumerate(STUDENTS):
        score = 75 + (i * 3) % 21           # 75~95，确定性分布
        submit = f"2025-09-15 {19 + i % 3:02d}:{(i * 7) % 60:02d}:00"
        remark = "按时提交" if i % 4 == 0 else None
        rows.append((no, name, "实验一：开发环境搭建", 1, str(score), submit, remark))
    write_sheet("CS101_EXPERIMENT_实验一.xlsx", "实验一", header, rows)


def assessment_rows():
    """考核成绩数据行: 序号|学号|姓名|第1~5题(得分,扣分知识点)|总成绩|最薄弱知识点"""
    rows = []
    for i, (no, name, *_rest) in enumerate(STUDENTS):
        row = [i + 1, no, name]
        total, min_score, weakest = 0, 99, ""
        for q in range(1, 6):
            score = 20 - ((i + q) % 4) * 2  # 20/18/16/14，确定性分布
            total += score
            kp = KNOWLEDGE_POINTS[q - 1] if score < 20 else ""
            row.extend([score, kp])
            if score < min_score:
                min_score, weakest = score, kp
        row.extend([total, weakest])
        rows.append(row)
    return rows


def gen_assessment(filename, sheet_name):
    """作业/测验/考试成绩共用格式（5 题，AbstractAssessmentImportStrategy 按表头“第X题得分”检测题目数）"""
    header = ["序号", "学号", "姓名"]
    for q in range(1, 6):
        header.extend([f"第{q}题得分", "扣分知识点"])
    header.extend(["总成绩", "最薄弱知识点"])
    write_sheet(filename, sheet_name, header, assessment_rows())


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"输出目录: {OUTPUT_DIR}")
    gen_teacher()
    gen_student()
    gen_course()
    gen_class_student()
    gen_attendance()
    gen_experiment()
    gen_assessment("CS101_HOMEWORK_第1次作业.xlsx", "软件2101")
    gen_assessment("CS101_QUIZ_第1次测验.xlsx", "软件2101")
    gen_assessment("CS101_EXAM_SCORE_MIDTERM_期中考试.xlsx", "软件2101")
    print("全部生成完成")


if __name__ == "__main__":
    main()
