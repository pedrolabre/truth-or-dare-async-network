import { useEffect, useRef, useState } from 'react';

import { getUsers, type ChallengeUser } from '../services/api';
import { inviteClubUser } from '../services/clubsApi';
import type { ClubInviteApi } from '../types/clubsApi';

export const CLUB_INVITE_USER_SEARCH_DEBOUNCE_MS = 350;

export type ClubInviteUserOption = {
  id: string;
  name: string;
  email: string;
};

type SearchUsers = (query?: string) => Promise<ChallengeUser[]>;
type SendClubInvite = (
  clubId: string,
  userId: string,
  message?: string | null,
) => Promise<ClubInviteApi>;

type UseClubInvitesOptions = {
  clubId: string | null;
  enabled: boolean;
  canInvite: boolean;
  searchUsers?: SearchUsers;
  sendClubInvite?: SendClubInvite;
  searchDebounceMs?: number;
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message
    ? error.message
    : fallbackMessage;
}

function mapUsersToInviteOptions(
  users: ChallengeUser[],
): ClubInviteUserOption[] {
  const seenIds = new Set<string>();
  const options: ClubInviteUserOption[] = [];

  users.forEach((user) => {
    if (seenIds.has(user.id)) {
      return;
    }

    seenIds.add(user.id);
    options.push({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  });

  return options;
}

export function useClubInvites({
  clubId,
  enabled,
  canInvite,
  searchUsers = getUsers,
  sendClubInvite = inviteClubUser,
  searchDebounceMs = CLUB_INVITE_USER_SEARCH_DEBOUNCE_MS,
}: UseClubInvitesOptions) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<ClubInviteUserOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(
    null,
  );
  const [inviteErrorMessage, setInviteErrorMessage] = useState<string | null>(
    null,
  );
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState<
    string | null
  >(null);
  const [invitingUserIds, setInvitingUserIds] = useState<string[]>([]);
  const [invitedUserIds, setInvitedUserIds] = useState<string[]>([]);
  const [retryKey, setRetryKey] = useState(0);
  const latestSearchIdRef = useRef(0);
  const invitingUserIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) {
      setQuery('');
      setUsers([]);
      setIsSearching(false);
      setSearchErrorMessage(null);
      setInviteErrorMessage(null);
      setInviteSuccessMessage(null);
      setInvitingUserIds([]);
      invitingUserIdsRef.current = new Set();
      return;
    }

    if (!canInvite) {
      setUsers([]);
      setIsSearching(false);
      setSearchErrorMessage(null);
      return;
    }

    const searchId = latestSearchIdRef.current + 1;
    let isActive = true;

    latestSearchIdRef.current = searchId;
    setIsSearching(true);
    setSearchErrorMessage(null);

    const timeout = setTimeout(() => {
      void (async () => {
        try {
          const foundUsers = await searchUsers(query.trim());

          if (!isActive || latestSearchIdRef.current !== searchId) {
            return;
          }

          setUsers(mapUsersToInviteOptions(foundUsers));
        } catch (error) {
          if (!isActive || latestSearchIdRef.current !== searchId) {
            return;
          }

          setUsers([]);
          setSearchErrorMessage(
            getErrorMessage(error, 'Nao foi possivel buscar usuarios.'),
          );
        } finally {
          if (isActive && latestSearchIdRef.current === searchId) {
            setIsSearching(false);
          }
        }
      })();
    }, searchDebounceMs);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [canInvite, enabled, query, retryKey, searchDebounceMs, searchUsers]);

  function setInvitePending(userId: string, isPending: boolean) {
    const nextInvitingUserIds = new Set(invitingUserIdsRef.current);

    if (isPending) {
      nextInvitingUserIds.add(userId);
    } else {
      nextInvitingUserIds.delete(userId);
    }

    invitingUserIdsRef.current = nextInvitingUserIds;
    setInvitingUserIds(Array.from(nextInvitingUserIds));
  }

  async function inviteUser(userId: string) {
    if (!clubId || !canInvite || invitingUserIdsRef.current.has(userId)) {
      return null;
    }

    setInvitePending(userId, true);
    setInviteErrorMessage(null);
    setInviteSuccessMessage(null);

    try {
      const invite = await sendClubInvite(clubId, userId, null);

      setInvitedUserIds((currentUserIds) =>
        Array.from(new Set([...currentUserIds, userId])),
      );
      setInviteSuccessMessage('Convite enviado.');

      return invite;
    } catch (error) {
      setInviteErrorMessage(
        getErrorMessage(error, 'Nao foi possivel enviar o convite.'),
      );
      return null;
    } finally {
      setInvitePending(userId, false);
    }
  }

  function retrySearch() {
    setRetryKey((current) => current + 1);
  }

  function clearInviteFeedback() {
    setInviteErrorMessage(null);
    setInviteSuccessMessage(null);
  }

  return {
    query,
    users,
    isSearching,
    searchErrorMessage,
    inviteErrorMessage,
    inviteSuccessMessage,
    invitingUserIds,
    invitedUserIds,
    canInvite,
    setQuery,
    inviteUser,
    retrySearch,
    clearInviteFeedback,
  };
}
