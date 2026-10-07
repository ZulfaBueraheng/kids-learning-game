# HANDOFF — Kids Learning Game

> บันทึกส่งต่องานสำหรับเริ่มบทสนทนาใหม่ (อัปเดต 2026-10-05)
> **ทำงานที่ `D:\rainbow\kids-learning-game` เท่านั้น** — `C:\Users\Legion\kids-learning-game` เป็นสำเนาเก่า ห้ามแก้

## สถานะรวม

| Phase | สถานะ |
| --- | --- |
| 1 Math Foundation (K1–P1) | ✅ เสร็จ |
| 2 Core Math (P2–P3): คูณ หาร เศษส่วน โจทย์ปัญหา บอส ตัวละคร ร้านค้า | ✅ เสร็จ |
| 3 Advanced Math (P4–P6): ทศนิยม ร้อยละ อัตราส่วน เรขาคณิต พีชคณิต | ✅ เสร็จ |
| 4 Personalization: ความสนใจ/ธีม, placement ตามกราฟ, ความยากปรับตัว, ทบทวน, ภารกิจวันนี้, เป้าหมาย | ✅ เสร็จ |
| 5 Parent & Teacher: บัญชีผู้ใหญ่, ห้องเรียน, การบ้าน, รายงาน, analytics, audit log | ✅ เสร็จ |
| 6 Platform Expansion: ENGLISH, SCIENCE, READING (ไทย), LOGIC | ✅ เสร็จ |

README.md มีรายละเอียด Phase 1–6 ครบแล้ว

## Stack และคำสั่ง

- backend: NestJS 12 + Prisma 7 (ESM, import ต้องลงท้าย `.js`, adapter `@prisma/adapter-pg`, config คือ `backend/prisma7.config.ts`), Vitest
- frontend: Next.js 16 (App Router, client components, อ่าน `frontend/AGENTS.md`), ไม่มี prettier config — โค้ดใช้ single quote, print width ~130
- ทดสอบ backend: `npm test` (unit, ตอนนี้ 192 ผ่าน) และ `DATABASE_URL=... JWT_SECRET=x npm run test:e2e` (6 ไฟล์, 44 ผ่าน, รันทีละไฟล์)
- frontend: `npx tsc --noEmit`, `npm run lint`, `npm run build`
- Postgres ทดสอบชั่วคราว (ไม่ใช่ของผู้ใช้): data dir อยู่ที่ `C:\Users\Legion\AppData\Local\Temp\claude\C--Users-Legion\ce32fa3c-e622-44dc-b564-9fba6b8d9124\scratchpad\pgdata`
  - เริ่ม: `pg_ctl -D <pgdata> -o "-p 5499" -l <dir>/pg.log start` (รันแบบ background) — URL `postgresql://postgres@localhost:5499/kids_learning` (trust auth)
  - ถ้าโฟลเดอร์หาย สร้างใหม่: `initdb -D <dir> -U postgres --auth=trust -E UTF8 --locale=C` แล้ว `createdb`, `npx prisma migrate deploy`, `npm run seed`
  - ห้ามแตะ Postgres ตัวหลักของผู้ใช้ (ไม่มีรหัสผ่าน และไม่ควรอ่าน `.env` ของโปรเจกต์อื่น)
- สร้าง migration แบบไม่ interactive: `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > prisma/migrations/<ts>_<name>/migration.sql` (DB ต้องอยู่ที่ migration ล่าสุดก่อน) แล้ว `npx prisma migrate deploy`
- ทดสอบในเบราว์เซอร์: playwright-core + Edge (`channel: 'msedge'`); พอร์ต 3000 ของเครื่องถูกใช้อยู่ → frontend รันที่ 3200 (3100 ถูกโปรเจกต์อื่นใช้) และ backend ต้องตั้ง `CORS_ORIGIN=http://localhost:3200`
- heredoc ใน bash ชอบพังเมื่อมีโค้ดยาว → ใช้ Write/Edit tool แทน

## Phase 6 — สิ่งที่ทำแล้ว

