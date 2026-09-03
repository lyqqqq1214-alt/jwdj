package com.example.aitaes.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.entity.DataSource;

import java.util.List;

/**
 * 数据源管理服务接口
 */
public interface DataSourceService {

    /** 分页查询，可按类型过滤 */
    IPage<DataSource> page(int pageNum, int pageSize, String sourceType);

    /** 根据ID查询 */
    DataSource getById(Long id);

    /** 新增 */
    DataSource create(DataSource entity);

    /** 更新 */
    DataSource update(Long id, DataSource entity);

    /** 删除（逻辑删除） */
    void delete(Long id);

    /** 查询所有激活的数据源 */
    List<DataSource> listActive();
}
