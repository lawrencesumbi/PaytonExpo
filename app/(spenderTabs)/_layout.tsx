import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function SpenderLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#58B0A5', // Highlighting Spender role with your brand's Accent Teal
        tabBarInactiveTintColor: '#8A9A93',
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#E2E8F0', paddingBottom: 4 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="budget" options={{ title: 'Budget', tabBarIcon: ({ color, size }) => <Ionicons name="calculator" size={size} color={color} /> }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan Receipt', tabBarIcon: ({ color, size }) => <Ionicons name="camera" size={size} color={color} /> }} />
      <Tabs.Screen name="split" options={{ title: 'Group Split', tabBarIcon: ({ color, size }) => <Ionicons name="git-branch" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tabs>
  );
}