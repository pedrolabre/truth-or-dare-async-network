import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type ChallengeType = 'truth' | 'dare';

type CreateChallengeTypeCardProps = {
  type: ChallengeType;
  selected: boolean;
  title: string;
  description: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  backgroundColor: string;
  borderColor: string;
  titleColor?: string;
  descriptionColor?: string;
  iconColor: string;
  accentColor: string;
  ghostIconName: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
};

export default function CreateChallengeTypeCard({
  type,
  selected,
  title,
  description,
  iconName,
  backgroundColor,
  borderColor,
  titleColor = '#ffffff',
  descriptionColor = 'rgba(255,255,255,0.90)',
  iconColor,
  accentColor,
  ghostIconName,
  onPress,
}: CreateChallengeTypeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor,
          borderColor: selected ? borderColor : 'transparent',
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        <MaterialIcons name={iconName} size={34} color={iconColor} />

        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
          <Text style={[styles.description, { color: descriptionColor }]}>
            {description}
          </Text>
        </View>
      </View>

      {selected ? (
        <View style={[styles.selectedBadge, { backgroundColor: accentColor }]}>
          <MaterialIcons name="check" size={16} color="#ffffff" />
        </View>
      ) : null}

      <MaterialIcons
        name={ghostIconName}
        size={96}
        color="rgba(255,255,255,0.10)"
        style={styles.ghostIcon}
      />

      {type === 'truth' ? (
        <View style={styles.topGlowLeft} />
      ) : (
        <View style={styles.topGlowRight} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 220,
    borderRadius: 20,
    borderWidth: 4,
    overflow: 'hidden',
    position: 'relative',
    padding: 22,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  textBlock: {
    marginTop: 24,
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: 2,
  },
  description: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  selectedBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  ghostIcon: {
    position: 'absolute',
    right: -8,
    bottom: -8,
  },
  topGlowLeft: {
    position: 'absolute',
    top: -28,
    left: -28,
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  topGlowRight: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 88,
    height: 88,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
});