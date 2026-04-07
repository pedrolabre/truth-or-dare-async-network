import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  name: string;
  username: string;
  bio?: string;
  initials: string;
  backgroundColor: string;
  textColor: string;
  subTextColor: string;
  onPressEdit: () => void;
  onPressPhoto: () => void;
};

export default function ProfileIdentityCard({
  name,
  username,
  bio,
  initials,
  backgroundColor,
  textColor,
  subTextColor,
  onPressEdit,
  onPressPhoto,
}: Props) {
  const safeInitials = initials?.trim() || '?';
  const safeName = name?.trim() || 'Seu nome';
  const safeUsername = username?.trim() || 'seu_usuario';

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{safeInitials}</Text>
        </View>

        <Pressable
          onPress={onPressPhoto}
          style={({ pressed }) => [
            styles.cameraButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name="photo-camera" size={16} color="#ffffff" />
        </Pressable>
      </View>

      <Text style={[styles.name, { color: textColor }]}>{safeName}</Text>

      <Text style={[styles.username, { color: subTextColor }]}>
        @{safeUsername}
      </Text>

      {bio ? (
        <Text style={[styles.bio, { color: subTextColor }]}>{bio}</Text>
      ) : null}

      <Pressable
        onPress={onPressEdit}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.pressed,
        ]}
      >
        <MaterialIcons name="settings" size={18} color="#ffffff" />
        <Text style={styles.primaryButtonText}>Editar Perfil</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  avatarWrap: {
    marginBottom: 14,
    position: 'relative',
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5A8363',
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 30,
    letterSpacing: -0.8,
  },
  cameraButton: {
    position: 'absolute',
    right: 6,
    bottom: 10,
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: '#D70015',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  name: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  username: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  bio: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 280,
  },
  primaryButton: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: '#D70015',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});