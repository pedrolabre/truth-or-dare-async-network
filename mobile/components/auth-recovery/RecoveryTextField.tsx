import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  TextInputProps,
} from 'react-native';

type Props = TextInputProps & {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  colors: {
    text: string;
    textMuted: string;
    textSoft: string;
    border: string;
    inputBackground: string;
  };
};

export default function RecoveryTextField({
  label,
  value,
  onChangeText,
  colors,
  ...rest
}: Props) {
  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSoft }]}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text }]}
          {...rest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 8,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  inputContainer: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
  },
});