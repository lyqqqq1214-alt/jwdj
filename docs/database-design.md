# AITAES 数据库设计文档

> **项目名称**：基于AI的数智化教学分析评价系统  
> **数据库名**：`aitaes_db`  
> **字符集**：utf8mb4 / utf8mb4_unicode_ci  
> **存储引擎**：InnoDB  
> **版本**：v3.0 | 最后更新：2026-07-16

---

## 版本变更说明

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-07-05 | 初始版本，评教系统数据库设计 |
| v2.0 | 2026-07-07 | 增加报告、仪表盘、导出相关设计 |
| **v3.0** | **2026-07-09** | **系统重构：从评教转向教学分析评价** |

> **v3.0 重大变更**：系统从"学生评教"重构为"教学分析评价"。4种用户角色（管理员/教师/助教/学生）全部建模。新增统一认证、知识点库、考核扣分追踪、学生画像、AI组卷考试、预警通知、题库错题本等核心表。移除旧评教相关表，简化为27张核心表。

---

## 一、用户角色与数据权限总览

| 角色 | 认证方式 | 管理范围 | 权限来源 |
|------|---------|---------|---------|
| **系统管理员** | `t_user` (role=ADMIN) | 仅管理教师账号，不接触教学数据 | 系统预设 |
| **教师** | `t_user` (role=TEACHER) + `t_teacher` | 自己课程的班级和学生数据 | 管理员创建 |
| **助教** | `t_user` (role=ASSISTANT) + `t_teaching_assistant` | 由教师分配的指定班级和功能 | 教师在班级管理中分配 |
| **学生** | `t_user` (role=STUDENT) + `t_student` | 仅本人数据 | 教师导入/手动添加 |

---

## 二、数据库 ER 图

```
┌──────────────────────────────────────────────────────────────────┐
│                        统一认证层                                  │
│  ┌──────────┐                                                    │
│  │  t_user  │ (id, username, password, role, status, ...)        │
│  └────┬─────┘                                                    │
│       │ user_id                                                   │
│       ├──────────┬──────────┬──────────┐                          │
│       ▼          ▼          ▼          ▼                          │
│  ┌─────────┐ ┌───────┐ ┌──────────┐ ┌─────────┐                 │
│  │t_teacher│ │t_student│ │t_teaching│ │ (admin  │                │
│  │         │ │        │ │_assistant│ │  无额外)│                │
│  └────┬────┘ └───┬────┘ └────┬─────┘ └─────────┘                 │
│       │          │           │                                     │
└───────┼──────────┼───────────┼─────────────────────────────────────┘
        │          │           │
        │          │           │ (助教关联教师)
        │          │           └──────────┐
        ▼          ▼                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                        业务层                                      │
│                                                                    │
│  ┌──────────┐     ┌──────────────────┐     ┌──────────────┐      │
│  │t_course  │────→│ t_course_student │←────│  t_student   │      │
│  │          │     │ (含class_name)   │     │              │      │
│  └────┬─────┘     └──────────────────┘     └──────┬───────┘      │
│       │                                          │                │
│       ├──→ t_knowledge_point (课程知识点树)       │                │
│       │                                          │                │
│       ├──→ t_assessment (考核:作业/测验/考试)     │                │
│       │     └→ t_assessment_record (学生总成绩)    │                │
│       │          └→ t_record_kp_deduction (扣分知识点明细)        │
│       │                                                           │
│       ├──→ t_exam_paper (试卷-组卷发布)                            │
│       │     └→ t_exam_paper_question (试卷题目)                    │
│       │                                                           │
│       ├──→ t_attendance (考勤)                                     │
│       ├──→ t_experiment (实验报告)                                  │
│       ├──→ t_student_kp_mastery (知识掌握度缓存)                   │
│       └──→ t_warning_record (预警)                                  │
│                                                                    │
│  ┌──────────────┐   ┌─────────────────────┐                       │
│  │ t_question_  │   │ t_student_wrong_    │                       │
│  │    bank      │   │     question        │                       │
│  │ (题库-教师级)│   │ (错题本-学生级)     │                       │
│  └──────────────┘   └─────────────────────┘                       │
│                                                                    │
│  ┌──────────────────────────────────────────┐                     │
│  │  通知系统                                 │                     │
│  │  t_notification ──→ t_notification_recipient                   │
│  │  (通知主表)          (接收者+每人已读状态)                      │
│  └──────────────────────────────────────────┘                     │
│                                                                    │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐       │
│  │t_warning_rule│  │ t_system_config│  │t_operation_log   │       │
│  │ (预警规则)   │  │ (系统参数配置) │  │ (操作日志)       │       │
│  └──────────────┘  └───────────────┘  └──────────────────┘       │
│                                                                    │
│  ┌──────────────────────────────────────────────┐                 │
│  │  t_assistant_permission (助教权限)            │                 │
│  │  (可查看班级/可导入/可批阅/可看画像)          │                 │
│  └──────────────────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 三、表结构详细设计

> 所有业务表包含 `deleted TINYINT DEFAULT 0` 字段，由 MyBatis-Plus 全局自动管理，以下不再逐表列出。

---

### 3.1 统一认证层

#### 表 1：`t_user` — 统一用户认证表

4种角色共用此表登录，`role` 字段区分角色类型。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `username` | VARCHAR(32) | NOT NULL, **UNIQUE** | 登录账号 |
| `password` | VARCHAR(256) | NOT NULL | BCrypt加密存储 |
| `role` | VARCHAR(16) | NOT NULL | ADMIN / TEACHER / ASSISTANT / STUDENT |
| `status` | VARCHAR(16) | DEFAULT 'ACTIVE' | ACTIVE(正常) / DISABLED(已禁用) |
| `first_login` | TINYINT | DEFAULT 1 | 首次登录标记（1=首次，强制改密码） |
| `last_login_time` | DATETIME | — | 最近一次登录时间 |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `update_time` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**唯一索引**：`uk_username`(username)  
**普通索引**：`idx_role`(role), `idx_status`(status)

---

#### 表 2：`t_teacher` — 教师信息表

通过 `user_id` 关联 `t_user`，教师登录后通过此表获取教学数据。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `user_id` | BIGINT | NOT NULL, **UNIQUE FK** → t_user.id, CASCADE | 关联用户账号 |
| `teacher_no` | VARCHAR(32) | NOT NULL, **UNIQUE** | 工号 |
| `name` | VARCHAR(64) | NOT NULL | 姓名 |
| `gender` | VARCHAR(8) | — | 性别 |
| `college` | VARCHAR(128) | — | 学院 |
| `department` | VARCHAR(128) | — | 系/部门 |
| `title` | VARCHAR(64) | — | 职称 |
| `email` | VARCHAR(128) | — | 邮箱 |
| `phone` | VARCHAR(32) | — | 联系电话 |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `update_time` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**外键**：`fk_teacher_user` → `t_user(id)` **ON DELETE CASCADE ON UPDATE CASCADE**  
**索引**：`uk_teacher_no`(UNIQUE), `uk_user_id`(UNIQUE), `idx_college`, `idx_name`

---

#### 表 3：`t_teaching_assistant` — 助教表

助教是独立角色。关联教师，权限由教师在班级管理中分配。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `user_id` | BIGINT | NOT NULL, **UNIQUE FK** → t_user.id, CASCADE | 关联用户账号 |
| `teacher_id` | BIGINT | NOT NULL, **FK** → t_teacher.id, CASCADE | 所属教师（哪位教师的助教） |
| `name` | VARCHAR(64) | NOT NULL | 姓名 |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**外键**：
- `fk_ta_user` → `t_user(id)` **ON DELETE CASCADE ON UPDATE CASCADE**
- `fk_ta_teacher` → `t_teacher(id)` **ON DELETE CASCADE ON UPDATE CASCADE`

