"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let LoggingInterceptor = class LoggingInterceptor {
    constructor() {
        this.logger = new common_1.Logger('HTTP');
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const method = req.method;
        const url = req.url;
        const correlationId = req.headers['x-correlation-id'] ||
            `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const start = Date.now();
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                const res = context.switchToHttp().getResponse();
                const statusCode = res.statusCode;
                this.logger.log(JSON.stringify({
                    correlationId,
                    method,
                    url,
                    statusCode,
                    durationMs: Date.now() - start,
                }));
            },
            error: (err) => {
                const statusCode = err?.statusCode ?? 500;
                const errorMessage = err?.message != null ? String(err.message) : undefined;
                this.logger.warn(JSON.stringify({
                    correlationId,
                    method,
                    url,
                    statusCode,
                    durationMs: Date.now() - start,
                    ...(errorMessage != null && { errorMessage }),
                }));
            },
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map