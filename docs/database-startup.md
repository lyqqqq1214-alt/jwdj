# AITAES 数据库启动说明

本文档说明如何启动并初始化 AITAES 后端所需的数据库。

系统支持两条运行路线：

| 方式 | 数据库 | 适用场景 | 完整度 |
|------|--------|----------|--------|
| **方式一：MySQL** | MySQL 8.x | 生产 / 日常开发（默认） | ✅ 完整 27 张表，全功能 |
| **方式二：H2** | H2 内嵌（文件库） | 免安装快速预览 | ⚠️ 仅 3 张基础表，功能不全 |

默认激活的是 `mysql` profile（见 `src/main/resources/application.yml` 的 `spring.profiles.active`）。

> **重要提示**：MySQL 配置里 `sql.init.mode: never`，即后端**不会**在启动时自动建表，必须手动执行 `db/init.sql`。而后端启动时会由 `DataInitializer`（`CommandLineRunner`）自动补充演示账号和演示数据。

---

## 方式一：MySQL（推荐）

### 前置条件

- 本机已安装并启动 MySQL 8.x，默认端口 `3306`
- `mysql` 命令行客户端可用（Windows 安装 MySQL 后通常已加入 PATH）

### 一键初始化（推荐）

直接双击项目根目录的 `init-db.bat`（或在 Git Bash 中执行 `./init-db.bat`），脚本会依次自动完成：

1. 创建数据库 `aitaes_db`（如不存在）
2. 执行 `db/init.sql`（建表 + 预置账号）
3. 执行 `test-data/simulated_data.sql`（模拟业务数据）
4. 执行 `test-data/question_bank_seed.sql`（题库种子数据）
5. 执行 `test-data/enrich_data.sql`（数据补充，保证各表 10 条以上）

数据库账号密码集中在脚本顶部变量中，与 `application-mysql.yml` 一致（`root` / `1234`），如有不同请同步修改脚本。手动分步执行请继续往下看「步骤 1～3」。

### 步骤 1：创建数据库

```bash
mysql -u root -p1234 -e "CREATE DATABASE IF NOT EXISTS aitaes_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

> 账号密码默认 `root` / `1234`，与 `application-mysql.yml` 一致；若你的 MySQL 账号不同，请同步修改该配置文件。

### 步骤 2：执行建表脚本

```bash
mysql -u root -p1234 --default-character-set=utf8mb4 aitaes_db < src/main/resources/db/init.sql
```

该脚本会：

1. 删除并重建 **27 张表**（`t_user`、`t_teacher`、`t_student`、`t_course`、`t_question_bank`、`t_exam_paper` 等）
2. 预置基础数据：管理员/教师/助教账号、预警规则、系统参数配置

### 步骤 3（可选）：导入模拟业务数据与题库

> 依赖顺序：**必须先完成步骤 2**，因为这两份脚本依赖 `init.sql` 创建的表和预置账号。

```bash
# 模拟业务数据（课程、学生、知识点、作业/考试成绩、考勤、实验）
mysql -u root -p1234 --default-character-set=utf8mb4 aitaes_db < test-data/simulated_data.sql

# 题库种子数据（计算机网络 & 408 考研真题）
mysql -u root -p1234 --default-character-set=utf8mb4 aitaes_db < test-data/question_bank_seed.sql

# 数据补充（保证各表 10 条以上）
mysql -u root -p1234 --default-character-set=utf8mb4 aitaes_db < test-data/enrich_data.sql
```

两份脚本均使用 `INSERT IGNORE` / `ON DUPLICATE KEY UPDATE`，可重复执行；它们之间无相互依赖，可按需单独导入。

### 步骤 4：核对数据源配置

确认 `src/main/resources/application-mysql.yml` 中的账号密码与你的 MySQL 一致：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/aitaes_db?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
    username: root
    password: 1234
```

### 步骤 5：启动后端

```bash
./mvnw spring-boot:run
```

启动日志中若出现 `种子数据初始化完成`，说明 `DataInitializer` 已自动补全演示数据（2 门课程、2 名学生、成绩/考勤/实验/知识点掌握度等）。该初始化器对已存在的数据会跳过，可安全重复启动。

