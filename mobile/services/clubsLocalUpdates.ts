import type { ClubSummaryApi, ClubViewerActivityApi } from '../types/clubsApi';

type MyClubsUpsertListener = (club: ClubSummaryApi) => void;
type MyClubActivityListener = (
  clubId: string,
  activity: Partial<ClubViewerActivityApi>,
) => void;

const myClubsUpsertListeners = new Set<MyClubsUpsertListener>();
const myClubActivityListeners = new Set<MyClubActivityListener>();

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

export function subscribeToMyClubActivityUpdates(
  listener: MyClubActivityListener,
): () => void {
  myClubActivityListeners.add(listener);

  return () => {
    myClubActivityListeners.delete(listener);
  };
}

export function publishMyClubActivityUpdate(
  clubId: string,
  activity: Partial<ClubViewerActivityApi>,
) {
  myClubActivityListeners.forEach((listener) => {
    listener(clubId, activity);
  });
}
