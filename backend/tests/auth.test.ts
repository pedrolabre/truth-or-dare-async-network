import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';

describe('Auth', () => {
  const testUser = {
    name: 'Test User',
    email: `test_${Date.now()}@mail.com`,
    password: '123456',
  };

  it('should signup successfully', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('token');
  });

  it('should not allow duplicate email', async () => {
    await request(app).post('/auth/signup').send(testUser);

    const res = await request(app)
      .post('/auth/signup')
      .send(testUser);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should login successfully', async () => {
    const uniqueUser = {
      name: 'Login User',
      email: `login_${Date.now()}@mail.com`,
      password: '123456',
    };

    await request(app).post('/auth/signup').send(uniqueUser);

    const res = await request(app)
      .post('/auth/login')
      .send({
        email: uniqueUser.email,
        password: uniqueUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('token');
  });

  it('should fail login with wrong password', async () => {
    const uniqueUser = {
      name: 'Wrong Password User',
      email: `wrong_${Date.now()}@mail.com`,
      password: '123456',
    };

    await request(app).post('/auth/signup').send(uniqueUser);

    const res = await request(app)
      .post('/auth/login')
      .send({
        email: uniqueUser.email,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});