**索引**：`uk_user_id`(UNIQUE), `idx_teacher_id`

---

#### 表 4：`t_assistant_permission` — 助教权限配置表

教师在班级管理中为助教分配权限。一条记录 = 一个助教在一个班级的一项权限。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `assistant_id` | BIGINT | NOT NULL, **FK** → t_teaching_assistant.id, CASCADE | 助教ID |
| `course_id` | BIGINT | NOT NULL, **FK** → t_course.id, CASCADE | 课程ID |
| `can_view_data` | TINYINT | DEFAULT 1 | 是否可查看班级数据（驾驶舱+学生画像） |
| `can_import_data` | TINYINT | DEFAULT 0 | 是否允许导入数据（作业/考勤/实验） |
| `can_grade` | TINYINT | DEFAULT 0 | 是否允许批阅（主观题阅卷） |
| `can_view_portrait` | TINYINT | DEFAULT 0 | 是否允许查看学生画像 |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**唯一约束**：`uk_assistant_course`(assistant_id, course_id) — 同一助教+同一课程只有一条权限

**外键**：
- `fk_ap_assistant` → `t_teaching_assistant(id)` **ON DELETE CASCADE ON UPDATE CASCADE**
- `fk_ap_course` → `t_course(id)` **ON DELETE CASCADE ON UPDATE CASCADE`

**索引**：`uk_assistant_course`(UNIQUE), `idx_assistant_id`, `idx_course_id`

---

#### 表 5：`t_student` — 学生信息表

通过 `user_id` 关联 `t_user`。由教师导入Excel或手动添加时自动创建账号。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `user_id` | BIGINT | NOT NULL, **UNIQUE FK** → t_user.id, CASCADE | 关联用户账号 |
| `student_no` | VARCHAR(32) | NOT NULL, **UNIQUE** | 学号 |
| `name` | VARCHAR(64) | NOT NULL | 姓名 |
| `gender` | VARCHAR(8) | — | 性别 |
| `college` | VARCHAR(128) | — | 学院 |
| `major` | VARCHAR(128) | — | 专业 |
| `class_name` | VARCHAR(128) | — | 班级（注：学生主班级，选课时仍以t_course_student.class_name为准） |
| `grade` | VARCHAR(16) | — | 年级 |
| `avatar` | VARCHAR(512) | — | 头像URL（默认占位） |
| `email` | VARCHAR(128) | — | 邮箱 |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `update_time` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**外键**：`fk_student_user` → `t_user(id)` **ON DELETE CASCADE ON UPDATE CASCADE**  
**索引**：`uk_student_no`(UNIQUE), `uk_user_id`(UNIQUE), `idx_college`, `idx_major`, `idx_grade`

---

### 3.2 课程与选课

---

#### 表 6：`t_course` — 课程表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `course_no` | VARCHAR(32) | NOT NULL, **UNIQUE** | 课程编号 |
| `course_name` | VARCHAR(256) | NOT NULL | 课程名称 |
| `class_name` | VARCHAR(256) | — | 班级名称（默认为课程名） |
| `teacher_id` | BIGINT | **FK** → t_teacher.id, SET NULL | 授课教师 |
| `credit` | DECIMAL(4,1) | DEFAULT 0.0 | 学分 |
| `course_type` | VARCHAR(32) | — | 必修 / 选修 / 公选 |
| `semester` | VARCHAR(32) | — | 学期（格式：2025-2026-1） |
| `description` | VARCHAR(1024) | — | 课程描述 |
| `knowledge_point_list` | JSON | — | 课程知识点结构缓存（JSON数组，按章节层级） |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `update_time` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**外键**：`fk_course_teacher` → `t_teacher(id)` **ON DELETE SET NULL ON UPDATE CASCADE**  
**索引**：`uk_course_no`(UNIQUE), `idx_teacher_id`, `idx_semester`, `idx_course_type`

---

#### 表 7：`t_course_student` — 选课关联表

学生在某门课程中属于某个班级。一个学生可在不同课程中属于不同班级。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `course_id` | BIGINT | NOT NULL, **FK** → t_course.id, CASCADE | 课程ID |
| `student_id` | BIGINT | NOT NULL, **FK** → t_student.id, CASCADE | 学生ID |
| `class_name` | VARCHAR(64) | — | 在此课程中的班级（如"计科1801"） |
| `semester` | VARCHAR(32) | — | 选课学期 |
| `is_focus` | TINYINT | DEFAULT 0 | 教师重点关注标记（标记后在驾驶舱预警优先显示，通知时可快速选择） |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 选课时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除（退课标记，不删除学生账号） |

**唯一约束**：`uk_course_student`(course_id, student_id)

**外键**：
- `fk_cs_course` → `t_course(id)` **ON DELETE CASCADE ON UPDATE CASCADE**
- `fk_cs_student` → `t_student(id)` **ON DELETE CASCADE ON UPDATE CASCADE`

**索引**：`uk_course_student`(UNIQUE), `idx_course_id`, `idx_student_id`, `idx_class_name`, `idx_is_focus`

---

### 3.3 知识点体系

---

#### 表 8：`t_knowledge_point` — 课程知识点库 ⭐核心

