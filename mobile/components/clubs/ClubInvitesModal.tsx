import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { ClubsThemeColors } from '../../constants/clubsTheme';
import { useClubInvites } from '../../hooks/useClubInvites';
import ClubInviteUserRow from './ClubInviteUserRow';

type Props = {
  visible: boolean;
  clubId: string | null;
  canInvite: boolean;
  colors: ClubsThemeColors;
  onClose: () => void;
};

export default function ClubInvitesModal({
  visible,
  clubId,
  canInvite,
  colors,
  onClose,
}: Props) {
  const {
    query,
    users,
    isSearching,
    searchErrorMessage,
    inviteErrorMessage,
    inviteSuccessMessage,
    invitingUserIds,
    invitedUserIds,
    setQuery,
    inviteUser,
    retrySearch,
  } = useClubInvites({
    clubId,
    enabled: visible,
    canInvite,
  });
  const showEmpty =
    !isSearching && !searchErrorMessage && users.length === 0 && canInvite;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <MaterialIcons name="person-add" size={22} color={colors.green} />
              <Text style={[styles.title, { color: colors.text }]}>
                Convidar usuarios
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar convites"
              onPress={onClose}
              hitSlop={10}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          {!canInvite ? (
            <FeedbackState
              colors={colors}
              iconName="lock-outline"
              title="Acesso restrito"
              description="Apenas owner e admin podem convidar usuarios."
            />
          ) : (
            <>
              <View
                style={[
                  styles.searchWrap,
                  {
                    backgroundColor: colors.surfaceSoft,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <MaterialIcons name="search" size={20} color={colors.muted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar por nome..."
                  placeholderTextColor={colors.muted}
                  style={[styles.searchInput, { color: colors.text }]}
                />
              </View>

              {inviteErrorMessage ? (
                <FeedbackBanner
                  colors={colors}
                  message={inviteErrorMessage}
                  tone="danger"
                />
              ) : null}

              {inviteSuccessMessage ? (
                <FeedbackBanner
                  colors={colors}
                  message={inviteSuccessMessage}
                  tone="success"
                />
              ) : null}

              <ScrollView
                style={styles.results}
                contentContainerStyle={styles.resultsContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {isSearching ? (
                  <FeedbackState
                    colors={colors}
                    isLoading
                    iconName="person-search"
                    title="Buscando usuarios"
                    description="Consultando a lista real de usuarios."
                  />
                ) : null}

                {searchErrorMessage ? (
                  <FeedbackState
                    colors={colors}
                    iconName="error-outline"
                    title="Busca indisponivel"
                    description={searchErrorMessage}
                    actionLabel="Tentar novamente"
                    onAction={retrySearch}
                  />
                ) : null}

                {showEmpty ? (
                  <FeedbackState
                    colors={colors}
                    iconName="person-search"
                    title="Nenhum usuario encontrado"
                    description="Tente buscar por outro nome."
                  />
                ) : null}

                {!isSearching && !searchErrorMessage
                  ? users.map((user) => (
                      <ClubInviteUserRow
                        key={user.id}
                        colors={colors}
                        user={user}
                        isInviting={invitingUserIds.includes(user.id)}
                        isInvited={invitedUserIds.includes(user.id)}
                        onInvite={(userId) => {
                          void inviteUser(userId);
                        }}
                      />
                    ))
                  : null}
              </ScrollView>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type FeedbackStateProps = {
  colors: ClubsThemeColors;
  iconName: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  isLoading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

function FeedbackState({
  colors,
  iconName,
  title,
  description,
  isLoading = false,
  actionLabel,
  onAction,
}: FeedbackStateProps) {
  return (
    <View style={styles.feedbackState}>
      <View style={[styles.feedbackIcon, { backgroundColor: colors.surfaceSoft }]}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.green} />
        ) : (
          <MaterialIcons name={iconName} size={26} color={colors.muted} />
        )}
      </View>
      <Text style={[styles.feedbackTitle, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.feedbackDescription, { color: colors.subText }]}>
        {description}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.retryButton,
            { backgroundColor: colors.green },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.retryText, { color: colors.white }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type FeedbackBannerProps = {
  colors: ClubsThemeColors;
  message: string;
  tone: 'danger' | 'success';
};

function FeedbackBanner({ colors, message, tone }: FeedbackBannerProps) {
  const isDanger = tone === 'danger';

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isDanger ? colors.redSoft : colors.greenSoft,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <Text
        style={[
          styles.bannerText,
          { color: isDanger ? colors.red : colors.green },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '86%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    minHeight: 50,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0,
  },
  results: {
    maxHeight: 440,
  },
  resultsContent: {
    gap: 8,
    paddingBottom: 8,
  },
  feedbackState: {
    minHeight: 154,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  feedbackIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  feedbackDescription: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '900',
  },
  banner: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bannerText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});
