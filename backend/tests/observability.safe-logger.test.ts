import {
  safeInfo,
  sanitizeObservabilityPayload,
} from '../src/services/observability/safe-logger';

describe('observability.safe-logger', () => {
  let infoSpy: jest.SpyInstance;

  beforeEach(() => {
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    infoSpy.mockRestore();
  });

  it('remove campos sensiveis de logs estruturados', () => {
    const rawSearchTerm = 'termo bruto super secreto';
    const password = 'SenhaMuitoSecreta123';
    const authorization = 'Bearer token-super-secreto-authorization';
    const resetCode = '654321';
    const resetToken = 'reset-token-super-secreto';
    const passwordHash = 'hash-super-secreto';
    const email = 'observability-user@test.com';

    const sanitized = safeInfo({
      event: 'observability.test',
      query: rawSearchTerm,
      password,
      headers: {
        Authorization: authorization,
      },
      code: resetCode,
      resetToken,
      passwordHash,
      email,
      nested: {
        message: `contato ${email}`,
      },
    });
    const serialized = JSON.stringify(sanitized);

    expect(infoSpy).toHaveBeenCalledWith(sanitized);
    expect(serialized).not.toContain(rawSearchTerm);
    expect(serialized).not.toContain(password);
    expect(serialized).not.toContain(authorization);
    expect(serialized).not.toContain(resetCode);
    expect(serialized).not.toContain(resetToken);
    expect(serialized).not.toContain(passwordHash);
    expect(serialized).not.toContain(email);
    expect(sanitized).toMatchObject({
      query: '[redacted]',
      password: '[redacted]',
      headers: '[redacted]',
      code: '[redacted]',
      resetToken: '[redacted]',
      passwordHash: '[redacted]',
      email: '[redacted]',
      nested: {
        message: 'contato [redacted]',
      },
    });
  });

  it('sanitiza payload bruto sem escrever no console', () => {
    const sanitized = sanitizeObservabilityPayload({
      event: 'search.query_executed',
      searchQuery: 'busca privada',
      resultCount: 2,
    });

    expect(infoSpy).not.toHaveBeenCalled();
    expect(sanitized).toEqual({
      event: 'search.query_executed',
      searchQuery: '[redacted]',
      resultCount: 2,
    });
  });
});
