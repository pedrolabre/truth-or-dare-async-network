import { listUsersForChallenge } from '../src/services/users.service';
import { applyTestDatabaseHooks } from './test-db';
import { createTestUser, resetFeedData } from '../src/test-utils/factories';

describe('users.service', () => {
  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('deve listar usuários exceto o usuário autenticado', async () => {
    const currentUser = await createTestUser({
      name: 'Pedro Roberto',
      email: 'pedro-users-service@test.com',
      password: '123456',
    });

    const otherUser1 = await createTestUser({
      name: 'Marina Souza',
      email: 'marina-users-service@test.com',
      password: '123456',
    });

    const otherUser2 = await createTestUser({
      name: 'Lucas Mendes',
      email: 'lucas-users-service@test.com',
      password: '123456',
    });

    const result = await listUsersForChallenge({
      currentUserId: currentUser.id,
    });

    expect(result).toHaveLength(2);
    expect(result.some((user) => user.id === currentUser.id)).toBe(false);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: otherUser1.id,
          name: otherUser1.name,
          email: otherUser1.email,
        }),
        expect.objectContaining({
          id: otherUser2.id,
          name: otherUser2.name,
          email: otherUser2.email,
        }),
      ]),
    );
  });

  it('deve filtrar usuários pela query', async () => {
    const currentUser = await createTestUser({
      name: 'Pedro Roberto',
      email: 'pedro-users-query@test.com',
      password: '123456',
    });

    const marina = await createTestUser({
      name: 'Marina Souza',
      email: 'marina-users-query@test.com',
      password: '123456',
    });

    await createTestUser({
      name: 'Lucas Mendes',
      email: 'lucas-users-query@test.com',
      password: '123456',
    });

    const result = await listUsersForChallenge({
      currentUserId: currentUser.id,
      query: 'Marina',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: marina.id,
      name: marina.name,
      email: marina.email,
    });
  });

  it('deve lançar erro quando currentUserId não for informado', async () => {
    await expect(
      listUsersForChallenge({
        currentUserId: '',
      }),
    ).rejects.toThrow('Usuário autenticado não encontrado');
  });
});