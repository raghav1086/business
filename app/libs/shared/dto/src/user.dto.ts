import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  Length,
} from 'class-validator';

/**
 * User DTOs
 */

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(2, 10)
  language_preference?: string; // en, hi
}

export class UserProfileResponseDto {
  id: string;
  phone: string;
  phone_verified: boolean;
  name?: string;
  email?: string;
  email_verified: boolean;
  avatar_url?: string;
  user_type: string;
  language_preference: string;
  status: string;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export class UserSessionResponseDto {
  id: string;
  device_id: string;
  device_name?: string;
  device_os?: string;
  app_version?: string;
  ip_address?: string;
  is_active: boolean;
  last_active_at: Date;
  created_at: Date;
}