每个课程拥有独立的知识点树，支持三层级（章→节→具体知识点）。AI出题、学生画像雷达图、扣分分析均依赖此表。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `course_id` | BIGINT | NOT NULL, **FK** → t_course.id, CASCADE | 所属课程 |
| `kp_name` | VARCHAR(256) | NOT NULL | 知识点名称（如"TCP三次握手"） |
| `kp_category` | VARCHAR(128) | — | 知识点分类/章节（如"第5章 传输层"） |
| `parent_id` | BIGINT | **FK** → self, SET NULL | 父知识点ID |
| `level` | TINYINT | DEFAULT 1 | 层级：1=章, 2=节, 3=具体知识点 |
| `difficulty` | VARCHAR(16) | DEFAULT 'MEDIUM' | 难度：EASY / MEDIUM / HARD |
| `description` | VARCHAR(512) | — | 知识点说明 |
| `sort_order` | INT | DEFAULT 0 | 排序 |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**唯一约束**：`uk_course_kp`(course_id, kp_name) — 同课程下知识点名称唯一

**外键**：
- `fk_kp_course` → `t_course(id)` **ON DELETE CASCADE ON UPDATE CASCADE**
- `fk_kp_parent` → `t_knowledge_point(id)` **ON DELETE SET NULL ON UPDATE CASCADE`

**索引**：`uk_course_kp`(UNIQUE), `idx_course_id`, `idx_category`, `idx_parent_id`, `idx_level`

---

### 3.4 考核与成绩追踪 ⭐核心

---

#### 表 9：`t_assessment` — 考核表

统一管理作业/测验/实验/期中/期末考试。在线考试使用特有字段（start_time, end_time, duration, status）。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `course_id` | BIGINT | NOT NULL, **FK** → t_course.id, CASCADE | 所属课程 |
| `assessment_name` | VARCHAR(256) | NOT NULL | 考核名称 |
| `assessment_type` | VARCHAR(32) | NOT NULL | HOMEWORK / QUIZ / EXPERIMENT / MIDTERM / FINAL |
| `assessment_no` | INT | — | 第X次（作业的第几次、实验的第几次） |
| `total_score` | DECIMAL(5,2) | DEFAULT 100.00 | 满分 |
| `question_count` | INT | DEFAULT 0 | 题目数量 |
| `assessment_date` | DATE | — | 考核日期 |
| `start_time` | DATETIME | — | 在线考试开始时间 |
| `end_time` | DATETIME | — | 在线考试截止时间 |
| `duration_minutes` | INT | — | 考试时长（分钟） |
| `status` | VARCHAR(16) | DEFAULT 'DRAFT' | DRAFT / PUBLISHED / ONGOING / ENDED |
| `semester` | VARCHAR(32) | — | 学期 |
| `description` | VARCHAR(1024) | — | 说明/备注 |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**唯一约束**：`uk_course_assessment`(course_id, assessment_name)

**外键**：`fk_assessment_course` → `t_course(id)` **ON DELETE CASCADE ON UPDATE CASCADE**

**索引**：`uk_course_assessment`(UNIQUE), `idx_course_id`, `idx_assessment_type`, `idx_semester`, `idx_status`, `idx_course_semester`(course_id, semester)

---

#### 表 10：`t_assessment_record` — 学生考核成绩记录

每个学生对每次考核的一条总成绩记录。重点标记该生本次最薄弱的知识点和方面。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `assessment_id` | BIGINT | NOT NULL, **FK** → t_assessment.id, CASCADE | 考核ID |
| `student_id` | BIGINT | NOT NULL, **FK** → t_student.id, CASCADE | 学生ID |
| `total_score` | DECIMAL(5,2) | — | 总成绩 |
| `submit_status` | VARCHAR(16) | DEFAULT 'ON_TIME' | ON_TIME(按时) / LATE(迟交) / ABSENT(缺考/未交) |
| `weakest_kp` | VARCHAR(512) | — | 本次最薄弱知识点（扣分最多的知识点） |
| `weakest_aspect` | VARCHAR(256) | — | 最薄弱方面归类（"概念理解"/"计算能力"/"协议机制"/"审题偏差"） |
| `submit_time` | DATETIME | — | 提交时间 |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**唯一约束**：`uk_record`(assessment_id, student_id)

**外键**：
- `fk_record_assessment` → `t_assessment(id)` **ON DELETE CASCADE ON UPDATE CASCADE**
- `fk_record_student` → `t_student(id)` **ON DELETE CASCADE ON UPDATE CASCADE`

**索引**：`uk_record`(UNIQUE), `idx_student_id`, `idx_assessment_id`, `idx_submit_status`

---

#### 表 11：`t_record_kp_deduction` — 扣分知识点明细 ⭐⭐⭐学生画像核心支撑表

**每一行 = 某学生在某次考核的某道题上，因为某个知识点而扣分。**

数据源自Excel模板中"第X题得分"和"扣分主要知识点"列。汇总此表即可精确计算每个学生对每个知识点的掌握程度。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `record_id` | BIGINT | NOT NULL, **FK** → t_assessment_record.id, CASCADE | 成绩记录ID |
| `question_no` | INT | NOT NULL | 题号（第X题，从1开始） |
| `question_score` | DECIMAL(5,2) | — | 该题得分 |
| `max_score` | DECIMAL(5,2) | — | 该题满分 |
| `deduction_kp` | VARCHAR(512) | NOT NULL | 扣分涉及的知识点（多个用逗号分隔） |
| `deduction_aspect` | VARCHAR(256) | — | 扣分方面归类：概念混淆 / 计算错误 / 协议机制理解不清 / 审题偏差 / 知识点遗忘 |
| `deduction_detail` | VARCHAR(1024) | — | 详细扣分说明（如"子网掩码计算中网络位与主机位判断错误"） |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**外键**：`fk_deduction_record` → `t_assessment_record(id)` **ON DELETE CASCADE ON UPDATE CASCADE**

**索引**：`idx_record_id`, `idx_question_no`, `idx_deduction_kp`(deduction_kp(255))

**数据来源示例**（对应Excel模板一行）：

| 模板列 | 示例值 | → 映射字段 |
|--------|--------|-----------|
| 学号 | 201726010101 | → t_assessment_record.student_id |
| 第1题得分 | 15 | → question_no=1, question_score=15, max_score=20 |
| 扣分主要知识点 | 数据报分片 | → deduction_kp="IP数据报分片", deduction_aspect="计算错误" |
| 总成绩 | 88 | → t_assessment_record.total_score |
| 最薄弱知识点 | 路由算法 | → t_assessment_record.weakest_kp |

