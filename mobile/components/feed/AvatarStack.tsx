import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type AvatarStackProps = {
  participants: string[];
  extraCount: number;
  firstBackgroundColor: string;
  firstTextColor: string;
  secondBackgroundColor: string;
  secondTextColor: string;
  extraBackgroundColor: string;
  extraTextColor: string;
  extraBorderColor: string;
};

type AvatarProps = {
  label: string;
  backgroundColor: string;
  textColor: string;
};

function Avatar({ label, backgroundColor, textColor }: AvatarProps) {
  return (
    <View style={[styles.avatar, { backgroundColor }]}>
      <Text style={[styles.avatarText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

export default function AvatarStack({
  participants,
  extraCount,
  firstBackgroundColor,
  firstTextColor,
  secondBackgroundColor,
  secondTextColor,
  extraBackgroundColor,
  extraTextColor,
  extraBorderColor,
}: AvatarStackProps) {
  const first = participants[0] ?? '';
  const second = participants[1] ?? '';

  return (
    <View style={styles.avatarStack}>
      <Avatar
        label={first}
        backgroundColor={firstBackgroundColor}
        textColor={firstTextColor}
      />

      <View style={styles.avatarOverlap}>
        <Avatar
          label={second}
          backgroundColor={secondBackgroundColor}
          textColor={secondTextColor}
        />
      </View>

      <View
        style={[
          styles.extraAvatar,
          {
            backgroundColor: extraBackgroundColor,
            borderColor: extraBorderColor,
          },
        ]}
      >
        <Text style={[styles.extraAvatarText, { color: extraTextColor }]}>
          +{extraCount}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '900',
  },
  extraAvatar: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    borderWidth: 2,
  },
  extraAvatarText: {
    fontSize: 10,
    fontWeight: '900',
  },
});