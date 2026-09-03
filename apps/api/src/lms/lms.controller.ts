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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LmsService } from './lms.service';
import { QueryCourseDto } from './dto/query-course.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard, Public, OptionalAuth } from '../auth/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('LMS')
@Controller('lms')
export class LmsController {
  constructor(private lmsService: LmsService) {}

  // === Categories ===
  @Get('categories')
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all course categories' })
  async findAllCategories() {
    return this.lmsService.findAllCategories();
  }

  // === Courses ===
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
}