---

#### 表 12：`t_student_kp_mastery` — 学生知识点掌握度（计算缓存）

每次导入数据后自动汇总 `t_record_kp_deduction` 计算。学生画像雷达图直接从此表读取。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `student_id` | BIGINT | NOT NULL, **FK** → t_student.id, CASCADE | 学生ID |
| `course_id` | BIGINT | NOT NULL, **FK** → t_course.id, CASCADE | 课程ID |
| `kp_name` | VARCHAR(256) | NOT NULL | 知识点名称 |
| `mastery_rate` | DECIMAL(5,2) | — | 掌握率（0-100，如85.00=85%） |
| `class_avg_rate` | DECIMAL(5,2) | — | 班级平均掌握率（雷达图对比虚线） |
| `lose_count` | INT | DEFAULT 0 | 涉及该知识点的扣分次数 |
| `total_question_count` | INT | DEFAULT 0 | 涉及该知识点的总题目数 |
| `last_assessment_id` | BIGINT | — | 最近一次涉及该知识点的考核ID |
| `last_updated` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**唯一约束**：`uk_student_kp`(student_id, course_id, kp_name)

**外键**：
- `fk_mastery_student` → `t_student(id)` **ON DELETE CASCADE ON UPDATE CASCADE**
- `fk_mastery_course` → `t_course(id)` **ON DELETE CASCADE ON UPDATE CASCADE`

**索引**：`uk_student_kp`(UNIQUE), `idx_student_id`, `idx_course_id`, `idx_mastery_rate`

**掌握率公式**：
```
mastery_rate = MAX(0, 100 - (该生该知识点总扣分 / 该生该知识点涉及总分) × 100)
class_avg_rate = AVG(同班级所有学生对该知识点的 mastery_rate)
```

---

### 3.5 考勤与实验

---

#### 表 13：`t_attendance` — 考勤记录表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `course_id` | BIGINT | NOT NULL, **FK** → t_course.id, CASCADE | 课程ID |
| `student_id` | BIGINT | NOT NULL, **FK** → t_student.id, CASCADE | 学生ID |
| `attendance_date` | DATE | NOT NULL | 日期 |
| `status` | VARCHAR(16) | NOT NULL | PRESENT(出勤) / LATE(迟到) / LEAVE(请假) / ABSENT(缺勤) |
| `week_no` | INT | — | 第几周 |
| `period` | VARCHAR(32) | — | 节次（如"第1-2节"） |
| `semester` | VARCHAR(32) | — | 学期 |
| `remark` | VARCHAR(256) | — | 备注 |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**唯一约束**：`uk_attendance`(course_id, student_id, attendance_date) — 同一学生同一天不重复

**外键**：
- `fk_att_course` → `t_course(id)` **ON DELETE CASCADE ON UPDATE CASCADE**
- `fk_att_student` → `t_student(id)` **ON DELETE CASCADE ON UPDATE CASCADE`

**索引**：`uk_attendance`(UNIQUE), `idx_student_id`, `idx_attendance_date`, `idx_semester`

---

#### 表 14：`t_experiment` — 实验报告表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `course_id` | BIGINT | NOT NULL, **FK** → t_course.id, CASCADE | 课程ID |
| `student_id` | BIGINT | NOT NULL, **FK** → t_student.id, CASCADE | 学生ID |
| `experiment_name` | VARCHAR(256) | NOT NULL | 实验名称 |
| `experiment_no` | INT | — | 第X次实验 |
| `score` | DECIMAL(5,2) | — | 分数 |
| `submit_time` | DATETIME | — | 提交时间 |
| `knowledge_point_ids` | VARCHAR(1024) | — | 关联知识点ID列表（逗号分隔） |
| `semester` | VARCHAR(32) | — | 学期 |
| `remark` | VARCHAR(512) | — | 评语/备注 |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**外键**：
- `fk_exp_course` → `t_course(id)` **ON DELETE CASCADE ON UPDATE CASCADE**
- `fk_exp_student` → `t_student(id)` **ON DELETE CASCADE ON UPDATE CASCADE`

**索引**：`idx_course_id`, `idx_student_id`, `idx_semester`, `idx_experiment_no`

---

### 3.6 考试与题库

---

#### 表 15：`t_exam_paper` — 试卷表（AI组卷发布）

教师从题库选择题目组卷后，创建一条试卷记录并发布给指定班级。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `course_id` | BIGINT | NOT NULL, **FK** → t_course.id, CASCADE | 所属课程 |
| `teacher_id` | BIGINT | NOT NULL, **FK** → t_teacher.id, CASCADE | 组卷教师 |
| `paper_name` | VARCHAR(256) | NOT NULL | 试卷名称（如"期中考试-网络层与传输层"） |
| `total_score` | DECIMAL(5,2) | DEFAULT 100.00 | 满分 |
| `duration_minutes` | INT | DEFAULT 120 | 考试时长（分钟） |
| `start_time` | DATETIME | — | 考试开始时间 |
| `end_time` | DATETIME | — | 考试截止时间 |
| `target_classes` | VARCHAR(512) | — | 参与班级（逗号分隔，如"计科1801,计科1802"） |
| `status` | VARCHAR(16) | DEFAULT 'DRAFT' | DRAFT / PUBLISHED / ONGOING / ENDED |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**外键**：
- `fk_paper_course` → `t_course(id)` **ON DELETE CASCADE ON UPDATE CASCADE**
- `fk_paper_teacher` → `t_teacher(id)` **ON DELETE CASCADE ON UPDATE CASCADE`

**索引**：`idx_course_id`, `idx_teacher_id`, `idx_status`, `idx_start_time`

---

