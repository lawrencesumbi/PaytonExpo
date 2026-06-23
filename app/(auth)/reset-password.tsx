import * as Linking from 'expo-linking'; // Import Linking to parse the URL
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const url = Linking.useURL(); // Hook to capture the deep link URL that opened the app

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);

  // Parse the URL when the component mounts or when a deep link is received
  useEffect(() => {
    if (url) {
      handleDeepLink(url);
    }
  }, [url]);

  const handleDeepLink = async (urlStr: string) => {
    try {
      const parsed = Linking.parse(urlStr);
      // Supabase passes parameters in the hash fragment (indicated by '#')
      // Extract access_token and refresh_token from the hash string
      const hash = parsed.queryParams?.['#'] || parsed.hash;
      
      if (hash) {
        // Simple manual parsing of the hash string into key-value pairs
        const params = Object.fromEntries(new URLSearchParams(hash));
        const accessToken = params.access_token;
        const refreshToken = params.refresh_token;

        if (accessToken && refreshToken) {
          // Explicitly set the active Supabase session
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;
          setIsSessionReady(true);
          return;
        }
      }
    } catch (e: any) {
      Alert.alert('Link Error', 'The recovery link is invalid or expired.');
    }
  };

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password should be at least 6 characters long.');
      return;
    }

    // Safety check ensuring we have established the user's session context
    if (!isSessionReady) {
      Alert.alert('Session Error', 'Please open this page using the link provided in your email.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      // Signing out after password update is highly recommended so they must re-log in
      await supabase.auth.signOut();

      Alert.alert(
        'Success', 
        'Your password has been securely updated.',
        [{ text: 'Login', onPress: () => router.replace('/login') }]
      );
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'An error occurred while updating your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Create a strong, new password for secure transactions.</Text>

        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor="#8A9A93"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          placeholderTextColor="#8A9A93"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity 
          style={[styles.primaryButton, (loading || !isSessionReady) && { opacity: 0.7 }]} 
          onPress={handleUpdatePassword}
          disabled={loading || !isSessionReady}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F8' },
  innerContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1B3623', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#586A61', marginBottom: 24 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1B3623',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#1B3623',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});