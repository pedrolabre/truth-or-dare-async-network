import request from 'supertest';
import app from '../src/app';
import { applyTestDatabaseHooks } from './test-db';
import { createTestUser, resetFeedData } from '../src/test-utils/factories';

describe('Auth', () => {
  applyTestDatabaseHooks({
    resetBeforeEach: true,
    resetAfterAll: true,
    disconnectAfterAll: true,
  });

  it('deve cadastrar um usuário com sucesso', async () => {
    const payload = {
      name: 'Test User',
      email: 'auth-signup@test.com',
      password: '123456',
    };

    const res = await request(app).post('/auth/signup').send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('token');

    expect(res.body.user).toMatchObject({
      id: expect.any(String),
      name: payload.name,
      email: payload.email,
      createdAt: expect.any(String),
    });
  });

  it('não deve permitir cadastro com e-mail duplicado', async () => {
    const payload = {
      name: 'Duplicate User',
      email: 'auth-duplicate@test.com',
      password: '123456',
    };

    await request(app).post('/auth/signup').send(payload);

    const res = await request(app).post('/auth/signup').send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'Já existe uma conta com este e-mail',
    });
  });

  it('deve fazer login com sucesso', async () => {
    const user = {
      name: 'Login User',
      email: 'auth-login@test.com',
      password: '123456',
    };

    await request(app).post('/auth/signup').send(user);

    const res = await request(app).post('/auth/login').send({
      email: user.email,
      password: user.password,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('token');

    expect(res.body.user).toMatchObject({
      id: expect.any(String),
      name: user.name,
      email: user.email,
      createdAt: expect.any(String),
    });
  });

  it('deve falhar no login com senha incorreta', async () => {
    await createTestUser({
      name: 'Wrong Password User',
      email: 'auth-wrong-password@test.com',
      password: '123456',
    });

    const res = await request(app).post('/auth/login').send({
      email: 'auth-wrong-password@test.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'E-mail ou senha inválidos',
    });
  });

  it('deve falhar no login quando o usuário não existir', async () => {
    await resetFeedData();

    const res = await request(app).post('/auth/login').send({
      email: 'not-found@test.com',
      password: '123456',
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'E-mail ou senha inválidos',
    });
  });
});