import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Mock Auth Guard
 * 
 * This is a temporary guard for development/testing.
 * Will be replaced with JWT guard when Auth Service is ready.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // For now, allow requests with mock user
    // In production, this will validate JWT token
    if (!request.user) {
      // Mock user for development - use a valid UUID
      request.user = {
        id: '00000000-0000-0000-0000-000000000001', // Valid UUID format
      };
    }
    
    return true;
  }
}

