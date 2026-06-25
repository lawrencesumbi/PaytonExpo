// app/(spenderTabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function SpenderLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0f6834',   // Premium Green/Dark Jade matching Spender UI
        tabBarInactiveTintColor: '#94A3B8', // Slate clean gray
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 8,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: Platform.OS === 'ios' ? 88 : 64, // Saktong gitas-on para sa safe device area
          paddingTop: 8,
          borderTopWidth: 1,
          borderColor: '#F1F5F9', // Solid clean line separator (dili karaan tan-awon)
          
          // Subtle standard shadow para dili flat kaayo ang transition gikan sa content
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.02,
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
        name="expenses" 
        options={{ 
          title: 'Expenses', 
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "wallet" : "wallet-outline"} size={22} color={color} />
          ) 
        }} 
      />
      
      <Tabs.Screen 
        name="reminders" 
        options={{ 
          title: 'Reminders', 
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={22} color={color} />
          ) 
        }} 
      />
      
      <Tabs.Screen 
        name="scan" 
        options={{ 
          title: 'Scan', 
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "qr-code" : "qr-code-outline"} size={22} color={color} />
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
        name="friends" 
        options={{ 
          title: 'Friends', 
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={22} color={color} />
          ) 
        }} 
      />
      
      <Tabs.Screen 
        name="invitations" 
        options={{ 
          title: 'Invites', 
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={22} color={color} />
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
    </Tabs>
  );
}