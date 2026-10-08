import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { APP_CONFIG } from 'src/config/app/app.config';
export function setupApp(
  app: NestExpressApplication,
  logger: Logger,
  config: ConfigService,
) {
  app.use(cookieParser());
  //cors
  const appCFG = config.getOrThrow<{ corsOrigins: string[] }>(APP_CONFIG);
  const allowList = appCFG.corsOrigins;
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
    allowedHeaders: [
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
  app.enableShutdownHooks();
}
