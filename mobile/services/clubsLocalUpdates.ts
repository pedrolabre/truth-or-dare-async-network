import type { ClubSummaryApi } from '../types/clubsApi';

type MyClubsUpsertListener = (club: ClubSummaryApi) => void;

const myClubsUpsertListeners = new Set<MyClubsUpsertListener>();

export function subscribeToMyClubsUpserts(
  listener: MyClubsUpsertListener,
): () => void {
  myClubsUpsertListeners.add(listener);

  return () => {
    myClubsUpsertListeners.delete(listener);
  };
}

export function publishMyClubsUpsert(club: ClubSummaryApi) {
  myClubsUpsertListeners.forEach((listener) => {
    listener(club);
  });
}
