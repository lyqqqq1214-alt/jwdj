package com.example.aitaes.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.example.aitaes.mapper")
public class MybatisPlusConfig {
}