Backend (เสร็จทั้งหมด ผ่านเทสต์):
- หลักสูตร: `backend/src/curriculum/other-subjects.ts` (skills/worlds/บอส/ของสะสม ของ 4 วิชา) และ `subjects.ts` (`SUBJECTS` registry, `subjectDef()`)
- ตัวสร้างโจทย์: `backend/src/questions/subjects/{english,science,reading,logic}.ts`, bank helper `questions/bank.ts`, visual ใหม่ `{ kind: 'passage', text }` ใน `questions/kit.ts`
- schema/migration `20261005000000_phase6_subjects`: `Subject.emoji/sortOrder`, `Student.activeSubject` (default MATH), `Assessment.subjectCode`
- seed วนทุกวิชา: 5 วิชา, 59 skills, 20 worlds, 108 stages + 20 bosses, 40 items, 30 achievements
- service ทำงานตามวิชา: `SkillsService.all(subject?)/ordered(subject?)`, learning path, placement, `games.worlds(studentId, 'ACTIVE'|'ALL'|code)`, progress dashboard `?subject=`, `GET /progress/subjects`, `PUT /students/me/subject`, `GET /subjects` (public), รายงานผู้ใหญ่ `?subject=` + `subjects[]`
- achievements ใหม่: ENGLISH_EXPLORER, YOUNG_SCIENTIST, BOOKWORM, SHARP_THINKER, ALL_ROUNDER
- เทสต์ใหม่: `curriculum/subjects.spec.ts`, `questions/subjects/subjects.spec.ts`, `test/phase6.e2e-spec.ts`

Frontend (ทำแล้ว):
- `src/lib/api.ts`: `SUBJECT_META`, `SubjectProgress`, `Student.activeSubject`, `Dashboard.subject`, `StudentReport.subjects`, `api.setSubject/mySubjects`, `adultApi.childReport(id, subject?)`, `adultApi.studentReport(id, sid, subject?)`, `SkillInfo.subjectCode`, visual `passage`
- `components/SubjectSwitcher.tsx` (แถบเลือกวิชา) ใส่แล้วใน `app/map/page.tsx` และ `app/dashboard/page.tsx` (state `subject` ใน deps ของ useEffect)
- `QuestionCard.tsx` แสดง `passage` (`<div className="passage">`)
- dashboard: GROUP_LABEL ของกลุ่มทักษะวิชาใหม่, หัวข้อแสดงชื่อวิชา
- placement: แสดง badge ชื่อวิชา
- `ReportView.tsx`: แท็บวิชา (`.subject-tabs`, prop `onSubject`) และหัวข้อตามวิชา
- ลบกล่อง "วิชาใหม่กำลังจะมา" ออกจากแผนที่แล้ว

## Phase 6 — ปิดงาน (2026-10-05)

- frontend: รายงานผู้ปกครอง/ครูสลับแท็บวิชาได้ (state `subject`), ช่องเลือกทักษะการบ้านจัด `<optgroup>` ตามวิชา, CSS `.subjects` `.subject-tabs` `.passage` และธีมโลกใหม่ 8 แบบ
- แก้บั๊ก backend: ในรายงาน `skillTime` และ "เก่งขึ้นแล้ว" เคยรวมทุกวิชา ตอนนี้กรองตามวิชาของรายงานแล้ว (`week` ยังนับรวมทุกวิชาโดยตั้งใจ) และมี e2e ใน `phase6.e2e-spec.ts` ตรวจไว้
- ผลตรวจ: tsc/lint/build ผ่าน, unit 192 ผ่าน, e2e 44 ผ่าน และทดสอบในเบราว์เซอร์ผ่าน (สคริปต์ `ui-phase6.mjs` อยู่ใน scratchpad ของ session 86cb6860)
- พอร์ต 3100 ตอนนี้โปรเจกต์อื่นของผู้ใช้ (auto-business-platform) ใช้อยู่ ห้ามปิด ให้รัน frontend ที่ 3200 และตั้ง `CORS_ORIGIN=http://localhost:3200`
- ข้อสังเกตที่ยังไม่ได้แก้: เป้าหมาย (Goal) ยังเป็นของคณิตศาสตร์ เช่นแท็บวิชาอื่นก็ยังแสดง "เก่งคณิตครบทุกเรื่อง"
- ยังไม่เคย commit ต้องถามผู้ใช้ก่อน

