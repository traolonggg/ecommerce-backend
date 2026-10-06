/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { parseEnvOrigin } from './helpers/parse-env-origins';
import { ValidationPipe } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
const getCorsAllowList = (config: ConfigService) => {
  return parseEnvOrigin(
    config.get<string>('CLIENT_URL'),
    config.get<string>('CORS_OTHER_URL'),
  );
};
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  const config = app.get(ConfigService);
  const logger = app.get(Logger);
  //cors
  const allowList = getCorsAllowList(config);
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
      logger.warn(
        `CORS: block request from origin ${requestOrigin} not in allowList`,
      );
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
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  const port = config.get<number>('PORT');
  await app.listen(port ?? 8080);
  logger.log(`Application is running on port ${port}`);
}
void bootstrap();
