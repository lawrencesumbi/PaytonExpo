import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F7F9F8' },
        }}
      >
        {/* The index is your welcome splash screen */}
        <Stack.Screen name="index" />
        
        {/* The (auth) group handles your sign-in flows */}
        <Stack.Screen name="(auth)" />
      </Stack>
    </>
  );
}