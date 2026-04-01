import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type CreateChallengeComposerProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  labelColor: string;
  textColor: string;
  placeholderTextColor: string;
  backgroundColor: string;
  borderColor: string;
  actionBackgroundColor: string;
  actionIconColor: string;
  onPressRandom?: () => void;
};

export default function CreateChallengeComposer({
  label,
  value,
  onChangeText,
  placeholder,
  labelColor,
  textColor,
  placeholderTextColor,
  backgroundColor,
  borderColor,
  actionBackgroundColor,
  actionIconColor,
  onPressRandom,
}: CreateChallengeComposerProps) {
  return (
    <View style={styles.section}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>

      <View
        style={[
          styles.composerWrap,
          {
            backgroundColor,
            borderColor,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          multiline
          textAlignVertical="top"
          style={[styles.input, { color: textColor }]}
        />

        <View style={styles.actionWrap}>
          <Pressable
            onPress={onPressRandom}
            hitSlop={8}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: actionBackgroundColor },
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name="casino" size={22} color={actionIconColor} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  label: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  composerWrap: {
    minHeight: 170,
    borderWidth: 2,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  input: {
    minHeight: 170,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 60,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500',
  },
  actionWrap: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
  actionButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
});