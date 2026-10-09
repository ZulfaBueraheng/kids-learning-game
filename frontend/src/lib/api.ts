const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'klg.token';

export type Grade = 'K1' | 'K2' | 'K3' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6';
export type Activity = 'TARGET' | 'BUILDING' | 'TRAIN' | 'FISHING' | 'RACING' | 'PUZZLE' | 'SHOP' | 'MAGIC' | 'MINING' | 'BOSS';
export type ItemSlot = 'HAT' | 'OUTFIT' | 'PET' | 'ACCESSORY';
export type SkillStatus = 'NOT_STARTED' | 'LEARNING' | 'PRACTICING' | 'MASTERED';

export const GRADES: { value: Grade; label: string }[] = [
  { value: 'K1', label: 'อนุบาล 1' },
  { value: 'K2', label: 'อนุบาล 2' },
  { value: 'K3', label: 'อนุบาล 3' },
  { value: 'P1', label: 'ป.1' },
  { value: 'P2', label: 'ป.2' },
  { value: 'P3', label: 'ป.3' },
  { value: 'P4', label: 'ป.4' },
  { value: 'P5', label: 'ป.5' },
  { value: 'P6', label: 'ป.6' },
];

export type Theme = 'GENERAL' | 'DINOSAUR' | 'SPACE' | 'ANIMALS' | 'RACING' | 'FANTASY' | 'BLOCKS';
export type InterestTheme = Exclude<Theme, 'GENERAL'>;
export type Goal = 'FOUNDATION' | 'GRADE_LEVEL' | 'EXAM_PREP' | 'PROBLEM_SOLVING' | 'MASTERY';

export const THEMES: Record<Theme, { label: string; emoji: string }> = {
  GENERAL: { label: 'ทั่วไป', emoji: '🌈' },
  DINOSAUR: { label: 'ไดโนเสาร์', emoji: '🦖' },
  SPACE: { label: 'อวกาศ', emoji: '🚀' },
  ANIMALS: { label: 'สัตว์น่ารัก', emoji: '🐱' },
  RACING: { label: 'รถแข่ง', emoji: '🏎️' },
  FANTASY: { label: 'เวทมนตร์', emoji: '🧙' },
  BLOCKS: { label: 'โลกบล็อก', emoji: '⛏️' },
};
export const INTEREST_THEMES: InterestTheme[] = ['DINOSAUR', 'SPACE', 'ANIMALS', 'RACING', 'FANTASY', 'BLOCKS'];

export interface GoalOption {
  value: Goal;
  label: string;
  emoji: string;
  description: string;
}

/** What each goal means in each subject (the backend aims the path the same way). */
const SUBJECT_GOALS: Record<string, { short: string; foundation: string; applied: { label: string; emoji: string; description: string } }> = {
  MATH: {
    short: 'คณิต',
    foundation: 'จำนวน บวก ลบ คูณ หาร เศษส่วน เวลา เงิน ถึงระดับ ป.3',
    applied: { label: 'นักแก้โจทย์ปัญหา', emoji: '🧩', description: 'โจทย์ปัญหาและทักษะที่ต้องใช้' },
  },
  ENGLISH: {
    short: 'อังกฤษ',
    foundation: 'ตัวอักษร เสียง คำศัพท์ การสะกด ถึงระดับ ป.3',
    applied: { label: 'นักสื่อสาร', emoji: '💬', description: 'พูดคุยและอ่านเรื่องภาษาอังกฤษ' },
  },
  SCIENCE: {
    short: 'วิทย์',
    foundation: 'สิ่งมีชีวิต พืช สัตว์ ร่างกาย อากาศ ถึงระดับ ป.3',
    applied: { label: 'นักทดลอง', emoji: '🧪', description: 'การทดลอง ระบบนิเวศ และไฟฟ้า' },
  },
  READING: {
    short: 'ภาษาไทย',
    foundation: 'พยัญชนะ สระ วรรณยุกต์ อ่านคำ สะกดคำ ถึงระดับ ป.3',
    applied: { label: 'นักอ่านคิดวิเคราะห์', emoji: '🔎', description: 'อ่านจับใจความ อ่านคิดวิเคราะห์ และสำนวน' },
  },
  LOGIC: {
    short: 'ตรรกะ',
    foundation: 'แบบรูป จัดกลุ่ม ทิศทาง ลำดับ ถึงระดับ ป.3',
    applied: { label: 'นักสืบตรรกะ', emoji: '🕵️', description: 'การอนุมาน ตรรกะเงื่อนไข และปริศนาตาราง' },
  },
};

