import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { IncomingMessage } from 'http';
import { LoggerModule } from 'nestjs-pino';
import { CORRELATION_ID_HEADER } from 'src/core/middlewares/correlation-id.middleware';
@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get('NODE_ENV') === 'development';
        return {
          pinoHttp: { level: isDev ? 'debug' : 'info' },
          transport: isDev
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
          genReqId: (req: Request, res: Response) => {
            const existing = req.headers[CORRELATION_ID_HEADER];
            const id = existing ?? randomUUID();
            req.headers[CORRELATION_ID_HEADER] = id;
            res.setHeader(CORRELATION_ID_HEADER, id);
            return id;
          },
          redact: {
            path: [
              'req.headers.authorization',
              'req.headers.cookies',
              'req.body.password',
              'req.headers["set-cookie]',
            ],
            consor: '[REDACTED]',
            customProps: (req: IncomingMessage) => ({
              userId: (req as IncomingMessage & { user?: { id: string } }).user
                ?.id,
            }),
          },
        };
      },
    }),
  ],
  exports: [LoggerModule],
})
export class PinoLoggerModule {}
