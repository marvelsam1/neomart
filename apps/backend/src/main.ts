import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.CORS_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? ['http://localhost:3000', 'http://localhost:3001'];
  app.enableCors({ origin: allowedOrigins });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const PORT = process.env.PORT || 5000;
  await app.listen(PORT);
  console.log(`🚀 ShopWorld Backend is running on port ${PORT}`);
}

bootstrap();
