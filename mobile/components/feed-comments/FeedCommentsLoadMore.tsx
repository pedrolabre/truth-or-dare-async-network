import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { FeedCommentsColors } from '../../types/comments';

type FeedCommentsLoadMoreProps = {
  colors: FeedCommentsColors;
  isLoading?: boolean;
  hasMore?: boolean;
  onPress: () => void;
};

export default function FeedCommentsLoadMore({
  colors,
  isLoading = false,
  hasMore = true,
  onPress,
}: FeedCommentsLoadMoreProps) {
  if (!hasMore) {
    return (
      <View style={styles.endWrap}>
        <View
          style={[
            styles.endDivider,
            { backgroundColor: colors.outlineVariant },
          ]}
        />
        <Text style={[styles.endText, { color: colors.outline }]}>
          Não há mais comentários
        </Text>
        <View
          style={[
            styles.endDivider,
            { backgroundColor: colors.outlineVariant },
          ]}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: colors.surfaceContainer,
            borderColor: colors.outlineVariant,
            opacity: isLoading ? 0.9 : 1,
          },
          pressed && !isLoading && styles.pressed,
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.primary }]}>
              Carregando...
            </Text>
          </View>
        ) : (
          <View style={styles.content}>
            <MaterialIcons name="sync" size={18} color={colors.primary} />
            <Text style={[styles.text, { color: colors.primary }]}>
              Carregar mais comentários
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 8,
    paddingBottom: 18,
    alignItems: 'center',
  },
  button: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '800',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  endWrap: {
    paddingTop: 8,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  endDivider: {
    flex: 1,
    height: 1,
    opacity: 0.35,
  },
  endText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});