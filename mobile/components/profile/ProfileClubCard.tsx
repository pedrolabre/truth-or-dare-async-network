import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  subTextColor: string;
  iconColor: string;
};

export default function ProfileClubCard({
  backgroundColor,
  borderColor,
  textColor,
  subTextColor,
  iconColor,
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
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="groups" size={24} color={iconColor} />
        </View>

        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: textColor }]}>
            Meus Clubes
          </Text>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            Seus clubes aparecerão aqui quando o backend estiver conectado.
          </Text>
        </View>
      </View>

      <MaterialIcons name="chevron-right" size={22} color={subTextColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 84,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(90,131,99,0.10)',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
});