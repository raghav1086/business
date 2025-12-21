import {
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
  Request,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserService } from '../services/user.service';
import { StorageService } from '../services/storage.service';
import {
  UpdateUserProfileDto,
  UserProfileResponseDto,
} from '@business-app/shared/dto';
import { User } from '../entities/user.entity';

@ApiTags('User')
@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly storageService: StorageService
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Request() req: any): Promise<UserProfileResponseDto> {
    const user = await this.userService.getProfile(req.user.id);
    return this.toResponseDto(user);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @Request() req: any,
    @Body() updateDto: UpdateUserProfileDto
  ): Promise<UserProfileResponseDto> {
    const user = await this.userService.updateProfile(req.user.id, updateDto);
    return this.toResponseDto(user);
  }

  @Post('profile/avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Avatar uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        avatar_url: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadAvatar(
    @Request() req: any,
    @UploadedFile() file: any
  ): Promise<{ avatar_url: string }> {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const avatarUrl = await this.storageService.uploadAvatar(
      req.user.id,
      file
    );
    await this.userService.updateAvatar(req.user.id, avatarUrl);

    return { avatar_url: avatarUrl };
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(user: User): UserProfileResponseDto {
    return {
      id: user.id,
      phone: user.phone,
      phone_verified: user.phone_verified,
      name: user.name,
      email: user.email,
      email_verified: user.email_verified,
      avatar_url: user.avatar_url,
      user_type: user.user_type,
      language_preference: user.language_preference,
      status: user.status,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
}

