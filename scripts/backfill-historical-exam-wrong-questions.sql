-- 将历史考试中的错题补录到错题本。
-- 覆盖：客观题答错；简答题/综合题已批阅且得分低于满分。
-- 已有相同学生、课程、题目来源的错题不会重复插入。

INSERT INTO t_student_wrong_question (
    student_id, course_id, question_content, student_answer, correct_answer,
    knowledge_points, analysis, wrong_count, source, source_id, create_time, update_time, deleted
)
SELECT
    ea.student_id,
    ep.course_id,
    qb.content,
    ea.student_answer,
    ea.correct_answer,
    qb.knowledge_points,
    NULL,
    1,
    'ASSESSMENT',
    ea.question_id,
    COALESCE(ea.create_time, NOW()),
    NOW(),
    0
FROM t_exam_answer ea
JOIN t_exam_paper ep ON ep.id = ea.paper_id
JOIN t_question_bank qb ON qb.id = ea.question_id
WHERE (
        (ea.question_type IN ('SINGLE', 'MULTI', 'FILL', 'TRUE_FALSE')
         AND ea.is_correct = 0)
        OR
        (ea.question_type IN ('SHORT', 'COMPREHENSIVE')
         AND ea.graded = 1
         AND ea.score < ea.max_score)
      )
  AND NOT EXISTS (
      SELECT 1
      FROM t_student_wrong_question existing
      WHERE existing.student_id = ea.student_id
        AND existing.course_id = ep.course_id
        AND existing.source = 'ASSESSMENT'
        AND existing.source_id = ea.question_id
        AND existing.deleted = 0
  );
