package com.example.aitaes.annotation;

import java.lang.annotation.*;

/**
 * 角色权限校验注解
 * <p>
 * 标注在 Controller 方法上，指定允许访问的角色。
 * 不标注则仅要求登录（任意角色均可访问）。
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequireRole {

    /**
     * 允许访问的角色列表
     */
    String[] value() default {};
}
