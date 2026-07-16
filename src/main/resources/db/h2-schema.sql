-- H2 兼容建表脚本（MySQL模式）
SET MODE MySQL;

-- 1. 统一用户认证表
CREATE TABLE IF NOT EXISTS t_user (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    username        VARCHAR(32)  NOT NULL,
    password        VARCHAR(256) NOT NULL,
    role            VARCHAR(16)  NOT NULL,
    status          VARCHAR(16)  DEFAULT 'ACTIVE',
    first_login     TINYINT      DEFAULT 1,
    last_login_time DATETIME     DEFAULT NULL,
    create_time     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    deleted         TINYINT      DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE (username)
);

-- 2. 教师表
CREATE TABLE IF NOT EXISTS t_teacher (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    user_id       BIGINT       NOT NULL,
    teacher_no    VARCHAR(32)  NOT NULL,
    name          VARCHAR(64)  NOT NULL,
    gender        VARCHAR(8)   DEFAULT NULL,
    college       VARCHAR(128) DEFAULT NULL,
    department    VARCHAR(128) DEFAULT NULL,
    title         VARCHAR(64)  DEFAULT NULL,
    email         VARCHAR(128) DEFAULT NULL,
    phone         VARCHAR(32)  DEFAULT NULL,
    create_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    deleted       TINYINT      DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE (teacher_no),
    UNIQUE (user_id)
);

-- 3. 学生表
CREATE TABLE IF NOT EXISTS t_student (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    user_id       BIGINT       NOT NULL,
    student_no    VARCHAR(32)  NOT NULL,
    name          VARCHAR(64)  NOT NULL,
    gender        VARCHAR(8)   DEFAULT NULL,
    college       VARCHAR(128) DEFAULT NULL,
    major         VARCHAR(128) DEFAULT NULL,
    class_name    VARCHAR(128) DEFAULT NULL,
    email         VARCHAR(128) DEFAULT NULL,
    phone         VARCHAR(32)  DEFAULT NULL,
    create_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    deleted       TINYINT      DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE (student_no),
    UNIQUE (user_id)
);