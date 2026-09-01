package com.example.aitaes.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.aitaes.entity.ExamPaperQuestion;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ExamPaperQuestionMapper extends BaseMapper<ExamPaperQuestion> {

    /**
     * 物理删除某试卷的全部题目关联。
     * <p>绕过全局逻辑删除（logic-delete-field: deleted），执行真实 DELETE，
     * 用于 updatePaper 的「先删后插」重建，避免 uk_paper_question 唯一键冲突。</p>
     */
    @Delete("DELETE FROM t_exam_paper_question WHERE paper_id = #{paperId}")
    int physicalDeleteByPaperId(@Param("paperId") Long paperId);
}
