# AITAES API 自动化测试

基于 **pytest + requests** 的接口端到端回归测试。

## 快速开始

```bash
# 1. 创建虚拟环境（只需一次）
python -m venv venv

# 2. 激活虚拟环境并安装依赖（只需一次）
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux
pip install pytest requests

# 3. 确保后端已启动（Spring Boot 监听 localhost:8080）
cd ..
./mvnw spring-boot:run

# 4. 回到 test-api 目录运行测试
cd test-api
pytest -v

# 5. 指定后端地址
AITAES_BASE_URL=http://192.168.1.100:8080 pytest -v

# 6. 只跑某个模块
pytest test_auth.py -v

# 7. 用完退出虚拟环境
deactivate
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `AITAES_BASE_URL` | `http://localhost:8080` | 后端地址 |
| `AITAES_ADMIN_USER` | `admin` | 管理员账号 |
| `AITAES_ADMIN_PASS` | `123456` | 管理员密码 |
| `AITAES_TEACHER_USER` | `T001` | 教师账号 |
| `AITAES_TEACHER_PASS` | `123456` | 教师密码 |
| `AITAES_STUDENT_USER` | `201826010102` | 学生账号 |
| `AITAES_STUDENT_PASS` | `123456` | 学生密码 |

示例：
```bash
# Windows PowerShell
$env:AITAES_ADMIN_USER="myadmin"
$env:AITAES_ADMIN_PASS="mypass"
pytest -v

# macOS / Linux
AITAES_ADMIN_USER=myadmin AITAES_ADMIN_PASS=mypass pytest -v
```

## 前提条件

- 后端已启动（`./mvnw spring-boot:run`）
- MySQL 数据库已配置
- 至少有一个管理员账号可登录（通过环境变量配置凭据）
- 仪表盘/画像/考试测试需要有课程和学生数据（可通过导入功能预先导入）

## 文件说明

```
test-api/
├── conftest.py          # 公共 fixtures: 登录、鉴权、断言工具
├── pytest.ini           # pytest 配置
├── test_auth.py         # 认证: 登录/登出/修改密码/鉴权拦截 (6 tests)
├── test_teacher.py      # 教师管理: CRUD/状态切换/重置密码 (8 tests)
├── test_class.py        # 班级管理: CRUD/学生增删/越权校验 (7 tests)
├── test_dashboard.py    # 仪表盘: 概览/图表/预警/课程切换 (5 tests)
├── test_exam.py         # 考试: 试卷→发布→交卷→结果 (7 tests)
├── test_notification.py # 通知: 发送/列表/未读数/已读标记 (5 tests)
├── test_teaching.py     # 画像+题库: 学生画像/知识点树/题目CRUD (6 tests)
├── test_datasource.py   # 数据源 CRUD (6 tests)
├── test_import.py       # 数据导入 (5 tests)
└── README.md
```

## 测试用例统计

| 模块 | 用例数 | 说明 |
|------|:---:|------|
| Auth | 6 | 登录成功/失败/空参数/未认证拦截/无效token/修改密码 |
| Teacher | 8 | 分页查询/关键词搜索/创建/重复工号拒绝/详情/更新/状态切换/重置密码 |
| Class | 7 | 列表/空列表/创建/字段校验/更新/学生列表/添加移除学生 |
| Dashboard | 5 | 课程列表/概览统计/图表数据/预警列表/完整仪表盘 |
| Exam | 7 | 试卷列表/创建/详情/发布/学生待考/交卷/结果统计 |
| Notification | 5 | 发送/课程通知/我的列表/未读数/标记已读+全部已读 |
| Teaching | 6 | 学生画像/重点关注切换/题库列表/筛选/创建题目/知识点树 |
| DataSource | 6 | 完整 CRUD 流程 |
| Import | 5 | 三种导入 + 异常 |
| **合计** | **55** | |
