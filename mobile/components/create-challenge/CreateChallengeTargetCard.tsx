import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type CreateChallengeTargetCardProps = {
  label: string;
  name?: string;
  initials?: string;
  backgroundColor: string;
  borderColor: string;
  avatarBackgroundColor: string;
  avatarTextColor: string;
  labelColor: string;
  nameColor: string;
  actionColor: string;
  emptyTitleColor: string;
  emptySubtitleColor: string;
  emptyIconColor: string;
  onPressChange?: () => void;
};

export default function CreateChallengeTargetCard({
  label,
  name,
  initials,
  backgroundColor,
  borderColor,
  avatarBackgroundColor,
  avatarTextColor,
  labelColor,
  nameColor,
  actionColor,
  emptyTitleColor,
  emptySubtitleColor,
  emptyIconColor,
  onPressChange,
}: CreateChallengeTargetCardProps) {
  const hasSelectedUser = Boolean(name?.trim());

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <View style={styles.info}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: avatarBackgroundColor,
            },
          ]}
        >
          {hasSelectedUser ? (
            <Text style={[styles.avatarText, { color: avatarTextColor }]}>
              {initials}
            </Text>
          ) : (
            <MaterialIcons name="person-search" size={22} color={emptyIconColor} />
          )}
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.label, { color: labelColor }]}>{label}</Text>

          {hasSelectedUser ? (
            <Text style={[styles.name, { color: nameColor }]}>{name}</Text>
          ) : (
            <>
              <Text style={[styles.emptyTitle, { color: emptyTitleColor }]}>
                Escolha quem será desafiado
              </Text>
              <Text style={[styles.emptySubtitle, { color: emptySubtitleColor }]}>
                Busque um usuário para enviar verdade ou desafio.
              </Text>
            </>
          )}
        </View>
      </View>

      <Pressable
        onPress={onPressChange}
        hitSlop={8}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Text style={[styles.actionText, { color: actionColor }]}>
          {hasSelectedUser ? 'ALTERAR' : 'ESCOLHER'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '900',
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  name: {
    marginTop: 2,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
  emptyTitle: {
    marginTop: 2,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
});