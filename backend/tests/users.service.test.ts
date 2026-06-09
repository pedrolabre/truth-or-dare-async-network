import {
  getMyProfile,
  getPublicUserProfile,
  listUsersForChallenge,
  updateMyProfile,
} from '../src/services/users/users.service';
import { applyTestDatabaseHooks } from './test-db';
import {
  createTestClub,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';

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

  it('deve retornar, atualizar e remover avatarUrl do perfil proprio', async () => {
    const user = await createTestUser({
      name: 'Avatar Service User',
      email: 'avatar-service-user@test.com',
      avatarUrl: 'https://cdn.example.com/users/avatar-inicial.png',
    });

    const profile = await getMyProfile(user.id);

    expect(profile.avatarUrl).toBe(
      'https://cdn.example.com/users/avatar-inicial.png',
    );

    const updated = await updateMyProfile(user.id, {
      avatarUrl: 'https://cdn.example.com/users/avatar-atualizado.png',
    });

    expect(updated.avatarUrl).toBe(
      'https://cdn.example.com/users/avatar-atualizado.png',
    );

    const removed = await updateMyProfile(user.id, {
      avatarUrl: null,
    });

    expect(removed.avatarUrl).toBeNull();
  });

  it('deve listar clubes publicos criados no perfil proprio', async () => {
    const user = await createTestUser({
      name: 'Perfil Clube Service',
      email: 'perfil-clube-service@test.com',
    });
    const club = await createTestClub({
      createdById: user.id,
      name: 'Clube Criado no Perfil',
      description: 'Clube visivel no perfil',
      iconName: 'sports-esports',
      memberCount: 7,
    });

    const profile = await getMyProfile(user.id);

    expect(profile.stats.activePublicClubsCount).toBe(1);
    expect(profile.publicClubs).toEqual([
      {
        id: club.id,
        name: 'Clube Criado no Perfil',
        slug: club.slug,
        description: 'Clube visivel no perfil',
        iconName: 'sports-esports',
        avatarUrl: null,
        memberCount: 7,
      },
    ]);
  });

  it('deve retornar avatarUrl em perfil publico permitido', async () => {
    const user = await createTestUser({
      name: 'Avatar Publico Service',
      email: 'avatar-publico-service@test.com',
      avatarUrl: 'https://cdn.example.com/users/avatar-publico.png',
    });

    const profile = await getPublicUserProfile(user.id);

    expect(profile.avatarUrl).toBe(
      'https://cdn.example.com/users/avatar-publico.png',
    );
  });

  it('deve listar clubes publicos criados no perfil publico permitido', async () => {
    const user = await createTestUser({
      name: 'Perfil Clube Publico Service',
      email: 'perfil-clube-publico-service@test.com',
    });
    const club = await createTestClub({
      createdById: user.id,
      name: 'Clube Publico no Perfil',
      avatarUrl: 'https://cdn.example.com/clubs/perfil.png',
      memberCount: 3,
    });

    const profile = await getPublicUserProfile(user.id);

    expect(profile.stats.activePublicClubsCount).toBe(1);
    expect(profile.publicClubs).toEqual([
      expect.objectContaining({
        id: club.id,
        name: 'Clube Publico no Perfil',
        avatarUrl: 'https://cdn.example.com/clubs/perfil.png',
        memberCount: 3,
      }),
    ]);
  });
});
