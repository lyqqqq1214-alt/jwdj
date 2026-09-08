import { useState } from "react";
import { Brain } from "lucide-react";
import { login, saveUser, mapRole } from "../../services/authService";
import { Role } from "../types";

export default function LoginPage({ onLogin }: { onLogin: (role: Role, user: any) => void }) {
  const [uid, setUid] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!uid) { setError("请输入账号"); return; }
    if (pwd.length < 6) { setError("密码长度不能少于6位"); return; }
    setError("");
    setLoading(true);

    try {
      const user = await login({ username: uid, password: pwd });
      saveUser(user);
      const frontendRole = mapRole(user.role);
      onLogin(frontendRole, user);
    } catch (err: any) {
      setError(err.message || "登录失败，请检查账号密码");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EFFB] via-[#FCF8FB] to-[#FBEFF6] flex" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(150,155,231,.12) 39px,rgba(150,155,231,.12) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(150,155,231,.12) 39px,rgba(150,155,231,.12) 40px)" }} />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <span className="text-[#7F84D6] font-semibold text-lg">AI教学评价系统</span>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold text-[#7F84D6] leading-tight">
            智能分析学情<br />个性化学习路径
          </h1>
          <p className="text-[#9A9AB4] max-w-sm">
            基于AI技术，为每位学生提供精准的知识点掌握度分析与针对性练习推荐，助力教学质量提升。
          </p>
          <div className="flex gap-8">
            {[{ n: "1,284", l: "注册用户" }, { n: "86%", l: "平均分析覆盖率" }, { n: "12+", l: "接入学院" }].map(({ n, l }) => (
              <div key={l}>
                <p className="text-2xl font-mono font-bold text-[#7F84D6]">{n}</p>
                <p className="text-xs text-[#9A9AB4]">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-[#9A9AB4] text-xs">© 2025 AI教学评价系统 · 版权所有</p>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-[420px] flex items-center justify-center bg-white/80 backdrop-blur-sm p-8">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-[#4A4A6A]">欢迎登录</h2>
            <p className="text-[#9A9AB4] text-sm mt-1">请输入账号密码</p>
          </div>

          {/* Inputs */}
          <div className="space-y-3">
            <input
              value={uid} onChange={e => setUid(e.target.value)}
              placeholder="请输入学号/工号"
              className="w-full bg-[#F7F5FC] border border-[#D6D2F0] rounded-md px-4 py-3 text-[#4A4A6A] text-sm placeholder-[#B0B0CC] focus:outline-none focus:border-primary transition-colors"
            />
            <div className="relative">
              <input
                value={pwd} onChange={e => setPwd(e.target.value)}
                type={showPwd ? "text" : "password"}
                placeholder="请输入密码（不少于6位）"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="w-full bg-[#F7F5FC] border border-[#D6D2F0] rounded-md px-4 py-3 text-[#4A4A6A] text-sm placeholder-[#B0B0CC] focus:outline-none focus:border-primary transition-colors pr-10"
              />
              <button onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-3.5 text-[#9A9AB4] hover:text-primary text-xs">
                {showPwd ? "隐藏" : "显示"}
              </button>
            </div>
            {error && <p className="text-[#DD7373] text-xs">{error}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="remember" className="rounded" />
            <label htmlFor="remember" className="text-[#9A9AB4] text-sm">记住账号</label>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-[#7F84D6] text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "登录中..." : "登录"}
          </button>

          <div className="text-center text-[#9A9AB4] text-xs space-y-1">
            <p>测试账号（密码统一 123456）：</p>
            <p>管理员: admin</p>
            <p>教师: T00001 | T00002</p>
            <p>学生: 202426010101 | 202407010101</p>
          </div>
        </div>
      </div>
    </div>
  );
}
