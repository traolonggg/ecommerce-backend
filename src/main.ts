/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { parseEnvOrigin } from './helpers/parse-env-origins';
import { ValidationPipe } from '@nestjs/common';
const getCorsAllowList = () => {
  return parseEnvOrigin(process.env.CLIENT_URL, process.env.CORS_OTHER_URL);
};
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  //cors
  const allowList = getCorsAllowList();
  app.enableCors({
    origin: (requestOrigin: string, callback) => {
      if (!requestOrigin) {
        callback(null, true);
        return;
      }
      if (allowList.includes(requestOrigin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTION'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
    credentials: true,
  });
  //VALIDATION PIPE
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  //API VERSIONING
  await app.listen(process.env.PORT ?? 8080);
}
void bootstrap();
