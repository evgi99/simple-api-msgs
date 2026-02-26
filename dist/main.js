"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_1 = require("express");
const app_module_1 = require("./app.module");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const constants_1 = require("./common/constants");
function validateProductionEnv() {
    if (process.env.NODE_ENV !== 'production')
        return;
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === constants_1.DEFAULT_JWT_SECRET) {
        throw new Error('JWT_SECRET must be set to a secure value in production. Do not use the default.');
    }
    if (!process.env.CORS_ORIGINS || process.env.CORS_ORIGINS.trim() === '') {
        throw new Error('CORS_ORIGINS must be set in production (comma-separated list of allowed origins).');
    }
}
function getCorsOrigin() {
    const raw = process.env.CORS_ORIGINS?.trim();
    if (!raw)
        return '*';
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
async function bootstrap() {
    validateProductionEnv();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({ origin: getCorsOrigin() }));
    app.use((0, express_1.json)({ limit: '10mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: constants_1.URLENCODED_BODY_LIMIT }));
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.setGlobalPrefix('api');
    const port = process.env.PORT || 3000;
    await app.listen(port);
}
bootstrap().catch((err) => {
    console.error('Failed to bootstrap application', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map