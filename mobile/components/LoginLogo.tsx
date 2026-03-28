import React from 'react';
import { StyleSheet, View } from 'react-native';
import LogoDark from '../assets/icons/logo-dark.svg';
import LogoLight from '../assets/icons/logo-light.svg';

type LoginLogoProps = {
  size?: number;
  dark?: boolean;
};

export default function LoginLogo({
  size = 80,
  dark = false,
}: LoginLogoProps) {
  const LogoComponent = dark ? LogoDark : LogoLight;
  const iconSize = size * 0.76;

  return (
    <View
      style={[
        styles.logoBox,
        {
          width: size,
          height: size,
          borderRadius: size * 0.15,
        },
      ]}
    >
      <LogoComponent
        width={iconSize}
        height={iconSize}
        style={styles.logoSvg}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoBox: {
    backgroundColor: '#3e6657',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '3deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    overflow: 'hidden',
  },
  logoSvg: {
    alignSelf: 'center',
  },
});