package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.entity.DataSource;
import com.example.aitaes.mapper.DataSourceMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * 数据源管理服务单元测试
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("数据源管理服务")
class DataSourceServiceImplTest {

    @Mock
    private DataSourceMapper dataSourceMapper;

    @InjectMocks
    private DataSourceServiceImpl service;

    private DataSource createDs(Long id, String name, String type, String status) {
        DataSource ds = new DataSource();
        ds.setId(id);
        ds.setSourceName(name);
        ds.setSourceType(type);
        ds.setStatus(status);
        ds.setCreateTime(LocalDateTime.now());
        return ds;
    }

    @Nested
    @DisplayName("分页查询 - page")
    class PageQuery {

        @Test
        @DisplayName("无类型过滤 → 返回全部记录分页")
        void shouldReturnAll_WhenNoFilter() {
            Page<DataSource> mockPage = new Page<>(1, 10);
            mockPage.setRecords(List.of(createDs(1L, "DS1", "EXCEL", "ACTIVE")));
            mockPage.setTotal(1);
            when(dataSourceMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class)))
                    .thenReturn(mockPage);

            IPage<DataSource> result = service.page(1, 10, null);

            assertEquals(1, result.getTotal());
            assertEquals(1, result.getRecords().size());
        }

        @Test
        @DisplayName("按类型过滤 → 只返回匹配类型")
        void shouldFilterByType() {
            Page<DataSource> mockPage = new Page<>(1, 10);
            mockPage.setRecords(List.of(createDs(1L, "DS1", "EXCEL", "ACTIVE")));
            mockPage.setTotal(1);
            when(dataSourceMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class)))
                    .thenReturn(mockPage);

            IPage<DataSource> result = service.page(1, 10, "EXCEL");

            assertEquals(1, result.getTotal());
        }
    }

    @Nested
    @DisplayName("按 ID 查询 - getById")
    class GetById {

        @Test
        @DisplayName("ID 存在 → 返回 DataSource")
        void shouldReturn_WhenExists() {
            DataSource ds = createDs(1L, "测试数据源", "EXCEL", "ACTIVE");
            when(dataSourceMapper.selectById(1L)).thenReturn(ds);

            DataSource result = service.getById(1L);

            assertNotNull(result);
            assertEquals("测试数据源", result.getSourceName());
        }

        @Test
        @DisplayName("ID 不存在 → 抛出 BusinessException")
        void shouldThrow_WhenNotExists() {
            when(dataSourceMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> service.getById(999L));

            assertTrue(ex.getMessage().contains("数据源不存在"));
            assertTrue(ex.getMessage().contains("999"));
        }
    }

    @Nested
    @DisplayName("创建 - create")
    class Create {

        @Test
        @DisplayName("创建成功 → 返回带 ID 的实体")
        void shouldReturnEntityWithId() {
            DataSource input = createDs(null, "新数据源", "EXCEL", "ACTIVE");
            doAnswer(inv -> {
                DataSource ds = inv.getArgument(0);
                ds.setId(100L);
                return 1;
            }).when(dataSourceMapper).insert(any(DataSource.class));

            DataSource result = service.create(input);

            assertEquals(100L, result.getId());
            verify(dataSourceMapper).insert(input);
        }
    }

    @Nested
    @DisplayName("更新 - update")
    class Update {

        @Test
        @DisplayName("正常更新 → 保留 ID 和 createTime")
        void shouldPreserveIdAndCreateTime() {
            DataSource existing = createDs(1L, "旧名称", "EXCEL", "ACTIVE");
            existing.setCreateTime(LocalDateTime.of(2025, 1, 1, 10, 0));
            when(dataSourceMapper.selectById(1L)).thenReturn(existing);

            DataSource update = new DataSource();
            update.setSourceName("新名称");

            DataSource result = service.update(1L, update);

            assertEquals("新名称", result.getSourceName());
            assertEquals(1L, result.getId());
            assertNotNull(result.getCreateTime());
            verify(dataSourceMapper).updateById(existing);
        }

        @Test
        @DisplayName("更新不存在的 ID → 抛出异常")
        void shouldThrow_WhenIdNotExists() {
            when(dataSourceMapper.selectById(999L)).thenReturn(null);

            assertThrows(BusinessException.class,
                    () -> service.update(999L, new DataSource()));
        }
    }

    @Nested
    @DisplayName("删除 - delete")
    class Delete {

        @Test
        @DisplayName("正常删除 → 调用 deleteById")
        void shouldDelete() {
            DataSource existing = createDs(1L, "DS", "EXCEL", "ACTIVE");
            when(dataSourceMapper.selectById(1L)).thenReturn(existing);

            service.delete(1L);

            verify(dataSourceMapper).deleteById(1L);
        }

        @Test
        @DisplayName("删除不存在的 ID → 抛出异常")
        void shouldThrow_WhenIdNotExists() {
            when(dataSourceMapper.selectById(999L)).thenReturn(null);

            assertThrows(BusinessException.class,
                    () -> service.delete(999L));

            verify(dataSourceMapper, never()).deleteById(anyLong());
        }
    }

    @Nested
    @DisplayName("激活列表 - listActive")
    class ListActive {

        @Test
        @DisplayName("有激活的数据源 → 返回列表")
        void shouldReturnActiveList() {
            when(dataSourceMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(
                            createDs(1L, "DS1", "EXCEL", "ACTIVE"),
                            createDs(2L, "DS2", "CSV", "ACTIVE")
                    ));

            List<DataSource> result = service.listActive();

            assertEquals(2, result.size());
        }

        @Test
        @DisplayName("无激活的数据源 → 返回空列表")
        void shouldReturnEmpty_WhenNoActive() {
            when(dataSourceMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of());

            List<DataSource> result = service.listActive();

            assertTrue(result.isEmpty());
        }
    }
}
