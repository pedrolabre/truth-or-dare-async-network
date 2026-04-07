import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  description?: string;
  backgroundColor: string;
  textColor: string;
  subTextColor: string;
  iconColor: string;
  borderColor: string;
  onPress?: () => void;
  rightText?: string;
};

export default function AccountMenuRow({
  icon,
  label,
  description,
  backgroundColor,
  textColor,
  subTextColor,
  iconColor,
  borderColor,
  onPress,
  rightText,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor,
          borderColor,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <MaterialIcons name={icon} size={20} color={iconColor} />
        </View>

        <View style={styles.textWrap}>
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
          {description ? (
            <Text style={[styles.description, { color: subTextColor }]}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      {rightText ? (
        <Text style={[styles.rightText, { color: subTextColor }]}>{rightText}</Text>
      ) : (
        <MaterialIcons name="chevron-right" size={20} color={subTextColor} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(90,131,99,0.10)',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  rightText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});