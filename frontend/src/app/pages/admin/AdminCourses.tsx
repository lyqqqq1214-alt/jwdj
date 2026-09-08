import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { getMyCourses, ClassVO } from "../../../services/dashboardService";

function AdminCourses() {
  const [courses, setCourses] = useState<ClassVO[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyCourses().then(data => {
      setCourses(data || []);
    }).catch(() => {
      setCourses([]);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c => {
    const keyword = search.toLowerCase();
    return !keyword || (c.courseName || '').toLowerCase().includes(keyword)
      || (c.courseNo || '').toLowerCase().includes(keyword);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索课程名/课程编码..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select className="py-2 px-3 text-sm bg-card border border-border rounded-md">
          <option>全部状态</option><option>进行中</option><option>已结束</option>
        </select>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-[#7F84D6]">
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
                {["课程编码", "课程名称", "学期", "选课人数", "操作"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{c.courseNo || '-'}</td>
                  <td className="px-4 py-3 font-medium">{c.courseName || c.className}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.semester || '-'}</td>
                  <td className="px-4 py-3 font-mono">{c.studentCount ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="text-primary hover:underline text-xs">编辑</button>
                      <button className="text-primary hover:underline text-xs">详情</button>
                      <button className="text-[#DD7373] hover:underline text-xs">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">暂无课程数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminCourses;
