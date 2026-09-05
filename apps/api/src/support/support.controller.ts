import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { RespondSupportRequestDto } from './dto/respond-support-request.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Support and feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('support')
export class SupportController {
  constructor(private supportService: SupportService) {}

  @Post('requests')
  @ApiOperation({ summary: 'إرسال طلب استشارة أو ملاحظة أو شكوى' })
  async create(
    @Body() dto: CreateSupportRequestDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.supportService.create(userId, dto);
  }

  @Get('requests/mine')
  @ApiOperation({ summary: 'طلباتي' })
  async mine(@CurrentUser('id') userId: string, @Query('kind') kind?: string) {
    return this.supportService.mine(userId, kind);
  }

  @Get('requests')
  @ApiOperation({ summary: 'صندوق الطلبات لفريق المنصة' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('kind') kind?: string,
    @Query('status') status?: string,
  ) {
    return this.supportService.findAll(userId, { kind, status });
  }

  @Get('requests/counts')
  @ApiOperation({ summary: 'أعداد الطلبات حسب النوع والحالة' })
  async counts(@CurrentUser('id') userId: string) {
    return this.supportService.counts(userId);
  }

  @Patch('requests/:id')
  @ApiOperation({ summary: 'الرد على طلب أو تغيير حالته' })
  async respond(
    @Param('id') id: string,
    @Body() dto: RespondSupportRequestDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.supportService.respond(id, userId, dto);
  }
}
