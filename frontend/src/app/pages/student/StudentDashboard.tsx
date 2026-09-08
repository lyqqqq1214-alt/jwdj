import { useState, useEffect } from "react";
import { ChevronDown, Target, Activity, CheckCircle, Clock, User, TrendingUp, BookOpen, Brain, FileText } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { getCurrentUser } from "../../../services/authService";
import { getStudentCourses, getStudentOverview, getStudentTrends, StudentCourse, StudentOverview } from "../../../services/studentService";
import { getPendingExams, ExamPaper } from "../../../services/examService";
import { StatCard } from "../../utils";
import { Page } from "../../types";

function StudentDashboard({ onNav, setSelectedCourseId: setGlobalCourseId }: { onNav: (p: Page) => void, setSelectedCourseId?: (id: number | null) => void }) {
  const currentUser = getCurrentUser();
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [studentOverview, setStudentOverview] = useState<StudentOverview | null>(null);
  const [scoreTrends, setScoreTrends] = useState<any[]>([]);
  const [pendingExamList, setPendingExamList] = useState<ExamPaper[]>([]);

  useEffect(() => {
    getStudentCourses().then(courses => {
      setStudentCourses(courses);
      if (courses.length > 0) {
        const saved = localStorage.getItem("selectedCourseId");
        const savedId = saved ? parseInt(saved) : null;
        const found = savedId && courses.find(c => c.id === savedId);
        const initialId = found ? savedId! : courses[0].id;
      setSelectedCourseId(initialId);
      if (setGlobalCourseId) setGlobalCourseId(initialId);
    }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    getStudentOverview(selectedCourseId).then(data => {
      setStudentOverview(data);
    }).catch(() => {
      setStudentOverview(null);
    });
    getStudentTrends(selectedCourseId).then(data => {
      setScoreTrends(data);
    }).catch(() => {
      setScoreTrends([]);
    });
    getPendingExams().then(data => {
      setPendingExamList(data);
    }).catch(() => {
      setPendingExamList([]);
    });
  }, [selectedCourseId]);

  const selectedCourse = studentCourses.find(c => c.id === selectedCourseId);
  const courseScoreTrend = scoreTrends.length > 0 ? scoreTrends.map((t: any) => ({ exam: t.name, score: t.score || 0, classAvg: t.classAvg || 0 })) : [];
  const pendingExams = pendingExamList.length;

  const handleCourseChange = (courseId: number) => {
    setSelectedCourseId(courseId);
    if (setGlobalCourseId) setGlobalCourseId(courseId);
    localStorage.setItem("selectedCourseId", courseId.toString());
  };

  const studentName = currentUser?.displayName || "同学";

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#969BE7] to-[#C8A2E8] rounded-lg p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold">你好，{studentName} 👋</h2>
            <p className="text-white/90 text-sm mt-1">{selectedCourse?.semester || ""} · {selectedCourse?.className || ""}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/75">当前课程</span>
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
        </div>
        <div className="mt-3 flex items-center gap-4">
          <div>
            <p className="text-xs text-white/75">授课教师</p>
            <p className="font-medium">{selectedCourse?.teacherName || "—"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard count={studentOverview?.currentScore ?? "—"} label="当前成绩" icon={Target} color="blue" />
        <StatCard count={`${studentOverview?.attendanceRate ?? 0}%`} label="出勤率" icon={Activity} color="green" />
        <StatCard count={`${studentOverview?.homeworkRate ?? 0}%`} label="作业提交率" icon={CheckCircle} color="purple" />
        <StatCard count={pendingExams} label="待完成考试" icon={Clock} color="orange" />
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-sm">成绩趋势</h3>
          <span className="text-xs text-muted-foreground">{selectedCourse?.courseName || ""}</span>
        </div>
        {courseScoreTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={courseScoreTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="exam" tick={{ fontSize: 10 }} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#969BE7" strokeWidth={2} dot={{ r: 4 }} name="我的成绩" />
              <Line type="monotone" dataKey="classAvg" stroke="#B8B8CE" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" name="班级均值" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">暂无成绩数据</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="font-medium text-sm mb-4">待参加考试</h3>
          <div className="space-y-3">
            {pendingExamList.filter(e => e.status === "pending").map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedCourse?.courseName || ""} · {e.duration}分钟</p>
                </div>
                <div className="text-right">
                  <button onClick={() => onNav("student-exam")} className="mt-1 px-3 py-1 text-xs bg-primary text-white rounded hover:bg-[#7F84D6]">
                    参加考试
                  </button>
                </div>
              </div>
            ))}
            {pendingExamList.filter(e => e.status === "pending").length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">暂无待参加考试</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="font-medium text-sm mb-4">预警提示</h3>
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground py-4">暂无预警提示</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="font-medium text-sm mb-4">快捷入口</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: User, label: "我的画像", page: "student-profile" as Page, color: "blue" },
            { icon: TrendingUp, label: "成绩趋势", page: "student-score-trend" as Page, color: "green" },
            { icon: BookOpen, label: "错题本", page: "student-wrong-book" as Page, color: "purple" },
            { icon: Clock, label: "在线考试", page: "student-exam" as Page, color: "orange" },
            { icon: Brain, label: "学习建议", page: "student-profile" as Page, color: "cyan" },
            { icon: FileText, label: "课程资料", page: "student-profile" as Page, color: "pink" },
          ].map(item => (
            <button key={item.label} onClick={() => onNav(item.page)}
              className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-lg hover:bg-accent transition-colors">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color === "blue" ? "bg-[#969BE7]/20 text-[#969BE7]" : item.color === "green" ? "bg-[#74C2A0]/20 text-[#57AE8F]" : item.color === "purple" ? "bg-[#969BE7]/20 text-[#969BE7]" : item.color === "orange" ? "bg-[#F2A56B]/20 text-[#E8945C]" : item.color === "cyan" ? "bg-[#55AEC2]/20 text-[#55AEC2]" : "bg-[#D98BA8]/20 text-[#D98BA8]"}`}>
                <item.icon size={18} />
              </div>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