export function goalOptions(subject: string): GoalOption[] {
  const meta = SUBJECT_GOALS[subject] ?? SUBJECT_GOALS.MATH;
  return [
    { value: 'FOUNDATION', label: 'ปูพื้นฐานให้แน่น', emoji: '🧱', description: meta.foundation },
    { value: 'GRADE_LEVEL', label: 'ตามระดับชั้น', emoji: '🎒', description: 'ทุกทักษะจนถึงชั้นที่เรียนอยู่' },
    { value: 'EXAM_PREP', label: 'เตรียมสอบ', emoji: '📝', description: 'เน้นทักษะของชั้นที่เรียนอยู่' },
    { value: 'PROBLEM_SOLVING', ...meta.applied },
    { value: 'MASTERY', label: `เก่ง${meta.short}ครบทุกเรื่อง`, emoji: '🏆', description: 'ทั้งหลักสูตรถึง ป.6' },
  ];
}

/** Mathematics goals (kept for older callers). */
export const GOALS: GoalOption[] = goalOptions('MATH');

export interface InterestLevel {
  theme: InterestTheme;
  score: number;
  level: number;
}

export interface Student {
  id: string;
  nickname: string;
  avatar: string;
  grade: Grade;
  xp: number;
  coins: number;
  /** the goal for the subject being shown */
  goal: Goal;
  /** every subject's goal */
  goals?: Record<string, Goal>;
  interests: InterestLevel[];
  activeSubject: string;
}

/** The subjects the platform teaches (mirrors the backend curriculum). */
export const SUBJECT_META: Record<string, { nameTh: string; emoji: string }> = {
  MATH: { nameTh: 'คณิตศาสตร์', emoji: '🔢' },
  ENGLISH: { nameTh: 'ภาษาอังกฤษ', emoji: '🔤' },
  SCIENCE: { nameTh: 'วิทยาศาสตร์', emoji: '🔬' },
  READING: { nameTh: 'การอ่านภาษาไทย', emoji: '📖' },
  LOGIC: { nameTh: 'การคิดเชิงตรรกะ', emoji: '🧩' },
};

export interface SubjectProgress {
  code: string;
  nameTh: string;
  emoji: string;
  active: boolean;
  placementDone: boolean;
  progress: number;
  skillsMastered: number;
  totalSkills: number;
}

export interface Recommendation {
  kind: 'ASSIGNMENT' | 'REVIEW' | 'LEARN' | 'BOSS' | 'PRACTICE';
  levelId: string | null;
  assignmentId?: string;
  skillCodes: string[];
  title: string;
  reason: string;
  emoji: string;
  score: number;
}

export interface WornItem {
  code: string;
  name: string;
  emoji: string;
}

export type CharacterLook = { avatar: string } & Partial<Record<ItemSlot, WornItem>>;

export type QuestionVisual =
  | { kind: 'objects'; emoji: string; count: number }
  | { kind: 'groups'; groups: { label: string; emoji: string; count: number }[] }
  | { kind: 'addition'; emoji: string; a: number; b: number }
  | { kind: 'subtraction'; emoji: string; total: number; remove: number }
  | { kind: 'array'; emoji: string; rows: number; cols: number }
  | { kind: 'share'; emoji: string; total: number; groups: number }
  | { kind: 'fraction'; shape: 'circle' | 'bar'; items: { parts: number; shaded: number; label?: string }[] }
  | { kind: 'grid100'; shaded: number }
  | { kind: 'tally'; items: { emoji: string; count: number; label: string }[] }
  | { kind: 'polygon'; sides: number }
  | { kind: 'rect'; width: number; height: number; unit: string; grid?: boolean }
  | { kind: 'triangle'; labels: [string, string, string] }
  | { kind: 'angle'; degrees: number }
  | { kind: 'passage'; text: string }
  | { kind: 'clock'; hour: number; minute: number }
  | { kind: 'money'; items: { value: number; count: number }[] };

export interface Question {
  id: string;
  skillCode: string;
  difficulty: number;
  prompt: string;
  expression: string | null;
  visual: QuestionVisual | null;
  options: string[];
  hint: string | null;
  /** Wrong options the hint crosses out — help that needs no reading. */
  hintRemove: string[];
}

