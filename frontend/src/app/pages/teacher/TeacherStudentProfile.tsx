import { useState, useEffect } from "react";
import {
  CheckCircle, Eye, Star, Download, User, AlertTriangle,
  Award, Target, BookOpen, TrendingUp, Brain, RefreshCw,
  Sparkles, Edit2, Play, X
} from "lucide-react";
import {
  LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { getMyClasses, getClassStudents, ClassVO as ClsVO, StudentVO } from "../../../services/classService";
import { getStudentProfile, toggleFocusStudent, generateAiEvaluation, generateAiSuggestions, StudentProfile as StudentProfileData, LearningSuggestion } from "../../../services/portraitService";
import { exportCourse, exportStudentProfile } from "../../../services/exportService";
import { sendNotification } from "../../../services/notificationService";
import { Page } from "../../types";
import { Tag, normalizeAttendanceStatus, getAttendanceTagColor } from "../../utils";
import { calculateCTAchievements, getCTRadarData, COURSE_OBJECTIVES } from "../../ctObjectives";

function TeacherStudentProfile({ onNav, initialStudentId, initialCourseId }: { onNav: (p: Page) => void; initialStudentId?: number | null; initialCourseId?: number | null }) {
  const [activeTab, setActiveTab] = useState("score");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(initialStudentId || null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(initialCourseId || null);
  const [isFocused, setIsFocused] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showSuggestionEdit, setShowSuggestionEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);

  // API data
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [courses, setCourses] = useState<ClsVO[]>([]);
  const [students, setStudents] = useState<StudentVO[]>([]);

  useEffect(() => {
    getMyClasses().then(data => {
      setCourses(data || []);
      if (data && data.length > 0 && !selectedCourseId) {
        setSelectedCourseId(data[0].id!);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    getClassStudents(selectedCourseId).then(data => {
      setStudents(data || []);
      if (data && data.length > 0 && !selectedStudentId) {
        setSelectedStudentId(data[0].studentId);
      }
    }).catch(() => {});
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedStudentId || !selectedCourseId) return;
    setLoading(true);
    getStudentProfile(selectedStudentId, selectedCourseId).then(data => {
      setProfile(data);
      setIsFocused(data.isFocus || false);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedStudentId, selectedCourseId]);

  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  const handleFocusToggle = async () => {
    if (!selectedStudentId || !selectedCourseId) return;
    try {
      await toggleFocusStudent(selectedStudentId, selectedCourseId, !isFocused);
      setIsFocused(!isFocused);
      showToastMsg(!isFocused ? "已标记为重点关注" : "已取消重点关注");
    } catch { showToastMsg("操作失败"); }
  };

  const handleGenerateAi = async () => {
    if (!selectedStudentId || !selectedCourseId) return;
    setGeneratingAi(true);
    try {
      const text = await generateAiEvaluation(selectedStudentId, selectedCourseId);
      setProfile(prev => prev ? { ...prev, aiEvaluation: text } : null);
      showToastMsg("AI评价已生成");
    } catch { showToastMsg("AI评价生成失败"); }
    finally { setGeneratingAi(false); }
  };

  const handleGenerateSuggestions = async () => {
    if (!selectedStudentId || !selectedCourseId) return;
    setGeneratingSuggestions(true);
    try {
      const text = await generateAiSuggestions(selectedStudentId, selectedCourseId);
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

  const [editingSuggestions, setEditingSuggestions] = useState<LearningSuggestion[]>([]);
  const [savingSuggestions, setSavingSuggestions] = useState(false);

  const tabs = [
    { key: "score", label: "成绩概览" },
    { key: "attendance", label: "考勤记录" },
    { key: "homework", label: "作业情况" },
    { key: "experiment", label: "实验报告" },
    { key: "knowledge", label: "知识掌握度" },
    { key: "ct", label: "课程目标" },
    { key: "ai", label: "AI综合评价" },
  ];

  // Build display data from API profile
  const profileData = profile ? {
    name: profile.name,
    uid: profile.studentNo,
    className: profile.className || "",
    stats: {
      totalScore: profile.totalScore ? Math.round(profile.totalScore) : 0,
      maxScore: profile.scoreTrendList?.[0]?.overallScores?.length
        ? Math.max(...profile.scoreTrendList[0].overallScores.map(Number))
        : 0,
      minScore: profile.scoreTrendList?.[0]?.overallScores?.length
        ? Math.min(...profile.scoreTrendList[0].overallScores.map(Number))
        : 0,
      avgScore: profile.totalScore ? Math.round(profile.totalScore) : 0,
      rank: profile.classRank || 0,
      classTotal: profile.classTotal || 0,
    },
    scoreTrend: profile.scoreTrendList?.[0]
      ? profile.scoreTrendList[0].semesters.map((sem, i) => ({
          exam: sem,
          score: Number(profile.scoreTrendList![0].overallScores[i] || 0),
          classAvg: 75,
        }))
      : [],
    attendanceRecords: profile.attendanceList?.map(a => ({
      date: a.date?.split("T")[0] || "",
      status: normalizeAttendanceStatus(a.status || ""),
    })) || [],
    homeworkRecords: profile.homeworkList?.map(h => ({
      name: h.name || "",
      score: h.score ? Number(h.score) : 0,
      status: h.submitStatus || "未提交",
    })) || [],
    experimentRecords: profile.experimentList?.map(e => ({
      name: e.name || "",
      score: e.score ? Number(e.score) : null,
      submitTime: e.submitTime || "",
    })) || [],
    knowledgeData: profile.knowledgeRadar?.map(k => ({
      subject: k.name,
      value: Number(k.value) || 0,
    })) || [],
    aiEvaluation: profile.aiEvaluation || "",
  } : null;

  const attendanceStats = profileData?.attendanceRecords.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const handleExportReport = async () => {
    if (!selectedCourseId || !selectedStudentId) return showToastMsg("请先选择课程和学生");
    try {
      await exportStudentProfile(selectedStudentId, selectedCourseId, `学生画像报告_${selectedStudentId}.xlsx`);
      showToastMsg("学生画像报告已导出为 Excel");
    } catch (e: any) {
      showToastMsg(e?.message || "报告导出失败");
    }
  };

  const handleExportClassReport = async () => {
    if (!selectedCourseId) return showToastMsg("请先选择课程");
    try {
      await exportCourse(selectedCourseId, `班级驾驶舱报告_${selectedCourseId}.xlsx`);
      showToastMsg("班级驾驶舱报告已导出为 Excel");
    } catch (e: any) {
      showToastMsg(e?.message || "班级报告导出失败");
    }
  };

  const handleSendAiEvaluation = async () => {
    if (!selectedCourseId || !selectedStudentId || !profile?.aiEvaluation) {
      return showToastMsg("请先生成 AI 综合评价");
    }
    setSendingNotification(true);
    try {
      await sendNotification({
        title: "AI 综合学习评价",
        content: `${profile.name}同学：\n${profile.aiEvaluation}${profile.aiSuggestions ? `\n\n学习建议：\n${profile.aiSuggestions}` : ""}`,
        recipientScope: "COURSE",
        courseId: selectedCourseId,
        studentIds: [selectedStudentId],
      });
      showToastMsg("AI 综合评价已发送给学生");
    } catch (e: any) {
      showToastMsg(e?.message || "发送通知失败");
    } finally {
      setSendingNotification(false);
    }
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">学生画像</h2>
          <select value={selectedCourseId || ""} onChange={e => { setSelectedCourseId(Number(e.target.value)); setSelectedStudentId(null); }}
            className="appearance-none bg-card border border-border px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer hover:bg-accent transition-colors">
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.courseName || c.name}</option>
            ))}
          </select>
          <select value={selectedStudentId || ""} onChange={e => setSelectedStudentId(Number(e.target.value))}
            className="appearance-none bg-card border border-border px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer hover:bg-accent transition-colors">
            {students.map(s => (
              <option key={s.studentId} value={s.studentId}>{s.name} · {s.studentNo}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPrivacyMode(!privacyMode)} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
            privacyMode ? "bg-[#969BE7]/25 text-[#969BE7] border border-[#969BE7]/40" : "bg-muted hover:bg-accent border border-transparent"
          }`}>
            <Eye size={14} />
            {privacyMode ? "隐私模式：开启" : "隐私模式：关闭"}
          </button>
          <button onClick={handleFocusToggle} className={`px-4 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
            isFocused ? "bg-[#E88383] text-white" : "bg-muted hover:bg-accent"
          }`}>
            <Star size={14} />
            {isFocused ? "已重点关注" : "重点关注"}
          </button>
          <button onClick={handleExportReport} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">
            <Download size={14} />导出学生画像
          </button>
          <button onClick={handleExportClassReport} className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md text-sm hover:bg-accent">
            <Download size={14} />导出班级报告
          </button>
        </div>
      </div>

      {privacyMode && (
        <div className="bg-[#969BE7]/20 border border-[#969BE7]/40 rounded-lg p-3 flex items-center gap-2">
          <Eye size={14} className="text-[#969BE7]" />
          <span className="text-xs text-[#969BE7]">隐私保护模式已开启，班级排名和对比数据已隐藏</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-1 bg-card rounded-lg border border-border p-6">
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">加载中...</div>
          ) : !profileData ? (
            <div className="text-center py-8 text-sm text-muted-foreground">暂无数据</div>
          ) : (
            <>
              <div className="text-center mb-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <User size={32} className="text-primary" />
                </div>
                <h2 className="text-lg font-semibold mt-3">{profileData.name}</h2>
                <p className="text-xs text-muted-foreground mt-1">学号：{profileData.uid}</p>
                <p className="text-xs text-muted-foreground">{profileData.className}</p>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">出勤率</span><span className="font-medium">{profile.attendanceRate}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">缺勤</span><span className="font-medium text-[#DD7373]">{profile.absentCount}次</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">迟到</span><span className="font-medium text-[#E9B45C]">{profile.lateCount}次</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">请假</span><span className="font-medium text-[#969BE7]">{profile.leaveCount}次</span></div>
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card rounded-lg border border-border px-4">
            <div className="flex gap-0 border-b border-border">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors
                    ${activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {!profileData ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center text-sm text-muted-foreground">请选择课程和学生查看画像</div>
          ) : <>
          {activeTab === "score" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "总分", value: profileData.stats.totalScore, subtext: privacyMode ? "隐私保护" : `班级排名 ${profileData.stats.rank}/${profileData.stats.classTotal}` },
                  { label: "最高分", value: profileData.stats.maxScore, subtext: "历次考试" },
                  { label: "最低分", value: profileData.stats.minScore, subtext: "历次考试" },
                  { label: "平均分", value: profileData.stats.avgScore, subtext: profile.scoreTrendList?.[0]?.overallScores?.length ? `${profile.scoreTrendList[0].overallScores.length}次考试` : "暂无数据" },
                ].map(item => (
                  <div key={item.label} className="bg-card rounded-lg border border-border p-4 text-center">
                    <p className="font-mono text-xl font-bold text-primary">{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                    <p className={`text-xs mt-1 ${privacyMode && item.label === "总分" ? "text-[#969BE7]" : "text-muted-foreground"}`}>{item.subtext}</p>
                  </div>
                ))}
              </div>
              <div className="bg-card rounded-lg border border-border p-5">
                <h4 className="font-medium text-sm mb-4">成绩趋势</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={profileData.scoreTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="exam" tick={{ fontSize: 11 }} />
                    <YAxis domain={[40, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => `${v}分`} />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#969BE7" strokeWidth={2} dot={{ r: 4 }} name="个人成绩" />
                    {!privacyMode && <Line type="monotone" dataKey="classAvg" stroke="#B8B8CE" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" name="班级均值" />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-lg border border-border p-5">
                  <h4 className="font-medium text-sm mb-4">出勤统计</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={[
                        { name: "出勤", value: (attendanceStats["出勤"] || 0) + (attendanceStats["PRESENT"] || 0) },
                        { name: "迟到", value: (attendanceStats["迟到"] || 0) + (attendanceStats["LATE"] || 0) },
                        { name: "请假", value: (attendanceStats["请假"] || 0) + (attendanceStats["LEAVE"] || 0) },
                        { name: "缺勤", value: (attendanceStats["缺勤"] || 0) + (attendanceStats["ABSENT"] || 0) },
                      ]} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                        {[{ fill: "#8FD0B8" }, { fill: "#F5D5A8" }, { fill: "#A9C3EF" }, { fill: "#E8909A" }].map((c, i) => <Cell key={`cell-${i}`} {...c} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-card rounded-lg border border-border p-5">
                  <h4 className="font-medium text-sm mb-4">出勤明细</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {profileData.attendanceRecords.map(r => (
                      <div key={r.date} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-xs font-mono">{r.date}</span>
                        <Tag color={getAttendanceTagColor(r.status)}>{r.status}</Tag>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "homework" && (
            <div className="bg-card rounded-lg border border-border p-5">
              <h4 className="font-medium text-sm mb-4">作业提交情况</h4>
              <div className="space-y-4">
                {profileData.homeworkRecords.map(h => (
                  <div key={h.name} className="flex items-center gap-4">
                    <div className="w-28 text-sm font-medium">{h.name}</div>
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div className={`h-3 rounded-full ${h.status === "按时" ? "bg-[#74C2A0]" : h.status === "迟交" ? "bg-[#F5C069]" : "bg-[#E88383]"}`}
                        style={{ width: h.score ? `${h.score}%` : "0%" }} />
                    </div>
                    <div className="w-16 text-right">
                      <span className="font-mono text-sm">{h.score ?? "—"}</span>
                    </div>
                    <Tag color={h.status === "按时" ? "green" : h.status === "迟交" ? "orange" : "red"}>{h.status}</Tag>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "experiment" && (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["实验名称", "分数", "提交时间"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profileData.experimentRecords.map(e => (
                    <tr key={e.name} className="border-b border-border last:border-0 hover:bg-accent/30">
                      <td className="px-4 py-3 font-medium">{e.name}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{e.score ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.submitTime || "未提交"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "knowledge" && (
            <div className="space-y-4">
              <div className="bg-card rounded-lg border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-sm">知识掌握度雷达图</h4>
                  {!privacyMode && <span className="text-xs text-muted-foreground">已显示班级均值对比</span>}
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={profileData.knowledgeData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar dataKey="value" stroke="#969BE7" fill="#969BE7" fillOpacity={0.3} name="个人掌握度" strokeWidth={2} />
                    {!privacyMode && (
                      <Radar dataKey="value" stroke="#B8B8CE" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" name="班级均值" />
                    )}
                    <Tooltip formatter={(v: any) => [`${v}%`, "掌握度"]} contentStyle={{ fontSize: "12px", padding: "8px 12px" }} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-lg border border-border p-5">
                <h4 className="font-medium text-sm mb-4">知识点详情分析</h4>
                <div className="space-y-3">
                  {profileData.knowledgeData.map((k, i) => {
                    const isWeak = k.value < 70;
                    const isStrong = k.value >= 85;
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-28 text-sm font-medium">{k.subject}</div>
                        <div className="flex-1 bg-muted rounded-full h-3">
                          <div className={`h-3 rounded-full transition-all ${isWeak ? "bg-[#E88383]" : isStrong ? "bg-[#74C2A0]" : "bg-primary"}`}
                            style={{ width: `${k.value}%` }} />
                        </div>
                        <div className="w-16 text-right font-mono font-semibold">
                          <span className={isWeak ? "text-[#DD7373]" : isStrong ? "text-[#57AE8F]" : "text-primary"}>{k.value}%</span>
                        </div>
                        <Tag color={isWeak ? "red" : isStrong ? "green" : "blue"}>
                          {isWeak ? "需加强" : isStrong ? "优秀" : "良好"}
                        </Tag>
                      </div>
                    );
                  })}
                </div>

                {profileData.knowledgeData.filter(k => k.value < 70).length > 0 && (
                  <div className="mt-4 p-3 bg-[#E88383]/20 border border-[#E88383]/40 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} className="text-[#DD7373]" />
                      <span className="text-xs font-medium text-[#DD7373]">薄弱知识点提醒</span>
                    </div>
                    <p className="text-xs text-[#DD7373]">
                      以下知识点掌握度低于70%：{profileData.knowledgeData.filter(k => k.value < 70).map(k => k.subject).join("、")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "ct" && profile && (() => {
            const achievements = calculateCTAchievements(profile);
            const radarData = getCTRadarData(achievements);
            const overallScore = Math.round(
              achievements.reduce((s, a) => s + a.score * a.objective.weight, 0)
            );
            const levelColor: Record<string, string> = {
              "优秀": "green", "良好": "blue", "合格": "gray", "需加强": "red",
            };
            const levelBarColor: Record<string, string> = {
              "优秀": "bg-[#74C2A0]", "良好": "bg-primary", "合格": "bg-[#F5A623]", "需加强": "bg-[#E88383]",
            };
            return (
              <div className="space-y-4">
                {/* 总览 */}
                <div className="bg-card rounded-lg border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-sm">课程目标达成总览</h4>
                      <p className="text-xs text-muted-foreground mt-1">依据《计算机网络》教学大纲 CT1-CT4 课程目标</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">综合达成度</p>
                      <p className="text-2xl font-bold text-primary">{overallScore}<span className="text-sm">分</span></p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {achievements.map(a => (
                      <div key={a.objective.id} className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">{a.objective.id}</p>
                        <p className="text-lg font-bold mt-1">{a.score}</p>
                        <Tag color={levelColor[a.level]}>{a.level}</Tag>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 雷达图 */}
                <div className="bg-card rounded-lg border border-border p-5">
                  <h4 className="font-medium text-sm mb-4">课程目标达成度雷达图</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar dataKey="value" stroke="#969BE7" fill="#969BE7" fillOpacity={0.35} name="达成度" strokeWidth={2} />
                      <Tooltip
                        formatter={(v: any, _n: any, p: any) => [`${v}分`, `${p.payload.name}`]}
                        contentStyle={{ fontSize: "12px", padding: "8px 12px" }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* 各目标详情 */}
                <div className="bg-card rounded-lg border border-border p-5">
                  <h4 className="font-medium text-sm mb-4">课程目标达成详情</h4>
                  <div className="space-y-5">
                    {achievements.map(a => (
                      <div key={a.objective.id}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="w-12 h-7 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{a.objective.id}</span>
                            <div>
                              <p className="text-sm font-medium">{a.objective.name}
                                <span className="ml-2 text-xs text-muted-foreground">（{a.objective.category}）</span>
                              </p>
                              <p className="text-xs text-muted-foreground">{a.objective.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{a.score}<span className="text-xs text-muted-foreground">/100</span></p>
                            <Tag color={levelColor[a.level]}>{a.level}</Tag>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                          <div className={`h-2.5 rounded-full ${levelBarColor[a.level]}`} style={{ width: `${a.score}%` }} />
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {a.evidence.map((e, i) => (
                            <span key={i}>· {e}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 支撑章节 */}
                <div className="bg-card rounded-lg border border-border p-5">
                  <h4 className="font-medium text-sm mb-3">课程目标与教学内容支撑关系</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="px-3 py-2 text-left">课程内容</th>
                          {COURSE_OBJECTIVES.map(ct => (
                            <th key={ct.id} className="px-3 py-2 text-center">{ct.id}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: "第1章 概论", cts: ["CT1"] },
                          { name: "第2章 应用层", cts: ["CT1", "CT2", "CT4"] },
                          { name: "第3章 传输层", cts: ["CT1", "CT2", "CT4"] },
                          { name: "第4章 网络层", cts: ["CT1", "CT2", "CT3", "CT4"] },
                          { name: "第5章 链路层与局域网", cts: ["CT1", "CT2", "CT3", "CT4"] },
                          { name: "小班讨论", cts: ["CT4"] },
                          { name: "课程实验", cts: ["CT4"] },
                          { name: "课程设计", cts: ["CT4"] },
                        ].map(row => (
                          <tr key={row.name} className="border-b border-border last:border-0">
                            <td className="px-3 py-2">{row.name}</td>
                            {COURSE_OBJECTIVES.map(ct => (
                              <td key={ct.id} className="px-3 py-2 text-center">
                                {row.cts.includes(ct.id) ? <span className="text-primary">●</span> : <span className="text-muted-foreground/30">○</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === "ai" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "综合评分", value: Math.round((Number(profileData.stats.avgScore) || 0) * 1.1), color: "bg-[#969BE7]/20 text-[#969BE7]", icon: <Award size={16} /> },
                  { label: "学习态度", value: profileData.homeworkRecords.length > 0 ? Math.round((profileData.homeworkRecords.filter(h => h.status === "按时").length / profileData.homeworkRecords.length) * 100) : 0, color: "bg-[#74C2A0]/20 text-[#57AE8F]", icon: <Target size={16} /> },
                  { label: "知识掌握", value: profileData.knowledgeData.length > 0 ? Math.round(profileData.knowledgeData.reduce((sum, k) => sum + k.value, 0) / profileData.knowledgeData.length) : 0, color: "bg-[#969BE7]/20 text-[#969BE7]", icon: <BookOpen size={16} /> },
                  { label: "进步空间", value: 100 - Math.round(Number(profileData.stats.avgScore) || 0), color: "bg-[#F2A56B]/20 text-[#E8945C]", icon: <TrendingUp size={16} /> },
                ].map((stat, i) => (
                  <div key={i} className={`${stat.color} rounded-lg p-3`}>
                    <div className="flex items-center gap-2 mb-1">{stat.icon}<span className="text-xs font-medium">{stat.label}</span></div>
                    <p className="text-xl font-bold">{stat.value}<span className="text-sm font-normal">分</span></p>
                  </div>
                ))}
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Brain size={16} className="text-primary" />
                    <h4 className="font-medium text-sm">AI综合评价报告</h4>
                  </div>
                  <button
                    onClick={handleGenerateAi}
                    disabled={generatingAi}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {generatingAi ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        生成中...
                      </>
                    ) : profileData.aiEvaluation ? (
                      <>
                        <RefreshCw size={14} />
                        更新评价
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        生成AI评价
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-gradient-to-br from-[#969BE7]/10 to-[#969BE7]/5 rounded-lg p-4 border border-[#969BE7]/40 min-h-[120px]">
                  {generatingAi ? (
                    <div className="flex flex-col items-center justify-center py-6 text-[#969BE7]">
                      <div className="w-8 h-8 border-3 border-[#969BE7]/40 border-t-blue-600 rounded-full animate-spin mb-3" />
                      <p className="text-sm">AI正在分析学生数据，生成评价中...</p>
                    </div>
                  ) : profileData.aiEvaluation ? (
                    <p className="text-sm text-[#6E719E] leading-relaxed whitespace-pre-wrap">{profileData.aiEvaluation}</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-[#969BE7]">
                      <Brain size={32} className="mb-2 opacity-50" />
                      <p className="text-sm">点击上方按钮生成AI综合评价</p>
                    </div>
                  )}
                </div>
                {profileData.aiEvaluation && !generatingAi && (
                  <div className="mt-3 flex justify-end">
                    <span className="text-xs text-muted-foreground">
                      上次生成时间：{new Date().toLocaleString('zh-CN')}
                    </span>
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <button onClick={handleExportReport} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">导出评价</button>
                  <button onClick={handleSendAiEvaluation} disabled={sendingNotification || !profileData.aiEvaluation}
                    className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6] disabled:opacity-50 disabled:cursor-not-allowed">
                    {sendingNotification ? "发送中..." : "发送通知"}
                  </button>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-sm">AI学习建议</h4>
                  <button onClick={() => {
                    setEditingSuggestions([...learningSuggestions]);
                    setShowSuggestionEdit(true);
                  }} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                    <Edit2 size={12} />编辑建议
                  </button>
                </div>
                <div className="space-y-3">
                  {learningSuggestions.map((s, i) => (
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
                      {s.type === "weak" && (
                        <button className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20">
                          <Play size={12} />针对性练习
                        </button>
                      )}
                    </div>
                  ))}
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

              <div className="bg-card rounded-lg border border-border p-6">
                <h4 className="font-medium text-sm mb-4">学习行为分析</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground">作业按时提交率</span>
                      <span className="font-medium">{Math.round((profileData.homeworkRecords.filter(h => h.status === "按时").length / profileData.homeworkRecords.length) * 100)}%</span>
                    </div>
                    <div className="bg-muted rounded-full h-2">
                      <div className="bg-[#74C2A0] h-2 rounded-full" style={{ width: `${(profileData.homeworkRecords.filter(h => h.status === "按时").length / profileData.homeworkRecords.length) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground">出勤率</span>
                      <span className="font-medium">{Math.round((profileData.attendanceRecords.filter(a => normalizeAttendanceStatus(a.status) === "出勤").length / profileData.attendanceRecords.length) * 100)}%</span>
                    </div>
                    <div className="bg-muted rounded-full h-2">
                      <div className="bg-[#969BE7] h-2 rounded-full" style={{ width: `${(profileData.attendanceRecords.filter(a => normalizeAttendanceStatus(a.status) === "出勤").length / profileData.attendanceRecords.length) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground">实验完成率</span>
                      <span className="font-medium">100%</span>
                    </div>
                    <div className="bg-muted rounded-full h-2">
                      <div className="bg-[#969BE7] h-2 rounded-full" style={{ width: "100%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground">成绩稳定性</span>
                      <span className="font-medium">稳定</span>
                    </div>
                    <div className="bg-muted rounded-full h-2">
                      <div className="bg-[#F5C069] h-2 rounded-full" style={{ width: "85%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </>}
        </div>
      </div>

      {showSuggestionEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">编辑学习建议</h3>
              <button onClick={() => setShowSuggestionEdit(false)}><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {editingSuggestions.map((s, i) => (
                  <div key={i} className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <select value={s.type} onChange={(e) => {
                        const newSuggestions = [...editingSuggestions];
                        (newSuggestions[i] as any).type = e.target.value;
                        setEditingSuggestions(newSuggestions);
                      }} className="px-2 py-1 text-xs border border-border rounded-md">
                        <option value="strong">优点</option>
                        <option value="weak">薄弱</option>
                        <option value="improve">改进</option>
                      </select>
                      <button onClick={() => {
                        setEditingSuggestions(editingSuggestions.filter((_, idx) => idx !== i));
                      }} className="text-xs text-[#DD7373] hover:text-[#DD7373]">删除</button>
                    </div>
                    <input type="text" value={s.title} onChange={(e) => {
                      const newSuggestions = [...editingSuggestions];
                      newSuggestions[i].title = e.target.value;
                      setEditingSuggestions(newSuggestions);
                    }} className="w-full px-3 py-2 border border-border rounded-md text-sm mb-2" />
                    <textarea value={s.content} onChange={(e) => {
                      const newSuggestions = [...editingSuggestions];
                      newSuggestions[i].content = e.target.value;
                      setEditingSuggestions(newSuggestions);
                    }} className="w-full px-3 py-2 border border-border rounded-md text-sm h-20 resize-none" />
                  </div>
                ))}
                <button onClick={() => {
                  setEditingSuggestions([...editingSuggestions, {
                    type: "improve" as const,
                    title: "新建议",
                    content: "输入建议内容...",
                  }]);
                }} className="w-full py-3 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  + 添加新建议
                </button>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-3">
              <button onClick={() => setShowSuggestionEdit(false)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button
                onClick={async () => {
                  if (!selectedStudentId || !selectedCourseId) return;
                  setSavingSuggestions(true);
                  try {
                    const jsonStr = JSON.stringify(editingSuggestions);
                    setProfile(prev => prev ? { ...prev, aiSuggestions: jsonStr } : null);
                    setShowSuggestionEdit(false);
                    showToastMsg("学习建议已更新");
                  } catch { showToastMsg("保存失败"); }
                  finally { setSavingSuggestions(false); }
                }}
                disabled={savingSuggestions}
                className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6] disabled:opacity-50">
                {savingSuggestions ? "保存中..." : "保存修改"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherStudentProfile;
