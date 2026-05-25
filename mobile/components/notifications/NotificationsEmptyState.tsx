import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  backgroundColor: string;
  borderColor: string;
  iconBackgroundColor: string;
  iconColor: string;
  titleColor: string;
  textColor: string;
};

export default function NotificationsEmptyState({
  backgroundColor,
  borderColor,
  iconBackgroundColor,
  iconColor,
  titleColor,
  textColor,
}: Props) {
  return (
    <View style={[styles.card, { backgroundColor, borderColor }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBackgroundColor }]}>
        <MaterialIcons name="notifications-none" size={30} color={iconColor} />
      </View>

      <Text style={[styles.title, { color: titleColor }]}>
        Nenhuma notificacao
      </Text>

      <Text style={[styles.text, { color: textColor }]}>
        Quando houver atividade dos seus clubes, ela aparecera aqui.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 320,
  },
});
