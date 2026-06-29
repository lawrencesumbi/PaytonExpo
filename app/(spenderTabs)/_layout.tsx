// app/(spenderTabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter, usePathname } from 'expo-router'; // Gidugang ang useRouter ug usePathname
import { Platform, StyleSheet, View, TouchableOpacity } from 'react-native'; // Gidugang ang TouchableOpacity

export default function SpenderLayout() {
  const router = useRouter();
  const pathname = usePathname();

  // I-check nato kung ang kasamtangan nga selyo/screen kay ang chat ba
  const isChatScreen = pathname === '/chat' || pathname.includes('chat');

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#10B981',   // Modern Emerald Green matching Friends UI
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
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 3, 
          },
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
        <Tabs.Screen name="chat" options={{ href: null }} /> 
        <Tabs.Screen name="transaction" options={{ href: null }} />
        <Tabs.Screen name="reminders" options={{ href: null }} />
        <Tabs.Screen name="statistics" options={{ href: null }} />
        <Tabs.Screen name="friends" options={{ href: null }} />
        <Tabs.Screen name="invitations" options={{ href: null }} />
      </Tabs>

      {/* ----------------- FLOATING AI COACH BUTTON (FAB) ----------------- */}
      {!isChatScreen && (
        <TouchableOpacity 
          style={styles.floatingAiButton} 
          onPress={() => router.push('/chat')} 
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </>
  );
}

// Gidugang nga Styles para sa Floating Effect
const styles = StyleSheet.create({
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