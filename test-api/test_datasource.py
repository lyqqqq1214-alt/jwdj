"""
数据源管理 API 测试 (6 条用例)

接口:
  GET    /api/datasource         - 分页查询
  POST   /api/datasource         - 创建
  GET    /api/datasource/{id}    - 查询单个
  PUT    /api/datasource/{id}    - 更新
  DELETE /api/datasource/{id}    - 删除
  GET    /api/datasource/active  - 已激活列表
"""

import pytest
from conftest import check_response, check_error_response, auth_headers


class TestDataSourceCRUD:
    """数据源 CRUD"""

    created_id = None

    @pytest.fixture(autouse=True)
    def setup(self, session, base_url, admin_token):
        self.session = session
        self.base_url = base_url
        self.headers = auth_headers(admin_token)

    def test_page_query(self):
        """分页查询 → 返回 records + total"""
        resp = self.session.get(f"{self.base_url}/api/datasource",
                                params={"pageNum": 1, "pageSize": 10},
                                headers=self.headers)
        data = check_response(resp)
        assert "records" in data
        assert "total" in data

    def test_create(self):
        """创建数据源 → 返回带 ID 的实体"""
        resp = self.session.post(f"{self.base_url}/api/datasource", json={
            "sourceName": "pytest测试数据源",
            "sourceType": "EXCEL",
            "status": "ACTIVE"
        }, headers=self.headers)
        data = check_response(resp)
        assert "id" in data, f"创建后应包含 id，实际: {data}"
        TestDataSourceCRUD.created_id = data["id"]

    def test_get_by_id(self):
        """查询刚创建的 → 返回正确数据"""
        cid = TestDataSourceCRUD.created_id
        if cid is None:
            pytest.skip("创建未运行")
        resp = self.session.get(f"{self.base_url}/api/datasource/{cid}",
                                headers=self.headers)
        data = check_response(resp)
        assert data["sourceName"] == "pytest测试数据源"

    def test_update(self):
        """更新名称 → 返回修改后的实体"""
        cid = TestDataSourceCRUD.created_id
        if cid is None:
            pytest.skip("创建未运行")
        resp = self.session.put(f"{self.base_url}/api/datasource/{cid}", json={
            "sourceName": "pytest已更新"
        }, headers=self.headers)
        data = check_response(resp)
        assert data["sourceName"] == "pytest已更新"

    def test_delete(self):
        """删除数据源"""
        cid = TestDataSourceCRUD.created_id
        if cid is None:
            pytest.skip("创建未运行")
        resp = self.session.delete(f"{self.base_url}/api/datasource/{cid}",
                                   headers=self.headers)
        check_response(resp)

        # 再次查询应 404
        resp = self.session.get(f"{self.base_url}/api/datasource/{cid}",
                                headers=self.headers)
        check_error_response(resp, 404)

    def test_active_list(self):
        """激活列表 → 返回数组"""
        resp = self.session.get(f"{self.base_url}/api/datasource/active",
                                headers=self.headers)
        data = check_response(resp)
        assert isinstance(data, list), "active 应返回数组"