### 步骤 6：验证

- 后端默认监听 `8080`，访问健康检查或登录接口确认数据库连通正常。
- 用下方「登录账号表」中的账号登录验证。

---

## 方式二：H2（免安装 MySQL，仅部分功能）

切换为 `h2` profile 启动：

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=h2
```

- 数据文件为 `data/aitaes.mv.db`（文件库，`MODE=MySQL` 兼容模式）
- 建表脚本 `db/h2-schema.sql` 在启动时自动执行（`sql.init.mode: always`）
- H2 控制台：`http://localhost:8080/h2-console`，JDBC URL `jdbc:h2:file:./data/aitaes;MODE=MySQL`，账号 `sa`，密码为空

> ⚠️ **注意**：H2 脚本当前只包含 `t_user`、`t_teacher`、`t_student` 三张表，是旧版学生评价系统遗留的最小 schema，**不含**课程、成绩、题库、考试等 v3.0 业务表。因此 H2 仅适合快速预览登录与账号相关功能，完整功能请使用 MySQL。

---

## 登录账号表

> 密码列对应的是**实际生效**的登录密码。两处初始化来源的密码存在差异，请按你的启动方式对号入座。

### MySQL（执行了 init.sql）

`init.sql` 预置账号密码统一为 `123456`（BCrypt 哈希已校验）；`DataInitializer` 检测到账号已存在会跳过，故密码保持 `123456`。

| 账号 | 密码 | 角色 | 姓名 |
|------|------|------|------|
| `admin` | `123456` | ADMIN 系统管理员 | — |
| `T00001` | `123456` | TEACHER 教师 | 张建国 |
| `T00002` | `123456` | TEACHER 教师 | 李美玲 |
| `A00001` | `123456` | ASSISTANT 助教 | 陈明 |
| `A00002` | `123456` | ASSISTANT 助教 | 赵丽 |
| `A00003` | `123456` | ASSISTANT 助教 | 王磊 |
| `202426010101` | `123456` | STUDENT 学生 | 张伟（启动时由 DataInitializer 补充） |
| `202407010101` | `123456` | STUDENT 学生 | 李娜（启动时由 DataInitializer 补充） |

### H2 / 空库（未执行 init.sql，仅靠 DataInitializer）

| 账号 | 密码 | 角色 | 姓名 |
|------|------|------|------|
| `admin` | `admin123` | ADMIN 系统管理员 | — |
| `T00001` | `123456` | TEACHER 教师 | 张建国 |
| `T00002` | `123456` | TEACHER 教师 | 李美玲 |
| `202426010101` | `123456` | STUDENT 学生 | 张伟 |
| `202407010101` | `123456` | STUDENT 学生 | 李娜 |

> ⚠️ **已知不一致**：管理员 `admin` 的密码在 `init.sql` 中是 `123456`，而在 `DataInitializer` 中是 `admin123`。MySQL 流程（先跑 init.sql）下是 `123456`；H2 / 空库流程下是 `admin123`。若登录失败可尝试另一个。

---

## 常见问题

| 现象 | 原因 / 解决 |
|------|-------------|
| 启动报 `Unknown database 'aitaes_db'` | 未建库，执行「步骤 1」 |
| 启动报 `Access denied for user 'root'` | 密码/账号与 MySQL 不符，核对 `application-mysql.yml` |
| 启动报 `Table 'aitaes_db.t_xxx' doesn't exist` | 未执行 `init.sql`，补跑「步骤 2」 |
| 导入 SQL 时中文乱码 | 加 `--default-character-set=utf8mb4` 参数 |
| 端口 `3306` 未监听 | MySQL 服务未启动，先启动 MySQL |
| 端口 `8080` 被占用 | 修改 `application.yml` 的 `server.port` 或释放占用 |
| 导入 seed 脚本报外键错误 | 未先执行 `init.sql`，或导入顺序错误 |

---

## 相关文档

- 数据库设计：[database-design.md](database-design.md)
- API 文档：[api-documentation.md](api-documentation.md)
- 导入模板：[import-templates.md](import-templates.md)
