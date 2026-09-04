import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateAccessRequestDto } from './dto/create-access-request.dto';
import { DecideAccessRequestDto } from './dto/decide-access-request.dto';
import { WorkflowActionDto } from './dto/workflow-action.dto';
import { GovernanceService } from './governance.service';

@ApiTags('Governance and access')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class GovernanceController {
  constructor(private readonly governance: GovernanceService) {}

  @Get('governance/users')
  users(@CurrentUser('id') userId: string, @Query('institution_id') institutionId?: string) {
    return this.governance.usersWithRoles(userId, institutionId);
  }

  @Post('governance/roles')
  assignRole(@Body() dto: AssignRoleDto, @CurrentUser('id') userId: string) {
    return this.governance.assignRole(dto, userId);
  }

  @Patch('governance/roles/:id/revoke')
  revokeRole(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.governance.revokeRole(id, userId);
  }

  @Post('archives/:id/access-requests')
  requestAccess(@Param('id') id: string, @Body() dto: CreateAccessRequestDto, @CurrentUser('id') userId: string) {
    return this.governance.requestAccess(id, dto, userId);
  }

  @Get('access-requests/mine')
  mine(@CurrentUser('id') userId: string) {
    return this.governance.myAccessRequests(userId);
  }

  @Get('access-requests/review')
  review(@CurrentUser('id') userId: string, @Query('status') status?: string) {
    return this.governance.reviewQueue(userId, status);
  }

  @Post('access-requests/:id/decision')
  decide(@Param('id') id: string, @Body() dto: DecideAccessRequestDto, @CurrentUser('id') userId: string) {
    return this.governance.decideAccess(id, dto, userId);
  }

  @Get('workflow/queue')
  workflowQueue(@CurrentUser('id') userId: string, @Query('status') status?: string) {
    return this.governance.workflowQueue(userId, status);
  }

  @Post('archives/:id/workflow')
  transition(@Param('id') id: string, @Body() dto: WorkflowActionDto, @CurrentUser('id') userId: string) {
    return this.governance.transition(id, dto, userId);
  }
}