export interface AnswerInput {
  questionId: string;
  answer: string;
  timeMs: number;
  hintUsed: boolean;
}

export interface Achievement {
  code: string;
  name: string;
  description: string;
  emoji: string;
  xpReward: number;
  coinReward?: number;
  earnedAt?: string | null;
}

export interface PlacementSkill {
  skillCode: string;
  mastery: number;
  source: 'tested' | 'inferred';
  nameTh: string;
  group: string;
}

export interface PlacementStep {
  assessmentId?: string;
  isCorrect?: boolean;
  progress: { asked: number; max: number };
  question: Question | null;
  result?: { skills: PlacementSkill[]; newAchievements: Achievement[] } | null;
}

export interface Level {
  id: string;
  name: string;
  activity: Activity;
  difficulty: number;
  questionCount: number;
  isBoss: boolean;
  bossEmoji: string | null;
  skillCode: string;
  skillCodes: string[];
  skillNameTh: string;
  stars: number;
  unlocked: boolean;
  recommended: boolean;
}

export interface World {
  id: string;
  code: string;
  name: string;
  nameTh: string;
  emoji: string;
  theme: string;
  unlocked: boolean;
  stars: number;
  maxStars: number;
  levels: Level[];
}

export interface LevelInfo {
  level: number;
  levelStartXp: number;
  nextLevelXp: number;
}

export interface BossState {
  hp: number;
  maxHp: number;
  shields: number;
  maxShields: number;
  done: boolean;
  won: boolean;
}

export interface SessionStart {
  sessionId: string;
  level: Level & { world: { code: string; nameTh: string; emoji: string; theme: string } };
  index: number;
  total: number;
  boss: BossState | null;
  theme: Theme;
  question: Question;
}

export interface SkillChange {
  code: string;
  nameTh: string;
  before: number;
  after: number;
  status: SkillStatus;
}

export interface SessionSummary {
  stars: number;
  correct: number;
  total: number;
  xpEarned: number;
  coinsEarned: number;
  totalXp: number;
  coins: number;
  level: LevelInfo;
  leveledUp: boolean;
  skills: SkillChange[];
  boss: (BossState & { practice: { skillCode: string; skillNameTh: string; levelId: string; levelName: string } | null }) | null;
  reward: { code: string; name: string; emoji: string; slot: ItemSlot } | null;
  unlocked: {
    worlds: { code: string; nameTh: string; emoji: string }[];
    levels: { id: string; name: string; isBoss: boolean; bossEmoji: string | null; worldNameTh: string; worldEmoji: string }[];
  };
  newAchievements: Achievement[];
}

export interface SessionStep {
  isCorrect: boolean;
  correctAnswer: string;
  hint: string | null;
  boss: BossState | null;
  /** two mistakes in a row: the game eased off and shows the hint straight away */
  support: boolean;
  index: number;
  total: number;
  question: Question | null;
  summary: SessionSummary | null;
}

export interface ShopItem {
  code: string;
  name: string;
  slot: ItemSlot;
  emoji: string;
  price: number | null;
  rewardFrom: string | null;
  owned: boolean;
  equipped: boolean;
}

export interface Shop {
  coins: number;
  character: CharacterLook;
  items: ShopItem[];
  newAchievements?: Achievement[];
}

export interface PathItem {
  skillCode: string;
  nameTh: string;
  name: string;
  group: string;
  mastery: number;
  state: 'CURRENT' | 'READY' | 'LOCKED';
  missingPrerequisites: string[];
}

export interface DashboardSkill {
  code: string;
  name: string;
  nameTh: string;
  group: string;
  grade: Grade;
  mastery: number;
  status: SkillStatus;
  attempts: number;
}

