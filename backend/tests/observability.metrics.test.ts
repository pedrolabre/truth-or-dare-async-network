import {
  getDailyMetric,
  getDailyMetrics,
  recordDailyMetric,
  resetDailyMetrics,
} from '../src/services/observability/metrics';

describe('observability.metrics', () => {
  beforeEach(() => {
    resetDailyMetrics();
  });

  afterEach(() => {
    resetDailyMetrics();
  });

  it('acumula contadores diarios por dominio, tipo e resultado', () => {
    const occurredAt = new Date('2026-06-03T12:00:00.000Z');

    recordDailyMetric({
      domain: 'search',
      type: 'query_executed',
      result: 'users',
      occurredAt,
    });
    recordDailyMetric({
      domain: 'search',
      type: 'query_executed',
      result: 'users',
      occurredAt,
      count: 2,
    });

    expect(
      getDailyMetric({
        domain: 'search',
        type: 'query_executed',
        result: 'users',
        date: occurredAt,
      }),
    ).toEqual({
      date: '2026-06-03',
      domain: 'search',
      type: 'query_executed',
      result: 'users',
      count: 3,
    });
  });

  it('nao persiste valores sensiveis em chaves de metrica', () => {
    const occurredAt = new Date('2026-06-03T12:00:00.000Z');
    const email = 'metric-sensitive@test.com';
    const authorization = 'Bearer token-super-secreto-de-metrica';
    const password = 'password';
    const resetToken = 'resetToken';

    recordDailyMetric({
      domain: email,
      type: password,
      result: authorization,
      occurredAt,
    });
    recordDailyMetric({
      domain: 'auth',
      type: resetToken,
      result: '654321',
      occurredAt,
    });

    const serialized = JSON.stringify(getDailyMetrics(occurredAt));

    expect(serialized).not.toContain(email);
    expect(serialized).not.toContain(authorization);
    expect(serialized).not.toContain(password);
    expect(serialized).not.toContain(resetToken);
    expect(serialized).not.toContain('654321');
    expect(getDailyMetrics(occurredAt)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          domain: 'unknown_domain',
          type: 'unknown_event',
          result: 'redacted',
        }),
        expect.objectContaining({
          domain: 'auth',
          type: 'unknown_event',
          result: 'redacted',
        }),
      ]),
    );
  });
});
