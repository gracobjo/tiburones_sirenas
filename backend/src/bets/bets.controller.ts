import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Param,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';
import { CreateBetDto } from './dto/create-bet.dto';
import { UpdateBetDto } from './dto/update-bet.dto';
import { BetsService } from './bets.service';

function betsUploadStorage() {
  const dest = join(process.cwd(), 'uploads', 'bets');
  mkdirSync(dest, { recursive: true });
  return diskStorage({
    destination: dest,
    filename: (_req, file, cb) => {
      const safeExt = extname(file.originalname || '').slice(0, 10);
      const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
      cb(null, name);
    },
  });
}

@Controller('bets')
@UseGuards(JwtAuthGuard)
export class BetsController {
  constructor(private bets: BetsService) {}

  @Get()
  async list() {
    return this.bets.list();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.admin)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: betsUploadStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async create(@Body() dto: CreateBetDto, @UploadedFile() file?: Express.Multer.File) {
    const storedFileUrl = file ? `/uploads/bets/${file.filename}` : null;
    return this.bets.create({ ...dto, storedFileUrl });
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.admin)
  async update(@Param('id') id: string, @Body() dto: UpdateBetDto) {
    return this.bets.update(id, dto);
  }
}