## หลัง Phase 6 (2026-10-05, session เดียวกัน)

- เพิ่มแล้ว: ปุ่มอ่านออกเสียงและคำใบ้ที่ขีดฆ่าตัวเลือก (`frontend/src/lib/speech.ts`, `backend/src/questions/hint-remove.ts`), ความรู้สึกแบบเกม เช่น เสียง คอมโบ นับถอยหลัง และพลุ (`frontend/src/lib/sfx.ts`, `ActivityScene.tsx`) และเจาะลึกรายวิชา + โลกบล็อก (ดู README หัวข้อ "เจาะลึกรายวิชา + โลกบล็อก")
- ไฟล์ใหม่ backend: `questions/generators.measurement.ts`, `questions/subjects/{english,science,reading,logic}-advanced.ts`, `questions/subjects/advanced.spec.ts`, migration `20261006000000_block_world`
- ฐานข้อมูล dev ของผู้ใช้คือ Postgres แยกที่ `D:\RaiNBoW\pgdata-kids` พอร์ต 5434 (trust auth) ซึ่ง `backend/.env` ชี้ไปที่นี่แล้ว และ migrate + seed หลักสูตรล่าสุดแล้ว ห้ามใช้รันเทสต์ ให้ใช้ Postgres ชั่วคราวที่พอร์ต 5499 แทน
- พอร์ตที่โปรแกรมอื่นใช้อยู่: 3100 (auto-business-platform), 4100, 5433 ผู้ใช้รัน backend ที่ 4000 และ frontend dev ที่ 3200 เอง ถ้าจะทดสอบในเบราว์เซอร์ ให้ copy frontend ไปที่ `D:\RaiNBoW\kids-fe-test` (junction node_modules + `turbopack.root: 'D:/RaiNBoW'`) แล้วรัน backend ที่ 4600 และ frontend ที่ 3300 เพื่อไม่ให้ชนกับของผู้ใช้
- ผลตรวจล่าสุด: unit 239 ผ่าน, e2e 44 ผ่าน (รันทีละไฟล์), frontend tsc/lint ผ่าน และทดสอบในเบราว์เซอร์ผ่าน
- ต่อยอดแล้ว (2026-10-06): โลกบล็อกในทุกวิชา (WORD_MINE, CRYSTAL_CAVE, BLOCK_VILLAGE, BLOCK_MAZE) และคลังโจทย์อังกฤษ/ไทยใหญ่ขึ้น รวมตอนนี้ 36 โลก 229 ด่าน 61 ไอเท็ม
- ยังไม่ได้แก้: เป้าหมาย (Goal) ยังเป็นของคณิตศาสตร์, หน้าแผนที่และหน้าวัดระดับยังไม่มีเสียงหรือแอนิเมชันแบบหน้าเล่นเกม
- ยังไม่เคย commit

## ข้อควรระวังที่เรียนรู้มา

- ทดสอบวัดระดับ/บอสบนข้อมูลจริงเสมอ: เคยเจอบั๊กที่ mastery ลดหลังชนะบอส และ placement ไม่ตรวจทักษะสายอื่น (แก้แล้ว)
- เวลาในตาราง DB เป็น UTC แบบไม่มี timezone — SQL ใน test script ต้องใช้ `timezone('utc', now())`
- PGlite (`prisma dev`) รับได้แค่ connection เดียว — ใช้ Postgres จริงจาก `pg_ctl` แทน
- ระวัง XSS/สิทธิ์: ข้อมูลเด็กต้องผ่าน `ReportsService.assertCanView`; ผู้ใหญ่ที่ไม่มีสิทธิ์ต้องได้ 404
