"""
通知 API 测试 (5 条用例)

接口:
  POST /api/notifications                - 发送通知
  GET  /api/notifications                - 我的通知列表
  GET  /api/notifications/unread-count   - 未读数量
  PUT  /api/notifications/{id}/read      - 标记已读
  PUT  /api/notifications/read-all       - 全部已读

前提: 需要已登录（TEACHER 发通知，STUDENT 收通知）
"""

import pytest
import time
from conftest import check_response, auth_headers


class TestNotification:
    """通知收发流程"""

    created_notification_id = None

    @pytest.fixture(autouse=True)
    def setup(self, session, base_url, teacher_token, student_token):
        self.session = session
        self.base_url = base_url
        self.teacher_headers = auth_headers(teacher_token)
        self.student_headers = auth_headers(student_token)

    def test_send_notification(self):
        """NT-01: 教师发送通知 → 返回通知实体"""
        ts = str(int(time.time()))[-6:]
        resp = self.session.post(
            f"{self.base_url}/api/notifications",
            json={
                "title": f"Pytest测试通知_{ts}",
                "content": "这是 pytest 自动化测试发送的通知",
                "recipientScope": "ALL"
            },
            headers=self.teacher_headers
        )
        data = check_response(resp)

        assert "id" in data, f"应包含 id: {data}"
        assert data["title"].startswith("Pytest测试通知"), f"标题不匹配: {data}"
        TestNotification.created_notification_id = data["id"]

    def test_send_course_notification(self):
        """NT-02: 发送课程范围通知"""
        # 先获取一个课程
        resp = self.session.get(
            f"{self.base_url}/api/dashboard/courses",
            headers=self.teacher_headers
        )
        courses = check_response(resp)
        course_id = courses[0]["id"] if courses else None

        ts = str(int(time.time()))[-6:]
        body = {
            "title": f"课程通知_{ts}",
            "content": "仅本课程可见",
            "recipientScope": "COURSE"
        }
        if course_id:
            body["courseId"] = course_id

        resp2 = self.session.post(
            f"{self.base_url}/api/notifications",
            json=body,
            headers=self.teacher_headers
        )
        check_response(resp2)

    def test_my_notifications(self):
        """NT-03: 学生查看自己的通知列表"""
        resp = self.session.get(
            f"{self.base_url}/api/notifications",
            params={"pageNum": 1, "pageSize": 10},
            headers=self.student_headers
        )
        data = check_response(resp)
        assert "records" in data, f"应含 records: {list(data.keys())}"
        assert "total" in data

    def test_unread_count(self):
        """NT-04: 查询未读通知数量"""
        resp = self.session.get(
            f"{self.base_url}/api/notifications/unread-count",
            headers=self.student_headers
        )
        data = check_response(resp)
        # 应返回一个数字
        assert isinstance(data, int), f"未读数应为整数，实际: {type(data)}: {data}"

    def test_mark_read_and_read_all(self):
        """NT-05: 标记已读 + 全部已读"""
        # 先获取通知列表
        resp = self.session.get(
            f"{self.base_url}/api/notifications",
            params={"pageNum": 1, "pageSize": 5},
            headers=self.student_headers
        )
        notifications = check_response(resp)

        records = notifications.get("records", [])
        if records:
            # 标记第一个为已读
            nid = records[0]["id"]
            resp2 = self.session.put(
                f"{self.base_url}/api/notifications/{nid}/read",
                headers=self.student_headers
            )
            check_response(resp2)

        # 全部已读
        resp3 = self.session.put(
            f"{self.base_url}/api/notifications/read-all",
            headers=self.student_headers
        )
        check_response(resp3)
