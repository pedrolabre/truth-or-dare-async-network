import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type {
  FeedCommentActionTarget,
  FeedCommentsColors,
} from '../../types/comments';

type FeedCommentActionsMenuProps = {
  visible: boolean;
  colors: FeedCommentsColors;
  target: FeedCommentActionTarget | null;
  onClose: () => void;
  onPressEdit: () => void;
  onPressDelete: () => void;
  onPressReport: () => void;
};

export default function FeedCommentActionsMenu({
  visible,
  colors,
  target,
  onClose,
  onPressEdit,
  onPressDelete,
  onPressReport,
}: FeedCommentActionsMenuProps) {
  const canEdit = Boolean(target?.canEdit);
  const canDelete = Boolean(target?.canDelete);
  const canReport = Boolean(target) && !canEdit && !canDelete;

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
          {canEdit ? (
            <Pressable
              style={({ pressed }) => [
                styles.item,
                pressed && styles.itemPressed,
              ]}
              onPress={onPressEdit}
            >
              <View style={styles.itemLeft}>
                <MaterialIcons name="edit" size={18} color={colors.outline} />
                <Text style={[styles.text, { color: colors.onSurface }]}>
                  Editar
                </Text>
              </View>
            </Pressable>
          ) : null}

          {canDelete ? (
            <Pressable
              style={({ pressed }) => [
                styles.item,
                pressed && styles.itemPressed,
              ]}
              onPress={onPressDelete}
            >
              <View style={styles.itemLeft}>
                <MaterialIcons name="delete-outline" size={18} color="#D70015" />
                <Text style={[styles.text, { color: '#D70015', fontWeight: '700' }]}>
                  Excluir
                </Text>
              </View>
            </Pressable>
          ) : null}

          {canReport ? (
            <>
              {(canEdit || canDelete) ? (
                <View
                  style={[
                    styles.separator,
                    { backgroundColor: colors.outlineVariant },
                  ]}
                />
              ) : null}

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
            </>
          ) : null}

          {!canEdit && !canDelete && !canReport ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                Nenhuma ação disponível.
              </Text>
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  menu: {
    width: 212,
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
  emptyState: {
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  itemPressed: {
    opacity: 0.82,
  },
});