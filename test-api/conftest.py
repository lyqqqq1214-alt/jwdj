"""
AITAES API 自动化测试公共配置

启动后端后运行: cd test-api && pytest -v

环境变量:
  AITAES_BASE_URL      - 后端地址，默认 http://localhost:8080
  AITAES_ADMIN_USER    - 管理员账号，默认 admin
  AITAES_ADMIN_PASS    - 管理员密码，默认 123456
  AITAES_TEACHER_USER  - 教师账号，默认 T001
  AITAES_TEACHER_PASS  - 教师密码，默认 123456
  AITAES_STUDENT_USER  - 学生账号，默认 201826010102（刘颖）
  AITAES_STUDENT_PASS  - 学生密码，默认 123456
"""

import pytest
import requests
import os

# ── 基础配置 ────────────────────────────────────────────
BASE_URL = os.environ.get("AITAES_BASE_URL", "http://localhost:8080")

# 默认凭据（通过环境变量覆盖）
ADMIN_USER = os.environ.get("AITAES_ADMIN_USER", "admin")
ADMIN_PASS = os.environ.get("AITAES_ADMIN_PASS", "123456")
TEACHER_USER = os.environ.get("AITAES_TEACHER_USER", "T001")
TEACHER_PASS = os.environ.get("AITAES_TEACHER_PASS", "123456")
STUDENT_USER = os.environ.get("AITAES_STUDENT_USER", "201826010102")
STUDENT_PASS = os.environ.get("AITAES_STUDENT_PASS", "123456")


# ── 登录工具 ────────────────────────────────────────────
def login(session, base_url, username, password):
    """登录并返回 token，失败返回 None"""
    resp = session.post(f"{base_url}/api/auth/login", json={
        "username": username,
        "password": password
    })
    if resp.status_code != 200:
        return None
    data = resp.json()
    if data.get("code") != 200:
        return None
    return data["data"]["token"]


def auth_headers(token):
    """根据 token 构造 Authorization 头"""
    return {"Authorization": f"Bearer {token}"}


# ── Fixtures ────────────────────────────────────────────
@pytest.fixture(scope="session")
def base_url():
    """API 基础地址"""
    return BASE_URL


@pytest.fixture(scope="session")
def session():
    """复用 HTTP 连接"""
    s = requests.Session()
    yield s
    s.close()


@pytest.fixture(scope="session")
def admin_token(session, base_url):
    """管理员 JWT token（scope=session，整个测试复用）"""
    token = login(session, base_url, ADMIN_USER, ADMIN_PASS)
    if token is None:
        pytest.skip(
            f"管理员登录失败（{ADMIN_USER}）。"
            f"请检查后端是否启动，或设置 AITAES_ADMIN_USER / AITAES_ADMIN_PASS 环境变量"
        )
    return token


@pytest.fixture(scope="session")
def teacher_token(session, base_url):
    """教师 JWT token"""
    token = login(session, base_url, TEACHER_USER, TEACHER_PASS)
    if token is None:
        pytest.skip(
            f"教师登录失败（{TEACHER_USER}）。"
            f"请检查后端是否启动，或设置 AITAES_TEACHER_USER / AITAES_TEACHER_PASS 环境变量"
        )
    return token


@pytest.fixture(scope="session")
def student_token(session, base_url):
    """学生 JWT token"""
    token = login(session, base_url, STUDENT_USER, STUDENT_PASS)
    if token is None:
        pytest.skip(
            f"学生登录失败（{STUDENT_USER}）。"
            f"请检查后端是否启动，或设置 AITAES_STUDENT_USER / AITAES_STUDENT_PASS 环境变量"
        )
    return token


# ── 断言工具 ────────────────────────────────────────────
def check_response(resp, expected_code=200):
    """统一的成功响应断言 → 返回 data 字段"""
    assert resp.status_code == 200, f"HTTP {resp.status_code}: {resp.text[:300]}"
    data = resp.json()
    assert data["code"] == expected_code, (
        f"期望业务码 {expected_code}，实际 {data['code']}，"
        f"message={data.get('message')}"
    )
    return data["data"]


def check_error_response(resp, expected_code):
    """统一的错误响应断言 → 返回完整 JSON"""
    data = resp.json()
    assert data["code"] == expected_code, (
        f"期望业务码 {expected_code}，实际 {data['code']}，"
        f"message={data.get('message')}"
    )
    return data


def check_http_status(resp, expected_status):
    """检查 HTTP 状态码（用于 401/403 等非 200 响应）"""
    assert resp.status_code == expected_status, (
        f"期望 HTTP {expected_status}，实际 {resp.status_code}: {resp.text[:200]}"
    )
