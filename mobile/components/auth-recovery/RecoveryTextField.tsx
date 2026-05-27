import React from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  Text,
  TextInputProps,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = TextInputProps & {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  colors: {
    text: string;
    textMuted: string;
    textSoft: string;
    danger: string;
    border: string;
    inputBackground: string;
  };
  errorMessage?: string | null;
  showPasswordToggle?: boolean;
  passwordToggleTestID?: string;
  passwordToggleAccessibilityLabel?: string;
};

const RecoveryTextField = React.forwardRef<TextInput, Props>(
  function RecoveryTextField(
    {
      label,
      value,
      onChangeText,
      colors,
      errorMessage,
      showPasswordToggle = false,
      passwordToggleTestID,
      passwordToggleAccessibilityLabel,
      secureTextEntry,
      editable,
      ...rest
    },
    ref,
  ) {
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const hasError = Boolean(errorMessage);
    const canTogglePassword = showPasswordToggle && secureTextEntry;
    const isEditable = editable !== false;
    const shouldHidePassword = canTogglePassword
      ? !isPasswordVisible
      : secureTextEntry;

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
              borderColor: hasError ? colors.danger : colors.border,
            },
          ]}
        >
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholderTextColor={colors.textMuted}
            secureTextEntry={shouldHidePassword}
            editable={editable}
            style={[
              styles.input,
              canTogglePassword && styles.inputWithToggle,
              { color: colors.text },
            ]}
            {...rest}
          />

          {canTogglePassword ? (
            <Pressable
              onPress={() => setIsPasswordVisible((current) => !current)}
              disabled={!isEditable}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={
                passwordToggleAccessibilityLabel ??
                (isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha')
              }
              accessibilityState={{ disabled: !isEditable }}
              testID={passwordToggleTestID}
              style={styles.passwordToggle}
            >
              <MaterialIcons
                name={isPasswordVisible ? 'visibility-off' : 'visibility'}
                size={22}
                color={colors.textSoft}
              />
            </Pressable>
          ) : null}
        </View>

        {errorMessage ? (
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {errorMessage}
          </Text>
        ) : null}
      </View>
    );
  },
);

export default RecoveryTextField;

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  inputWithToggle: {
    paddingRight: 12,
  },
  passwordToggle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});
