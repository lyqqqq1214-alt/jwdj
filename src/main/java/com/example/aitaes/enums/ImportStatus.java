package com.example.aitaes.enums;

import lombok.Getter;

/**
 * 导入状态枚举
 */
@Getter
public enum ImportStatus {

    SUCCESS("SUCCESS", "全部成功"),
    PARTIAL("PARTIAL", "部分成功"),
    FAILED("FAILED", "全部失败");

    private final String code;
    private final String description;

    ImportStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public static ImportStatus fromCode(String code) {
        for (ImportStatus status : values()) {
            if (status.code.equalsIgnoreCase(code)) {
                return status;
            }
        }
        throw new IllegalArgumentException("未知的导入状态: " + code);
    }
}
