import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method;
    const url = req.url;
    const correlationId =
      (req.headers['x-correlation-id'] as string) ||
      `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const statusCode = res.statusCode;
          this.logger.log(
            JSON.stringify({
              correlationId,
              method,
              url,
              statusCode,
              durationMs: Date.now() - start,
            }),
          );
        },
        error: (err: { statusCode?: number; message?: string }) => {
          const statusCode = err?.statusCode ?? 500;
          const errorMessage = err?.message != null ? String(err.message) : undefined;
          this.logger.warn(
            JSON.stringify({
              correlationId,
              method,
              url,
              statusCode,
              durationMs: Date.now() - start,
              ...(errorMessage != null && { errorMessage }),
            }),
          );
        },
      }),
    );
  }
}
