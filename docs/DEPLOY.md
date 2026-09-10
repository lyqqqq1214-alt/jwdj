# AITAES 系统部署手册（云服务器 + CI/CD）

本文档手把手带你把这套系统部署到云端 Windows 服务器，并配好 GitHub Actions 自动部署。整套部署用到的脚本和配置都已放在仓库 `deploy/` 目录下，你只需照着操作即可。

> 目标：答辩当天，任意一台电脑打开浏览器访问 `http://125.221.160.8:3000`，即可使用系统全部功能。

---

## 1. 架构总览

| 组件 | 监听地址 | 是否对公网开放 |
|---|---|---|
| Nginx（静态页面 + 反向代理） | `0.0.0.0:3000` | ✅ 是 |
| Spring Boot 后端（jar） | `127.0.0.1:8080` | ❌ 仅本机 |
| MySQL 8 | `127.0.0.1:3306` | ❌ 仅本机 |
| Ollama（qwen2.5:7b） | `127.0.0.1:11434` | ❌ 仅本机 |

```
浏览器  →  http://125.221.160.8:3000  →  Nginx
                                          ├─ /        → 前端静态页 (frontend/dist)
                                          └─ /api/*   → 后端 127.0.0.1:8080
后端 8080  →  MySQL 3306（数据）
          →  Ollama 11434（AI）
```

---

## 2. 你需要准备的东西

- 云服务器：Windows 系统，IP `125.221.160.8`，远程桌面端口 `32002`，账号 `lyq` / `Password@123`，已开放端口 `3000–3100`。
- GitHub 账号：有仓库 `lyqqqq1214-alt/jwdj` 的读写权限。
- 本机：已装好 Git（用来推送代码）。

---

## 3. 第一步：远程登录服务器

在你自己电脑上，按 `Win + R` 输入 `mstsc` 回车：

- 计算机：`125.221.160.8:32002`
- 用户名：`lyq`
- 密码：`Password@123`

进入服务器桌面后，**以管理员身份打开 PowerShell**（开始菜单搜 PowerShell → 右键「以管理员身份运行」），后续命令都在里面执行。

---

## 4. 第二步：安装软件（一次性）

### 4.1 JDK 21（后端运行/构建需要）

1. 打开 https://adoptium.net/ ，下载 **Temurin 21** 的 Windows `.msi` 安装包。
2. 安装时勾选 **「Set JAVA_HOME variable」** 和 **「Add to PATH」**。
3. 装完后在 PowerShell 验证：
   ```powershell
   java -version
   # 应显示 openjdk version "21.0.x"
   where java
   # 记住这个 java.exe 的完整路径，后面填到 WinSW 配置里
   ```

### 4.2 Node.js 20（前端构建需要）

1. 打开 https://nodejs.org/ ，下载 **20.x LTS** 的 Windows `.msi`。
2. 一路默认安装（会自动加入 PATH）。
3. 验证：
   ```powershell
   node -v
   npm -v
   ```

### 4.3 MySQL 8（数据库）

1. 打开 https://dev.mysql.com/downloads/installer/ ，下载 **mysql-installer-community**，安装 **MySQL Server 8.x**。
2. 安装时设置 **root 密码为 `1234`**（与脚本默认一致）。
3. **把 MySQL 的 bin 目录加入系统 PATH**（安装器里有勾选项；若漏了，手动把 `C:\Program Files\MySQL\MySQL Server 8.0\bin` 加到系统环境变量 PATH）。
4. 验证：
   ```powershell
   mysql --version
   ```

### 4.4 Nginx（Web 服务器）

1. 打开 http://nginx.org/en/download.html ，下载 **Windows 版 zip**。
2. 解压到 `C:\aitaes\nginx`（保证 `C:\aitaes\nginx\nginx.exe` 存在）。
3. 把 `C:\aitaes\nginx` 加入系统 PATH（这样 `nginx` 命令和 CI 脚本都能用）。
4. 验证：
   ```powershell
   nginx -v
   ```

