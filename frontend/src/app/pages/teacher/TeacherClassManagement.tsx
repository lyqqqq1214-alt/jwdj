import { useState, useEffect } from "react";
import { Plus, Users, AlertCircle, ChevronRight, Search, Upload, X } from "lucide-react";
import {
  getMyClasses, getClassStudents, createClass, addStudentToClass,
  ClassVO as ClsVO, StudentVO
} from "../../../services/classService";
import { Page } from "../../types";
import { Tag } from "../../utils";

const teachingAssistants = [
  { id: 1, staffId: "TA2024001", name: "陈晓峰", account: "TA2024001", status: "active", createdAt: "2024-09-01", lastLogin: "2025-03-12 15:00" },
  { id: 2, staffId: "TA2024002", name: "林雨萱", account: "TA2024002", status: "active", createdAt: "2024-09-01", lastLogin: "2025-03-12 16:00" },
];

const taPermissions: Record<string, {
  allowedClasses: number[];
  canImport: boolean;
  canGrade: boolean;
  canViewProfile: boolean;
}> = {
  "TA2024001": {
    allowedClasses: [1, 3],
    canImport: true,
    canGrade: true,
    canViewProfile: true,
  },
  "TA2024002": {
    allowedClasses: [2],
    canImport: false,
    canGrade: true,
    canViewProfile: false,
  },
};

function TeacherClassManagement({ onNav, setSelectedStudentId, setSelectedCourseId }: { onNav: (p: Page) => void; setSelectedStudentId: (id: number | null) => void; setSelectedCourseId: (id: number | null) => void }) {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showTAConfigModal, setShowTAConfigModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [newClass, setNewClass] = useState({ name: "", course: "", semester: "" });
  const [newStudent, setNewStudent] = useState({ studentNo: "", name: "", password: "" });
  const [selectedTA, setSelectedTA] = useState<string>("");
  const [taPerms, setTaPerms] = useState({ canImport: false, canGrade: false, canViewProfile: false });
  const [classList, setClassList] = useState<ClsVO[]>([]);
  const [studentList, setStudentList] = useState<StudentVO[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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
  }, []);

  // Fetch students when class is selected
  useEffect(() => {
    if (!selectedClassId) return;
    setLoadingStudents(true);
    getClassStudents(selectedClassId).then(data => {
      setStudentList(data || []);
    }).catch(() => {
      setStudentList([]);
    }).finally(() => setLoadingStudents(false));
  }, [selectedClassId]);

  const students = studentList;
  const classOptions = Array.from(new Set(studentList.map(s => s.className).filter((c): c is string => !!c)));
  const filteredStudents = studentList.filter(s =>
    (s.studentNo?.includes(searchQuery) || s.name?.includes(searchQuery)) &&
    (!classFilter || s.className === classFilter)
  );

  const classTAs = teachingAssistants.filter(ta => {
    const perms = taPermissions[ta.staffId];
    return perms && perms.allowedClasses.includes(selectedClassId || 0);
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
      const created = await addStudentToClass(selectedClassId, { studentNo: newStudent.studentNo, name: newStudent.name, password: newStudent.password });
      setStudentList([...studentList, created]);
      setShowAddStudentModal(false);
      setNewStudent({ studentNo: "", name: "", password: "" });
    } catch (err: any) {
      alert(err.message || "添加失败");
    }
  };

  const handleTAConfig = () => {
    if (selectedTA && selectedClassId) {
      const perms = taPermissions[selectedTA];
      if (perms && !perms.allowedClasses.includes(selectedClassId)) {
        perms.allowedClasses.push(selectedClassId);
      }
      perms.canImport = taPerms.canImport;
      perms.canGrade = taPerms.canGrade;
      perms.canViewProfile = taPerms.canViewProfile;
    }
    setShowTAConfigModal(false);
    setSelectedTA("");
    setTaPerms({ canImport: false, canGrade: false, canViewProfile: false });
  };

  const removeTAFromClass = (taId: string) => {
    const perms = taPermissions[taId];
    if (perms && selectedClassId) {
      perms.allowedClasses = perms.allowedClasses.filter(c => c !== selectedClassId);
    }
  };

  return (
    <div className="space-y-5">
      {!selectedClassId ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">班级管理</h2>
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
                <div key={c.id} onClick={() => setSelectedClassId(c.id)} className="bg-card rounded-lg border border-border p-5 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{c.className || c.courseName}</p>
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        {c.className !== c.courseName && c.courseName && (
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
            <button onClick={() => setSelectedClassId(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ChevronRight size={14} />返回班级列表
            </button>
            <div className="flex items-center gap-3">
              <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
                className="px-3 py-2 bg-card border border-border rounded-md text-sm">
                <option value="">全部班级</option>
                {classOptions.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                <input type="text" placeholder="搜索学号或姓名..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm w-64" />
              </div>
              <button onClick={() => setShowAddStudentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">
                <Plus size={14} />添加学生
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm hover:bg-accent">
                <Upload size={14} />导入名单
              </button>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-medium text-sm">{classList.find(c => c.id === selectedClassId)?.courseName || classList.find(c => c.id === selectedClassId)?.className}</h3>
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
        </>
      )}

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

      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold">添加学生</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">学号</label>
                <input type="text" value={newStudent.uid} onChange={e => setNewStudent({ ...newStudent, uid: e.target.value })}
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

      {showTAConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold">分配助教权限</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">选择助教</label>
                <select value={selectedTA} onChange={e => setSelectedTA(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-md text-sm">
                  <option value="">请选择助教</option>
                  {teachingAssistants.map(ta => (
                    <option key={ta.staffId} value={ta.staffId}>{ta.name} · {ta.staffId}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">权限设置</label>
                <div className="flex items-center gap-3">
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
