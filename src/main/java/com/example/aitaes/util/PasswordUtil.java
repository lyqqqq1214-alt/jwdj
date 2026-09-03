package com.example.aitaes.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * 密码加密工具 — BCrypt 单向哈希
 * <p>
 * 用于创建学生/教师账号时加密初始密码，以及登录验证时的密码比对。
 */
public final class PasswordUtil {

    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder();

    private PasswordUtil() {
        // 工具类，禁止实例化
    }

    /**
     * 加密原始密码
     *
     * @param rawPassword 明文密码
     * @return BCrypt 密文（60 字符，$2a$ 前缀）
     */
    public static String encode(String rawPassword) {
        return ENCODER.encode(rawPassword);
    }

    /**
     * 验证密码是否匹配
     *
     * @param rawPassword     明文密码
     * @param encodedPassword BCrypt 密文
     * @return true 表示匹配
     */
    public static boolean matches(String rawPassword, String encodedPassword) {
        return ENCODER.matches(rawPassword, encodedPassword);
    }
}