export interface Dashboard {
  /** the subject this dashboard is about */
  subject: string;
  student: Student;
  character: CharacterLook;
  placementDone: boolean;
  level: LevelInfo;
  xp: number;
  overallProgress: number;
  skills: DashboardSkill[];
  strong: DashboardSkill[];
  needPractice: DashboardSkill[];
  currentPath: PathItem[];
  reviews: { skillCode: string; nameTh: string }[];
  stats: {
    learningMinutesThisWeek: number;
    activitiesCompleted: number;
    skillsMastered: number;
    totalSkills: number;
    bossesDefeated: number;
  };
  achievements: Achievement[];
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function storage(key: string) {
  return {
    get(): string | null {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(token: string) {
      try {
        localStorage.setItem(key, token);
      } catch {
        /* private mode: session lasts for this tab only */
      }
    },
    clear() {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}

/** The child's session. */
export const tokenStore = storage(TOKEN_KEY);
/** A parent's or teacher's session — kept separate so a parent and child can share a device. */
export const adultTokenStore = storage('klg.adult');

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function call<T>(store: ReturnType<typeof storage>, method: Method, path: string, body?: unknown): Promise<T> {
  const token = store.get();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    if (res.status === 401) store.clear();
    const data = await res.json().catch(() => ({}));
    const message = Array.isArray(data.message) ? data.message.join(', ') : (data.message ?? res.statusText);
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

const request = <T,>(method: Method, path: string, body?: unknown) => call<T>(tokenStore, method, path, body);
const adultRequest = <T,>(method: Method, path: string, body?: unknown) => call<T>(adultTokenStore, method, path, body);

export const api = {
  avatars: () => request<string[]>('GET', '/auth/avatars'),
  register: (body: { nickname: string; avatar: string; grade: Grade; interests: InterestTheme[] }) =>
    request<{ token: string; loginCode: string; student: Student }>('POST', '/auth/register', body),
  login: (loginCode: string) => request<{ token: string; student: Student }>('POST', '/auth/login', { loginCode }),
  me: () => request<Student>('GET', '/students/me'),
  setInterests: (themes: InterestTheme[]) => request<Student>('PUT', '/students/me/interests', { themes }),
  setGoal: (goal: Goal, subject?: string) => request<Student>('PUT', '/students/me/goal', { goal, subject }),
  setSubject: (subject: string) => request<Student>('PUT', '/students/me/subject', { subject }),
  mySubjects: () => request<SubjectProgress[]>('GET', '/progress/subjects'),

  startPlacement: () => request<PlacementStep & { assessmentId: string }>('POST', '/assessments/placement'),
  answerPlacement: (assessmentId: string, body: AnswerInput) =>
    request<PlacementStep>('POST', `/assessments/${assessmentId}/answer`, body),

  worlds: () => request<World[]>('GET', '/games/worlds'),
  startLevel: (levelId: string) => request<SessionStart>('POST', `/games/levels/${levelId}/sessions`),
  startReview: () => request<SessionStart>('POST', '/games/review'),
  recommendations: () => request<Recommendation[]>('GET', '/games/recommendations'),
  answerLevel: (sessionId: string, body: AnswerInput) => request<SessionStep>('POST', `/games/sessions/${sessionId}/answer`, body),

  dashboard: () => request<Dashboard>('GET', '/progress/dashboard'),
  myClassrooms: () => request<MyClassroom[]>('GET', '/students/me/classrooms'),
  joinClassroom: (joinCode: string) => request<MyClassroom[]>('POST', '/students/me/classrooms', { joinCode }),
  myAssignments: () => request<MyAssignment[]>('GET', '/students/me/assignments'),
  startAssignment: (id: string) => request<SessionStart>('POST', `/games/assignments/${id}`),

  shop: () => request<Shop>('GET', '/shop'),
  buy: (code: string) => request<Shop>('POST', `/shop/items/${code}/buy`),
  equip: (itemCode: string, equipped: boolean) => request<Shop>('POST', '/character/equip', { itemCode, equipped }),
  setAvatar: (avatar: string) => request<Shop>('POST', '/character/avatar', { avatar }),
};

// ───────────── Classrooms (child side) ─────────────

export type AssignmentState = 'DONE' | 'LATE' | 'PENDING' | 'OVERDUE';

export interface MyClassroom {
  id: string;
  name: string;
  teacher: string | null;
}

export interface MyAssignment {
  id: string;
  title: string;
  skillCode: string;
  skillNameTh: string;
  questionCount: number;
  dueAt: string | null;
  classroomName: string;
  state: AssignmentState;
  best: { correct: number; total: number; stars: number } | null;
}

// ───────────── Parents & teachers ─────────────

export type AdultRole = 'PARENT' | 'TEACHER';

export interface AdultUser {
  id: string;
  email: string;
  displayName: string;
  role: AdultRole;
}

export interface ChildSummary {
  id: string;
  nickname: string;
  avatar: string;
  grade: Grade;
  level: number;
  xp: number;
}

export interface Insight {
  tone: 'good' | 'tip' | 'warn';
  text: string;
}

export interface StudentReport extends Dashboard {
  subjects: SubjectProgress[];
  week: { date: string; minutes: number }[];
  skillTime: { skillCode: string; nameTh: string; minutes: number; attempts: number; correct: number }[];
  insights: Insight[];
  lastActiveAt: string | null;
  classrooms: { id: string; name: string; teacher: string | null }[];
}

export interface AccessLogEntry {
  action: string;
  at: string;
  by: { name: string | null; role: string } | null;
}

export type Cell = '✓' | '△' | '✗' | '·';

export interface ClassroomSummary {
  id: string;
  name: string;
  grade: Grade | null;
  joinCode: string;
  students: number;
  assignments: number;
}

export interface AssignmentResult {
  studentId: string;
  nickname: string;
  state: AssignmentState;
  correct: number | null;
  total: number | null;
  stars: number | null;
}

export interface ClassroomOverview {
  classroom: { id: string; name: string; grade: Grade | null; joinCode: string };
  columns: { code: string; nameTh: string; group: string }[];
  students: {
    id: string;
    nickname: string;
    avatar: string;
    overall: number;
    minutesThisWeek: number;
    lastActiveAt: string | null;
    cells: Record<string, Cell>;
  }[];
  weakSkills: { skillCode: string; nameTh: string; started: number; struggling: number; share: number }[];
  assignments: {
    id: string;
    title: string;
    skillCode: string;
    skillNameTh: string;
    questionCount: number;
    dueAt: string | null;
    createdAt: string;
    counts: { done: number; late: number; pending: number; overdue: number };
    results: AssignmentResult[];
  }[];
}

export interface SkillInfo {
  code: string;
  subjectCode: string;
  nameTh: string;
  group: string;
  grade: Grade;
}

const subjectQuery = (subject?: string) => (subject ? `?subject=${encodeURIComponent(subject)}` : '');

export const adultApi = {
  register: (body: { email: string; password: string; displayName: string; role: AdultRole }) =>
    adultRequest<{ token: string; user: AdultUser }>('POST', '/auth/adult/register', body),
  login: (email: string, password: string) =>
    adultRequest<{ token: string; user: AdultUser }>('POST', '/auth/adult/login', { email, password }),
  me: () => adultRequest<AdultUser>('GET', '/auth/adult/me'),
  skills: () => adultRequest<SkillInfo[]>('GET', '/skills'),

  children: () => adultRequest<ChildSummary[]>('GET', '/parent/children'),
  linkChild: (loginCode: string) => adultRequest<ChildSummary[]>('POST', '/parent/children', { loginCode }),
  unlinkChild: (id: string) => adultRequest<ChildSummary[]>('DELETE', `/parent/children/${id}`),
  childReport: (id: string, subject?: string) =>
    adultRequest<StudentReport>('GET', `/parent/children/${id}/report${subjectQuery(subject)}`),
  childAccessLog: (id: string) => adultRequest<AccessLogEntry[]>('GET', `/parent/children/${id}/access-log`),
  removeChildFromClass: (id: string, classroomId: string) =>
    adultRequest<StudentReport>('DELETE', `/parent/children/${id}/classrooms/${classroomId}`),

  classrooms: () => adultRequest<ClassroomSummary[]>('GET', '/teacher/classrooms'),
  createClassroom: (name: string, grade?: Grade) => adultRequest<ClassroomSummary>('POST', '/teacher/classrooms', { name, grade }),
  classroom: (id: string) => adultRequest<ClassroomOverview>('GET', `/teacher/classrooms/${id}`),
  assign: (id: string, body: { skillCode: string; title?: string; questionCount: number; dueAt?: string }) =>
    adultRequest<ClassroomOverview>('POST', `/teacher/classrooms/${id}/assignments`, body),
  unassign: (id: string, assignmentId: string) =>
    adultRequest<ClassroomOverview>('DELETE', `/teacher/classrooms/${id}/assignments/${assignmentId}`),
  removeStudent: (id: string, studentId: string) =>
    adultRequest<ClassroomOverview>('DELETE', `/teacher/classrooms/${id}/students/${studentId}`),
  studentReport: (id: string, studentId: string, subject?: string) =>
    adultRequest<StudentReport>('GET', `/teacher/classrooms/${id}/students/${studentId}/report${subjectQuery(subject)}`),
};
