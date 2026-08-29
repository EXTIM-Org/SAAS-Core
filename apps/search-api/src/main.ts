import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', // Allow all origins for the public search widget
  });
  await app.listen(process.env.PORT ?? 4001);
}
bootstrap();
