import { changeEmail, changePassword } from '../src/services/auth/auth.service';
import {
  getDailySettingsCredentialChangeMetrics,
  resetSettingsCredentialChangeMetrics,
} from '../src/services/auth/settings.metrics';
import { createTestUser } from '../src/test-utils/factories';
import { applyTestDatabaseHooks } from './test-db';

describe('settings observability', () => {
  applyTestDatabaseHooks();

  let infoSpy: jest.SpyInstance;

  beforeEach(() => {
    resetSettingsCredentialChangeMetrics();
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    infoSpy.mockRestore();
    resetSettingsCredentialChangeMetrics();
  });

  it('registra log estruturado e metrica diaria ao alterar e-mail sem expor valores sensiveis', async () => {
    const user = await createTestUser({
      email: 'settings-observability-email@test.com',
      password: 'senha-atual',
    });

    await changeEmail({
      userId: user.id,
      newEmail: 'settings-observability-email-new@test.com',
      currentPassword: 'senha-atual',
    });

    expect(infoSpy).toHaveBeenCalledWith({
      event: 'settings.credential_change.completed',
      timestamp: expect.any(String),
      userId: user.id,
      changeType: 'email',
      dailyVolume: {
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        emailChanges: 1,
        passwordChanges: 0,
        totalChanges: 1,
      },
    });
    expect(getDailySettingsCredentialChangeMetrics()).toMatchObject({
      emailChanges: 1,
      passwordChanges: 0,
      totalChanges: 1,
    });
    expect(JSON.stringify(infoSpy.mock.calls)).not.toContain('senha-atual');
    expect(JSON.stringify(infoSpy.mock.calls)).not.toContain(
      'settings-observability-email-new@test.com',
    );
  });

  it('registra log estruturado e acumula metrica diaria ao alterar senha sem expor senha', async () => {
    const user = await createTestUser({
      email: 'settings-observability-password@test.com',
      password: 'senha-atual',
    });

    await changePassword({
      userId: user.id,
      currentPassword: 'senha-atual',
      newPassword: 'senha-nova-segura',
    });

    expect(infoSpy).toHaveBeenCalledWith({
      event: 'settings.credential_change.completed',
      timestamp: expect.any(String),
      userId: user.id,
      changeType: 'password',
      dailyVolume: {
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        emailChanges: 0,
        passwordChanges: 1,
        totalChanges: 1,
      },
    });
    expect(getDailySettingsCredentialChangeMetrics()).toMatchObject({
      emailChanges: 0,
      passwordChanges: 1,
      totalChanges: 1,
    });
    expect(JSON.stringify(infoSpy.mock.calls)).not.toContain('senha-atual');
    expect(JSON.stringify(infoSpy.mock.calls)).not.toContain(
      'senha-nova-segura',
    );
  });
});
