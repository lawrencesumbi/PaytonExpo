import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function SponsorLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#89B443', // Highlighting Sponsor role with your brand's Lime Green
        tabBarInactiveTintColor: '#8A9A93',
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#E2E8F0', paddingBottom: 4 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="business" size={size} color={color} /> }} />
      <Tabs.Screen name="allowance" options={{ title: 'Allowance', tabBarIcon: ({ color, size }) => <Ionicons name="gift" size={size} color={color} /> }} />
      <Tabs.Screen name="monitoring" options={{ title: 'Monitor', tabBarIcon: ({ color, size }) => <Ionicons name="analytics" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tabs>
  );
}