import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle, ChevronRight, GitCompare, ChevronLeft, ChevronDown,
  Settings, Brain, Target, AlertTriangle, BookOpen, TrendingUp,
  FileSearch, Sparkles, Activity, ArrowUpRight, ArrowDownRight,
  Users, AlertCircle, Bell, X, Eye, BookMarked, Shield, Building2,
  Calendar, RefreshCw
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie,
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import {
  getDashboardFull, getDashboardOverview, getMyCourses,
  ClassVO, DashboardCharts, DashboardOverview, WarningStudent, ChartItem
} from "../../../services/dashboardService";
import { getAiInsight, AiInsight } from "../../../services/aiChatService";
import {
  getAiDiagnosis, getWarningStudentAnalysis, getKnowledgePrediction,
  getTrendPrediction, getSuggestions, getWarningRadar,
  AiDiagnosis, AiWarningStudentAnalysis, AiKnowledgePrediction,
  AiTrendPrediction, AiSuggestionList, AiWarningRadar
} from "../../../services/aiEngineService";
import { sendNotification } from "../../../services/notificationService";
import { Page } from "../../types";
import { Tag } from "../../utils";
import type { TAPermissions } from "../../../services/taService";
import { PIE_COLORS } from "../../constants";

function TeacherDashboard({ onNav, setSelectedStudentId, setSelectedCourseId, taPermissions }: { onNav: (p: Page) => void; setSelectedStudentId: (id: number | null) => void; setSelectedCourseId: (id: number | null) => void; taPermissions?: TAPermissions | null }) {
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedClassName, setSelectedClassName] = useState<string>("");
  const [viewMode, setViewMode] = useState<"single" | "merged" | "compare">("single");
  const [compareData, setCompareData] = useState<{ className: string; overview: DashboardOverview | null }[]>([]);
  const [warningFilter, setWarningFilter] = useState<string | null>(null);
  const [selectedWarnings, setSelectedWarnings] = useState<number[]>([]);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showAutoWarningModal, setShowAutoWarningModal] = useState(false);
  const [autoWarningConfig, setAutoWarningConfig] = useState({
    attendanceThreshold: 3,
    homeworkThreshold: 2,
    scoreDropThreshold: 10,
    autoSendNotification: true,
    checkFrequency: "daily",
  });
  const [notificationContent, setNotificationContent] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [hiddenModules, setHiddenModules] = useState<string[]>([]);
  const [moduleOrder, setModuleOrder] = useState(["stats", "score-dist", "score-trend", "attendance", "homework", "experiment", "warnings"]);
  const [assessmentType, setAssessmentType] = useState<string | null>(null);

  const typeModuleMap: Record<string, string[]> = {
    homework: ["stats", "homework"],
    test: ["stats", "score-dist", "score-trend", "warnings"],
    experiment: ["stats", "experiment"],
  };

  const isModuleVisible = (moduleId: string) => {
    if (hiddenModules.includes(moduleId)) return false;
    if (!assessmentType) return true;
    if (moduleId === "course-profile") return true;
    const allowedModules = typeModuleMap[assessmentType] || [];
    return allowedModules.includes(moduleId);
  };

  // API data states
  const [dashboardCourses, setDashboardCourses] = useState<ClassVO[]>([]);
  const [dashboardCharts, setDashboardCharts] = useState<DashboardCharts | null>(null);
  const [dashboardOverview, setDashboardOverview] = useState<DashboardOverview | null>(null);
  const [dashboardWarnings, setDashboardWarnings] = useState<WarningStudent[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<AiInsight | null>(null);
  // AI引擎融合数据
  const [aiDiagnosis, setAiDiagnosis] = useState<AiDiagnosis | null>(null);
  const [aiWarningStudents, setAiWarningStudents] = useState<AiWarningStudentAnalysis[]>([]);
  const [aiKnowledgePrediction, setAiKnowledgePrediction] = useState<AiKnowledgePrediction | null>(null);
  const [aiTrendPrediction, setAiTrendPrediction] = useState<AiTrendPrediction | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestionList | null>(null);
  const [aiWarningRadar, setAiWarningRadar] = useState<AiWarningRadar | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeAiTab, setActiveAiTab] = useState<"diagnosis" | "warning" | "knowledge" | "trend">("diagnosis");

  // Fetch courses on mount
  useEffect(() => {
    getMyCourses().then(courses => {
      setDashboardCourses(courses || []);
    }).catch(() => {
      setDashboardCourses([]);
    });
  }, []);

  // 助教端：仅显示有权限的班级
  const visibleCourses = useMemo(() => {
    if (!taPermissions) return dashboardCourses;
    return dashboardCourses.filter(c => taPermissions.allowedClasses.includes(c.id));
  }, [dashboardCourses, taPermissions]);

  // Fetch dashboard data when class is selected
  useEffect(() => {
    if (!selectedClass) return;
    setDataLoading(true);
    getDashboardFull(selectedClass, selectedClassName || undefined).then(data => {
      setDashboardOverview(data.overview);
      setDashboardCharts(data.charts);
      setDashboardWarnings(data.warnings);
    }).catch(() => {
      setDashboardOverview(null);
      setDashboardCharts(null);
      setDashboardWarnings([]);
    }).finally(() => setDataLoading(false));

    // 获取AI洞察播报
    getAiInsight(selectedClass).then(insight => {
      setAiInsight(insight);
    }).catch(() => {
      setAiInsight(null);
    });

    // 获取AI引擎数据（并行请求）
    setAiLoading(true);
    Promise.allSettled([
      getAiDiagnosis(selectedClass),
      getWarningStudentAnalysis(selectedClass),
      getKnowledgePrediction(selectedClass),
      getTrendPrediction(selectedClass),
      getSuggestions(selectedClass),
      getWarningRadar(selectedClass),
    ]).then(([diagRes, warnRes, knowRes, trendRes, sugRes, radarRes]) => {
      setAiDiagnosis(diagRes.status === 'fulfilled' ? diagRes.value : null);
      setAiWarningStudents(warnRes.status === 'fulfilled' ? warnRes.value : []);
      setAiKnowledgePrediction(knowRes.status === 'fulfilled' ? knowRes.value : null);
      setAiTrendPrediction(trendRes.status === 'fulfilled' ? trendRes.value : null);
      setAiSuggestions(sugRes.status === 'fulfilled' ? sugRes.value : null);
      setAiWarningRadar(radarRes.status === 'fulfilled' ? radarRes.value : null);
    }).finally(() => setAiLoading(false));
  }, [selectedClass, selectedClassName]);

  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  const toggleWarningSelection = (studentId: number) => {
    setSelectedWarnings(prev =>
      prev.includes(studentId) ? prev.filter(w => w !== studentId) : [...prev, studentId]
    );
  };

  const classInfo = visibleCourses.find(c => c.id === selectedClass);
  const currentCharts = dashboardCharts;
  const currentOverview = dashboardOverview;
  const currentWarnings = dashboardWarnings;
  const warningCount = currentWarnings.filter(w => warningFilter ? w.warningType === warningFilter : true).length;
  const filteredWarnings = currentWarnings.filter(w => warningFilter ? w.warningType === warningFilter : true);

  const warningTypeLabel = (t?: string) => ({
    ATTENDANCE: "考勤异常",
    KP_WEAK: "知识点薄弱",
    SCORE_DROP: "成绩下滑",
    HOMEWORK: "作业未交",
  } as Record<string, string>)[t || ""] || t || "—";

  const severityLabel = (s?: string) => ({
    HIGH: "高",
    MEDIUM: "中",
    LOW: "低",
  } as Record<string, string>)[s || ""] || s || "—";

  /** 当前课程下的全部行政班；班级对比不再错误地跨课程取数。 */
  const comparisonClassNames = useMemo(
    () => (classInfo?.classNames || []).filter(Boolean),
    [classInfo?.classNames?.join("|")]
  );

  const handleSendNotification = async () => {
    if (!notificationContent.trim()) { alert("请输入通知内容"); return; }
    try {
      await sendNotification({ title: "教学预警通知", content: notificationContent, courseId: selectedClass || undefined });
      setShowNotificationModal(false);
      setNotificationContent("");
      setSelectedWarnings([]);
      showToastMsg("通知已发送");
    } catch {
      showToastMsg("发送失败，请重试");
    }
  };

  const toggleModuleVisibility = (module: string) => {
    setHiddenModules(prev => prev.includes(module) ? prev.filter(m => m !== module) : [...prev, module]);
  };

  // 班级对比：对同一课程的每个班级分别加载真实概览与考核趋势。
  const [compareTrends, setCompareTrends] = useState<Record<string, ChartItem[]>>({});
  useEffect(() => {
    if (viewMode !== "compare" || !selectedClass || comparisonClassNames.length === 0) {
      setCompareData([]);
      setCompareTrends({});
      return;
    }
    Promise.all(comparisonClassNames.map(async className => {
      const data = await getDashboardFull(selectedClass, className);
      return { className, overview: data.overview, trend: data.charts?.scoreTrend || [] };
    })).then(rows => {
      setCompareData(rows.map(({ className, overview }) => ({ className, overview })));
      setCompareTrends(Object.fromEntries(rows.map(({ className, trend }) => [className, trend])));
    }).catch(() => {
      setCompareData([]);
      setCompareTrends({});
    });
  }, [viewMode, selectedClass, comparisonClassNames.join("|")]);

  // 同一场考核为一个横坐标，全部班级各一条真实成绩曲线。
  const compareScoreData = useMemo(() => {
    const examNames = new Set<string>();
    comparisonClassNames.forEach(className => {
      (compareTrends[className] || []).forEach(item => examNames.add(item.name));
    });
    return Array.from(examNames).map(exam => {
      const row: Record<string, string | number | null> = { exam };
      comparisonClassNames.forEach(className => {
        row[className] = (compareTrends[className] || []).find(item => item.name === exam)?.value ?? null;
      });
      return row;
    });
  }, [comparisonClassNames, compareTrends]);

  const compareMetricData = compareData.map(({ className, overview }) => ({
    className,
    averageScore: Number(overview?.averageScore || 0),
    attendanceRate: Number(overview?.attendanceRate || 0),
    homeworkRate: Number(overview?.homeworkRate || 0),
  }));
  const compareColors = ["#1A56DB", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      {selectedClass === null ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">教学驾驶舱</h2>
              <p className="text-sm text-muted-foreground mt-1">选择班级查看详细数据</p>
            </div>
            <button onClick={() => setViewMode("compare")} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-accent">
              <GitCompare size={14} />班级对比
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleCourses.map(c => {
              const warningCount = dashboardWarnings.length;
              return (
                <div key={c.id} onClick={() => { setSelectedClass(c.id); }}
                  className="bg-card rounded-xl border border-border p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-base">{c.courseName || c.className}</h3>
                      {c.courseNo && (
                        <p className="text-xs text-muted-foreground mt-1">课程编号：{c.courseNo}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{c.semester}</p>
                    </div>
                    {warningCount > 0 && (
                      <span className="px-2 py-1 bg-[#E88383]/25 text-[#DD7373] text-xs font-medium rounded-full">{warningCount} 预警</span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <p className="font-mono font-bold text-primary">{c.studentCount || 0}</p>
                      <p className="text-xs text-muted-foreground">人数</p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono font-bold text-[#57AE8F]">{c.avgScore != null && c.avgScore > 0 ? Number(c.avgScore).toFixed(1) : "—"}</p>
                      <p className="text-xs text-muted-foreground">平均分</p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono font-bold text-[#969BE7]">{c.attendanceRate != null && c.attendanceRate > 0 ? Number(c.attendanceRate).toFixed(1) + "%" : "—"}</p>
                      <p className="text-xs text-muted-foreground">出勤率</p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono font-bold text-[#57AE8F]">{c.homeworkRate != null && c.homeworkRate > 0 ? Number(c.homeworkRate).toFixed(1) + "%" : "—"}</p>
                      <p className="text-xs text-muted-foreground">作业率</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">点击查看详情</span>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedClass(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
                <ChevronLeft size={16} />返回课程列表
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{classInfo?.courseName || "课程详情"}</span>
                {(classInfo?.classNames?.length || 0) > 0 && (
                  <div className="relative">
                    <select value={selectedClassName} onChange={e => setSelectedClassName(e.target.value)}
                      className="appearance-none bg-card border border-border px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer hover:bg-accent transition-colors">
                      {classInfo!.classNames!.map(cn => (
                        <option key={cn} value={cn}>{cn}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>
                )}
                <div className="flex bg-card border border-border rounded-lg p-0.5">
                  <button onClick={() => setViewMode("single")}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${viewMode === "single" ? "bg-primary text-white" : "text-muted-foreground hover:text-[#7F84D6]"}`}>
                    单班查看
                  </button>
                  <button onClick={() => setViewMode("compare")}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${viewMode === "compare" ? "bg-primary text-white" : "text-muted-foreground hover:text-[#7F84D6]"}`}>
                    班级对比
                  </button>
                </div>
                <div className="flex bg-card border border-border rounded-lg p-0.5 ml-2">
                  <button onClick={() => setAssessmentType(null)}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${!assessmentType ? "bg-primary text-white" : "text-muted-foreground hover:text-[#7F84D6]"}`}>
                    全部类型
                  </button>
                  <button onClick={() => setAssessmentType("homework")}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${assessmentType === "homework" ? "bg-primary text-white" : "text-muted-foreground hover:text-[#7F84D6]"}`}>
                    作业
                  </button>
                  <button onClick={() => setAssessmentType("test")}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${assessmentType === "test" ? "bg-primary text-white" : "text-muted-foreground hover:text-[#7F84D6]"}`}>
                    测试
                  </button>
                  <button onClick={() => setAssessmentType("experiment")}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${assessmentType === "experiment" ? "bg-primary text-white" : "text-muted-foreground hover:text-[#7F84D6]"}`}>
                    实验
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {classInfo && viewMode !== "compare" && (
                <span className="text-sm text-muted-foreground">
                  {classInfo.semester}{selectedClassName ? ` · ${selectedClassName}` : ""} · {classInfo.courseName}
                </span>
              )}
              <button onClick={() => setShowCustomizeModal(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-accent">
                <Settings size={14} />布局设置
              </button>
            </div>
          </div>

          {viewMode === "compare" ? (
            <div className="space-y-4">
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="font-medium text-sm mb-1">班级成绩趋势对比</h3>
                <p className="text-xs text-muted-foreground mb-4">当前课程全部 {comparisonClassNames.length} 个班级，按每次考核的平均成绩对比</p>
                {compareScoreData.length > 0 ? <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={compareScoreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="exam" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    {comparisonClassNames.map((className, index) => <Line key={className} type="monotone" dataKey={className} stroke={compareColors[index % compareColors.length]} strokeWidth={2} dot={{ r: 4 }} name={className} connectNulls />)}
                  </LineChart>
                </ResponsiveContainer> : <p className="py-20 text-center text-sm text-muted-foreground">暂无可对比的考核成绩数据</p>}
              </div>
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="font-medium text-sm mb-1">班级学习指标对比</h3>
                <p className="text-xs text-muted-foreground mb-4">平均成绩、出勤率和作业提交率均来自当前课程的各班真实记录</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={compareMetricData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="className" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="averageScore" fill="#1A56DB" name="平均成绩" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="attendanceRate" fill="#10B981" name="出勤率" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="homeworkRate" fill="#F59E0B" name="作业提交率" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <>
              {isModuleVisible("stats") && (
                <>
                  {/* AI播报区域 */}
                  {aiInsight && (
                    <div className={`rounded-lg border p-4 mb-4 ${
                      aiInsight.urgency === 'URGENT' ? 'bg-red-50 border-red-200' :
                      aiInsight.urgency === 'IMPORTANT' ? 'bg-orange-50 border-orange-200' :
                      'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          aiInsight.urgency === 'URGENT' ? 'bg-red-100' :
                          aiInsight.urgency === 'IMPORTANT' ? 'bg-orange-100' :
                          'bg-blue-100'
                        }`}>
                          <Brain size={20} className={
                            aiInsight.urgency === 'URGENT' ? 'text-red-600' :
                            aiInsight.urgency === 'IMPORTANT' ? 'text-orange-600' :
                            'text-blue-600'
                          } />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-foreground">AI助教播报</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              aiInsight.urgency === 'URGENT' ? 'bg-red-200 text-red-700' :
                              aiInsight.urgency === 'IMPORTANT' ? 'bg-orange-200 text-orange-700' :
                              'bg-blue-200 text-blue-700'
                            }`}>
                              {aiInsight.urgency === 'URGENT' ? '紧急' : aiInsight.urgency === 'IMPORTANT' ? '重要' : '正常'}
                            </span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">{aiInsight.broadcast}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { label: "班级人数", value: currentOverview?.studentCount ?? classInfo?.studentCount ?? 0, icon: Users, color: "blue" },
                      { label: "平均成绩", value: currentOverview?.averageScore != null ? Number(currentOverview.averageScore).toFixed(1) : "—", icon: TrendingUp, color: "green" },
                      { label: "出勤率", value: currentOverview?.attendanceRate != null ? Number(currentOverview.attendanceRate).toFixed(1) + "%" : "—", icon: Activity, color: "blue" },
                      { label: "作业提交率", value: currentOverview?.homeworkRate != null ? Number(currentOverview.homeworkRate).toFixed(1) + "%" : "—", icon: CheckCircle, color: "green" },
                      { label: "预警人数", value: warningCount.toString(), icon: AlertCircle, color: "red", highlight: warningCount > 0 },
                    ].map(item => {
                      // 获取AI点评
                      const aiComment = aiInsight?.metricComments?.find(c => c.metricName === item.label);
                      return (
                        <div key={item.label} className={`bg-card rounded-lg border border-border p-4 transition-all duration-200 hover:shadow-md ${item.highlight ? "border-red-200 bg-red-50/50" : ""}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color === "red" ? "bg-red-100" : item.color === "green" ? "bg-green-100" : "bg-blue-100"}`}>
                              <item.icon size={16} className={item.color === "red" ? "text-red-600" : item.color === "green" ? "text-green-600" : "text-blue-600"} />
                            </div>
                            {item.highlight && <span className="text-xs text-red-600 font-medium">点击查看</span>}
                          </div>
                          <p className={`font-mono text-xl font-bold ${item.highlight ? "text-red-600" : "text-primary"}`}>{item.value}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                          {/* AI点评 */}
                          {aiComment && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              <div className="flex items-center gap-1 mb-1">
                                <Brain size={10} className="text-blue-500" />
                                <span className="text-[10px] text-blue-600 font-medium">AI点评</span>
                                {aiComment.trend && (
                                  <span className="ml-auto">
                                    {aiComment.trend === 'UP' && <ArrowUpRight size={12} className="text-green-500" />}
                                    {aiComment.trend === 'DOWN' && <ArrowDownRight size={12} className="text-red-500" />}
                                    {aiComment.trend === 'STABLE' && <Activity size={12} className="text-gray-500" />}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-tight">{aiComment.comment}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* 重点关注学生（预警学生突出展示） */}
              {warningCount > 0 && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200/60 p-5 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                        <AlertTriangle size={16} className="text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-red-900">重点关注学生</h3>
                        <p className="text-xs text-red-600/80">共 {warningCount} 名学生需要关注</p>
                      </div>
                    </div>
                    <span className="text-xs text-red-600 font-medium px-2 py-1 bg-red-100 rounded-full">
                      {warningCount} 人
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredWarnings.slice(0, 6).map(w => (
                      <div key={w.studentId}
                        onClick={() => { setSelectedStudentId(w.studentId); setSelectedCourseId(selectedClass); onNav("teacher-profile"); }}
                        className={`bg-white/80 backdrop-blur rounded-lg border p-3 cursor-pointer hover:shadow-md hover:border-red-300 transition-all ${
                          w.severity === "HIGH" ? "border-red-300" : w.severity === "MEDIUM" ? "border-orange-200" : "border-yellow-200"
                        }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                              w.severity === "HIGH" ? "bg-red-500" : w.severity === "MEDIUM" ? "bg-orange-400" : "bg-yellow-400"
                            }`}>
                              {w.name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{w.name || "未知"}</p>
                              <p className="text-[11px] text-muted-foreground font-mono">{w.studentNo || "—"}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            w.severity === "HIGH" ? "bg-red-100 text-red-700" : w.severity === "MEDIUM" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {severityLabel(w.severity)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Tag color={w.warningType === "ATTENDANCE" ? "orange" : w.warningType === "KP_WEAK" ? "yellow" : w.warningType === "SCORE_DROP" ? "red" : "gray"}>
                            {warningTypeLabel(w.warningType)}
                          </Tag>
                          {w.warningMsg && (
                            <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">{w.warningMsg}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {filteredWarnings.length > 6 && (
                    <p className="text-xs text-muted-foreground text-center mt-3">还有 {filteredWarnings.length - 6} 名学生，请查看下方预警学生列表</p>
                  )}
                </div>
              )}

              {/* AI引擎融合区域 - 4大功能 */}
              {!assessmentType && (
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-200/50 p-5 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ${aiLoading ? 'animate-pulse' : ''}`}>
                        <Brain size={16} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">AI智能分析中心</h3>
                        <p className="text-xs text-gray-500">
                          {aiLoading ? 'AI正在深度分析教学数据...' :
                           !selectedClass ? 'AI已就绪，等待分析教学数据...' :
                           !aiDiagnosis && !aiKnowledgePrediction && aiWarningStudents.length === 0 ? 'AI准备分析教学数据...' :
                           '基于大模型的教学数据深度分析'}
                        </p>
                      </div>
                    </div>
                    {(aiLoading || !selectedClass) && (
                      <div className="flex items-center gap-1.5 text-xs text-blue-600">
                        <div className="flex gap-0.5">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <span>{aiLoading ? '思考中' : '待命中'}</span>
                      </div>
                    )}
                  </div>

                  {/* Tab切换 */}
                  <div className="flex gap-1 mb-4 bg-white/60 rounded-lg p-1">
                    {[
                      { key: "diagnosis" as const, label: "AI智能诊断", icon: Target },
                      { key: "warning" as const, label: "预警学生分析", icon: AlertTriangle },
                      { key: "knowledge" as const, label: "知识点预测", icon: BookOpen },
                      { key: "trend" as const, label: "趋势预测", icon: TrendingUp },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveAiTab(tab.key)}
                        disabled={aiLoading}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md transition-all ${
                          aiLoading ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          activeAiTab === tab.key
                            ? "bg-white text-blue-600 shadow-sm font-medium"
                            : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                        }`}
                      >
                        <tab.icon size={14} />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab内容 */}
                  <div className="bg-white rounded-lg p-4 min-h-[200px]">
                    {/* 未选择班级 - AI待命状态 */}
                    {!selectedClass && (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="relative mb-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                            <Brain size={32} className="text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">AI助教已就绪</p>
                        <p className="text-xs text-gray-500 text-center">请选择班级，AI将为您深度分析教学数据</p>
                        <div className="mt-4 flex items-center gap-2 text-xs text-blue-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span>待命中</span>
                        </div>
                      </div>
                    )}

                    {/* 加载状态 - AI思考动画 */}
                    {selectedClass && aiLoading && (
                      <div className="space-y-4">
                        {/* AI思考动画 - 增强版 */}
                        <div className="flex flex-col items-center justify-center py-6">
                          {/* 大脑图标 + 旋转光环 */}
                          <div className="relative mb-4">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center animate-pulse">
                              <Brain size={40} className="text-white" />
                            </div>
                            {/* 旋转的光环 */}
                            <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-blue-400 border-r-indigo-400 animate-spin"></div>
                            {/* 脉冲波纹 */}
                            <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-blue-400 animate-ping opacity-50"></div>
                          </div>

                          {/* 进度条 */}
                          <div className="w-full max-w-md mb-4">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>AI分析进度</span>
                              <span className="text-blue-600 font-medium">深度分析中...</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                            </div>
                          </div>

                          {/* 思考步骤 */}
                          <div className="space-y-2 w-full max-w-md">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                              </div>
                              <span className="flex-1">正在分析学生成绩分布...</span>
                              <span className="text-blue-500 text-[10px]">✓</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: '200ms' }}></div>
                              </div>
                              <span className="flex-1">正在识别预警学生特征...</span>
                              <span className="text-indigo-500 text-[10px]">✓</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '400ms' }}></div>
                              </div>
                              <span className="flex-1">正在预测知识点掌握情况...</span>
                              <span className="text-purple-500 text-[10px]">✓</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                                <div className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" style={{ animationDelay: '600ms' }}></div>
                              </div>
                              <span className="flex-1">正在生成个性化教学建议...</span>
                              <span className="text-pink-500 text-[10px]">✓</span>
                            </div>
                          </div>

                          {/* 思考提示 */}
                          <div className="mt-4 px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-xs text-blue-700 text-center">
                              <span className="inline-block animate-pulse mr-1">💡</span>
                              AI正在综合分析多维度数据，请稍候...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* AI智能诊断 */}
                    {activeAiTab === "diagnosis" && aiDiagnosis && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            aiDiagnosis.urgency === 'URGENT' ? 'bg-red-100' :
                            aiDiagnosis.urgency === 'IMPORTANT' ? 'bg-orange-100' : 'bg-green-100'
                          }`}>
                            <Target size={20} className={
                              aiDiagnosis.urgency === 'URGENT' ? 'text-red-600' :
                              aiDiagnosis.urgency === 'IMPORTANT' ? 'text-orange-600' : 'text-green-600'
                            } />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold">AI诊断结论</span>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                aiDiagnosis.urgency === 'URGENT' ? 'bg-red-100 text-red-700' :
                                aiDiagnosis.urgency === 'IMPORTANT' ? 'bg-orange-100 text-orange-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {aiDiagnosis.urgency === 'URGENT' ? '紧急' : aiDiagnosis.urgency === 'IMPORTANT' ? '重要' : '正常'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{aiDiagnosis.summary}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                          <div className="bg-blue-50/50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 mb-2">
                              <FileSearch size={14} className="text-blue-600" />
                              <span className="text-xs font-medium text-blue-900">关键发现</span>
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed">{aiDiagnosis.keyFindings}</p>
                          </div>
                          <div className="bg-green-50/50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Sparkles size={14} className="text-green-600" />
                              <span className="text-xs font-medium text-green-900">改进方向</span>
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed">{aiDiagnosis.improvementDirection}</p>
                          </div>
                        </div>
                        {/* AI教学建议 */}
                        {aiSuggestions && aiSuggestions.suggestions.length > 0 && (
                          <div className="pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Brain size={14} className="text-indigo-600" />
                              <span className="text-xs font-medium text-indigo-900">AI个性化建议</span>
                            </div>
                            <div className="space-y-2">
                              {aiSuggestions.suggestions.slice(0, 3).map((sug, i) => (
                                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${
                                  sug.priority === 'HIGH' ? 'bg-red-50/50' : sug.priority === 'MEDIUM' ? 'bg-orange-50/50' : 'bg-gray-50/50'
                                }`}>
                                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                                    sug.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                                    sug.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {sug.priority === 'HIGH' ? '高优' : sug.priority === 'MEDIUM' ? '中优' : '低优'}
                                  </span>
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-900">{sug.title}</p>
                                    <p className="text-[11px] text-gray-600 mt-0.5">{sug.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 预警学生深度分析 */}
                    {activeAiTab === "warning" && (
                      <div className="space-y-3">
                        {aiWarningStudents.length > 0 ? (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle size={14} className="text-orange-600" />
                              <span className="text-xs font-medium text-gray-900">AI对每位预警学生生成个性化干预方案</span>
                            </div>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                              {aiWarningStudents.map((student, i) => (
                                <div key={i} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">{student.studentName}</span>
                                      <span className="text-xs text-gray-500">{student.studentNo}</span>
                                    </div>
                                    <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                                      成绩 {student.score?.toFixed(1) || '—'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-600 mb-2">
                                    <span className="font-medium text-gray-900">预警原因：</span>{student.warningReason}
                                  </div>
                                  <div className="bg-blue-50/50 rounded-lg p-2.5 mb-2">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <Brain size={12} className="text-blue-600" />
                                      <span className="text-[11px] font-medium text-blue-900">AI问题分析</span>
                                    </div>
                                    <p className="text-xs text-gray-700 leading-relaxed">{student.aiProblemAnalysis}</p>
                                  </div>
                                  <div className="bg-green-50/50 rounded-lg p-2.5">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <Sparkles size={12} className="text-green-600" />
                                      <span className="text-[11px] font-medium text-green-900">AI干预方案</span>
                                    </div>
                                    <ul className="space-y-1">
                                      {student.interventionPlans?.map((plan, j) => (
                                        <li key={j} className="text-xs text-gray-700 flex items-start gap-1.5">
                                          <span className="text-green-600 mt-0.5">•</span>
                                          {plan}
                                        </li>
                                      ))}
                                    </ul>
                                    {student.estimatedRecovery && (
                                      <p className="text-[11px] text-gray-500 mt-2 pt-2 border-t border-green-100">
                                        预计恢复周期：{student.estimatedRecovery}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                            <p className="text-sm text-gray-600">当前无预警学生</p>
                            <p className="text-xs text-gray-400 mt-1">班级整体学习状态良好</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 知识点掌握预测 */}
                    {activeAiTab === "knowledge" && aiKnowledgePrediction && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BookOpen size={14} className="text-purple-600" />
                            <span className="text-xs font-medium text-gray-900">AI基于历史数据预测难点</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-gray-600">建议增加 <span className="font-semibold text-purple-600">{aiKnowledgePrediction.suggestedExtraHours}</span> 课时</span>
                            <span className="text-gray-600">预测掌握率 <span className="font-semibold text-green-600">{aiKnowledgePrediction.predictedMasteryRate?.toFixed(0)}%</span></span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {aiKnowledgePrediction.difficultPoints?.map((kp, i) => (
                            <div key={i} className="border border-gray-200 rounded-lg p-3 hover:border-purple-300 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{kp.name}</span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  kp.difficultyLevel === 'VERY_HARD' ? 'bg-red-100 text-red-700' :
                                  kp.difficultyLevel === 'HARD' ? 'bg-orange-100 text-orange-700' :
                                  kp.difficultyLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {kp.difficultyLevel === 'VERY_HARD' ? '极难' : kp.difficultyLevel === 'HARD' ? '困难' : kp.difficultyLevel === 'MEDIUM' ? '中等' : '简单'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-gray-500">当前掌握率</span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      kp.currentMastery >= 80 ? 'bg-green-500' :
                                      kp.currentMastery >= 60 ? 'bg-blue-500' :
                                      kp.currentMastery >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${kp.currentMastery}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium">{kp.currentMastery?.toFixed(0)}%</span>
                              </div>
                              <div className="bg-purple-50/50 rounded p-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <Brain size={10} className="text-purple-600" />
                                  <span className="text-[10px] font-medium text-purple-900">AI分析</span>
                                </div>
                                <p className="text-[11px] text-gray-700 leading-relaxed">{kp.aiAnalysis}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {aiKnowledgePrediction.aiTeachingSuggestion && (
                          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 border border-purple-100">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Sparkles size={12} className="text-purple-600" />
                              <span className="text-xs font-medium text-purple-900">AI教学调整建议</span>
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed">{aiKnowledgePrediction.aiTeachingSuggestion}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 趋势预测 */}
                    {activeAiTab === "trend" && aiTrendPrediction && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp size={14} className="text-blue-600" />
                            <span className="text-xs font-medium text-gray-900">AI预测成绩趋势</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              aiTrendPrediction.trendDirection === 'UP' ? 'bg-green-100 text-green-700' :
                              aiTrendPrediction.trendDirection === 'DOWN' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {aiTrendPrediction.trendDirection === 'UP' ? '上升趋势' :
                               aiTrendPrediction.trendDirection === 'DOWN' ? '下降趋势' : '保持稳定'}
                            </span>
                            <span className="text-xs text-gray-500">预测准确率 {aiTrendPrediction.predictionAccuracy?.toFixed(0)}%</span>
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={[
                            ...(aiTrendPrediction.historicalData || []).map(d => ({ timePoint: d.timePoint, 历史数据: d.value })),
                            ...(aiTrendPrediction.predictionData || []).map(d => ({ timePoint: d.timePoint, AI预测: d.value })),
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="timePoint" tick={{ fontSize: 10 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Line name="历史数据" dataKey="历史数据" stroke="#1A56DB" strokeWidth={2} dot={{ r: 3 }} />
                            <Line name="AI预测" dataKey="AI预测" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-0.5 bg-blue-600"></span>
                            <span>实线 = 历史实际数据</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-0.5 bg-purple-600 border-dashed"></span>
                            <span>虚线 = AI预测趋势</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 加载状态 */}
                    {aiLoading && (
                      <div className="flex flex-col items-center justify-center py-12">
                        <RefreshCw size={24} className="animate-spin text-blue-500 mb-3" />
                        <p className="text-sm text-gray-600">AI正在分析教学数据...</p>
                        <p className="text-xs text-gray-400 mt-1">请稍候，大模型正在生成个性化建议</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className={`grid gap-4 ${assessmentType ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
                {isModuleVisible("score-dist") && (
                  <div className="bg-card rounded-lg border border-border p-5">
                    <h3 className="font-medium text-sm mb-4">班级成绩分布图</h3>
                    {assessmentType === "test" ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={currentCharts?.scoreDistribution || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: any) => `${v}人`} />
                            <Bar dataKey="value" fill="#969BE7" radius={[2, 2, 0, 0]} name="人数" />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="overflow-auto max-h-[220px]">
                          <table className="w-full text-sm">
                            <thead className="text-xs text-muted-foreground bg-muted/30 sticky top-0">
                              <tr>
                                <th className="text-left font-medium py-2 px-2">分数段</th>
                                <th className="text-center font-medium py-2 px-2">人数</th>
                                <th className="text-center font-medium py-2 px-2">占比</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(currentCharts?.scoreDistribution || []).map((item, i) => {
                                const total = (currentCharts?.scoreDistribution || []).reduce((sum, x) => sum + (x.value || 0), 0);
                                const pct = total > 0 ? ((item.value || 0) / total * 100).toFixed(1) : "0";
                                return (
                                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                                    <td className="py-2 px-2 font-medium">{item.name}</td>
                                    <td className="text-center py-2 px-2 text-primary">{item.value}</td>
                                    <td className="text-center py-2 px-2 text-muted-foreground">{pct}%</td>
                                  </tr>
                                );
                              })}
                              {(currentCharts?.scoreDistribution || []).length === 0 && (
                                <tr>
                                  <td colSpan={3} className="text-center py-8 text-muted-foreground text-xs">暂无成绩数据</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={currentCharts?.scoreDistribution || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: any) => `${v}人`} />
                          <Bar dataKey="value" fill="#969BE7" radius={[2, 2, 0, 0]} name="人数" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
                {isModuleVisible("score-trend") && (
                  <div className="bg-card rounded-lg border border-border p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-sm">成绩趋势图</h3>
                    </div>
                    {assessmentType === "test" ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={currentCharts?.scoreTrend || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: any) => `${v}分`} />
                            <Line type="monotone" dataKey="value" stroke="#969BE7" strokeWidth={2} dot={{ r: 4 }} name="班级平均分" />
                          </LineChart>
                        </ResponsiveContainer>
                        <div className="overflow-auto max-h-[220px]">
                          <table className="w-full text-sm">
                            <thead className="text-xs text-muted-foreground bg-muted/30 sticky top-0">
                              <tr>
                                <th className="text-left font-medium py-2 px-2">考核名称</th>
                                <th className="text-center font-medium py-2 px-2">平均分</th>
                                <th className="text-center font-medium py-2 px-2">排名</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(currentCharts?.scoreTrend || []).map((item, i) => {
                                const sorted = [...(currentCharts?.scoreTrend || [])].sort((a, b) => (b.value || 0) - (a.value || 0));
                                const rank = sorted.findIndex(s => s.name === item.name) + 1;
                                return (
                                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                                    <td className="py-2 px-2 font-medium">{item.name}</td>
                                    <td className="text-center py-2 px-2 text-primary font-mono">{item.value}</td>
                                    <td className="text-center py-2 px-2">
                                      <span className={`px-2 py-0.5 text-xs rounded-full ${rank <= 3 ? "bg-[#74C2A0]/25 text-[#57AE8F]" : "bg-muted text-muted-foreground"}`}>
                                        第{rank}名
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                              {(currentCharts?.scoreTrend || []).length === 0 && (
                                <tr>
                                  <td colSpan={3} className="text-center py-8 text-muted-foreground text-xs">暂无成绩数据</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={currentCharts?.scoreTrend || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: any) => `${v}分`} />
                          <Line type="monotone" dataKey="value" stroke="#969BE7" strokeWidth={2} dot={{ r: 4 }} name="班级平均分" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
              </div>

              <div className={`grid gap-4 ${assessmentType ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
                {isModuleVisible("attendance") && (
                  <div className="bg-card rounded-lg border border-border p-5">
                    <h3 className="font-medium text-sm mb-4">考勤统计</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={currentCharts?.attendanceStats || []} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                          {(currentCharts?.attendanceStats || []).map((entry, i) => (
                            <Cell key={`cell-${i}`} fill={entry.color || PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => `${v}次`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {isModuleVisible("homework") && (
                  <div className="bg-card rounded-lg border border-border p-5">
                    <h3 className="font-medium text-sm mb-4">作业提交统计</h3>
                    {assessmentType === "homework" ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={currentCharts?.homeworkStats || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="homeworkName" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="onTimeCount" fill="#8FD0B8" name="按时" />
                            <Bar dataKey="lateCount" fill="#F5D5A8" name="迟交" />
                            <Bar dataKey="absentCount" fill="#E8909A" name="未交" />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="overflow-auto max-h-[200px]">
                          <table className="w-full text-sm">
                            <thead className="text-xs text-muted-foreground bg-muted/30 sticky top-0">
                              <tr>
                                <th className="text-left font-medium py-2 px-2">作业名称</th>
                                <th className="text-center font-medium py-2 px-2">按时</th>
                                <th className="text-center font-medium py-2 px-2">迟交</th>
                                <th className="text-center font-medium py-2 px-2">未交</th>
                                <th className="text-center font-medium py-2 px-2">提交率</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(currentCharts?.homeworkStats || []).map((hw, i) => {
                                const total = hw.onTimeCount + hw.lateCount + hw.absentCount;
                                const rate = total > 0 ? ((hw.onTimeCount + hw.lateCount) / total * 100).toFixed(1) : "0";
                                return (
                                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                                    <td className="py-2 px-2 font-medium">{hw.homeworkName}</td>
                                    <td className="text-center py-2 px-2 text-[#57AE8F]">{hw.onTimeCount}</td>
                                    <td className="text-center py-2 px-2 text-[#C972A8]">{hw.lateCount}</td>
                                    <td className="text-center py-2 px-2 text-[#DD7373]">{hw.absentCount}</td>
                                    <td className="text-center py-2 px-2 font-medium">{rate}%</td>
                                  </tr>
                                );
                              })}
                              {(currentCharts?.homeworkStats || []).length === 0 && (
                                <tr>
                                  <td colSpan={5} className="text-center py-8 text-muted-foreground text-xs">暂无作业数据</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={currentCharts?.homeworkStats || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="homeworkName" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="onTimeCount" fill="#8FD0B8" name="按时" />
                          <Bar dataKey="lateCount" fill="#F5D5A8" name="迟交" />
                          <Bar dataKey="absentCount" fill="#E8909A" name="未交" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
                {isModuleVisible("experiment") && (
                  <div className="bg-card rounded-lg border border-border p-5">
                    <h3 className="font-medium text-sm mb-4">实验报告统计</h3>
                    {assessmentType === "experiment" ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={currentCharts?.experimentStats || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="experimentName" tick={{ fontSize: 10 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: any) => `${v}分`} />
                            <Legend />
                            <Bar dataKey="avgScore" fill="#969BE7" name="平均分" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="overflow-auto max-h-[200px]">
                          <table className="w-full text-sm">
                            <thead className="text-xs text-muted-foreground bg-muted/30 sticky top-0">
                              <tr>
                                <th className="text-left font-medium py-2 px-2">实验名称</th>
                                <th className="text-center font-medium py-2 px-2">平均分</th>
                                <th className="text-center font-medium py-2 px-2">提交率</th>
                                <th className="text-center font-medium py-2 px-2">提交/总数</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(currentCharts?.experimentStats || []).map((exp, i) => (
                                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                                  <td className="py-2 px-2 font-medium">{exp.experimentName}</td>
                                  <td className="text-center py-2 px-2 text-[#969BE7] font-mono">{exp.avgScore}</td>
                                  <td className="text-center py-2 px-2 font-medium">{exp.submitRate}%</td>
                                  <td className="text-center py-2 px-2 text-muted-foreground text-xs">{exp.submittedCount}/{exp.totalCount}</td>
                                </tr>
                              ))}
                              {(currentCharts?.experimentStats || []).length === 0 && (
                                <tr>
                                  <td colSpan={4} className="text-center py-8 text-muted-foreground text-xs">暂无实验数据</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={currentCharts?.experimentStats || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="experimentName" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: any) => `${v}分`} />
                          <Legend />
                          <Bar dataKey="avgScore" fill="#969BE7" name="平均分" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
              </div>

              {isModuleVisible("warnings") && (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-sm">预警学生列表</h3>
                      <span className="px-2 py-0.5 bg-[#E88383]/25 text-[#DD7373] text-xs font-medium rounded-full">{filteredWarnings.length} 条</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setShowAutoWarningModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs rounded-md hover:bg-accent">
                        <Settings size={12} />自动预警设置
                      </button>
                      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
                        <button onClick={() => setWarningFilter(null)} className={`text-xs px-2.5 py-1 rounded transition-colors ${!warningFilter ? "bg-primary text-white" : "hover:bg-accent"}`}>全部</button>
                        <button onClick={() => setWarningFilter("ATTENDANCE")} className={`text-xs px-2.5 py-1 rounded transition-colors ${warningFilter === "ATTENDANCE" ? "bg-primary text-white" : "hover:bg-accent"}`}>考勤异常</button>
                        <button onClick={() => setWarningFilter("KP_WEAK")} className={`text-xs px-2.5 py-1 rounded transition-colors ${warningFilter === "KP_WEAK" ? "bg-primary text-white" : "hover:bg-accent"}`}>知识点薄弱</button>
                      </div>
                      {selectedWarnings.length > 0 && (
                        <>
                          <button onClick={() => setShowNotificationModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-[#7F84D6]">
                            <Bell size={12} />发送通知 ({selectedWarnings.length})
                          </button>
                          <button onClick={() => { setSelectedWarnings([]); showToastMsg("已取消选择"); }} className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs rounded-md hover:bg-accent">
                            <X size={12} />取消选择
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground w-10">
                            <input type="checkbox" checked={selectedWarnings.length === filteredWarnings.length && filteredWarnings.length > 0}
                              onChange={e => setSelectedWarnings(e.target.checked ? filteredWarnings.map(w => w.studentId) : [])} className="w-4 h-4" />
                          </th>
                          {["学号", "姓名", "预警类型", "预警时间", "严重程度", "操作"].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredWarnings.map(w => (
                          <tr key={w.studentId} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                            <td className="px-4 py-2.5">
                              <input type="checkbox" checked={selectedWarnings.includes(w.studentId)} onChange={() => toggleWarningSelection(w.studentId)} className="w-4 h-4" />
                            </td>
                            <td className="px-4 py-2.5 font-mono text-xs">{w.studentNo || w.studentId}</td>
                            <td className="px-4 py-2.5">
                              <span className="text-primary cursor-pointer hover:underline font-medium" onClick={() => { setSelectedStudentId(w.studentId); setSelectedCourseId(selectedClass); onNav("teacher-profile"); }}>{w.name || "—"}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <Tag color={w.warningType === "ATTENDANCE" ? "orange" : w.warningType === "KP_WEAK" ? "yellow" : "red"}>
                                {w.warningType === "ATTENDANCE" && <AlertCircle className="inline-block w-3 h-3 mr-1" />}
                                {w.warningType === "KP_WEAK" && <BookMarked className="inline-block w-3 h-3 mr-1" />}
                                {w.warningType === "SCORE_DROP" && <TrendingUp className="inline-block w-3 h-3 mr-1" />}
                                {warningTypeLabel(w.warningType)}
                              </Tag>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{w.createTime || "—"}</td>
                            <td className="px-4 py-2.5">
                              <Tag color={w.severity === "HIGH" ? "red" : w.severity === "MEDIUM" ? "orange" : "yellow"}>
                                {w.severity === "HIGH" && <span className="inline-block w-1.5 h-1.5 bg-current rounded-full mr-1 animate-pulse" />}
                                {severityLabel(w.severity)}
                              </Tag>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <button onClick={() => { setSelectedStudentId(w.studentId); setSelectedCourseId(selectedClass); onNav("teacher-profile"); }} className="flex items-center gap-1 text-primary hover:underline text-xs">
                                  <Eye size={12} />查看详情
                                </button>
                                <button onClick={() => showToastMsg(`已标记 ${w.name} 的预警为已处理`)} className="flex items-center gap-1 text-[#57AE8F] hover:text-[#57AE8F] hover:bg-[#74C2A0]/20 px-2 py-1 rounded text-xs">
                                  <CheckCircle size={12} />标记处理
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredWarnings.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                              <Shield size={24} className="mx-auto mb-2 opacity-50" />
                              <p>暂无预警学生</p>
                              <p className="text-xs mt-1">当前筛选条件下没有需要关注的学生</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {isModuleVisible("course-profile") && (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-medium text-sm">综合课程画像</h3>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {[
                        { label: "课程名称", value: classInfo?.courseName || "—", icon: BookOpen, color: "blue" },
                        { label: "授课班级", value: `${classInfo?.classNames?.length || 1} 个班`, icon: Building2, color: "green" },
                        { label: "当前学生数", value: (currentOverview?.studentCount ?? classInfo?.studentCount ?? 0).toString(), icon: Users, color: "purple" },
                        { label: "教学周期", value: classInfo?.semester || "—", icon: Calendar, color: "orange" },
                      ].map(item => (
                        <div key={item.label} className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color === "blue" ? "bg-[#969BE7]/25" : item.color === "green" ? "bg-[#74C2A0]/25" : item.color === "purple" ? "bg-[#969BE7]/25" : "bg-[#F2A56B]/25"}`}>
                            <item.icon size={14} className={item.color === "blue" ? "text-[#969BE7]" : item.color === "green" ? "text-[#57AE8F]" : item.color === "purple" ? "text-[#969BE7]" : "text-[#E8945C]"} />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                            <p className="text-sm font-medium">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                      <div className="bg-card rounded-lg border border-border p-4">
                        <h4 className="text-xs font-medium text-muted-foreground mb-3">知识点掌握度分布</h4>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={currentCharts?.knowledgeRadar || []}>
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: any) => `${v}%`} />
                            <Bar dataKey="value" fill="#969BE7" radius={[4, 4, 0, 0]}>
                              {(currentCharts?.knowledgeRadar || []).map((item, i) => (
                                <Cell key={`cell-${i}`} fill={item.value >= 80 ? "#8FD0B8" : item.value >= 70 ? "#969BE7" : item.value >= 60 ? "#F5D5A8" : "#E8909A"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="bg-card rounded-lg border border-border p-4">
                        <h4 className="text-xs font-medium text-muted-foreground mb-3">知识点掌握情况说明</h4>
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <p className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded bg-[#8FD0B8]" />掌握度 ≥ 80%：已掌握，无需重点复习</p>
                          <p className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded bg-[#969BE7]" />70% – 80%：基本掌握，可适量巩固</p>
                          <p className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded bg-[#F5D5A8]" />60% – 70%：建议安排强化练习</p>
                          <p className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded bg-[#E8909A]" />&lt; 60%：薄弱知识点，建议重新讲解</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showAutoWarningModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">自动预警设置</h3>
                      <button onClick={() => setShowAutoWarningModal(false)}><X size={16} /></button>
                    </div>
                    <p className="text-sm text-muted-foreground">设置自动预警规则，系统将根据规则自动检测并发送预警通知。</p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">缺勤阈值（次数）</label>
                        <input type="number" value={autoWarningConfig.attendanceThreshold} onChange={e => setAutoWarningConfig(prev => ({ ...prev, attendanceThreshold: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                        <p className="text-xs text-muted-foreground mt-1">学生缺勤次数超过此值时触发预警</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">作业缺交阈值（次数）</label>
                        <input type="number" value={autoWarningConfig.homeworkThreshold} onChange={e => setAutoWarningConfig(prev => ({ ...prev, homeworkThreshold: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                        <p className="text-xs text-muted-foreground mt-1">学生连续缺交作业次数超过此值时触发预警</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">成绩下滑阈值（分）</label>
                        <input type="number" value={autoWarningConfig.scoreDropThreshold} onChange={e => setAutoWarningConfig(prev => ({ ...prev, scoreDropThreshold: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                        <p className="text-xs text-muted-foreground mt-1">学生成绩较上次下降超过此分数时触发预警</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">自动发送预警通知</label>
                        <input type="checkbox" checked={autoWarningConfig.autoSendNotification} onChange={e => setAutoWarningConfig(prev => ({ ...prev, autoSendNotification: e.target.checked }))} className="w-4 h-4 rounded" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">检查频率</label>
                        <select value={autoWarningConfig.checkFrequency} onChange={e => setAutoWarningConfig(prev => ({ ...prev, checkFrequency: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-sm">
                          <option value="daily">每天</option>
                          <option value="weekly">每周</option>
                          <option value="after-exam">每次考试后</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setShowAutoWarningModal(false)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
                      <button onClick={() => { setShowAutoWarningModal(false); showToastMsg("自动预警设置已保存"); }} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">保存设置</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {showCustomizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">页面布局设置</h3>
              <button onClick={() => setShowCustomizeModal(false)}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground">显示/隐藏模块</h4>
              {[
                { id: "stats", name: "统计卡片" },
                { id: "score-dist", name: "成绩分布图" },
                { id: "score-trend", name: "成绩趋势图" },
                { id: "attendance", name: "考勤统计" },
                { id: "homework", name: "作业提交统计" },
                { id: "experiment", name: "实验报告统计" },
                { id: "warnings", name: "预警学生列表" },
                { id: "course-profile", name: "综合课程画像" },
              ].map(module => (
                <div key={module.id} className="flex items-center justify-between">
                  <span className="text-sm">{module.name}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={!hiddenModules.includes(module.id)} onChange={() => toggleModuleVisibility(module.id)} className="sr-only peer" />
                    <div className={`w-9 h-5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#D6D2F0] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary`} />
                  </label>
                </div>
              ))}
            </div>
            <button onClick={() => setShowCustomizeModal(false)} className="w-full py-2 bg-primary text-white rounded-md text-sm">保存设置</button>
          </div>
        </div>
      )}

      {showNotificationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">发送通知</h3>
              <button onClick={() => setShowNotificationModal(false)}><X size={16} /></button>
            </div>
            <p className="text-sm text-muted-foreground">已选择 {selectedWarnings.length} 名学生</p>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">通知内容</label>
              <textarea value={notificationContent} onChange={e => setNotificationContent(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-32"
                placeholder="请输入通知内容..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNotificationModal(false)} className="flex-1 py-2 border border-border rounded-md text-sm">取消</button>
              <button onClick={handleSendNotification} className="flex-1 py-2 bg-primary text-white rounded-md text-sm">发送通知</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;
