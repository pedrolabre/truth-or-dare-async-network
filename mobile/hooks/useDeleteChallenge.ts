import { deleteDare, deleteTruth, type FeedItem } from '../services/api';

type SetApiItems = React.Dispatch<React.SetStateAction<FeedItem[]>>;

export function useDeleteChallenge(setApiItems: SetApiItems) {
  async function handleDelete(item: FeedItem) {
    try {
      if (item.type === 'truth') {
        await deleteTruth(item.id);
      } else if (item.type === 'dare') {
        await deleteDare(item.id);
      } else {
        return;
      }

      setApiItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (error) {
      console.log('Erro ao deletar:', error);
    }
  }

  return { handleDelete };
}