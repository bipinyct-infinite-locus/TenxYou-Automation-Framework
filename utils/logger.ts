import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

const logsDir = path.resolve(__dirname, '../reports/logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: false }),
  winston.format.printf(({ timestamp, level, message, context }) => {
    const ctx = context ? ` [${context}]` : '';
    return `${timestamp}${ctx} ${level}: ${message}`;
  }),
);

export class Logger {
  private static instances = new Map<string, Logger>();
  private logger: winston.Logger;

  private constructor(context: string) {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: { context },
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
        }),
        new winston.transports.File({
          filename: path.join(logsDir, 'combined.log'),
        }),
      ],
    });
  }

  static getInstance(context = 'Test'): Logger {
    if (!Logger.instances.has(context)) {
      Logger.instances.set(context, new Logger(context));
    }
    return Logger.instances.get(context)!;
  }

  info(message: string): void {
    this.logger.info(message);
  }

  warn(message: string): void {
    this.logger.warn(message);
  }

  error(message: string, error?: unknown): void {
    const errMsg = error instanceof Error ? ` | ${error.message}` : '';
    this.logger.error(`${message}${errMsg}`);
  }

  debug(message: string): void {
    this.logger.debug(message);
  }

  api(method: string, url: string, status: number, duration?: number): void {
    const dur = duration !== undefined ? ` (${duration}ms)` : '';
    this.logger.info(`API ${method} ${url} → ${status}${dur}`);
  }
}
