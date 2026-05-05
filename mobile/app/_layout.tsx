import { Stack } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup-screen" />

        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="verify-code" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="password-success" />

        <Stack.Screen
          name="feed"
          options={{ animation: 'none' }}
        />
        <Stack.Screen
          name="search"
          options={{ animation: 'none' }}
        />
        <Stack.Screen
          name="clubs"
          options={{ animation: 'none' }}
        />
        <Stack.Screen
          name="profile"
          options={{ animation: 'none' }}
        />

        <Stack.Screen name="feed-comments" />
        <Stack.Screen name="proof-detail" />
        <Stack.Screen name="create-challenge" />
        <Stack.Screen name="create-group" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="settings" />
      </Stack>
    </ThemeProvider>
  );
}