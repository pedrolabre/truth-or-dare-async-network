import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { FeedCommentsColors } from '../../types/comments';

type FeedCommentsShareModalProps = {
  visible: boolean;
  colors: FeedCommentsColors;
  onClose: () => void;
};

export default function FeedCommentsShareModal({
  visible,
  colors,
  onClose,
}: FeedCommentsShareModalProps) {
  function handleCopyLink() {
    console.log('Link copiado');
    onClose();
  }

  function handleShareExternally() {
    console.log('Compartilhar externamente');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.container,
            {
              backgroundColor: colors.surfaceBright,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <Pressable
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name="close" size={20} color={colors.outline} />
          </Pressable>

          <Text style={[styles.title, { color: colors.onSurface }]}>
            Compartilhar publicação
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.option,
              pressed && styles.optionPressed,
              {
                borderColor: colors.outlineVariant,
              },
            ]}
            onPress={handleShareExternally}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: 'rgba(37,211,102,0.14)' },
              ]}
            >
              <MaterialIcons name="forum" size={20} color="#25D366" />
            </View>

            <View style={styles.optionTextWrap}>
              <Text style={[styles.optionTitle, { color: colors.onSurface }]}>
                Compartilhar com outros apps
              </Text>
              <Text
                style={[styles.optionSubtitle, { color: colors.onSurfaceVariant }]}
              >
                Envie para contatos, grupos ou apps instalados
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.option,
              pressed && styles.optionPressed,
              {
                borderColor: colors.outlineVariant,
              },
            ]}
            onPress={handleCopyLink}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.greenBgSoft },
              ]}
            >
              <MaterialIcons name="link" size={20} color={colors.greenText} />
            </View>

            <View style={styles.optionTextWrap}>
              <Text style={[styles.optionTitle, { color: colors.onSurface }]}>
                Copiar link
              </Text>
              <Text
                style={[styles.optionSubtitle, { color: colors.onSurfaceVariant }]}
              >
                Link direto para esta publicação
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
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 14,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -2,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  option: {
    minHeight: 76,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  optionSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  optionPressed: {
    opacity: 0.86,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});