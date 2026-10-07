/**
 * Positive-only rewards: no streaks to lose, no leaderboards.
 */

export function starsFor(correct: number, total: number): number {
  if (total === 0) return 0;
  const ratio = correct / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.5) return 1;
  return 0;
}

export function xpForAnswer(isCorrect: boolean, difficulty: number): number {
  // Trying still earns a little XP.
  return isCorrect ? 5 + difficulty * 2 : 1;
}

export function stageBonusXp(stars: number): number {
  return stars * 10;
}

/** Coins buy character items. Earned for effort and stars, never taken away. */
export function coinsForStage(correct: number, stars: number): number {
  return correct + stars * 3;
}

export const BOSS_WIN_XP = 50;
export const BOSS_WIN_COINS = 25;

/** Level L starts at 50·L·(L−1) XP: 0, 100, 300, 600, 1000, … */
export function levelInfo(xp: number): { level: number; levelStartXp: number; nextLevelXp: number } {
  let level = 1;
  while (50 * (level + 1) * level <= xp) level++;
  return { level, levelStartXp: 50 * level * (level - 1), nextLevelXp: 50 * (level + 1) * level };
}

export interface AchievementDef {
  code: string;
  name: string;
  description: string;
  emoji: string;
  xpReward: number;
  coinReward?: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { code: 'FIRST_STEP', name: 'ก้าวแรกของนักผจญภัย', description: 'ทำภารกิจวัดระดับครบ', emoji: '👣', xpReward: 50 },
  { code: 'FIRST_STAR', name: 'ดาวดวงแรก', description: 'ผ่านด่านแรก', emoji: '⭐', xpReward: 20 },
  { code: 'PERFECT_STAGE', name: 'สมบูรณ์แบบ', description: 'ได้ 3 ดาวในด่านใดก็ได้', emoji: '🌟', xpReward: 30 },
  { code: 'TEN_STAGES', name: 'นักสำรวจ', description: 'ผ่านด่านครบ 10 ครั้ง', emoji: '🧭', xpReward: 50 },
  { code: 'FIRST_MASTERY', name: 'ปรมาจารย์มือใหม่', description: 'เก่งครบ 1 ทักษะ', emoji: '🏅', xpReward: 50 },
  { code: 'COUNTING_MASTER', name: 'ราชานักนับ', description: 'เก่งทักษะการนับ', emoji: '🌳', xpReward: 40 },
  { code: 'ADDITION_HERO', name: 'ฮีโร่การบวก', description: 'เก่งการบวกเลขหลักเดียว', emoji: '🏰', xpReward: 40 },
  { code: 'SUBTRACTION_HERO', name: 'ฮีโร่การลบ', description: 'เก่งการลบเลขหลักเดียว', emoji: '🏜️', xpReward: 40 },
  { code: 'WORLD_EXPLORER', name: 'พิชิตโลก', description: 'ผ่านทุกด่านในโลกใดโลกหนึ่ง', emoji: '🌎', xpReward: 80 },
  { code: 'XP_1000', name: 'พลังเต็มเปี่ยม', description: 'สะสม XP ครบ 1,000', emoji: '⚡', xpReward: 0, coinReward: 50 },
  // ── Phase 2 ──
  { code: 'FIRST_BOSS', name: 'ผู้ปราบบอส', description: 'ปราบบอสได้ตัวแรก', emoji: '⚔️', xpReward: 50, coinReward: 20 },
  { code: 'BOSS_HUNTER', name: 'นักล่าบอส', description: 'ปราบบอสได้ 4 ตัว', emoji: '🛡️', xpReward: 100, coinReward: 50 },
  { code: 'TIMES_TABLE_STAR', name: 'ดาวสูตรคูณ', description: 'เก่งสูตรคูณแม่ 2–5', emoji: '✖️', xpReward: 40, coinReward: 15 },
  { code: 'DIVISION_DIVER', name: 'นักดำน้ำการหาร', description: 'เก่งการหารพื้นฐาน', emoji: '🤿', xpReward: 40, coinReward: 15 },
  { code: 'FRACTION_FRIEND', name: 'เพื่อนเศษส่วน', description: 'เก่งเรื่องเศษส่วน', emoji: '🍕', xpReward: 40, coinReward: 15 },
  { code: 'PROBLEM_SOLVER', name: 'นักแก้ปัญหา', description: 'เก่งโจทย์ปัญหาการบวกลบ', emoji: '🧩', xpReward: 40, coinReward: 15 },
  { code: 'FIRST_PURCHASE', name: 'นักช้อปมือใหม่', description: 'ซื้อของชิ้นแรกในร้านค้า', emoji: '🛍️', xpReward: 10 },
  { code: 'COLLECTOR', name: 'นักสะสม', description: 'มีของสะสมครบ 5 ชิ้น', emoji: '🧸', xpReward: 30, coinReward: 10 },
  // ── Phase 3 ──
  { code: 'DECIMAL_DETECTIVE', name: 'นักสืบทศนิยม', description: 'เก่งเรื่องทศนิยม', emoji: '🔍', xpReward: 50, coinReward: 20 },
  { code: 'PERCENT_PRO', name: 'เซียนเปอร์เซ็นต์', description: 'เก่งการหาร้อยละของจำนวน', emoji: '💯', xpReward: 50, coinReward: 20 },
  { code: 'RATIO_RANGER', name: 'นักผจญภัยอัตราส่วน', description: 'เก่งเรื่องอัตราส่วน', emoji: '⚖️', xpReward: 50, coinReward: 20 },
  { code: 'SHAPE_MASTER', name: 'สถาปนิกน้อย', description: 'เก่งความยาวรอบรูปและพื้นที่', emoji: '📐', xpReward: 50, coinReward: 20 },
  { code: 'ALGEBRA_ACE', name: 'ยอดนักไขสมการ', description: 'เก่งการแก้สมการ', emoji: '🧮', xpReward: 50, coinReward: 20 },
  { code: 'PROBLEM_MASTER', name: 'ปรมาจารย์แก้ปัญหา', description: 'เก่งโจทย์ปัญหาหลายขั้นตอน', emoji: '🧠', xpReward: 80, coinReward: 30 },
  { code: 'GRAND_CHAMPION', name: 'แชมป์แห่ง Math World', description: 'ปราบบอสได้ 12 ตัว', emoji: '🏆', xpReward: 200, coinReward: 100 },
  // ── Phase 6: other subjects ──
  { code: 'ENGLISH_EXPLORER', name: 'นักสำรวจภาษาอังกฤษ', description: 'เก่งคำศัพท์จากภาพ', emoji: '🔤', xpReward: 50, coinReward: 20 },
  { code: 'YOUNG_SCIENTIST', name: 'นักวิทยาศาสตร์น้อย', description: 'เก่งเรื่องสิ่งมีชีวิต', emoji: '🔬', xpReward: 50, coinReward: 20 },
  { code: 'BOOKWORM', name: 'หนอนหนังสือ', description: 'อ่านคำภาษาไทยได้เก่ง', emoji: '📖', xpReward: 50, coinReward: 20 },
  { code: 'SHARP_THINKER', name: 'นักคิดหัวไว', description: 'เก่งการอนุมาน', emoji: '🧩', xpReward: 50, coinReward: 20 },
  { code: 'ALL_ROUNDER', name: 'เก่งรอบด้าน', description: 'มีทักษะที่เก่งแล้วครบทุกวิชา', emoji: '🌈', xpReward: 150, coinReward: 80 },
];

