import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FeedDareItem } from '../../types/feed';

type FeedCardDareProps = {
  item: FeedDareItem;
  backgroundColor: string;
  borderLeftColor: string;
  friendAvatarBackgroundColor: string;
  friendAvatarBorderColor: string;
  friendAvatarTextColor: string;
  challengerNameColor: string;
  challengerMetaColor: string;
  badgeBackgroundColor: string;
  badgeTextColor: string;
  titleColor: string;
  progressCardBackgroundColor: string;
  progressCardBorderColor: string;
  progressLabelColor: string;
  progressExpiryColor: string;
  progressTrackColor: string;
  progressFillColor: string;
  primaryButtonBackgroundColor: string;
  primaryButtonTextColor: string;
  shareIconColor: string;
  onPressAccept?: (id: string) => void;
  onPressShare?: (id: string) => void;
  onPressDelete?: (id: string) => void;
};

export default function FeedCardDare({
  item,
  backgroundColor,
  borderLeftColor,
  friendAvatarBackgroundColor,
  friendAvatarBorderColor,
  friendAvatarTextColor,
  challengerNameColor,
  challengerMetaColor,
  badgeBackgroundColor,
  badgeTextColor,
  titleColor,
  progressCardBackgroundColor,
  progressCardBorderColor,
  progressLabelColor,
  progressExpiryColor,
  progressTrackColor,
  progressFillColor,
  primaryButtonBackgroundColor,
  primaryButtonTextColor,
  shareIconColor,
  onPressAccept,
  onPressShare,
  onPressDelete,
}: FeedCardDareProps) {
  const hasChallenger = item.challenger.trim().length > 0;
  const hasTitle = item.title.trim().length > 0;
  const hasAttemptsLabel = item.attemptsLabel.trim().length > 0;
  const hasExpiresIn = item.expiresIn.trim().length > 0;
  const hasProgress = item.progress > 0;
  const isDisabled = item.interactionDisabled;

  const challengerInitials = hasChallenger
    ? item.challenger
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')
    : '';

  const actionButtonLabel =
    item.status === 'concluded'
      ? 'DESAFIO CONCLUÍDO'
      : item.status === 'failed'
        ? 'DESAFIO FALHOU'
        : item.status === 'expired'
          ? 'DESAFIO EXPIRADO'
          : 'ACEITAR DESAFIO';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderLeftColor,
          opacity: isDisabled ? 0.82 : 1,
        },
      ]}
    >
      <View style={styles.topRightActions}>
        {onPressDelete ? (
          <Pressable
            onPress={() => onPressDelete(item.id)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
          >
            <MaterialIcons name="delete-outline" size={20} color={shareIconColor} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.challengerRow}>
        <View
          style={[
            styles.friendAvatar,
            {
              backgroundColor: friendAvatarBackgroundColor,
              borderColor: friendAvatarBorderColor,
            },
          ]}
        >
          {hasChallenger ? (
            <Text style={[styles.friendAvatarText, { color: friendAvatarTextColor }]}>
              {challengerInitials}
            </Text>
          ) : (
            <MaterialIcons name="person" size={20} color={friendAvatarTextColor} />
          )}
        </View>

        <View style={styles.challengerTextWrap}>
          {hasChallenger ? (
            <Text style={[styles.challengerName, { color: challengerNameColor }]}>
              {item.challenger}
            </Text>
          ) : (
            <View
              style={[
                styles.namePlaceholder,
                { backgroundColor: challengerNameColor, opacity: 0.1 },
              ]}
            />
          )}

          <View
            style={[
              styles.metaPlaceholder,
              { backgroundColor: challengerMetaColor, opacity: 0.12 },
            ]}
          />
        </View>
      </View>

      <View style={[styles.badge, { backgroundColor: badgeBackgroundColor }]}>
        <Text style={[styles.badgeText, { color: badgeTextColor }]}>Desafio</Text>
      </View>

      {hasTitle ? (
        <Text style={[styles.cardTitle, { color: titleColor }]}>{item.title}</Text>
      ) : (
        <View style={styles.titlePlaceholderWrap}>
          <View
            style={[
              styles.titlePlaceholder,
              styles.titlePlaceholderLg,
              { backgroundColor: titleColor, opacity: 0.08 },
            ]}
          />
          <View
            style={[
              styles.titlePlaceholder,
              styles.titlePlaceholderMd,
              { backgroundColor: titleColor, opacity: 0.08 },
            ]}
          />
          <View
            style={[
              styles.titlePlaceholder,
              styles.titlePlaceholderSm,
              { backgroundColor: titleColor, opacity: 0.08 },
            ]}
          />
        </View>
      )}

      <View
        style={[
          styles.progressCard,
          {
            backgroundColor: progressCardBackgroundColor,
            borderColor: progressCardBorderColor,
          },
        ]}
      >
        <View style={styles.progressHeader}>
          {hasAttemptsLabel ? (
            <Text style={[styles.progressLabel, { color: progressLabelColor }]}>
              {item.attemptsLabel}
            </Text>
          ) : (
            <View
              style={[
                styles.progressLabelPlaceholder,
                { backgroundColor: progressLabelColor, opacity: 0.12 },
              ]}
            />
          )}

          {hasExpiresIn ? (
            <Text style={[styles.progressExpiry, { color: progressExpiryColor }]}>
              {item.expiresIn}
            </Text>
          ) : (
            <View
              style={[
                styles.progressExpiryPlaceholder,
                { backgroundColor: progressExpiryColor, opacity: 0.12 },
              ]}
            />
          )}
        </View>

        <View style={[styles.progressTrack, { backgroundColor: progressTrackColor }]}>
          {hasProgress ? (
            <View
              style={[
                styles.progressFill,
                {
                  width: `${item.progress * 100}%`,
                  backgroundColor: progressFillColor,
                },
              ]}
            />
          ) : (
            <View
              style={[
                styles.progressFillPlaceholder,
                { backgroundColor: progressFillColor, opacity: 0.22 },
              ]}
            />
          )}
        </View>
      </View>

      <View style={styles.dareFooter}>
        <Pressable
          disabled={isDisabled}
          onPress={() => onPressAccept?.(item.id)}
          style={({ pressed }) => [
            styles.primaryActionButton,
            { backgroundColor: primaryButtonBackgroundColor },
            isDisabled && styles.disabledButton,
            pressed && !isDisabled && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.primaryActionButtonText,
              { color: primaryButtonTextColor },
              isDisabled && styles.disabledButtonText,
            ]}
          >
            {actionButtonLabel}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onPressShare?.(item.id)}
          style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
        >
          <MaterialIcons name="share" size={22} color={shareIconColor} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 4,
    position: 'relative',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  topRightActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  friendAvatarText: {
    fontSize: 12,
    fontWeight: '800',
  },
  challengerTextWrap: {
    flex: 1,
    gap: 6,
  },
  challengerName: {
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
  },
  namePlaceholder: {
    width: 140,
    height: 14,
    borderRadius: 999,
  },
  metaPlaceholder: {
    width: 110,
    height: 10,
    borderRadius: 999,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  cardTitle: {
    fontSize: 19,
    lineHeight: 27,
    fontWeight: '700',
  },
  titlePlaceholderWrap: {
    gap: 12,
  },
  titlePlaceholder: {
    height: 20,
    borderRadius: 999,
  },
  titlePlaceholderLg: {
    width: '100%',
  },
  titlePlaceholderMd: {
    width: '90%',
  },
  titlePlaceholderSm: {
    width: '68%',
  },
  progressCard: {
    marginTop: 18,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressExpiry: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressLabelPlaceholder: {
    width: 92,
    height: 11,
    borderRadius: 999,
  },
  progressExpiryPlaceholder: {
    width: 70,
    height: 11,
    borderRadius: 999,
  },
  progressTrack: {
    marginTop: 10,
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressFillPlaceholder: {
    width: '38%',
    height: '100%',
    borderRadius: 999,
  },
  dareFooter: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryActionButton: {
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionButtonText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  disabledButton: {
    opacity: 0.7,
  },
  disabledButtonText: {
    opacity: 0.9,
  },
  shareButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
});