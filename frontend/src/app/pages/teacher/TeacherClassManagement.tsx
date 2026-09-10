import { useState, useEffect } from "react";
import { Plus, Users, AlertCircle, ChevronRight, Search, Upload, X, UserPlus, Shield, Trash2 } from "lucide-react";
import {
  getMyClasses, getClassStudents, createClass, addStudentToClass,
  ClassVO as ClsVO, StudentVO
} from "../../../services/classService";
import { getCurrentUser } from "../../../services/authService";
import {
  getTAsByTeacher, createTA, deleteTA, getTAPermissions, assignTAToClass,
  removeTAFromClass, setTAStatus, type TeachingAssistant, type TAPermissions
} from "../../../services/taService";
import { Page } from "../../types";
import { Tag } from "../../utils";

function TeacherClassManagement({ onNav, setSelectedStudentId, setSelectedCourseId }: { onNav: (p: Page) => void; setSelectedStudentId: (id: number | null) => void; setSelectedCourseId: (id: number | null) => void }) {
  const teacherId = getCurrentUser()?.userId || 1;

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedClassName, setSelectedClassName] = useState<string>("");
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showTAConfigModal, setShowTAConfigModal] = useState(false);
  const [showAddTAModal, setShowAddTAModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"classes" | "assistants">("classes");
  const [searchQuery, setSearchQuery] = useState("");
  const [newClass, setNewClass] = useState({ name: "", course: "", semester: "" });
  const [newStudent, setNewStudent] = useState({ studentNo: "", name: "", password: "" });
  const [newTA, setNewTA] = useState({ staffId: "", name: "" });
  const [selectedTA, setSelectedTA] = useState<string>("");
  const [taPerms, setTaPerms] = useState({ canImport: false, canGrade: false, canViewProfile: false });
  const [classList, setClassList] = useState<ClsVO[]>([]);
  const [studentList, setStudentList] = useState<StudentVO[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [taList, setTaList] = useState<TeachingAssistant[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  const refreshTAs = async () => setTaList(await getTAsByTeacher(teacherId));

  // Fetch classes on mount
  useEffect(() => {
    setLoadingClasses(true);
    setLoadError(null);
    getMyClasses().then(data => {
      setClassList(data || []);
    }).catch((err) => {
      setClassList([]);
      setLoadError(err.message || "加载失败");
    }).finally(() => setLoadingClasses(false));
    refreshTAs();
  }, []);

  // Fetch students when class is selected
  useEffect(() => {
    if (!selectedClassId) return;
    setLoadingStudents(true);
    getClassStudents(selectedClassId, selectedClassName || undefined).then(data => {
      setStudentList(data || []);
    }).catch(() => {
      setStudentList([]);
    }).finally(() => setLoadingStudents(false));
  }, [selectedClassId, selectedClassName]);

  const students = studentList;
  const filteredStudents = studentList.filter(s =>
    (s.studentNo?.includes(searchQuery) || s.name?.includes(searchQuery))
  );

  // 当前选中的班级（课程 + 班级名）
  const selectedClass = classList.find(c => c.id === selectedClassId && (c.className || "") === selectedClassName);

  // 当前班级已分配的助教
  const classTAs = taList.filter(ta => {
    const perms = getTAPermissions(ta.staffId);
    return perms.allowedClasses.includes(selectedClassId || 0);
  });

  const handleAddClass = async () => {
    if (!newClass.name) return;
    try {
      const created = await createClass({ name: newClass.name, courseName: newClass.course, semester: newClass.semester });
      setClassList([...classList, created]);
      setShowAddClassModal(false);
      setNewClass({ name: "", course: "", semester: "" });
    } catch (err: any) {
      alert(err.message || "创建失败");
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.studentNo || !newStudent.name || !selectedClassId) return;
    try {
      const created = await addStudentToClass(selectedClassId, { studentNo: newStudent.studentNo, name: newStudent.name, password: newStudent.password, className: selectedClassName || undefined });
      setStudentList([...studentList, created]);
      setShowAddStudentModal(false);
      setNewStudent({ studentNo: "", name: "", password: "" });
    } catch (err: any) {
      alert(err.message || "添加失败");
    }
  };

  const handleCreateTA = async () => {
    if (!newTA.staffId || !newTA.name) return;
    try {
      await createTA({ staffId: newTA.staffId, name: newTA.name, teacherId });
      await refreshTAs();
      setShowAddTAModal(false);
      setNewTA({ staffId: "", name: "" });
      showToast("助教创建成功");
    } catch (err: any) {
      alert(err.message || "创建失败");
    }
  };

  const handleDeleteTA = async (staffId: string) => {
    if (!confirm("确认删除该助教？相关权限配置将一并清除。")) return;
    const target = taList.find(t => t.staffId === staffId); if (!target) return;
    await deleteTA(target.id);
    await refreshTAs();
    showToast("助教已删除");
  };

  const handleToggleTAStatus = async (ta: TeachingAssistant) => {
    const next = ta.status === "active" ? "disabled" : "active";
    await setTAStatus(ta.id, next);
    await refreshTAs();
  };

  const openTAConfig = (taStaffId?: string) => {
    if (taStaffId) {
      setSelectedTA(taStaffId);
      const p = getTAPermissions(taStaffId);
      setTaPerms({ canImport: p.canImport, canGrade: p.canGrade, canViewProfile: p.canViewProfile });
    } else {
      setSelectedTA("");
      setTaPerms({ canImport: false, canGrade: false, canViewProfile: false });
    }
    setShowTAConfigModal(true);
  };

  const handleTAConfig = async () => {
    if (!selectedTA) return;
    if (selectedClassId) {
      const target = taList.find(t => t.staffId === selectedTA); if (!target) return;
      await assignTAToClass(target.id, selectedClassId, taPerms);
    } else {
      // 无班级上下文时，仅更新全局权限（不改变已分配班级）
      showToast("请先选择一个课程后再保存权限"); return;
    }
    setShowTAConfigModal(false);
    setSelectedTA("");
    setTaPerms({ canImport: false, canGrade: false, canViewProfile: false });
    await refreshTAs();
    showToast("权限已保存");
  };

  const handleRemoveTAFromClass = async (taId: string) => {
    if (selectedClassId) {
      const target = taList.find(t => t.staffId === taId); if (!target) return;
      await removeTAFromClass(target.id, selectedClassId);
      await refreshTAs();
      showToast("已移除该助教");
    }
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2 rounded-md text-sm shadow-lg">
          {toast}
        </div>
      )}

      {/* 顶部 Tab 切换 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button onClick={() => setActiveTab("classes")}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors ${activeTab === "classes" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            班级管理
          </button>
          <button onClick={() => setActiveTab("assistants")}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5 ${activeTab === "assistants" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <Shield size={14} />助教管理
          </button>
        </div>
      </div>

      {/* 班级管理 Tab */}
      {activeTab === "classes" && (!selectedClassId ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">班级列表</h2>
            <button onClick={() => setShowAddClassModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">
              <Plus size={14} />新增班级
            </button>
          </div>
          {loadingClasses ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <div className="w-8 h-8 border-3 border-muted border-t-primary rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">加载中...</p>
            </div>
          ) : loadError ? (
            <div className="bg-card rounded-lg border border-[#E88383]/40 p-12 text-center">
              <AlertCircle size={32} className="mx-auto mb-3 text-[#DD7373]" />
              <p className="text-sm text-[#DD7373] font-medium">加载失败</p>
              <p className="text-xs text-muted-foreground mt-1">{loadError}</p>
            </div>
          ) : classList.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <Users size={32} className="mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">暂无班级，点击右上角新增班级</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classList.map(c => (
                <div key={`${c.id}-${c.className || ""}`} onClick={() => { setSelectedClassId(c.id); setSelectedClassName(c.className || ""); }} className="bg-card rounded-lg border border-border p-5 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{c.className || "未分班"}</p>
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        {c.courseName && (
                          <p className="text-xs text-muted-foreground">{c.courseName}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">{c.courseNo || c.semester || ""}</p>
                      </div>
                    </div>
                    <Users size={18} className="text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted rounded p-2">
                      <p className="text-xs text-muted-foreground">学生人数</p>
                      <p className="font-mono font-semibold">{c.studentCount ?? 0}</p>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <p className="text-xs text-muted-foreground">学期</p>
                      <p className="text-xs">{c.semester || "—"}</p>
                    </div>
                  </div>
                  <button className="mt-3 w-full py-2 text-sm border border-primary text-primary rounded-md hover:bg-accent transition-colors">
                    查看学生名单
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button onClick={() => { setSelectedClassId(null); setSelectedClassName(""); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ChevronRight size={14} />返回班级列表
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                <input type="text" placeholder="搜索学号或姓名..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm w-64" />
              </div>
              <button onClick={() => setShowAddStudentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">
                <Plus size={14} />添加学生
              </button>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-medium text-sm">{selectedClass ? `${selectedClass.courseName} · ${selectedClass.className || "未分班"}` : ""}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">共 {students.length} 名学生</p>
            </div>
            {loadingStudents ? (
              <div className="py-16 text-center">
                <div className="w-7 h-7 border-3 border-muted border-t-primary rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">加载中...</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["学号", "姓名", "班级", "性别", "已导入数据", "操作"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => (
                    <tr key={s.studentNo} className="border-b border-border last:border-0 hover:bg-accent/30">
                      <td className="px-4 py-3 font-mono text-xs">{s.studentNo}</td>
                      <td className="px-4 py-3">{s.name}</td>
                      <td className="px-4 py-3">{s.className || "—"}</td>
                      <td className="px-4 py-3"><Tag color="gray">{s.gender || "—"}</Tag></td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">{s.college || "—"} · {s.major || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setSelectedStudentId(s.studentId); setSelectedCourseId(selectedClassId); onNav("teacher-profile"); }} className="text-primary hover:underline text-xs mr-3">学生画像</button>
                        <button className="text-[#DD7373] hover:underline text-xs">移除</button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">暂无学生</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* 班级助教列表 */}
          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-sm">本班助教</h3>
                <p className="text-xs text-muted-foreground mt-0.5">为本班级分配助教并设置权限</p>
              </div>
              <button onClick={() => openTAConfig()} className="flex items-center gap-2 px-3 py-1.5 border border-primary text-primary rounded-md text-sm hover:bg-accent">
                <Shield size={14} />分配助教权限
              </button>
            </div>
            {classTAs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">暂无助教，点击右上角分配</p>
            ) : (
              <div className="space-y-2">
                {classTAs.map(ta => {
                  const p = getTAPermissions(ta.staffId);
                  return (
                    <div key={ta.staffId} className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                          {ta.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{ta.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{ta.staffId}</p>
                        </div>
                        <div className="flex gap-1.5 ml-4">
                          {p.canImport && <Tag color="blue">导入数据</Tag>}
                          {p.canGrade && <Tag color="green">考试批阅</Tag>}
                          {p.canViewProfile && <Tag color="purple">学生画像</Tag>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openTAConfig(ta.staffId)} className="text-primary hover:underline text-xs">编辑权限</button>
                        <button onClick={() => handleRemoveTAFromClass(ta.staffId)} className="text-[#DD7373] hover:underline text-xs">移除</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ))}

      {/* 助教管理 Tab */}
      {activeTab === "assistants" && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">助教管理</h2>
              <p className="text-xs text-muted-foreground mt-0.5">管理你的助教团队，为其分配班级与操作权限</p>
            </div>
            <button onClick={() => setShowAddTAModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">
              <UserPlus size={14} />添加助教
            </button>
          </div>

          {taList.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <Shield size={32} className="mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">暂无助教，点击右上角添加</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["工号", "姓名", "状态", "已分配班级", "权限", "操作"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {taList.map(ta => {
                    const p = getTAPermissions(ta.staffId);
                    const classNames = p.allowedClasses
                      .map(id => classList.find(c => c.id === id)?.className || classList.find(c => c.id === id)?.courseName || `班级#${id}`)
                      .join("、");
                    return (
                      <tr key={ta.staffId} className="border-b border-border last:border-0 hover:bg-accent/30">
                        <td className="px-4 py-3 font-mono text-xs">{ta.staffId}</td>
                        <td className="px-4 py-3 font-medium">{ta.name}</td>
                        <td className="px-4 py-3">
                          <Tag color={ta.status === "active" ? "green" : "gray"}>
                            {ta.status === "active" ? "启用" : "禁用"}
                          </Tag>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{classNames || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {p.canImport && <Tag color="blue">导入</Tag>}
                            {p.canGrade && <Tag color="green">批阅</Tag>}
                            {p.canViewProfile && <Tag color="purple">画像</Tag>}
                            {!p.canImport && !p.canGrade && !p.canViewProfile && <span className="text-xs text-muted-foreground">无</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openTAConfig(ta.staffId)} className="text-primary hover:underline text-xs">权限</button>
                            <button onClick={() => handleToggleTAStatus(ta)} className="text-xs hover:underline">
                              {ta.status === "active" ? "禁用" : "启用"}
                            </button>
                            <button onClick={() => handleDeleteTA(ta.staffId)} className="text-[#DD7373] hover:underline text-xs flex items-center gap-1">
                              <Trash2 size={12} />删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* 新增班级 Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold">新增班级</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">班级名称</label>
                <input type="text" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-md text-sm" placeholder="如：2024级3班" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">课程名称</label>
                <input type="text" value={newClass.course} onChange={e => setNewClass({ ...newClass, course: e.target.value })}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-md text-sm" placeholder="如：高等数学A" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">学期</label>
                <input type="text" value={newClass.semester} onChange={e => setNewClass({ ...newClass, semester: e.target.value })}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-md text-sm" placeholder="如：2024-2025第二学期" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddClassModal(false)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={handleAddClass} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">创建班级</button>
            </div>
          </div>
        </div>
      )}

      {/* 添加学生 Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold">添加学生</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">学号</label>
                <input type="text" value={newStudent.studentNo} onChange={e => setNewStudent({ ...newStudent, studentNo: e.target.value })}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-md text-sm" placeholder="请输入学号" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">姓名</label>
                <input type="text" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-md text-sm" placeholder="请输入姓名" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddStudentModal(false)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={handleAddStudent} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">添加学生</button>
            </div>
          </div>
        </div>
      )}

      {/* 添加助教 Modal */}
      {showAddTAModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold">添加助教</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">助教工号（登录账号）</label>
                <input type="text" value={newTA.staffId} onChange={e => setNewTA({ ...newTA, staffId: e.target.value })}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-md text-sm" placeholder="如：TA2024003" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">姓名</label>
                <input type="text" value={newTA.name} onChange={e => setNewTA({ ...newTA, name: e.target.value })}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-md text-sm" placeholder="请输入助教姓名" />
              </div>
              <p className="text-xs text-muted-foreground">提示：助教使用工号作为登录账号，初始密码请联系系统管理员设置。</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddTAModal(false)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={handleCreateTA} disabled={!newTA.staffId || !newTA.name} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6] disabled:opacity-50 disabled:cursor-not-allowed">添加</button>
            </div>
          </div>
        </div>
      )}

      {/* 分配助教权限 Modal */}
      {showTAConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold">{selectedTA ? "编辑助教权限" : "分配助教权限"}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">选择助教</label>
                <select value={selectedTA} onChange={e => { setSelectedTA(e.target.value); if (e.target.value) { const p = getTAPermissions(e.target.value); setTaPerms({ canImport: p.canImport, canGrade: p.canGrade, canViewProfile: p.canViewProfile }); } }}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-md text-sm">
                  <option value="">请选择助教</option>
                  {taList.map(ta => (
                    <option key={ta.staffId} value={ta.staffId}>{ta.name} · {ta.staffId}</option>
                  ))}
                </select>
              </div>
              {selectedClass && (
                <p className="text-xs text-muted-foreground bg-muted rounded px-3 py-2">
                  当前操作班级：{selectedClass.courseName} · {selectedClass.className || "未分班"}
                </p>
              )}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">权限设置</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={taPerms.canImport} onChange={e => setTaPerms({ ...taPerms, canImport: e.target.checked })} className="rounded" />
                    <span className="text-sm">允许导入数据</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={taPerms.canGrade} onChange={e => setTaPerms({ ...taPerms, canGrade: e.target.checked })} className="rounded" />
                    <span className="text-sm">允许考试批阅</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={taPerms.canViewProfile} onChange={e => setTaPerms({ ...taPerms, canViewProfile: e.target.checked })} className="rounded" />
                    <span className="text-sm">允许查看学生画像</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowTAConfigModal(false); setSelectedTA(""); setTaPerms({ canImport: false, canGrade: false, canViewProfile: false }); }} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={handleTAConfig} disabled={!selectedTA} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6] disabled:opacity-50 disabled:cursor-not-allowed">保存设置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherClassManagement;