#### 表 16：`t_exam_paper_question` — 试卷题目关联表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `paper_id` | BIGINT | NOT NULL, **FK** → t_exam_paper.id, CASCADE | 试卷ID |
| `question_id` | BIGINT | NOT NULL, **FK** → t_question_bank.id, CASCADE | 题库题目ID |
| `question_no` | INT | NOT NULL | 题号（在试卷中的排序） |
| `score` | DECIMAL(5,2) | NOT NULL | 本题在试卷中的分值 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**外键**：
- `fk_pq_paper` → `t_exam_paper(id)` **ON DELETE CASCADE ON UPDATE CASCADE**
- `fk_pq_question` → `t_question_bank(id)` **ON DELETE CASCADE ON UPDATE CASCADE`

**唯一约束**：`uk_paper_question`(paper_id, question_id)  
**索引**：`idx_paper_id`, `idx_question_no`

---

#### 表 17：`t_question_bank` — 题库表

教师个人题库。AI生成的题目审核通过后入库，可复用于组卷。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `course_id` | BIGINT | NOT NULL, **FK** → t_course.id, CASCADE | 所属课程 |
| `teacher_id` | BIGINT | NOT NULL, **FK** → t_teacher.id, CASCADE | 所属教师（题库为教师级） |
| `question_type` | VARCHAR(32) | NOT NULL | SINGLE(单选) / MULTI(多选) / FILL(填空) / SHORT(简答) / COMPREHENSIVE(综合) |
| `difficulty` | VARCHAR(16) | DEFAULT 'MEDIUM' | EASY / MEDIUM / HARD |
| `content` | TEXT | NOT NULL | 题目内容（JSON：题干+选项+答案+解析+知识点标签） |
| `knowledge_points` | VARCHAR(512) | — | 关联知识点（逗号分隔） |
| `ai_generated` | TINYINT | DEFAULT 0 | 是否AI生成 |
| `quality_clarity` | TINYINT | — | AI质量评分-清晰度(1-5) |
| `quality_difficulty` | TINYINT | — | AI质量评分-难度匹配度(1-5) |
| `quality_ambiguity` | TINYINT | — | AI质量评分-歧义性(1-5, 5=无歧义) |
| `quality_kp_coverage` | TINYINT | — | AI质量评分-知识点覆盖度(1-5) |
| `socratic_mode` | TINYINT | DEFAULT 0 | 是否苏格拉底模式（启发式追问） |
| `socratic_chain` | TEXT | — | 苏格拉底追问链（JSON数组，2-3个递进追问） |
| `usage_count` | INT | DEFAULT 0 | 被使用次数 |
| `status` | VARCHAR(16) | DEFAULT 'DRAFT' | DRAFT / APPROVED(审核通过) / PUBLISHED(已发布) |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `update_time` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**外键**：
- `fk_qb_course` → `t_course(id)` **ON DELETE CASCADE ON UPDATE CASCADE**
- `fk_qb_teacher` → `t_teacher(id)` **ON DELETE CASCADE ON UPDATE CASCADE`

**索引**：`idx_course_id`, `idx_teacher_id`, `idx_type_diff`(question_type, difficulty), `idx_status`, `idx_ai_generated`

**content JSON 结构示例**：
```json
{
  "stem": "在TCP协议中，三次握手过程的目的是什么？",
  "options": [
    {"label": "A", "text": "确保数据传输的可靠性"},
    {"label": "B", "text": "建立双方的通信连接"},
    {"label": "C", "text": "确定数据传输的速率"},
    {"label": "D", "text": "验证双方的IP地址"}
  ],
  "answer": "B",
  "analysis": "TCP三次握手的核心目的是在客户端与服务器之间建立可靠的通信连接，同步双方的初始序列号(ISN)..."
}
```

---

#### 表 18：`t_student_wrong_question` — 错题本

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `student_id` | BIGINT | NOT NULL, **FK** → t_student.id, CASCADE | 学生ID |
| `course_id` | BIGINT | NOT NULL, **FK** → t_course.id, CASCADE | 课程ID |
| `question_content` | TEXT | — | 题目内容快照（JSON格式：题型+题干+选项） |
| `student_answer` | VARCHAR(2048) | — | 学生答案（红色标记错误） |
| `correct_answer` | VARCHAR(2048) | — | 正确答案（绿色标记） |
| `knowledge_points` | VARCHAR(512) | — | 关联知识点 |
| `analysis` | TEXT | — | 解析（AI生成或教师预设） |
| `wrong_count` | INT | DEFAULT 1 | 错误次数（同一题错多次时累加） |
| `source` | VARCHAR(32) | DEFAULT 'ASSESSMENT' | 来源：ASSESSMENT(考核) / AI_GENERATE(AI练习) |
| `source_id` | BIGINT | — | 来源记录ID |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 首次错误时间 |
| `update_time` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 最近错误时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**外键**：
- `fk_wq_student` → `t_student(id)` **ON DELETE CASCADE ON UPDATE CASCADE**
- `fk_wq_course` → `t_course(id)` **ON DELETE CASCADE ON UPDATE CASCADE`

**索引**：`idx_student_id`, `idx_course_id`, `idx_kp`(knowledge_points(255)), `idx_source`

---

### 3.7 预警系统

---

#### 表 19：`t_warning_rule` — 预警规则配置表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `rule_name` | VARCHAR(128) | NOT NULL | 规则名称 |
| `rule_type` | VARCHAR(32) | NOT NULL | 类型：ATTENDANCE / SCORE_DROP / HOMEWORK_MISS / KP_WEAK |
| `threshold` | VARCHAR(128) | NOT NULL | 阈值表达式 |
| `severity` | VARCHAR(8) | DEFAULT 'HIGH' | 默认严重程度：HIGH / MEDIUM / LOW |
| `is_active` | TINYINT | DEFAULT 1 | 是否启用 |
| `description` | VARCHAR(256) | — | 规则说明 |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**预置规则**：

| rule_type | rule_name | threshold | severity |
|-----------|-----------|-----------|----------|
| ATTENDANCE | 缺勤过多 | 缺勤次数≥3 | HIGH |
| SCORE_DROP | 成绩持续下滑 | 连续2次成绩下降≥20% | HIGH |
| HOMEWORK_MISS | 作业连续未交 | 连续3次作业未交 | HIGH |
| KP_WEAK | 知识点严重薄弱 | 单知识点掌握率<30% | MEDIUM |

---

#### 表 20：`t_warning_record` — 预警记录表

触发条件满足时自动生成。同一学生+同一类型24h内不重复生成。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `student_id` | BIGINT | NOT NULL, **FK** → t_student.id, CASCADE | 学生ID |
| `course_id` | BIGINT | NOT NULL, **FK** → t_course.id, CASCADE | 课程ID |
| `rule_id` | BIGINT | — | 触发规则ID |
| `warning_type` | VARCHAR(32) | NOT NULL | 预警类型（对应rule_type） |
| `severity` | VARCHAR(8) | NOT NULL | HIGH / MEDIUM / LOW |
| `warning_msg` | VARCHAR(512) | NOT NULL | 预警消息（如"[预警] 王小明同学已缺勤5次，建议重点关注"） |
| `is_resolved` | TINYINT | DEFAULT 0 | 是否已解除 |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 触发时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**外键**：
- `fk_warn_student` → `t_student(id)` **ON DELETE CASCADE ON UPDATE CASCADE**
- `fk_warn_course` → `t_course(id)` **ON DELETE CASCADE ON UPDATE CASCADE`

