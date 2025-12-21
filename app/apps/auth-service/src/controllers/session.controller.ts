import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SessionService } from '../services/session.service';
import { UserSessionResponseDto } from '@business-app/shared/dto';
import { UserSession } from '../entities/user-session.entity';

@ApiTags('Sessions')
@Controller('api/v1/auth/sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active sessions for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of active sessions',
    type: [UserSessionResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSessions(@Request() req: any): Promise<UserSessionResponseDto[]> {
    const sessions = await this.sessionService.getUserSessions(req.user.id);
    return sessions.map((s) => this.toResponseDto(s));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout from specific session' })
  @ApiResponse({ status: 204, description: 'Session logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async logoutSession(
    @Request() req: any,
    @Param('id') sessionId: string
  ): Promise<void> {
    await this.sessionService.logoutSession(sessionId, req.user.id);
  }

  @Delete('all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout from all sessions' })
  @ApiResponse({ status: 204, description: 'All sessions logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logoutAllSessions(@Request() req: any): Promise<void> {
    await this.sessionService.logoutAllSessions(req.user.id);
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(session: UserSession): UserSessionResponseDto {
    return {
      id: session.id,
      device_id: session.device_id,
      device_name: session.device_name,
      device_os: session.device_os,
      app_version: session.app_version,
      ip_address: session.ip_address,
      is_active: session.is_active,
      last_active_at: session.last_active_at,
      created_at: session.created_at,
    };
  }
}

