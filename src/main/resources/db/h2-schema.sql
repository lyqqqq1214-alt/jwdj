-- ============================================================
-- AITAES H2 内嵌数据库初始化脚本（v3.0 全量 28 张表）
-- 语法：H2 MySQL 兼容模式；CREATE TABLE IF NOT EXISTS + MERGE 种子
-- 幂等可重复执行；文件库 ./data/aitaes.mv.db 数据可跨重启保留
-- DDL 与 src/test/resources/schema-h2.sql 保持一致（经全量测试验证）
-- ============================================================

-- ============================================================
-- AITAES 测试数据库初始化（H2 兼容语法）
-- 版本：v3.0 | 每次集成测试前自动执行
-- ============================================================

-- 先 DROP 所有表（子表优先，避免外键约束阻止删除）

-- ============================================================
-- 0. 统一用户认证表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_user (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(32)  NOT NULL UNIQUE,
    password        VARCHAR(256) NOT NULL,
    role            VARCHAR(16)  NOT NULL,
    status          VARCHAR(16)  DEFAULT 'ACTIVE',
    first_login     TINYINT      DEFAULT 1,
    last_login_time TIMESTAMP    DEFAULT NULL,
    create_time     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted         TINYINT      DEFAULT 0
);

-- ============================================================
-- 0b. 系统参数配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_system_config (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_key    VARCHAR(64)  NOT NULL UNIQUE,
    config_value  VARCHAR(512) NOT NULL,
    config_type   VARCHAR(32)  DEFAULT 'STRING',
    description   VARCHAR(256) DEFAULT NULL,
    create_time   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 1. 教师表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_teacher (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT       NOT NULL UNIQUE,
    teacher_no    VARCHAR(32)  NOT NULL UNIQUE,
    name          VARCHAR(64)  NOT NULL,
    gender        VARCHAR(8)   DEFAULT NULL,
    college       VARCHAR(128) DEFAULT NULL,
    department    VARCHAR(128) DEFAULT NULL,
    title         VARCHAR(64)  DEFAULT NULL,
    email         VARCHAR(128) DEFAULT NULL,
    phone         VARCHAR(32)  DEFAULT NULL,
    create_time   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted       TINYINT      DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES t_user(id)
);

-- ============================================================
-- 2. 学生表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_student (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT       NOT NULL UNIQUE,
    student_no    VARCHAR(32)  NOT NULL UNIQUE,
    name          VARCHAR(64)  NOT NULL,
    gender        VARCHAR(8)   DEFAULT NULL,
    college       VARCHAR(128) DEFAULT NULL,
    major         VARCHAR(128) DEFAULT NULL,
    class_name    VARCHAR(128) DEFAULT NULL,
    grade         VARCHAR(16)  DEFAULT NULL,
    avatar        VARCHAR(512) DEFAULT NULL,
    email         VARCHAR(128) DEFAULT NULL,
    create_time   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted       TINYINT      DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES t_user(id)
);

-- ============================================================
-- 3. 课程表 【v3.0新增 knowledge_point_list 字段】
-- ============================================================
CREATE TABLE IF NOT EXISTS t_course (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_no             VARCHAR(32)  NOT NULL UNIQUE,
    course_name           VARCHAR(256) NOT NULL,
    class_name            VARCHAR(256) DEFAULT NULL,
    teacher_id            BIGINT       DEFAULT NULL,
    credit                DECIMAL(4,1) DEFAULT 0.0,
    course_type           VARCHAR(32)  DEFAULT NULL,
    semester              VARCHAR(32)  DEFAULT NULL,
    description           VARCHAR(1024) DEFAULT NULL,
    knowledge_point_list  TEXT         DEFAULT NULL,
    create_time           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted               TINYINT      DEFAULT 0,
    FOREIGN KEY (teacher_id) REFERENCES t_teacher(id)
);

-- ============================================================
-- 4. 课程-学生关联表 【v3.0新增 class_name 字段】
-- ============================================================
CREATE TABLE IF NOT EXISTS t_course_student (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id     BIGINT       NOT NULL,
    student_id    BIGINT       NOT NULL,
    class_name    VARCHAR(64)  DEFAULT NULL,
    semester      VARCHAR(32)  DEFAULT NULL,
    is_focus      TINYINT      DEFAULT 0,
    ai_evaluation CLOB         DEFAULT NULL,
    ai_evaluation_time TIMESTAMP DEFAULT NULL,
    ai_suggestions CLOB        DEFAULT NULL,
    ai_suggestions_time TIMESTAMP DEFAULT NULL,
    create_time   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted       TINYINT      DEFAULT 0,
    UNIQUE (course_id, student_id),
    FOREIGN KEY (course_id)  REFERENCES t_course(id),
    FOREIGN KEY (student_id) REFERENCES t_student(id)
);

-- ============================================================
-- 5. 数据源配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_data_source (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_name   VARCHAR(128) NOT NULL,
    source_type   VARCHAR(32)  NOT NULL,
    file_path     VARCHAR(512) DEFAULT NULL,
    description   VARCHAR(512) DEFAULT NULL,
    status        VARCHAR(16)  DEFAULT 'ACTIVE',
    create_time   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted       TINYINT      DEFAULT 0
);

-- ============================================================
-- 6. 数据导入日志表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_data_import_log (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_id     BIGINT       DEFAULT NULL,
    file_name     VARCHAR(256) DEFAULT NULL,
    import_type   VARCHAR(32)  DEFAULT NULL,
    total_rows    INT          DEFAULT 0,
    success_rows  INT          DEFAULT 0,
    fail_rows     INT          DEFAULT 0,
    status        VARCHAR(16)  DEFAULT NULL,
    error_msg     TEXT         DEFAULT NULL,
    import_time   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted       TINYINT      DEFAULT 0,
    FOREIGN KEY (source_id) REFERENCES t_data_source(id)
);

-- ============================================================
-- 7. AI分析结果表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_ai_analysis_result (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    analysis_type   VARCHAR(32)  DEFAULT NULL,
    target_id       BIGINT       DEFAULT NULL,
    target_type     VARCHAR(32)  DEFAULT NULL,
    result_data     TEXT         DEFAULT NULL,
    model_name      VARCHAR(64)  DEFAULT NULL,
    analysis_time   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted         TINYINT      DEFAULT 0
);

-- ╔══════════════════════════════════════════════════════════╗
-- ║         v3.0 新增表（教学分析系统核心）                  ║
-- ╚══════════════════════════════════════════════════════════╝

-- ============================================================
-- 8. 课程知识点库
-- ============================================================
CREATE TABLE IF NOT EXISTS t_knowledge_point (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id     BIGINT       NOT NULL,
    kp_name       VARCHAR(256) NOT NULL,
    kp_category   VARCHAR(128) DEFAULT NULL,
    parent_id     BIGINT       DEFAULT NULL,
    level         TINYINT      DEFAULT 1,
    difficulty    VARCHAR(16)  DEFAULT 'MEDIUM',
    description   VARCHAR(512) DEFAULT NULL,
    sort_order    INT          DEFAULT 0,
    create_time   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted       TINYINT      DEFAULT 0,
    UNIQUE (course_id, kp_name),
    FOREIGN KEY (course_id) REFERENCES t_course(id),
    FOREIGN KEY (parent_id) REFERENCES t_knowledge_point(id)
);

-- ============================================================
-- 9. 考核表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_assessment (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id         BIGINT       NOT NULL,
    paper_id          BIGINT       DEFAULT NULL,
    assessment_name   VARCHAR(256) NOT NULL,
    assessment_type   VARCHAR(32)  NOT NULL,
    assessment_no     INT          DEFAULT NULL,
    total_score       DECIMAL(5,2) DEFAULT 100.00,
    question_count    INT          DEFAULT 0,
    assessment_date   DATE         DEFAULT NULL,
    start_time        TIMESTAMP    DEFAULT NULL,
    end_time          TIMESTAMP    DEFAULT NULL,
    duration_minutes  INT          DEFAULT NULL,
    status            VARCHAR(16)  DEFAULT 'DRAFT',
    semester          VARCHAR(32)  DEFAULT NULL,
    description       VARCHAR(1024) DEFAULT NULL,
    create_time       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted           TINYINT      DEFAULT 0,
    UNIQUE (course_id, assessment_name, assessment_type),
    FOREIGN KEY (course_id) REFERENCES t_course(id)
);

-- ============================================================
-- 10. 学生考核成绩记录
-- ============================================================
CREATE TABLE IF NOT EXISTS t_assessment_record (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    assessment_id     BIGINT       NOT NULL,
    student_id        BIGINT       NOT NULL,
    total_score       DECIMAL(5,2) DEFAULT NULL,
    submit_status     VARCHAR(16)  DEFAULT 'ON_TIME',
    weakest_kp        VARCHAR(512) DEFAULT NULL,
    weakest_aspect    VARCHAR(256) DEFAULT NULL,
    submit_time       TIMESTAMP    DEFAULT NULL,
    create_time       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted           TINYINT      DEFAULT 0,
    UNIQUE (assessment_id, student_id),
    FOREIGN KEY (assessment_id) REFERENCES t_assessment(id),
    FOREIGN KEY (student_id)    REFERENCES t_student(id)
);

-- ============================================================
-- 11. 扣分知识点明细
-- ============================================================
CREATE TABLE IF NOT EXISTS t_record_kp_deduction (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    record_id         BIGINT       NOT NULL,
    question_no       INT          NOT NULL,
    question_score    DECIMAL(5,2) DEFAULT NULL,
    max_score         DECIMAL(5,2) DEFAULT NULL,
    deduction_kp      VARCHAR(512) NOT NULL,
    deduction_aspect  VARCHAR(256) DEFAULT NULL,
    deduction_detail  VARCHAR(1024) DEFAULT NULL,
    deleted           TINYINT      DEFAULT 0,
    FOREIGN KEY (record_id) REFERENCES t_assessment_record(id)
);

-- ============================================================
-- 12. 学生知识点掌握度
-- ============================================================
CREATE TABLE IF NOT EXISTS t_student_kp_mastery (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id            BIGINT       NOT NULL,
    course_id             BIGINT       NOT NULL,
    kp_name               VARCHAR(256) NOT NULL,
    mastery_rate          DECIMAL(5,2) DEFAULT NULL,
    class_avg_rate        DECIMAL(5,2) DEFAULT NULL,
    lose_count            INT          DEFAULT 0,
    total_question_count  INT          DEFAULT 0,
    last_assessment_id    BIGINT       DEFAULT NULL,
    last_updated          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted               TINYINT      DEFAULT 0,
    UNIQUE (student_id, course_id, kp_name),
    FOREIGN KEY (student_id) REFERENCES t_student(id),
    FOREIGN KEY (course_id)  REFERENCES t_course(id)
);

-- ============================================================
-- 13. 考勤记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_attendance (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id         BIGINT      NOT NULL,
    student_id        BIGINT      NOT NULL,
    attendance_date   DATE        NOT NULL,
    status            VARCHAR(16) NOT NULL,
    week_no           INT         DEFAULT NULL,
    period            VARCHAR(32) DEFAULT NULL,
    semester          VARCHAR(32) DEFAULT NULL,
    remark            VARCHAR(256) DEFAULT NULL,
    create_time       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    deleted           TINYINT     DEFAULT 0,
    UNIQUE (course_id, student_id, attendance_date),
    FOREIGN KEY (course_id)  REFERENCES t_course(id),
    FOREIGN KEY (student_id) REFERENCES t_student(id)
);

-- ============================================================
-- 14. 实验报告表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_experiment (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id             BIGINT       NOT NULL,
    student_id            BIGINT       NOT NULL,
    experiment_name       VARCHAR(256) NOT NULL,
    experiment_no         INT          DEFAULT NULL,
    score                 DECIMAL(5,2) DEFAULT NULL,
    submit_time           TIMESTAMP    DEFAULT NULL,
    knowledge_point_ids   VARCHAR(1024) DEFAULT NULL,
    semester              VARCHAR(32)  DEFAULT NULL,
    remark                VARCHAR(512) DEFAULT NULL,
    create_time           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted               TINYINT      DEFAULT 0,
    FOREIGN KEY (course_id)  REFERENCES t_course(id),
    FOREIGN KEY (student_id) REFERENCES t_student(id)
);

-- ============================================================
-- 15. 预警规则配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_warning_rule (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    rule_name     VARCHAR(128) NOT NULL,
    rule_type     VARCHAR(32)  NOT NULL,
    threshold     VARCHAR(128) NOT NULL,
    is_active     TINYINT      DEFAULT 1,
    description   VARCHAR(256) DEFAULT NULL,
    create_time   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted       TINYINT      DEFAULT 0
);

-- ============================================================
-- 16. 预警记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_warning_record (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id    BIGINT       NOT NULL,
    course_id     BIGINT       NOT NULL,
    rule_id       BIGINT       DEFAULT NULL,
    warning_type  VARCHAR(32)  NOT NULL,
    severity      VARCHAR(8)   NOT NULL,
    warning_msg   VARCHAR(512) NOT NULL,
    is_resolved   TINYINT      DEFAULT 0,
    create_time   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted       TINYINT      DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES t_student(id),
    FOREIGN KEY (course_id)  REFERENCES t_course(id)
);

-- ============================================================
-- 17. 通知表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_notification (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id         BIGINT       DEFAULT NULL,
    sender_name       VARCHAR(64)  DEFAULT NULL,
    title             VARCHAR(256) NOT NULL,
    content           TEXT         NOT NULL,
    notification_type VARCHAR(32)  DEFAULT 'MANUAL',
    recipient_scope   VARCHAR(16)  NOT NULL,
    course_id         BIGINT       DEFAULT NULL,
    create_time       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted           TINYINT      DEFAULT 0
);

-- ============================================================
-- 18. 题库表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_question_bank (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id         BIGINT       NOT NULL,
    teacher_id        BIGINT       NOT NULL,
    question_type     VARCHAR(32)  NOT NULL,
    difficulty        VARCHAR(16)  DEFAULT 'MEDIUM',
    content           TEXT         NOT NULL,
    knowledge_points  VARCHAR(512) DEFAULT NULL,
    ai_generated      TINYINT      DEFAULT 0,
    quality_score     DECIMAL(3,2) DEFAULT NULL,
    quality_detail    VARCHAR(1024) DEFAULT NULL,
    quality_clarity   TINYINT      DEFAULT NULL,
    quality_difficulty TINYINT DEFAULT NULL,
    quality_ambiguity TINYINT      DEFAULT NULL,
    quality_kp_coverage TINYINT    DEFAULT NULL,
    socratic_mode     TINYINT      DEFAULT 0,
    socratic_chain    TEXT         DEFAULT NULL,
    usage_count       INT          DEFAULT 0,
    status            VARCHAR(16)  DEFAULT 'DRAFT',
    create_time       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted           TINYINT      DEFAULT 0,
    FOREIGN KEY (course_id)  REFERENCES t_course(id),
    FOREIGN KEY (teacher_id) REFERENCES t_teacher(id)
);

-- ============================================================
-- 19. 错题本
-- ============================================================
CREATE TABLE IF NOT EXISTS t_student_wrong_question (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id        BIGINT       NOT NULL,
    course_id         BIGINT       NOT NULL,
    question_content  TEXT         DEFAULT NULL,
    student_answer    VARCHAR(2048) DEFAULT NULL,
    correct_answer    VARCHAR(2048) DEFAULT NULL,
    knowledge_points  VARCHAR(512) DEFAULT NULL,
    analysis          TEXT         DEFAULT NULL,
    wrong_count       INT          DEFAULT 1,
    source            VARCHAR(32)  DEFAULT 'ASSESSMENT',
    source_id         BIGINT       DEFAULT NULL,
    create_time       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted           TINYINT      DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES t_student(id),
    FOREIGN KEY (course_id)  REFERENCES t_course(id)
);

-- ============================================================
-- 20. 通知接收人表（已读状态管理）
-- ============================================================
CREATE TABLE IF NOT EXISTS t_notification_recipient (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    notification_id BIGINT       NOT NULL,
    recipient_id    BIGINT       NOT NULL,
    is_read         TINYINT      DEFAULT 0,
    read_time       TIMESTAMP    DEFAULT NULL,
    deleted         TINYINT      DEFAULT 0,
    FOREIGN KEY (notification_id) REFERENCES t_notification(id)
);

-- ============================================================
-- 21. 试卷表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_exam_paper (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id         BIGINT       NOT NULL,
    teacher_id        BIGINT       NOT NULL,
    paper_name        VARCHAR(256) NOT NULL,
    total_score       DECIMAL(5,2) DEFAULT 100.00,
    duration_minutes  INT          DEFAULT 120,
    start_time        TIMESTAMP    DEFAULT NULL,
    end_time          TIMESTAMP    DEFAULT NULL,
    target_classes    VARCHAR(512) DEFAULT NULL,
    target_students   VARCHAR(2048) DEFAULT NULL,
    status            VARCHAR(16)  DEFAULT 'DRAFT',
    create_time       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted           TINYINT      DEFAULT 0,
    FOREIGN KEY (course_id)  REFERENCES t_course(id),
    FOREIGN KEY (teacher_id) REFERENCES t_teacher(id)
);

-- ============================================================
-- 22. 试卷-题目关联表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_exam_paper_question (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    paper_id      BIGINT       NOT NULL,
    question_id   BIGINT       NOT NULL,
    question_no   INT          NOT NULL,
    score         DECIMAL(5,2) DEFAULT 0,
    content_override TEXT,
    deleted       TINYINT      DEFAULT 0,
    FOREIGN KEY (paper_id)    REFERENCES t_exam_paper(id),
    FOREIGN KEY (question_id) REFERENCES t_question_bank(id)
);

-- ============================================================
-- 23. 学生考试逐题作答记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_exam_answer (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    paper_id          BIGINT       NOT NULL,
    assessment_id     BIGINT       NOT NULL,
    record_id         BIGINT       NOT NULL,
    student_id        BIGINT       NOT NULL,
    question_id       BIGINT       NOT NULL,
    question_no       INT          NOT NULL,
    question_type     VARCHAR(32)  NOT NULL,
    student_answer    TEXT         DEFAULT NULL,
    correct_answer    VARCHAR(2048) DEFAULT NULL,
    score             DECIMAL(5,2) DEFAULT NULL,
    max_score         DECIMAL(5,2) DEFAULT NULL,
    is_correct        TINYINT      DEFAULT NULL,
    graded            TINYINT      DEFAULT 0,
    grader_id         BIGINT       DEFAULT NULL,
    comment           VARCHAR(1024) DEFAULT NULL,
    create_time       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted           TINYINT      DEFAULT 0,
    UNIQUE (record_id, question_id),
    FOREIGN KEY (record_id)   REFERENCES t_assessment_record(id),
    FOREIGN KEY (student_id)  REFERENCES t_student(id),
    FOREIGN KEY (question_id) REFERENCES t_question_bank(id)
);

-- ============================================================
-- 23. 操作日志表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_operation_log (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    log_type      VARCHAR(32)  DEFAULT NULL,
    user_id       BIGINT       DEFAULT NULL,
    username      VARCHAR(64)  DEFAULT NULL,
    action        VARCHAR(64)  DEFAULT NULL,
    target_type   VARCHAR(32)  DEFAULT NULL,
    target_id     BIGINT       DEFAULT NULL,
    detail        TEXT         DEFAULT NULL,
    ip_address    VARCHAR(64)  DEFAULT NULL,
    create_time   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted       TINYINT      DEFAULT 0
);

-- ============================================================
-- 24. 助教表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_teaching_assistant (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT      NOT NULL UNIQUE,
    teacher_id    BIGINT      NOT NULL,
    name          VARCHAR(64) NOT NULL,
    create_time   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    deleted       TINYINT     DEFAULT 0,
    FOREIGN KEY (user_id)    REFERENCES t_user(id),
    FOREIGN KEY (teacher_id) REFERENCES t_teacher(id)
);

-- ============================================================
-- 25. 助教权限表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_assistant_permission (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    assistant_id      BIGINT  NOT NULL,
    course_id         BIGINT  NOT NULL,
    can_view_data     TINYINT DEFAULT 1,
    can_import_data   TINYINT DEFAULT 0,
    can_grade         TINYINT DEFAULT 0,
    can_view_portrait TINYINT DEFAULT 1,
    create_time       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted           TINYINT   DEFAULT 0,
    FOREIGN KEY (assistant_id) REFERENCES t_teaching_assistant(id),
    FOREIGN KEY (course_id)    REFERENCES t_course(id)
);

-- ============================================================
-- 种子数据（H2 MERGE 幂等语法，文件库可重复启动不报错）
-- 登录密码统一 123456（BCrypt 哈希）；
-- 学生账号（张伟/李娜）与课程、成绩、考勤、实验等演示数据
-- 由后端 DataInitializer 在启动时自动补充。
-- ============================================================

-- 账号：管理员 / 教师 / 助教（ID 显式指定，保证外键关系确定）
MERGE INTO t_user (id, username, password, role, status, first_login, last_login_time, create_time, update_time, deleted) KEY(username) VALUES
(1, 'admin',  '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'ADMIN',     'ACTIVE', 1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
(2, 'T00001', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'TEACHER',   'ACTIVE', 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
(3, 'T00002', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'TEACHER',   'ACTIVE', 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
(4, 'A00001', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'ASSISTANT', 'ACTIVE', 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
(5, 'A00002', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'ASSISTANT', 'ACTIVE', 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
(6, 'A00003', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'ASSISTANT', 'ACTIVE', 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

-- 教师
MERGE INTO t_teacher (id, user_id, teacher_no, name, gender, college, department, title, email, phone, create_time, update_time, deleted) KEY(teacher_no) VALUES
(2, 2, 'T00001', '张建国', '男', '计算机学院', '软件工程系', '教授',   'zjg@university.edu.cn', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
(3, 3, 'T00002', '李美玲', '女', '计算机学院', '网络工程系', '副教授', 'lml@university.edu.cn', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

-- 助教：陈明、赵丽归属张建国；王磊归属李美玲
MERGE INTO t_teaching_assistant (id, user_id, teacher_id, name, create_time, deleted) KEY(user_id) VALUES
(4, 4, 2, '陈明', CURRENT_TIMESTAMP, 0),
(5, 5, 2, '赵丽', CURRENT_TIMESTAMP, 0),
(6, 6, 3, '王磊', CURRENT_TIMESTAMP, 0);

-- 预警规则预置（H2/实体无 severity 列，与 WarningRule 实体字段对齐）
MERGE INTO t_warning_rule (rule_name, rule_type, threshold, is_active, description, create_time, deleted) KEY(rule_name) VALUES
('缺勤过多预警',      'ATTENDANCE',    '缺勤次数>=3',            1, '缺勤次数达到3次触发高危预警',        CURRENT_TIMESTAMP, 0),
('成绩持续下滑预警',  'SCORE_DROP',    '连续2次成绩下降>=20%',    1, '连续两次考核成绩下降超过20%触发预警', CURRENT_TIMESTAMP, 0),
('作业连续未交预警',  'HOMEWORK_MISS', '连续3次作业未交',          1, '连续3次作业未提交触发预警',          CURRENT_TIMESTAMP, 0),
('知识点严重薄弱预警','KP_WEAK',       '单知识点掌握率<30%',      1, '某个知识点的掌握率低于30%触发预警',  CURRENT_TIMESTAMP, 0);

-- 系统参数配置预置
MERGE INTO t_system_config (config_key, config_value, config_type, description, create_time, update_time) KEY(config_key) VALUES
('ai.api.base_url',              'http://localhost:11434', 'STRING', '大模型API地址',        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ai.api.model_name',            'qwen2.5:7b',             'STRING', '大模型名称',           CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ai.api.timeout_seconds',       '60',                     'INT',    '模型超时时间(秒)',     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('default.password',             '123456',                 'STRING', '默认初始密码',         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('warning.attendance_threshold', '3',                      'INT',    '缺勤次数阈值',         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('warning.score_drop_threshold', '20',                     'INT',    '成绩下滑幅度阈值(%)',  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('warning.score_drop_times',     '2',                      'INT',    '成绩连续下滑次数',     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('warning.homework_miss_times',  '3',                      'INT',    '作业连续未交次数',     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('warning.kp_mastery_threshold', '30',                     'INT',    '知识点薄弱阈值(%)',    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('warning.dedup_hours',          '24',                     'INT',    '预警去重时间(小时)',   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('log.retention_days',           '30',                     'INT',    '日志保留天数',         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
