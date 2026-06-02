import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import { createTestUser } from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { applyTestDatabaseHooks } from './test-db';

function getAuthorization(user: { id: string; email: string; name: string }) {
  const token = generateToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });

  return `Bearer ${token}`;
}

describe('support.routes', () => {
  applyTestDatabaseHooks();

  it('POST /support/report-abuse cria ticket autenticado com referencia opcional', async () => {
    const user = await createTestUser({
      email: 'support-report@test.com',
    });

    const response = await request(app)
      .post('/support/report-abuse')
      .set('Authorization', getAuthorization(user))
      .send({
        category: 'spam',
        description: 'Conteudo repetitivo enviado em varias conversas.',
        referenceId: 'truth-123',
        referenceType: 'truth',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      ticket: {
        id: expect.any(String),
        userId: user.id,
        category: 'spam',
        description: 'Conteudo repetitivo enviado em varias conversas.',
        referenceId: 'truth-123',
        referenceType: 'truth',
        status: 'open',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });

    await expect(
      prisma.supportTicket.findUnique({
        where: {
          id: response.body.ticket.id,
        },
        select: {
          userId: true,
          category: true,
          description: true,
          referenceId: true,
          referenceType: true,
          status: true,
        },
      }),
    ).resolves.toEqual({
      userId: user.id,
      category: 'spam',
      description: 'Conteudo repetitivo enviado em varias conversas.',
      referenceId: 'truth-123',
      referenceType: 'truth',
      status: 'open',
    });
  });

  it('POST /support/report-abuse cria ticket sem referencia quando campos opcionais nao sao enviados', async () => {
    const user = await createTestUser({
      email: 'support-report-without-reference@test.com',
    });

    const response = await request(app)
      .post('/support/report-abuse')
      .set('Authorization', getAuthorization(user))
      .send({
        category: 'other',
        description: 'Preciso denunciar uma interacao abusiva no aplicativo.',
      });

    expect(response.status).toBe(201);
    expect(response.body.ticket).toMatchObject({
      userId: user.id,
      category: 'other',
      referenceId: null,
      referenceType: null,
      status: 'open',
    });
  });

  it.each([
    [{ category: 'invalid', description: 'Descricao valida para teste.' }, 'INVALID_CATEGORY'],
    [{ category: 'spam', description: 'curta' }, 'INVALID_DESCRIPTION'],
    [{ category: 'spam', description: '' }, 'INVALID_DESCRIPTION'],
    [
      {
        category: 'spam',
        description: 'Descricao valida para referencia invalida.',
        referenceId: 123,
      },
      'INVALID_REFERENCE_ID',
    ],
    [
      {
        category: 'spam',
        description: 'Descricao valida para tipo de referencia invalido.',
        referenceType: false,
      },
      'INVALID_REFERENCE_TYPE',
    ],
  ])('POST /support/report-abuse rejeita payload invalido', async (payload, code) => {
    const user = await createTestUser({
      email: `support-invalid-${code.toLowerCase()}@test.com`,
    });

    const response = await request(app)
      .post('/support/report-abuse')
      .set('Authorization', getAuthorization(user))
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code,
    });
  });

  it('POST /support/report-abuse exige token valido', async () => {
    const response = await request(app)
      .post('/support/report-abuse')
      .send({
        category: 'hate',
        description: 'Descricao valida para denuncia sem token.',
      });

    expect(response.status).toBe(401);
  });

  it('POST /support/report-abuse retorna USER_NOT_FOUND quando o token aponta para usuario inexistente', async () => {
    const response = await request(app)
      .post('/support/report-abuse')
      .set(
        'Authorization',
        getAuthorization({
          id: 'usuario-inexistente',
          name: 'Usuario Inexistente',
          email: 'support-missing-user@test.com',
        }),
      )
      .send({
        category: 'violence',
        description: 'Descricao valida para usuario inexistente.',
      });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      code: 'USER_NOT_FOUND',
    });
  });
});
