import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { FeedCommentsColors, FeedCommentsContext } from '../../types/comments';

type FeedCommentsContextCardProps = {
  context: FeedCommentsContext;
  colors: FeedCommentsColors;
};

export default function FeedCommentsContextCard({
  context,
  colors,
}: FeedCommentsContextCardProps) {
  const sectionLabel =
    context.eyebrow.toLowerCase() === 'clube' ? 'Respostas' : 'Comentários';

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceContainer,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: context.accentSoft },
              ]}
            >
              <MaterialIcons
                name={context.icon}
                size={18}
                color={context.accentColor}
              />
            </View>

            <Text style={[styles.eyebrow, { color: colors.onSurface }]}>
              {context.eyebrow}
            </Text>
          </View>

          <View
            style={[
              styles.badge,
              { backgroundColor: context.accentSoft },
            ]}
          >
            <Text style={[styles.badgeText, { color: context.accentColor }]}>
              {context.badge}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.quoteWrap,
            { borderLeftColor: context.accentColor },
          ]}
        >
          <Text style={[styles.text, { color: colors.onSurface }]}>
            {context.text}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.likesWrap}>
            <MaterialIcons
              name="favorite"
              size={15}
              color={context.accentColor}
            />
            <Text style={[styles.likesText, { color: context.accentColor }]}>
              {context.likesCountLabel}
            </Text>
          </View>

          <Text style={[styles.metaText, { color: colors.outline }]}>
            {context.meta}
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.divider,
            { backgroundColor: colors.outlineVariant },
          ]}
        />
        <Text style={[styles.sectionTitle, { color: colors.outline }]}>
          {sectionLabel}
        </Text>
        <View
          style={[
            styles.divider,
            { backgroundColor: colors.outlineVariant },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quoteWrap: {
    borderLeftWidth: 4,
    paddingLeft: 14,
    paddingVertical: 2,
    marginBottom: 14,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  likesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  likesText: {
    fontSize: 12,
    fontWeight: '800',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },
  sectionHeader: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
});