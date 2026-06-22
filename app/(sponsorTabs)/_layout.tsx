 // app/(sponsorTabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

export default function SponsorTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0CD964',
        tabBarInactiveTintColor: '#7DA08E',
        tabBarStyle: {
          backgroundColor: '#213502',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 20 : 6,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
          marginBottom: Platform.OS === 'ios' ? 2 : 0,
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'ios' ? 4 : 0,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={24} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="allowance"
        options={{
          title: 'Allowance',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Ionicons 
                name={focused ? "wallet" : "wallet-outline"} 
                size={24} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="monitoring"
        options={{
          title: 'Monitoring',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Ionicons 
                name={focused ? "list" : "list-outline"} 
                size={24} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Ionicons 
                name={focused ? "person" : "person-outline"} 
                size={24} 
                color={color} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 30,
    minHeight: 30,
  },
  tabIconActive: {
    backgroundColor: 'rgba(12, 217, 100, 0.15)',
  },
});