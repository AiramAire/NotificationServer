import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  // TODO: app.enableCors();
  await app.listen(3100); // TODO: which port do we want?
}
bootstrap();
