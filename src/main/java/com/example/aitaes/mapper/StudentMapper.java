package com.example.aitaes.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.aitaes.entity.Student;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface StudentMapper extends BaseMapper<Student> {
}
