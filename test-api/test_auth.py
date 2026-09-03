"""
认证 API 测试 (5 条用例)

接口:
  POST /api/auth/login           - 登录
  POST /api/auth/logout          - 登出
  PUT  /api/auth/change-password - 修改密码

前提: 后端已启动，数据库有可登录账号
"""

import pytest
from conftest import (
    check_response, check_error_response, check_http_status,
    login, auth_headers,
    ADMIN_USER, ADMIN_PASS, BASE_URL
)


class TestLogin:
    """登录功能"""

    def test_login_success(self, session, base_url):
        """AT-01: 正确凭据应返回 token + 用户信息"""
        resp = session.post(f"{base_url}/api/auth/login", json={
            "username": ADMIN_USER,
            "password": ADMIN_PASS
        })
        data = check_response(resp)

        assert "token" in data, f"应包含 token，实际 keys: {list(data.keys())}"
        assert len(data["token"]) > 0, "token 不应为空"
        assert "role" in data, f"应包含 role，实际 keys: {list(data.keys())}"
        assert "displayName" in data

    def test_login_wrong_password(self, session, base_url):
        """AT-02: 错误密码应返回 401"""
        resp = session.post(f"{base_url}/api/auth/login", json={
            "username": ADMIN_USER,
            "password": "wrong_password_xyz"
        })
        # 可能返回 HTTP 200 + 业务码 401，也可能直接 HTTP 401
        data = resp.json()
        assert data["code"] != 200, f"错误密码应登录失败，实际 code={data['code']}"

    def test_login_empty_username(self, session, base_url):
        """AT-03: 空用户名应被参数校验拦截"""
        resp = session.post(f"{base_url}/api/auth/login", json={
            "username": "",
            "password": "123456"
        })
        data = resp.json()
        assert data["code"] != 200, f"空用户名应失败，实际 code={data['code']}"

    def test_unauthorized_no_token(self, session, base_url):
        """AT-04: 不带 token 访问受保护接口应被拦截"""
        resp = session.get(f"{base_url}/api/admin/teachers")
        data = resp.json()
        # 应返回 401（未认证）
        assert data["code"] == 401, (
            f"无 token 应返回 401，实际 code={data['code']}，message={data.get('message')}"
        )

    def test_invalid_token(self, session, base_url):
        """AT-05: 伪造 token 应被拦截"""
        resp = session.get(
            f"{base_url}/api/admin/teachers",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        data = resp.json()
        assert data["code"] == 401, (
            f"无效 token 应返回 401，实际 code={data['code']}，message={data.get('message')}"
        )


class TestChangePassword:
    """修改密码（需要登录）"""

    def test_change_password_auth_required(self, session, base_url):
        """AT-06: 未登录修改密码应被拦截"""
        resp = session.put(f"{base_url}/api/auth/change-password", json={
            "oldPassword": "old",
            "newPassword": "new123456"
        })
        data = resp.json()
        # 需要认证，应返回 401
        assert data["code"] != 200, f"未登录应失败，实际 code={data['code']}"
