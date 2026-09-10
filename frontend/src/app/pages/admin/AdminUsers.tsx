import { useState, useEffect } from "react";
import { Search, Download, Plus, Trash2 } from "lucide-react";
import { getTeacherList, type TeacherVO } from "../../../services/teacherService";
import { getAdminStudents, deleteAdminStudent, type AdminStudent } from "../../../services/adminService";
import { Tag, roleLabel } from "../../utils";

type UserRow = {
  id: number;
  uid: string;
  name: string;
  role: string;
  college: string;
  class: string;
  status: string;
  created: string;
  _source: "teacher" | "student";
};

function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<UserRow | null>(null);

  const showToastMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  useEffect(() => {
    Promise.all([
      getTeacherList(1, 100).catch(() => ({ records: [] as TeacherVO[] })),
      getAdminStudents(1, 200).catch(() => ({ records: [] as AdminStudent[] })),
    ]).then(([teacherRes, studentRes]) => {
      const teacherRows: UserRow[] = (teacherRes.records || []).map(t => ({
        id: t.id, uid: t.teacherNo || '', name: t.name || '',
        role: 'teacher', college: t.college || '', class: '—',
        status: t.status === 'ACTIVE' ? 'active' : 'inactive',
        created: t.createTime || '', _source: 'teacher',
      }));
      const studentRows: UserRow[] = (studentRes.records || []).map(s => ({
        id: s.id, uid: s.studentNo || '', name: s.name || '',
        role: 'student', college: s.college || '', class: s.className || '—',
        status: s.status === 'ACTIVE' ? 'active' : 'inactive',
        created: s.createTime || '', _source: 'student',
      }));
      setUsers([...teacherRows, ...studentRows]);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.name.includes(search) || u.uid.includes(search);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleDelete = async (user: UserRow) => {
    try {
      if (user._source === "student") {
        await deleteAdminStudent(user.id);
      } else {
        showToastMsg("教师删除请前往「教师账号管理」");
        return;
      }
      setUsers(prev => prev.filter(u => u.id !== user.id));
      showToastMsg("删除成功");
      setShowDeleteConfirm(null);
    } catch (e: any) {
      showToastMsg(e.message || "删除失败");
    }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">{toast}</div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索姓名/学号..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="py-2 px-3 text-sm bg-card border border-border rounded-md focus:outline-none">
          <option value="all">全部角色</option>
          <option value="teacher">教师</option>
          <option value="student">学生</option>
        </select>
        <button onClick={() => showToastMsg("导出功能开发中")} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-md hover:bg-accent">
          <Download size={13} />导出
        </button>
        <button onClick={() => showToastMsg("新增用户请前往对应角色管理页面")} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-[#7F84D6]">
          <Plus size={13} />新增用户
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">加载中...</div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["序号", "学号/工号", "姓名", "角色", "所属学院", "状态", "创建时间", "操作"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={`${u._source}-${u.id}`} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs">{u.uid}</td>
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3">{roleLabel(u.role)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.college || '—'}</td>
                  <td className="px-4 py-3">
                    {u.status === "active" ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.created || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => showToastMsg("编辑功能开发中")} className="text-primary hover:underline text-xs">编辑</button>
                      <button onClick={() => showToastMsg("重置密码请前往教师账号管理")} className="text-[#E8945C] hover:underline text-xs">重置密码</button>
                      <button onClick={() => setShowDeleteConfirm(u)} className="text-[#DD7373] hover:underline text-xs flex items-center gap-1">
                        <Trash2 size={12} />删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">暂无用户数据</td></tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>共 {filtered.length} 条记录</span>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold">确认删除</h3>
            <p className="text-sm text-muted-foreground">
              确定要删除{showDeleteConfirm._source === "student" ? "学生" : "用户"}「{showDeleteConfirm.name}」吗？
              {showDeleteConfirm._source === "student" && "关联的登录账号也将一并删除。"}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 py-2 bg-[#E88383] text-white rounded-md text-sm hover:bg-[#DD7373]">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
