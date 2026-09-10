/**
 * 课程目标（CT）定义与达成度计算
 * 参照《计算机网络》教学大纲
 */

export interface CourseObjective {
  id: string;
  name: string;
  category: "知识" | "能力" | "素养";
  description: string;
  chapters: string[];       // 支撑的课程章节
  keywords: string[];       // 知识点关键词（用于匹配 knowledgeRadar）
  weight: number;           // 在总评中的权重参考
}

/**
 * 教学大纲中的课程目标 CT1-CT4
 * CT1: 掌握计算机网络通信技术基本原理、重要术语和基本方法
 * CT2: 掌握网络体系结构TCP/IP分层技术的原理、协议、网络拓扑结构
 * CT3: 掌握IPV4网络地址划分方法和主流局域网技术
 * CT4: 具备分析计算机网络问题并通过掌握的方法解决问题的能力
 */
export const COURSE_OBJECTIVES: CourseObjective[] = [
  {
    id: "CT1",
    name: "网络基本原理",
    category: "知识",
    description: "掌握计算机网络通信技术基本原理、重要术语和基本方法",
    chapters: ["第1章 概论", "第2章 应用层", "第3章 传输层", "第4章 网络层", "第5章 链路层"],
    keywords: ["网络", "原理", "协议", "通信", "概论", "应用层", "传输层", "网络层", "链路层", "HTTP", "TCP", "UDP", "IP", "以太网"],
    weight: 0.3,
  },
  {
    id: "CT2",
    name: "TCP/IP分层体系",
    category: "知识",
    description: "掌握网络体系结构TCP/IP分层技术的原理、协议、网络拓扑结构",
    chapters: ["第2章 应用层", "第3章 传输层", "第4章 网络层", "第5章 链路层"],
    keywords: ["TCP/IP", "体系结构", "分层", "协议栈", "应用层", "传输层", "网络层", "链路层", "TCP", "UDP", "IP", "端口", "套接字"],
    weight: 0.25,
  },
  {
    id: "CT3",
    name: "IP地址与局域网",
    category: "知识",
    description: "掌握IPV4网络地址划分方法和主流局域网技术",
    chapters: ["第4章 网络层", "第5章 链路层"],
    keywords: ["IP", "IPv4", "地址", "子网", "划分", "局域网", "以太网", "MAC", "VLAN", "ARP", "路由", "交换机"],
    weight: 0.2,
  },
  {
    id: "CT4",
    name: "分析与解决问题",
    category: "能力",
    description: "具备分析计算机网络问题并通过掌握的方法解决问题的能力",
    chapters: ["小班讨论", "课程实验", "课程设计"],
    keywords: ["分析", "解决", "实验", "设计", "编程", "Socket", "抓包", "Wireshark", "讨论"],
    weight: 0.25,
  },
];

export interface CTAchievement {
  objective: CourseObjective;
  score: number;          // 达成度 0-100
  level: "优秀" | "良好" | "合格" | "需加强";
  evidence: string[];     // 支撑数据说明
}

/**
 * 根据学生画像数据计算各课程目标达成度
 *
 * 计算规则：
 * - CT1/CT2/CT3（知识类）：基于知识点掌握度雷达（knowledgeRadar）+ 总评成绩
 *   匹配关键词的知识点取平均，与总评成绩加权
 * - CT4（能力类）：基于实验成绩 + 作业提交率 + 考勤
 */
export function calculateCTAchievements(profile: {
  totalScore?: number;
  knowledgeRadar?: { name: string; value: number }[];
  homeworkList?: { name?: string; score?: number; submitStatus?: string }[];
  experimentList?: { name?: string; score?: number }[];
  attendanceList?: { status?: string }[];
  attendanceRate?: number;
  homeworkRate?: number;
}): CTAchievement[] {
  const knowledgeItems = profile.knowledgeRadar || [];
  const totalScore = profile.totalScore ?? 0;

  // 计算某 CT 的知识点平均掌握度
  const knowledgeAvgFor = (ct: CourseObjective): number => {
    const matched = knowledgeItems.filter(k =>
      ct.keywords.some(kw => k.name.includes(kw))
    );
    if (matched.length === 0) {
      // 无匹配知识点时，使用全部知识点均值
      if (knowledgeItems.length === 0) return 0;
      return knowledgeItems.reduce((s, k) => s + k.value, 0) / knowledgeItems.length;
    }
    return matched.reduce((s, k) => s + k.value, 0) / matched.length;
  };

  // 作业提交率
  const homeworkSubmitRate = (() => {
    const hw = profile.homeworkList || [];
    if (hw.length === 0) return profile.homeworkRate ?? 80;
    const submitted = hw.filter(h => h.submitStatus === "已提交" || h.submitStatus === "submitted").length;
    return (submitted / hw.length) * 100;
  })();

  // 实验平均成绩
  const experimentAvg = (() => {
    const exp = profile.experimentList || [];
    if (exp.length === 0) return 0;
    const scored = exp.filter(e => typeof e.score === "number" && e.score > 0);
    if (scored.length === 0) return 0;
    return scored.reduce((s, e) => s + (e.score || 0), 0) / scored.length;
  })();

  // 出勤率
  const attendance = profile.attendanceRate ?? (() => {
    const list = profile.attendanceList || [];
    if (list.length === 0) return 90;
    const present = list.filter(a => a.status === "正常" || a.status === "present").length;
    return (present / list.length) * 100;
  })();

  return COURSE_OBJECTIVES.map(ct => {
    let score: number;
    const evidence: string[] = [];

    if (ct.id === "CT4") {
      // 能力类：实验 50% + 作业 30% + 出勤 20%
      score = experimentAvg * 0.5 + homeworkSubmitRate * 0.3 + attendance * 0.2;
      evidence.push(`实验平均成绩: ${experimentAvg.toFixed(1)}`);
      evidence.push(`作业提交率: ${homeworkSubmitRate.toFixed(0)}%`);
      evidence.push(`出勤率: ${attendance.toFixed(0)}%`);
    } else {
      // 知识类：知识点掌握度 60% + 总评成绩 40%
      const kwAvg = knowledgeAvgFor(ct);
      score = kwAvg * 0.6 + totalScore * 0.4;
      evidence.push(`相关知识点掌握度: ${kwAvg.toFixed(1)}`);
      evidence.push(`课程总评成绩: ${totalScore.toFixed(1)}`);
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    const level: CTAchievement["level"] =
      score >= 85 ? "优秀" : score >= 75 ? "良好" : score >= 60 ? "合格" : "需加强";

    return { objective: ct, score, level, evidence };
  });
}

/** 雷达图数据 */
export function getCTRadarData(achievements: CTAchievement[]) {
  return achievements.map(a => ({
    subject: a.objective.id,
    value: a.score,
    name: a.objective.name,
  }));
}
