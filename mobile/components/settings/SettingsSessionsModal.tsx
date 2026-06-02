import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { UserSession } from '../../types/settings';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  sessions: UserSession[];
  isLoading: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  revokingSessionId?: string | null;
  isRevokingOtherSessions?: boolean;
  onRefresh: () => void;
  onRevokeSession: (sessionId: string) => void;
  onRevokeOtherSessions: () => void;
  onClose: () => void;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Data indisponivel';
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPlatformLabel(platform: string | null) {
  if (!platform) {
    return 'Plataforma nao informada';
  }

  const normalizedPlatform = platform.toLowerCase();

  if (normalizedPlatform === 'ios') {
    return 'iOS';
  }

  if (normalizedPlatform === 'android') {
    return 'Android';
  }

  if (normalizedPlatform === 'web') {
    return 'Web';
  }

  return platform;
}

export default function SettingsSessionsModal({
  visible,
  sessions,
  isLoading,
  errorMessage = null,
  successMessage = null,
  revokingSessionId = null,
  isRevokingOtherSessions = false,
  onRefresh,
  onRevokeSession,
  onRevokeOtherSessions,
  onClose,
}: Props) {
  const { isDark } = useTheme();
  const textColor = isDark ? '#f5fbf6' : '#171d1a';
  const subTextColor = isDark ? '#bccac2' : '#6d7a74';
  const surfaceColor = isDark ? '#232323' : '#eaefea';
  const borderColor = isDark ? '#333735' : '#d7ddd9';
  const hasOnlyCurrentSession =
    sessions.length > 0 && sessions.every((session) => session.isCurrent);
  const isBusy = isLoading || Boolean(revokingSessionId) || isRevokingOtherSessions;

  return (
    <SettingsModalShell visible={visible} onClose={onClose}>
      <View>
        <Text style={[styles.title, { color: textColor }]}>SESSOES ATIVAS</Text>
        <Text style={[styles.subtitle, { color: subTextColor }]}>
          Gerencie os acessos ativos da sua conta.
        </Text>

        {isLoading ? (
          <View testID="settings-sessions-loading" style={styles.loadingWrap}>
            <ActivityIndicator color="#5A8363" />
            <Text style={[styles.loadingText, { color: subTextColor }]}>
              Carregando sessoes...
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.sessionsList} nestedScrollEnabled>
            {sessions.length === 0 ? (
              <Text
                testID="settings-sessions-empty"
                style={[styles.emptyText, { color: subTextColor }]}
              >
                Nenhuma sessao ativa encontrada.
              </Text>
            ) : (
              sessions.map((session) => {
                const isRevoking = revokingSessionId === session.id;

                return (
                  <View
                    key={session.id}
                    testID={`settings-session-${session.id}`}
                    style={[
                      styles.sessionItem,
                      {
                        backgroundColor: surfaceColor,
                        borderColor,
                      },
                    ]}
                  >
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionTitleWrap}>
                        <Text style={[styles.sessionName, { color: textColor }]}>
                          {session.deviceName}
                        </Text>
                        {session.isCurrent ? (
                          <Text style={styles.currentBadge}>SESSAO ATUAL</Text>
                        ) : null}
                      </View>
                      <Text style={[styles.platformText, { color: subTextColor }]}>
                        {getPlatformLabel(session.platform)}
                      </Text>
                    </View>

                    <Text style={[styles.metaText, { color: subTextColor }]}>
                      Ultima atividade: {formatDate(session.lastActiveAt)}
                    </Text>
                    {session.ipAddress ? (
                      <Text style={[styles.metaText, { color: subTextColor }]}>
                        IP: {session.ipAddress}
                      </Text>
                    ) : null}

                    <Pressable
                      testID={`settings-session-revoke-${session.id}`}
                      disabled={isBusy}
                      onPress={() => onRevokeSession(session.id)}
                      style={[
                        styles.revokeButton,
                        isBusy && styles.disabledButton,
                      ]}
                    >
                      {isRevoking ? (
                        <ActivityIndicator color="#D70015" />
                      ) : (
                        <Text style={styles.revokeText}>REVOGAR SESSAO</Text>
                      )}
                    </Pressable>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {successMessage ? (
          <Text testID="settings-sessions-success" style={styles.successText}>
            {successMessage}
          </Text>
        ) : null}

        {errorMessage ? (
          <Text testID="settings-sessions-error" style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}

        <Pressable
          testID="settings-sessions-revoke-other"
          disabled={isBusy || sessions.length === 0 || hasOnlyCurrentSession}
          onPress={onRevokeOtherSessions}
          style={[
            styles.primaryButton,
            (isBusy || sessions.length === 0 || hasOnlyCurrentSession) &&
              styles.primaryButtonDisabled,
          ]}
        >
          {isRevokingOtherSessions ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryText}>REVOGAR OUTRAS SESSOES</Text>
          )}
        </Pressable>

        <View style={styles.footerActions}>
          <Pressable
            testID="settings-sessions-refresh"
            disabled={isBusy}
            onPress={onRefresh}
            style={styles.secondaryButton}
          >
            <Text style={[styles.secondaryText, { color: subTextColor }]}>
              RECARREGAR
            </Text>
          </Pressable>

          <Pressable
            disabled={isBusy}
            onPress={onClose}
            style={styles.secondaryButton}
          >
            <Text style={[styles.secondaryText, { color: subTextColor }]}>
              FECHAR
            </Text>
          </Pressable>
        </View>
      </View>
    </SettingsModalShell>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  loadingWrap: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sessionsList: {
    maxHeight: 360,
  },
  emptyText: {
    paddingVertical: 28,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  sessionItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginBottom: 10,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  sessionTitleWrap: {
    flex: 1,
    gap: 6,
  },
  sessionName: {
    fontSize: 14,
    fontWeight: '900',
  },
  currentBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(90,131,99,0.16)',
    color: '#5A8363',
    fontSize: 10,
    fontWeight: '900',
  },
  platformText: {
    fontSize: 12,
    fontWeight: '800',
  },
  metaText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  revokeButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(215,0,21,0.10)',
  },
  revokeText: {
    color: '#D70015',
    fontSize: 11,
    fontWeight: '900',
  },
  successText: {
    marginTop: 8,
    color: '#059669',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  errorText: {
    marginTop: 8,
    color: '#D70015',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  primaryButton: {
    marginTop: 16,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#5A8363',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  disabledButton: {
    opacity: 0.56,
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  footerActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
  },
  secondaryButton: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
