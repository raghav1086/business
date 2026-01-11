import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  check() {
    return {
      status: 'ok',
      service: 'gst-service',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db')
  @ApiOperation({ summary: 'Database health check' })
  async checkDatabase() {
    try {
      const start = Date.now();
      await this.dataSource.query('SELECT 1');
      const latency = Date.now() - start;

      return {
        status: 'ok',
        database: 'connected',
        latency: `${latency}ms`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

