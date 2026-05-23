import { Request, Response } from 'express';
import { ClubServiceError } from '../../services/clubs/core/clubs.service';
import { leaveClub } from '../../services/clubs/members/leave.service';
import {
  muteClub,
  unmuteClub,
} from '../../services/clubs/members/mute.service';
import { removeClubMember } from '../../services/clubs/members/remove.service';
import { updateClubMemberRole } from '../../services/clubs/members/role.service';
import { transferClubOwnership } from '../../services/clubs/members/ownership-transfer.service';
import {
  blockClubMember,
  suspendClubMemberPosting,
} from '../../services/clubs/members/restrictions.service';

function getAuthenticatedUserId(req: Request) {
  return req.user?.sub ?? '';
}

function getParamId(req: Request) {
  return typeof req.params.id === 'string' ? req.params.id : '';
}

function handleClubMembersActionError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof ClubServiceError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
  }

  const message = error instanceof Error ? error.message : fallbackMessage;

  return res.status(500).json({
    error: message,
  });
}

export async function leaveClubController(req: Request, res: Response) {
  try {
    const membership = await leaveClub({
      clubId: getParamId(req),
      userId: getAuthenticatedUserId(req),
    });

    return res.status(200).json(membership);
  } catch (error) {
    return handleClubMembersActionError(
      res,
      error,
      'Erro interno ao sair do clube',
    );
  }
}

export async function muteClubController(req: Request, res: Response) {
  try {
    const membership = await muteClub({
      clubId: getParamId(req),
      userId: getAuthenticatedUserId(req),
    });

    return res.status(200).json(membership);
  } catch (error) {
    return handleClubMembersActionError(
      res,
      error,
      'Erro interno ao silenciar clube',
    );
  }
}

export async function unmuteClubController(req: Request, res: Response) {
  try {
    const membership = await unmuteClub({
      clubId: getParamId(req),
      userId: getAuthenticatedUserId(req),
    });

    return res.status(200).json(membership);
  } catch (error) {
    return handleClubMembersActionError(
      res,
      error,
      'Erro interno ao remover silencio do clube',
    );
  }
}

export async function removeClubMemberController(req: Request, res: Response) {
  try {
    const membership = await removeClubMember({
      clubId: getParamId(req),
      actorId: getAuthenticatedUserId(req),
      targetUserId:
        typeof req.params.userId === 'string' ? req.params.userId : '',
    });

    return res.status(200).json(membership);
  } catch (error) {
    return handleClubMembersActionError(
      res,
      error,
      'Erro interno ao remover membro do clube',
    );
  }
}

export async function updateClubMemberRoleController(
  req: Request,
  res: Response,
) {
  try {
    const membership = await updateClubMemberRole({
      clubId: getParamId(req),
      actorId: getAuthenticatedUserId(req),
      targetUserId:
        typeof req.params.userId === 'string' ? req.params.userId : '',
      role: req.body?.role,
    });

    return res.status(200).json(membership);
  } catch (error) {
    return handleClubMembersActionError(
      res,
      error,
      'Erro interno ao alterar papel do membro',
    );
  }
}

export async function blockClubMemberController(req: Request, res: Response) {
  try {
    const membership = await blockClubMember({
      clubId: getParamId(req),
      actorId: getAuthenticatedUserId(req),
      targetUserId:
        typeof req.params.userId === 'string' ? req.params.userId : '',
    });

    return res.status(200).json(membership);
  } catch (error) {
    return handleClubMembersActionError(
      res,
      error,
      'Erro interno ao bloquear membro do clube',
    );
  }
}

export async function suspendClubMemberPostingController(
  req: Request,
  res: Response,
) {
  try {
    const membership = await suspendClubMemberPosting({
      clubId: getParamId(req),
      actorId: getAuthenticatedUserId(req),
      targetUserId:
        typeof req.params.userId === 'string' ? req.params.userId : '',
      suspendedUntil: req.body?.suspendedUntil,
    });

    return res.status(200).json(membership);
  } catch (error) {
    return handleClubMembersActionError(
      res,
      error,
      'Erro interno ao suspender postagem do membro',
    );
  }
}

export async function transferClubOwnershipController(
  req: Request,
  res: Response,
) {
  try {
    const club = await transferClubOwnership({
      clubId: getParamId(req),
      actorId: getAuthenticatedUserId(req),
      newOwnerId: req.body?.newOwnerId,
    });

    return res.status(200).json(club);
  } catch (error) {
    return handleClubMembersActionError(
      res,
      error,
      'Erro interno ao transferir posse do clube',
    );
  }
}
