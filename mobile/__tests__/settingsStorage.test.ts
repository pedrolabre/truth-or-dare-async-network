import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearLocalSettings,
  loadAllSettings,
  loadThemeMode,
  saveSettings,
  saveThemeMode,
} from '../services/settingsStorage';

const SETTINGS_PREFIX = '@truth-or-dare/settings';

function makeAuthToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString(
    'base64url',
  );

  return `header.${payload}.signature`;
}

async function authenticateAs(userId: string) {
  await AsyncStorage.setItem('auth_token', makeAuthToken(userId));
}

describe('settings storage service', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('usa fallback seguro quando nao existe valor salvo', async () => {
    await authenticateAs('user-1');

    await expect(loadAllSettings()).resolves.toEqual({
      schemaVersion: 1,
      themeMode: 'system',
    });
    await expect(loadThemeMode()).resolves.toBe('system');
  });

  it('carrega configuracoes locais salvas para o usuario autenticado', async () => {
    await authenticateAs('user-1');
    await AsyncStorage.setItem(
      `${SETTINGS_PREFIX}/user/user-1`,
      JSON.stringify({
        schemaVersion: 1,
        themeMode: 'dark',
        futurePreference: true,
      }),
    );

    await expect(loadAllSettings()).resolves.toEqual({
      schemaVersion: 1,
      themeMode: 'dark',
      futurePreference: true,
    });
  });

  it('salva o tema com versao de esquema', async () => {
    await authenticateAs('user-1');

    await saveThemeMode('light');

    await expect(loadAllSettings()).resolves.toEqual({
      schemaVersion: 1,
      themeMode: 'light',
    });
  });

  it('preserva campos existentes ao salvar configuracoes parciais', async () => {
    await authenticateAs('user-1');
    await saveSettings({
      themeMode: 'dark',
      futurePreference: 'preservar',
    });

    await saveSettings({ themeMode: 'light' });

    await expect(loadAllSettings()).resolves.toEqual({
      schemaVersion: 1,
      themeMode: 'light',
      futurePreference: 'preservar',
    });
  });

  it('usa namespace por usuario para evitar vazamento entre contas', async () => {
    await authenticateAs('user-1');
    await saveThemeMode('dark');

    await authenticateAs('user-2');
    await expect(loadThemeMode()).resolves.toBe('system');
    await saveThemeMode('light');

    await authenticateAs('user-1');
    await expect(loadThemeMode()).resolves.toBe('dark');

    await authenticateAs('user-2');
    await expect(loadThemeMode()).resolves.toBe('light');
  });

  it('usa namespace anonimo quando nao existe token autenticado valido', async () => {
    await saveThemeMode('dark');

    await expect(
      AsyncStorage.getItem(`${SETTINGS_PREFIX}/anonymous`),
    ).resolves.toBe(JSON.stringify({ schemaVersion: 1, themeMode: 'dark' }));
  });

  it('usa fallback seguro quando a leitura falha', async () => {
    await authenticateAs('user-1');
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(makeAuthToken('user-1'))
      .mockRejectedValueOnce(new Error('storage read failed'));

    await expect(loadAllSettings()).resolves.toEqual({
      schemaVersion: 1,
      themeMode: 'system',
    });
  });

  it('nao lanca erro quando a escrita falha', async () => {
    await authenticateAs('user-1');
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
      new Error('storage write failed'),
    );

    await expect(saveThemeMode('dark')).resolves.toBeUndefined();
  });

  it('usa fallback seguro para JSON invalido ou tema invalido', async () => {
    await authenticateAs('user-1');
    await AsyncStorage.setItem(
      `${SETTINGS_PREFIX}/user/user-1`,
      '{json-invalido',
    );

    await expect(loadThemeMode()).resolves.toBe('system');

    await AsyncStorage.setItem(
      `${SETTINGS_PREFIX}/user/user-1`,
      JSON.stringify({ schemaVersion: 1, themeMode: 'sepia' }),
    );

    await expect(loadThemeMode()).resolves.toBe('system');
  });

  it('ignora tentativa de salvar modo de tema invalido', async () => {
    await authenticateAs('user-1');

    await saveThemeMode('sepia' as never);

    await expect(loadThemeMode()).resolves.toBe('system');
  });

  it('limpa somente as configuracoes locais do namespace autenticado atual', async () => {
    await authenticateAs('user-1');
    await saveThemeMode('dark');

    await authenticateAs('user-2');
    await saveThemeMode('light');

    await clearLocalSettings();

    await expect(loadThemeMode()).resolves.toBe('system');

    await authenticateAs('user-1');
    await expect(loadThemeMode()).resolves.toBe('dark');
  });
});
