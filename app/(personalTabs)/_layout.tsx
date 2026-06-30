import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter, useSegments } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function PersonalLayout() {
  const router = useRouter();
  const segments = useSegments();

  // Susiha kung naa ba sa chat o scan screen ang user
  const isChatScreen = segments.includes('chat');
  const isScanScreen = segments.includes('scan');

  // I-tago ang Floating AI Button kung naa sa chat OR scan
  const shouldHideAiButton = isChatScreen || isScanScreen;

  return (
    <View style={styles.container}>
      {/* ----------------- TAB NAVIGATION ----------------- */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true, // Gibalik ang labels para parehas sa previous
          tabBarActiveTintColor: '#10B981',   // Modern Emerald Green gikan sa previous
          tabBarInactiveTintColor: '#94A3B8', // Slate clean gray gikan sa previous
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: Platform.OS === 'ios' ? 0 : 8,
          },
          // Dynamic Styling: Gi-hide ang tibuok tab bar kung naa sa chat screen
          tabBarStyle: isChatScreen 
            ? { display: 'none' } 
            : {
                backgroundColor: '#FFFFFF', // Gibalik sa solid white design
                height: Platform.OS === 'ios' ? 88 : 64, 
                paddingTop: 8,
                borderTopWidth: 1,
                borderColor: '#F1F5F9', 
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 3, 
              },
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
            tabBarLabelStyle: {
              marginBottom: Platform.OS === 'ios' ? -5 : 4,
              fontSize: 11,
              fontWeight: '600',
            },
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
      </Tabs>

      {/* ----------------- FLOATING AI COACH BUTTON (FAB) ----------------- */}
      {!shouldHideAiButton && (
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