"""
教学资源 API 测试 (6 条用例)

接口:
  GET  /api/portrait/student/{id}?courseId=    - 学生画像
  PUT  /api/portrait/student/{id}/focus         - 切换重点关注
  GET  /api/question-bank                       - 题库列表
  POST /api/question-bank                       - 创建题目
  GET  /api/question-bank/{id}                  - 题目详情
  GET  /api/question-bank/knowledge-tree        - 知识点树

前提: 需要 TEACHER 角色，有课程和学生数据
"""

import pytest
import time
from conftest import check_response, check_error_response, auth_headers


class TestPortrait:
    """学生画像"""

    @pytest.fixture(autouse=True)
    def setup(self, session, base_url, teacher_token):
        self.session = session
        self.base_url = base_url
        self.headers = auth_headers(teacher_token)

    def _get_course_and_student(self):
        """获取第一个有学生的课程"""
        resp = self.session.get(
            f"{self.base_url}/api/dashboard/courses",
            headers=self.headers
        )
        if resp.status_code != 200 or resp.json().get("code") != 200:
            return None, None
        courses = resp.json()["data"]
        if not courses:
            return None, None

        # 按 studentCount 降序优先，找到第一个有学生的课程
        courses.sort(key=lambda c: c.get("studentCount", 0), reverse=True)
        course_id = None
        for c in courses:
            if c.get("studentCount", 0) > 0:
                course_id = c["id"]
                break
        if course_id is None:
            return None, None

        # 取第一个学生
        resp2 = self.session.get(
            f"{self.base_url}/api/classes/{course_id}/students",
            headers=self.headers
        )
        if resp2.status_code != 200 or resp2.json().get("code") != 200:
            return course_id, None
        students = resp2.json()["data"]
        student_id = students[0].get("studentId") or students[0].get("id") if students else None
        return course_id, student_id

    def test_get_student_profile(self):
        """PT-01: 获取学生画像 → 返回完整画像数据"""
        course_id, student_id = self._get_course_and_student()
        if course_id is None:
            pytest.skip("没有可用的课程")
        if student_id is None:
            pytest.skip("班级中没有学生，请先导入学生数据")

        resp = self.session.get(
            f"{self.base_url}/api/portrait/student/{student_id}",
            params={"courseId": course_id},
            headers=self.headers
        )
        data = check_response(resp)

        assert "studentNo" in data, f"应含 studentNo: {list(data.keys())}"
        assert "name" in data

        # 应有雷达数据（可能为空数组）
        assert "knowledgeRadar" in data, f"应含 knowledgeRadar: {list(data.keys())}"

    def test_toggle_focus(self):
        """PT-02: 切换重点关注标记"""
        course_id, student_id = self._get_course_and_student()
        if course_id is None or student_id is None:
            pytest.skip("没有可用的课程或学生")

        # 设为关注
        resp = self.session.put(
            f"{self.base_url}/api/portrait/student/{student_id}/focus",
            params={"courseId": course_id},
            json={"focus": True},
            headers=self.headers
        )
        check_response(resp)

        # 取消关注
        resp2 = self.session.put(
            f"{self.base_url}/api/portrait/student/{student_id}/focus",
            params={"courseId": course_id},
            json={"focus": False},
            headers=self.headers
        )
        check_response(resp2)


class TestQuestionBank:
    """题库管理"""

    created_question_id = None

    @pytest.fixture(autouse=True)
    def setup(self, session, base_url, teacher_token):
        self.session = session
        self.base_url = base_url
        self.headers = auth_headers(teacher_token)

    def _get_course_id(self):
        resp = self.session.get(
            f"{self.base_url}/api/dashboard/courses",
            headers=self.headers
        )
        if resp.status_code != 200 or resp.json().get("code") != 200:
            return None
        courses = resp.json()["data"]
        return courses[0]["id"] if courses else None

    def test_list_question_bank(self):
        """QB-01: 分页查询题库 → 返回 records + total"""
        resp = self.session.get(
            f"{self.base_url}/api/question-bank",
            params={"pageNum": 1, "pageSize": 10},
            headers=self.headers
        )
        data = check_response(resp)
        assert "records" in data
        assert "total" in data

    def test_list_with_filters(self):
        """QB-02: 按类型和难度筛选"""
        course_id = self._get_course_id()
        resp = self.session.get(
            f"{self.base_url}/api/question-bank",
            params={
                "pageNum": 1, "pageSize": 10,
                "courseId": course_id,
                "questionType": "SINGLE",
                "difficulty": "EASY"
            },
            headers=self.headers
        )
        data = check_response(resp)
        assert "records" in data

    def test_create_question(self):
        """QB-03: 创建题目 → 返回题目实体"""
        course_id = self._get_course_id()
        if course_id is None:
            pytest.skip("没有可用的课程")

        ts = str(int(time.time()))[-6:]
        resp = self.session.post(
            f"{self.base_url}/api/question-bank",
            json={
                "courseId": course_id,
                "questionType": "SINGLE",
                "difficulty": "EASY",
                "content": '{"stem":"Pytest测试题目","options":["A","B","C","D"],"answer":"A"}',
                "knowledgePoints": "测试知识点",
                "status": "DRAFT"
            },
            headers=self.headers
        )
        data = check_response(resp)
        assert "id" in data
        TestQuestionBank.created_question_id = data["id"]

    def test_get_knowledge_tree(self):
        """QB-04: 获取知识点树"""
        course_id = self._get_course_id()
        if course_id is None:
            pytest.skip("没有可用的课程")

        resp = self.session.get(
            f"{self.base_url}/api/question-bank/knowledge-tree",
            params={"courseId": course_id},
            headers=self.headers
        )
        data = check_response(resp)
        assert isinstance(data, list), f"知识点树应返回数组: {type(data)}"

    def test_delete_created_question(self):
        """清理：删除测试创建的题目"""
        qid = TestQuestionBank.created_question_id
        if qid is None:
            pytest.skip("没有创建题目")
        resp = self.session.delete(
            f"{self.base_url}/api/question-bank/{qid}",
            headers=self.headers
        )
        check_response(resp)
