export type ClubsThemeColors = {
  background: string;
  surface: string;
  surfaceSoft: string;
  surfaceStrong: string;

  text: string;
  subText: string;
  muted: string;

  green: string;
  greenSoft: string;
  red: string;
  redSoft: string;

  white: string;
  outline: string;
  cardBorder: string;
};

export const LIGHT_CLUBS_COLORS: ClubsThemeColors = {
  background: '#f5fbf6',
  surface: '#eaefea',
  surfaceSoft: '#eff5f0',
  surfaceStrong: '#dee4df',

  text: '#171d1a',
  subText: '#3d4944',
  muted: '#6d7a74',

  green: '#5A8363',
  greenSoft: 'rgba(90,131,99,0.10)',
  red: '#D70015',
  redSoft: 'rgba(215,0,21,0.10)',

  white: '#ffffff',
  outline: '#bccac2',
  cardBorder: 'rgba(188,202,194,0.45)',
};

export const DARK_CLUBS_COLORS: ClubsThemeColors = {
  background: '#121212',
  surface: '#232323',
  surfaceSoft: '#1b1d1b',
  surfaceStrong: '#333333',

  text: '#f5fbf6',
  subText: '#bccac2',
  muted: '#8f9993',

  green: '#5A8363',
  greenSoft: 'rgba(90,131,99,0.20)',
  red: '#E11D2E',
  redSoft: 'rgba(225,29,46,0.20)',

  white: '#f9f9f9',
  outline: '#444746',
  cardBorder: 'rgba(255,255,255,0.08)',
};