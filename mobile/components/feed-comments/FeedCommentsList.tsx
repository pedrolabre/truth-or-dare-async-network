import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import type { FeedComment, FeedCommentsColors } from '../../types/comments';
import FeedCommentItem from './FeedCommentItem';

type FeedCommentsListProps = {
  comments: FeedComment[];
  colors: FeedCommentsColors;
  ListHeaderComponent?: React.ReactElement;
  ListFooterComponent?: React.ReactElement;
  onPressLike: (commentId: string) => void;
  onPressReply: (commentId: string) => void;
};

export default function FeedCommentsList({
  comments,
  colors,
  ListHeaderComponent,
  ListFooterComponent,
  onPressLike,
  onPressReply,
}: FeedCommentsListProps) {
  return (
    <FlatList
      data={comments}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      renderItem={({ item }) => (
        <FeedCommentItem
          comment={item}
          colors={colors}
          onPressLike={onPressLike}
          onPressReply={onPressReply}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 18 }} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 120, // espaço para o composer
  },
});