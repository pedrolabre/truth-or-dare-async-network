import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

type Props = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  backgroundColor: string;
  textColor: string;
  subTextColor: string;
  iconColor: string;
  borderColor: string;
  trackColor: {
    false: string;
    true: string;
  };
  thumbColor: string;
};

export default function SettingsSwitchRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  backgroundColor,
  textColor,
  subTextColor,
  iconColor,
  borderColor,
  trackColor,
  thumbColor,
}: Props) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={[
        styles.row,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <MaterialIcons name={icon} size={26} color={iconColor} />
        </View>

        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          {description ? (
            <Text style={[styles.description, { color: subTextColor }]}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={trackColor}
        thumbColor={thumbColor}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 92,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
});