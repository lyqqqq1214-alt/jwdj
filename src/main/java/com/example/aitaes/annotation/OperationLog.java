package com.example.aitaes.annotation;

import java.lang.annotation.*;

/**
 * 操作日志注解
 * <p>
 * 标注在 Controller 方法上，AOP 切面自动记录操作日志。
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface OperationLog {

    /** 操作描述 */
    String value() default "";

    /** 操作类型 */
    String action() default "";

    /** 目标类型 */
    String targetType() default "";
}
