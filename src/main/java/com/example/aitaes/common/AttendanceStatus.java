package com.example.aitaes.common;

import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.Set;

/**
 * 考勤状态归一化工具类
 * <p>
 * 将英文状态字符串统一转换为中文，便于前端展示与后端统计。
 * 转换是幂等的：中文状态原样返回。
 * <p>
 * 映射关系：PRESENT→出勤  LATE→迟到  LEAVE→请假  ABSENT→缺勤
 */
@Slf4j
public final class AttendanceStatus {

    private static final Map<String, String> EN_TO_CN = Map.of(
            "PRESENT", "出勤",
            "LATE", "迟到",
            "LEAVE", "请假",
            "ABSENT", "缺勤"
    );

    private static final Set<String> CN_SET = Set.of("出勤", "迟到", "请假", "缺勤");

    private AttendanceStatus() {
    }

    /**
     * 归一化考勤状态为中文。
     * <ul>
     *   <li>英文 → 中文规范形式（大小写不敏感）</li>
     *   <li>中文 → 原样返回</li>
     *   <li>无法识别 → 原样返回并记录 WARN 日志</li>
     * </ul>
     *
     * @param status 原始状态字符串
     * @return 归一化后的中文状态，若输入为 null/空白则原样返回
     */
    public static String normalize(String status) {
        if (status == null || status.isBlank()) {
            return status;
        }
        String trimmed = status.trim();
        // 已是中文
        if (CN_SET.contains(trimmed)) {
            return trimmed;
        }
        // 英文 → 中文（大小写不敏感）
        String cn = EN_TO_CN.get(trimmed.toUpperCase());
        if (cn != null) {
            return cn;
        }
        // 无法识别
        log.warn("无法识别的考勤状态 '{}'，原样保留", trimmed);
        return trimmed;
    }
}
