import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SearchThemeColors } from '../../constants/searchTheme';
import type { SearchContentItem } from '../../types/search';

type Props = {
  content: SearchContentItem;
  colors: SearchThemeColors;
  onPress?: (content: SearchContentItem) => void;
  onPressAction?: (content: SearchContentItem) => void;
};

function getContentIcon(content: SearchContentItem) {
  if (content.contentType === 'dare') {
    return 'local-fire-department';
  }

  if (content.contentType === 'comment') {
    return 'mode-comment';
  }

  return 'question-answer';
}

function getSourceLabel(content: SearchContentItem) {
  if (content.clubName) {
    return content.clubName;
  }

  return content.authorName ? `Por ${content.authorName}` : 'Conteudo';
}

export default function SearchContentResultCard({
  content,
  colors,
  onPress,
  onPressAction,
}: Props) {
  const iconName = getContentIcon(content);
  const sourceLabel = getSourceLabel(content);

  return (
    <Pressable
      onPress={() => onPress?.(content)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${content.badgeLabel}: ${content.snippet}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.left}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor:
                content.contentType === 'dare' ? colors.redSoft : colors.greenSoft,
            },
          ]}
        >
          <MaterialIcons
            name={iconName}
            size={22}
            color={content.contentType === 'dare' ? colors.red : colors.green}
          />
        </View>

        <View style={styles.textWrap}>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    content.contentType === 'dare'
                      ? colors.redSoft
                      : colors.greenSoft,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.badgeText,
                  {
                    color:
                      content.contentType === 'dare' ? colors.red : colors.green,
                  },
                ]}
              >
                {content.badgeLabel}
              </Text>
            </View>

            <Text
              numberOfLines={1}
              style={[styles.source, { color: colors.muted }]}
            >
              {sourceLabel}
            </Text>
          </View>

          <Text
            numberOfLines={1}
            style={[styles.title, { color: colors.text }]}
          >
            {content.title}
          </Text>

          <Text
            numberOfLines={3}
            style={[styles.snippet, { color: colors.subText }]}
          >
            {content.snippet}
          </Text>

          <View style={styles.statsRow}>
            <MaterialIcons name="mode-comment" size={14} color={colors.muted} />
            <Text style={[styles.statsText, { color: colors.muted }]}>
              {content.commentsCount} comentarios
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => onPressAction?.(content)}
        accessibilityRole="button"
        accessibilityLabel={`Ver ${content.badgeLabel}`}
        style={({ pressed }) => [
          styles.actionButton,
          { backgroundColor: colors.surfaceSoft },
          pressed && styles.actionPressed,
        ]}
      >
        <MaterialIcons name="chevron-right" size={20} color={colors.subText} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 118,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    maxWidth: 150,
    minHeight: 22,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  source: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  snippet: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  actionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});
