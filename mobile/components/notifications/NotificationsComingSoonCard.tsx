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

export default function NotificationsComingSoonCard({
  backgroundColor,
  borderColor,
  iconBackgroundColor,
  iconColor,
  titleColor,
  textColor,
}: Props) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBackgroundColor }]}>
        <MaterialIcons name="construction" size={30} color={iconColor} />
      </View>

      <Text style={[styles.title, { color: titleColor }]}>
        Novidades em breve
      </Text>

      <Text style={[styles.text, { color: textColor }]}>
        Estamos preparando novos recursos e integrações para esta área. Assim que
        o backend estiver conectado, suas notificações aparecerão aqui.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 74,
    height: 74,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
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
    lineHeight: 22,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 320,
  },
});