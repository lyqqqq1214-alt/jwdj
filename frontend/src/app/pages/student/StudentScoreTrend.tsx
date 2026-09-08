import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { getStudentCourses, getStudentTrends, StudentCourse } from "../../../services/studentService";

function StudentScoreTrend() {
  const [showClassAvg, setShowClassAvg] = useState(true);
  const [apiTrends, setApiTrends] = useState<{ exam: string; score: number; classAvg: number }[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  useEffect(() => {
    getStudentCourses().then(courses => {
      setStudentCourses(courses);
      if (courses.length > 0) {
        const saved = localStorage.getItem("selectedCourseId");
        const savedId = saved ? parseInt(saved) : null;
        const found = savedId && courses.find(c => c.id === savedId);
        setSelectedCourseId(found ? savedId! : courses[0].id);
      }
    }).catch(() => {});
  }, []);

  const selectedCourse = studentCourses.find(c => c.id === selectedCourseId);

  useEffect(() => {
    if (!selectedCourseId) return;
    setLoadingTrends(true);
    getStudentTrends(selectedCourseId).then(data => {
      if (data && data.length > 0) {
        setApiTrends(data.map(item => ({
          exam: item.name,
          score: typeof item.score === 'number' ? item.score : 0,
          classAvg: typeof item.classAvg === 'number' ? item.classAvg : 0,
        })));
      } else {
        setApiTrends([]);
      }
    }).catch(() => setApiTrends([])).finally(() => setLoadingTrends(false));
  }, [selectedCourseId]);

  const handleCourseChange = (courseId: number) => {
    setSelectedCourseId(courseId);
    localStorage.setItem("selectedCourseId", courseId.toString());
  };

  const courseScoreTrend = apiTrends;

  const stats = courseScoreTrend.length > 0 ? {
    max: Math.max(...courseScoreTrend.map(s => s.score)),
    min: Math.min(...courseScoreTrend.map(s => s.score)),
    avg: Math.round(courseScoreTrend.reduce((sum, s) => sum + s.score, 0) / courseScoreTrend.length),
    std: Math.round(Math.sqrt(courseScoreTrend.reduce((sum, s) => sum + Math.pow(s.score - (courseScoreTrend.reduce((sum, s) => sum + s.score, 0) / courseScoreTrend.length), 2), 0) / courseScoreTrend.length) * 10) / 10,
  } : null;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#969BE7] to-[#C8A2E8] rounded-lg p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold">成绩趋势分析</h2>
            <p className="text-white/90 text-sm mt-1">{selectedCourse?.courseName || ""}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/75">选择课程</span>
              <div className="relative">
                <select value={selectedCourseId || ""} onChange={e => handleCourseChange(parseInt(e.target.value))}
                  className="appearance-none bg-white/20 backdrop-blur-sm text-white px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer hover:bg-white/30 transition-colors">
                  {studentCourses.map(c => (
                    <option key={c.id} value={c.id} className="text-[#4A4A6A]">
                      {c.courseName}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-2.5 text-white pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showClassAvg} onChange={e => setShowClassAvg(e.target.checked)} className="rounded" />
                显示班级均值
              </label>
            </div>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">最高分</p>
            <p className="font-mono text-2xl font-bold text-primary mt-1">{stats.max}</p>
            <p className="text-xs text-muted-foreground mt-1">{courseScoreTrend.find(s => s.score === stats.max)?.exam}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">最低分</p>
            <p className="font-mono text-2xl font-bold text-[#DD7373] mt-1">{stats.min}</p>
            <p className="text-xs text-muted-foreground mt-1">{courseScoreTrend.find(s => s.score === stats.min)?.exam}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">平均分</p>
            <p className="font-mono text-2xl font-bold text-[#969BE7] mt-1">{stats.avg}</p>
            <p className="text-xs text-muted-foreground mt-1">{courseScoreTrend.length}次考试</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">标准差</p>
            <p className="font-mono text-2xl font-bold text-[#969BE7] mt-1">{stats.std}</p>
            <p className="text-xs text-muted-foreground mt-1">成绩波动</p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-sm">成绩变化趋势</h3>
          <span className="text-xs text-muted-foreground">{selectedCourse?.courseName || ""}</span>
        </div>
        {courseScoreTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={courseScoreTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="exam" tick={{ fontSize: 11 }} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => `${v}分`} />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#969BE7" strokeWidth={2} dot={{ r: 4 }} name="我的成绩" />
              {showClassAvg && (
                <Line type="monotone" dataKey="classAvg" stroke="#B8B8CE" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" name="班级均值" />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">暂无成绩数据</p>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/50">
          <h3 className="font-medium text-sm">成绩详情</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">考试名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">我的分数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">班级均分</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">与均值差值</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">变化趋势</th>
              </tr>
            </thead>
            <tbody>
              {courseScoreTrend.map((item, i) => {
                const diff = item.score - item.classAvg;
                const prevScore = i > 0 ? courseScoreTrend[i - 1].score : null;
                const trend = prevScore !== null ? (item.score - prevScore >= 0 ? `+${item.score - prevScore}` : item.score - prevScore) : "-";
                return (
                  <tr key={item.exam} className="border-b border-border last:border-0 hover:bg-accent/30">
                    <td className="px-4 py-3 font-medium">{item.exam}</td>
                    <td className="px-4 py-3 font-mono font-semibold">{item.score}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{item.classAvg}</td>
                    <td className={`px-4 py-3 font-mono ${diff >= 0 ? "text-[#57AE8F]" : "text-[#DD7373]"}`}>
                      {diff >= 0 ? "+" : ""}{diff}
                    </td>
                    <td className={`px-4 py-3 font-mono text-xs ${prevScore !== null && item.score >= prevScore ? "text-[#57AE8F]" : prevScore !== null ? "text-[#DD7373]" : "text-muted-foreground"}`}>
                      {trend}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StudentScoreTrend;
