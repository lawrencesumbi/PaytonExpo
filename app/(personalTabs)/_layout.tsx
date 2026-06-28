import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter, useSegments } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function PersonalLayout() {
  const router = useRouter();
  const segments = useSegments();

  // Kani nga logic maoy mosusi kung ang user naa ba sa chat screen
  // Ang 'chat' magdepende kung unsa ang name sa imong folder/file (e.g., app/chat.tsx)
  const isChatScreen = segments.includes('chat');

  return (
    <View style={styles.container}>
      {/* ----------------- TAB NAVIGATION ----------------- */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#A0AEC0',
          // 🚨 DYNAMIC STYLING: Kung naa sa chat, i-display: 'none' nato ang tab bar
          tabBarStyle: isChatScreen ? { display: 'none' } : styles.floatingTabBar,
        }}
      >
        <Tabs.Screen 
          name="home" 
          options={{ 
            title: 'Home', 
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
            ) 
          }} 
        />
        
        <Tabs.Screen 
          name="budget" 
          options={{ 
            title: 'Budgets', 
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "wallet" : "wallet-outline"} size={22} color={color} />
            ) 
          }} 
        />
  
        <Tabs.Screen 
          name="scan" 
          options={{ 
            title: 'Scan', 
            tabBarIcon: ({ focused }) => (
              <View style={[styles.floatingButton, focused && styles.floatingButtonActive]}>
                <Ionicons name={focused ? "camera" : "camera-outline"} size={24} color="#FFFFFF" />
              </View>
            ) 
          }} 
        />
  
        <Tabs.Screen 
          name="split" 
          options={{ 
            title: 'Split', 
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "share-social" : "share-social-outline"} size={22} color={color} />
            ) 
          }} 
        />
  
        <Tabs.Screen 
          name="profile" 
          options={{ 
            title: 'Profile', 
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
            ) 
          }} 
        />
  
        {/* HIDDEN ROUTES */}
        <Tabs.Screen name="chat" options={{ href: null }} /> 
        <Tabs.Screen name="transaction" options={{ href: null }} />
        <Tabs.Screen name="statistics" options={{ href: null }} />
        <Tabs.Screen name="reminders" options={{ href: null }} />
        <Tabs.Screen name="friends" options={{ href: null }} />
        <Tabs.Screen name="invitations" options={{ href: null }} />
      </Tabs>

      {/* ----------------- FLOATING AI COACH BUTTON (FAB) ----------------- */}
      {/* 🚨 DYNAMIC HIDING: I-tago sad nato ang floating chat button kung naa na mismo sa sulod sa chat screen */}
      {!isChatScreen && (
        <TouchableOpacity 
          style={styles.floatingAiButton} 
          onPress={() => router.push('/chat')} 
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  floatingTabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20, 
    backgroundColor: '#005B60', 
    borderRadius: 30, 
    borderTopWidth: 0,
    height: 55,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginRight: 15,
    marginLeft: 15,
  },
  floatingButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#10B981', 
    justifyContent: 'center',
    alignItems: 'center',
    top: -12, 
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  floatingButtonActive: {
    backgroundColor: '#059669', 
    transform: [{ scale: 1.05 }], 
  },
  floatingAiButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 105 : 90, 
    right: 20, 
    backgroundColor: '#005B60', 
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});