import { useState, useEffect } from "react";
import { Search, Download, Plus, X } from "lucide-react";
import { getTeacherList } from "../../../services/teacherService";
import { Tag, roleLabel } from "../../utils";
import { mockUsers } from "../../constants";

function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState<{ id: number; uid: string; name: string; role: string; college: string; class: string; status: string; created: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeacherList(1, 100).then(data => {
      const teacherUsers = (data.records || []).map(t => ({
        id: t.id, uid: t.teacherNo || '', name: t.name || '',
        role: 'teacher', college: t.college || '', class: '—',
        status: t.status === 'ACTIVE' ? 'active' : 'inactive', created: t.createTime || '',
      }));
      const otherUsers = mockUsers.filter(u => u.role !== 'teacher');
      setUsers([...teacherUsers, ...otherUsers]);
    }).catch(() => {
      setUsers(mockUsers);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.name.includes(search) || u.uid.includes(search);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-4">
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
          <option value="admin">管理员</option>
          <option value="teacher">教师</option>
          <option value="student">学生</option>
        </select>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-md hover:bg-accent">
          <Download size={13} />导出
        </button>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-[#7F84D6]">
          <Plus size={13} />新增用户
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">加载中...</div>
      ) : (
        <>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="w-10 px-4 py-3 text-left"><input type="checkbox" /></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">序号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">学号/工号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">姓名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">角色</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">所属学院</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">创建时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3"><input type="checkbox" /></td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs">{u.uid}</td>
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3">{roleLabel(u.role)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.college}</td>
                    <td className="px-4 py-3">
                      {u.status === "active" ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.created}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-primary hover:underline text-xs">编辑</button>
                        <button className="text-[#E8945C] hover:underline text-xs">重置密码</button>
                        <button className="text-[#DD7373] hover:underline text-xs">删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground text-sm">暂无用户数据</td></tr>
                )}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>共 {filtered.length} 条记录</span>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 border border-border rounded hover:bg-accent">上一页</button>
                <span className="px-2 py-1 bg-primary text-white rounded">1</span>
                <button className="px-2 py-1 border border-border rounded hover:bg-accent">下一页</button>
              </div>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">新增用户</h3>
              <button onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              {[["学号/工号", "请输入"], ["姓名", "请输入"], ["所属学院", "请输入"], ["班级（学生）", "请输入"]].map(([label, ph]) => (
                <div key={label}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <input placeholder={ph} className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              ))}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">角色</label>
                <select className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none">
                  <option>学生</option><option>教师</option><option>管理员</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">确认新增</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
