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
  };
};

export default function VerificationCodeBoxes({
  value,
  onChange,
  length = 6,
  colors,
}: Props) {
  const inputsRef = useRef<Array<TextInput | null>>([]);

  function handleChange(text: string, index: number) {
    const clean = text.replace(/[^0-9]/g, '');

    const currentArray = value.split('');
    currentArray[index] = clean;

    const newValue = currentArray.join('').slice(0, length);
    onChange(newValue);

    if (clean && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(
    e: { nativeEvent: { key: string } },
    index: number,
  ) {
    if (e.nativeEvent.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  }

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => {
        const char = value[index] || '';

        return (
          <TextInput
            key={index}
            ref={(ref) => {
              inputsRef.current[index] = ref;
            }}
            value={char}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            style={[
              styles.box,
              {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.inputBackground,
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