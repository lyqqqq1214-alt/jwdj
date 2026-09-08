import { useState } from "react";
import {
  Server, BarChart3, PieChart as PieChartIcon, Activity, Users, FileText,
} from "lucide-react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

function AdminAIOpsCenter() {
  const [modelStatus, setModelStatus] = useState("online");
  const [testResult, setTestResult] = useState<string | null>(null);

  const models = [
    { name: "qwen2.5:7b", size: "7B", status: "online" },
    { name: "qwen2.5:4b", size: "4B", status: "online" },
    { name: "llama3:8b", size: "8B", status: "degraded" },
    { name: "mistral:7b", size: "7B", status: "offline" },
  ];

  const responseTimeData = [
    { request: 1, time: 450 }, { request: 2, time: 380 }, { request: 3, time: 520 },
    { request: 4, time: 410 }, { request: 5, time: 390 }, { request: 6, time: 480 },
    { request: 7, time: 550 }, { request: 8, time: 420 }, { request: 9, time: 360 },
    { request: 10, time: 490 },
  ];

  const successRateData = [
    { name: "成功", value: 94 },
    { name: "超时", value: 3 },
    { name: "错误", value: 3 },
  ];

  const callStats = [
    { scenario: "智能出题", count: 1256, users: 28 },
    { scenario: "错题分析", count: 892, users: 22 },
    { scenario: "综合评价", count: 456, users: 18 },
    { scenario: "苏格拉底提问", count: 234, users: 15 },
    { scenario: "其他", count: 168, users: 12 },
  ];

  const frequentUsers = [
    { name: "王建国", calls: 286, department: "计算机学院" },
    { name: "刘晓红", calls: 215, department: "数学学院" },
    { name: "张晓明", calls: 198, department: "物理学院" },
    { name: "李婷婷", calls: 175, department: "经管学院" },
    { name: "陈志强", calls: 156, department: "计算机学院" },
  ];

  const promptTemplates = [
    { id: 1, name: "智能出题", scenario: "ai-quiz", variables: ["知识点", "题型", "数量", "难度"], content: "请根据以下知识点生成{{数量}}道{{题型}}题，难度为{{难度}}：\n\n知识点：{{知识点}}\n\n要求：题目要有区分度，覆盖不同难度级别。" },
    { id: 2, name: "错题分析", scenario: "wrong-analysis", variables: ["题目", "学生答案", "正确答案"], content: "分析以下错题并给出详细解析：\n\n题目：{{题目}}\n学生答案：{{学生答案}}\n正确答案：{{正确答案}}\n\n请从知识点掌握程度、错误原因、改进建议三个方面进行分析。" },
    { id: 3, name: "综合评价", scenario: "evaluation", variables: ["学生姓名", "课程", "成绩数据"], content: "为学生{{学生姓名}}生成{{课程}}课程的综合评价报告，基于以下数据：\n\n{{成绩数据}}\n\n评价应包括学习表现、优势领域、改进建议等方面。" },
  ];

  const [activeTemplate, setActiveTemplate] = useState(promptTemplates[0]);
  const [templateContent, setTemplateContent] = useState(promptTemplates[0].content);
  const [testResultText, setTestResultText] = useState("");

  const handleTestTemplate = () => {
    setTestResultText("正在生成测试结果...");
    setTimeout(() => {
      setTestResultText("【测试结果示例】\n\n请根据以下知识点生成5道选择题，难度为中等：\n\n知识点：数据结构、算法\n\n1. 以下哪种数据结构最适合实现\"先进先出\"的操作？\nA) 栈 B) 队列 C) 链表 D) 二叉树\n\n2. 快速排序的平均时间复杂度是？\nA) O(n) B) O(nlogn) C) O(n²) D) O(logn)\n...");
    }, 1500);
  };

  const handleTestConnection = () => {
    setTestResult("测试中...");
    setTimeout(() => {
      setTestResult("连接成功！大模型服务运行正常");
      setModelStatus("online");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#969BE7] to-[#C8A2E8] rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">AI运维中心</h2>
            <p className="text-white/90 text-sm mt-1">监控和管理AI模型服务与调用</p>
          </div>
          <div className="flex items-center gap-2">
            {modelStatus === "online" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#93D4BC] animate-pulse" />
                <span className="text-sm">AI服务正常</span>
              </>
            ) : modelStatus === "degraded" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#F8CE85] animate-pulse" />
                <span className="text-sm">AI服务降级</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#F2A6A6] animate-pulse" />
                <span className="text-sm">AI服务离线</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server size={16} className="text-primary" />
              <h3 className="font-medium text-sm">模型服务状态</h3>
            </div>
            <button onClick={handleTestConnection} className="px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-md hover:bg-primary/20">
              测试连接
            </button>
          </div>
          {testResult && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${testResult.includes("成功") ? "bg-[#74C2A0]/20 text-[#57AE8F]" : "bg-[#E88383]/20 text-[#DD7373]"}`}>
              {testResult}
            </div>
          )}
          <div className="space-y-3">
            {models.map(model => (
              <div key={model.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{model.name}</p>
                  <p className="text-xs text-muted-foreground">模型大小：{model.size}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${model.status === "online" ? "bg-[#74C2A0]/25 text-[#57AE8F]" : model.status === "degraded" ? "bg-[#EEC1DD]/40 text-[#C972A8]" : "bg-[#E88383]/25 text-[#DD7373]"}`}>
                  {model.status === "online" ? "在线" : model.status === "degraded" ? "降级" : "离线"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-primary" />
            <h3 className="font-medium text-sm">响应时间分布</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="request" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => `${v}ms`} />
              <Bar dataKey="time" fill="#969BE7" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>平均响应时间：443ms</span>
            <span>P95响应时间：550ms</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon size={16} className="text-primary" />
            <h3 className="font-medium text-sm">调用成功率</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={successRateData} cx="50%" cy="50%" outerRadius={60} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {successRateData.map((_, i) => <Cell key={i} fill={i === 0 ? "#8FD0B8" : i === 1 ? "#F5D5A8" : "#E8909A"} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-primary" />
            <h3 className="font-medium text-sm">场景调用统计</h3>
          </div>
          <div className="space-y-2">
            {callStats.map(item => (
              <div key={item.scenario}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{item.scenario}</span>
                  <span>{item.count}次</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(item.count / 1256) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-primary" />
            <h3 className="font-medium text-sm">活跃用户排行</h3>
          </div>
          <div className="space-y-2">
            {frequentUsers.map((user, i) => (
              <div key={user.name} className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${i < 3 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.department}</p>
                </div>
                <span className="text-xs font-mono">{user.calls}次</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            <h3 className="font-medium text-sm">Prompt模板管理</h3>
          </div>
          <button className="px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-md hover:bg-primary/20">
            恢复默认
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            {promptTemplates.map(tpl => (
              <button key={tpl.id} onClick={() => { setActiveTemplate(tpl); setTemplateContent(tpl.content); }}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${activeTemplate.id === tpl.id ? "border-primary bg-primary/5" : "border-border hover:border-primary"}`}>
                <p className="font-medium">{tpl.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{tpl.scenario}</p>
              </button>
            ))}
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">模板内容</label>
              <textarea value={templateContent} onChange={e => setTemplateContent(e.target.value)}
                className="w-full h-40 px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono resize-none" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">可用变量：</span>
                {activeTemplate.variables.map(v => (
                  <span key={v} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">{'{'}{'{'}{v}{'}'}{'}'}</span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleTestTemplate} className="px-3 py-1.5 border border-border text-sm rounded-md hover:bg-accent">
                  测试运行
                </button>
                <button className="px-3 py-1.5 bg-primary text-white text-sm rounded-md hover:bg-[#7F84D6]">
                  保存模板
                </button>
              </div>
            </div>
            {testResultText && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">测试结果预览：</p>
                <pre className="text-xs font-mono whitespace-pre-wrap">{testResultText}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAIOpsCenter;
