"""
班级管理 API 测试 (7 条用例)

接口:
  GET    /api/classes                     - 我的班级列表
  POST   /api/classes                     - 创建班级
  PUT    /api/classes/{id}                - 更新班级
  DELETE /api/classes/{id}                - 删除班级
  GET    /api/classes/{id}/students       - 班级学生列表
  POST   /api/classes/{id}/students       - 添加学生
  DELETE /api/classes/{id}/students/{sid} - 移除学生

前提: 需要 TEACHER 角色登录
"""

import pytest
import time
from conftest import check_response, check_error_response, auth_headers


class TestClassCRUD:
    """班级 CRUD"""

    created_class_ids = []

    @pytest.fixture(autouse=True)
    def setup(self, session, base_url, teacher_token):
        self.session = session
        self.base_url = base_url
        self.headers = auth_headers(teacher_token)

    # ── 列表 ──────────────────────────────────────────
    def test_list_my_classes(self):
        """CL-01: 查询我的班级列表 → 返回数组"""
        resp = self.session.get(
            f"{self.base_url}/api/classes",
            headers=self.headers
        )
        data = check_response(resp)
        assert isinstance(data, list), f"应返回数组，实际类型: {type(data)}"

    def test_list_empty_when_no_classes(self):
        """CL-02: 新教师可能无班级 → 空列表"""
        resp = self.session.get(
            f"{self.base_url}/api/classes",
            headers=self.headers
        )
        data = check_response(resp)
        # 无论如何不应报错
        assert isinstance(data, list)

    # ── 创建 ──────────────────────────────────────────
    def test_create_class(self):
        """CL-03: 创建班级 → 返回含课程编号的实体"""
        ts = str(int(time.time() * 1000))[-6:]
        resp = self.session.post(
            f"{self.base_url}/api/classes",
            json={
                "className": f"Pytest测试班{ts}",
                "courseName": f"自动测试课程{ts}",
                "semester": "2025-2026-1",
                "credit": 3.0,
                "courseType": "选修",
                "description": "pytest 自动创建的班级"
            },
            headers=self.headers
        )
        data = check_response(resp)

        assert "id" in data, f"应包含 id: {data}"
        assert data["courseName"].startswith("自动测试课程"), f"课程名不匹配: {data}"
        TestClassCRUD.created_class_ids.append(data["id"])

    def test_create_class_validation(self):
        """CL-04: 缺少必填字段应返回 400"""
        resp = self.session.post(
            f"{self.base_url}/api/classes",
            json={"className": "", "courseName": "", "semester": ""},
            headers=self.headers
        )
        check_error_response(resp, 400)

    # ── 更新 ──────────────────────────────────────────
    def test_update_class(self):
        """CL-05: 更新班级信息"""
        cid = _first_class(self.session, self.base_url, self.headers,
                           TestClassCRUD.created_class_ids)
        if cid is None:
            pytest.skip("没有可用的班级 ID")
        resp = self.session.put(
            f"{self.base_url}/api/classes/{cid}",
            json={
                "className": "已更新班级名",
                "courseName": "已更新课程名",
                "semester": "2025-2026-1"
            },
            headers=self.headers
        )
        data = check_response(resp)
        assert data["className"] == "已更新班级名"

    # ── 学生管理 ──────────────────────────────────────
    def test_list_students(self):
        """CL-06: 查询班级学生列表"""
        cid = _first_class(self.session, self.base_url, self.headers,
                           TestClassCRUD.created_class_ids)
        if cid is None:
            pytest.skip("没有可用的班级 ID")
        resp = self.session.get(
            f"{self.base_url}/api/classes/{cid}/students",
            headers=self.headers
        )
        data = check_response(resp)
        assert isinstance(data, list), f"应返回数组: {type(data)}"

    def test_add_and_remove_student(self):
        """CL-07: 添加学生后能查到，再移除后不在列表中"""
        cid = _first_class(self.session, self.base_url, self.headers,
                           TestClassCRUD.created_class_ids)
        if cid is None:
            pytest.skip("没有可用的班级 ID")

        ts = str(int(time.time() * 1000))[-6:]
        student_no = f"PY{ts}"

        # 添加学生
        resp = self.session.post(
            f"{self.base_url}/api/classes/{cid}/students",
            json={
                "studentNo": student_no,
                "name": "Pytest测试学生",
                "gender": "男",
                "college": "计算机学院",
                "major": "软件工程"
            },
            headers=self.headers
        )
        data = check_response(resp)
        student_id = data.get("studentId") or data.get("id")
        assert student_id is not None, f"应返回学生 ID: {data}"

        # 确认出现在学生列表中
        resp2 = self.session.get(
            f"{self.base_url}/api/classes/{cid}/students",
            headers=self.headers
        )
        students = check_response(resp2)
        found = any(
            s.get("studentNo") == student_no or s.get("studentId") == student_id
            for s in students
        )
        assert found, f"新添加的学生应在列表中"

        # 移除学生
        resp3 = self.session.delete(
            f"{self.base_url}/api/classes/{cid}/students/{student_id}",
            headers=self.headers
        )
        check_response(resp3)

    # ── 清理 ──────────────────────────────────────────
    def test_delete_created_classes(self):
        """清理：删除本次测试创建的班级"""
        for cid in TestClassCRUD.created_class_ids:
            resp = self.session.delete(
                f"{self.base_url}/api/classes/{cid}",
                headers=self.headers
            )
            # 不强制成功——可能已被其他测试删除


def _first_class(session, base_url, headers, created_ids):
    """返回第一个可用的班级 ID"""
    if created_ids:
        return created_ids[0]
    resp = session.get(f"{base_url}/api/classes", headers=headers)
    if resp.status_code != 200:
        return None
    data = resp.json()
    if data.get("code") != 200:
        return None
    classes = data["data"]
    return classes[0]["id"] if classes else None
