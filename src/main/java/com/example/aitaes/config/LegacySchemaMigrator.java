package com.example.aitaes.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 为已存在的旧版 MySQL 数据库补齐应用后来新增的字段。
 * 不重建表、不删除任何数据；只在字段缺失时执行 ADD COLUMN。
 */
@Slf4j
@Component
@Order(0)
@Profile("mysql")
@RequiredArgsConstructor
public class LegacySchemaMigrator implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        ensureColumn("t_course_student", "ai_evaluation", "TEXT NULL COMMENT 'AI综合评价'");
        ensureColumn("t_course_student", "ai_evaluation_time", "DATETIME NULL COMMENT 'AI评价生成时间'");
        ensureColumn("t_course_student", "ai_suggestions", "TEXT NULL COMMENT 'AI学习建议(JSON数组)'");
        ensureColumn("t_course_student", "ai_suggestions_time", "DATETIME NULL COMMENT 'AI学习建议生成时间'");
        ensureColumn("t_assessment", "paper_id", "BIGINT NULL COMMENT '关联在线试卷ID'");
    }

    private void ensureColumn(String tableName, String columnName, String definition) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
                """, Integer.class, tableName, columnName);
        if (count != null && count == 0) {
            jdbcTemplate.execute("ALTER TABLE `" + tableName + "` ADD COLUMN `" + columnName + "` " + definition);
            log.info("已为旧数据库补齐字段: {}.{}", tableName, columnName);
        }
    }
}
