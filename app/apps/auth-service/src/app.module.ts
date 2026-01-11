import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { SessionController } from './controllers/session.controller';
import { HealthController } from './controllers/health.controller';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { SessionService } from './services/session.service';
import { OtpService } from './services/otp.service';
import { JwtTokenService } from './services/jwt.service';
import { SmsService } from './services/sms.service';
import { StorageService } from './services/storage.service';
import { UserRepository } from './repositories/user.repository';
import { OtpRequestRepository } from './repositories/otp-request.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { UserSessionRepository } from './repositories/user-session.repository';
import { User } from './entities/user.entity';
import { OtpRequest } from './entities/otp-request.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserSession } from './entities/user-session.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule.register({
      timeout: 10000,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('AUTH_DB_NAME', 'auth_db'),
        entities: [User, OtpRequest, RefreshToken, UserSession],
        synchronize: configService.get('NODE_ENV') !== 'production' || 
                     configService.get('ENABLE_SYNC') === 'true',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, OtpRequest, RefreshToken, UserSession]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'default-secret'),
        signOptions: {
          expiresIn: '5d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, UserController, SessionController, HealthController],
  providers: [
    AuthService,
    UserService,
    SessionService,
    OtpService,
    JwtTokenService,
    SmsService,
    StorageService,
    UserRepository,
    OtpRequestRepository,
    RefreshTokenRepository,
    UserSessionRepository,
  ],
  exports: [JwtTokenService, UserRepository],
})
export class AppModule {}