**索引**：`idx_student_id`, `idx_course_id`, `idx_severity`, `idx_create_time`, `idx_course_severity`(course_id, severity)

---

### 3.8 通知系统

---

#### 表 21：`t_notification` — 通知主表

教师手动发送或系统自动生成的通知。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `sender_id` | BIGINT | — | 发送者 t_user.id（NULL=系统自动） |
| `sender_name` | VARCHAR(64) | — | 发送者姓名（冗余，方便展示） |
| `title` | VARCHAR(256) | NOT NULL | 标题 |
| `content` | TEXT | NOT NULL | 内容 |
| `notification_type` | VARCHAR(32) | DEFAULT 'MANUAL' | MANUAL(手动) / WARNING(预警) / EXAM_REMIND(考试提醒) / SYSTEM(系统) |
| `recipient_scope` | VARCHAR(16) | NOT NULL | ALL(全部) / COURSE(指定课程) / STUDENTS(指定学生) |
| `course_id` | BIGINT | — | 关联课程ID（recipient_scope=COURSE时使用） |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 发送时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**索引**：`idx_sender_id`, `idx_notification_type`, `idx_create_time`, `idx_course_id`

---

#### 表 22：`t_notification_recipient` — 通知接收者表

记录每个接收者的已读状态。学生端铃铛的红点数字 = COUNT(is_read=0)。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `notification_id` | BIGINT | NOT NULL, **FK** → t_notification.id, CASCADE | 通知ID |
| `recipient_id` | BIGINT | NOT NULL, **FK** → t_user.id, CASCADE | 接收者 t_user.id |
| `is_read` | TINYINT | DEFAULT 0 | 是否已读 |
| `read_time` | DATETIME | — | 阅读时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**唯一约束**：`uk_notif_recipient`(notification_id, recipient_id)

**外键**：
- `fk_nr_notification` → `t_notification(id)` **ON DELETE CASCADE ON UPDATE CASCADE**
- `fk_nr_recipient` → `t_user(id)` **ON DELETE CASCADE ON UPDATE CASCADE`

**索引**：`uk_notif_recipient`(UNIQUE), `idx_recipient_read`(recipient_id, is_read)

---

### 3.9 系统管理

---

#### 表 23：`t_system_config` — 系统参数配置表

系统管理员面板2的配置项。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `config_key` | VARCHAR(64) | NOT NULL, **UNIQUE** | 配置键 |
| `config_value` | VARCHAR(512) | NOT NULL | 配置值 |
| `config_type` | VARCHAR(32) | DEFAULT 'STRING' | STRING / INT / BOOLEAN / JSON |
| `description` | VARCHAR(256) | — | 配置说明 |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `update_time` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**预置配置**：

| config_key | config_value | 说明 |
|-----------|-------------|------|
| `ai.api.base_url` | `http://localhost:11434` | 大模型API地址 |
| `ai.api.model_name` | `qwen2.5:7b` | 大模型名称 |
| `ai.api.timeout_seconds` | `60` | 模型超时时间(秒) |
| `default.password` | `123456` | 默认初始密码 |
| `warning.attendance_threshold` | `3` | 缺勤次数阈值 |
| `warning.score_drop_threshold` | `20` | 成绩下滑幅度阈值(%) |
| `warning.score_drop_times` | `2` | 成绩连续下滑次数 |
| `warning.homework_miss_times` | `3` | 作业连续未交次数 |
| `warning.kp_mastery_threshold` | `30` | 知识点薄弱阈值(%) |
| `warning.dedup_hours` | `24` | 预警去重时间(小时) |
| `log.retention_days` | `30` | 日志保留天数 |

**索引**：`uk_config_key`(UNIQUE)

---

#### 表 24：`t_operation_log` — 操作日志表

记录用户操作、AI调用、系统错误。需求要求保留至少30天。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `log_type` | VARCHAR(32) | NOT NULL | OPERATION(操作) / AI_CALL(AI调用) / ERROR(错误) |
| `user_id` | BIGINT | — | 操作用户 t_user.id |
| `username` | VARCHAR(32) | — | 操作用户名（冗余） |
| `action` | VARCHAR(128) | NOT NULL | 操作描述（如"导入作业成绩"/"发布考试"/"AI出题"） |
| `target_type` | VARCHAR(32) | — | 操作目标类型（如ASSESSMENT/EXAM_PAPER） |
| `target_id` | BIGINT | — | 操作目标ID |
| `detail` | TEXT | — | 详细信息（JSON格式：参数/耗时/结果） |
| `ip_address` | VARCHAR(64) | — | 操作IP |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 日志时间（MySQL分区键） |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**索引**：`idx_log_type`, `idx_user_id`, `idx_create_time`, `idx_type_time`(log_type, create_time)

---

### 3.10 辅助表

---

#### 表 25：`t_data_source` — 数据源配置表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `source_name` | VARCHAR(128) | NOT NULL | 数据源名称 |
| `source_type` | VARCHAR(32) | NOT NULL | EXCEL / TXT / CSV |
| `file_path` | VARCHAR(512) | — | 文件路径 |
| `description` | VARCHAR(512) | — | 说明 |
| `status` | VARCHAR(16) | DEFAULT 'ACTIVE' | ACTIVE / INACTIVE |
| `create_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `update_time` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

---

#### 表 26：`t_data_import_log` — 数据导入日志表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `source_id` | BIGINT | **FK** → t_data_source.id, SET NULL | 数据源ID |
| `user_id` | BIGINT | — | 导入者 t_user.id |
| `file_name` | VARCHAR(256) | — | 导入文件名 |
| `import_type` | VARCHAR(32) | — | HOMEWORK / ATTENDANCE / EXPERIMENT / QUIZ / EXAM_SCORE / KNOWLEDGE_POINT / CLASS_STUDENT / TEACHER / STUDENT |
| `total_rows` | INT | DEFAULT 0 | 总行数 |
| `success_rows` | INT | DEFAULT 0 | 成功行数 |
| `fail_rows` | INT | DEFAULT 0 | 失败行数 |
| `status` | VARCHAR(16) | — | SUCCESS / PARTIAL / FAILED |
| `error_msg` | TEXT | — | 错误详情 |
| `import_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 导入时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**外键**：`fk_log_source` → `t_data_source(id)` **ON DELETE SET NULL ON UPDATE CASCADE**  
**索引**：`idx_source_id`, `idx_user_id`, `idx_import_type`, `idx_status`, `idx_import_time`

