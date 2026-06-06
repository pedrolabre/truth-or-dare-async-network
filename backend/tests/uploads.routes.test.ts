import express from 'express';
import request from 'supertest';
import uploadsRoutes from '../src/routes/uploads/uploads.routes';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptType,
} from '../src/generated/prisma/client';
import { getSupabaseAdminClient } from '../src/lib/supabase';
import {
  addUserToClub,
  createTestClub,
  createTestClubPrompt,
  createTestDare,
  createTestTruth,
  createTestUser,
} from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { applyTestDatabaseHooks } from './test-db';

jest.mock('../src/lib/supabase', () => ({
  getSupabaseAdminClient: jest.fn(),
}));

const mockedGetSupabaseAdminClient = jest.mocked(getSupabaseAdminClient);
const MB = 1024 * 1024;

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/uploads', uploadsRoutes);

  return app;
}

function authTokenFor(user: { id: string; email: string; name: string }) {
  return generateToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
}

function mockSupabaseStorage() {
  const createSignedUploadUrl = jest.fn(async (path: string) => ({
    data: {
      path,
      signedUrl: 'https://storage.test/upload/sign',
      token: 'upload-token',
    },
    error: null,
  }));

  const getPublicUrl = jest.fn((path: string) => ({
    data: {
      publicUrl: `https://storage.test/object/public/uploads/${path}`,
    },
  }));

  const from = jest.fn(() => ({
    createSignedUploadUrl,
    getPublicUrl,
  }));

  mockedGetSupabaseAdminClient.mockReturnValue({
    storage: {
      from,
    },
  } as never);

  return {
    createSignedUploadUrl,
    from,
    getPublicUrl,
  };
}

