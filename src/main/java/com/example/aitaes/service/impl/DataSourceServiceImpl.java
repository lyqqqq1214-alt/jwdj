package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.entity.DataSource;
import com.example.aitaes.mapper.DataSourceMapper;
import com.example.aitaes.service.DataSourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 数据源管理服务实现
 */
@Service
@RequiredArgsConstructor
public class DataSourceServiceImpl implements DataSourceService {

    private final DataSourceMapper dataSourceMapper;

    @Override
    public IPage<DataSource> page(int pageNum, int pageSize, String sourceType) {
        Page<DataSource> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<DataSource> wrapper = new LambdaQueryWrapper<>();
        if (sourceType != null && !sourceType.isBlank()) {
            wrapper.eq(DataSource::getSourceType, sourceType);
        }
        wrapper.orderByDesc(DataSource::getCreateTime);
        return dataSourceMapper.selectPage(page, wrapper);
    }

    @Override
    public DataSource getById(Long id) {
        DataSource ds = dataSourceMapper.selectById(id);
        if (ds == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "数据源不存在: id=" + id);
        }
        return ds;
    }

    @Override
    public DataSource create(DataSource entity) {
        dataSourceMapper.insert(entity);
        return entity;
    }

    @Override
    public DataSource update(Long id, DataSource entity) {
        DataSource existing = getById(id);
        BeanUtils.copyProperties(entity, existing, "id", "createTime");
        dataSourceMapper.updateById(existing);
        return existing;
    }

    @Override
    public void delete(Long id) {
        getById(id);
        dataSourceMapper.deleteById(id);
    }

    @Override
    public List<DataSource> listActive() {
        return dataSourceMapper.selectList(
                new LambdaQueryWrapper<DataSource>()
                        .eq(DataSource::getStatus, "ACTIVE"));
    }
}
