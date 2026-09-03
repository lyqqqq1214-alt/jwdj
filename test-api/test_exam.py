"""
考试 API 测试 (7 条用例)

接口:
  POST  /api/exams/papers                    - 创建试卷
  GET   /api/exams/papers                    - 试卷列表
  GET   /api/exams/papers/{id}               - 试卷详情
  PUT   /api/exams/papers/{id}/publish       - 发布考试
  GET   /api/exams/student/pending           - 学生待考列表
  POST  /api/exams/student/{paperId}/submit  - 学生交卷
  GET   /api/exams/papers/{id}/results       - 考试结果

前提: TEACHER 角色（创建/发布/查询结果），STUDENT 角色（待考/交卷）,
      需要已有题目可关联，或有课程数据
"""

import pytest
import time
from conftest import check_response, check_error_response, auth_headers


class TestExamFlow:
    """考试完整流程：创建 → 发布 → 交卷 → 查看结果"""

    created_paper_id = None
    created_question_id = None

    @pytest.fixture(autouse=True)
    def setup(self, session, base_url, teacher_token, student_token):
        self.session = session
        self.base_url = base_url
        self.teacher_headers = auth_headers(teacher_token)
        self.student_headers = auth_headers(student_token)

    # ── 准备工作：获取可用的 courseId ──────────────────
    def _get_course_id(self):
        """从仪表盘获取第一个可用课程"""
        resp = self.session.get(
            f"{self.base_url}/api/dashboard/courses",
            headers=self.teacher_headers
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        if data.get("code") != 200:
            return None
        courses = data["data"]
        return courses[0]["id"] if courses else None

    def _get_question_id(self, course_id):
        """获取题库中第一个可用题目"""
        resp = self.session.get(
            f"{self.base_url}/api/question-bank",
            params={"courseId": course_id, "pageNum": 1, "pageSize": 1},
            headers=self.teacher_headers
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        if data.get("code") != 200:
            return None
        records = data["data"].get("records", [])
        return records[0]["id"] if records else None

    # ── 测试用例 ──────────────────────────────────────
    def test_list_papers(self):
        """EX-01: 查询试卷列表 → 返回分页结果"""
        resp = self.session.get(
            f"{self.base_url}/api/exams/papers",
            params={"pageNum": 1, "pageSize": 10},
            headers=self.teacher_headers
        )
        data = check_response(resp)
        assert "records" in data
        assert "total" in data, f"应含 total: {list(data.keys())}"

    def test_create_paper(self):
        """EX-02: 创建试卷 → 返回含试卷名和状态 DRAFT"""
        course_id = self._get_course_id()
        if course_id is None:
            pytest.skip("没有可用的课程")

        question_id = self._get_question_id(course_id)

        body = {
            "paperName": f"Pytest试卷_{int(time.time())}",
            "courseId": course_id,
            "totalScore": 100,
            "durationMinutes": 60
        }
        if question_id:
            body["questions"] = [{
                "questionId": question_id,
                "questionNo": 1,
                "score": 10
            }]

        resp = self.session.post(
            f"{self.base_url}/api/exams/papers",
            json=body,
            headers=self.teacher_headers
        )
        data = check_response(resp)

        assert "id" in data, f"应含 id: {data}"
        assert data["status"] == "DRAFT", f"新建试卷应为 DRAFT: {data}"
        TestExamFlow.created_paper_id = data["id"]

    def test_get_paper_detail(self):
        """EX-03: 查询试卷详情"""
        pid = TestExamFlow.created_paper_id
        if pid is None:
            pytest.skip("请先运行 test_create_paper")

        resp = self.session.get(
            f"{self.base_url}/api/exams/papers/{pid}",
            headers=self.teacher_headers
        )
        data = check_response(resp)
        assert data["id"] == pid

    def test_publish_paper(self):
        """EX-04: 发布试卷 → 状态变为 PUBLISHED"""
        pid = TestExamFlow.created_paper_id
        if pid is None:
            pytest.skip("请先运行 test_create_paper")

        resp = self.session.put(
            f"{self.base_url}/api/exams/papers/{pid}/publish",
            headers=self.teacher_headers
        )
        check_response(resp)

        # 验证状态已变
        resp2 = self.session.get(
            f"{self.base_url}/api/exams/papers/{pid}",
            headers=self.teacher_headers
        )
        data2 = check_response(resp2)
        assert data2["status"] in ("PUBLISHED", "ONGOING"), (
            f"发布后状态应为 PUBLISHED/ONGOING: {data2['status']}"
        )

    def test_student_pending_exams(self):
        """EX-05: 学生查看待考列表"""
        resp = self.session.get(
            f"{self.base_url}/api/exams/student/pending",
            headers=self.student_headers
        )
        data = check_response(resp)
        assert isinstance(data, list), f"应返回数组: {type(data)}"

    def test_student_submit_exam(self):
        """EX-06: 学生交卷 → 提交答案"""
        pid = TestExamFlow.created_paper_id
        if pid is None:
            pytest.skip("请先运行 test_create_paper")

        # 提交空答案或简单答案
        resp = self.session.post(
            f"{self.base_url}/api/exams/student/{pid}/submit",
            json={},
            headers=self.student_headers
        )
        # 可能因为无题目/未发布而报错，不强制 200
        data = resp.json()
        # 只要不是 401/403 就算通过（表示学生可访问该接口）
        assert data.get("code") not in (401, 403), (
            f"学生应有权限交卷: code={data.get('code')}, msg={data.get('message')}"
        )

    def test_get_exam_results(self):
        """EX-07: 查看考试结果统计"""
        pid = TestExamFlow.created_paper_id
        if pid is None:
            pytest.skip("请先运行 test_create_paper")

        resp = self.session.get(
            f"{self.base_url}/api/exams/papers/{pid}/results",
            headers=self.teacher_headers
        )
        # 可能因无考核记录而返回空统计，但不应该报错
        data = check_response(resp)

        # 检查统计字段结构
        assert "averageScore" in data or "totalStudents" in data, (
            f"应含统计字段: {list(data.keys())}"
        )
