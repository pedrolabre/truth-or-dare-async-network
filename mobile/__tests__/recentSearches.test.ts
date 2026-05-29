import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearRecentSearches,
  loadRecentSearches,
  RECENT_SEARCHES_LIMIT,
  removeRecentSearch,
  saveRecentSearch,
} from '../services/recentSearches';
import type { SearchRecentItem } from '../types/search';

function makeRecentSearch(
  index: number,
  overrides: Partial<SearchRecentItem> = {},
): SearchRecentItem {
  return {
    id: `recent-${index}`,
    label: `Busca ${index}`,
    type: index % 2 === 0 ? 'club' : 'user',
    referenceId: `reference-${index}`,
    ...overrides,
  };
}

describe('recent searches service', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('carrega historico vazio quando nao existe storage para o usuario', async () => {
    await expect(loadRecentSearches('user-1')).resolves.toEqual([]);
  });

  it('carrega historico existente do usuario informado', async () => {
    const item = makeRecentSearch(1);

    await AsyncStorage.setItem(
      '@truth-or-dare/search/recent/user-1',
      JSON.stringify([item]),
    );

    await expect(loadRecentSearches('user-1')).resolves.toEqual([item]);
  });

  it('ignora registros invalidos salvos no storage local', async () => {
    const validItem = makeRecentSearch(1);

    await AsyncStorage.setItem(
      '@truth-or-dare/search/recent/user-1',
      JSON.stringify([
        validItem,
        { id: 'sem-reference', label: 'Invalido', type: 'user' },
        { id: 'tipo-invalido', label: 'Invalido', type: 'content' },
        null,
      ]),
    );

    await expect(loadRecentSearches('user-1')).resolves.toEqual([validItem]);
  });

  it('salva novo item no topo do historico local', async () => {
    const firstItem = makeRecentSearch(1);
    const secondItem = makeRecentSearch(2);

    await saveRecentSearch('user-1', firstItem);
    await saveRecentSearch('user-1', secondItem);

    await expect(loadRecentSearches('user-1')).resolves.toEqual([
      secondItem,
      firstItem,
    ]);
  });

  it('deduplica item existente e move para o topo', async () => {
    const firstItem = makeRecentSearch(1, { label: 'Primeira versao' });
    const secondItem = makeRecentSearch(2);
    const updatedFirstItem = makeRecentSearch(1, { label: 'Versao atualizada' });

    await saveRecentSearch('user-1', firstItem);
    await saveRecentSearch('user-1', secondItem);
    await saveRecentSearch('user-1', updatedFirstItem);

    await expect(loadRecentSearches('user-1')).resolves.toEqual([
      updatedFirstItem,
      secondItem,
    ]);
  });

  it('limita o historico a 10 itens removendo o mais antigo', async () => {
    const items = Array.from({ length: RECENT_SEARCHES_LIMIT + 2 }, (_, index) =>
      makeRecentSearch(index + 1),
    );

    for (const item of items) {
      await saveRecentSearch('user-1', item);
    }

    const recentSearches = await loadRecentSearches('user-1');

    expect(recentSearches).toHaveLength(RECENT_SEARCHES_LIMIT);
    expect(recentSearches[0]).toEqual(makeRecentSearch(12));
    expect(recentSearches[recentSearches.length - 1]).toEqual(
      makeRecentSearch(3),
    );
  });

  it('remove item pelo id sem alterar os demais', async () => {
    const firstItem = makeRecentSearch(1);
    const secondItem = makeRecentSearch(2);
    const thirdItem = makeRecentSearch(3);

    await saveRecentSearch('user-1', firstItem);
    await saveRecentSearch('user-1', secondItem);
    await saveRecentSearch('user-1', thirdItem);
    await removeRecentSearch('user-1', secondItem.id);

    await expect(loadRecentSearches('user-1')).resolves.toEqual([
      thirdItem,
      firstItem,
    ]);
  });

  it('limpa todo o historico do usuario', async () => {
    await saveRecentSearch('user-1', makeRecentSearch(1));
    await saveRecentSearch('user-1', makeRecentSearch(2));

    await clearRecentSearches('user-1');

    await expect(loadRecentSearches('user-1')).resolves.toEqual([]);
  });

  it('usa namespace por usuario para evitar vazamento entre contas', async () => {
    const firstUserItem = makeRecentSearch(1, { label: 'Historico A' });
    const secondUserItem = makeRecentSearch(2, { label: 'Historico B' });

    await saveRecentSearch('user-1', firstUserItem);
    await saveRecentSearch('user-2', secondUserItem);
    await removeRecentSearch('user-1', firstUserItem.id);

    await expect(loadRecentSearches('user-1')).resolves.toEqual([]);
    await expect(loadRecentSearches('user-2')).resolves.toEqual([
      secondUserItem,
    ]);
  });

  it('retorna lista vazia quando a leitura do storage falha', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
      new Error('storage read failed'),
    );

    await expect(loadRecentSearches('user-1')).resolves.toEqual([]);
  });

  it('nao lanca erro quando a escrita do storage falha', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
      new Error('storage write failed'),
    );

    await expect(
      saveRecentSearch('user-1', makeRecentSearch(1)),
    ).resolves.toBeUndefined();
  });

  it('nao lanca erro quando remover ou limpar falha no storage', async () => {
    await saveRecentSearch('user-1', makeRecentSearch(1));
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
      new Error('storage remove item failed'),
    );
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(
      new Error('storage clear failed'),
    );

    await expect(
      removeRecentSearch('user-1', 'recent-1'),
    ).resolves.toBeUndefined();
    await expect(clearRecentSearches('user-1')).resolves.toBeUndefined();
  });

  it('preserva referenceId ao salvar e carregar historico', async () => {
    const item = makeRecentSearch(1, {
      referenceId: 'public-profile-user-1',
      type: 'user',
    });

    await saveRecentSearch('user-1', item);

    await expect(loadRecentSearches('user-1')).resolves.toEqual([
      expect.objectContaining({
        id: item.id,
        label: item.label,
        type: 'user',
        referenceId: 'public-profile-user-1',
      }),
    ]);
  });
});
