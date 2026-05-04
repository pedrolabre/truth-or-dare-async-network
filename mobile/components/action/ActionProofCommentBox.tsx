import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

type ActionProofCommentBoxProps = {
  value: string;
  backgroundColor: string;
  borderColor: string;
  titleColor: string;
  descriptionColor: string;
  mutedTextColor: string;
  inputBackgroundColor: string;
  inputTextColor: string;
  placeholderTextColor: string;
  accentColor: string;
  onChangeText: (text: string) => void;
};

export default function ActionProofCommentBox({
  value,
  backgroundColor,
  borderColor,
  titleColor,
  descriptionColor,
  mutedTextColor,
  inputBackgroundColor,
  inputTextColor,
  placeholderTextColor,
  accentColor,
  onChangeText,
}: ActionProofCommentBoxProps) {
  const maxLength = 280;
  const remainingCharacters = maxLength - value.length;

  return (
    <View style={[styles.card, { backgroundColor, borderColor }]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: inputBackgroundColor }]}>
          <MaterialIcons name="notes" size={20} color={accentColor} />
        </View>

        <View style={styles.headerTextWrap}>
          <Text style={[styles.title, { color: titleColor }]}>
            Texto opcional
          </Text>

          <Text style={[styles.description, { color: descriptionColor }]}>
            Adicione uma observação curta para acompanhar sua prova.
          </Text>
        </View>
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Escreva uma observação opcional..."
        placeholderTextColor={placeholderTextColor}
        multiline
        maxLength={maxLength}
        textAlignVertical="top"
        style={[
          styles.input,
          {
            backgroundColor: inputBackgroundColor,
            borderColor,
            color: inputTextColor,
          },
        ]}
      />

      <View style={styles.footer}>
        <Text style={[styles.helperText, { color: mutedTextColor }]}>
          Esse texto será enviado junto com a prova quando o backend for integrado.
        </Text>

        <Text style={[styles.counterText, { color: mutedTextColor }]}>
          {remainingCharacters}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    gap: 5,
  },
  title: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  input: {
    minHeight: 112,
    maxHeight: 150,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 13,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  helperText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  counterText: {
    minWidth: 36,
    textAlign: 'right',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
});