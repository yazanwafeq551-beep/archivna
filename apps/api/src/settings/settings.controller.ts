import { Controller, Get, Put, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'الحصول على الإعدادات' })
  async getSettings(@CurrentUser('id') userId: string) {
    return this.settingsService.getSettings(userId);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تحديث الإعدادات' })
  async updateSettings(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(userId, dto);
  }
}
