package com.example.aitaes.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.annotation.RequireRole;
import com.example.aitaes.common.Result;
import com.example.aitaes.entity.KnowledgePoint;
import com.example.aitaes.entity.QuestionBank;
import com.example.aitaes.service.QuestionBankService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 题库管理控制器（教师）
 */
@Slf4j
@RestController
@RequestMapping("/api/question-bank")
@RequiredArgsConstructor
@RequireRole({"TEACHER", "ASSISTANT"})
public class QuestionBankController {

    private final QuestionBankService questionBankService;

    /**
     * 分页列表
     */
    @GetMapping
    public Result<IPage<QuestionBank>> list(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) String questionType,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String keyword) {
        return Result.success(questionBankService.page(
                pageNum, pageSize, courseId, questionType, difficulty, keyword));
    }

    /**
     * 题目详情
     */
    @GetMapping("/{id}")
    public Result<QuestionBank> getById(@PathVariable Long id) {
        return Result.success(questionBankService.getById(id));
    }

    /**
     * 新增题目
     */
    @PostMapping
    public Result<QuestionBank> create(@RequestAttribute("userId") Long userId,
                                        @RequestBody QuestionBank entity) {
        return Result.success("题目添加成功", questionBankService.create(userId, entity));
    }

    /**
     * 更新题目
     */
    @PutMapping("/{id}")
    public Result<QuestionBank> update(@PathVariable Long id, @RequestBody QuestionBank entity) {
        return Result.success("题目更新成功", questionBankService.update(id, entity));
    }

    /**
     * 删除题目
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        questionBankService.delete(id);
        return Result.success("题目已删除", null);
    }

    /**
     * 知识点树
     */
    @GetMapping("/knowledge-tree")
    public Result<List<KnowledgePoint>> knowledgeTree(@RequestParam Long courseId) {
        return Result.success(questionBankService.getKnowledgeTree(courseId));
    }
}
