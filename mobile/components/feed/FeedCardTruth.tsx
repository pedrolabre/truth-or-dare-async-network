import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FeedTruthItem } from '../../types/feed';

type FeedCardTruthProps = {
  item: FeedTruthItem;
  backgroundColor: string;
  borderLeftColor: string;
  badgeBackgroundColor: string;
  badgeTextColor: string;
  titleColor: string;
  metaColor: string;
  actionColor: string;
  firstAvatarBackgroundColor: string;
  firstAvatarTextColor: string;
  secondAvatarBackgroundColor: string;
  secondAvatarTextColor: string;
  extraAvatarBackgroundColor: string;
  extraAvatarTextColor: string;
  extraAvatarBorderColor: string;
  onPressLike?: (id: string) => void;
  onPressComments?: (id: string) => void;
  onPressDelete?: (id: string) => void;
  liked?: boolean;
};

export default function FeedCardTruth({
  item,
  backgroundColor,
  borderLeftColor,
  badgeBackgroundColor,
  badgeTextColor,
  titleColor,
  metaColor,
  actionColor,
  extraAvatarBackgroundColor,
  extraAvatarBorderColor,
  onPressLike,
  onPressComments,
  liked = false,
  onPressDelete,
}: FeedCardTruthProps) {
  const router = useRouter();

  const hasTitle = item.title.trim().length > 0;
  const hasTime = item.time.trim().length > 0;
  const hasLikes = item.likes > 0;
  const hasComments = item.comments > 0;

  function handleOpenComments() {
    if (onPressComments) {
      onPressComments(item.id);
      return;
    }

    router.push({
      pathname: '/feed-comments',
      params: {
        itemId: item.id,
        itemType: item.type,
        title: item.title,
        commentsCount: String(item.comments),
        likesCount: String(item.likesCount),
      },
    });
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderLeftColor,
        },
      ]}
    >
      <View style={styles.cardTopRow}>
        <View style={[styles.badge, { backgroundColor: badgeBackgroundColor }]}>
          <Text style={[styles.badgeText, { color: badgeTextColor }]}>Verdade</Text>
        </View>

        <View style={styles.topRightActions}>
          {hasTime ? (
            <Text style={[styles.metaText, { color: metaColor }]}>{item.time}</Text>
          ) : (
            <View
              style={[
                styles.metaPlaceholder,
                { backgroundColor: metaColor, opacity: 0.15 },
              ]}
            />
          )}

          {onPressDelete ? (
            <Pressable
              onPress={() => onPressDelete(item.id)}
              hitSlop={10}
              style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
            >
              <MaterialIcons name="delete-outline" size={19} color={metaColor} />
            </Pressable>
          ) : null}
        </View>
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

      <View style={styles.cardBottomRow}>
        <View style={styles.avatarArea}>
          <View
            style={[
              styles.placeholderAvatar,
              {
                backgroundColor: extraAvatarBackgroundColor,
                borderColor: extraAvatarBorderColor,
              },
            ]}
          >
            <MaterialIcons name="person" size={16} color={actionColor} />
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => onPressLike?.(item.id)}
            style={({ pressed }) => [styles.iconStat, pressed && styles.pressed]}
          >
            <MaterialIcons
              name={liked ? 'favorite' : 'favorite-border'}
              size={20}
              color={liked ? '#D70015' : actionColor}
            />
            {hasLikes ? (
              <Text
                style={[
                  styles.iconStatText,
                  { color: liked ? '#D70015' : actionColor },
                ]}
              >
                {item.likes}
              </Text>
            ) : (
              <View
                style={[
                  styles.countPlaceholder,
                  { backgroundColor: actionColor, opacity: 0.15 },
                ]}
              />
            )}
          </Pressable>

          <Pressable
            onPress={handleOpenComments}
            style={({ pressed }) => [styles.iconStat, pressed && styles.pressed]}
          >
            <MaterialIcons
              name="chat-bubble-outline"
              size={19}
              color={actionColor}
            />
            {hasComments ? (
              <Text style={[styles.iconStatText, { color: actionColor }]}>
                {item.comments}
              </Text>
            ) : (
              <View
                style={[
                  styles.countPlaceholder,
                  { backgroundColor: actionColor, opacity: 0.15 },
                ]}
              />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaPlaceholder: {
    width: 42,
    height: 12,
    borderRadius: 999,
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
    width: '88%',
  },
  titlePlaceholderSm: {
    width: '70%',
  },
  cardBottomRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  avatarArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  iconStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  iconStatText: {
    fontSize: 12,
    fontWeight: '800',
  },
  countPlaceholder: {
    width: 20,
    height: 10,
    borderRadius: 999,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});