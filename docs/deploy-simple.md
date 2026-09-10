# AITAES 部署教程（简易版，一步一步照着做）

> 不需要懂 CI/CD。核心思路一句话：**自己电脑打包 → 复制到服务器 → 服务器跑一个脚本 → 完成。**
>
> 全部做完后，任何一台电脑打开浏览器访问 `http://125.221.160.8:3000` 就能用整套系统。
>
> **两条约定**（你的要求）：
> 1. 所有程序和文件都放在服务器 **`d:\lyq`** 目录下；
> 2. 装软件时能选「**仅为当前用户安装**」就选它（避免污染 C 盘、少要管理员权限）。

---

## 目录

1. [先了解整体流程](#一先了解整体流程)
2. [第 0 步：自己电脑打包](#二第-0-步自己电脑打包)
3. [第 1 步：远程登录服务器](#三第-1-步远程登录服务器)
4. [第 2 步：服务器上装 5 个软件](#四第-2-步服务器上装-5-个软件)
5. [第 3 步：把文件复制到服务器](#五第-3-步把文件复制到服务器)
6. [第 4 步：跑一键部署脚本](#六第-4-步跑一键部署脚本)
7. [第 5 步：拉取 AI 模型](#七第-5-步拉取-ai-模型)
8. [第 6 步：验证系统能正常用](#八第-6-步验证系统能正常用)
9. [以后更新代码怎么操作](#九以后更新代码怎么操作)
10. [常见问题](#十常见问题)

---

## 一、先了解整体流程

```
你自己的电脑(Windows，已装 JDK21 + Node)      云服务器(Windows，125.221.160.8)
─────────────────────────────────────       ─────────────────────────────────
1. 双击 build.bat 打包
   → 得到 jar + dist
                                            ← 远程桌面登录(mstsc)

2. 把 jar、dist、deploy 文件夹
   拖拽复制过去  ────────────────────────────►  放进 d:\lyq\ 下

                                            3. 跑 setup-server.ps1
                                               → 建库/导数据/配Nginx/注册服务
                                            4. ollama pull qwen2.5:7b

                                            5. 浏览器打开 125.221.160.8:3000 ✅
```

服务器上装的东西（都在 `d:\lyq` 下）：**JDK 21、MySQL 8、Nginx、Ollama、WinSW**。就这 5 样。

---

## 二、第 0 步：自己电脑打包

1. 打开项目文件夹 `d:\AITAES\AITAES`。
2. **双击运行 `build.bat`**。
3. 等它跑完（第一次要下载依赖，可能 5~10 分钟），看到 **`BUILD OK!`** 就成功。
4. 记下这两个产物位置：
   - 后端：`d:\AITAES\AITAES\target\AITAES-0.0.1-SNAPSHOT.jar`（**一个文件**）
   - 前端：`d:\AITAES\AITAES\frontend\dist`（**一个文件夹**）

> 如果双击报错，手动在命令行试：
> - 后端：`mvnw.cmd clean package -DskipTests`
> - 前端：`cd frontend` → `npm install` → `npm run build`

---

## 三、第 1 步：远程登录服务器

1. 自己电脑按 **`Win + R`**，输入 **`mstsc`**，回车。
2. **计算机**填 `125.221.160.8:32002`，点「连接」。
3. 用户名 `lyq`，密码 `Password@123`。
4. 进服务器桌面后，打开 **管理员 PowerShell**：开始菜单搜 `powershell` → 右键「以管理员身份运行」。

后面所有在服务器上的命令，都粘贴到这个 PowerShell 里执行。

---

## 四、第 2 步：服务器上装 5 个软件

> 全部装到 `d:\lyq` 下。**先建目录**（在管理员 PowerShell 里执行）：
> ```powershell
> New-Item -ItemType Directory -Force -Path d:\lyq\jdk, d:\lyq\nginx, d:\lyq\winsw, d:\lyq\backend, d:\lyq\frontend, d:\lyq\deploy | Out-Null
> ```

### 4.1 JDK 21（zip 版，绿色免安装，最省事）

1. 打开 https://adoptium.net/ → **Temurin 21** → 选 **Windows x64 的 `.zip` 包**（不要 `.msi`）。
2. 解压，把解压出来的那个文件夹**改名为 `jdk`**，整体放到 **`d:\lyq\jdk`**。
   - 确认存在文件 **`d:\lyq\jdk\bin\java.exe`**。
3. 不用装、不用设环境变量（脚本会自动找到它）。

### 4.2 Node.js —— 跳过（不用装）

我们是「本机打包、服务器只跑」，服务器**不需要 Node**。

### 4.3 MySQL 8（数据库）

1. 打开 https://dev.mysql.com/downloads/installer/ → 下载 **mysql-installer-community**，装 **MySQL Server 8.x**。
2. 安装时 **root 密码设为 `1234`**。
3. 安装向导里如果有「数据目录 / 安装路径」的选择，**尽量选到 D 盘 `d:\lyq` 下**；安装时会注册一个叫 `MySQL` 的 Windows 服务并开机自启（这正常，是我们需要的）。
4. 装完验证：
   ```powershell
   mysql --version
   ```
   如果提示「不是内部或外部命令」，说明 MySQL 的 bin 没进 PATH，手动把 `d:\lyq\...\MySQL Server 8.0\bin`（或 `C:\Program Files\MySQL\MySQL Server 8.0\bin`）加到系统环境变量 PATH。

### 4.4 Nginx（zip，绿色免安装）

1. 打开 http://nginx.org/en/download.html → 下载 **Windows 版 zip**。
2. 解压，把里面 `nginx-1.xx.x` 文件夹的**所有内容**放到 **`d:\lyq\nginx`**。
   - 确认存在 **`d:\lyq\nginx\nginx.exe`**。

### 4.5 Ollama（本地大模型）

1. 打开 https://ollama.com/download/windows → 下载安装。
2. 它默认就是「当前用户安装」，并自动注册一个叫 `ollama` 的 Windows 服务、开机自启（监听 127.0.0.1:11434），不用手动配置。
3. （可选，想省 C 盘空间）把模型放到 D 盘：设一个用户环境变量 `OLLAMA_MODELS=d:\lyq\ollama-models`，然后重启 `ollama` 服务。

### 4.6 WinSW（把 jar 注册成「开机自启」服务）

1. 打开 https://github.com/winsw/winsw/releases → 下载 **`WinSW-x64.exe`**。
2. 放到 **`d:\lyq\winsw\WinSW-x64.exe`**。

> 到这里 5 样装完了，下面开始「复制文件 + 一键部署」。

---

## 五、第 3 步：把文件复制到服务器

远程桌面（mstsc）支持**直接拖拽/复制粘贴文件**。从**你自己电脑**往远程桌面里拖下面 3 个东西，放到指定位置：

| 你本机的文件/文件夹 | 复制到服务器的位置 |
|---|---|
| `target\AITAES-0.0.1-SNAPSHOT.jar`（文件） | `d:\lyq\backend\` |
| `frontend\dist`（文件夹） | `d:\lyq\frontend\`（放进去后是 `d:\lyq\frontend\dist\`） |
| `deploy`（整个文件夹） | `d:\lyq\`（放进去后是 `d:\lyq\deploy\`） |

> 操作：本机找到文件 `Ctrl+C` 复制 → 远程桌面里打开对应文件夹 `Ctrl+V` 粘贴；或直接鼠标拖进远程桌面窗口。总共也就一百多 MB，很快。

复制完在**服务器 PowerShell**里检查（都应是 `True`）：

```powershell
Test-Path d:\lyq\backend\AITAES-0.0.1-SNAPSHOT.jar   # True
Test-Path d:\lyq\frontend\dist\index.html            # True
Test-Path d:\lyq\deploy\setup-server.ps1             # True
```

---

## 六、第 4 步：跑一键部署脚本

在**服务器管理员 PowerShell**里执行（把 `你的密码` 换成你要设的数据库密码，比如 `Aitaes@2026`）：

```powershell
powershell -ExecutionPolicy Bypass -File d:\lyq\deploy\setup-server.ps1 -DbPassword '你的密码'
```

脚本会自动完成：

1. 建库 `aitaes_db` + 建专用账号 `aitaes` + 建 28 张表 + 导入演示数据
2. 把 Nginx 配置好（监听 3000），原配置备份到 `nginx.conf.bak`
3. 把后端注册成 **`AITAES` 服务**（开机自启、崩溃自动重启）
4. 把 Nginx 注册成 **`nginx` 服务**（开机自启）

看到 **`DEPLOY DONE!`** 就成功。

> 密码别用带 `& < >` 这种特殊符号的，用「字母+数字」最稳妥。

---

## 七、第 5 步：拉取 AI 模型

服务器 PowerShell 里执行（模型约 4.7GB，耐心等下载完）：

```powershell
ollama pull qwen2.5:7b
```

验证连通（能列出模型即成功）：

```powershell
curl http://127.0.0.1:11434/v1/models
```

---

## 八、第 6 步：验证系统能正常用

### 8.1 看三个服务都在运行

```powershell
Get-Service AITAES, ollama, nginx
```

三行的 `Status` 都应是 `Running`，`StartType` 都应是 `Automatic`。

### 8.2 看后端有没有正常起来

```powershell
curl http://127.0.0.1:8080/api/auth/login
```

能返回一段 JSON（哪怕提示参数不对）就说明后端在跑。没反应就看日志：

```powershell
Get-Content d:\lyq\winsw\AITAES.err.log -Tail 50
```

### 8.3 浏览器打开系统

先在**服务器自己的浏览器**试 `http://127.0.0.1:3000`，能出登录页即可。

然后**换答辩用的那台电脑**（或手机）打开：

```
http://125.221.160.8:3000
```

1. 登录：**`admin` / `123456`**（教师账号 `T00001` / `123456`）
2. 逐个点开管理员 / 教师 / 学生端页面，确认菜单、列表、图表正常
3. **一定实测一个 AI 功能**（如「AI 辅助出题」或「AI 分析」），确认能返回结果——这一步验证 Ollama 真连通了，而不只是页面能打开

---

## 九、以后更新代码怎么操作

每次改完代码想更新线上，三步：

1. 本机双击 `build.bat` 重新打包。
2. 把新的 `jar` 和 `dist` 文件夹再次拖拽复制到服务器，覆盖原来的（`d:\lyq\backend\` 和 `d:\lyq\frontend\dist\`）。
3. 服务器 PowerShell 重启后端：
   ```powershell
   Restart-Service AITAES
   ```
   （前端不用重启，Nginx 直接读新的 dist。）

> 改数据库结构的话，还要在服务器上重跑一次第 6 节的部署脚本；只改代码/页面，上面三步就够。

---

## 十、常见问题

| 现象 | 解决办法 |
|---|---|
| 浏览器打不开 3000 端口 | 1) 确认 `Get-Service nginx` 在 Running；2) 确认 Windows 防火墙放行了 3000（云安全组已开 3000–3100，但 Windows 防火墙也要放行） |
| 页面能开但一直转圈 / 接口 500 | 后端没起来。看 `d:\lyq\winsw\AITAES.err.log`，最常见是数据库连不上 |
| 数据库连不上 | 确认 MySQL 服务在跑、root 密码是不是 `1234`（不是的话脚本加 `-RootPassword` 参数） |
| AI 功能一直超时或报错 | 确认 `ollama pull qwen2.5:7b` 跑完、`Get-Service ollama` 在 Running |
| 前端打包报错 | 换成 `npm install --registry=https://registry.npmmirror.com` 再试 |
| 改了代码但线上没变 | 确认重新复制了 jar/dist，并执行了 `Restart-Service AITAES` |

---

## 安全提醒

- 数据库用专用账号 `aitaes`（不是 root），密码写在后端服务环境变量里，不直接出现在代码里。
- Ollama / MySQL / 后端 8080 都只监听本机（127.0.0.1），公网只暴露 Nginx 的 3000 端口。
- 之前代码里提交过一个 DeepSeek 的 API key（现已改用本地 Ollama，不再使用），建议有空到 DeepSeek 控制台把它作废。
