import { MaterialIcons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';

type FeedFabProps = {
  backgroundColor: string;
  iconColor?: string;
  bottom?: number;
  right?: number;
  size?: number;
  onPress?: () => void;
  style?: ViewStyle;
};

export default function FeedFab({
  backgroundColor,
  iconColor = '#ffffff',
  bottom = 20,
  right = 16,
  size = 64,
  onPress,
  style,
}: FeedFabProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.94,
        useNativeDriver: true,
        speed: 22,
        bounciness: 4,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function handlePressOut() {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 22,
        bounciness: 6,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  }

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          bottom,
          right,
          width: size,
          height: size,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        hitSlop={8}
        style={[
          styles.button,
          {
            backgroundColor,
            borderRadius: size / 2,
          },
        ]}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <MaterialIcons name="add" size={32} color={iconColor} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: 30,
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});