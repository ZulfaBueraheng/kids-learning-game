import { ITEMS, MATH_SKILLS, MATH_WORLDS, PLACEMENT_START } from './math-foundation.js';
import { ENGLISH, LOGIC, READING, SCIENCE, type CurriculumDef } from './other-subjects.js';

/** Every subject the platform teaches. Adding a subject = adding an entry here (plus its question generators). */
export interface SubjectDef extends CurriculumDef {
  code: string;
  name: string;
  nameTh: string;
  emoji: string;
}

export const SUBJECTS: SubjectDef[] = [
  {
    code: 'MATH',
    name: 'Mathematics',
    nameTh: 'คณิตศาสตร์',
    emoji: '🔢',
    skills: MATH_SKILLS,
    worlds: MATH_WORLDS,
    placementStart: PLACEMENT_START,
    items: ITEMS,
    applied: MATH_SKILLS.filter((s) => s.group === 'PROBLEM_SOLVING').map((s) => s.code),
  },
  { code: 'ENGLISH', name: 'English', nameTh: 'ภาษาอังกฤษ', emoji: '🔤', ...ENGLISH },
  { code: 'SCIENCE', name: 'Science', nameTh: 'วิทยาศาสตร์', emoji: '🔬', ...SCIENCE },
  { code: 'READING', name: 'Thai Reading', nameTh: 'การอ่านภาษาไทย', emoji: '📖', ...READING },
  { code: 'LOGIC', name: 'Logical Thinking', nameTh: 'การคิดเชิงตรรกะ', emoji: '🧩', ...LOGIC },
];

export const DEFAULT_SUBJECT = 'MATH';

export function subjectDef(code: string): SubjectDef | undefined {
  return SUBJECTS.find((s) => s.code === code);
}