---

#### 表 27：`t_ai_analysis_result` — AI分析结果表

多态关联，可指向学生/课程/报告/考核/考试。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 主键 |
| `analysis_type` | VARCHAR(32) | — | KP_MASTERY / WRONG_QUESTION / STUDENT_PORTRAIT / QUESTION_GENERATE / EXAM_ANALYSIS / SOCRATIC_QUESTION / TEXT_ANALYSIS |
| `target_type` | VARCHAR(32) | — | STUDENT / COURSE / ASSESSMENT / EXAM_PAPER / REPORT |
| `target_id` | BIGINT | — | 分析目标ID |
| `result_data` | JSON | — | AI分析结果 |
| `model_name` | VARCHAR(64) | — | AI模型名称 |
| `process_time_ms` | INT | — | 推理耗时（毫秒） |
| `analysis_time` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 分析时间 |
| `deleted` | TINYINT | DEFAULT 0 | 逻辑删除 |

**索引**：`idx_target`(target_type, target_id), `idx_analysis_type`, `idx_analysis_time`

---

## 四、外键约束汇总

| # | 约束名 | 子表 | 父表 | 删除策略 |
|---|--------|------|------|---------|
| 1 | `fk_teacher_user` | t_teacher.user_id | t_user.id | CASCADE |
| 2 | `fk_ta_user` | t_teaching_assistant.user_id | t_user.id | CASCADE |
| 3 | `fk_ta_teacher` | t_teaching_assistant.teacher_id | t_teacher.id | CASCADE |
| 4 | `fk_student_user` | t_student.user_id | t_user.id | CASCADE |
| 5 | `fk_ap_assistant` | t_assistant_permission.assistant_id | t_teaching_assistant.id | CASCADE |
| 6 | `fk_ap_course` | t_assistant_permission.course_id | t_course.id | CASCADE |
| 7 | `fk_course_teacher` | t_course.teacher_id | t_teacher.id | SET NULL |
| 8 | `fk_cs_course` | t_course_student.course_id | t_course.id | CASCADE |
| 9 | `fk_cs_student` | t_course_student.student_id | t_student.id | CASCADE |
| 10 | `fk_kp_course` | t_knowledge_point.course_id | t_course.id | CASCADE |
| 11 | `fk_kp_parent` | t_knowledge_point.parent_id | t_knowledge_point.id | SET NULL |
| 12 | `fk_assessment_course` | t_assessment.course_id | t_course.id | CASCADE |
| 13 | `fk_record_assessment` | t_assessment_record.assessment_id | t_assessment.id | CASCADE |
| 14 | `fk_record_student` | t_assessment_record.student_id | t_student.id | CASCADE |
| 15 | `fk_deduction_record` | t_record_kp_deduction.record_id | t_assessment_record.id | CASCADE |
| 16 | `fk_mastery_student` | t_student_kp_mastery.student_id | t_student.id | CASCADE |
| 17 | `fk_mastery_course` | t_student_kp_mastery.course_id | t_course.id | CASCADE |
| 18 | `fk_att_course` | t_attendance.course_id | t_course.id | CASCADE |
| 19 | `fk_att_student` | t_attendance.student_id | t_student.id | CASCADE |
| 20 | `fk_exp_course` | t_experiment.course_id | t_course.id | CASCADE |
| 21 | `fk_exp_student` | t_experiment.student_id | t_student.id | CASCADE |
| 22 | `fk_paper_course` | t_exam_paper.course_id | t_course.id | CASCADE |
| 23 | `fk_paper_teacher` | t_exam_paper.teacher_id | t_teacher.id | CASCADE |
| 24 | `fk_pq_paper` | t_exam_paper_question.paper_id | t_exam_paper.id | CASCADE |
| 25 | `fk_pq_question` | t_exam_paper_question.question_id | t_question_bank.id | CASCADE |
| 26 | `fk_qb_course` | t_question_bank.course_id | t_course.id | CASCADE |
| 27 | `fk_qb_teacher` | t_question_bank.teacher_id | t_teacher.id | CASCADE |
| 28 | `fk_wq_student` | t_student_wrong_question.student_id | t_student.id | CASCADE |
| 29 | `fk_wq_course` | t_student_wrong_question.course_id | t_course.id | CASCADE |
| 30 | `fk_warn_student` | t_warning_record.student_id | t_student.id | CASCADE |
| 31 | `fk_warn_course` | t_warning_record.course_id | t_course.id | CASCADE |
| 32 | `fk_nr_notification` | t_notification_recipient.notification_id | t_notification.id | CASCADE |
| 33 | `fk_nr_recipient` | t_notification_recipient.recipient_id | t_user.id | CASCADE |
| 34 | `fk_log_source` | t_data_import_log.source_id | t_data_source.id | SET NULL |

---

## 五、核心数据流

### 5.1 用户创建→认证流程

```
系统管理员 → 手动添加/批量导入教师 → t_user(role=TEACHER) + t_teacher
教师 → 手动添加/Excel导入学生 → t_user(role=STUDENT) + t_student + t_course_student
教师 → 在班级管理中添加助教 → t_user(role=ASSISTANT) + t_teaching_assistant + t_assistant_permission
所有角色 → 登录页统一入口 → JWT Token → 按role跳转对应首页
```

### 5.2 数据导入→画像计算流程

```
教师上传Excel模板（含各题得分+扣分知识点）
  ├─ 1. 解析模板 → 逐行读取学生+各题得分+扣分知识点
  ├─ 2. 写入 t_assessment（考核不存在则创建）
  ├─ 3. 写入 t_assessment_record（每学生一条总记录）
  │     total_score = Σ各题得分
  │     weakest_kp = 扣分最多的知识点
  │     weakest_aspect = 归类（概念混淆/计算错误/…）
  ├─ 4. 写入 t_record_kp_deduction（每题一条扣分明细）
  └─ 5. 触发掌握度重算 → t_student_kp_mastery UPSERT
        mastery_rate = MAX(0, 100 - (总扣分/总分)*100)
        class_avg_rate = AVG(同班学生对该知识点掌握率)
```

### 5.3 AI出题→组卷→考试→错题流程

