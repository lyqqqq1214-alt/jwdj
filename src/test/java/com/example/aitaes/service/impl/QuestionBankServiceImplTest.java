package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.entity.QuestionBank;
import com.example.aitaes.entity.KnowledgePoint;
import com.example.aitaes.entity.Teacher;
import com.example.aitaes.mapper.QuestionBankMapper;
import com.example.aitaes.mapper.KnowledgePointMapper;
import com.example.aitaes.mapper.TeacherMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("QuestionBankService 单元测试")
class QuestionBankServiceImplTest {

    @Mock private QuestionBankMapper questionBankMapper;
    @Mock private KnowledgePointMapper knowledgePointMapper;
    @Mock private TeacherMapper teacherMapper;
    @InjectMocks private QuestionBankServiceImpl questionBankService;

    private QuestionBank question;

    @BeforeEach
    void setUp() {
        question = new QuestionBank();
        question.setId(1L);
        question.setCourseId(1L);
        question.setTeacherId(1L);
        question.setQuestionType("SINGLE");
        question.setDifficulty("MEDIUM");
        question.setContent("{\"question\":\"1+1=?\",\"answer\":\"2\"}");
        question.setStatus("DRAFT");
    }

    @Nested
    @DisplayName("page — 分页查询")
    class PageQuery {

        @Test
        @DisplayName("QB-01: 无筛选条件时应返回全部")
        void shouldReturnAll_WhenNoFilters() {
            Page<QuestionBank> qPage = new Page<>(1, 10);
            qPage.setRecords(List.of(question));
            qPage.setTotal(1);
            when(questionBankMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(qPage);

            IPage<QuestionBank> result = questionBankService.page(1, 10, null, null, null, null);

            assertEquals(1, result.getTotal());
        }

        @Test
        @DisplayName("QB-02: 按题型和难度筛选")
        void shouldFilterByTypeAndDifficulty() {
            when(questionBankMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class)))
                    .thenReturn(new Page<>(1, 10));

            questionBankService.page(1, 10, 1L, "SINGLE", "HARD", "关键字");

            verify(questionBankMapper).selectPage(any(Page.class), any(LambdaQueryWrapper.class));
        }
    }

    @Nested
    @DisplayName("getById — 查询详情")
    class GetById {

        @Test
        @DisplayName("QB-03: 应返回题目详情")
        void shouldReturnQuestion() {
            when(questionBankMapper.selectById(1L)).thenReturn(question);
            assertEquals("SINGLE", questionBankService.getById(1L).getQuestionType());
        }

        @Test
        @DisplayName("QB-04: 不存在应抛出异常")
        void shouldThrowException_WhenNotFound() {
            when(questionBankMapper.selectById(999L)).thenReturn(null);
            assertThrows(BusinessException.class, () -> questionBankService.getById(999L));
        }
    }

    @Nested
    @DisplayName("create — 新增题目")
    class Create {

        @Test
        @DisplayName("QB-05: 应设置默认值并插入")
        void shouldSetDefaultsAndInsert() {
            QuestionBank newQ = new QuestionBank();
            newQ.setCourseId(1L);
            newQ.setQuestionType("MULTI");
            newQ.setContent("{}");

            Teacher teacher = new Teacher();
            teacher.setId(1L);
            teacher.setUserId(2L);
            when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(teacher);

            questionBankService.create(2L, newQ);

            assertEquals(1L, newQ.getTeacherId());
            assertEquals(0, newQ.getUsageCount());
            assertEquals("DRAFT", newQ.getStatus());
            verify(questionBankMapper).insert(newQ);
        }
    }

    @Nested
    @DisplayName("delete — 删除题目")
    class Delete {

        @Test
        @DisplayName("QB-06: 应成功删除")
        void shouldDelete() {
            when(questionBankMapper.selectById(1L)).thenReturn(question);
            questionBankService.delete(1L);
            verify(questionBankMapper).deleteById(1L);
        }
    }

    @Nested
    @DisplayName("getKnowledgeTree — 知识点树")
    class KnowledgeTree {

        @Test
        @DisplayName("QB-07: 应返回课程知识点列表")
        void shouldReturnKnowledgePoints() {
            KnowledgePoint kp = new KnowledgePoint();
            kp.setId(1L); kp.setKpName("数据结构");
            when(knowledgePointMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(kp));

            List<KnowledgePoint> result = questionBankService.getKnowledgeTree(1L);

            assertEquals(1, result.size());
            assertEquals("数据结构", result.get(0).getKpName());
        }
    }
}
