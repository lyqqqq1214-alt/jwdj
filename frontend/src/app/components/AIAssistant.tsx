import React, { useState, useRef, useEffect } from "react";
import { Brain, X, FileText, Paperclip, Send, Minimize2, Maximize2 } from "lucide-react";
import { getCurrentUser } from "../../services/authService";
import { askTeacherAi } from "../../services/teacherAiChatService";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string; files?: File[] }[]>([
    { role: "ai", content: "您好！我是您的AI智能助手，有什么可以帮您的吗？\n\n您可以：\n• 提问教学相关问题\n• 上传文件进行分析\n• 获取学习建议" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const baseHeight = 500;
  const expandedHeight = baseHeight + 150;
  const windowHeight = files.length > 0 ? (isMaximized ? Math.min(window.innerHeight * 0.8, 800) : expandedHeight) : (isMaximized ? Math.min(window.innerHeight * 0.8, 800) : baseHeight);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!message.trim() && files.length === 0) return;

    setMessages(prev => [...prev, { role: "user", content: message, files: [...files] }]);
    setMessage("");
    setFiles([]);
    setIsTyping(true);

    try {
      const current = getCurrentUser();
      const isTeacher = current?.role === "TEACHER" || current?.role === "teacher";
      const answer = files.length > 0
        ? "当前教师端助手暂不支持文件解析，请先将文件内容导入系统后再提问。"
        : isTeacher
          ? await askTeacherAi(message)
          : "学生端 AI 对话助手已按第四周计划降级，您可通过错题本的 AI 错因分析和相似题练习获得学习帮助。";
      setMessages(prev => [...prev, { role: "ai", content: answer || "AI 未返回有效内容，请稍后重试。" }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "ai", content: err?.message || "AI 服务暂不可用，请确认 Ollama 已启动后重试。" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 第四周计划：学生端气泡取消，仅保留教师端基础问答入口。
  const currentUser = getCurrentUser();
  if (currentUser?.role !== "TEACHER" && currentUser?.role !== "teacher") {
    return null;
  }

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className={`fixed right-5 bottom-5 w-14 h-14 bg-gradient-to-br from-[#A6AAEE] to-[#2563EB] rounded-full shadow-lg shadow-[#2563EB]/30 flex items-center justify-center cursor-pointer z-[9999] transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-[#2563EB]/40 ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        style={{
          animation: !isOpen ? "breathe 3s ease-in-out infinite" : "none"
        }}
      >
        <Brain size={28} className="text-white" />
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(37, 99, 235, 0); }
        }
      `}</style>

      <div
        className={`fixed right-5 bottom-5 bg-card rounded-2xl shadow-2xl border border-border z-[9999] transition-all duration-300 ease-out overflow-hidden flex flex-col ${
          isOpen ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-4 pointer-events-none"
        }`}
        style={{
          width: isMaximized ? Math.min(window.innerWidth * 0.8, 800) : 380,
          height: windowHeight,
        }}
      >
        <div className="bg-gradient-to-r from-[#A6AAEE] to-[#2563EB] px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-white" />
            <span className="text-sm font-medium text-white">AI智能助手</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsMaximized(!isMaximized)} className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors">
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-[#2563EB] text-white rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.files && msg.files.length > 0 && (
                <div className={`mt-2 space-y-1 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                  {msg.files.map((f, j) => (
                    <div key={j} className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg text-xs">
                      <FileText size={14} className="text-muted-foreground" />
                      <span className="max-w-[200px] truncate">{f.name}</span>
                      <span className="text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-start">
              <div className="bg-muted rounded-xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="px-4 py-2 bg-accent/50 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">已选择 {files.length} 个文件</span>
              <button onClick={() => setFiles([])} className="text-xs text-[#EF4444] hover:text-[#EF4444]">清空全部</button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-card rounded-lg px-3 py-2">
                  <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-xs flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{(f.size / 1024).toFixed(1)} KB</span>
                  <button onClick={() => removeFile(i)} className="p-1 text-muted-foreground hover:text-[#EF4444] hover:bg-[#DC2626]/20 rounded flex-shrink-0">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 py-3 bg-card border-t border-border flex-shrink-0">
          <div className="flex items-end gap-2">
            <div className="relative flex-shrink-0">
              <button className="p-2.5 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors">
                <Paperclip size={18} />
              </button>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入您的问题...（Shift+Enter换行）"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                rows={2}
                style={{ minHeight: "44px", maxHeight: "120px" }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!message.trim() && files.length === 0}
              className="flex-shrink-0 p-2.5 bg-primary text-white rounded-xl hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