```
教师设置参数(知识点/题型/数量/难度) → Prompt拼装 → 大模型生成
  → t_question_bank (ai_generated=1, status=DRAFT)
  → 教师审核(查看4维质量评分+修改/删除/重新生成)
  → 审核通过(status=APPROVED)
  → 加入组卷列表 → t_exam_paper + t_exam_paper_question
  → 设置考试名称/起止时间/参与班级 → 发布(status=PUBLISHED)
  → 学生在线作答 → 客观题自动判分 → 主观题教师/助教批阅
  → 错题自动入 t_student_wrong_question
  → AI错因分析 + "练习相似题"按钮 → AI生成1-3道同类题
```

### 5.4 预警触发流程

```
每次数据导入完成后自动检测:
  ├─ ATTENDANCE: COUNT(ABSENT) >= 3 → severity=HIGH
  ├─ SCORE_DROP: 最近2次下降>=20% → severity=HIGH
  ├─ HOMEWORK_MISS: 连续3次submit_status=ABSENT → severity=HIGH
  └─ KP_WEAK: mastery_rate < 30% → severity=MEDIUM
  → 去重(同学生+同类型+24h内不重复)
  → t_warning_record INSERT
  → t_notification + t_notification_recipient (自动推送)
```

---

## 六、索引设计

**总计：27 张表，约 80+ 个索引**

| 表 | 索引名 | 字段 | 类型 |
|----|--------|------|------|
| t_user | `uk_username` | username | UNIQUE |
| t_user | `idx_role` / `idx_status` | role / status | NORMAL |
| t_teacher | `uk_teacher_no` / `uk_user_id` | teacher_no / user_id | UNIQUE |
| t_teacher | `idx_college` / `idx_name` | college / name | NORMAL |
| t_teaching_assistant | `uk_user_id` | user_id | UNIQUE |
| t_teaching_assistant | `idx_teacher_id` | teacher_id | NORMAL |
| t_assistant_permission | `uk_assistant_course` | (assistant_id, course_id) | UNIQUE |
| t_student | `uk_student_no` / `uk_user_id` | student_no / user_id | UNIQUE |
| t_student | `idx_college` / `idx_major` / `idx_grade` | college / major / grade | NORMAL |
| t_course | `uk_course_no` | course_no | UNIQUE |
| t_course | `idx_teacher_id` / `idx_semester` / `idx_course_type` | - | NORMAL |
| t_course_student | `uk_course_student` | (course_id, student_id) | UNIQUE |
| t_course_student | `idx_course_id` / `idx_student_id` / `idx_class_name` / `idx_is_focus` | - | NORMAL |
| t_knowledge_point | `uk_course_kp` | (course_id, kp_name) | UNIQUE |
| t_knowledge_point | `idx_course_id` / `idx_category` / `idx_parent_id` / `idx_level` | - | NORMAL |
| t_assessment | `uk_course_assessment` | (course_id, assessment_name) | UNIQUE |
| t_assessment | `idx_course_id` / `idx_type` / `idx_semester` / `idx_status` / `idx_course_semester` | - | NORMAL |
| t_assessment_record | `uk_record` | (assessment_id, student_id) | UNIQUE |
| t_assessment_record | `idx_student_id` / `idx_assessment_id` / `idx_submit_status` | - | NORMAL |
| t_record_kp_deduction | `idx_record_id` / `idx_question_no` / `idx_deduction_kp` | - | NORMAL |
| t_student_kp_mastery | `uk_student_kp` | (student_id, course_id, kp_name) | UNIQUE |
| t_student_kp_mastery | `idx_student_id` / `idx_course_id` / `idx_mastery_rate` | - | NORMAL |
| t_attendance | `uk_attendance` | (course_id, student_id, attendance_date) | UNIQUE |
| t_attendance | `idx_student_id` / `idx_date` / `idx_semester` | - | NORMAL |
| t_experiment | `idx_course_id` / `idx_student_id` / `idx_semester` / `idx_no` | - | NORMAL |
| t_exam_paper | `idx_course_id` / `idx_teacher_id` / `idx_status` / `idx_start_time` | - | NORMAL |
| t_exam_paper_question | `uk_paper_question` | (paper_id, question_id) | UNIQUE |
| t_exam_paper_question | `idx_paper_id` / `idx_question_no` | - | NORMAL |
| t_question_bank | `idx_course_id` / `idx_teacher_id` / `idx_type_diff` / `idx_status` / `idx_ai` | - | NORMAL |
| t_student_wrong_question | `idx_student_id` / `idx_course_id` / `idx_kp` / `idx_source` | - | NORMAL |
| t_warning_record | `idx_student_id` / `idx_course_id` / `idx_severity` / `idx_time` / `idx_course_severity` | - | NORMAL |
| t_notification | `idx_sender_id` / `idx_type` / `idx_time` / `idx_course_id` | - | NORMAL |
| t_notification_recipient | `uk_notif_recipient` | (notification_id, recipient_id) | UNIQUE |
| t_notification_recipient | `idx_recipient_read` | (recipient_id, is_read) | NORMAL |
| t_system_config | `uk_config_key` | config_key | UNIQUE |
| t_operation_log | `idx_log_type` / `idx_user_id` / `idx_time` / `idx_type_time` | - | NORMAL |
| t_data_source | `idx_source_type` / `idx_status` | - | NORMAL |
| t_data_import_log | `idx_source_id` / `idx_user_id` / `idx_import_type` / `idx_status` / `idx_time` | - | NORMAL |
| t_ai_analysis_result | `idx_target`(target_type, target_id) / `idx_analysis_type` / `idx_time` | - | NORMAL |

---

## 七、命名规范

| 规范项 | 规则 | 示例 |
|--------|------|------|
| 表名 | `t_` 前缀 + 小写下划线 | `t_assessment_record` |
| 主键 | 统一 `id`，BIGINT AUTO_INCREMENT | `id` |
| 外键约束 | `fk_` + 子表简称 + `_` + 父表简称 | `fk_record_student` |
| 唯一索引 | `uk_` 前缀 | `uk_student_kp` |
| 普通索引 | `idx_` 前缀 | `idx_deduction_kp` |
| 复合索引 | `idx_` + 字段缩写 | `idx_course_semester` |
| 时间字段 | `_time` 后缀，DATETIME | `create_time`, `last_login_time` |
| 逻辑删除 | 全表统一 `deleted TINYINT DEFAULT 0` | MyBatis-Plus 全局管理 |
| JSON字段 | 存结构化数据，非频繁查询 | `content`, `report_data`, `knowledge_point_list` |
