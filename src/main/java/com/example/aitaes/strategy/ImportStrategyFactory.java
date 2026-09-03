package com.example.aitaes.strategy;

import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.enums.ImportType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 导入策略工厂 - 根据导入类型路由到对应策略
 * <p>
 * Spring 自动注入所有 {@link ImportStrategy} 实现，构建类型→策略的映射表。
 * 新增导入类型只需添加策略实现类，无需修改工厂代码。
 */
@Component
public class ImportStrategyFactory {

    private final Map<ImportType, ImportStrategy> strategyMap;

    public ImportStrategyFactory(List<ImportStrategy> strategies) {
        this.strategyMap = strategies.stream()
                .collect(Collectors.toMap(
                        ImportStrategy::getSupportedType,
                        Function.identity()));
        if (strategyMap.isEmpty()) {
            throw new IllegalStateException("未找到任何 ImportStrategy 实现");
        }
    }

    /**
     * 根据导入类型获取对应的策略
     *
     * @param type 导入类型
     * @return 对应的策略实现
     * @throws BusinessException 如果不支持该类型
     */
    public ImportStrategy getStrategy(ImportType type) {
        ImportStrategy strategy = strategyMap.get(type);
        if (strategy == null) {
            throw new BusinessException(
                    ResultCode.BAD_REQUEST.getCode(),
                    "不支持的导入类型: " + type.getCode());
        }
        return strategy;
    }
}
