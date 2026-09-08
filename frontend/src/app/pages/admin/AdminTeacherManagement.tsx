import { useState, useEffect } from "react";
import {
  Search, Upload, Plus, X, Building2, ChevronRight,
  PieChart as PieChartIcon, CheckCircle, XCircle, Shield, Download
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { getTeacherList, createTeacher, updateTeacher, deleteTeacher, updateTeacherStatus, resetTeacherPassword, TeacherVO } from "../../../services/teacherService";
import { Tag } from "../../utils";
import { mockTeachers, PIE_COLORS } from "../../constants";

function AdminTeacherManagement() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("teachers");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; fail: number; errors: string[] } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [editingTeacher, setEditingTeacher] = useState<TeacherVO | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: "enable" | "disable"; teacher: TeacherVO } | null>(null);
  const [newTeacher, setNewTeacher] = useState({ staffId: "", name: "", password: "", department: "", role: "" });
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  useEffect(() => {
    setLoading(true);
    getTeacherList(1, 100).then(data => {
      setTeachers(data.records || []);
    }).catch(() => {
      setTeachers(mockTeachers.map(t => ({
        id: t.id, teacherNo: t.staffId, name: t.name, status: t.status === 'active' ? 'ACTIVE' : 'DISABLED',
        college: t.department || '', createTime: t.createdAt,
      } as TeacherVO)));
    }).finally(() => setLoading(false));
  }, []);

  const departments = [
    { id: "cs", name: "计算机学院", count: 15, children: [
      { id: "cs-se", name: "软件工程系", count: 6 },
      { id: "cs-ds", name: "数据科学系", count: 5 },
      { id: "cs-ai", name: "人工智能系", count: 4 },
    ]},
    { id: "math", name: "数学学院", count: 10, children: [
      { id: "math-pure", name: "基础数学系", count: 5 },
      { id: "math-applied", name: "应用数学系", count: 5 },
    ]},
    { id: "physics", name: "物理学院", count: 8, children: [] },
    { id: "econ", name: "经管学院", count: 7, children: [] },
    { id: "other", name: "其他", count: 5, children: [] },
  ];

  const roleTemplates = [
    { id: "full", name: "课程负责人", description: "拥有课程内的全部管理权限", permissions: ["viewClassData", "importData", "manageStudents", "viewProfile", "aiQuiz", "publishExam", "gradeExam", "sendNotification", "viewWarning", "exportData"] },
    { id: "secretary", name: "教学秘书", description: "可以查看所有数据但不能修改", permissions: ["viewClassData", "viewProfile", "viewWarning", "exportData"] },
    { id: "ta-readonly", name: "助教只读", description: "只能查看数据不能操作", permissions: ["viewClassData", "viewProfile"] },
    { id: "ta-grading", name: "助教可批阅", description: "在只读基础上增加批阅权限", permissions: ["viewClassData", "viewProfile", "gradeExam"] },
  ];

  const allPermissions = [
    { id: "viewClassData", name: "查看班级数据" },
    { id: "importData", name: "导入教学数据" },
    { id: "manageStudents", name: "管理学生名单" },
    { id: "viewProfile", name: "查看学生画像" },
    { id: "aiQuiz", name: "AI出题组卷" },
    { id: "publishExam", name: "发布考试" },
    { id: "gradeExam", name: "批阅考试" },
    { id: "sendNotification", name: "发送通知" },
    { id: "viewWarning", name: "查看预警信息" },
    { id: "exportData", name: "导出数据" },
  ];

  const filteredTeachers = teachers.filter(t => 
    t.name?.includes(search) || t.teacherNo?.includes(search) || (t.college || '').includes(search)
  );

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let pwd = "";
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(pwd);
    setNewPassword(pwd);
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.staffId || !newTeacher.name || !newTeacher.password) return;
    try {
      const created = await createTeacher({ teacherNo: newTeacher.staffId, name: newTeacher.name, password: newTeacher.password, college: newTeacher.department });
      setTeachers([...teachers, created]);
      setNewTeacher({ staffId: "", name: "", password: "", department: "", role: "" });
      setShowAddModal(false);
      showToast("教师添加成功");
    } catch (err: any) {
      showToast(err.message || "添加失败");
    }
  };

  const handleEditTeacher = async () => {
    if (!editingTeacher || !newTeacher.name) return;
    try {
      await updateTeacher(editingTeacher.id, { name: newTeacher.name, college: newTeacher.department });
      setTeachers(teachers.map(t => 
        t.id === editingTeacher.id ? { ...t, name: newTeacher.name, college: newTeacher.department || t.college } : t
      ));
      setShowEditModal(false);
      setEditingTeacher(null);
      setNewTeacher({ staffId: "", name: "", password: "", department: "", role: "" });
      showToast("教师信息更新成功");
    } catch (err: any) {
      showToast(err.message || "更新失败");
    }
  };

  const handleStatusChange = async (type: "enable" | "disable", teacher: TeacherVO) => {
    try {
      await updateTeacherStatus(teacher.id, type === "enable" ? "ACTIVE" : "DISABLED");
      setTeachers(teachers.map(t => 
        t.id === teacher.id ? { ...t, status: type === "enable" ? "ACTIVE" : "DISABLED" } : t
      ));
      setShowConfirmModal(false);
      setConfirmAction(null);
      showToast(type === "enable" ? "账号已启用" : "账号已禁用");
    } catch (err: any) {
      showToast(err.message || "操作失败");
    }
  };

  const handleResetPasswordCancel = () => {
    setShowResetModal(false);
    setNewPassword("");
    setGeneratedPassword("");
  };

  const handleResetPasswordConfirm = async () => {
    if (!editingTeacher) return;
    try {
      const result = await resetTeacherPassword(editingTeacher.id);
      setNewPassword(result.newPassword);
      setGeneratedPassword(result.newPassword);
      showToast("密码重置成功");
    } catch (err: any) {
      showToast(err.message || "重置失败");
    }
  };

  const handleDeleteTeacher = async (teacher: TeacherVO) => {
    if (!confirm(`确定要删除教师 ${teacher.name} 吗？`)) return;
    try {
      await deleteTeacher(teacher.id);
      setTeachers(teachers.filter(t => t.id !== teacher.id));
      showToast("教师已删除");
    } catch (err: any) {
      showToast(err.message || "删除失败");
    }
  };

  const handleDownloadTemplate = () => {
    const template = "工号,姓名,初始密码,部门,角色\n";
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "教师导入模板.csv";
    link.click();
  };

  const handleImport = () => {
    setImportResult({ success: 3, fail: 1, errors: ["第4行：工号T2020003已存在"] });
  };

  const handleDownloadErrorLog = () => {
    if (!importResult) return;
    const log = importResult.errors.join("\n");
    const blob = new Blob([log], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "导入错误日志.txt";
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#969BE7] to-[#C8A2E8] rounded-lg p-6 text-white">
        <h2 className="text-xl font-semibold">教师账号管理</h2>
        <p className="text-white/90 text-sm mt-1">管理教师账号、组织架构与角色权限</p>
      </div>

      <div className="flex items-center gap-2 p-1 bg-card rounded-lg border border-border">
        <button onClick={() => setActiveTab("teachers")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "teachers" ? "bg-primary text-white" : "text-muted-foreground hover:text-[#7F84D6]"}`}>
          教师账号
        </button>
        <button onClick={() => setActiveTab("departments")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "departments" ? "bg-primary text-white" : "text-muted-foreground hover:text-[#7F84D6]"}`}>
          组织架构
        </button>
        <button onClick={() => setActiveTab("roles")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "roles" ? "bg-primary text-white" : "text-muted-foreground hover:text-[#7F84D6]"}`}>
          角色权限模板
        </button>
      </div>

      {activeTab === "teachers" && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="按姓名、工号搜索"
                className="w-full pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <select value={selectedDepartment || ""} onChange={e => setSelectedDepartment(e.target.value || null)}
              className="px-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">全部部门</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select value={selectedRole || ""} onChange={e => setSelectedRole(e.target.value || null)}
              className="px-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">全部角色</option>
              {roleTemplates.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <button onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-md hover:bg-accent">
              <Upload size={13} />导入教师
            </button>
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-[#7F84D6]">
              <Plus size={13} />添加教师
            </button>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">工号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">姓名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">学院</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">职称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">创建时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map(t => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{t.teacherNo}</td>
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{t.college || "未分配"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Tag color="blue">{t.title || "—"}</Tag>
                    </td>
                    <td className="px-4 py-3">
                      {t.status === "ACTIVE" ? <Tag color="green">正常</Tag> : <Tag color="red">已禁用</Tag>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.createTime?.split('T')[0] || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => {
                          setEditingTeacher(t);
                          setNewTeacher({ staffId: t.teacherNo, name: t.name, password: "", department: t.college || "", role: "" });
                          setShowEditModal(true);
                        }} className="text-primary hover:underline text-xs">编辑</button>
                        <button onClick={() => {
                          setConfirmAction({ type: t.status === "ACTIVE" ? "disable" : "enable", teacher: t });
                          setShowConfirmModal(true);
                        }} className={`hover:underline text-xs ${t.status === "ACTIVE" ? "text-[#E8945C]" : "text-[#57AE8F]"}`}>
                          {t.status === "ACTIVE" ? "禁用" : "启用"}
                        </button>
                        <button onClick={() => {
                          setEditingTeacher(t);
                          setShowResetModal(true);
                        }} className="text-[#969BE7] hover:underline text-xs">重置密码</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>共 {filteredTeachers.length} 条记录</span>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 border border-border rounded hover:bg-accent">上一页</button>
                <span className="px-2 py-1 bg-primary text-white rounded">1</span>
                <button className="px-2 py-1 border border-border rounded hover:bg-accent">下一页</button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "departments" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-primary" />
                <h3 className="font-medium text-sm">部门树结构</h3>
              </div>
              <button className="px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-md hover:bg-primary/20">
                添加部门
              </button>
            </div>
            <div className="space-y-2">
              {departments.map(dept => (
                <div key={dept.id}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <ChevronRight size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium">{dept.name}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{dept.count}人</span>
                    </div>
                    <button className="text-xs text-muted-foreground hover:text-primary">管理</button>
                  </div>
                  {dept.children && dept.children.length > 0 && (
                    <div className="ml-4 space-y-2">
                      {dept.children.map(child => (
                        <div key={child.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-1.5 h-1.5 rounded-full bg-muted" />
                            <span className="text-sm">{child.name}</span>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">{child.count}人</span>
                          </div>
                          <button className="text-xs text-muted-foreground hover:text-primary">编辑</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon size={16} className="text-primary" />
              <h3 className="font-medium text-sm">部门教师分布</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={departments.map(d => ({ name: d.name, value: d.count }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {departments.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === "roles" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              {roleTemplates.map(role => (
                <button key={role.id} onClick={() => setSelectedRole(role.id)}
                  className={`w-full text-left p-4 rounded-lg border text-sm transition-colors ${selectedRole === role.id ? "border-primary bg-primary/5" : "border-border hover:border-primary"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{role.name}</span>
                    <Tag color="gray">{role.permissions.length}项权限</Tag>
                  </div>
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                </button>
              ))}
              <button className="w-full text-left p-4 rounded-lg border border-dashed text-sm text-muted-foreground hover:border-primary hover:text-[#7F84D6] transition-colors">
                <div className="flex items-center justify-center gap-2">
                  <Plus size={16} />
                  自定义角色
                </div>
              </button>
            </div>
            <div className="bg-card rounded-lg border border-border p-5">
              {selectedRole ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-sm">权限详情</h3>
                    <button className="text-xs text-primary hover:underline">编辑权限</button>
                  </div>
                  <div className="space-y-2">
                    {allPermissions.map(perm => (
                      <div key={perm.id} className={`flex items-center justify-between p-3 rounded-lg ${roleTemplates.find(r => r.id === selectedRole)?.permissions.includes(perm.id) ? "bg-primary/5" : "bg-muted/50"}`}>
                        <span className="text-sm">{perm.name}</span>
                        {roleTemplates.find(r => r.id === selectedRole)?.permissions.includes(perm.id) ? (
                          <CheckCircle size={16} className="text-primary" />
                        ) : (
                          <XCircle size={16} className="text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <Shield size={32} className="mx-auto mb-2" />
                    <p className="text-sm">请选择一个角色模板查看权限详情</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">添加教师</h3>
              <button onClick={() => { setShowAddModal(false); setNewTeacher({ staffId: "", name: "", password: "", department: "", role: "" }); }}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">工号 <span className="text-[#DD7373]">*</span></label>
                <input value={newTeacher.staffId} onChange={e => setNewTeacher({ ...newTeacher, staffId: e.target.value })}
                  placeholder="请输入工号"
                  className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">姓名 <span className="text-[#DD7373]">*</span></label>
                <input value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  placeholder="请输入姓名"
                  className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">所属部门</label>
                <select value={newTeacher.department} onChange={e => setNewTeacher({ ...newTeacher, department: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">请选择部门</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">角色</label>
                <select value={newTeacher.role} onChange={e => setNewTeacher({ ...newTeacher, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">请选择角色</option>
                  {roleTemplates.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">初始密码 <span className="text-[#DD7373]">*</span></label>
                <div className="flex gap-2">
                  <input value={newTeacher.password} onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })}
                    type="password"
                    placeholder="请输入初始密码"
                    className="flex-1 px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                  <button onClick={generateRandomPassword} className="px-3 py-2 text-sm border border-border rounded-md hover:bg-accent">生成</button>
                </div>
                {generatedPassword && <p className="text-xs text-[#57AE8F] mt-1">生成密码：{generatedPassword}</p>}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowAddModal(false); setNewTeacher({ staffId: "", name: "", password: "", department: "", role: "" }); }} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={handleAddTeacher} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">保存</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">编辑教师</h3>
              <button onClick={() => { setShowEditModal(false); setEditingTeacher(null); }}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">工号</label>
                <input value={editingTeacher.staffId} disabled
                  className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md text-muted-foreground" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">姓名 <span className="text-[#DD7373]">*</span></label>
                <input value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  placeholder="请输入姓名"
                  className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">所属部门</label>
                <select value={newTeacher.department} onChange={e => setNewTeacher({ ...newTeacher, department: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">请选择部门</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">角色</label>
                <select value={newTeacher.role} onChange={e => setNewTeacher({ ...newTeacher, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">请选择角色</option>
                  {roleTemplates.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowEditModal(false); setEditingTeacher(null); }} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={handleEditTeacher} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">保存</button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && editingTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">重置密码</h3>
              <button onClick={handleResetPasswordCancel}><X size={16} /></button>
            </div>
            <p className="text-sm text-muted-foreground">为教师 <span className="font-medium">{editingTeacher.name}</span> 设置新密码</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">新密码</label>
                <div className="flex gap-2">
                  <input value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    type="password"
                    placeholder="请输入新密码"
                    className="flex-1 px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                  <button onClick={generateRandomPassword} className="px-3 py-2 text-sm border border-border rounded-md hover:bg-accent">生成随机密码</button>
                </div>
                {generatedPassword && <p className="text-xs text-[#57AE8F] mt-1">新密码：{generatedPassword}</p>}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleResetPasswordCancel} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={handleResetPasswordConfirm} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">确认重置</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${confirmAction.type === "disable" ? "bg-[#E88383]/20" : "bg-[#74C2A0]/20"}`}>
                {confirmAction.type === "disable" ? <XCircle size={20} className="text-[#DD7373]" /> : <CheckCircle size={20} className="text-[#57AE8F]" />}
              </div>
              <div>
                <h3 className="font-semibold">{confirmAction.type === "disable" ? "禁用账号" : "启用账号"}</h3>
                <p className="text-sm text-muted-foreground">确定要{confirmAction.type === "disable" ? "禁用" : "启用"}教师 {confirmAction.teacher.name} 的账号吗？</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowConfirmModal(false); setConfirmAction(null); }} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={() => handleStatusChange(confirmAction.type, confirmAction.teacher)}
                className={`flex-1 py-2 rounded-md text-sm ${confirmAction.type === "disable" ? "bg-[#E88383] text-white hover:bg-[#E07070]" : "bg-[#74C2A0] text-white hover:bg-[#5FAF8E]"}`}>
                确定{confirmAction.type === "disable" ? "禁用" : "启用"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">批量导入教师</h3>
              <button onClick={() => { setShowImportModal(false); setImportResult(null); }}><X size={16} /></button>
            </div>
            {!importResult ? (
              <div className="space-y-4">
                <button onClick={handleDownloadTemplate} className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border rounded-md hover:border-primary transition-colors">
                  <Download size={16} />下载导入模板
                </button>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">拖拽或点击上传 Excel 文件</p>
                  <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls, .csv 格式</p>
                </div>
                <button onClick={handleImport} className="w-full py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">开始导入</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-6 py-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#74C2A0]/20 mx-auto mb-2">
                      <CheckCircle size={24} className="text-[#57AE8F]" />
                    </div>
                    <p className="font-mono text-xl font-bold text-[#57AE8F]">{importResult.success}</p>
                    <p className="text-xs text-muted-foreground">成功</p>
                  </div>
                  <div className="w-px h-12 bg-border" />
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#E88383]/20 mx-auto mb-2">
                      <XCircle size={24} className="text-[#DD7373]" />
                    </div>
                    <p className="font-mono text-xl font-bold text-[#DD7373]">{importResult.fail}</p>
                    <p className="text-xs text-muted-foreground">失败</p>
                  </div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="bg-[#E88383]/20 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-medium text-[#DD7373]">失败记录：</p>
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-[#DD7373]">{err}</p>
                    ))}
                    <button onClick={handleDownloadErrorLog} className="mt-2 w-full py-1.5 text-xs border border-[#E88383]/40 text-[#DD7373] rounded hover:bg-[#E88383]/25">
                      下载错误日志
                    </button>
                  </div>
                )}
                <button onClick={() => { setShowImportModal(false); setImportResult(null); }} className="w-full py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">完成</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTeacherManagement;
