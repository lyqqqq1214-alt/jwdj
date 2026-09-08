/**
 * 助教管理前端服务
 * 后端暂无 TA 管理 API，使用 localStorage 持久化助教及其权限配置。
 * 数据结构对应后端 t_teaching_assistant + t_assistant_permission 表。
 */

export interface TeachingAssistant {
  id: number;
  staffId: string;      // 助教工号（登录账号）
  name: string;         // 姓名
  teacherId: number;    // 所属教师ID
  status: "active" | "disabled";
  createdAt: string;
}

export interface TAPermissions {
  allowedClasses: number[];   // 可管理的班级ID列表
  canImport: boolean;         // 是否允许导入数据
  canGrade: boolean;          // 是否允许考试批阅
  canViewProfile: boolean;    // 是否允许查看学生画像
}

const TA_KEY = "aitaes:teachingAssistants";
const PERM_KEY = "aitaes:taPermissions";

// ---- 工具函数 ----
function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---- 助教账号管理 ----

/** 获取指定教师下的所有助教 */
export function getTAsByTeacher(teacherId: number): TeachingAssistant[] {
  const all = readJSON<TeachingAssistant[]>(TA_KEY, []);
  return all.filter(ta => ta.teacherId === teacherId);
}

/** 获取全部助教（用于登录匹配） */
export function getAllTAs(): TeachingAssistant[] {
  return readJSON<TeachingAssistant[]>(TA_KEY, []);
}

/** 创建助教账号 */
export function createTA(data: { staffId: string; name: string; teacherId: number }): TeachingAssistant {
  const all = readJSON<TeachingAssistant[]>(TA_KEY, []);
  if (all.some(ta => ta.staffId === data.staffId)) {
    throw new Error("助教工号已存在");
  }
  const ta: TeachingAssistant = {
    id: Date.now(),
    staffId: data.staffId,
    name: data.name,
    teacherId: data.teacherId,
    status: "active",
    createdAt: new Date().toISOString().slice(0, 10),
  };
  all.push(ta);
  writeJSON(TA_KEY, all);
  // 初始化空权限
  const perms = readJSON<Record<string, TAPermissions>>(PERM_KEY, {});
  perms[ta.staffId] = { allowedClasses: [], canImport: false, canGrade: false, canViewProfile: false };
  writeJSON(PERM_KEY, perms);
  return ta;
}

/** 删除助教 */
export function deleteTA(staffId: string) {
  const all = readJSON<TeachingAssistant[]>(TA_KEY, []);
  writeJSON(TA_KEY, all.filter(ta => ta.staffId !== staffId));
  const perms = readJSON<Record<string, TAPermissions>>(PERM_KEY, {});
  delete perms[staffId];
  writeJSON(PERM_KEY, perms);
}

/** 启用/禁用助教 */
export function setTAStatus(staffId: string, status: "active" | "disabled") {
  const all = readJSON<TeachingAssistant[]>(TA_KEY, []);
  const ta = all.find(t => t.staffId === staffId);
  if (ta) {
    ta.status = status;
    writeJSON(TA_KEY, all);
  }
}

// ---- 权限管理 ----

/** 获取助教的全部权限配置 */
export function getTAPermissions(staffId: string): TAPermissions {
  const perms = readJSON<Record<string, TAPermissions>>(PERM_KEY, {});
  return perms[staffId] || { allowedClasses: [], canImport: false, canGrade: false, canViewProfile: false };
}

/** 更新助教权限（全量覆盖） */
export function updateTAPermissions(staffId: string, perms: TAPermissions) {
  const all = readJSON<Record<string, TAPermissions>>(PERM_KEY, {});
  all[staffId] = perms;
  writeJSON(PERM_KEY, all);
}

/** 为某班级分配助教权限 */
export function assignTAToClass(staffId: string, classId: number, perms: Partial<TAPermissions>) {
  const current = getTAPermissions(staffId);
  const updated: TAPermissions = {
    allowedClasses: current.allowedClasses.includes(classId)
      ? current.allowedClasses
      : [...current.allowedClasses, classId],
    canImport: perms.canImport ?? current.canImport,
    canGrade: perms.canGrade ?? current.canGrade,
    canViewProfile: perms.canViewProfile ?? current.canViewProfile,
  };
  updateTAPermissions(staffId, updated);
}

/** 从某班级移除助教 */
export function removeTAFromClass(staffId: string, classId: number) {
  const current = getTAPermissions(staffId);
  current.allowedClasses = current.allowedClasses.filter(c => c !== classId);
  updateTAPermissions(staffId, current);
}

/** 获取某班级下的助教列表（含权限） */
export function getTAsByClass(classId: number): { ta: TeachingAssistant; perms: TAPermissions }[] {
  const allTAs = readJSON<TeachingAssistant[]>(TA_KEY, []);
  const allPerms = readJSON<Record<string, TAPermissions>>(PERM_KEY, {});
  return allTAs
    .filter(ta => allPerms[ta.staffId]?.allowedClasses.includes(classId))
    .map(ta => ({ ta, perms: allPerms[ta.staffId] }));
}

// ---- 初始化种子数据（首次使用时） ----

export function seedTAsIfEmpty(teacherId: number) {
  const all = readJSON<TeachingAssistant[]>(TA_KEY, []);
  if (all.length === 0) {
    // 种子数据对齐后端 t_teaching_assistant 表中 T00001 名下的助教
    const seed: TeachingAssistant[] = [
      { id: 1, staffId: "A00001", name: "陈明", teacherId, status: "active", createdAt: "2024-09-01" },
      { id: 2, staffId: "A00002", name: "赵丽", teacherId, status: "active", createdAt: "2024-09-01" },
    ];
    writeJSON(TA_KEY, seed);
    writeJSON(PERM_KEY, {
      "A00001": { allowedClasses: [1, 3], canImport: true, canGrade: true, canViewProfile: true },
      "A00002": { allowedClasses: [2], canImport: false, canGrade: true, canViewProfile: false },
    });
  }
}
