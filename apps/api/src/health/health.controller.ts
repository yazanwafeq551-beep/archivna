import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

/**
 * What a host polls to decide whether this instance is serving. It touches the
 * database on purpose: a process that is up but cannot reach Postgres cannot
 * serve a single page, and reporting it healthy would hide the real fault.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', uptime: Math.round(process.uptime()) };
  }
}
