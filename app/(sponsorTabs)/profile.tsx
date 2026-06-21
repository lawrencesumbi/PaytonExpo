import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SponsorProfileScreen() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of Payton?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            setIsLoggingOut(true);
            const { error } = await supabase.auth.signOut();
            setIsLoggingOut(false);

            if (error) {
              Alert.alert("Error", error.message);
            } else {
              router.replace('/');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sponsor Allocation Node</Text>
        <Text style={styles.subtitle}>Supervise dependent budgets, handle allowances, and observe metrics.</Text>
        
        {/* Logout Button matching Sponsor Lime Green Palette */}
        <TouchableOpacity 
          style={[styles.logoutButton, isLoggingOut && styles.disabledButton]} 
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.logoutButtonText}>Log Out</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F8' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1B3623', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#586A61', textAlign: 'center', marginBottom: 40 },
  logoutButton: {
    backgroundColor: '#89B443', // Dynamic role color: Lime Green
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#89B443',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#A3B4AB',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});