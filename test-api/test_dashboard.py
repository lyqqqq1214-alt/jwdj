"""
仪表盘 API 测试 (5 条用例)

接口:
  GET /api/dashboard           - 完整仪表盘数据
  GET /api/dashboard/overview  - 概览统计卡片
  GET /api/dashboard/charts    - 图表数据
  GET /api/dashboard/warnings  - 预警学生列表
  GET /api/dashboard/courses   - 教师可选课程

前提: 需要 TEACHER 角色登录，且有至少一门课程
"""

import pytest
from conftest import check_response, auth_headers


class TestDashboard:
    """仪表盘查询"""

    @pytest.fixture(autouse=True)
    def setup(self, session, base_url, teacher_token):
        self.session = session
        self.base_url = base_url
        self.headers = auth_headers(teacher_token)

        # 取第一个可用课程
        resp = session.get(
            f"{base_url}/api/dashboard/courses",
            headers=self.headers
        )
        if resp.status_code == 200 and resp.json().get("code") == 200:
            courses = resp.json()["data"]
            self.course_id = courses[0]["id"] if courses else None
        else:
            self.course_id = None

    def test_get_courses(self):
        """DB-01: 获取我的课程列表 → 返回数组"""
        resp = self.session.get(
            f"{self.base_url}/api/dashboard/courses",
            headers=self.headers
        )
        data = check_response(resp)
        assert isinstance(data, list), f"应返回数组: {type(data)}"
        # 每个课程应有基本字段
        if data:
            course = data[0]
            assert "id" in course
            assert "courseName" in course

    def test_get_overview(self):
        """DB-02: 获取概览统计 → 返回各项指标"""
        if self.course_id is None:
            pytest.skip("没有可用的课程，请先导入课程数据")

        resp = self.session.get(
            f"{self.base_url}/api/dashboard/overview",
            params={"courseId": self.course_id},
            headers=self.headers
        )
        data = check_response(resp)

        assert "studentCount" in data, f"应含 studentCount: {list(data.keys())}"
        # averageScore / attendanceRate 可能为空，但结构应正确

    def test_get_charts(self):
        """DB-03: 获取图表数据 → 返回各维度的图表"""
        if self.course_id is None:
            pytest.skip("没有可用的课程")

        resp = self.session.get(
            f"{self.base_url}/api/dashboard/charts",
            params={"courseId": self.course_id},
            headers=self.headers
        )
        data = check_response(resp)

        # 应有图表数据（可能为空数组）
        for key in ["scoreDistribution", "scoreTrend", "attendanceStats"]:
            assert key in data, f"charts 应包含 {key}: {list(data.keys())}"

    def test_get_warnings(self):
        """DB-04: 获取预警列表 → 返回数组"""
        if self.course_id is None:
            pytest.skip("没有可用的课程")

        resp = self.session.get(
            f"{self.base_url}/api/dashboard/warnings",
            params={"courseId": self.course_id},
            headers=self.headers
        )
        data = check_response(resp)
        assert isinstance(data, list), f"warnings 应返回数组: {type(data)}"

    def test_get_full_dashboard(self):
        """DB-05: 获取完整仪表盘 → 包含 overview + charts + warnings"""
        if self.course_id is None:
            pytest.skip("没有可用的课程")

        resp = self.session.get(
            f"{self.base_url}/api/dashboard",
            params={"courseId": self.course_id},
            headers=self.headers
        )
        data = check_response(resp)

        assert "overview" in data, f"应含 overview: {list(data.keys())}"
        assert "charts" in data, f"应含 charts: {list(data.keys())}"
        assert "warnings" in data, f"应含 warnings: {list(data.keys())}"
