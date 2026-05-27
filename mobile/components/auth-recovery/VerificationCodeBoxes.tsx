import React, { useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

type Props = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  colors: {
    text: string;
    border: string;
    inputBackground: string;
    danger: string;
    successAccent?: string;
  };
  hasError?: boolean;
  isSuccess?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
};

export default function VerificationCodeBoxes({
  value,
  onChange,
  length = 6,
  colors,
  hasError = false,
  isSuccess = false,
  disabled = false,
  autoFocus = false,
  onSubmitEditing,
}: Props) {
  const inputsRef = useRef<(TextInput | null)[]>([]);

  function getValueChars() {
    return Array.from({ length }, (_, index) => value[index] ?? '');
  }

  function updateValue(chars: string[]) {
    onChange(chars.join('').slice(0, length));
  }

  function handleChange(text: string, index: number) {
    const clean = text.replace(/[^0-9]/g, '');
    const currentArray = getValueChars();

    if (!clean) {
      currentArray[index] = '';
      updateValue(currentArray);
      return;
    }

    if (clean.length > 1) {
      clean
        .slice(0, length - index)
        .split('')
        .forEach((char, offset) => {
          currentArray[index + offset] = char;
        });
      updateValue(currentArray);
      inputsRef.current[Math.min(index + clean.length, length - 1)]?.focus();
      return;
    }

    currentArray[index] = clean;
    updateValue(currentArray);

    if (clean && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(
    e: { nativeEvent: { key: string } },
    index: number,
  ) {
    if (e.nativeEvent.key === 'Backspace') {
      const currentArray = getValueChars();

      if (currentArray[index]) {
        currentArray[index] = '';
        updateValue(currentArray);
        return;
      }

      if (index > 0) {
        currentArray[index - 1] = '';
        updateValue(currentArray);
        inputsRef.current[index - 1]?.focus();
      }
    }
  }

  function handleSubmitEditing(index: number) {
    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
      return;
    }

    onSubmitEditing?.();
  }

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => {
        const char = value[index] || '';
        const borderColor = hasError
          ? colors.danger
          : isSuccess
            ? colors.successAccent ?? colors.border
            : colors.border;

        return (
          <TextInput
            key={index}
            ref={(ref) => {
              inputsRef.current[index] = ref;
            }}
            testID={`verification-code-digit-${index + 1}`}
            accessibilityLabel={`Digito ${index + 1} do codigo de recuperacao`}
            accessibilityState={{
              disabled,
            }}
            accessibilityHint={hasError ? 'Codigo com erro' : undefined}
            value={char}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onSubmitEditing={() => handleSubmitEditing(index)}
            keyboardType="number-pad"
            returnKeyType={index === length - 1 ? 'done' : 'next'}
            editable={!disabled}
            autoFocus={autoFocus && index === 0}
            maxLength={length}
            style={[
              styles.box,
              {
                borderColor,
                color: colors.text,
                backgroundColor: colors.inputBackground,
                opacity: disabled ? 0.72 : 1,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  box: {
    width: 50,
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
});
