import { useState, useEffect } from "react";
import { Search, Plus, Trash2 } from "lucide-react";
import { getAdminCourses, deleteAdminCourse, type AdminCourse } from "../../../services/adminService";

function AdminCourses() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageNum, setPageNum] = useState(1);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<AdminCourse | null>(null);

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
        <button onClick={() => showToastMsg("新增课程功能开发中")} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-[#7F84D6]">
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
                      <button onClick={() => showToastMsg("课程详情功能开发中")} className="text-primary hover:underline text-xs">详情</button>
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
    </div>
  );
}

export default AdminCourses;
