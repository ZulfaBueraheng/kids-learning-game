# 🎮 Kids Learning Game Platform

> เกมการเรียนรู้สำหรับพัฒนาศักยภาพเด็กตั้งแต่อนุบาล 1 ถึงประถมศึกษาปีที่ 6
> **5 วิชา:** 🔢 คณิตศาสตร์ · 🔤 ภาษาอังกฤษ · 🔬 วิทยาศาสตร์ · 📖 การอ่านภาษาไทย · 🧩 การคิดเชิงตรรกะ — เด็กเรียนรู้ผ่านเกม ภารกิจ ด่าน และการผจญภัย พร้อมระบบวัดระดับและเส้นทางการเรียนรู้เฉพาะบุคคล
> 93 ทักษะ · 36 โลก · 229 ด่าน + บอส 36 ตัว · ธีมโลกบล็อก ⛏️ · อ่านออกเสียงให้เด็กที่ยังอ่านไม่คล่อง

> ⚙️ **สถานะปัจจุบัน:** Phase 1 — Math Foundation (อนุบาล 1 → ป.1) ✅ · Phase 2 — Core Mathematics (ป.2 → ป.3) ✅ · Phase 3 — Advanced Mathematics (ป.4 → ป.6) ✅ · Phase 4 — Personalization ✅ · Phase 5 — Parent & Teacher Platform ✅ · Phase 6 — Platform Expansion (อังกฤษ · วิทยาศาสตร์ · อ่านไทย · ตรรกะ) ✅ · เจาะลึกรายวิชา + โลกบล็อก ✅ — ดูวิธีรันได้ที่ [Getting Started](#-getting-started)

---

## 📌 Product Vision

แพลตฟอร์มนี้มีแนวคิดว่า

> **เด็กเล่น → ระบบเรียนรู้ความสามารถของเด็ก → วิเคราะห์ Skill → วาง Learning Path → ฝึกฝน → ประเมินผล → ปลดล็อกด่านใหม่ → พัฒนาไปสู่เป้าหมาย**

เด็กไม่จำเป็นต้องรู้สึกว่ากำลังทำแบบเรียนหรือข้อสอบ แต่จะรู้สึกว่ากำลังเล่นเกมและทำภารกิจ

ในขณะที่ระบบด้านหลังทำหน้าที่เป็น **Personalized Learning Engine**

```text
                    KIDS LEARNING PLATFORM
                             │
             ┌───────────────┼───────────────┐
             │               │               │
        Assessment       Learning Path    Game Engine
             │               │               │
        วัดระดับ          แผนการเรียน      ด่าน/ภารกิจ
        Skill Map         เฉพาะบุคคล       Reward
             │               │               │
             └───────────────┼───────────────┘
                             │
                    Personalization
                             │
                  ┌──────────┴──────────┐
                  │                     │
               Student               Parent
                  │                     │
              Dashboard             Dashboard
```

## 🎯 Goals

### Primary Goals

- ทำให้การเรียนทุกวิชาสนุกและเข้าใจง่าย จนเด็กรู้สึกว่ากำลังเล่นเกม
- ปูพื้นฐานตั้งแต่ระดับอนุบาล
- วัดระดับความสามารถของเด็กก่อนเริ่มเรียน
- วิเคราะห์จุดแข็งและจุดที่ควรพัฒนา
- สร้าง Learning Path เฉพาะบุคคล
- ปรับความยากของกิจกรรมตามความสามารถ
- ใช้เกมและภารกิจเพื่อสร้างแรงจูงใจ
- ติดตามพัฒนาการของเด็ก
- ให้ผู้ปกครองเห็นภาพรวมการเรียนรู้
- รองรับการขยายจากคณิตศาสตร์ไปยังวิชาอื่น (ตอนนี้มี 5 วิชาบน Learning Engine เดียวกัน)

### Long-term Vision

สร้าง Learning Platform ที่สามารถพัฒนาเด็กเป็นรายบุคคล โดยใช้ข้อมูลการเรียนรู้เพื่อช่วยกำหนดว่า

```text
เด็กอยู่ตรงไหน?
      ↓
ขาด Skill อะไร?
      ↓
ควรเรียนอะไรต่อ?
      ↓
ควรฝึกด้วยวิธีไหน?
      ↓
เมื่อไหร่จึงถือว่า Master?
      ↓
เป้าหมายถัดไปคืออะไร?
```

## 👧🧒 Target Users

### Student

อนุบาล 1 · อนุบาล 2 · อนุบาล 3 · ป.1 · ป.2 · ป.3 · ป.4 · ป.5 · ป.6

### Parent

- ดู Progress
- ดู Skill ที่เด็กทำได้
- ดู Skill ที่ควรฝึกเพิ่ม
- ดู Learning Path
- ดูเวลาในการเรียน
- ดูพัฒนาการในภาพรวม

### Teacher

- ดูนักเรียน
- สร้างห้องเรียน
- ดู Skill ของนักเรียน
- มอบหมายกิจกรรม
- ดู Progress
- วิเคราะห์จุดที่นักเรียนต้องพัฒนา

### Admin

- จัดการผู้ใช้
- จัดการ Curriculum
- จัดการ Skill
- จัดการ Question Bank
- จัดการ Game
- จัดการ Content
- ดู Analytics

## 🧠 Core Concept: Skill-Based Learning

ระบบจะไม่ยึดเพียงระดับชั้น

ตัวอย่าง:

```text
Student A

Number Sense        ██████████ 90%
Addition            ██████████ 95%
Subtraction         ████████░░ 80%
Multiplication      ██████░░░░ 60%
Division            ███░░░░░░░ 30%
```

เด็กสองคนที่อยู่ ป.3 จึงสามารถได้รับ Learning Path ที่แตกต่างกันตาม Skill จริงของแต่ละคน

## 🌳 Mathematics Skill Tree

```text
MATHEMATICS
│
├── Number Sense
│   ├── Number Recognition
│   ├── Counting
│   ├── Quantity
│   ├── Comparing Numbers
│   └── Place Value
│
├── Addition
│   ├── Single Digit
│   ├── Double Digit
│   ├── Carrying
│   └── Word Problems
│
├── Subtraction
│   ├── Single Digit
│   ├── Double Digit
│   ├── Borrowing
│   └── Word Problems
│
├── Multiplication
│   ├── Concept
│   ├── Times Tables
│   ├── Multi-digit Multiplication
│   └── Word Problems
│
├── Division
│   ├── Concept
│   ├── Basic Division
│   ├── Long Division
│   └── Word Problems
│
├── Fractions
├── Decimals
├── Percentage
├── Ratio
├── Measurement
├── Time
├── Money
├── Geometry
├── Pattern
└── Problem Solving
```

## 🧪 Placement Assessment

เมื่อเด็กเริ่มใช้งานครั้งแรก ระบบจะวัดระดับผ่านกิจกรรมที่มีลักษณะเหมือนเกม

ตัวอย่าง:

```text
🍎 🍎 🍎

มีแอปเปิลกี่ลูก?

[ 1 ] [ 2 ] [ 3 ] [ 4 ]
```

ระบบเก็บข้อมูล เช่น

```text
Skill: Counting
Difficulty: 2
Answer: Correct
Time: 4.2 sec
Attempt: 1
Hint Used: No
```

ข้อมูลเหล่านี้นำไปสร้าง Skill Profile ของเด็ก

## 🔄 Adaptive Assessment

```text
                    Assessment
                         │
                         ▼
                    Question
                         │
              ┌──────────┴──────────┐
              │                     │
            Correct               Incorrect
              │                     │
         เพิ่มความยาก          ลดความยาก
              │                     │
              └──────────┬──────────┘
                         ▼
                    Skill Level
```

ระบบสามารถเพิ่มหรือลด Difficulty และย้อนกลับไปยัง Prerequisite Skill เมื่อพบว่าพื้นฐานยังไม่พร้อม

## 🗺️ Personalized Learning Path

```text
Current Skill
      +
Required Skill
      ↓
Knowledge Gap
      ↓
Learning Path
```

ตัวอย่าง:

```text
Number Sense        85%
Addition            90%
Subtraction         70%
Multiplication      30%
Division            10%
```

Learning Path:

```text
Number Sense
     ↓
Addition
     ↓
Multiplication ×2–5
     ↓
Multiplication ×6–10
     ↓
Division Concept
     ↓
Basic Division
     ↓
Problem Solving
```

## 🎮 Game World

เปลี่ยนบทเรียนให้เป็นโลกของเกม

```text
🌎 Math World
│
├── 🌳 Counting Forest
├── 🏘️ Number Village
├── 🏰 Addition Castle
├── 🏜️ Subtraction Desert
├── 🌋 Multiplication Volcano
├── 🌊 Division Ocean
├── 🌙 Fraction Moon
└── 🚀 Math Space
```

แต่ละ World มีหลาย Stage:

```text
🏰 Addition Castle

⭐ Stage 1
⭐ Stage 2
⭐ Stage 3
🔒 Stage 4
🔒 Boss
```

## 🧩 Game Activities

- 🎯 **Target** — เลือกคำตอบที่ถูกเพื่อยิงเป้า
- 🧱 **Building** — ตอบถูกเพื่อรับ Block
- 🚂 **Train** — เรียงตัวเลขหรือแก้โจทย์เพื่อเดินทางต่อ
- 🐠 **Fishing** — เลือกคำตอบที่ถูกเพื่อตกปลา
- 🏎️ **Racing** — ตอบถูกเพื่อเพิ่มความเร็ว
- 🧩 **Puzzle** — จับคู่หรือเรียงลำดับ
- 🛍️ **Shop** — เรียนรู้การคำนวณเงิน
- 🧙 **Magic** — ใช้โจทย์คณิตศาสตร์เป็นส่วนหนึ่งของภารกิจ

## 🐉 Boss Battle

แต่ละ Skill Group สามารถมี Boss

```text
🐉 Dragon of Addition

Boss HP
❤️ ❤️ ❤️ ❤️ ❤️

Question 1 ✓
Question 2 ✓
Question 3 ✓
Question 4 ✗
Question 5 ✓
```

หากยังไม่ผ่าน ระบบสามารถพาเด็กกลับไปฝึก Skill ที่เกี่ยวข้อง แล้วกลับมาท้าทายใหม่

## 👤 Character System

```text
Character
│
├── Skin
├── Hair
├── Clothes
├── Hat
├── Pet
└── Accessories
```

Reward เช่น: 🎩 Hat · 👕 Clothes · 🐶 Pet · 🏠 House · 🚀 Spaceship · 🏝️ Island · 🧸 Collectibles

## 🎁 Reward System

- XP
- Coins
- Badges
- Achievements
- Items
- Characters
- Pets
- World Unlock
- Stage Unlock

ควรออกแบบ Reward เพื่อสร้างแรงจูงใจเชิงบวก และไม่ทำให้เด็กกดดันจากระบบ Streak หรือการแข่งขันมากเกินไป

## 🧠 Mastery System

Mastery ไม่ควรวัดจากคะแนนถูกเพียงอย่างเดียว

ระบบสามารถพิจารณา: Accuracy · Speed · Attempts · Difficulty · Consistency · Hint Usage · Retention

ตัวอย่าง:

```text
Addition

Accuracy       92%
Consistency    85%
Difficulty     80%
Retention      78%

Mastery        84%
```

## 🔁 Spaced Practice

```text
Day 1
เรียน Addition
     ↓
Day 2
Addition Review
     ↓
Day 4
Mixed Review
     ↓
Day 7
Mastery Check
```

เป้าหมายคือช่วยให้เด็กนำความรู้กลับมาใช้ได้ ไม่ใช่เพียงทำโจทย์ผ่านในครั้งเดียว

## 🧒 Personalization

ระบบสามารถปรับรูปแบบเกมตามความสนใจและพฤติกรรมการเล่นของเด็ก

```text
Interest Profile

🦖 Dinosaur     ██████████
🚀 Space        ████████
🐱 Animals      ███████
🏎️ Racing       █████
🧙 Fantasy      █████████
```

ตัวอย่าง:

```text
Skill เดียวกัน: 7 + 5

เด็ก A
🚀 Space Adventure

เด็ก B
🦖 Dinosaur Adventure
```

Skill เดียวกัน แต่บริบทและ Presentation สามารถแตกต่างกันได้

## 🎯 Goal System

เป้าหมายสามารถเป็น:

```text
🎯 My Goal

○ Build Math Foundation
○ Follow Grade Level
○ Exam Preparation
○ Problem Solving
○ Math Mastery
```

ระบบ:

```text
Goal
 ↓
Required Skills
 ↓
Current Skills
 ↓
Skill Gap
 ↓
Learning Path
 ↓
Practice
 ↓
Assessment
 ↓
Mastery
```

## 📊 Student Dashboard

```text
👧 Emma

Math Progress
████████░░ 78%

Strong Skills
✓ Counting
✓ Addition

Need Practice
△ Subtraction
△ Multiplication

Current Path
Addition → Multiplication

XP
2,450

Level
12
```

## 👨‍👩‍👧 Parent Dashboard

ผู้ปกครองสามารถดู:

```text
Overall Math Progress
████████░░ 78%

Strong
✓ Counting
✓ Addition

Practice More
△ Subtraction
△ Multiplication

Learning Time
32 min / week

Completed
18 Activities

Mastered
7 Skills
```

รวมถึงคำแนะนำเชิงข้อมูล เช่น Skill ที่เด็กใช้เวลามากหรือควรฝึกเพิ่มเติม

## 👩‍🏫 Teacher Dashboard

```text
Teacher
│
├── Students
├── Classes
├── Assignments
├── Progress
├── Skill Map
├── Weak Skills
└── Reports
```

ตัวอย่าง:

```text
                    Student A  Student B  Student C

Addition                ✓          ✓          ✓
Subtraction             ✓          △          ✓
Multiplication          △          △          ✓
Division                ✗          ✗          △
```

## 📚 Curriculum Structure

| ระดับ    | ตัวอย่างจุดเน้น                                   |
| -------- | ------------------------------------------------ |
| อนุบาล 1 | จำนวน, การจับคู่, รูปร่าง                          |
| อนุบาล 2 | การนับ, เปรียบเทียบ, Pattern                      |
| อนุบาล 3 | บวก-ลบพื้นฐาน, เวลา, รูปร่าง                       |
| ป.1      | จำนวน, บวก, ลบ                                    |
| ป.2      | บวก-ลบหลายหลัก, คูณพื้นฐาน                         |
| ป.3      | คูณ, หาร, เศษส่วน, โจทย์ปัญหา                      |
| ป.4      | เศษส่วน, ทศนิยม, Geometry                         |
| ป.5      | Fraction, Decimal, Percentage, Algebra พื้นฐาน     |
| ป.6      | Ratio, Percentage, Geometry, Problem Solving, Algebra |

ระดับชั้นเป็นกรอบอ้างอิง ส่วน Learning Path จะอิงจาก Skill และความพร้อมของเด็กแต่ละคน

## 🏗️ System Architecture

Technology Stack ที่แนะนำ:

```text
Frontend
└── Next.js
    └── React / TypeScript

Backend
└── NestJS
    └── REST API

Database
└── PostgreSQL

ORM
└── Prisma

Storage
└── Object Storage

Analytics
└── Learning Analytics
```

Architecture:

```text
                         CLIENT
                            │
              ┌─────────────┼─────────────┐
              │             │             │
           Student        Parent       Teacher
              │
              ▼
                     Next.js Frontend
                            │
                            ▼
                       NestJS API
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
       ▼                    ▼                    ▼
  User System         Learning Engine       Game Engine
                            │
              ┌─────────────┼─────────────┐
              │             │             │
        Assessment      Skill Engine   Mastery
              │             │             │
              └─────────────┼─────────────┘
                            │
                    Learning Path
                            │
                            ▼
                       PostgreSQL
                            │
                            ▼
                      Analytics
```

## 🧱 Backend Module Structure

```text
backend/
│
├── auth/
├── users/
├── students/
├── parents/
├── teachers/
│
├── subjects/
├── curriculum/
├── skills/
├── skill-prerequisites/
│
├── assessments/
├── questions/
├── question-bank/
│
├── learning-path/
├── recommendations/
├── mastery/
│
├── games/
├── game-sessions/
├── levels/
├── quests/
│
├── rewards/
├── achievements/
├── inventory/
│
├── progress/
├── analytics/
│
└── notifications/
```

## 🗃️ Database Concept

Core entities:

```text
User
Student
Parent
Teacher

Subject
Grade
Curriculum

Skill
SkillPrerequisite

Question
QuestionOption

Assessment
AssessmentAttempt

LearningPath
LearningPathItem

Game
GameLevel
GameSession
Quest

StudentSkill
StudentMastery
StudentProgress

Reward
Achievement
StudentAchievement

Character
InventoryItem
StudentInventory

ParentStudent
TeacherStudent
Classroom
```

### StudentSkill

```text
StudentSkill
│
├── studentId
├── skillId
├── mastery
├── accuracy
├── attempts
├── lastPracticedAt
├── confidence
└── status
```

นี่เป็นหนึ่งใน Entity หลักของ Personalized Learning

## 🔐 Child Safety & Privacy

เนื่องจากมีผู้ใช้งานเป็นเด็ก ควรออกแบบเรื่องความปลอดภัยตั้งแต่ต้น

หลักการ:

- เก็บข้อมูลเด็กเท่าที่จำเป็น
- แยกสิทธิ์ Student / Parent / Teacher / Admin
- ไม่เปิดเผยข้อมูลส่วนตัวของเด็กต่อผู้ใช้อื่น
- จำกัดการติดต่อระหว่างเด็กกับบุคคลภายนอก
- มี Consent / Parental Control ตามข้อกำหนดที่เกี่ยวข้อง
- ป้องกันการเข้าถึงข้อมูลข้ามบัญชี
- บันทึก Audit Log สำหรับการจัดการข้อมูลสำคัญ
- ออกแบบ Analytics โดยคำนึงถึง Privacy
- หลีกเลี่ยงระบบการแข่งขันที่สร้างแรงกดดันเกินจำเป็น

ก่อนเปิดใช้งานจริงควรตรวจสอบข้อกำหนดด้านข้อมูลส่วนบุคคลและกฎหมายที่เกี่ยวข้องกับเด็กในประเทศเป้าหมาย

## 🚀 MVP Roadmap

### Phase 1 — Math Foundation

Target: อนุบาล 1 → ป.1

Features:

- [x] Student Account
- [x] Math
- [x] Number
- [x] Counting
- [x] Addition
- [x] Subtraction
- [x] Placement Assessment
- [x] Skill Profile
- [x] Basic Learning Path
- [x] Game Levels
- [x] XP
- [x] Achievement
- [x] Progress

### Phase 2 — Core Mathematics

Target: ป.2 → ป.3

เพิ่ม:

- [x] Multiplication
- [x] Division
- [x] Fractions
- [x] Word Problems
- [x] More Game Types
- [x] Boss Battle
- [x] Character
- [x] Reward System

### Phase 3 — Advanced Mathematics

Target: ป.4 → ป.6

เพิ่ม:

- [x] Decimals
- [x] Percentage
- [x] Ratio
- [x] Geometry
- [x] Algebra
- [x] Advanced Problem Solving

### Phase 4 — Personalization

- [x] Interest Profile
- [x] Adaptive Difficulty
- [x] Adaptive Assessment
- [x] Personalized Learning Path
- [x] Recommendation Engine
- [x] Spaced Practice
- [x] Mastery Engine

### Phase 5 — Parent & Teacher Platform

- [x] Parent Dashboard
- [x] Teacher Dashboard
- [x] Classroom
- [x] Assignment
- [x] Reports
- [x] Learning Analytics

### Phase 6 — Platform Expansion

```text
Mathematics
   ↓
English
   ↓
Science
   ↓
Reading
   ↓
Logical Thinking
   ↓
Problem Solving
```

Architecture ควรออกแบบให้ Subject ใหม่สามารถใช้ Learning Engine เดิมได้

- [x] English
- [x] Science
- [x] Reading (ภาษาไทย)
- [x] Logical Thinking
- [x] Subject Switcher + รายงานแยกวิชา
- [x] Subject ใหม่ใช้ Learning Engine เดิม (placement, mastery, path, game, reward)

## 🔄 Main Learning Loop

```text
                ┌───────────────┐
                │     PLAY      │
                └───────┬───────┘
                        ↓
                ┌───────────────┐
                │   PRACTICE    │
                └───────┬───────┘
                        ↓
                ┌───────────────┐
                │   ASSESSMENT  │
                └───────┬───────┘
                        ↓
                ┌───────────────┐
                │    MASTERY    │
                └───────┬───────┘
                        ↓
                ┌───────────────┐
                │  NEXT SKILL   │
                └───────┬───────┘
                        │
                        └───────────────→ PLAY
```

## 🛠️ Recommended Development Order

```text
1. Product Requirements
        ↓
2. Curriculum Structure
        ↓
3. Mathematics Skill Tree
        ↓
4. Skill Prerequisite Graph
        ↓
5. Question Model
        ↓
6. Assessment Engine
        ↓
7. Student Skill / Mastery
        ↓
8. Learning Path Engine
        ↓
9. Game Engine
        ↓
10. Reward System
        ↓
11. Student Dashboard
        ↓
12. Parent Dashboard
        ↓
13. Teacher Dashboard
        ↓
14. Analytics
        ↓
15. Personalization
```

## 🎯 MVP Success Criteria

MVP ควรตอบคำถามเหล่านี้ได้:

1. **เด็กอยู่ระดับไหน?** — Placement Assessment → Skill Profile
2. **เด็กควรเรียนอะไร?** — Skill Gap → Learning Path
3. **เด็กเรียนรู้หรือยัง?** — Practice → Assessment → Mastery
4. **เด็กยังต้องฝึกอะไร?** — Student Skill Map → Weak / Developing Skills
5. **เด็กมีส่วนร่วมกับระบบหรือไม่?** — Game + Quest + Reward + Character + World

## 🌟 Product Philosophy

**เด็กเห็น**

```text
🌎 World
🎮 Game
⭐ Level
🎯 Quest
🏆 Achievement
🎁 Reward
🐉 Boss
```

**ระบบเห็น**

```text
Assessment
    ↓
Skill Graph
    ↓
Mastery
    ↓
Knowledge Gap
    ↓
Learning Path
    ↓
Adaptive Difficulty
    ↓
Recommendation
    ↓
Mastery Validation
```

ดังนั้น Product ไม่ควรเป็นเพียง

> เกมที่เอาโจทย์คณิตศาสตร์มาใส่

แต่ควรเป็น

> **เกมผจญภัยที่มี Personalized Learning Engine อยู่เบื้องหลัง**

## 🔮 Future Ideas

- AI Tutor
- AI-generated practice questions
- Voice-based learning
- Interactive storytelling
- Multiplayer cooperative challenges
- Offline learning
- School integration
- Learning reports
- Parent recommendations
- Teacher lesson planning
- Cross-subject Skill Graph
- Personalized curriculum
- Adaptive difficulty engine
- Learning analytics
- Content authoring system

## 🏁 Final Product Vision

```text
                       🌟 CHILD
                          │
                    "อยากเล่นเกม"
                          │
                          ▼
                  🎮 LEARNING GAME
                          │
                          ▼
                   🧠 LEARNING DATA
                          │
                          ▼
                   📊 SKILL ANALYSIS
                          │
                          ▼
                 🗺️ LEARNING PATH
                          │
                          ▼
                    🎯 PRACTICE
                          │
                          ▼
                    🧪 ASSESSMENT
                          │
                          ▼
                     🏆 MASTERY
                          │
                          ▼
                  🚀 NEXT CHALLENGE
                          │
                          └──────────────→ 🎮
```

เป้าหมายสูงสุดของ Platform คือทำให้เด็กแต่ละคนได้รับเส้นทางการเรียนรู้ที่เหมาะกับระดับ ความสนใจ และความก้าวหน้าของตัวเอง โดยใช้เกมเป็นประสบการณ์ด้านหน้า และ Learning Engine เป็นระบบด้านหลัง

---

## 🚀 Getting Started

### Requirements

- Node.js 20+
- PostgreSQL 14+

### Project Structure

```text
kids-learning-game/
├── backend/    NestJS + Prisma (REST API, Learning Engine)
└── frontend/   Next.js + React + TypeScript (Game UI)
```

### 1. Backend

```bash
cd backend
cp .env.example .env          # แก้ DATABASE_URL และ JWT_SECRET
npm install
npx prisma migrate dev        # สร้างตาราง
npm run seed                  # ใส่ Skill Tree, World, Stage, Boss, Item, Achievement (รันซ้ำได้)
npm run start:dev             # http://localhost:4000
npm test                      # unit tests ของ Learning Engine
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                   # http://localhost:3000
```

> ถ้าพอร์ต 3000 ถูกใช้อยู่ ให้รัน `npm run dev -- -p 3100` แล้วตั้ง `CORS_ORIGIN="http://localhost:3100"` ใน `backend/.env`

### Tests

```bash
cd backend
npm test                      # unit tests: question generator, placement, mastery, learning path, rewards, game
npm run test:e2e              # full loop บน DB จริง: register → placement → path → play → dashboard
```

### Phase 1 Flow

1. สร้างโปรไฟล์เด็ก (ชื่อเล่น + ระดับชั้น + อวาตาร์ — ไม่เก็บข้อมูลส่วนตัวอื่น)
2. ทำ **Placement Assessment** แบบ Adaptive → ได้ Skill Profile
3. ระบบสร้าง **Learning Path** จาก Skill Gap + Prerequisite Graph
4. เล่น **Stage** ใน World ต่าง ๆ → ระบบอัปเดต Mastery, XP, Achievement
5. ดู **Dashboard**: Skill Map, Strong / Need Practice, Current Path, XP, Level

### Phase 2 Flow

- **ทักษะใหม่ 10 ทักษะ:** ความหมายของการคูณ, สูตรคูณแม่ 2–5 และ 6–10, คูณเลขหลายหลัก, ความหมายของการหาร, การหารพื้นฐาน, รู้จักเศษส่วน, เปรียบเทียบเศษส่วน, โจทย์ปัญหาการบวกลบ, โจทย์ปัญหาการคูณหาร (รวมเรื่องเงินทอน)
- **โลกใหม่ 4 โลก:** 🌋 Multiplication Volcano · 🌊 Division Ocean · 🌙 Fraction Moon · 🚀 Math Space
- **เกมแบบใหม่:** 🧩 Puzzle · 🛍️ Shop · 🧪 Magic (เพิ่มจาก Target, Building, Train, Fishing, Racing)
- **🐉 Boss Battle ทุกโลก (8 ตัว):** บอสตื่นเมื่อผ่านทุกด่านในโลก (หรือเด็กรู้ทุกทักษะในโลกแล้ว) · ตอบถูก 5 ครั้งเพื่อปราบ เด็กมีโล่ 3 อัน · โจทย์ผสมทุกทักษะในโลก · ถ้าแพ้ ระบบแนะนำด่านของทักษะที่พลาดมากที่สุดให้ไปฝึกก่อน
- **🎁 Reward:** เหรียญ (ได้ตามความพยายามและดาว ไม่มีการหักเหรียญ) · ของสะสมจากบอสโลกละ 1 ชิ้น · Achievement ใหม่ 8 แบบ · แจ้งเตือนเมื่อปลดล็อกด่าน/โลกใหม่
- **👤 Character:** เปลี่ยนหน้าตัวละคร + แต่งหมวก เสื้อผ้า สัตว์เลี้ยง เครื่องประดับ จากร้านค้า (ช่องละ 1 ชิ้น)

### Phase 3 Flow

- **ทักษะใหม่ 14 ทักษะ (รวม 35):**
  - ทศนิยม: รู้จักทศนิยม (ตาราง 100 ช่อง, ค่าประจำหลัก), เปรียบเทียบและเรียงลำดับ (รวมกับดัก 0.5 vs 0.45), บวกลบทศนิยมและเงินทอน
  - เศษส่วน: บวกลบเศษส่วน, เศษส่วนอย่างต่ำ, ตัวส่วนไม่เท่ากัน
  - ร้อยละ: ภาพ/เศษส่วน/ทศนิยม ↔ %, ร้อยละของจำนวน, ส่วนลด, หาจำนวนเต็มจากร้อยละ
  - อัตราส่วน: อัตราส่วนจากภาพ, อย่างต่ำ, อัตราส่วนที่เท่ากัน, สัดส่วน แบ่งเงิน มาตราส่วนแผนที่ อัตราเร็ว
  - เรขาคณิต: จำนวนด้าน/ชื่อรูป, ชนิดของมุม, ความยาวรอบรูปและพื้นที่ (รวมสามเหลี่ยม), หาขนาดมุม (เส้นตรง, สามเหลี่ยม, รอบจุด)
  - พีชคณิต: สมการ □ / x (หนึ่งและสองขั้นตอน), แบบรูป, แทนค่านิพจน์, พจน์ที่ n
  - โจทย์ปัญหาหลายขั้นตอน: เงินทอน, ส่วนลด, อัตราส่วน, พื้นที่ × ราคา, ค่าเฉลี่ย
- **โลกใหม่ 4 โลก + บอส:** 🏝️ เกาะทศนิยม (🦈) · 🏙️ เมืองร้อยละและอัตราส่วน (🤖) · ⛰️ หุบเขาเรขาคณิต (🗿) · 🌌 กาแล็กซีพีชคณิต (👽)
- **ภาพประกอบใหม่:** ตาราง 100 ช่อง, รูปหลายเหลี่ยม, สี่เหลี่ยมพร้อมความยาวด้าน/ตารางหน่วย, สามเหลี่ยมพร้อมมุม, มุม, ภาพนับเทียบอัตราส่วน
- **รางวัลใหม่:** Achievement 7 แบบ (รวม 🏆 แชมป์แห่ง Math World เมื่อปราบบอสครบ 12 ตัว) · ของในร้าน 4 ชิ้น · ของสะสมจากบอสอีก 4 ชิ้น
- การวัดระดับเริ่มต้นตามชั้น: ป.4 → สูตรคูณ 6–10, ป.5 → เศษส่วน, ป.6 → ทศนิยม (ไม่มี migration ใหม่ — รัน `npm run seed` อย่างเดียว)

### Phase 4 Flow — Personalization

- **💖 Interest Profile:** เด็กเลือกสิ่งที่ชอบตอนสมัคร (🦖 ไดโนเสาร์ · 🚀 อวกาศ · 🐱 สัตว์ · 🏎️ รถแข่ง · 🧙 เวทมนตร์) แก้ได้ที่หน้าความก้าวหน้า · โจทย์ทักษะเดียวกันจะแต่งเป็นธีมที่ชอบ (นับ "ไข่ไดโนเสาร์" หรือ "ดาวเคราะห์", โจทย์ปัญหาใช้ตัวละครและสิ่งของของธีม) · ระบบเรียนรู้เพิ่มเองจากด่านที่เด็กเล่นได้ดี (≥ 2 ดาว) และความชอบเก่าค่อย ๆ จางลงเมื่อมีความชอบใหม่
- **🧭 Adaptive Assessment:** วัดระดับตามกราฟ Prerequisite — ถ้าทักษะไหนไม่ผ่าน ระบบย้อนไปตรวจพื้นฐานของทักษะนั้นก่อน (diagnose) ข้ามทักษะที่ต้องพึ่งทักษะที่ไม่ผ่าน แต่ยังวัดสายอื่นต่อ (เช่น พลาดเศษส่วนแต่ยังวัดเรขาคณิต) และตรวจทักษะชั้นล่างที่ยังไม่รู้ผล (sweep) · อนุมานว่า "รู้แล้ว" เฉพาะพื้นฐานจริงของทักษะที่ผ่าน
- **🎚️ Adaptive Difficulty:** เริ่มด่านที่ระดับความยากใกล้ mastery ของเด็ก (±1 จากที่ออกแบบด่าน) · ตอบถูกเร็วโดยไม่ใช้คำใบ้ = ยากขึ้นทันที · ผิด 2 ข้อติดกัน = ข้อต่อไปง่ายลง พร้อมคำใบ้อัตโนมัติและข้อความให้กำลังใจ
- **🔁 Spaced Practice:** ห้อง "ทบทวนความจำ" ผสมโจทย์จากทักษะที่ถึงกำหนดทบทวน (1 → 3 → 7 → 14 → 30 วัน) หรือที่ความจำกำลังจาง · ทบทวนผ่าน = นัดครั้งถัดไปห่างออกไป
- **🧠 Mastery Engine:** เพิ่ม Forgetting Curve (memory strength, half-life 3 วันและเพิ่มเป็น 2 เท่าทุกครั้งที่ทบทวน) ใช้จัดลำดับการทบทวน
- **🎯 Recommendation Engine ("ภารกิจวันนี้" บนแผนที่):** ทบทวนที่ถึงกำหนด → ทักษะถัดไปในเส้นทาง → บอสที่ตื่นแล้ว → ทักษะที่ยังต้องฝึก (อ่อนสุดก่อน) · เลือกด่านที่ระดับความยากเหมาะกับเด็ก เลี่ยงด่านที่เพิ่งเล่น และเพิ่มคะแนนให้กิจกรรมที่ตรงกับความชอบ · ทุกภารกิจบอกเหตุผล
- **🗺️ Personalized Learning Path + Goal System:** เลือกเป้าหมาย ปูพื้นฐาน / ตามระดับชั้น / เตรียมสอบ / นักแก้โจทย์ปัญหา / เก่งครบทุกเรื่อง — เส้นทางจะมีเฉพาะทักษะที่เป้าหมายนั้นต้องใช้ (รวม prerequisite ทั้งหมด)
- Migration ใหม่ `phase4_personalization` เป็นแบบเพิ่มคอลัมน์อย่างเดียว ข้อมูลเดิมไม่หาย — รัน `npx prisma migrate deploy`

### Phase 5 Flow — Parent & Teacher Platform

เข้าใช้งานที่ `/grown-ups` (มีลิงก์ "สำหรับผู้ปกครองและคุณครู" ที่หน้าแรก) — บัญชีผู้ใหญ่ใช้อีเมล + รหัสผ่าน (scrypt) แยกจากบัญชีเด็ก และ session แยกกัน จึงใช้เครื่องเดียวกับลูกได้

- **👨‍👩‍👧 Parent Dashboard:** เชื่อมต่อบัญชีลูกด้วยรหัสนักผจญภัยของลูก (เป็นการยืนยันว่าเข้าถึงได้จริง) · รายงานความก้าวหน้า, เวลาเรียนรายวัน 7 วัน, ทักษะที่ใช้เวลามากที่สุด, เก่งแล้ว / ควรฝึกเพิ่ม, เส้นทางและเป้าหมาย, ความสนใจ · **คำแนะนำจากข้อมูล** เช่น ทักษะที่ใช้เวลามากแต่ยังตอบถูกน้อย, ถึงเวลาทบทวน, ไม่ได้เล่นหลายวัน, เตือนเมื่อเล่นนานเกิน 60 นาทีต่อวัน · พิมพ์รายงานได้
- **👩‍🏫 Teacher Dashboard + Classroom:** สร้างห้องเรียนได้รหัส 6 ตัว เด็กกรอกรหัสในหน้า "ความก้าวหน้า" · **แผนที่ทักษะของห้อง** ✓ △ ✗ · ตามตัวอย่างใน README · ทักษะที่นักเรียนส่วนใหญ่ยังไม่เข้าใจ พร้อมปุ่มมอบหมายฝึกเพิ่ม · รายงานรายคนแบบเดียวกับผู้ปกครอง
- **📚 Assignment:** มอบหมายทักษะ + จำนวนข้อ + วันส่ง · การบ้านขึ้นเป็นภารกิจแรกของเด็ก · ครูเห็นสถานะ ส่งแล้ว / ส่งช้า / ยังไม่ส่ง / เลยกำหนด และคะแนนที่ดีที่สุดของแต่ละคน
- **📊 Learning Analytics:** เวลาเรียนรายวัน (ตามเวลาไทย), เวลาและความแม่นยำต่อทักษะ, ทักษะที่ห้องเรียนอ่อน, สถานะการบ้าน — เป็นฟังก์ชันล้วนที่มี unit test (`backend/src/analytics`)
- **🔐 Child Safety & Privacy:**
  - ผู้ปกครองเห็นเฉพาะลูกที่เชื่อมต่อไว้ ครูเห็นเฉพาะนักเรียนในห้องของตัวเอง (ข้อมูลอื่นตอบเป็น "ไม่พบ" เพื่อไม่ให้รู้ว่ามีอยู่)
  - ผู้ปกครองเห็นว่าใครเข้าถึงข้อมูลลูกได้บ้าง และ **นำลูกออกจากห้องเรียนได้** (Parental Control) — ครูจะเห็นข้อมูลไม่ได้อีก
  - **Audit Log** บันทึกการเชื่อมต่อบัญชี การเข้า/ออกห้อง การมอบหมายงาน และการเปิดดูรายงาน ผู้ปกครองดูบันทึกนี้ได้
  - จำกัดการลองรหัสผิด: อีเมลผู้ใหญ่ 5 ครั้ง/15 นาที, รหัสเด็ก 20 ครั้ง/10 นาที ต่อ IP, การเชื่อมต่อบัญชีลูก 5 ครั้ง/15 นาที (ถ้า deploy หลัง reverse proxy ต้องตั้ง `trust proxy` ให้ Express เพื่อให้ได้ IP จริง)
- Migration ใหม่ `phase5_parent_teacher` เพิ่มตารางและคอลัมน์อย่างเดียว — รัน `npx prisma migrate deploy`

### Phase 6 Flow — Platform Expansion

ทุกวิชาใช้ Learning Engine ชุดเดียวกับคณิตศาสตร์ ได้แก่ Placement ตามกราฟ, Mastery + Forgetting Curve, Learning Path, Adaptive Difficulty, ภารกิจวันนี้, บอส และรางวัล ความก้าวหน้าของแต่ละวิชาแยกกัน

| วิชา | ทักษะ | โลก (บอส) |
| --- | --- | --- |
| 🔢 คณิตศาสตร์ | 35 ทักษะ (Phase 1–3) | 12 โลก |
| 🔤 ภาษาอังกฤษ | ตัวอักษร A–Z, เสียงตัวอักษร, คำศัพท์จากภาพ, ความหมายคำศัพท์, การสะกดคำ, ไวยากรณ์พื้นฐาน | 🔤 เมืองตัวอักษร ABC (🦜) · 🌴 ป่าคำศัพท์ (🦁) |
| 🔬 วิทยาศาสตร์ | สิ่งมีชีวิตและไม่มีชีวิต, สัตว์รอบตัว, พืชรอบตัว, ร่างกายของเรา, สสารและสถานะ, โลกและอวกาศ, พลังงานและแรง | 🌿 ห้องแล็บธรรมชาติ (🦕) · 🧪 สถานีวิทยาศาสตร์ (🤖) |
| 📖 การอ่านภาษาไทย | พยัญชนะไทย, สระไทย, อ่านคำ, การสะกดคำ, อ่านจับใจความ (มีกล่องเนื้อเรื่องให้อ่าน) | 🐔 หมู่บ้าน ก ไก่ (🐓) · 📚 ห้องสมุดนิทาน (🐛) |
| 🧩 การคิดเชิงตรรกะ | แบบรูปและลำดับ, หาสิ่งที่ไม่เข้าพวก, ลำดับวันและเดือน, อุปมาอุปไมย, การอนุมาน, ปริศนาสัญลักษณ์ | 🏯 ปราสาทปริศนา (🦁) · 🕵️ หอคอยนักสืบ (🦹) |

- รวมทั้งหมด 5 วิชา, 59 ทักษะ, 20 โลก, 108 ด่าน + บอส 20 ตัว (ขยายต่อในหัวข้อถัดไป)
- **แถบเลือกวิชา** ใต้แถบบนสุดของหน้าแผนที่และหน้าความก้าวหน้า แสดงความก้าวหน้าของแต่ละวิชา เมื่อสลับวิชา แผนที่ ภารกิจวันนี้ เส้นทาง และการวัดระดับจะเปลี่ยนตามวิชานั้น แต่ละวิชาต้องวัดระดับแยกกัน
- **รายงานผู้ปกครอง/ครู** มีแท็บแยกวิชา ส่วนตารางทักษะที่ใช้เวลามากและคำแนะนำจะเป็นของวิชาที่เลือก ส่วนเวลาเรียนรายวันนับรวมทุกวิชา เพราะคำเตือนเรื่องเวลาหน้าจอดูจากเวลาเล่นทั้งหมด ครูมอบการบ้านได้ทุกวิชา โดยช่องเลือกทักษะจัดกลุ่มตามวิชา การบ้านจะขึ้นเป็นภารกิจแรกไม่ว่าเด็กกำลังเรียนวิชาไหนอยู่
- **รางวัลใหม่:** Achievement 5 แบบ ได้แก่ 🔤 นักสำรวจภาษาอังกฤษ · 🔬 นักวิทยาศาสตร์น้อย · 📖 หนอนหนังสือ · 🧩 นักคิดหัวไว · 🌈 เก่งรอบด้าน (มีทักษะที่เก่งแล้วครบทุกวิชา) และของสะสมจากบอสอีกวิชาละ 2 ชิ้น
- **การเพิ่มวิชาใหม่ทำได้ 2 ขั้นตอน:** (1) เพิ่ม `SubjectDef` ใน `backend/src/curriculum/subjects.ts` ซึ่งมีทักษะ prerequisite โลก ด่าน บอส ของสะสม และจุดเริ่มวัดระดับ (2) เพิ่ม generator ของทักษะใน `backend/src/questions/subjects/` แล้วรัน `npm run seed` ไม่ต้องแก้ Learning Engine และฝั่ง frontend แค่เพิ่มชื่อวิชาใน `SUBJECT_META` (และสีธีมโลกใน `globals.css` ถ้ามี)
- Migration ใหม่ `phase6_subjects` เพิ่มคอลัมน์อย่างเดียว (`Subject.emoji/sortOrder`, `Student.activeSubject` ค่าเริ่มต้น `MATH`, `Assessment.subjectCode`) ข้อมูลเดิมไม่หาย ให้รัน `npx prisma migrate deploy` แล้วตามด้วย `npm run seed`

### เจาะลึกรายวิชา + โลกบล็อก ⛏️

ขยายทุกวิชาให้ลึกถึง ป.6: ตอนนี้มี **93 ทักษะ, 36 โลก, 229 ด่าน + บอส 36 ตัว** และเครื่องแต่งกาย/ของสะสม 61 ชิ้น

| วิชา | ทักษะใหม่ | โลกใหม่ |
| --- | --- | --- |
| 🔢 คณิตศาสตร์ | รู้จักรูปทรง, การดูเวลา (หน้าปัดนาฬิกา), เงินไทยและเงินทอน (ภาพเหรียญและธนบัตร), การวัดความยาว, น้ำหนักและปริมาตร, การอ่านแผนภูมิ | 🎡 สวนสนุกรูปทรงและนาฬิกา · 🏪 ตลาดนัดนักวัด · ⛏️ เหมืองบล็อกนักขุด · 🏗️ เมืองนักสร้างบล็อก |
| 🔤 ภาษาอังกฤษ | ตัวเลข, บทสนทนาในชีวิตประจำวัน, คำบุพบท, การเรียงประโยค, Tense, อ่านเรื่องสั้น | 🏫 โรงเรียนภาษาอังกฤษ · 🗽 เมืองนิทานอังกฤษ |
| 🔬 วิทยาศาสตร์ | ลมฟ้าอากาศ, วัฏจักรชีวิต, สุขภาพ, ระบบนิเวศ, แสงและเสียง, หินและดิน, ทดลองแบบนักวิทยาศาสตร์, ไฟฟ้า (+ คลังโจทย์เดิมเพิ่มจาก 50 เป็น 85 ข้อ) | 🌦️ สวนฟ้าฝนและชีวิต · 🔭 ห้องทดลองนักค้นพบ |
| 📖 การอ่านภาษาไทย | วรรณยุกต์, ความหมายของคำ, มาตราตัวสะกด, ลักษณนาม, ประโยคและคำเชื่อม, สำนวนสุภาษิต, อ่านคิดวิเคราะห์, ชนิดของคำ | 🛶 ตลาดน้ำคำไทย · 🏛️ วังปราชญ์ |
| 🧩 ตรรกะ | ทิศทางและแผนที่, ลำดับตัวเลข, คิดแบบโปรแกรมเมอร์, นับวิธี, ตรรกะเงื่อนไข, ปริศนาตารางตรรกะ (สร้างใหม่ทุกครั้งและรับประกันว่ามีคำตอบเดียว) | 🤖 โรงงานหุ่นยนต์ · 🏅 โอลิมปิกสมองใส |

- ทักษะใหม่ระดับต้นถูกผูกเป็นพื้นฐานของทักษะที่สูงกว่า (เช่น รูปทรง → รูปเรขาคณิต, เวลา → ความยาว → น้ำหนัก/ปริมาตร → ทศนิยม) เด็กโตที่วัดระดับผ่านจึงไม่ถูกส่งกลับไปเรียนเรื่องระดับอนุบาล
- **⛏️ โลกบล็อก** (แนวเกมสร้างโลกด้วยบล็อก ไม่ใช้ชื่อหรือตัวละครของเกมใด):
  - ธีมความชอบใหม่ "โลกบล็อก": โจทย์ใช้เพชร ท่อนไม้ บล็อกหิน และตัวละครนักขุด
  - กิจกรรมใหม่ **ขุดแร่**: ตอบถูกแล้วที่ขุดเหวี่ยงลงไป บล็อกดิน/หินแตกและเผยแร่ล้ำค่า
  - โลกแบบพิกเซลครบทุกวิชา ได้แก่ ⛏️ เหมืองบล็อกนักขุด และ 🏗️ เมืองนักสร้างบล็อก (คณิต), 🧱 เหมืองบล็อกคำศัพท์ (อังกฤษ), 💎 ถ้ำผลึกนักวิทย์ (วิทย์), 🛖 หมู่บ้านบล็อกคำไทย (อ่านไทย) และ 🗺️ เขาวงกตบล็อก (ตรรกะ)
  - ของในร้าน ได้แก่ 🪓 ขวาน, 🔥 คบเพลิง, 🪖 หมวกเหล็ก, 🦺 เสื้อกั๊กนักขุด และ 🐑 แกะ ส่วน ⛏️ ที่ขุดทองคำ กับ 🧰 หีบสมบัติ ได้จากการชนะบอส
- Migration ใหม่ `block_world` เพิ่มค่า `MINING` ให้ enum กิจกรรมอย่างเดียว ให้รัน `npx prisma migrate deploy` แล้วตามด้วย `npm run seed` จากนั้นรีสตาร์ท backend (ระบบโหลดรายชื่อทักษะเข้า cache ตอนเริ่ม)
- **คลังโจทย์ที่ขยายเพิ่ม:** อ่านจับใจความ 5 → 15 ข้อ, สะกดคำไทย 9 → 20, สระ 12 → 22, อ่านคำ 12 → 22, ไวยากรณ์อังกฤษ 19 → 29 และคำศัพท์จากภาพ 62 → 84 คำ (ใช้ร่วมกันในเกมตัวอักษร เสียง คำศัพท์ และการสะกด)
#   k i d s - l e a r n i n g - g a m e 
 
 

### เป้าหมายรายวิชา · รางวัลใหม่ · แผนที่แบบเกม

- **🎯 เป้าหมายแยกตามวิชา:** เด็กตั้งเป้าหมายของแต่ละวิชาได้เอง เช่น คณิต "เตรียมสอบ" แต่อังกฤษ "ปูพื้นฐาน" ชื่อเป้าหมายเปลี่ยนตามวิชา เช่น อังกฤษ 💬 นักสื่อสาร, วิทย์ 🧪 นักทดลอง, อ่านไทย 🔎 นักอ่านคิดวิเคราะห์, ตรรกะ 🕵️ นักสืบตรรกะ แต่ละวิชากำหนดทักษะ "ประยุกต์ใช้" ของตัวเองใน `SubjectDef.applied` ที่เป้าหมายนักแก้ปัญหาจะมุ่งไป วิชาที่ยังไม่ได้ตั้งเป้าหมายจะใช้เป้าหมายเดิมของเด็ก
- **🏅 Achievement ใหม่ 13 แบบ (รวม 43):**
  - นักบอกเวลา, นักคิดเงินทอน, นักอ่านแผนภูมิ
  - นักสนทนาภาษาอังกฤษ, นักอ่านเรื่องภาษาอังกฤษ
  - ผู้พิทักษ์ธรรมชาติ, นักประดิษฐ์น้อย
  - เซียนมาตราตัวสะกด, ปรมาจารย์สำนวน
  - โปรแกรมเมอร์ตัวน้อย, นักสืบตาราง
  - ⛏️ นักขุดแร่ตัวจริง (ผ่านด่านขุดแร่ 5 ด่าน) และ 🏆 ตำนานโลกบล็อก (ปราบบอสโลกบล็อกครบทุกตัว)
- **🗺️ แผนที่:** ด่านเด้งขึ้นทีละใบ, ตัวละครของเด็กยืนบอกว่า "หนูอยู่นี่!" บนด่านที่แนะนำ, บอสที่ตื่นแล้วเรืองแสง และมีเสียงตอนกดด่านหรือภารกิจ
- **🧭 ภารกิจวัดพลัง:** ข้อความเปลี่ยนตามวิชา, มีนับถอยหลัง 3-2-1, หลอดพลังเรืองแสงแทนการนับข้อ, มีเสียงประกอบ และหน้าผลมีพลุพร้อมแถบพลังที่ค่อย ๆ เพิ่มขึ้น
- แก้บั๊ก: ภารกิจวันนี้เคยแสดงรหัสทักษะ (เช่น `SHAPES_BASIC`) แทนชื่อไทย เมื่อเด็กยังไม่เคยเล่นทักษะนั้น
- Migration ใหม่ `subject_goals` เพิ่มคอลัมน์ `Student.subjectGoals` อย่างเดียว ให้รัน `npx prisma migrate deploy` แล้วตามด้วย `npm run seed` (เพื่อเพิ่ม Achievement ใหม่)

