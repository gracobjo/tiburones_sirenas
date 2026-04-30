import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  private isWhitelisted(email: string) {
    const raw = this.config.get<string>('AUTH_EMAIL_WHITELIST')?.trim();
    if (!raw) return true;
    const list = raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    return list.includes(email.toLowerCase());
  }

  async login(email: string) {
    if (!this.isWhitelisted(email)) {
      throw new ForbiddenException('Email no autorizado');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new ForbiddenException('Email no registrado en la peña');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);

    return {
      accessToken,
      user: this.toSafeUser(user),
    };
  }

  private toSafeUser(user: User) {
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }
}

