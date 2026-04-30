import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';
import { SettingsService } from './settings.service';
import { UpdateResultsUrlDto } from './dto/update-results-url.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @Get('resultsUrl')
  async getResultsUrl() {
    const url = await this.settings.getResultsUrl();
    return { url };
  }

  @Put('resultsUrl')
  @UseGuards(RolesGuard)
  @Roles(Role.admin)
  async setResultsUrl(@Body() dto: UpdateResultsUrlDto) {
    return this.settings.setResultsUrl(dto.url);
  }
}

