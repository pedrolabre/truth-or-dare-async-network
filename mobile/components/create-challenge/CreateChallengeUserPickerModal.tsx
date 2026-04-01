import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PickerUser = {
  id: string;
  name: string;
  initials: string;
};

type Props = {
  visible: boolean;
  users: PickerUser[];
  onClose: () => void;
  onSelectUser: (user: PickerUser) => void;
  COLORS: {
    surfaceBright?: string;
    surfaceContainerHigh: string;
    surfaceContainer: string;
    onSurface: string;
    outline: string;
    outlineVariant?: string;
    headerGreen: string;
    onSurfaceVariant: string;
  };
};

export default function CreateChallengeUserPickerModal({
  visible,
  users,
  onClose,
  onSelectUser,
  COLORS,
}: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) {
      setQuery('');
      Keyboard.dismiss();
    }
  }, [visible]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) =>
      user.name.toLowerCase().includes(normalizedQuery)
    );
  }, [query, users]);

  function handleClose() {
    Keyboard.dismiss();
    onClose();
  }

  function handleDismissKeyboard() {
    Keyboard.dismiss();
  }

  function handleSelectUser(user: PickerUser) {
    Keyboard.dismiss();
    onSelectUser(user);
    onClose();
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={handleDismissKeyboard}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
          style={styles.keyboardWrap}
        >
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: COLORS.surfaceContainerHigh,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={styles.handleWrap}>
              <View
                style={[
                  styles.handle,
                  {
                    backgroundColor:
                      COLORS.outlineVariant ?? 'rgba(255,255,255,0.18)',
                  },
                ]}
              />
            </View>

            <View style={styles.header}>
              <View style={styles.headerTextWrap}>
                <Text style={[styles.title, { color: COLORS.onSurface }]}>
                  Escolher usuário
                </Text>
                <Text
                  style={[styles.subtitle, { color: COLORS.onSurfaceVariant }]}
                >
                  Busque quem vai receber seu desafio.
                </Text>
              </View>

              <Pressable onPress={handleClose} hitSlop={8} style={styles.closeButton}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={COLORS.onSurface}
                />
              </Pressable>
            </View>

            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: COLORS.surfaceContainer,
                  borderColor:
                    COLORS.outlineVariant ?? 'rgba(255,255,255,0.08)',
                },
              ]}
            >
              <MaterialIcons name="search" size={20} color={COLORS.outline} />

              <TextInput
                placeholder="Buscar usuário..."
                placeholderTextColor={COLORS.outline}
                value={query}
                onChangeText={setQuery}
                style={[styles.input, { color: COLORS.onSurface }]}
                returnKeyType="search"
                autoCapitalize="words"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>

            {filteredUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <View
                  style={[
                    styles.emptyIconWrap,
                    { backgroundColor: COLORS.surfaceContainer },
                  ]}
                >
                  <MaterialIcons
                    name="person-search"
                    size={28}
                    color={COLORS.outline}
                  />
                </View>

                <Text style={[styles.emptyTitle, { color: COLORS.onSurface }]}>
                  Nenhum usuário encontrado
                </Text>

                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: COLORS.onSurfaceVariant },
                  ]}
                >
                  Tente buscar por outro nome.
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleSelectUser(item)}
                    style={({ pressed }) => [
                      styles.userItem,
                      {
                        borderBottomColor:
                          COLORS.outlineVariant ?? 'rgba(255,255,255,0.08)',
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: COLORS.headerGreen },
                      ]}
                    >
                      <Text style={styles.avatarText}>{item.initials}</Text>
                    </View>

                    <View style={styles.userInfo}>
                      <Text style={[styles.name, { color: COLORS.onSurface }]}>
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.userHint,
                          { color: COLORS.onSurfaceVariant },
                        ]}
                      >
                        Toque para selecionar
                      </Text>
                    </View>

                    <MaterialIcons
                      name="chevron-right"
                      size={22}
                      color={COLORS.outline}
                    />
                  </Pressable>
                )}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  keyboardWrap: {
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '86%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 10,
  },
  handle: {
    width: 54,
    height: 5,
    borderRadius: 999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
    paddingTop: 4,
  },
  title: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    marginTop: 18,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  listContent: {
    paddingTop: 14,
    paddingBottom: 12,
  },
  userItem: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
  },
  userHint: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.78,
  },
});