describe('POST /uploads/sign', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(() => {
    mockedGetSupabaseAdminClient.mockReset();
    process.env.SUPABASE_STORAGE_BUCKET = 'uploads';
    process.env.SUPABASE_STORAGE_PUBLIC = 'true';
  });

  afterEach(() => {
    delete process.env.SUPABASE_STORAGE_BUCKET;
    delete process.env.SUPABASE_STORAGE_PUBLIC;
  });

  it('retorna 401 quando o token nao e informado', async () => {
    const response = await request(app).post('/uploads/sign').send({
      usage: 'profile-avatar',
      fileName: 'avatar.png',
      contentType: 'image/png',
    });

    expect(response.status).toBe(401);
    expect(mockedGetSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it('assina avatar do proprio usuario em profile-avatars/{userId}', async () => {
    const storage = mockSupabaseStorage();
    const user = await createTestUser();

    const response = await request(app)
      .post('/uploads/sign')
      .set('Authorization', `Bearer ${authTokenFor(user)}`)
      .send({
        usage: 'profile-avatar',
        fileName: 'foto de perfil.png',
        contentType: 'image/png',
        sizeBytes: 2 * MB,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      bucket: 'uploads',
      signedUrl: 'https://storage.test/upload/sign',
      token: 'upload-token',
      publicUrl: expect.stringContaining('/profile-avatars/'),
    });
    expect(response.body.path).toMatch(
      new RegExp(`^profile-avatars/${user.id}/`),
    );
    expect(response.body.path).toContain('foto-de-perfil.png');
    expect(storage.createSignedUploadUrl).toHaveBeenCalledWith(
      response.body.path,
      {
        upsert: false,
      },
    );
  });

  it('mantem group-avatar como alias retrocompativel de club-avatar', async () => {
    mockSupabaseStorage();
    const owner = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const response = await request(app)
      .post('/uploads/sign')
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        usage: 'group-avatar',
        entityId: club.id,
        fileName: 'avatar-clube.webp',
        contentType: 'image/webp',
        sizeBytes: 3 * MB,
      });

    expect(response.status).toBe(201);
    expect(response.body.path).toMatch(new RegExp(`^club-avatars/${club.id}/`));
    expect(response.body.path).not.toContain('group-avatars');
  });

  it('assina capa de clube apenas para quem pode editar o clube', async () => {
    mockSupabaseStorage();
    const owner = await createTestUser();
    const admin = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 2,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, admin.id, {
      role: ClubMemberRole.admin,
      status: ClubMemberStatus.active,
    });

    const response = await request(app)
      .post('/uploads/sign')
      .set('Authorization', `Bearer ${authTokenFor(admin)}`)
      .send({
        usage: 'club-cover',
        entityId: club.id,
        fileName: 'capa.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 9 * MB,
      });

    expect(response.status).toBe(201);
    expect(response.body.path).toMatch(new RegExp(`^club-covers/${club.id}/`));
  });

  it('retorna 403 quando membro comum tenta assinar avatar de clube', async () => {
    mockSupabaseStorage();
    const owner = await createTestUser();
    const member = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 2,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, member.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
    });

    const response = await request(app)
      .post('/uploads/sign')
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        usage: 'club-avatar',
        entityId: club.id,
        fileName: 'avatar.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(403);
    expect(mockedGetSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it('retorna 404 quando a entidade relacionada nao existe', async () => {
    mockSupabaseStorage();
    const user = await createTestUser();

    const response = await request(app)
      .post('/uploads/sign')
      .set('Authorization', `Bearer ${authTokenFor(user)}`)
      .send({
        usage: 'club-avatar',
        entityId: 'club-inexistente',
        fileName: 'avatar.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(404);
    expect(mockedGetSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it('mantem dare-proof restrito ao usuario desafiado', async () => {
    mockSupabaseStorage();
    const author = await createTestUser();
    const target = await createTestUser();
    const otherUser = await createTestUser();
    const dare = await createTestDare({
      authorId: author.id,
      targetUserId: target.id,
    });

    const forbiddenResponse = await request(app)
      .post('/uploads/sign')
      .set('Authorization', `Bearer ${authTokenFor(otherUser)}`)
      .send({
        usage: 'dare-proof',
        entityId: dare.id,
        fileName: 'prova.mp4',
        contentType: 'video/mp4',
      });

    expect(forbiddenResponse.status).toBe(403);
    expect(mockedGetSupabaseAdminClient).not.toHaveBeenCalled();

    const allowedResponse = await request(app)
      .post('/uploads/sign')
      .set('Authorization', `Bearer ${authTokenFor(target)}`)
      .send({
        usage: 'dare-proof',
        entityId: dare.id,
        fileName: 'prova.mp4',
        contentType: 'video/mp4',
        sizeBytes: 100 * MB,
      });

    expect(allowedResponse.status).toBe(201);
    expect(allowedResponse.body.path).toMatch(
      new RegExp(`^dare-proofs/${target.id}/${dare.id}/`),
    );
  });

  it('assina anexos de comentario para truth existente', async () => {
    mockSupabaseStorage();
    const author = await createTestUser();
    const target = await createTestUser();
    const commenter = await createTestUser();
    const truth = await createTestTruth({
      authorId: author.id,
      targetUserId: target.id,
    });

    const response = await request(app)
      .post('/uploads/sign')
      .set('Authorization', `Bearer ${authTokenFor(commenter)}`)
      .send({
        usage: 'comment-attachment',
        entityId: truth.id,
        fileName: 'comentario.webp',
        contentType: 'image/webp',
      });

    expect(response.status).toBe(201);
    expect(response.body.path).toMatch(
      new RegExp(`^comment-attachments/${commenter.id}/${truth.id}/`),
    );
  });

  it('assina usos futuros de anexos de prompt e resposta de clube com permissao de postagem', async () => {
    mockSupabaseStorage();
    const owner = await createTestUser();
    const member = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 2,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, member.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
    });

    const prompt = await createTestClubPrompt({
      clubId: club.id,
      authorId: owner.id,
      type: ClubPromptType.dare,
    });

    const promptAttachmentResponse = await request(app)
      .post('/uploads/sign')
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        usage: 'club-prompt-attachment',
        entityId: club.id,
        fileName: 'anexo.pdf',
        contentType: 'application/pdf',
      });

    const responseAttachmentResponse = await request(app)
      .post('/uploads/sign')
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        usage: 'club-response-attachment',
        entityId: prompt.id,
        fileName: 'resposta.mp4',
        contentType: 'video/mp4',
      });

    expect(promptAttachmentResponse.status).toBe(201);
    expect(promptAttachmentResponse.body.path).toMatch(
      new RegExp(`^club-prompt-attachments/${member.id}/${club.id}/`),
    );
    expect(responseAttachmentResponse.status).toBe(201);
    expect(responseAttachmentResponse.body.path).toMatch(
      new RegExp(`^club-response-attachments/${member.id}/${prompt.id}/`),
    );
  });

  it('retorna 400 para usage, MIME, tamanho e nome de arquivo invalidos', async () => {
    const user = await createTestUser();
    const token = authTokenFor(user);

    const invalidUsage = await request(app)
      .post('/uploads/sign')
      .set('Authorization', `Bearer ${token}`)
      .send({
        usage: 'avatar',
        fileName: 'avatar.png',
        contentType: 'image/png',
      });

    const invalidMime = await request(app)
      .post('/uploads/sign')
      .set('Authorization', `Bearer ${token}`)
      .send({
        usage: 'profile-avatar',
        fileName: 'avatar.mp4',
        contentType: 'video/mp4',
      });

    const invalidSize = await request(app)
      .post('/uploads/sign')
      .set('Authorization', `Bearer ${token}`)
      .send({
        usage: 'profile-avatar',
        fileName: 'avatar.png',
        contentType: 'image/png',
        sizeBytes: 6 * MB,
      });

    const invalidFileName = await request(app)
      .post('/uploads/sign')
      .set('Authorization', `Bearer ${token}`)
      .send({
        usage: 'profile-avatar',
        fileName: '../avatar.png',
        contentType: 'image/png',
      });

    expect(invalidUsage.status).toBe(400);
    expect(invalidMime.status).toBe(400);
    expect(invalidSize.status).toBe(400);
    expect(invalidFileName.status).toBe(400);
    expect(mockedGetSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it('retorna erro seguro quando a configuracao do Supabase esta ausente', async () => {
    mockedGetSupabaseAdminClient.mockImplementationOnce(() => {
      throw new Error(
        'storage-admin-sensitive-marker signedUrl=https://storage.test/private',
      );
    });

    const user = await createTestUser();

    const response = await request(app)
      .post('/uploads/sign')
      .set('Authorization', `Bearer ${authTokenFor(user)}`)
      .send({
        usage: 'profile-avatar',
        fileName: 'avatar.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe(
      'Storage do Supabase nao configurado no backend',
    );
    expect(response.body.error).not.toContain('storage-admin-sensitive-marker');
    expect(response.body.error).not.toContain('signedUrl');
  });
});
