import { useState, useEffect } from "react";
import { Search, Plus, Trash2 } from "lucide-react";
import { createAdminCourse, getAdminCourses, deleteAdminCourse, type AdminCourse } from "../../../services/adminService";
import { getTeacherList, type TeacherVO } from "../../../services/teacherService";

function AdminCourses() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageNum, setPageNum] = useState(1);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<AdminCourse | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<AdminCourse | null>(null);
  const [teachers, setTeachers] = useState<TeacherVO[]>([]);
  const [form, setForm] = useState({ courseNo: "", courseName: "", teacherId: "", semester: "", className: "", credit: "", courseType: "必修", description: "" });

  const showToastMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  const loadCourses = () => {
    setLoading(true);
    getAdminCourses(pageNum, 10, search || undefined).then(data => {
      setCourses(data.records || []);
      setTotal(data.total || 0);
    }).catch(() => {
      setCourses([]);
      setTotal(0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadCourses(); }, [pageNum]);
  useEffect(() => { getTeacherList(1, 500).then(d => setTeachers(d.records || [])).catch(() => setTeachers([])); }, []);

  const handleSearch = () => { setPageNum(1); loadCourses(); };

  const handleDelete = async (course: AdminCourse) => {
    try {
      await deleteAdminCourse(course.id);
      showToastMsg("课程已删除");
      setShowDeleteConfirm(null);
      loadCourses();
    } catch (e: any) {
      showToastMsg(e.message || "删除失败");
    }
  };

  const handleCreate = async () => {
    if (!form.courseNo || !form.courseName || !form.teacherId || !form.semester) { showToastMsg("请填写课程编号、名称、教师和学期"); return; }
    try {
      await createAdminCourse({ ...form, teacherId: Number(form.teacherId), credit: form.credit ? Number(form.credit) : undefined });
      setShowCreate(false); setForm({ courseNo: "", courseName: "", teacherId: "", semester: "", className: "", credit: "", courseType: "必修", description: "" });
      showToastMsg("课程创建成功"); loadCourses();
    } catch (e: any) { showToastMsg(e.message || "创建失败"); }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="搜索课程名/课程编码..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <button onClick={handleSearch} className="px-3 py-2 text-sm bg-card border border-border rounded-md hover:bg-accent">搜索</button>
        <select className="py-2 px-3 text-sm bg-card border border-border rounded-md">
          <option>全部状态</option><option>进行中</option><option>已结束</option>
        </select>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-[#7F84D6]">
          <Plus size={13} />新增课程
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">加载中...</div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["课程编码", "课程名称", "授课教师", "学期", "选课人数", "操作"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courses.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{c.courseNo || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.courseName || '-'}</div>
                    {c.className && c.className !== c.courseName && (
                      <div className="text-xs text-muted-foreground">{c.className}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{c.teacherName || '-'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.semester || '-'}</td>
                  <td className="px-4 py-3 font-mono">{c.studentCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowDetail(c)} className="text-primary hover:underline text-xs">详情</button>
                      <button onClick={() => setShowDeleteConfirm(c)} className="text-[#DD7373] hover:underline text-xs flex items-center gap-1">
                        <Trash2 size={12} />删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">暂无课程数据</td></tr>
              )}
            </tbody>
          </table>
          {total > 10 && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>共 {total} 条记录</span>
              <div className="flex items-center gap-2">
                <button disabled={pageNum <= 1} onClick={() => setPageNum(p => p - 1)} className="px-2 py-1 border border-border rounded hover:bg-accent disabled:opacity-50">上一页</button>
                <span className="px-2 py-1 bg-primary text-white rounded">{pageNum}</span>
                <button disabled={pageNum * 10 >= total} onClick={() => setPageNum(p => p + 1)} className="px-2 py-1 border border-border rounded hover:bg-accent disabled:opacity-50">下一页</button>
              </div>
            </div>
          )}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold">确认删除</h3>
            <p className="text-sm text-muted-foreground">确定要删除课程「{showDeleteConfirm.courseName || showDeleteConfirm.className}」吗？此操作不可恢复。</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 py-2 bg-[#E88383] text-white rounded-md text-sm hover:bg-[#DD7373]">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-card rounded-lg border border-border w-full max-w-lg p-6 space-y-4">
          <h3 className="font-semibold">新增课程</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm">课程编号<input value={form.courseNo} onChange={e => setForm({ ...form, courseNo: e.target.value })} className="mt-1 w-full p-2 border border-border rounded" /></label>
            <label className="text-sm">课程名称<input value={form.courseName} onChange={e => setForm({ ...form, courseName: e.target.value })} className="mt-1 w-full p-2 border border-border rounded" /></label>
            <label className="text-sm">授课教师<select value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })} className="mt-1 w-full p-2 border border-border rounded"><option value="">请选择</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}（{t.teacherNo}）</option>)}</select></label>
            <label className="text-sm">学期<input placeholder="2025-2026-1" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} className="mt-1 w-full p-2 border border-border rounded" /></label>
            <label className="text-sm">班级名称<input value={form.className} onChange={e => setForm({ ...form, className: e.target.value })} className="mt-1 w-full p-2 border border-border rounded" /></label>
            <label className="text-sm">学分<input type="number" min="0" step="0.5" value={form.credit} onChange={e => setForm({ ...form, credit: e.target.value })} className="mt-1 w-full p-2 border border-border rounded" /></label>
          </div><label className="text-sm block">课程说明<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full p-2 border border-border rounded" rows={2} /></label>
          <div className="flex justify-end gap-3"><button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-border rounded text-sm">取消</button><button onClick={handleCreate} className="px-4 py-2 bg-primary text-white rounded text-sm">创建课程</button></div>
        </div></div>
      )}
      {showDetail && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-3"><h3 className="font-semibold">课程详情</h3><div className="text-sm space-y-2"><p><span className="text-muted-foreground">课程：</span>{showDetail.courseName}</p><p><span className="text-muted-foreground">编号：</span>{showDetail.courseNo || "—"}</p><p><span className="text-muted-foreground">教师：</span>{showDetail.teacherName || "—"}</p><p><span className="text-muted-foreground">学期：</span>{showDetail.semester || "—"}</p><p><span className="text-muted-foreground">班级：</span>{showDetail.className || "—"}</p><p><span className="text-muted-foreground">选课人数：</span>{showDetail.studentCount ?? 0}</p></div><div className="text-right"><button onClick={() => setShowDetail(null)} className="px-4 py-2 border border-border rounded text-sm">关闭</button></div></div></div>}
    </div>
  );
}

export default AdminCourses;