### 4.5 Ollama（本地大模型）

1. 打开 https://ollama.com/download/windows ，下载 Windows 安装包并安装。
2. 安装后会自动注册一个名为 `ollama` 的 Windows 服务并开机自启（默认监听 `127.0.0.1:11434`）。

### 4.6 WinSW（把 jar / nginx 注册成 Windows 服务）

1. 打开 https://github.com/winsw/winsw/releases ，下载 **`WinSW-x64.exe`**。
2. 把它放到 `C:\aitaes\winsw\WinSW-x64.exe`。

---

## 5. 第三步：初始化数据库

把整个仓库代码先下载到服务器（如果你还没在服务器上 clone）：

```powershell
cd C:\aitaes
git clone https://github.com/lyqqqq1214-alt/jwdj.git code
```

> 后面自托管 Runner 会自己再 clone 一份到它自己的工作目录，这里这份 `code` 只是用来跑初始化脚本。

然后运行初始化脚本（**先确认你已把 root 密码设为 1234，否则用 `-RootPassword` 指定**）：

```powershell
cd C:\aitaes\code
powershell -ExecutionPolicy Bypass -File .\deploy\setup-db.ps1 -DbPassword '你的数据库密码'
```

脚本会完成：建库 `aitaes_db` → 建专用账号 `aitaes`（只授该库权限）→ 建 28 张表 → 导入演示数据。

**记下你设置的数据库密码**，下一步要用。

---

## 6. 第四步：配置 Ollama 并拉取模型

```powershell
ollama pull qwen2.5:7b
```

> 模型约 4.7GB，耐心等待。服务器内存建议 ≥ 8GB（有独立显卡更好）。

验证连通性（能列出模型即成功）：

```powershell
curl http://127.0.0.1:11434/v1/models
```

---

## 7. 第五步：配置 Nginx

1. 创建站点配置目录并放入配置：
   ```powershell
   New-Item -ItemType Directory -Force -Path C:\aitaes\nginx\conf\conf.d | Out-Null
   Copy-Item C:\aitaes\code\deploy\nginx\aitaes.conf C:\aitaes\nginx\conf\conf.d\aitaes.conf
   ```
2. 编辑 `C:\aitaes\nginx\conf\nginx.conf`，在 `http { ... }` 块内（比如最后一行 `}` 之前）加一行：
   ```nginx
   include conf.d/*.conf;
   ```
   同时可以把默认的 `server { listen 80; ... }` 整段注释掉（不注释也不影响，80 端口未对外开放）。
3. 启动 Nginx：
   ```powershell
   nginx
   ```
4. 测试访问（此时前端还没部署，会 404，但说明 Nginx 起来了）：
   ```powershell
   curl http://127.0.0.1:3000
   ```

---

## 8. 第六步：注册后端服务（开机自启）

1. 编辑 `C:\aitaes\code\deploy\winsw\aitaes-service.xml`，改两处：
   - `<executable>` 里的 java.exe 路径（第 4.1 步 `where java` 看到的结果）。
   - `SPRING_DATASOURCE_PASSWORD` 改成第 5 步设的数据库密码。
2. 注册并启动服务：
   ```powershell
   cd C:\aitaes\winsw
   .\WinSW-x64.exe install C:\aitaes\code\deploy\winsw\aitaes-service.xml
   .\WinSW-x64.exe start C:\aitaes\code\deploy\winsw\aitaes-service.xml
   ```
   > 服务名是 `AITAES`，启动类型默认「自动」。可在 `services.msc` 里确认。

3. 后端日志位置：`C:\aitaes\winsw\AITAES.out.log`、`AITAES.err.log`。

---

## 9. 第七步：安装 GitHub 自托管 Runner（CI/CD 核心）

