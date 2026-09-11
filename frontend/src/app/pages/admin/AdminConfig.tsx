import { useState, useEffect } from "react";
import {
  Brain, Users, AlertCircle, Settings, RotateCcw, Download, Upload,
  Clock, Save, CheckCircle,
} from "lucide-react";
import { getAllConfigs, batchUpdateConfigs } from "../../../services/configService";

function AdminConfig() {
  const [remoteAiEnabled, setRemoteAiEnabled] = useState(false);
  const [remoteApiUrl, setRemoteApiUrl] = useState("");
  const [remoteModel, setRemoteModel] = useState("");
  const [remoteApiKey, setRemoteApiKey] = useState("");
  const [remoteKeyConfigured, setRemoteKeyConfigured] = useState(false);
  const [defaultPassword, setDefaultPassword] = useState("123456");
  const [absenteeismThreshold, setAbsenteeismThreshold] = useState("3");
  const [gradeDropThreshold, setGradeDropThreshold] = useState("20");
  const [homeworkThreshold, setHomeworkThreshold] = useState("3");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAllConfigs().then(data => {
      const allConfigs = Object.values(data || {}).flat();
      for (const c of allConfigs) {
        if (c.configKey === "ai.remote.enabled") setRemoteAiEnabled(c.configValue === "true");
        if (c.configKey === "ai.remote.base_url") setRemoteApiUrl(c.configValue || "");
        if (c.configKey === "ai.remote.model") setRemoteModel(c.configValue || "");
        if (c.configKey === "ai.remote.api_key") setRemoteKeyConfigured(c.configValue === "已设置");
        if (c.configKey === "default.password") setDefaultPassword(c.configValue || "");
        if (c.configKey === "warning.attendance_threshold") setAbsenteeismThreshold(c.configValue || "");
        if (c.configKey === "warning.score_drop_threshold") setGradeDropThreshold(c.configValue || "");
        if (c.configKey === "warning.homework_miss_times") setHomeworkThreshold(c.configValue || "");
      }
    }).catch(() => {});
  }, []);

  const [riskWeights, setRiskWeights] = useState({
    attendance: 30,
    scoreDrop: 35,
    homework: 20,
    activity: 15,
  });

  const save = async () => {
    try {
      const configs: Record<string, string> = {
        "ai.remote.enabled": String(remoteAiEnabled),
        "ai.remote.base_url": remoteApiUrl.trim(),
        "ai.remote.model": remoteModel.trim(),
        "default.password": defaultPassword,
        "warning.attendance_threshold": absenteeismThreshold,
        "warning.score_drop_threshold": gradeDropThreshold,
        "warning.homework_miss_times": homeworkThreshold,
      };
      if (remoteApiKey.trim()) configs["ai.remote.api_key"] = remoteApiKey.trim();
      await batchUpdateConfigs(configs);
      setRemoteApiKey("");
      if (remoteApiKey.trim()) setRemoteKeyConfigured(true);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaved(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#969BE7] to-[#C8A2E8] rounded-lg p-6 text-white">
        <h2 className="text-xl font-semibold">系统配置</h2>
        <p className="text-white/90 text-sm mt-1">管理系统全局参数设置</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-[#969BE7]" />
            <h3 className="font-medium text-sm">AI 服务配置</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">使用远程 API</p>
                  <p className="text-xs text-muted-foreground mt-0.5">关闭或配置不完整时，自动使用本机 Ollama（qwen2.5:7b）</p>
                </div>
                <input type="checkbox" checked={remoteAiEnabled} onChange={e => setRemoteAiEnabled(e.target.checked)} className="h-4 w-4 accent-primary" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">远程 OpenAI 兼容 API 地址</label>
              <input type="url" value={remoteApiUrl} onChange={e => setRemoteApiUrl(e.target.value)} disabled={!remoteAiEnabled}
                className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                placeholder="https://api.example.com/v1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">远程模型名称</label>
              <input type="text" value={remoteModel} onChange={e => setRemoteModel(e.target.value)} disabled={!remoteAiEnabled}
                className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                placeholder="例如 qwen-plus、deepseek-v3" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">远程 API Key</label>
              <input type="password" value={remoteApiKey} onChange={e => setRemoteApiKey(e.target.value)} disabled={!remoteAiEnabled}
                className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                placeholder={remoteKeyConfigured ? "已保存；留空则保持不变" : "请输入远程服务 API Key"} />
              <p className="text-xs text-muted-foreground mt-1">密钥仅保存于后端数据库，页面不会回显。</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-[#969BE7]" />
            <h3 className="font-medium text-sm">教师导入配置</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">默认初始密码</label>
              <div className="flex items-center gap-2">
                <input type="text" value={defaultPassword} onChange={e => setDefaultPassword(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">教师账号初始密码</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={16} className="text-[#E8945C]" />
          <h3 className="font-medium text-sm">预警规则全局管理</h3>
          <span className="text-xs text-muted-foreground ml-auto">教师可在默认规则基础上自定义</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-medium text-muted-foreground">预警阈值设置</h4>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">缺勤预警阈值（次）</label>
              <div className="flex items-center gap-3">
                <input type="number" value={absenteeismThreshold} onChange={e => setAbsenteeismThreshold(e.target.value)}
                  className="w-24 px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <span className="text-xs text-muted-foreground">累计缺勤≥此值触发</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">成绩下滑预警阈值（%）</label>
              <div className="flex items-center gap-3">
                <input type="number" value={gradeDropThreshold} onChange={e => setGradeDropThreshold(e.target.value)}
                  className="w-24 px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <span className="text-xs text-muted-foreground">连续两次下降≥此值</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">作业未交预警阈值（次）</label>
              <div className="flex items-center gap-3">
                <input type="number" value={homeworkThreshold} onChange={e => setHomeworkThreshold(e.target.value)}
                  className="w-24 px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <span className="text-xs text-muted-foreground">连续未交≥此值触发</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-medium text-muted-foreground">综合风险评分权重</h4>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">出勤情况</span>
                <span>{riskWeights.attendance}%</span>
              </div>
              <input type="range" min="0" max="100" value={riskWeights.attendance} onChange={e => setRiskWeights({ ...riskWeights, attendance: parseInt(e.target.value) })}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">成绩下滑</span>
                <span>{riskWeights.scoreDrop}%</span>
              </div>
              <input type="range" min="0" max="100" value={riskWeights.scoreDrop} onChange={e => setRiskWeights({ ...riskWeights, scoreDrop: parseInt(e.target.value) })}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">作业完成</span>
                <span>{riskWeights.homework}%</span>
              </div>
              <input type="range" min="0" max="100" value={riskWeights.homework} onChange={e => setRiskWeights({ ...riskWeights, homework: parseInt(e.target.value) })}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">学习活跃度</span>
                <span>{riskWeights.activity}%</span>
              </div>
              <input type="range" min="0" max="100" value={riskWeights.activity} onChange={e => setRiskWeights({ ...riskWeights, activity: parseInt(e.target.value) })}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground">权重总和</span>
              <span className={`text-xs font-medium ${riskWeights.attendance + riskWeights.scoreDrop + riskWeights.homework + riskWeights.activity === 100 ? "text-[#57AE8F]" : "text-[#DD7373]"}`}>
                {riskWeights.attendance + riskWeights.scoreDrop + riskWeights.homework + riskWeights.activity}%
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-medium text-muted-foreground">预警等级划分</h4>
            <div className="p-3 bg-[#E88383]/20 rounded-lg border border-[#E88383]/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#DD7373]">高风险</span>
                <span className="text-xs text-[#DD7373]">评分 ≥ 70分</span>
              </div>
              <p className="text-xs text-[#DD7373]">需要重点关注，建议及时沟通</p>
            </div>
            <div className="p-3 bg-[#EEC1DD]/30 rounded-lg border border-[#EEC1DD]/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#C972A8]">中风险</span>
                <span className="text-xs text-[#C972A8]">40分 ≤ 评分 {'<'} 70分</span>
              </div>
              <p className="text-xs text-[#C972A8]">需要持续观察学习状态</p>
            </div>
            <div className="p-3 bg-[#74C2A0]/20 rounded-lg border border-[#74C2A0]/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#57AE8F]">低风险</span>
                <span className="text-xs text-[#57AE8F]">评分 {'<'} 40分</span>
              </div>
              <p className="text-xs text-[#57AE8F]">学习状态良好，继续保持</p>
            </div>
          </div>
        </div>
      </div>



      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={16} className="text-[#9A9AB4]" />
          <h3 className="font-medium text-sm">系统维护</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-lg text-sm hover:bg-accent transition-colors">
            <RotateCcw size={16} />
            重置系统缓存
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-lg text-sm hover:bg-accent transition-colors">
            <Download size={16} />
            导出系统日志
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-lg text-sm hover:bg-accent transition-colors">
            <Upload size={16} />
            导入配置备份
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={14} />
          最后更新：2024-01-15 10:30
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-border rounded-md text-sm hover:bg-accent">
            重置为默认
          </button>
          <button onClick={save} className="px-5 py-2 bg-primary text-white text-sm rounded-md hover:bg-[#7F84D6] flex items-center gap-2">
            <Save size={14} />
            保存配置
          </button>
          {saved && <span className="text-[#57AE8F] text-sm flex items-center gap-1"><CheckCircle size={14} />保存成功</span>}
        </div>
      </div>
    </div>
  );
}

export default AdminConfig;
