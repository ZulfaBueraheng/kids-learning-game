import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export type AdultRole = 'PARENT' | 'TEACHER';

/** Child tokens carry studentId; parent/teacher tokens carry role. */
export interface AuthPayload {
  sub: string;
  studentId?: string;
  role?: AdultRole;
}

type AuthedRequest = Request & { auth?: AuthPayload };

const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** The signed-in student's id. Every query is scoped by it, so no cross-account access is possible. */
export const StudentId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const studentId = ctx.switchToHttp().getRequest<AuthedRequest>().auth?.studentId;
  if (!studentId) throw new ForbiddenException('สำหรับนักเรียนเท่านั้น');
  return studentId;
});

export interface AdultAuth {
  userId: string;
  role: AdultRole;
}

/** The signed-in parent or teacher. Pass a role to restrict the route to it. */
export const Adult = createParamDecorator((role: AdultRole | undefined, ctx: ExecutionContext): AdultAuth => {
  const auth = ctx.switchToHttp().getRequest<AuthedRequest>().auth;
  if (!auth?.role || (role && auth.role !== role)) throw new ForbiddenException('สำหรับผู้ปกครองหรือคุณครูเท่านั้น');
  return { userId: auth.sub, role: auth.role };
});

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException();
    try {
      req.auth = await this.jwt.verifyAsync<AuthPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}
