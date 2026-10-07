import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import {
  buildApiErrorPayload,
  extractFromHttpExceptionBody,
  payloadFromUnknownException,
} from 'src/helpers/api-filter-response';
@Catch()
@Injectable()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AllExceptionFilter.name);
  }
  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') return;
    const httpCtx = host.switchToHttp();
    const req = httpCtx.getRequest<Request>();
    const res = httpCtx.getResponse<Response>();
    const ctx = {
      requestId: (req.headers['x-request-id'] as string) ?? '',
      path: req.url,
    };
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const rawErrorResponse = exception.getResponse();
      if (typeof rawErrorResponse === 'string') {
        //todo :build error payload
        res
          .status(statusCode)
          .json(
            buildApiErrorPayload(statusCode, rawErrorResponse, undefined, ctx),
          );
        return;
      }
      //resbody la object
      //todo : extract error from resbody
      const { message, error } = extractFromHttpExceptionBody(
        rawErrorResponse,
        exception.message,
      );
      //todo : build error paylaod
      res
        .status(statusCode)
        .json(buildApiErrorPayload(statusCode, message, error, ctx));
      return;
    }
    //http exceptio (notfound,badrequest)
    //unknown exception databse,...
    this.logger.error({
      msg: 'unhandled.exception',
      requestId: ctx.requestId,
      path: ctx.path,
      error:
        exception instanceof Error ? exception.message : 'Unknown exception',
      stack: exception instanceof Error ? exception.stack : 'undefined',
    });
    //todo : build error payload for unknown  exception
    const payload = payloadFromUnknownException(exception, ctx);
    res.status(payload.statusCode).json(payload);
    return;
  }
}
