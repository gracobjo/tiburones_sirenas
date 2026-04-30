import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email.trim().toLowerCase(),
          name: dto.name.trim(),
          role: dto.role,
        },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });
    } catch (e: any) {
      // Prisma unique constraint (email)
      if (e?.code === 'P2002') throw new BadRequestException('Email ya existe');
      throw e;
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          email: dto.email ? dto.email.trim().toLowerCase() : undefined,
          name: dto.name ? dto.name.trim() : undefined,
          role: dto.role,
        },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new BadRequestException('Email ya existe');
      throw e;
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }
}