export interface AchievementFacts {
  placementCompleted: boolean;
  stagesCompleted: number;
  perfectStages: number;
  masteredSkills: string[];
  xp: number;
  worldsCompleted: number;
  bossesDefeated?: number;
  itemsOwned?: number;
  itemsBought?: number;
  /** subjects with at least one mastered skill */
  subjectsMastered?: number;
  totalSubjects?: number;
}

export function earnedAchievements(facts: AchievementFacts): string[] {
  const has = (code: string) => facts.masteredSkills.includes(code);
  const rules: Record<string, boolean> = {
    FIRST_STEP: facts.placementCompleted,
    FIRST_STAR: facts.stagesCompleted >= 1,
    PERFECT_STAGE: facts.perfectStages >= 1,
    TEN_STAGES: facts.stagesCompleted >= 10,
    FIRST_MASTERY: facts.masteredSkills.length >= 1,
    COUNTING_MASTER: has('COUNTING'),
    ADDITION_HERO: has('ADD_SINGLE'),
    SUBTRACTION_HERO: has('SUB_SINGLE'),
    WORLD_EXPLORER: facts.worldsCompleted >= 1,
    XP_1000: facts.xp >= 1000,
    FIRST_BOSS: (facts.bossesDefeated ?? 0) >= 1,
    BOSS_HUNTER: (facts.bossesDefeated ?? 0) >= 4,
    TIMES_TABLE_STAR: has('MULT_TABLES_2_5'),
    DIVISION_DIVER: has('DIV_BASIC'),
    FRACTION_FRIEND: has('FRAC_CONCEPT'),
    PROBLEM_SOLVER: has('WORD_ADD_SUB'),
    FIRST_PURCHASE: (facts.itemsBought ?? 0) >= 1,
    COLLECTOR: (facts.itemsOwned ?? 0) >= 5,
    DECIMAL_DETECTIVE: has('DEC_COMPARE'),
    PERCENT_PRO: has('PERCENT_OF'),
    RATIO_RANGER: has('RATIO_CONCEPT'),
    SHAPE_MASTER: has('GEO_PERIMETER_AREA'),
    ALGEBRA_ACE: has('ALG_EQUATIONS'),
    PROBLEM_MASTER: has('PS_MULTI_STEP'),
    GRAND_CHAMPION: (facts.bossesDefeated ?? 0) >= 12,
    ENGLISH_EXPLORER: has('EN_VOCAB_PICTURE'),
    YOUNG_SCIENTIST: has('SCI_LIVING'),
    BOOKWORM: has('TH_WORDS'),
    SHARP_THINKER: has('LOG_DEDUCTION'),
    ALL_ROUNDER: (facts.totalSubjects ?? 0) > 1 && (facts.subjectsMastered ?? 0) >= (facts.totalSubjects ?? 0),
  };
  return Object.entries(rules)
    .filter(([, ok]) => ok)
    .map(([code]) => code);
}
