 // app/(sponsorTabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

export default function SponsorTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0F5143', // Premium Emerald Green matching dashboard identity
        tabBarInactiveTintColor: '#94A3B8', // Minimal Slate Gray
        headerShown: false,
        tabBarShowLabel: true, 
        tabBarStyle: {
          position: 'absolute', // Pinaka-importante para mo-float
          bottom: Platform.OS === 'ios' ? 24 : 16, // Giduso pataas gikan sa ubos
          left: 16,
          right: 16,
          backgroundColor: '#FFFFFF',
          borderRadius: 20, // Rounded corners para mofloat tan-awon
          height: 66, 
          paddingTop: 4,
          paddingBottom: 4,
          borderTopWidth: 0, // Tangtangon ang standard layout border
          
          // Glassmorphism ug Soft Shadow Profile Config
          ...Platform.select({
            ios: {
              shadowColor: '#0F5143',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
            },
            android: {
              elevation: 6,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: -0.1,
          marginTop: 0,
          marginBottom: 4,
        },
        tabBarIconStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'center',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Ionicons name={focused ? "home" : "home-outline"} size={20} color={color} />
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
              <Ionicons name={focused ? "wallet" : "wallet-outline"} size={20} color={color} />
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
              <Ionicons name={focused ? "analytics" : "analytics-outline"} size={20} color={color} />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="members"
        options={{
          title: 'Members',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Ionicons name={focused ? "people" : "people-outline"} size={20} color={color} />
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
              <Ionicons name={focused ? "person" : "person-outline"} size={20} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 44,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',  
  },
  tabIconActive: {
    backgroundColor: '#E8F2EF',  
  },
});