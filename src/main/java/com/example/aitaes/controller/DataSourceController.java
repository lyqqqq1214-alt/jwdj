package com.example.aitaes.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.common.Result;
import com.example.aitaes.entity.DataSource;
import com.example.aitaes.service.DataSourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 数据源管理控制器
 * <p>
 * 提供数据源配置的 CRUD 接口
 */
@RestController
@RequestMapping("/api/datasource")
@RequiredArgsConstructor
public class DataSourceController {

    private final DataSourceService dataSourceService;

    /** 分页查询数据源，可按类型过滤 */
    @GetMapping
    public Result<IPage<DataSource>> list(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String sourceType) {
        return Result.success(dataSourceService.page(pageNum, pageSize, sourceType));
    }

    /** 根据ID查询数据源详情 */
    @GetMapping("/{id}")
    public Result<DataSource> getById(@PathVariable Long id) {
        return Result.success(dataSourceService.getById(id));
    }

    /** 新增数据源 */
    @PostMapping
    public Result<DataSource> create(@RequestBody DataSource entity) {
        return Result.success(dataSourceService.create(entity));
    }

    /** 更新数据源 */
    @PutMapping("/{id}")
    public Result<DataSource> update(@PathVariable Long id, @RequestBody DataSource entity) {
        return Result.success(dataSourceService.update(id, entity));
    }

    /** 删除数据源 */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        dataSourceService.delete(id);
        return Result.success();
    }

    /** 查询所有激活的数据源（供下拉选择） */
    @GetMapping("/active")
    public Result<List<DataSource>> listActive() {
        return Result.success(dataSourceService.listActive());
    }
}
