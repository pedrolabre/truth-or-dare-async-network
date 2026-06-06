import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearSearchFilters,
  loadSearchFilters,
  saveSearchFilters,
  searchPreferencesInternals,
} from '../services/searchPreferences';

describe('searchPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('salva e carrega filtros por namespace de usuario sem termo bruto', async () => {
    await saveSearchFilters('viewer-1', {
      query: 'termo sensivel',
      minLevel: 2.7,
      maxLevel: 8,
      onlineOnly: true,
      clubVisibility: 'public',
      clubTag: ' noite ',
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@truth-or-dare/search/filters/viewer-1',
      JSON.stringify({
        minLevel: 2,
        maxLevel: 8,
        onlineOnly: true,
        clubVisibility: 'public',
        clubTag: 'noite',
      }),
    );
    expect((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]).not.toContain(
      'termo sensivel',
    );

    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      (AsyncStorage.setItem as jest.Mock).mock.calls[0][1],
    );

    await expect(loadSearchFilters('viewer-1')).resolves.toEqual({
      minLevel: 2,
      maxLevel: 8,
      onlineOnly: true,
      clubVisibility: 'public',
      clubTag: 'noite',
    });
  });

  it('usa namespace anonimo separado quando usuario nao foi resolvido', async () => {
    await saveSearchFilters(null, {
      onlineOnly: true,
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@truth-or-dare/search/filters/anonymous',
      expect.any(String),
    );
    expect(
      searchPreferencesInternals.getSearchFiltersStorageKey('viewer-1'),
    ).toBe('@truth-or-dare/search/filters/viewer-1');
    expect(searchPreferencesInternals.getSearchFiltersStorageKey(null)).toBe(
      '@truth-or-dare/search/filters/anonymous',
    );
  });

  it('remove filtros salvos ao limpar', async () => {
    await clearSearchFilters('viewer-1');

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      '@truth-or-dare/search/filters/viewer-1',
    );
  });

  it('retorna null para payload invalido ou ausente', async () => {
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(JSON.stringify(['nao', 'objeto']));

    await expect(loadSearchFilters('viewer-1')).resolves.toBeNull();
    await expect(loadSearchFilters('viewer-1')).resolves.toBeNull();
  });

  it('falhas de leitura, escrita e limpeza sao silenciosas', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
      new Error('storage read'),
    );
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
      new Error('storage write'),
    );
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(
      new Error('storage clear'),
    );

    await expect(loadSearchFilters('viewer-1')).resolves.toBeNull();
    await expect(
      saveSearchFilters('viewer-1', { onlineOnly: true }),
    ).resolves.toBeUndefined();
    await expect(clearSearchFilters('viewer-1')).resolves.toBeUndefined();
  });
});
