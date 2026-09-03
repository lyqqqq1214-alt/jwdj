package com.example.aitaes.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.aitaes.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
