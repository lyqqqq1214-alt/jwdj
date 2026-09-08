import React, { useState, useEffect, useRef } from "react";
import { Brain, Sparkles, X, FileText, Paperclip, Send } from "lucide-react";
import type { Role } from "../types";
import { sendChatMessage, AiChatMessage } from "../../services/aiChatService";

export default function AIAssistant({ courseId, studentId, role, isOpen, onToggle }: { courseId?: number | null, studentId?: number | null, role: Role, isOpen: boolean, onToggle: () => void }) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [socraticMode, setSocraticMode] = useState(true);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string; files?: File[]; socraticQuestions?: string[] }[]>([
    { role: "ai", content: "您好！我是您的AI助教，有什么可以帮您的吗？\n\n您可以：\n• 提问教学相关问题\n• 上传文件进行分析\n• 获取学习建议" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (overrideMessage?: string) => {
    const textToSend = overrideMessage || message;
    if (!textToSend.trim() && files.length === 0) return;

    setMessages(prev => [...prev, { role: "user", content: textToSend, files: [...files] }]);
    setMessage("");
    setFiles([]);
    setIsTyping(true);

    try {
      // 准备历史记录
      const history: AiChatMessage[] = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await sendChatMessage({
        message: textToSend,
        courseId: courseId || undefined,
        studentId: studentId || undefined,
        socraticMode: role === 'student' ? socraticMode : false,
        history
      });

      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: "ai",
        content: response.answer,
        socraticQuestions: response.socraticQuestions
      }]);
    } catch (error: any) {
      console.error("AI对话失败:", error);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: "ai",
        content: "抱歉，我遇到了点问题：" + (error.message || "未知错误")
      }]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div
        onClick={onToggle}
        className={`fixed right-5 bottom-5 w-14 h-14 bg-gradient-to-br from-[#A6AAEE] to-[#969BE7] rounded-full shadow-lg shadow-[#969BE7]/30 flex items-center justify-center cursor-pointer z-[9999] transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-[#969BE7]/40 ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        style={{
          animation: !isOpen ? "breathe 3s ease-in-out infinite" : "none"
        }}
      >
        <Brain size={28} className="text-white" />
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { box-shadow: 0 0 0 0 rgba(150, 155, 231, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(150, 155, 231, 0); }
        }
      `}</style>

      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[9998] transition-opacity"
          onClick={onToggle}
        />
      )}

      {/* 右侧滑出面板 */}
      <div
        className={`fixed top-0 right-0 h-full bg-card shadow-2xl border-l border-border z-[9999] transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? "transform translate-x-0" : "transform translate-x-full"
        }`}
        style={{ width: 400 }}
      >
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Brain size={20} className="text-white" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
            <div>
              <span className="text-sm font-medium text-white">AI助教</span>
              <span className="text-xs text-white/70 ml-2">在线</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {role === 'student' && (
              <button
                onClick={() => setSocraticMode(!socraticMode)}
                title={socraticMode ? "苏格拉底启发模式已开启" : "开启苏格拉底启发模式"}
                className={`p-1.5 rounded transition-colors ${socraticMode ? "text-yellow-300 bg-white/20" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              >
                <Sparkles size={16} />
              </button>
            )}
            <button onClick={onToggle} className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 消息区域 */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-[#969BE7] text-white rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.socraticQuestions && msg.socraticQuestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 max-w-[90%]">
                  {msg.socraticQuestions.map((q, j) => (
                    <button
                      key={j}
                      onClick={() => handleSend(q)}
                      className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-full transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
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

        {/* 文件区域 */}
        {files.length > 0 && (
          <div className="px-4 py-2 bg-accent/50 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">已选择 {files.length} 个文件</span>
              <button onClick={() => setFiles([])} className="text-xs text-[#DD7373] hover:text-[#DD7373]">清空全部</button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-card rounded-lg px-3 py-2">
                  <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-xs flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{(f.size / 1024).toFixed(1)} KB</span>
                  <button onClick={() => removeFile(i)} className="p-1 text-muted-foreground hover:text-[#DD7373] hover:bg-[#E88383]/20 rounded flex-shrink-0">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 输入区域 */}
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
              onClick={() => handleSend()}
              disabled={!message.trim() && files.length === 0}
              className="flex-shrink-0 p-2.5 bg-primary text-white rounded-xl hover:bg-[#7F84D6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
