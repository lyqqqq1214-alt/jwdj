import { useState, useEffect } from "react";
import { CheckCircle, User, ChevronDown, BookOpen, Brain, RefreshCw, Play, FileText, Code, Download } from "lucide-react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from "recharts";
import { getStudentCourses, StudentCourse } from "../../../services/studentService";
import { getMyPortrait, generateMyAiSuggestions, StudentProfile as StudentProfileData, LearningSuggestion } from "../../../services/portraitService";
import { Tag } from "../../utils";

function StudentProfile() {
  const [toast, setToast] = useState<string | null>(null);
  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const gradeLabel = (score: number | null) => {
    if (!score) return { label: "待录入", color: "gray" };
    if (score >= 90) return { label: "优秀", color: "green" };
    if (score >= 80) return { label: "良好", color: "blue" };
    if (score >= 70) return { label: "中等", color: "yellow" };
    if (score >= 60) return { label: "及格", color: "orange" };
    return { label: "不及格", color: "red" };
  };

  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);

  useEffect(() => {
    getStudentCourses().then(courses => {
      setStudentCourses(courses);
      if (courses.length > 0) {
        const saved = localStorage.getItem("selectedCourseId");
        const savedId = saved ? parseInt(saved) : null;
        const found = savedId && courses.find(c => c.id === savedId);
        setSelectedCourseId(found ? savedId! : courses[0].id);
      }
    }).catch(() => {});
  }, []);

  const selectedCourse = studentCourses.find(c => c.id === selectedCourseId);

  useEffect(() => {
    if (!selectedCourseId) return;
    setLoading(true);
    getMyPortrait(selectedCourseId).then(data => {
      setProfile(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedCourseId]);

  const handleCourseChange = (courseId: number) => {
    setSelectedCourseId(courseId);
    localStorage.setItem("selectedCourseId", courseId.toString());
  };

  const handleGenerateSuggestions = async () => {
    setGeneratingSuggestions(true);
    try {
      const text = await generateMyAiSuggestions(selectedCourseId!);
      setProfile(prev => prev ? { ...prev, aiSuggestions: text } : null);
      showToastMsg("AI学习建议已生成");
    } catch { showToastMsg("AI学习建议生成失败"); }
    finally { setGeneratingSuggestions(false); }
  };

  const learningSuggestions: LearningSuggestion[] = profile?.aiSuggestions
    ? (() => {
        try {
          const parsed = JSON.parse(profile.aiSuggestions);
          return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
      })()
    : [];

  const profileName = profile?.name || "我";
  const profileStudentNo = profile?.studentNo || "";
  const profileCollege = profile?.college || "";
  const profileClassName = profile?.className || "";
  const knowledgeData = profile?.knowledgeRadar?.map(k => ({ subject: k.name, value: Number(k.value) || 0 })) || [];
  const scoreTrend = profile?.scoreTrendList?.[0]?.semesters.map((sem, i) => ({
    exam: sem, score: Number(profile?.scoreTrendList![0].overallScores[i] || 0), classAvg: 75,
  })) || [];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}
      <div className="bg-gradient-to-r from-[#969BE7] to-[#C8A2E8] rounded-lg p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">我的画像</h2>
              <p className="text-white/90 text-sm mt-1">{profileName} · 学号：{profileStudentNo}</p>
              <p className="text-white/75 text-xs">{profileCollege} · {profileClassName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/75">选择课程</span>
            <div className="relative">
              <select value={selectedCourseId || ""} onChange={e => handleCourseChange(parseInt(e.target.value))}
                className="appearance-none bg-white/20 backdrop-blur-sm text-white px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer hover:bg-white/30 transition-colors">
                {studentCourses.map(c => (
                  <option key={c.id} value={c.id} className="text-[#4A4A6A]">
                    {c.courseName}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-2.5 text-white pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">当前成绩</p>
          <p className="font-mono text-2xl font-bold text-primary mt-1">{profile?.totalScore != null ? profile.totalScore.toFixed(1) : "—"}</p>
          <Tag color={gradeLabel(profile?.totalScore ?? 0).color as any} className="mt-2">{gradeLabel(profile?.totalScore ?? 0).label}</Tag>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">出勤率</p>
          <p className="font-mono text-2xl font-bold text-[#57AE8F] mt-1">{profile?.attendanceRate != null ? profile.attendanceRate.toFixed(1) + "%" : "—"}</p>
          <p className="text-xs text-muted-foreground mt-2">{profile?.absentCount === 0 ? "全勤" : `缺勤${profile?.absentCount}次`}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">作业提交率</p>
          <p className="font-mono text-2xl font-bold text-[#969BE7] mt-1">{profile?.homeworkRate != null ? profile.homeworkRate.toFixed(1) + "%" : "—"}</p>
          <p className="text-xs text-muted-foreground mt-2">按时提交</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">班级排名</p>
          <p className="font-mono text-2xl font-bold text-[#969BE7] mt-1">{profile?.classRank && profile?.classTotal ? `${profile.classRank}/${profile.classTotal}` : "—"}</p>
          <p className="text-xs text-muted-foreground mt-2">共{profile?.classTotal ?? 0}人</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm">知识点掌握度</h3>
            <span className="text-xs text-muted-foreground">{selectedCourse?.courseName || ""}</span>
          </div>
          <div className="space-y-3">
            {knowledgeData.map(k => (
              <div key={k.subject}>
                <div className="flex justify-between text-sm mb-1">
                  <span className={k.value < 60 ? "text-[#DD7373] font-medium" : ""}>{k.subject}</span>
                  <span className={`font-mono text-xs ${k.value < 60 ? "text-[#DD7373] font-semibold" : "text-muted-foreground"}`}>
                    {k.value}% {k.value < 60 && "⚠"}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${k.value < 60 ? "bg-[#E88383]" : k.value < 75 ? "bg-[#F5C069]" : "bg-[#74C2A0]"}`}
                    style={{ width: `${k.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm">能力雷达图</h3>
            <span className="text-xs text-muted-foreground">综合评估</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={knowledgeData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <Radar dataKey="value" stroke="#969BE7" fill="#969BE7" fillOpacity={0.2} name="掌握度" />
              <Tooltip formatter={(v: any) => `${v}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="font-medium text-sm mb-4">课程成绩详情</h3>
        <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-medium">{selectedCourse?.courseName || "—"}</p>
              <p className="text-xs text-muted-foreground">{selectedCourse?.teacherName || ""} · {selectedCourse?.courseNo || ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">总评成绩</p>
              <p className="font-mono text-2xl font-bold text-primary mt-1">{profile?.totalScore != null ? profile.totalScore.toFixed(1) : "—"}</p>
            </div>
            <Tag color={gradeLabel(profile?.totalScore ?? 0).color as any}>{gradeLabel(profile?.totalScore ?? 0).label}</Tag>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="font-medium text-sm mb-4">学习行为分析</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "本周学习时长", value: "12.5小时", trend: "+8%" },
              { label: "完成练习题数", value: "48道", trend: "+15%" },
              { label: "错题订正率", value: "78%", trend: "-5%" },
              { label: "访问课程资源", value: "23次", trend: "+12%" },
            ].map(item => (
              <div key={item.label} className="bg-muted/50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-mono text-xl font-bold mt-1">{item.value}</p>
                <p className={`text-xs mt-1 ${item.trend.startsWith("+") ? "text-[#57AE8F]" : "text-[#DD7373]"}`}>
                  {item.trend} 较上周
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="font-medium text-sm mb-4">AI个性化学习建议</h3>
          <div className="space-y-3">
            {learningSuggestions.length > 0 ? (
              learningSuggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                    s.type === "strong" ? "bg-[#74C2A0]/25 text-[#57AE8F]" : 
                    s.type === "weak" ? "bg-[#E88383]/25 text-[#DD7373]" : "bg-[#969BE7]/25 text-[#969BE7]"
                  }`}>
                    {s.type === "strong" ? "优" : s.type === "weak" ? "弱" : "改"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <Brain size={32} className="mb-2 opacity-50" />
                <p className="text-sm">点击下方按钮生成AI学习建议</p>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <button
              onClick={handleGenerateSuggestions}
              disabled={generatingSuggestions}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm rounded-md hover:bg-[#7F84D6] disabled:opacity-50 disabled:cursor-not-allowed">
              {generatingSuggestions ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Brain size={14} />
                  {learningSuggestions.length > 0 ? "更新建议" : "生成学习建议"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-sm">课程资料</h3>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { type: "video", title: "第1章：计算机网络概述", size: "45分钟", icon: Play },
                { type: "video", title: "第2章：物理层", size: "52分钟", icon: Play },
                { type: "video", title: "第3章：数据链路层", size: "58分钟", icon: Play },
                { type: "pdf", title: "课程讲义（完整版）", size: "3.2MB", icon: FileText },
                { type: "pdf", title: "习题集及答案", size: "1.8MB", icon: FileText },
                { type: "code", title: "实验代码示例", size: "56KB", icon: Code },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.type === "video" ? "bg-[#E88383]/20 text-[#DD7373]" : item.type === "pdf" ? "bg-[#969BE7]/20 text-[#969BE7]" : "bg-[#74C2A0]/20 text-[#57AE8F]"}`}>
                    <item.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.size}</p>
                  </div>
                  <Download size={14} className="text-muted-foreground hover:text-primary" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;
