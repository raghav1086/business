import {
  IsString,
  IsOptional,
  IsObject,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Auth DTOs
 */

export class SendOtpDto {
  @ApiProperty({
    description: 'Indian mobile number (10 digits)',
    example: '9876543210',
    pattern: '^[6-9][0-9]{9}$',
    minLength: 10,
    maxLength: 10,
  })
  @IsString()
  @Length(10, 10)
  @Matches(/^[6-9][0-9]{9}$/, {
    message: 'Invalid phone number format',
  })
  phone: string;

  @ApiProperty({
    description: 'Purpose of OTP request',
    example: 'login',
    enum: ['login', 'registration', 'verification'],
    minLength: 4,
    maxLength: 20,
  })
  @IsString()
  @Length(4, 20)
  purpose: string; // login, registration
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Indian mobile number (10 digits)',
    example: '9876543210',
    pattern: '^[6-9][0-9]{9}$',
  })
  @IsString()
  @Length(10, 10)
  @Matches(/^[6-9][0-9]{9}$/, {
    message: 'Invalid phone number format',
  })
  phone: string;

  @ApiProperty({
    description: '6-digit OTP code',
    example: '123456',
    pattern: '^\\d{6}$',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, {
    message: 'OTP must be 6 digits',
  })
  otp: string;

  @ApiProperty({
    description: 'OTP request ID from send-otp response',
    example: 'otp_abc123xyz',
  })
  @IsString()
  otp_id: string;

  @ApiProperty({
    description: 'Optional device information for tracking',
    required: false,
    example: { device: 'mobile', os: 'iOS' },
  })
  @IsOptional()
  @IsObject()
  device_info?: Record<string, any>;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token from login response',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refresh_token: string;
}

export class SendOtpResponseDto {
  @ApiProperty({
    description: 'OTP request ID for verification',
    example: 'otp_abc123xyz',
  })
  otp_id: string;

  @ApiProperty({
    description: 'OTP expiry time in seconds',
    example: 300,
  })
  expires_in: number; // seconds

  @ApiProperty({
    description: 'Success message',
    example: 'OTP sent successfully',
  })
  message: string;
}

export class VerifyOtpResponseDto {
  @ApiProperty({
    description: 'User information',
    example: {
      id: 'user_123',
      phone: '9876543210',
      name: 'John Doe',
      email: 'john@example.com',
      phone_verified: true,
    },
  })
  user: {
    id: string;
    phone: string;
    name?: string;
    email?: string;
    phone_verified: boolean;
    is_superadmin?: boolean;
  };

  @ApiProperty({
    description: 'Authentication tokens',
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  tokens: {
    access_token: string;
    refresh_token: string;
  };

  @ApiProperty({
    description: 'Whether this is a new user registration',
    example: false,
  })
  is_new_user: boolean;
}

export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'New access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'New refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token: string;
}

