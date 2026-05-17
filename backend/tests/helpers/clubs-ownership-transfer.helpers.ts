import express from 'express';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubStatus,
} from '../../src/generated/prisma/client';
import clubsRoutes from '../../src/routes/clubs/clubs.routes';
import {
  addUserToClub,
  createTestClub,
  createTestUser,
} from '../../src/test-utils/factories';
import { generateToken } from '../../src/utils/jwt';

export function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/clubs', clubsRoutes);

  return app;
}

export function authTokenFor(user: { id: string; email: string; name: string }) {
  return generateToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
}

export async function createTransferScenario(
  targetRole: ClubMemberRole = ClubMemberRole.member,
  targetStatus: ClubMemberStatus = ClubMemberStatus.active,
  clubStatus: ClubStatus = ClubStatus.active,
) {
  const owner = await createTestUser();
  const target = await createTestUser();
  const club = await createTestClub({
    createdById: owner.id,
    status: clubStatus,
    memberCount: targetStatus === ClubMemberStatus.active ? 2 : 1,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, target.id, {
    role: targetRole,
    status: targetStatus,
    joinedAt: targetStatus === ClubMemberStatus.active ? new Date() : null,
  });

  return { club, owner, target };
}
