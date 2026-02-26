import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export interface HealthCheckResult {
  status: 'ok' | 'degraded';
  timestamp: string;
  database: 'connected' | 'disconnected';
}

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  getHealth(): HealthCheckResult {
    const dbReady = this.connection.readyState === 1;
    return {
      status: dbReady ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbReady ? 'connected' : 'disconnected',
    };
  }
}

