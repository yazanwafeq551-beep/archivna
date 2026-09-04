import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LmsService } from './lms.service';
import { QueryCourseDto } from './dto/query-course.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard, Public, OptionalAuth } from '../auth/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { LessonInputDto, UpdateLessonDto } from './dto/lesson.dto';
import { ReorderLessonsDto } from './dto/reorder-lessons.dto';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';
import { AuthorizationService } from '../common/authorization/authorization.service';

@ApiTags('LMS')
@Controller('lms')
export class LmsController {
  constructor(private lmsService: LmsService, private authorization: AuthorizationService) {}

  private async requireAdmin(userId?: string) {
    this.authorization.assert(await this.authorization.isSystemAdmin(userId), 'Admin access required');
  }

  // === Categories ===
  @Get('categories')
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all course categories' })
  async findAllCategories() {
    return this.lmsService.findAllCategories();
  }

  // === Courses ===
  @Get('admin/courses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAdminCourses(@CurrentUser('id') userId: string) {
    await this.requireAdmin(userId);
    return this.lmsService.findAdminCourses();
  }

  @Get('admin/courses/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تفاصيل دورة للتحرير' })
  async findAdminCourse(
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.requireAdmin(userId);
    return this.lmsService.findAdminCourse(courseId);
  }

  @Post('admin/courses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إنشاء دورة بدروسها' })
  async createAdminCourse(@Body() dto: CreateCourseDto, @CurrentUser('id') userId: string) {
    await this.requireAdmin(userId);
    return this.lmsService.createAdminCourse(dto);
  }

  @Patch('admin/courses/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تعديل بيانات الدورة أو حالتها' })
  async updateAdminCourse(
    @Param('courseId') courseId: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser('id') userId: string,
  ) {
    await this.requireAdmin(userId);
    return this.lmsService.updateAdminCourse(courseId, dto);
  }

  @Delete('admin/courses/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAdminCourse(@Param('courseId') courseId: string, @CurrentUser('id') userId: string) {
    await this.requireAdmin(userId);
    await this.lmsService.deleteAdminCourse(courseId);
  }

  @Post('admin/courses/:courseId/lessons')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إضافة درس إلى دورة' })
  async addLesson(
    @Param('courseId') courseId: string,
    @Body() dto: LessonInputDto,
    @CurrentUser('id') userId: string,
  ) {
    await this.requireAdmin(userId);
    return this.lmsService.addLesson(courseId, dto);
  }

  @Patch('admin/courses/:courseId/lessons/:lessonId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تعديل درس' })
  async updateLesson(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonDto,
    @CurrentUser('id') userId: string,
  ) {
    await this.requireAdmin(userId);
    return this.lmsService.updateLesson(courseId, lessonId, dto);
  }

  @Delete('admin/courses/:courseId/lessons/:lessonId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف درس' })
  async deleteLesson(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.requireAdmin(userId);
    return this.lmsService.deleteLesson(courseId, lessonId);
  }

  @Patch('admin/courses/:courseId/lessons-order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إعادة ترتيب دروس الدورة' })
  async reorderLessons(
    @Param('courseId') courseId: string,
    @Body() dto: ReorderLessonsDto,
    @CurrentUser('id') userId: string,
  ) {
    await this.requireAdmin(userId);
    return this.lmsService.reorderLessons(courseId, dto.lesson_ids);
  }

  @Post('admin/media')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: parseInt(process.env.MAX_VIDEO_SIZE || '1073741824', 10) },
    }),
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'رفع فيديو أو صورة أو مرفق لدورة' })
  async uploadMedia(
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    await this.requireAdmin(userId);
    return this.lmsService.uploadMedia(file, userId);
  }

  @Get('courses')
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all published courses' })
  async findAllCourses(@Query() query: QueryCourseDto) {
    return this.lmsService.findAllCourses(query);
  }

  @Get('courses/stats')
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get LMS stats' })
  async getLmsStats() {
    return this.lmsService.getLmsStats();
  }

  @Get('courses/:slug')
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get course by slug' })
  async findCourseBySlug(@Param('slug') slug: string, @CurrentUser('id') userId?: string) {
    return this.lmsService.findCourseBySlug(slug, userId);
  }

  // === Enrollment ===
  @Post('courses/:courseId/enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enroll in a course' })
  async enroll(@Param('courseId') courseId: string, @CurrentUser('id') userId: string) {
    return this.lmsService.enroll(userId, courseId);
  }

  // === Lessons ===
  @Get('courses/:courseId/lessons/:lessonId')
  @OptionalAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get lesson details' })
  async getLesson(
    @Param('lessonId') lessonId: string,
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.lmsService.getLesson(lessonId, courseId, userId);
  }

  @Patch('courses/:courseId/lessons/:lessonId/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lesson progress' })
  async updateProgress(
    @Param('lessonId') lessonId: string,
    @Param('courseId') courseId: string,
    @Body() dto: UpdateProgressDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.lmsService.updateProgress(userId, lessonId, courseId, dto);
  }

  @Get('courses/:courseId/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lesson progress for a course' })
  async getLessonProgress(@Param('courseId') courseId: string, @CurrentUser('id') userId: string) {
    return this.lmsService.getLessonProgress(userId, courseId);
  }

  // === Dashboard ===
  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user LMS dashboard' })
  async getUserDashboard(@CurrentUser('id') userId: string) {
    return this.lmsService.getUserDashboard(userId);
  }

  @Get('enrollments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user enrollments' })
  async getUserEnrollments(@CurrentUser('id') userId: string) {
    return this.lmsService.getUserEnrollments(userId);
  }

  // === Saved Courses ===
  @Post('courses/:courseId/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save a course' })
  async saveCourse(@Param('courseId') courseId: string, @CurrentUser('id') userId: string) {
    return this.lmsService.saveCourse(userId, courseId);
  }

  @Delete('courses/:courseId/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsave a course' })
  async unsaveCourse(@Param('courseId') courseId: string, @CurrentUser('id') userId: string) {
    return this.lmsService.unsaveCourse(userId, courseId);
  }

  @Get('saved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get saved courses' })
  async getSavedCourses(@CurrentUser('id') userId: string) {
    return this.lmsService.getSavedCourses(userId);
  }

  // === Reviews ===
  @Post('courses/:courseId/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update a review' })
  async createReview(
    @Param('courseId') courseId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.lmsService.createReview(userId, courseId, dto);
  }

  // === Achievements ===
  @Get('achievements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user achievements' })
  async getUserAchievements(@CurrentUser('id') userId: string) {
    return this.lmsService.getUserAchievements(userId);
  }
  @Post('courses/:courseId/lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تعليم درس كمكتمل (للدروس بدون فيديو)' })
  async completeLesson(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.lmsService.completeLesson(userId, courseId, lessonId);
  }

  // === Certificates ===
  @Get('certificates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'شهاداتي' })
  async myCertificates(@CurrentUser('id') userId: string) {
    return this.lmsService.getMyCertificates(userId);
  }

  @Get('certificates/:serial')
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'التحقق من شهادة برقمها التسلسلي' })
  async verifyCertificate(@Param('serial') serial: string) {
    return this.lmsService.getCertificateBySerial(serial);
  }

  @Get('courses/:courseId/certificate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'شهادة الدورة الخاصة بي' })
  async courseCertificate(
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.lmsService.getCourseCertificate(userId, courseId);
  }
}
