import * as Linking from 'expo-linking';
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from 'react';
// TODO: Adjust this path to match your actual Supabase client initialization file
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) return;

      // Extract parameters from everything after the '#' or '?' character
      const fragment = url.split('#')[1] || url.split('?')[1];
      if (!fragment) return;

      // Map query/hash string variables safely into a readable object
      const params = Object.fromEntries(
        fragment.split('&').map((param) => param.split('='))
      );

      const accessToken = params['access_token'];
      const refreshToken = params['refresh_token'];
      const type = params['type'];

      if (accessToken && refreshToken) {
        // Authenticate the session backend-side before loading the screen
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!error && type === 'recovery') {
          // Send them straight to your reset password screen once session is established
          router.replace('/reset-password');
        } else if (error) {
          console.error('Supabase deep link layout session injection failure:', error.message);
        }
      }
    };

    // Listen for links while the app processes processes in background memory
    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    // Check if the app caught an incoming link context right at boot up
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

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