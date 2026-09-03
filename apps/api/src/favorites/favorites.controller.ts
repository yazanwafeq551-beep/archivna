import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'الحصول على المفضلة' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.favoritesService.findAll(userId);
  }

  @Post(':archiveId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'إضافة إلى المفضلة' })
  async add(
    @CurrentUser('id') userId: string,
    @Param('archiveId') archiveId: string,
  ) {
    return this.favoritesService.add(userId, archiveId);
  }

  @Delete(':archiveId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إزالة من المفضلة' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('archiveId') archiveId: string,
  ) {
    return this.favoritesService.remove(userId, archiveId);
  }
}
