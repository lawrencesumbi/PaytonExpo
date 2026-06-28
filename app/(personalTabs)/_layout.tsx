import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export default function PersonalLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#A0AEC0',
        tabBarStyle: styles.floatingTabBar,
      }}
    >
      {/* ----------------- MAKITA SA UBOS ----------------- */}
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
      
            {/* FLOATING SCAN TAB */}
            <Tabs.Screen 
              name="scan" 
              options={{ 
                title: 'Scan', 
                tabBarLabelStyle: {
                  // Gi-adjust ang label sa scan para dili matabunan sa floating button
                  marginBottom: Platform.OS === 'ios' ? -5 : 4,
                  fontSize: 11,
                  fontWeight: '600',
                },
                tabBarIcon: ({ focused }) => (
                  <View style={[styles.floatingButton, focused && styles.floatingButtonActive]}>
                    <Ionicons 
                      name={focused ? "camera" : "camera-outline"} 
                      size={24} 
                      color="#FFFFFF" // Puti ang icon para nindot tan-awon sa green background
                    />
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
      
            {/* ----------------- NAKATAGO (HIDDEN TABS) ----------------- */}
            <Tabs.Screen name="transaction" options={{ href: null }} />
            <Tabs.Screen name="statistics" options={{ href: null }} />
            <Tabs.Screen name="reminders" options={{ href: null }} />
            <Tabs.Screen name="friends" options={{ href: null }} />
            <Tabs.Screen name="invitations" options={{ href: null }} />
          </Tabs>
        );
      }

const styles = StyleSheet.create({
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
  inactiveIconWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  centerScannerContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    borderWidth: 4,
    borderColor: '#ffffff', 
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  floatingButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#10B981', // Gi-match sa imong Emerald Green
    justifyContent: 'center',
    alignItems: 'center',
    top: -12, // Mao ni ang nagpalutaw niya pataas
    
    // Shadow para sa floating effect
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  floatingButtonActive: {
    backgroundColor: '#059669', // Medyo mas mongitngit gamay nga green kung gi-click/active
    transform: [{ scale: 1.05 }], // Mo dako gamay para responsive feel
  },
});