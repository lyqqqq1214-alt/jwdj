package com.example.aitaes.mapper;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.entity.DataImportLog;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * DataImportLogMapper 集成测试 — 验证导入日志表 SQL 映射
 */
@SpringBootTest
@ActiveProfiles("test")
@Sql(scripts = {"/schema-h2.sql", "/test-data.sql"})
@DisplayName("DataImportLogMapper 集成测试")
class DataImportLogMapperTest {

    @Autowired
    private DataImportLogMapper logMapper;

    @Test
    @DisplayName("插入日志 → 可查询到")
    void shouldInsertAndQuery() {
        DataImportLog log = new DataImportLog();
        log.setFileName("test.xlsx");
        log.setImportType("TEACHER");
        log.setTotalRows(10);
        log.setSuccessRows(10);
        log.setFailRows(0);
        log.setStatus("SUCCESS");
        log.setImportTime(LocalDateTime.now());

        int rows = logMapper.insert(log);
        assertEquals(1, rows);
        assertNotNull(log.getId());
    }

    @Test
    @DisplayName("按导入类型过滤 → 只返回匹配记录")
    void shouldFilterByType() {
        // 插入两条不同类型日志
        DataImportLog log1 = new DataImportLog();
        log1.setFileName("a.xlsx");
        log1.setImportType("TEACHER");
        log1.setTotalRows(5);
        log1.setSuccessRows(5);
        log1.setFailRows(0);
        log1.setStatus("SUCCESS");
        log1.setImportTime(LocalDateTime.now());
        logMapper.insert(log1);

        DataImportLog log2 = new DataImportLog();
        log2.setFileName("b.xlsx");
        log2.setImportType("STUDENT");
        log2.setTotalRows(3);
        log2.setSuccessRows(3);
        log2.setFailRows(0);
        log2.setStatus("SUCCESS");
        log2.setImportTime(LocalDateTime.now());
        logMapper.insert(log2);

        List<DataImportLog> teacherLogs = logMapper.selectList(
                new LambdaQueryWrapper<DataImportLog>()
                        .eq(DataImportLog::getImportType, "TEACHER")
        );

        assertFalse(teacherLogs.isEmpty());
        teacherLogs.forEach(l -> assertEquals("TEACHER", l.getImportType()));
    }
}
