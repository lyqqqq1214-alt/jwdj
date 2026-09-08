import { useState, useRef, useEffect } from "react";
import { Upload, Download, CheckCircle, AlertTriangle, X } from "lucide-react";
import {
  uploadFile, getImportHistory, downloadTemplate as fetchTemplateBlob, ImportLog
} from "../../../services/importService";
import { getMyCourses, ClassVO } from "../../../services/dashboardService";
import { Tag } from "../../utils";

function TeacherDataImport() {
  const [activeTab, setActiveTab] = useState("homework");
  const [toast, setToast] = useState<{ msg: string; variant: "success" | "warn" | "error" } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [importResult, setImportResult] = useState({
    fileName: "", totalRows: 0, successRows: 0, failRows: 0, skippedRows: 0,
    errors: [] as string[], warnings: [] as string[],
  });
  // 课程选择器 + 考核信息
  const [courses, setCourses] = useState<ClassVO[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [assessmentName, setAssessmentName] = useState("");
  const [examType, setExamType] = useState<"MIDTERM" | "FINAL">("MIDTERM");

  const showToastMsg = (msg: string, variant: "success" | "warn" | "error" = "success") => {
    setToast({ msg, variant });
    setTimeout(() => setToast(null), 3000);
  };

  const tabs = [
    { key: "homework", label: "作业成绩" },
    { key: "attendance", label: "考勤记录" },
    { key: "experiment", label: "实验报告" },
    { key: "quiz", label: "测验成绩" },
    { key: "exam", label: "期中/期末成绩" },
    { key: "student", label: "学生名单(选课导入)" },
  ];

  // 与后端导入模板/解析逻辑一致的列说明（详见 docs/import-templates.md）
  const templates: Record<string, string[]> = {
    homework: ["序号", "学号", "姓名", "第1~N题得分", "扣分主要知识点(每题一列)", "总成绩", "最薄弱知识点"],
    attendance: ["学号", "姓名", "日期(yyyy-MM-dd)", "状态", "节次", "第几周", "备注"],
    experiment: ["学号", "姓名", "实验名称", "实验次数", "分数", "提交时间(yyyy-MM-dd HH:mm:ss)", "备注"],
    quiz: ["序号", "学号", "姓名", "第1~N题得分", "扣分主要知识点(每题一列)", "总成绩", "最薄弱知识点"],
    exam: ["序号", "学号", "姓名", "第1~N题得分", "扣分主要知识点(每题一列)", "总成绩", "最薄弱知识点"],
    student: ["学号", "姓名", "性别", "学院", "专业", "班级", "年级", "邮箱"],
  };

  const importTypeMap: Record<string, string> = {
    homework: "HOMEWORK", attendance: "ATTENDANCE", experiment: "EXPERIMENT",
    quiz: "QUIZ", exam: "EXAM_SCORE", student: "CLASS_STUDENT",
  };

  /** 当前 tab 是否为成绩类导入（需要填写考核名称） */
  const needsAssessment = ["homework", "quiz", "exam"].includes(activeTab);

  // 加载导入历史 + 教师课程列表
  useEffect(() => {
    setLoadingHistory(true);
    getImportHistory(1, 20).then(data => {
      setImportHistory(data.records || []);
    }).catch(() => {}).finally(() => setLoadingHistory(false));
    getMyCourses().then(list => {
      setCourses(list || []);
      if (list && list.length === 1) setSelectedCourseId(String(list[0].id));
    }).catch(() => {});
  }, []);

  // 触发文件选择
  const handleClickUpload = () => {
    if (!selectedCourseId) {
      showToastMsg("请先选择归属课程", "warn");
      return;
    }
    if (needsAssessment && !assessmentName.trim()) {
      showToastMsg("请先填写考核名称（如：第1次作业）", "warn");
      return;
    }
    fileInputRef.current?.click();
  };

  // 处理文件选择并上传
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadFile(file, importTypeMap[activeTab] || activeTab, {
        courseId: Number(selectedCourseId),
        assessmentName: needsAssessment ? assessmentName.trim() : undefined,
        assessmentType: activeTab === "exam" ? examType : undefined,
      });
      setImportResult({
        fileName: file.name,
        totalRows: result.totalRows || (result.successRows + result.failRows + (result.skippedRows || 0)),
        successRows: result.successRows,
        failRows: result.failRows,
        skippedRows: result.skippedRows || 0,
        errors: result.errors || [],
        warnings: result.warnings || [],
      });
      setShowResultModal(true);
      // 刷新历史
      getImportHistory(1, 20).then(data => setImportHistory(data.records || [])).catch(() => {});
    } catch (err: any) {
      showToastMsg(err?.message || "上传失败，请检查文件格式", "error");
    } finally {
      setUploading(false);
      // 重置 input 以允许重复上传同一文件
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadErrorLog = () => {
    const logContent = importResult.errors.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `导入错误日志_${importResult.fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToastMsg("错误日志已下载");
  };

  // 关闭结果弹窗时按真实结果提示
  const handleCloseResult = () => {
    setShowResultModal(false);
    if (importResult.failRows === 0 && importResult.successRows > 0) {
      showToastMsg(`成功导入 ${importResult.successRows} 条数据${importResult.skippedRows > 0 ? `，跳过 ${importResult.skippedRows} 条` : ""}`, "success");
    } else if (importResult.successRows > 0) {
      showToastMsg(`成功 ${importResult.successRows} 条，失败 ${importResult.failRows} 条，跳过 ${importResult.skippedRows} 条`, "warn");
    } else {
      showToastMsg("导入失败，未写入任何数据，请查看错误详情", "error");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await fetchTemplateBlob(importTypeMap[activeTab] || activeTab);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tabs.find(t => t.key === activeTab)?.label}_模板.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToastMsg("模板下载失败", "error");
    }
  };

  const toastStyle = toast?.variant === "error" ? "bg-[#E07070]" : toast?.variant === "warn" ? "bg-[#F0B968]" : "bg-[#5FAF8E]";

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 ${toastStyle} text-white text-sm rounded-lg shadow-lg`}>
          <div className="flex items-center gap-2">
            {toast.variant === "success" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            {toast.msg}
          </div>
        </div>
      )}

      {/* 课程选择 + 考核信息 */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">归属课程 <span className="text-[#DD7373]">*</span></label>
            <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}
              className="min-w-[260px] px-3 py-2 text-sm border border-border rounded-md bg-background">
              <option value="">请选择课程</option>
              {courses.map(c => (
                <option key={c.id} value={String(c.id)}>
                  {c.courseName || c.className}{c.courseNo ? ` (${c.courseNo}` : ""}{c.semester ? ` · ${c.semester})` : c.courseNo ? ")" : ""}
                </option>
              ))}
            </select>
          </div>
          {needsAssessment && (
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">考核名称 <span className="text-[#DD7373]">*</span></label>
              <input type="text" value={assessmentName} onChange={e => setAssessmentName(e.target.value)}
                placeholder={activeTab === "exam" ? "如：期中考试" : activeTab === "quiz" ? "如：第1次测验" : "如：第1次作业"}
                className="min-w-[200px] px-3 py-2 text-sm border border-border rounded-md bg-background" />
            </div>
          )}
          {activeTab === "exam" && (
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">考试类型 <span className="text-[#DD7373]">*</span></label>
              <div className="flex gap-3 py-2">
                {([["MIDTERM", "期中"], ["FINAL", "期末"]] as const).map(([val, label]) => (
                  <label key={val} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" name="examType" checked={examType === val} onChange={() => setExamType(val)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}
          {activeTab === "student" && (
            <p className="text-xs text-muted-foreground pb-2">
              名单中不存在的学生将自动创建账号（初始密码为系统默认），并加入所选课程的选课名单
            </p>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border px-4">
        <div className="flex gap-0 border-b border-border">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors
                ${activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-6">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" data-testid="import-file-input" />
          <div onClick={handleClickUpload}
            className={`border-2 border-dashed border-border rounded-lg p-10 text-center transition-colors
              ${uploading ? "opacity-50 cursor-not-allowed" : !selectedCourseId ? "opacity-60 cursor-pointer" : "hover:border-primary cursor-pointer"}`}>
            {uploading ? (
              <>
                <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-3" />
                <p className="font-medium text-sm">正在上传并导入...</p>
              </>
            ) : (
              <>
                <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="font-medium text-sm">{selectedCourseId ? "拖拽文件到此处，或点击上传" : "请先在上方选择归属课程"}</p>
                <p className="text-xs text-muted-foreground mt-1">支持 .xlsx, .xls, .csv 格式</p>
              </>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              模板字段：{templates[activeTab].join("、")}
            </div>
            <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-md hover:bg-accent">
              <Download size={14} />下载模板
            </button>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="font-medium text-sm mb-4">上传说明</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>1. 先在上方选择归属课程{needsAssessment ? "并填写考核名称" : ""}，再上传文件</p>
            <p>2. 下载模板文件，按照模板格式填写数据（首行为表头，列名需与模板一致）</p>
            <p>3. 成绩/考勤/实验导入要求学生已在系统中，请先通过"学生名单"导入学生</p>
            <p>4. 上传即导入：成功行立即写入数据库，失败行会在结果中列出原因</p>
            <p>5. 重复数据（如已导入过的学号/成绩记录）会自动跳过并提示</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-medium text-sm">上传历史</h3>
        </div>
        {loadingHistory ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">加载中...</div>
        ) : importHistory.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">暂无导入记录</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["文件名", "数据类型", "上传时间", "成功条数", "失败条数", "状态"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {importHistory.map(h => (
                <tr key={h.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                  <td className="px-4 py-3 font-medium text-xs">{h.fileName || '-'}</td>
                  <td className="px-4 py-3"><Tag color="blue">{h.importType || '-'}</Tag></td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{h.createTime || '-'}</td>
                  <td className="px-4 py-3 font-mono text-[#57AE8F]">{h.successRows ?? 0}</td>
                  <td className="px-4 py-3 font-mono text-[#DD7373]">{h.failRows ?? 0}</td>
                  <td className="px-4 py-3">
                    {h.status === "SUCCESS" ? <Tag color="green">成功</Tag>
                      : h.status === "PARTIAL" ? <Tag color="orange">部分失败</Tag>
                      : <Tag color="red">失败</Tag>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showResultModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[80vh] p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">导入结果</h3>
              <button onClick={handleCloseResult}><X size={16} /></button>
            </div>
            <div className="grid grid-cols-5 gap-3 mb-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">文件</p>
                <p className="text-sm font-medium truncate">{importResult.fileName}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">总行数</p>
                <p className="text-sm font-bold text-primary">{importResult.totalRows}</p>
              </div>
              <div className="bg-[#74C2A0]/20 rounded-lg p-3 text-center">
                <p className="text-xs text-[#57AE8F]">成功</p>
                <p className="text-sm font-bold text-[#57AE8F]">{importResult.successRows}</p>
              </div>
              <div className="bg-[#E88383]/20 rounded-lg p-3 text-center">
                <p className="text-xs text-[#DD7373]">失败</p>
                <p className="text-sm font-bold text-[#DD7373]">{importResult.failRows}</p>
              </div>
              <div className="bg-[#EEC1DD]/30 rounded-lg p-3 text-center">
                <p className="text-xs text-[#C972A8]">跳过</p>
                <p className="text-sm font-bold text-[#C972A8]">{importResult.skippedRows}</p>
              </div>
            </div>
            {(importResult.errors.length > 0 || importResult.warnings.length > 0) && (
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {importResult.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">错误详情</h4>
                    <div className="space-y-2">
                      {importResult.errors.map((msg, i) => (
                        <div key={i} className="bg-[#E88383]/20 border border-[#E88383]/40 rounded-lg px-3 py-2">
                          <span className="text-xs text-[#DD7373]">{msg}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {importResult.warnings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">跳过明细</h4>
                    <div className="space-y-2">
                      {importResult.warnings.map((msg, i) => (
                        <div key={i} className="bg-[#EEC1DD]/30 border border-[#EEC1DD]/60 rounded-lg px-3 py-2">
                          <span className="text-xs text-[#C972A8]">{msg}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button onClick={handleDownloadErrorLog} disabled={importResult.errors.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed">
                <Download size={14} />下载错误日志
              </button>
              <button onClick={handleCloseResult} className="px-4 py-2 text-sm bg-primary text-white rounded-md">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDataImport;
