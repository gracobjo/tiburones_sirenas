import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
  }
}

