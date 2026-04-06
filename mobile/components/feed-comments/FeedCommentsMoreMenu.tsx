import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FeedCommentsColors } from '../../types/comments';

type FeedCommentsMoreMenuProps = {
  visible: boolean;
  colors: FeedCommentsColors;
  onClose: () => void;
  onPressShare: () => void;
  onPressMute: () => void;
  onPressReport: () => void;
};

export default function FeedCommentsMoreMenu({
  visible,
  colors,
  onClose,
  onPressShare,
  onPressMute,
  onPressReport,
}: FeedCommentsMoreMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.menu,
            {
              backgroundColor: colors.surfaceBright,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.item,
              pressed && styles.itemPressed,
            ]}
            onPress={onPressShare}
          >
            <View style={styles.itemLeft}>
              <MaterialIcons name="share" size={18} color={colors.outline} />
              <Text style={[styles.text, { color: colors.onSurface }]}>
                Compartilhar link
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.item,
              pressed && styles.itemPressed,
            ]}
            onPress={onPressMute}
          >
            <View style={styles.itemLeft}>
              <MaterialIcons
                name="notifications-off"
                size={18}
                color={colors.outline}
              />
              <Text style={[styles.text, { color: colors.onSurface }]}>
                Silenciar publicação
              </Text>
            </View>
          </Pressable>

          <View
            style={[
              styles.separator,
              { backgroundColor: colors.outlineVariant },
            ]}
          />

          <Pressable
            style={({ pressed }) => [
              styles.item,
              pressed && styles.itemPressed,
            ]}
            onPress={onPressReport}
          >
            <View style={styles.itemLeft}>
              <MaterialIcons name="flag" size={18} color="#D70015" />
              <Text style={[styles.text, { color: '#D70015', fontWeight: '700' }]}>
                Denunciar
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: 88,
    paddingRight: 16,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  menu: {
    width: 232,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  item: {
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 11,
    justifyContent: 'center',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    opacity: 0.35,
    marginTop: 4,
    marginBottom: 4,
    marginHorizontal: 10,
  },
  itemPressed: {
    opacity: 0.82,
  },
});