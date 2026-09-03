package com.example.aitaes.mapper;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.entity.DataSource;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * DataSourceMapper 集成测试 — 验证数据源表 SQL 映射
 */
@SpringBootTest
@ActiveProfiles("test")
@Sql(scripts = {"/schema-h2.sql", "/test-data.sql"})
@DisplayName("DataSourceMapper 集成测试")
class DataSourceMapperTest {

    @Autowired
    private DataSourceMapper dsMapper;

    @Test
    @DisplayName("插入数据源 → 可查询到")
    void shouldInsertAndQuery() {
        DataSource ds = new DataSource();
        ds.setSourceName("测试数据源");
        ds.setSourceType("EXCEL");
        ds.setStatus("ACTIVE");

        int rows = dsMapper.insert(ds);
        assertEquals(1, rows);
        assertNotNull(ds.getId());

        DataSource found = dsMapper.selectById(ds.getId());
        assertNotNull(found);
        assertEquals("测试数据源", found.getSourceName());
    }

    @Test
    @DisplayName("按类型过滤 → 只返回匹配类型")
    void shouldFilterByType() {
        DataSource ds1 = new DataSource();
        ds1.setSourceName("Excel源");
        ds1.setSourceType("EXCEL");
        ds1.setStatus("ACTIVE");
        dsMapper.insert(ds1);

        DataSource ds2 = new DataSource();
        ds2.setSourceName("CSV源");
        ds2.setSourceType("CSV");
        ds2.setStatus("ACTIVE");
        dsMapper.insert(ds2);

        List<DataSource> excelDs = dsMapper.selectList(
                new LambdaQueryWrapper<DataSource>()
                        .eq(DataSource::getSourceType, "EXCEL")
        );

        assertFalse(excelDs.isEmpty());
        excelDs.forEach(d -> assertEquals("EXCEL", d.getSourceType()));
    }
}
