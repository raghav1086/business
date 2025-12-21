import {
  IsString,
  IsOptional,
  IsObject,
  Length,
  Matches,
} from 'class-validator';

/**
 * Auth DTOs
 */

export class SendOtpDto {
  @IsString()
  @Length(10, 10)
  @Matches(/^[6-9][0-9]{9}$/, {
    message: 'Invalid phone number format',
  })
  phone: string;

  @IsString()
  @Length(4, 20)
  purpose: string; // login, registration
}

export class VerifyOtpDto {
  @IsString()
  @Length(10, 10)
  @Matches(/^[6-9][0-9]{9}$/, {
    message: 'Invalid phone number format',
  })
  phone: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, {
    message: 'OTP must be 6 digits',
  })
  otp: string;

  @IsString()
  otp_id: string;

  @IsOptional()
  @IsObject()
  device_info?: Record<string, any>;
}

export class RefreshTokenDto {
  @IsString()
  refresh_token: string;
}

export class SendOtpResponseDto {
  otp_id: string;
  expires_in: number; // seconds
  message: string;
}

export class VerifyOtpResponseDto {
  user: {
    id: string;
    phone: string;
    name?: string;
    email?: string;
    phone_verified: boolean;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
  };
  is_new_user: boolean;
}

export class RefreshTokenResponseDto {
  access_token: string;
  refresh_token: string;
}

