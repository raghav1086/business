import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@business-app/shared/validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global exception filter to ensure proper HTTP status codes
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // CORS - Configure to handle preflight requests properly
  app.enableCors({
    origin: true, // Allow all origins (in production, specify your domain)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-business-id',
      'X-Requested-With',
      'Accept',
    ],
    exposedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription('Authentication Service API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`Auth Service running on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();

