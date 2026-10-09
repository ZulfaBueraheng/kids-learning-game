import { goalFor } from '../learning-path/learning-path.engine.js';
import { SUBJECTS } from '../curriculum/subjects.js';
import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Injectable,
  Module,
  Post,
  Put,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuditService } from '../audit/audit.module.js';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { createHash, randomInt } from 'node:crypto';
import type { Student } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { fromPicks, interestProfile, sanitizeInterests } from '../personalization/interest.engine.js';
import { AdultLoginDto, AdultRegisterDto, AVATARS, GoalDto, InterestsDto, LoginDto, RegisterDto, SubjectDto } from './auth.dto.js';
import { Adult, AuthGuard, Public, StudentId, type AdultAuth } from './auth.guard.js';
import { hashPassword, LoginThrottle, verifyPassword } from './password.js';

// No look-alike characters (0/O, 1/I/L) so children can read the code back.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateLoginCode(): string {
  const chars = Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]);
  return `${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`;
}

export function hashCode(code: string): string {
  const normalized = code.toUpperCase().replace('-', '');
  return createHash('sha256').update(normalized).digest('hex');
}

/** `goal` is the goal for `subject` (default: the subject the child is playing now). */
export function publicStudent(s: Student, subject: string = s.activeSubject) {
  return {
    id: s.id,
    nickname: s.nickname,
    avatar: s.avatar,
    grade: s.grade,
    xp: s.xp,
    coins: s.coins,
    goal: goalFor(s, subject),
    goals: Object.fromEntries(SUBJECTS.map((x) => [x.code, goalFor(s, x.code)])),
    activeSubject: s.activeSubject,
    interests: interestProfile(sanitizeInterests(s.interests)),
  };
}

const tooMany = () => new HttpException('ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่', HttpStatus.TOO_MANY_REQUESTS);

@Injectable()
export class AuthService {
  private readonly throttle = new LoginThrottle();
  // A whole class can share one school IP, so child codes get more room before a pause.
  private readonly codeThrottle = new LoginThrottle(20, 10 * 60 * 1000);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const loginCode = generateLoginCode();
    const user = await this.prisma.user.create({
      data: {
        role: 'STUDENT',
        loginCodeHash: hashCode(loginCode),
        student: {
          create: {
            nickname: dto.nickname.trim(),
            avatar: dto.avatar,
            grade: dto.grade,
            interests: fromPicks(dto.interests ?? []),
          },
        },
      },
      include: { student: true },
    });
    return { loginCode, ...(await this.session(user.id, user.student!)) };
  }

  /** Child login by code; throttled per client so codes can't be guessed. */
  async login(dto: LoginDto, clientKey: string) {
    const key = `code:${clientKey}`;
    if (this.codeThrottle.isLocked(key)) throw tooMany();
    const user = await this.prisma.user.findUnique({
      where: { loginCodeHash: hashCode(dto.loginCode) },
      include: { student: true },
    });
    if (!user?.student) {
      this.codeThrottle.fail(key);
      throw new UnauthorizedException('ไม่พบรหัสนี้');
    }
    this.codeThrottle.succeed(key);
    return this.session(user.id, user.student);
  }

  async registerAdult(dto: AdultRegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException('อีเมลนี้มีบัญชีแล้ว');
    const user = await this.prisma.user.create({
      data: { role: dto.role, email, passwordHash: hashPassword(dto.password), displayName: dto.displayName.trim() },
    });
    await this.audit.log(user.id, 'ADULT_REGISTER', null, { role: dto.role });
    return this.adultSession(user);
  }

  async loginAdult(dto: AdultLoginDto) {
    const email = dto.email.trim().toLowerCase();
    const key = `adult:${email}`;
    if (this.throttle.isLocked(key)) throw tooMany();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || (user.role !== 'PARENT' && user.role !== 'TEACHER') || !verifyPassword(dto.password, user.passwordHash)) {
      this.throttle.fail(key);
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    this.throttle.succeed(key);
    return this.adultSession(user);
  }

  async adultProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return { id: user.id, email: user.email, displayName: user.displayName, role: user.role };
  }

  private async adultSession(user: { id: string; role: string; email: string | null; displayName: string | null }) {
    const token = await this.jwt.signAsync({ sub: user.id, role: user.role }, { expiresIn: '7d' });
    return { token, user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role } };
  }

  private async session(userId: string, student: Student) {
    const token = await this.jwt.signAsync({ sub: userId, studentId: student.id });
    return { token, student: publicStudent(student) };
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Get('avatars')
  avatars() {
    return AVATARS;
  }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, req.ip ?? 'unknown');
  }

  @Public()
  @Post('adult/register')
  registerAdult(@Body() dto: AdultRegisterDto) {
    return this.auth.registerAdult(dto);
  }

  @Public()
  @Post('adult/login')
  loginAdult(@Body() dto: AdultLoginDto) {
    return this.auth.loginAdult(dto);
  }

  @Get('adult/me')
  adultMe(@Adult() adult: AdultAuth) {
    return this.auth.adultProfile(adult.userId);
  }
}

@Controller('students')
export class StudentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async me(@StudentId() studentId: string) {
    return publicStudent(await this.prisma.student.findUniqueOrThrow({ where: { id: studentId } }));
  }

  /** Replace the explicit interest picks (learned scores of re-picked themes are kept). */
  @Put('me/interests')
  async interests(@StudentId() studentId: string, @Body() dto: InterestsDto) {
    const student = await this.prisma.student.findUniqueOrThrow({ where: { id: studentId } });
    const interests = fromPicks(dto.themes, sanitizeInterests(student.interests));
    return publicStudent(await this.prisma.student.update({ where: { id: studentId }, data: { interests } }));
  }

  /** Set the goal for one subject (default: the subject the child is playing now). */
  @Put('me/goal')
  async goal(@StudentId() studentId: string, @Body() dto: GoalDto) {
    const student = await this.prisma.student.findUniqueOrThrow({ where: { id: studentId } });
    const subject = dto.subject ?? student.activeSubject;
    const subjectGoals = { ...((student.subjectGoals as Record<string, string> | null) ?? {}), [subject]: dto.goal };
    return publicStudent(await this.prisma.student.update({ where: { id: studentId }, data: { subjectGoals } }), subject);
  }

  /** Switch subject: the map, path, placement and dashboard follow it. */
  @Put('me/subject')
  async subject(@StudentId() studentId: string, @Body() dto: SubjectDto) {
    return publicStudent(await this.prisma.student.update({ where: { id: studentId }, data: { activeSubject: dto.subject } }));
  }
}

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET is not set');
        return { secret, signOptions: { expiresIn: '30d' } };
      },
    }),
  ],
  controllers: [AuthController, StudentsController],
  providers: [AuthService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AuthModule {}