1. 浏览器打开仓库 → **Settings → Actions → Runners → New self-hosted runner**，操作系统选 **Windows**。
2. 在服务器管理员 PowerShell 里，**照着页面给出的命令**一条条执行（下载 runner 压缩包 → 解压 → `config.cmd` 配置，配置时 runner 名称随意，标签保持默认，它自带 `self-hosted` + `windows`）。
3. 配置完把它装成服务（页面最后有 `svc.cmd` 相关命令）：
   ```powershell
   .\svc.cmd install
   .\svc.cmd start
   ```
   > Runner 服务需要有管理员权限（要能 `Stop-Service`/`Start-Service` 和写 `C:\aitaes` 目录）。
   > 如果后续部署报「拒绝访问」，把 Runner 服务改成 LocalSystem 运行：
   > ```powershell
   > sc.exe config "actions.runner.lyqqqq1214-alt-jwdj.服务器名" obj= LocalSystem
   > ```

装好后，仓库 Runners 页面会显示 `Idle`，表示就绪。

---

## 10. 第八步：推送代码触发部署

现在仓库里已经有我们准备好的工作流 `.github/workflows/deploy.yml`。在你**本机**上：

```bash
# 先确认 application.yml 已恢复成正常 YAML（不再是 PDF）
git status

git add .
git commit -m "deploy: 添加 CI/CD 部署流水线与生产配置"
git push origin develop
```

推送后，打开仓库 **Actions** 页，会看到 `Deploy to Windows Server` 正在运行：自动装依赖 → 构建前端 → 构建后端 → 部署到 Nginx / 重启后端服务。跑完变绿就部署完成了。

---

## 11. 验证（答辩前务必全部过一遍）

在服务器上：

```powershell
# 1) 三个服务都在运行且启动类型为「自动」
Get-Service AITAES, ollama, nginx

# 2) Ollama 连通
curl http://127.0.0.1:11434/v1/models

# 3) 后端健康（以登录接口为例，能返回 JSON 即可）
curl http://127.0.0.1:8080/api/auth/login
```

在浏览器打开 `http://125.221.160.8:3000`：

1. 用演示账号登录：`admin` / `123456`（教师账号 `T00001` / `123456`）。
2. 逐个点开管理员 / 教师 / 学生端页面，确认菜单、列表、图表正常。
3. **实测一个 AI 功能**（如「AI 辅助出题」或某次「AI 分析」），确认能返回结果（说明 Ollama 调用真正跑通，而不只是接口 200）。
4. **换一台电脑**（模拟答辩电脑）访问同一地址，确认端口可达、全功能可用。

---

## 12. 常见问题（FAQ）

- **部署后前端 404 / 一直转圈**：确认 Nginx 已 `nginx -s reload`，且 `frontend/dist` 里有 `index.html`；后端 jar 服务已启动、`C:\aitaes\winsw\AITAES.err.log` 无报错。
- **AI 功能一直超时或报错**：确认 Ollama 服务在跑、`qwen2.5:7b` 已 `ollama pull`；后端日志里 AI 报错可看 `AITAES.out.log`。
- **`npm ci` 失败**：把 workflow 里的 `npm ci` 改成 `npm install` 再 push。
- **Runner 一直 `Offline`**：服务器上运行 `run.cmd` 看报错；确认服务器能访问 github.com（出站 443）。
- **端口 3000 打不开**：确认 Windows 防火墙已放行 TCP 3000（云安全组已开 3000–3100，但 Windows 防火墙也要放行）。
- **数据库连不上**：确认 MySQL 服务在跑、专用账号密码与 `aitaes-service.xml` 里一致。

---

## 13. 安全注意

- 之前仓库里提交过一个 DeepSeek API key（已改用本地 Ollama 不再使用），**建议到 DeepSeek 控制台把它作废/轮换**，因为已进 git 历史。
- 生产数据库用专用账号 `aitaes`（不是 root），密码通过 WinSW 的 `<env>` 注入，不会明文进仓库。
- Ollama / MySQL / 后端 8080 都只监听 127.0.0.1，公网只暴露 Nginx 的 3000 端口。
