import express from 'express';
import request from 'supertest';
import notificationsRoutes from '../src/routes/notifications.routes';
import { prisma } from '../src/lib/prisma';
import {
  createTestNotification,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { applyTestDatabaseHooks } from './test-db';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/notifications', notificationsRoutes);

  return app;
}

function authTokenFor(user: { id: string; email: string; name: string }) {
  return generateToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
}

describe('notifications.routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks({
    resetBeforeEach: false,
    resetAfterAll: false,
    disconnectAfterAll: false,
  });

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  afterAll(async () => {
    await resetFeedData({ deleteUsers: true });
    await prisma.$disconnect();
  });

  it('exige autenticacao nas rotas de notificacoes', async () => {
    const listResponse = await request(app).get('/notifications');
    const countResponse = await request(app).get('/notifications/unread-count');
    const markReadResponse = await request(app).patch(
      '/notifications/notification-1/read',
    );
    const readAllResponse = await request(app).post('/notifications/read-all');

    expect(listResponse.status).toBe(401);
    expect(countResponse.status).toBe(401);
    expect(markReadResponse.status).toBe(401);
    expect(readAllResponse.status).toBe(401);
  });

  it('lista notificacoes somente do usuario autenticado', async () => {
    const user = await createTestUser();
    const otherUser = await createTestUser();
    const notification = await createTestNotification({
      userId: user.id,
      title: 'Minha notificacao',
    });
    await createTestNotification({
      userId: otherUser.id,
      title: 'Notificacao alheia',
    });

    const response = await request(app)
      .get('/notifications')
      .set('Authorization', `Bearer ${authTokenFor(user)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [
        expect.objectContaining({
          id: notification.id,
          title: 'Minha notificacao',
        }),
      ],
      nextCursor: null,
    });
  });

  it('filtra e conta notificacoes nao lidas', async () => {
    const user = await createTestUser();

    await createTestNotification({
      userId: user.id,
      title: 'Nao lida',
    });
    await createTestNotification({
      userId: user.id,
      title: 'Lida',
      readAt: new Date(),
    });

    const token = authTokenFor(user);
    const listResponse = await request(app)
      .get('/notifications')
      .query({
        read: 'false',
      })
      .set('Authorization', `Bearer ${token}`);
    const countResponse = await request(app)
      .get('/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toEqual([
      expect.objectContaining({
        title: 'Nao lida',
        readAt: null,
      }),
    ]);
    expect(countResponse.status).toBe(200);
    expect(countResponse.body).toEqual({
      unreadCount: 1,
    });
  });

  it('marca uma notificacao propria como lida', async () => {
    const user = await createTestUser();
    const notification = await createTestNotification({
      userId: user.id,
    });

    const response = await request(app)
      .patch(`/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${authTokenFor(user)}`);

    expect(response.status).toBe(200);
    expect(response.body.notification).toMatchObject({
      id: notification.id,
      readAt: expect.any(String),
    });
  });

  it('impede marcar notificacao de outro usuario', async () => {
    const user = await createTestUser();
    const otherUser = await createTestUser();
    const notification = await createTestNotification({
      userId: otherUser.id,
    });

    const response = await request(app)
      .patch(`/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${authTokenFor(user)}`);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      code: 'NOTIFICATION_FORBIDDEN',
    });
  });

  it('marca todas as notificacoes do usuario como lidas', async () => {
    const user = await createTestUser();
    const otherUser = await createTestUser();

    await createTestNotification({
      userId: user.id,
    });
    await createTestNotification({
      userId: user.id,
    });
    await createTestNotification({
      userId: otherUser.id,
    });

    const response = await request(app)
      .post('/notifications/read-all')
      .set('Authorization', `Bearer ${authTokenFor(user)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      updatedCount: 2,
    });

    const remainingUnread = await prisma.notification.count({
      where: {
        userId: otherUser.id,
        readAt: null,
      },
    });

    expect(remainingUnread).toBe(1);
  });
});
