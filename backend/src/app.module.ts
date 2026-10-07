import { Module } from '@nestjs/common';
import { AssessmentsModule } from './assessments/assessments.module.js';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CharacterModule } from './character/character.module.js';
import { GamesModule } from './games/games.module.js';
import { LearningPathModule } from './learning-path/learning-path.module.js';
import { MasteryModule } from './mastery/mastery.service.js';
import { PrismaModule } from './prisma/prisma.service.js';
import { ParentModule } from './parent/parent.module.js';
import { ProgressModule } from './progress/progress.module.js';
import { QuestionsModule } from './questions/questions.module.js';
import { RewardsModule } from './rewards/rewards.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { SkillsModule } from './skills/skills.module.js';
import { TeacherModule } from './teacher/teacher.module.js';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    AuthModule,
    SkillsModule,
    QuestionsModule,
    MasteryModule,
    RewardsModule,
    CharacterModule,
    LearningPathModule,
    AssessmentsModule,
    GamesModule,
    ProgressModule,
    ReportsModule,
    ParentModule,
    TeacherModule,
  ],
})
export class AppModule {}
