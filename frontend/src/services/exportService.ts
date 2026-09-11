import api from './api';

/**
 * 导出课程成绩报表（Excel下载）
 * 由于导出接口直接返回文件流，需要以 blob 方式下载
 */
export async function exportCourse(courseId: number, fileName?: string) {
  const res = await api.get(`/export/course/${courseId}`, {
    responseType: 'blob'
  });
  downloadBlob(res, fileName || `课程成绩报表_${courseId}.xlsx`);
}

/**
 * 导出教师所带班级汇总报表
 */
export async function exportTeacher(teacherId: number, fileName?: string) {
  const res = await api.get(`/export/teacher/${teacherId}`, {
    responseType: 'blob'
  });
  downloadBlob(res, fileName || `教师班级汇总_${teacherId}.xlsx`);
}

/**
 * 导出全院成绩汇总报表
 */
export async function exportCollege(fileName?: string) {
  const res = await api.get('/export/college', {
    responseType: 'blob'
  });
  downloadBlob(res, fileName || '全院成绩汇总.xlsx');
}

/**
 * 导出指定学期报表
 */
export async function exportSemester(semester: string, fileName?: string) {
  const res = await api.get(`/export/semester/${encodeURIComponent(semester)}`, {
    responseType: 'blob'
  });
  downloadBlob(res, fileName || `学期报表_${semester}.xlsx`);
}

/**
 * 通用 blob 下载工具
 */
function downloadBlob(response: any, fileName: string) {
  const blob = response instanceof Blob ? response : new Blob([response]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/** 导出指定学生在某门课程下的真实画像报告。 */
export async function exportStudentProfile(studentId: number, courseId: number, fileName?: string) {
  const res = await api.get(`/export/student/${studentId}/course/${courseId}`, {
    responseType: 'blob'
  });
  downloadBlob(res, fileName || `学生画像报告_${studentId}_${courseId}.xlsx`);
}
