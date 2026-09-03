import {
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ChangePasswordDto } from '../auth/dto/change-password.dto';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';

@ApiTags('Profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'الحصول على الملف الشخصي' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.profileService.getProfile(userId);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تحديث الملف الشخصي' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(userId, dto);
  }

  @Put('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تغيير كلمة المرور' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.profileService.changePassword(
      userId,
      dto.current_password,
      dto.new_password,
    );
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: parseInt(
          process.env.MAX_IMAGE_SIZE || '20971520',
          10,
        ),
      },
    }),
  )
  @ApiOperation({ summary: 'رفع صورة شخصية' })
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
  ) {
    return this.profileService.uploadAvatar(userId, file);
  }
}
