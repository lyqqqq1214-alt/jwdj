"""
教师管理 API 测试 (7 条用例)

接口:
  GET    /api/admin/teachers                - 分页查询
  GET    /api/admin/teachers/{id}           - 查询单个
  POST   /api/admin/teachers                - 创建
  PUT    /api/admin/teachers/{id}           - 更新
  DELETE /api/admin/teachers/{id}           - 删除
  PUT    /api/admin/teachers/{id}/status     - 启用/禁用
  PUT    /api/admin/teachers/{id}/reset-password - 重置密码

前提: 需要 ADMIN 角色登录
"""

import pytest
from conftest import check_response, check_error_response, auth_headers


class TestTeacherCRUD:
    """教师 CRUD 完整流程"""

    created_ids = []  # 记录创建的教师ID，用于清理

    @pytest.fixture(autouse=True)
    def setup(self, session, base_url, admin_token):
        """注入依赖"""
        self.session = session
        self.base_url = base_url
        self.headers = auth_headers(admin_token)

    # ── 分页查询 ──────────────────────────────────────
    def test_page_teachers(self):
        """TE-01: 分页查询教师列表 → 返回 records + total"""
        resp = self.session.get(
            f"{self.base_url}/api/admin/teachers",
            params={"pageNum": 1, "pageSize": 10},
            headers=self.headers
        )
        data = check_response(resp)

        assert "records" in data, f"应包含 records，实际 keys: {list(data.keys())}"
        assert "total" in data

    def test_page_with_keyword(self):
        """TE-02: 按关键词搜索教师"""
        resp = self.session.get(
            f"{self.base_url}/api/admin/teachers",
            params={"pageNum": 1, "pageSize": 10, "keyword": "张"},
            headers=self.headers
        )
        data = check_response(resp)
        assert "records" in data

    # ── 创建 ──────────────────────────────────────────
    def test_create_teacher(self):
        """TE-03: 创建教师 → 返回完整信息含 userId"""
        resp = self.session.post(
            f"{self.base_url}/api/admin/teachers",
            json={
                "teacherNo": f"PY{_timestamp()}",
                "name": "Pytest测试教师",
                "gender": "男",
                "college": "计算机学院",
                "title": "讲师",
                "password": "test123456"
            },
            headers=self.headers
        )
        data = check_response(resp)

        assert data["teacherNo"].startswith("PY"), f"工号不匹配: {data}"
        assert "userId" in data, f"应包含 userId: {data}"
        TestTeacherCRUD.created_ids.append(data["id"])

    def test_create_duplicate_teacher_no(self):
        """TE-04: 重复工号 → 应返回 400"""
        # 先创建第一个
        teacher_no = f"PY{_timestamp()}"
        resp = self.session.post(
            f"{self.base_url}/api/admin/teachers",
            json={
                "teacherNo": teacher_no,
                "name": "第一个",
                "password": "123456"
            },
            headers=self.headers
        )
        data = check_response(resp)
        TestTeacherCRUD.created_ids.append(data["id"])

        # 再创建同工号
        resp2 = self.session.post(
            f"{self.base_url}/api/admin/teachers",
            json={
                "teacherNo": teacher_no,
                "name": "第二个（重复）",
                "password": "123456"
            },
            headers=self.headers
        )
        check_error_response(resp2, 400)

    # ── 查询单个 ──────────────────────────────────────
    def test_get_teacher_by_id(self):
        """TE-05: 根据 ID 查询教师详情"""
        # 需要已有教师 → 用第一个创建的或已存在的
        cid = _first_created_or(
            self.session, self.base_url, self.headers, TestTeacherCRUD.created_ids
        )
        if cid is None:
            pytest.skip("没有可用的教师 ID")
        resp = self.session.get(
            f"{self.base_url}/api/admin/teachers/{cid}",
            headers=self.headers
        )
        data = check_response(resp)
        assert "teacherNo" in data

    # ── 更新 ──────────────────────────────────────────
    def test_update_teacher(self):
        """TE-06: 更新教师信息"""
        cid = _first_created_or(
            self.session, self.base_url, self.headers, TestTeacherCRUD.created_ids
        )
        if cid is None:
            pytest.skip("没有可用的教师 ID")
        resp = self.session.put(
            f"{self.base_url}/api/admin/teachers/{cid}",
            json={"name": "已更新姓名", "title": "副教授", "college": "信息学院"},
            headers=self.headers
        )
        data = check_response(resp)
        assert data["name"] == "已更新姓名"

    # ── 状态切换 ──────────────────────────────────────
    def test_toggle_status(self):
        """TE-07: 禁用后再启用教师账号"""
        cid = _first_created_or(
            self.session, self.base_url, self.headers, TestTeacherCRUD.created_ids
        )
        if cid is None:
            pytest.skip("没有可用的教师 ID")

        # 禁用
        resp = self.session.put(
            f"{self.base_url}/api/admin/teachers/{cid}/status",
            json={"status": "DISABLED"},
            headers=self.headers
        )
        check_response(resp)

        # 重新启用
        resp2 = self.session.put(
            f"{self.base_url}/api/admin/teachers/{cid}/status",
            json={"status": "ACTIVE"},
            headers=self.headers
        )
        check_response(resp2)

    # ── 重置密码 ──────────────────────────────────────
    def test_reset_password(self):
        """TE-08: 重置教师密码 → 返回新密码"""
        cid = _first_created_or(
            self.session, self.base_url, self.headers, TestTeacherCRUD.created_ids
        )
        if cid is None:
            pytest.skip("没有可用的教师 ID")
        resp = self.session.put(
            f"{self.base_url}/api/admin/teachers/{cid}/reset-password",
            headers=self.headers
        )
        data = check_response(resp)
        assert "newPassword" in data or isinstance(data, str), (
            f"应返回新密码: {data}"
        )

    # ── 清理 ──────────────────────────────────────────
    def test_delete_created_teachers(self):
        """清理：删除本次测试创建的所有教师"""
        # 这个测试放在最后，pytest 默认按方法名排序执行
        for tid in TestTeacherCRUD.created_ids:
            resp = self.session.delete(
                f"{self.base_url}/api/admin/teachers/{tid}",
                headers=self.headers
            )
            # 不强制断言——可能已删除或不存在
            if resp.status_code == 200:
                data = resp.json()
                assert data["code"] == 200, f"删除教师 {tid} 失败: {data}"


# ── 工具函数 ────────────────────────────────────────────
import time

def _timestamp():
    """短时间戳用于生成唯一工号"""
    return str(int(time.time() * 1000))[-8:]


def _first_created_or(session, base_url, headers, created_ids):
    """返回第一个可用的教师 ID：优先已创建的，否则查列表取第一个"""
    if created_ids:
        return created_ids[0]
    # 查列表
    resp = session.get(
        f"{base_url}/api/admin/teachers",
        params={"pageNum": 1, "pageSize": 1},
        headers=headers
    )
    if resp.status_code != 200:
        return None
    data = resp.json()
    if data.get("code") != 200:
        return None
    records = data["data"].get("records", [])
    return records[0]["id"] if records else None
