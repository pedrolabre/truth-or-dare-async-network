import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FeedClubItem } from '../../types/feed';

type FeedCardClubProps = {
  item: FeedClubItem;
  backgroundColor: string;
  borderColor: string;
  iconBackgroundColor: string;
  iconColor: string;
  titleColor: string;
  badgeBackgroundColor: string;
  badgeTextColor: string;
  quoteBorderColor: string;
  quoteTextColor: string;
  metaColor: string;
  actionColor: string;
  onPressAnswers?: (id: string) => void;
};

export default function FeedCardClub({
  item,
  backgroundColor,
  borderColor,
  iconBackgroundColor,
  iconColor,
  titleColor,
  badgeBackgroundColor,
  badgeTextColor,
  quoteBorderColor,
  quoteTextColor,
  metaColor,
  actionColor,
  onPressAnswers,
}: FeedCardClubProps) {
  const hasClubName = item.clubName.trim().length > 0;
  const hasQuote = item.quote.trim().length > 0;
  const hasAnswers = item.answersCount > 0;

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
      <View style={styles.cardTopRow}>
        <View style={styles.clubHeaderLeft}>
          <View
            style={[
              styles.clubIconWrap,
              { backgroundColor: iconBackgroundColor },
            ]}
          >
            <MaterialIcons name="groups" size={18} color={iconColor} />
          </View>

          {hasClubName ? (
            <Text style={[styles.clubTitle, { color: titleColor }]}>{item.clubName}</Text>
          ) : (
            <View
              style={[
                styles.titlePlaceholder,
                { backgroundColor: titleColor, opacity: 0.1 },
              ]}
            />
          )}
        </View>

        <View style={[styles.badge, { backgroundColor: badgeBackgroundColor }]}>
          <Text style={[styles.badgeText, { color: badgeTextColor }]}>{item.badge}</Text>
        </View>
      </View>

      <View
        style={[
          styles.quoteWrap,
          {
            borderLeftColor: quoteBorderColor,
          },
        ]}
      >
        {hasQuote ? (
          <Text style={[styles.quoteText, { color: quoteTextColor }]}>{item.quote}</Text>
        ) : (
          <View style={styles.quotePlaceholderWrap}>
            <View
              style={[
                styles.quotePlaceholder,
                styles.quotePlaceholderLg,
                { backgroundColor: quoteTextColor, opacity: 0.08 },
              ]}
            />
            <View
              style={[
                styles.quotePlaceholder,
                styles.quotePlaceholderMd,
                { backgroundColor: quoteTextColor, opacity: 0.08 },
              ]}
            />
          </View>
        )}
      </View>

      <View style={styles.clubFooter}>
        {hasAnswers ? (
          <Text style={[styles.clubMeta, { color: metaColor }]}>
            {item.answersCount} pessoas responderam
          </Text>
        ) : (
          <View
            style={[
              styles.metaPlaceholder,
              { backgroundColor: metaColor, opacity: 0.12 },
            ]}
          />
        )}

        <Pressable
          onPress={() => onPressAnswers?.(item.id)}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Text style={[styles.clubAction, { color: actionColor }]}>VER RESPOSTAS</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
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
  clubHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    flex: 1,
  },
  clubIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  titlePlaceholder: {
    width: 140,
    height: 14,
    borderRadius: 999,
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
  quoteWrap: {
    borderLeftWidth: 4,
    paddingLeft: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  quotePlaceholderWrap: {
    gap: 12,
  },
  quotePlaceholder: {
    height: 18,
    borderRadius: 999,
  },
  quotePlaceholderLg: {
    width: '96%',
  },
  quotePlaceholderMd: {
    width: '74%',
  },
  clubFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  clubMeta: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaPlaceholder: {
    width: 132,
    height: 11,
    borderRadius: 999,
  },
  clubAction: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
});