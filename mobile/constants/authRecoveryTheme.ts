export type AuthRecoveryPalette = {
  background: string;
  text: string;
  textMuted: string;
  textSoft: string;
  primary: string;
  primaryStrong: string;
  danger: string;
  white: string;
  black: string;
  border: string;
  inputBackground: string;
  cardBackground: string;
  timerBackground: string;
  decorationPrimary: string;
  decorationSecondary: string;
  successAccent: string;
};

export const LIGHT_AUTH_RECOVERY_COLORS: AuthRecoveryPalette = {
  background: '#f5fbf6',
  text: '#171d1a',
  textMuted: '#3d4944',
  textSoft: '#6d7a74',
  primary: '#5A8363',
  primaryStrong: '#006950',
  danger: '#D70015',
  white: '#ffffff',
  black: '#171d1a',
  border: '#bccac2',
  inputBackground: '#e4eae5',
  cardBackground: '#eaefea',
  timerBackground: '#eff5f0',
  decorationPrimary: '#008466',
  decorationSecondary: '#ffdad6',
  successAccent: '#5A8363',
};

export const DARK_AUTH_RECOVERY_COLORS: AuthRecoveryPalette = {
  background: '#121212',
  text: '#f5fbf6',
  textMuted: '#bccac2',
  textSoft: '#8f9993',
  primary: '#5A8363',
  primaryStrong: '#7fd6b4',
  danger: '#E11D2E',
  white: '#f9f9f9',
  black: '#000000',
  border: '#3d4944',
  inputBackground: '#232926',
  cardBackground: '#1c211f',
  timerBackground: '#232323',
  decorationPrimary: '#1e5c4a',
  decorationSecondary: '#4a1218',
  successAccent: '#7fd6b4',
};

export function getAuthRecoveryColors(isDark: boolean): AuthRecoveryPalette {
  return isDark ? DARK_AUTH_RECOVERY_COLORS : LIGHT_AUTH_RECOVERY_COLORS;
}