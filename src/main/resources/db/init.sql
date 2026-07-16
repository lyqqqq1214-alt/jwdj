-- ============================================================
-- AITAES 数智化教学分析评价系统 - 数据库初始化脚本 v3.0
-- 数据库：aitaes_db | 字符集：utf8mb4 | 28张表
-- 用户角色：系统管理员(ADMIN)、教师(TEACHER)、助教(ASSISTANT)、学生(STUDENT)
-- ============================================================

USE aitaes_db;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. 统一用户认证表（4种角色共用登录）
-- ============================================================
DROP TABLE IF EXISTS `t_user`;
CREATE TABLE `t_user` (
    `id`              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `username`        VARCHAR(32)  NOT NULL COMMENT '登录账号',
    `password`        VARCHAR(256) NOT NULL COMMENT 'BCrypt加密密码',
    `role`            VARCHAR(16)  NOT NULL COMMENT '角色：ADMIN/TEACHER/ASSISTANT/STUDENT',
    `status`          VARCHAR(16)  DEFAULT 'ACTIVE' COMMENT '状态：ACTIVE(正常)/DISABLED(已禁用)',
    `first_login`     TINYINT      DEFAULT 1 COMMENT '首次登录标记',
    `last_login_time` DATETIME     DEFAULT NULL COMMENT '最近登录时间',
    `create_time`     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    `update_time`     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted`         TINYINT      DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    KEY `idx_role` (`role`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='统一用户认证表';

-- ============================================================
-- 2. 教师表（关联t_user）
-- ============================================================
DROP TABLE IF EXISTS `t_teacher`;
CREATE TABLE `t_teacher` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`       BIGINT       NOT NULL COMMENT '关联t_user.id',
    `teacher_no`    VARCHAR(32)  NOT NULL COMMENT '工号',
    `name`          VARCHAR(64)  NOT NULL COMMENT '姓名',
    `gender`        VARCHAR(8)   DEFAULT NULL COMMENT '性别',
    `college`       VARCHAR(128) DEFAULT NULL COMMENT '学院',
    `department`    VARCHAR(128) DEFAULT NULL COMMENT '系/部门',
    `title`         VARCHAR(64)  DEFAULT NULL COMMENT '职称',
    `email`         VARCHAR(128) DEFAULT NULL COMMENT '邮箱',
    `phone`         VARCHAR(32)  DEFAULT NULL COMMENT '联系电话',
    `create_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    `update_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted`       TINYINT      DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_teacher_no` (`teacher_no`),
    UNIQUE KEY `uk_user_id` (`user_id`),
    KEY `idx_college` (`college`),
    KEY `idx_name` (`name`),
    CONSTRAINT `fk_teacher_user` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教师表';

-- ============================================================
-- 3. 助教表（关联t_user和t_teacher）
-- ============================================================
DROP TABLE IF EXISTS `t_teaching_assistant`;
CREATE TABLE `t_teaching_assistant` (
    `id`            BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`       BIGINT      NOT NULL COMMENT '关联t_user.id',
    `teacher_id`    BIGINT      NOT NULL COMMENT '所属教师ID',
    `name`          VARCHAR(64) NOT NULL COMMENT '姓名',
    `create_time`   DATETIME    DEFAULT CURRENT_TIMESTAMP,
    `deleted`       TINYINT     DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_id` (`user_id`),
    KEY `idx_teacher_id` (`teacher_id`),
    CONSTRAINT `fk_ta_user` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_ta_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `t_teacher` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='助教表';

-- ============================================================
-- 4. 助教权限配置表
-- ============================================================
DROP TABLE IF EXISTS `t_assistant_permission`;
CREATE TABLE `t_assistant_permission` (
    `id`                BIGINT   NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `assistant_id`      BIGINT   NOT NULL COMMENT '助教ID',
    `course_id`         BIGINT   NOT NULL COMMENT '课程ID',
    `can_view_data`     TINYINT  DEFAULT 1 COMMENT '可查看班级数据',
    `can_import_data`   TINYINT  DEFAULT 0 COMMENT '可导入数据',
    `can_grade`         TINYINT  DEFAULT 0 COMMENT '可批阅',
    `can_view_portrait` TINYINT  DEFAULT 0 COMMENT '可查看学生画像',
    `create_time`       DATETIME DEFAULT CURRENT_TIMESTAMP,
    `deleted`           TINYINT  DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_assistant_course` (`assistant_id`, `course_id`),
    KEY `idx_assistant_id` (`assistant_id`),
    KEY `idx_course_id` (`course_id`),
    CONSTRAINT `fk_ap_assistant` FOREIGN KEY (`assistant_id`) REFERENCES `t_teaching_assistant` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_ap_course` FOREIGN KEY (`course_id`) REFERENCES `t_course` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='助教权限配置表';

-- ============================================================
-- 5. 学生表（关联t_user）
-- ============================================================
DROP TABLE IF EXISTS `t_student`;
CREATE TABLE `t_student` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`       BIGINT       NOT NULL COMMENT '关联t_user.id',
    `student_no`    VARCHAR(32)  NOT NULL COMMENT '学号',
    `name`          VARCHAR(64)  NOT NULL COMMENT '姓名',
    `gender`        VARCHAR(8)   DEFAULT NULL COMMENT '性别',
    `college`       VARCHAR(128) DEFAULT NULL COMMENT '学院',
    `major`         VARCHAR(128) DEFAULT NULL COMMENT '专业',
    `class_name`    VARCHAR(128) DEFAULT NULL COMMENT '班级',
    `grade`         VARCHAR(16)  DEFAULT NULL COMMENT '年级',
    `avatar`        VARCHAR(512) DEFAULT NULL COMMENT '头像URL',
    `email`         VARCHAR(128) DEFAULT NULL COMMENT '邮箱',
    `create_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    `update_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted`       TINYINT      DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_student_no` (`student_no`),
    UNIQUE KEY `uk_user_id` (`user_id`),
    KEY `idx_college` (`college`),
    KEY `idx_major` (`major`),
    KEY `idx_grade` (`grade`),
    CONSTRAINT `fk_student_user` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生表';

-- ============================================================
-- 6. 课程表
-- ============================================================
DROP TABLE IF EXISTS `t_course`;
CREATE TABLE `t_course` (
    `id`                    BIGINT         NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `course_no`             VARCHAR(32)    NOT NULL COMMENT '课程编号',
    `course_name`           VARCHAR(256)   NOT NULL COMMENT '课程名称',
    `class_name`            VARCHAR(256)   DEFAULT NULL COMMENT '班级名称（默认为课程名）',
    `teacher_id`            BIGINT         DEFAULT NULL COMMENT '授课教师ID',
    `credit`                DECIMAL(4,1)   DEFAULT 0.0 COMMENT '学分',
    `course_type`           VARCHAR(32)    DEFAULT NULL COMMENT '必修/选修/公选',
    `semester`              VARCHAR(32)    DEFAULT NULL COMMENT '学期',
    `description`           VARCHAR(1024)  DEFAULT NULL COMMENT '课程描述',
    `knowledge_point_list`  JSON           DEFAULT NULL COMMENT '课程知识点结构缓存',
    `create_time`           DATETIME       DEFAULT CURRENT_TIMESTAMP,
    `update_time`           DATETIME       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted`               TINYINT        DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_course_no` (`course_no`),
    KEY `idx_teacher_id` (`teacher_id`),
    KEY `idx_semester` (`semester`),
    KEY `idx_course_type` (`course_type`),
    CONSTRAINT `fk_course_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `t_teacher` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程表';

-- ============================================================
-- 7. 选课关联表
-- ============================================================
DROP TABLE IF EXISTS `t_course_student`;
CREATE TABLE `t_course_student` (
    `id`            BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `course_id`     BIGINT      NOT NULL COMMENT '课程ID',
    `student_id`    BIGINT      NOT NULL COMMENT '学生ID',
    `class_name`    VARCHAR(64) DEFAULT NULL COMMENT '在此课程中的班级',
    `semester`      VARCHAR(32) DEFAULT NULL COMMENT '选课学期',
    `is_focus`      TINYINT     DEFAULT 0 COMMENT '教师重点关注标记',
    `create_time`   DATETIME    DEFAULT CURRENT_TIMESTAMP,
    `deleted`       TINYINT     DEFAULT 0 COMMENT '逻辑删除(退课)',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_course_student` (`course_id`, `student_id`),
    KEY `idx_course_id` (`course_id`),
    KEY `idx_student_id` (`student_id`),
    KEY `idx_class_name` (`class_name`),
    KEY `idx_is_focus` (`is_focus`),
    CONSTRAINT `fk_cs_course`  FOREIGN KEY (`course_id`)  REFERENCES `t_course` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_cs_student` FOREIGN KEY (`student_id`) REFERENCES `t_student` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='选课关联表';

-- ============================================================
-- 8. 课程知识点库
-- ============================================================
DROP TABLE IF EXISTS `t_knowledge_point`;
CREATE TABLE `t_knowledge_point` (
    `id`            BIGINT         NOT NULL AUTO_INCREMENT,
    `course_id`     BIGINT         NOT NULL,
    `kp_name`       VARCHAR(256)   NOT NULL,
    `kp_category`   VARCHAR(128)   DEFAULT NULL,
    `parent_id`     BIGINT         DEFAULT NULL,
    `level`         TINYINT        DEFAULT 1 COMMENT '1=章,2=节,3=具体知识点',
    `difficulty`    VARCHAR(16)    DEFAULT 'MEDIUM',
    `description`   VARCHAR(512)   DEFAULT NULL,
    `sort_order`    INT            DEFAULT 0,
    `create_time`   DATETIME       DEFAULT CURRENT_TIMESTAMP,
    `deleted`       TINYINT        DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_course_kp` (`course_id`, `kp_name`),
    KEY `idx_course_id` (`course_id`),
    KEY `idx_category` (`kp_category`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_level` (`level`),
    CONSTRAINT `fk_kp_course` FOREIGN KEY (`course_id`) REFERENCES `t_course` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_kp_parent` FOREIGN KEY (`parent_id`) REFERENCES `t_knowledge_point` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程知识点库';

-- ============================================================
-- 9. 考核表（作业/测验/实验/期中/期末，含在线考试支持）
-- ============================================================
DROP TABLE IF EXISTS `t_assessment`;
CREATE TABLE `t_assessment` (
    `id`                BIGINT         NOT NULL AUTO_INCREMENT,
    `course_id`         BIGINT         NOT NULL,
    `assessment_name`   VARCHAR(256)   NOT NULL,
    `assessment_type`   VARCHAR(32)    NOT NULL COMMENT 'HOMEWORK/QUIZ/EXPERIMENT/MIDTERM/FINAL',
    `assessment_no`     INT            DEFAULT NULL COMMENT '第X次',
    `total_score`       DECIMAL(5,2)   DEFAULT 100.00,
    `question_count`    INT            DEFAULT 0,
    `assessment_date`   DATE           DEFAULT NULL,
    `start_time`        DATETIME       DEFAULT NULL COMMENT '在线考试开始时间',
    `end_time`          DATETIME       DEFAULT NULL COMMENT '在线考试截止时间',
    `duration_minutes`  INT            DEFAULT NULL COMMENT '考试时长(分钟)',
    `status`            VARCHAR(16)    DEFAULT 'DRAFT' COMMENT 'DRAFT/PUBLISHED/ONGOING/ENDED',
    `semester`          VARCHAR(32)    DEFAULT NULL,
    `description`       VARCHAR(1024)  DEFAULT NULL,
    `create_time`       DATETIME       DEFAULT CURRENT_TIMESTAMP,
    `deleted`           TINYINT        DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_course_assessment` (`course_id`, `assessment_name`),
    KEY `idx_course_id` (`course_id`),
    KEY `idx_assessment_type` (`assessment_type`),
    KEY `idx_semester` (`semester`),
    KEY `idx_status` (`status`),
    KEY `idx_course_semester` (`course_id`, `semester`),
    CONSTRAINT `fk_assessment_course` FOREIGN KEY (`course_id`) REFERENCES `t_course` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考核表';

-- ============================================================
-- 10. 学生考核成绩记录
-- ============================================================
DROP TABLE IF EXISTS `t_assessment_record`;
CREATE TABLE `t_assessment_record` (
    `id`                BIGINT         NOT NULL AUTO_INCREMENT,
    `assessment_id`     BIGINT         NOT NULL,
    `student_id`        BIGINT         NOT NULL,
    `total_score`       DECIMAL(5,2)   DEFAULT NULL,
    `submit_status`     VARCHAR(16)    DEFAULT 'ON_TIME' COMMENT 'ON_TIME/LATE/ABSENT',
    `weakest_kp`        VARCHAR(512)   DEFAULT NULL COMMENT '最薄弱知识点',
    `weakest_aspect`    VARCHAR(256)   DEFAULT NULL COMMENT '最薄弱方面',
    `submit_time`       DATETIME       DEFAULT NULL,
    `create_time`       DATETIME       DEFAULT CURRENT_TIMESTAMP,
    `deleted`           TINYINT        DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_record` (`assessment_id`, `student_id`),
    KEY `idx_student_id` (`student_id`),
    KEY `idx_assessment_id` (`assessment_id`),
    KEY `idx_submit_status` (`submit_status`),
    CONSTRAINT `fk_record_assessment` FOREIGN KEY (`assessment_id`) REFERENCES `t_assessment` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_record_student` FOREIGN KEY (`student_id`) REFERENCES `t_student` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生考核成绩记录';

-- ============================================================
-- 11. 扣分知识点明细 ⭐学生画像核心
-- ============================================================
DROP TABLE IF EXISTS `t_record_kp_deduction`;
CREATE TABLE `t_record_kp_deduction` (
    `id`                BIGINT         NOT NULL AUTO_INCREMENT,
    `record_id`         BIGINT         NOT NULL,
    `question_no`       INT            NOT NULL COMMENT '题号',
    `question_score`    DECIMAL(5,2)   DEFAULT NULL COMMENT '该题得分',
    `max_score`         DECIMAL(5,2)   DEFAULT NULL COMMENT '该题满分',
    `deduction_kp`      VARCHAR(512)   NOT NULL COMMENT '扣分涉及知识点',
    `deduction_aspect`  VARCHAR(256)   DEFAULT NULL COMMENT '扣分方面：概念混淆/计算错误/协议机制理解不清/审题偏差/知识点遗忘',
    `deduction_detail`  VARCHAR(1024)  DEFAULT NULL COMMENT '详细扣分说明',
    `deleted`           TINYINT        DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_record_id` (`record_id`),
    KEY `idx_question_no` (`question_no`),
    KEY `idx_deduction_kp` (`deduction_kp`(255)),
    CONSTRAINT `fk_deduction_record` FOREIGN KEY (`record_id`) REFERENCES `t_assessment_record` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='扣分知识点明细表';

-- ============================================================
-- 12. 学生知识点掌握度（计算缓存）
-- ============================================================
DROP TABLE IF EXISTS `t_student_kp_mastery`;
CREATE TABLE `t_student_kp_mastery` (
    `id`                    BIGINT         NOT NULL AUTO_INCREMENT,
    `student_id`            BIGINT         NOT NULL,
    `course_id`             BIGINT         NOT NULL,
    `kp_name`               VARCHAR(256)   NOT NULL,
    `mastery_rate`          DECIMAL(5,2)   DEFAULT NULL COMMENT '个人掌握率%',
    `class_avg_rate`        DECIMAL(5,2)   DEFAULT NULL COMMENT '班级平均掌握率%',
    `lose_count`            INT            DEFAULT 0,
    `total_question_count`  INT            DEFAULT 0,
    `last_assessment_id`    BIGINT         DEFAULT NULL,
    `last_updated`          DATETIME       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted`               TINYINT        DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_student_kp` (`student_id`, `course_id`, `kp_name`),
    KEY `idx_student_id` (`student_id`),
    KEY `idx_course_id` (`course_id`),
    KEY `idx_mastery_rate` (`mastery_rate`),
    CONSTRAINT `fk_mastery_student` FOREIGN KEY (`student_id`) REFERENCES `t_student` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_mastery_course` FOREIGN KEY (`course_id`) REFERENCES `t_course` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生知识点掌握度';

-- ============================================================
-- 13. 考勤记录表
-- ============================================================
DROP TABLE IF EXISTS `t_attendance`;
CREATE TABLE `t_attendance` (
    `id`                BIGINT      NOT NULL AUTO_INCREMENT,
    `course_id`         BIGINT      NOT NULL,
    `student_id`        BIGINT      NOT NULL,
    `attendance_date`   DATE        NOT NULL,
    `status`            VARCHAR(16) NOT NULL COMMENT 'PRESENT/LATE/LEAVE/ABSENT',
    `week_no`           INT         DEFAULT NULL,
    `period`            VARCHAR(32) DEFAULT NULL,
    `semester`          VARCHAR(32) DEFAULT NULL,
    `remark`            VARCHAR(256) DEFAULT NULL,
    `create_time`       DATETIME    DEFAULT CURRENT_TIMESTAMP,
    `deleted`           TINYINT     DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_attendance` (`course_id`, `student_id`, `attendance_date`),
    KEY `idx_student_id` (`student_id`),
    KEY `idx_attendance_date` (`attendance_date`),
    KEY `idx_semester` (`semester`),
    CONSTRAINT `fk_att_course`  FOREIGN KEY (`course_id`)  REFERENCES `t_course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_att_student` FOREIGN KEY (`student_id`) REFERENCES `t_student` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考勤记录表';

-- ============================================================
-- 14. 实验报告表
-- ============================================================
DROP TABLE IF EXISTS `t_experiment`;
CREATE TABLE `t_experiment` (
    `id`                    BIGINT         NOT NULL AUTO_INCREMENT,
    `course_id`             BIGINT         NOT NULL,
    `student_id`            BIGINT         NOT NULL,
    `experiment_name`       VARCHAR(256)   NOT NULL,
    `experiment_no`         INT            DEFAULT NULL,
    `score`                 DECIMAL(5,2)   DEFAULT NULL,
    `submit_time`           DATETIME       DEFAULT NULL,
    `knowledge_point_ids`   VARCHAR(1024)  DEFAULT NULL,
    `semester`              VARCHAR(32)    DEFAULT NULL,
    `remark`                VARCHAR(512)   DEFAULT NULL,
    `create_time`           DATETIME       DEFAULT CURRENT_TIMESTAMP,
    `deleted`               TINYINT        DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_course_id` (`course_id`),
    KEY `idx_student_id` (`student_id`),
    KEY `idx_semester` (`semester`),
    KEY `idx_experiment_no` (`experiment_no`),
    CONSTRAINT `fk_exp_course`  FOREIGN KEY (`course_id`)  REFERENCES `t_course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_exp_student` FOREIGN KEY (`student_id`) REFERENCES `t_student` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实验报告表';

-- ============================================================
-- 15. 试卷表（AI组卷发布）
-- ============================================================
DROP TABLE IF EXISTS `t_exam_paper`;
CREATE TABLE `t_exam_paper` (
    `id`                BIGINT         NOT NULL AUTO_INCREMENT,
    `course_id`         BIGINT         NOT NULL,
    `teacher_id`        BIGINT         NOT NULL,
    `paper_name`        VARCHAR(256)   NOT NULL COMMENT '试卷名称',
    `total_score`       DECIMAL(5,2)   DEFAULT 100.00,
    `duration_minutes`  INT            DEFAULT 120,
    `start_time`        DATETIME       DEFAULT NULL,
    `end_time`          DATETIME       DEFAULT NULL,
    `target_classes`    VARCHAR(512)   DEFAULT NULL COMMENT '参与班级(逗号分隔)',
    `status`            VARCHAR(16)    DEFAULT 'DRAFT' COMMENT 'DRAFT/PUBLISHED/ONGOING/ENDED',
    `create_time`       DATETIME       DEFAULT CURRENT_TIMESTAMP,
    `deleted`           TINYINT        DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_course_id` (`course_id`),
    KEY `idx_teacher_id` (`teacher_id`),
    KEY `idx_status` (`status`),
    KEY `idx_start_time` (`start_time`),
    CONSTRAINT `fk_paper_course`  FOREIGN KEY (`course_id`)  REFERENCES `t_course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_paper_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `t_teacher` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试卷表';

-- ============================================================
-- 16. 试卷题目关联表
-- ============================================================
DROP TABLE IF EXISTS `t_exam_paper_question`;
CREATE TABLE `t_exam_paper_question` (
    `id`            BIGINT         NOT NULL AUTO_INCREMENT,
    `paper_id`      BIGINT         NOT NULL,
    `question_id`   BIGINT         NOT NULL COMMENT '题库题目ID',
    `question_no`   INT            NOT NULL COMMENT '题号',
    `score`         DECIMAL(5,2)   NOT NULL COMMENT '本题分值',
    `deleted`       TINYINT        DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_paper_question` (`paper_id`, `question_id`),
    KEY `idx_paper_id` (`paper_id`),
    KEY `idx_question_no` (`question_no`),
    CONSTRAINT `fk_pq_paper`    FOREIGN KEY (`paper_id`)    REFERENCES `t_exam_paper` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_pq_question` FOREIGN KEY (`question_id`) REFERENCES `t_question_bank` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试卷题目关联表';

-- ============================================================
-- 17. 题库表（教师级，支持AI出题+质量评分）
-- ============================================================
DROP TABLE IF EXISTS `t_question_bank`;
CREATE TABLE `t_question_bank` (
    `id`                    BIGINT       NOT NULL AUTO_INCREMENT,
    `course_id`             BIGINT       NOT NULL,
    `teacher_id`            BIGINT       NOT NULL,
    `question_type`         VARCHAR(32)  NOT NULL COMMENT 'SINGLE/MULTI/FILL/SHORT/COMPREHENSIVE',
    `difficulty`            VARCHAR(16)  DEFAULT 'MEDIUM',
    `content`               TEXT         NOT NULL COMMENT '题目JSON',
    `knowledge_points`      VARCHAR(512) DEFAULT NULL,
    `ai_generated`          TINYINT      DEFAULT 0,
    `quality_clarity`       TINYINT      DEFAULT NULL COMMENT '清晰度1-5',
    `quality_difficulty`    TINYINT      DEFAULT NULL COMMENT '难度匹配度1-5',
    `quality_ambiguity`     TINYINT      DEFAULT NULL COMMENT '歧义性1-5(5=无歧义)',
    `quality_kp_coverage`   TINYINT      DEFAULT NULL COMMENT '知识点覆盖度1-5',
    `socratic_mode`         TINYINT      DEFAULT 0 COMMENT '苏格拉底模式',
    `socratic_chain`        TEXT         DEFAULT NULL COMMENT '追问链JSON',
    `usage_count`           INT          DEFAULT 0,
    `status`                VARCHAR(16)  DEFAULT 'DRAFT' COMMENT 'DRAFT/APPROVED/PUBLISHED',
    `create_time`           DATETIME     DEFAULT CURRENT_TIMESTAMP,
    `update_time`           DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted`               TINYINT      DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_course_id` (`course_id`),
    KEY `idx_teacher_id` (`teacher_id`),
    KEY `idx_type_diff` (`question_type`, `difficulty`),
    KEY `idx_status` (`status`),
    KEY `idx_ai_generated` (`ai_generated`),
    CONSTRAINT `fk_qb_course`  FOREIGN KEY (`course_id`)  REFERENCES `t_course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_qb_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `t_teacher` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题库表';

-- ============================================================
-- 18. 错题本
-- ============================================================
DROP TABLE IF EXISTS `t_student_wrong_question`;
CREATE TABLE `t_student_wrong_question` (
    `id`                BIGINT         NOT NULL AUTO_INCREMENT,
    `student_id`        BIGINT         NOT NULL,
    `course_id`         BIGINT         NOT NULL,
    `question_content`  TEXT           DEFAULT NULL COMMENT '题目内容JSON',
    `student_answer`    VARCHAR(2048)  DEFAULT NULL,
    `correct_answer`    VARCHAR(2048)  DEFAULT NULL,
    `knowledge_points`  VARCHAR(512)   DEFAULT NULL,
    `analysis`          TEXT           DEFAULT NULL COMMENT '解析',
    `wrong_count`       INT            DEFAULT 1,
    `source`            VARCHAR(32)    DEFAULT 'ASSESSMENT' COMMENT 'ASSESSMENT/AI_GENERATE',
    `source_id`         BIGINT         DEFAULT NULL,
    `create_time`       DATETIME       DEFAULT CURRENT_TIMESTAMP,
    `update_time`       DATETIME       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted`           TINYINT        DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_student_id` (`student_id`),
    KEY `idx_course_id` (`course_id`),
    KEY `idx_kp` (`knowledge_points`(255)),
    KEY `idx_source` (`source`),
    CONSTRAINT `fk_wq_student` FOREIGN KEY (`student_id`) REFERENCES `t_student` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_wq_course`  FOREIGN KEY (`course_id`)  REFERENCES `t_course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='错题本';

-- ============================================================
-- 19. 预警规则配置表
-- ============================================================
DROP TABLE IF EXISTS `t_warning_rule`;
CREATE TABLE `t_warning_rule` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT,
    `rule_name`     VARCHAR(128) NOT NULL,
    `rule_type`     VARCHAR(32)  NOT NULL COMMENT 'ATTENDANCE/SCORE_DROP/HOMEWORK_MISS/KP_WEAK',
    `threshold`     VARCHAR(128) NOT NULL,
    `severity`      VARCHAR(8)   DEFAULT 'HIGH',
    `is_active`     TINYINT      DEFAULT 1,
    `description`   VARCHAR(256) DEFAULT NULL,
    `create_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    `deleted`       TINYINT      DEFAULT 0,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预警规则配置表';

-- ============================================================
-- 20. 预警记录表
-- ============================================================
DROP TABLE IF EXISTS `t_warning_record`;
CREATE TABLE `t_warning_record` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT,
    `student_id`    BIGINT       NOT NULL,
    `course_id`     BIGINT       NOT NULL,
    `rule_id`       BIGINT       DEFAULT NULL,
    `warning_type`  VARCHAR(32)  NOT NULL,
    `severity`      VARCHAR(8)   NOT NULL COMMENT 'HIGH/MEDIUM/LOW',
    `warning_msg`   VARCHAR(512) NOT NULL,
    `is_resolved`   TINYINT      DEFAULT 0,
    `create_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    `deleted`       TINYINT      DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_student_id` (`student_id`),
    KEY `idx_course_id` (`course_id`),
    KEY `idx_severity` (`severity`),
    KEY `idx_create_time` (`create_time`),
    KEY `idx_course_severity` (`course_id`, `severity`),
    CONSTRAINT `fk_warn_student` FOREIGN KEY (`student_id`) REFERENCES `t_student` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_warn_course`  FOREIGN KEY (`course_id`)  REFERENCES `t_course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预警记录表';

-- ============================================================
-- 21. 通知主表
-- ============================================================
DROP TABLE IF EXISTS `t_notification`;
CREATE TABLE `t_notification` (
    `id`                  BIGINT       NOT NULL AUTO_INCREMENT,
    `sender_id`           BIGINT       DEFAULT NULL COMMENT '发送者t_user.id(NULL=系统)',
    `sender_name`         VARCHAR(64)  DEFAULT NULL,
    `title`               VARCHAR(256) NOT NULL,
    `content`             TEXT         NOT NULL,
    `notification_type`   VARCHAR(32)  DEFAULT 'MANUAL' COMMENT 'MANUAL/WARNING/EXAM_REMIND/SYSTEM',
    `recipient_scope`     VARCHAR(16)  NOT NULL COMMENT 'ALL/COURSE/STUDENTS',
    `course_id`           BIGINT       DEFAULT NULL,
    `create_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP,
    `deleted`             TINYINT      DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_sender_id` (`sender_id`),
    KEY `idx_notification_type` (`notification_type`),
    KEY `idx_create_time` (`create_time`),
    KEY `idx_course_id` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知主表';

-- ============================================================
-- 22. 通知接收者表（每人独立已读状态）
-- ============================================================
DROP TABLE IF EXISTS `t_notification_recipient`;
CREATE TABLE `t_notification_recipient` (
    `id`              BIGINT   NOT NULL AUTO_INCREMENT,
    `notification_id` BIGINT   NOT NULL,
    `recipient_id`    BIGINT   NOT NULL COMMENT '接收者t_user.id',
    `is_read`         TINYINT  DEFAULT 0,
    `read_time`       DATETIME DEFAULT NULL,
    `deleted`         TINYINT  DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_notif_recipient` (`notification_id`, `recipient_id`),
    KEY `idx_recipient_read` (`recipient_id`, `is_read`),
    CONSTRAINT `fk_nr_notification` FOREIGN KEY (`notification_id`) REFERENCES `t_notification` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_nr_recipient`   FOREIGN KEY (`recipient_id`)    REFERENCES `t_user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知接收者表';

-- ============================================================
-- 23. 系统参数配置表
-- ============================================================
DROP TABLE IF EXISTS `t_system_config`;
CREATE TABLE `t_system_config` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT,
    `config_key`    VARCHAR(64)  NOT NULL,
    `config_value`  VARCHAR(512) NOT NULL,
    `config_type`   VARCHAR(32)  DEFAULT 'STRING',
    `description`   VARCHAR(256) DEFAULT NULL,
    `create_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    `update_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统参数配置表';

-- ============================================================
-- 24. 操作日志表
-- ============================================================
DROP TABLE IF EXISTS `t_operation_log`;
CREATE TABLE `t_operation_log` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT,
    `log_type`      VARCHAR(32)  NOT NULL COMMENT 'OPERATION/AI_CALL/ERROR',
    `user_id`       BIGINT       DEFAULT NULL,
    `username`      VARCHAR(32)  DEFAULT NULL,
    `action`        VARCHAR(128) NOT NULL COMMENT '操作描述',
    `target_type`   VARCHAR(32)  DEFAULT NULL,
    `target_id`     BIGINT       DEFAULT NULL,
    `detail`        TEXT         DEFAULT NULL COMMENT '详细信息JSON',
    `ip_address`    VARCHAR(64)  DEFAULT NULL,
    `create_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    `deleted`       TINYINT      DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_log_type` (`log_type`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_create_time` (`create_time`),
    KEY `idx_type_time` (`log_type`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- ============================================================
-- 25-26. 数据源 + 导入日志
-- ============================================================
DROP TABLE IF EXISTS `t_data_source`;
CREATE TABLE `t_data_source` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT,
    `source_name`   VARCHAR(128) NOT NULL,
    `source_type`   VARCHAR(32)  NOT NULL,
    `file_path`     VARCHAR(512) DEFAULT NULL,
    `description`   VARCHAR(512) DEFAULT NULL,
    `status`        VARCHAR(16)  DEFAULT 'ACTIVE',
    `create_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    `update_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted`       TINYINT      DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_source_type` (`source_type`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据源配置表';

DROP TABLE IF EXISTS `t_data_import_log`;
CREATE TABLE `t_data_import_log` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT,
    `source_id`     BIGINT       DEFAULT NULL,
    `user_id`       BIGINT       DEFAULT NULL COMMENT '导入者t_user.id',
    `file_name`     VARCHAR(256) DEFAULT NULL,
    `import_type`   VARCHAR(32)  DEFAULT NULL COMMENT 'HOMEWORK/ATTENDANCE/EXPERIMENT/QUIZ/EXAM_SCORE/KNOWLEDGE_POINT/CLASS_STUDENT/TEACHER/STUDENT',
    `total_rows`    INT          DEFAULT 0,
    `success_rows`  INT          DEFAULT 0,
    `fail_rows`     INT          DEFAULT 0,
    `status`        VARCHAR(16)  DEFAULT NULL,
    `error_msg`     TEXT         DEFAULT NULL,
    `import_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    `deleted`       TINYINT      DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_source_id` (`source_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_import_type` (`import_type`),
    KEY `idx_status` (`status`),
    KEY `idx_import_time` (`import_time`),
    CONSTRAINT `fk_log_source` FOREIGN KEY (`source_id`) REFERENCES `t_data_source` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据导入日志表';

-- ============================================================
-- 27. AI分析结果表
-- ============================================================
DROP TABLE IF EXISTS `t_ai_analysis_result`;
CREATE TABLE `t_ai_analysis_result` (
    `id`                BIGINT      NOT NULL AUTO_INCREMENT,
    `analysis_type`     VARCHAR(32) DEFAULT NULL COMMENT 'KP_MASTERY/WRONG_QUESTION/STUDENT_PORTRAIT/QUESTION_GENERATE/EXAM_ANALYSIS/SOCRATIC_QUESTION',
    `target_type`       VARCHAR(32) DEFAULT NULL COMMENT 'STUDENT/COURSE/ASSESSMENT/EXAM_PAPER/REPORT',
    `target_id`         BIGINT      DEFAULT NULL,
    `result_data`       JSON        DEFAULT NULL,
    `model_name`        VARCHAR(64) DEFAULT NULL,
    `process_time_ms`   INT         DEFAULT NULL COMMENT '推理耗时(毫秒)',
    `analysis_time`     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    `deleted`           TINYINT     DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_target` (`target_type`, `target_id`),
    KEY `idx_analysis_type` (`analysis_type`),
    KEY `idx_analysis_time` (`analysis_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI分析结果表';

-- ============================================================
<<<<<<< Updated upstream
-- 初始化种子数据
-- ============================================================

-- 系统管理员账号
INSERT INTO `t_user` (`username`, `password`, `role`, `first_login`) VALUES
('admin', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'ADMIN', 1);

-- 教师账号
INSERT INTO `t_user` (`username`, `password`, `role`) VALUES
('T001', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'TEACHER'),
('T002', '$2a$10$GUh9AqBupw0IrscEUZ/Bd.03kGXgUUL2x1eFFC7DDckv/PAZx6fzG', 'TEACHER');

INSERT INTO `t_teacher` (`id`, `user_id`, `teacher_no`, `name`, `gender`, `college`, `department`, `title`, `email`) VALUES
(2, 2, 'T001', '张建国', '男', '计算机学院', '软件工程系', '教授', 'zjg@university.edu.cn'),
(3, 3, 'T002', '李美玲', '女', '计算机学院', '网络工程系', '副教授', 'lml@university.edu.cn');

=======
>>>>>>> Stashed changes
-- 预警规则预置
INSERT INTO `t_warning_rule` (`rule_name`, `rule_type`, `threshold`, `severity`, `is_active`, `description`) VALUES
('缺勤过多预警',      'ATTENDANCE',    '缺勤次数>=3',              'HIGH',   1, '缺勤次数达到3次触发高危预警'),
('成绩持续下滑预警',   'SCORE_DROP',    '连续2次成绩下降>=20%',       'HIGH',   1, '连续两次考核成绩下降超过20%触发预警'),
('作业连续未交预警',   'HOMEWORK_MISS', '连续3次作业未交',            'HIGH',   1, '连续3次作业未提交触发预警'),
('知识点严重薄弱预警', 'KP_WEAK',       '单知识点掌握率<30%',         'MEDIUM', 1, '某个知识点的掌握率低于30%触发预警');

-- 系统参数配置预置
INSERT INTO `t_system_config` (`config_key`, `config_value`, `config_type`, `description`) VALUES
('ai.api.base_url',              'http://localhost:11434', 'STRING', '大模型API地址'),
('ai.api.model_name',            'qwen2.5:7b',            'STRING', '大模型名称'),
('ai.api.timeout_seconds',       '60',                     'INT',    '模型超时时间(秒)'),
('default.password',             '123456',                  'STRING', '默认初始密码'),
('warning.attendance_threshold',  '3',                      'INT',    '缺勤次数阈值'),
('warning.score_drop_threshold', '20',                      'INT',    '成绩下滑幅度阈值(%)'),
('warning.score_drop_times',     '2',                       'INT',    '成绩连续下滑次数'),
('warning.homework_miss_times',  '3',                       'INT',    '作业连续未交次数'),
('warning.kp_mastery_threshold', '30',                      'INT',    '知识点薄弱阈值(%)'),
('warning.dedup_hours',          '24',                      'INT',    '预警去重时间(小时)'),
('log.retention_days',           '30',                      'INT',    '日志保留天数');

SET FOREIGN_KEY_CHECKS = 1;
