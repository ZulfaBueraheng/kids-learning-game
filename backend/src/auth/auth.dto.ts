import { ArrayMaxSize, IsArray, IsEmail, IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { INTEREST_THEMES } from '../questions/themes.js';
import { GOALS, type Goal } from '../learning-path/learning-path.engine.js';
import { SUBJECTS } from '../curriculum/subjects.js';
import { Grade } from '../generated/prisma/enums.js';

export const AVATARS = ['🦁', '🐯', '🐼', '🐰', '🦊', '🐸', '🐵', '🦄', '🐲', '🐧', '🐨', '🐙'];

export class RegisterDto {
  @IsString()
  @Length(1, 20)
  nickname: string;

  @IsIn(AVATARS)
  avatar: string;

  @IsIn(Object.values(Grade))
  grade: Grade;

  /** "What do you like?" picks from onboarding */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(INTEREST_THEMES.length)
  @IsIn(INTEREST_THEMES, { each: true })
  interests?: string[];
}

export class InterestsDto {
  @IsArray()
  @ArrayMaxSize(INTEREST_THEMES.length)
  @IsIn(INTEREST_THEMES, { each: true })
  themes: string[];
}

export class GoalDto {
  @IsIn(GOALS)
  goal: Goal;
}

export class SubjectDto {
  @IsIn(SUBJECTS.map((s) => s.code))
  subject: string;
}

export class AdultRegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 100)
  password: string;

  @IsString()
  @Length(1, 40)
  displayName: string;

  @IsIn(['PARENT', 'TEACHER'])
  role: 'PARENT' | 'TEACHER';
}

export class AdultLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(1, 100)
  password: string;
}

export class LoginDto {
  @Matches(/^[A-Z0-9]{4}-?[A-Z0-9]{4}$/i)
  loginCode: string;
}
