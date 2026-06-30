 import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter, useSegments } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function PersonalLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isChatScreen = segments.includes('chat');
  const isScanScreen = segments.includes('scan');
  const shouldHideAiButton = isChatScreen || isScanScreen;

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#10B981',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: Platform.OS === 'ios' ? 0 : 8 },
          tabBarStyle: isChatScreen ? { display: 'none' } : {
            backgroundColor: '#FFFFFF',
            height: Platform.OS === 'ios' ? 88 : 64,
            paddingTop: 8,
            borderTopWidth: 1,
            borderColor: '#F1F5F9',
          },
        }}
      >
        <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} /> }} />
        <Tabs.Screen name="budget" options={{ title: 'Budgets', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "wallet" : "wallet-outline"} size={22} color={color} /> }} />
        <Tabs.Screen name="scan" options={{ title: 'Scan', tabBarIcon: ({ focused }) => ( <View style={[styles.floatingButton, focused && styles.floatingButtonActive]}><Ionicons name={focused ? "camera" : "camera-outline"} size={24} color="#FFFFFF" /></View>) }} />
        <Tabs.Screen name="split" options={{ title: 'Split', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "share-social" : "share-social-outline"} size={22} color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} /> }} />
        
        {/* HIDDEN ROUTES */}
        <Tabs.Screen name="chat" options={{ href: null }} /> 
        <Tabs.Screen name="transaction" options={{ href: null }} />
        <Tabs.Screen name="statistics" options={{ href: null }} />
        <Tabs.Screen name="reminders" options={{ href: null }} />
        <Tabs.Screen name="friends" options={{ href: null }} />
        <Tabs.Screen name="category-dashboard" options={{ href: null }} />
      </Tabs>

      {!shouldHideAiButton && (
        <TouchableOpacity style={styles.floatingAiButton} onPress={() => router.push('/chat')} activeOpacity={0.8}>
          <Ionicons name="chatbubble-ellipses" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  floatingButton: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', top: -12, elevation: 5 },
  floatingButtonActive: { backgroundColor: '#059669', transform: [{ scale: 1.05 }] },
  floatingAiButton: { position: 'absolute', bottom: Platform.OS === 'ios' ? 105 : 90, right: 20, backgroundColor: '#005B60', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6 },
});