import { StructuredLoggerService } from './structured-logger.service';
import { requestLogContext } from './request-context';

describe('StructuredLoggerService (G50)', () => {
  const originalFormat = process.env.LOG_FORMAT;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.LOG_FORMAT = 'json';
    process.env.NODE_ENV = 'test';
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterAll(() => {
    process.env.LOG_FORMAT = originalFormat;
    process.env.NODE_ENV = originalEnv;
  });

  it('emits one JSON object per line with ts/level/ctx/msg', () => {
    const logger = new StructuredLoggerService();
    logger.log('hello world', 'TestCtx');
    expect(console.log).toHaveBeenCalledTimes(1);
    const line = (console.log as jest.Mock).mock.calls[0][0] as string;
    const parsed = JSON.parse(line);
    expect(parsed.level).toBe('log');
    expect(parsed.ctx).toBe('TestCtx');
    expect(parsed.msg).toBe('hello world');
    expect(typeof parsed.ts).toBe('string');
  });

  it('stamps the requestId from the ALS store when present', () => {
    const logger = new StructuredLoggerService();
    requestLogContext.run({ requestId: 'req-123' }, () => {
      logger.warn('inside request');
    });
    const line = (console.warn as jest.Mock).mock.calls[0][0] as string;
    expect(JSON.parse(line).requestId).toBe('req-123');
  });

  it('omits requestId outside a request scope', () => {
    const logger = new StructuredLoggerService();
    logger.log('outside');
    const line = (console.log as jest.Mock).mock.calls[0][0] as string;
    expect(JSON.parse(line).requestId).toBeUndefined();
  });

  it('routes errors to stderr as JSON', () => {
    const logger = new StructuredLoggerService();
    logger.error('boom', 'stack-trace', 'TestCtx');
    expect(console.error).toHaveBeenCalledTimes(1);
    const line = (console.error as jest.Mock).mock.calls[0][0] as string;
    const parsed = JSON.parse(line);
    expect(parsed.level).toBe('error');
    expect(parsed.msg).toContain('boom');
    expect(parsed.msg).toContain('stack-trace');
  });
});
