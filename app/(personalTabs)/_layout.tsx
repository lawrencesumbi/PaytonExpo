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
      <Tabs.Screen 
        name="home" 
        options={{ 
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabCircle : styles.inactiveIconWrapper}>
              <Ionicons name={focused ? "home" : "home-outline"} size={22} color={focused ? "#005B60" : color} />
            </View>
          ) 
        }} 
      />

      <Tabs.Screen 
        name="budget" 
        options={{ 
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabCircle : styles.inactiveIconWrapper}>
              <Ionicons name={focused ? "wallet" : "wallet-outline"} size={22} color={focused ? "#005B60" : color} />
            </View>
          ) 
        }} 
      />

      {/* CENTER SCANNER BUTTON WITH SMOOTH BORDER COUNTER-CUT */}
      <Tabs.Screen 
        name="reminders" 
        options={{ 
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabCircle : styles.inactiveIconWrapper}>
              <Ionicons name={focused ? "calendar" : "calendar-outline"} size={22} color={focused ? "#005B60" : color} />
            </View>
          ) 
        }} 
      />

      <Tabs.Screen 
        name="split" 
        options={{ 
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabCircle : styles.inactiveIconWrapper}>
              <Ionicons name={focused ? "layers" : "layers-outline"} size={22} color={focused ? "#005B60" : color} />
            </View>
          ) 
        }} 
      />

      <Tabs.Screen 
        name="profile" 
        options={{ 
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabCircle : styles.inactiveIconWrapper}>
              <Ionicons name={focused ? "person" : "person-outline"} size={22} color={focused ? "#005B60" : color} />
            </View>
          ) 
        }} 
      />
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
});