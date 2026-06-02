import request from 'supertest';
import app from '../src/app';

describe('app-info.routes', () => {
  const originalApiVersion = process.env.API_VERSION;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.API_VERSION = originalApiVersion;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('GET /app-info retorna status, ambiente e versao configurada da API sem token', async () => {
    process.env.API_VERSION = '2.4.6';
    process.env.NODE_ENV = 'test';

    const response = await request(app).get('/app-info');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      apiVersion: '2.4.6',
      environment: 'test',
      status: 'ok',
    });
  });

  it('GET /app-info usa a versao do package.json quando API_VERSION nao foi definida', async () => {
    delete process.env.API_VERSION;
    process.env.NODE_ENV = 'test';

    const response = await request(app).get('/app-info');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      apiVersion: '1.0.0',
      environment: 'test',
      status: 'ok',
    });
  });
});
