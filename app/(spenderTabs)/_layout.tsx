import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

export default function SpenderLayout() {
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
      {/* 1. HOME TAB */}
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: 'Home', 
          tabBarIcon: ({ color, focused }) => 
            focused ? (
              <View style={styles.activeTabBadgeCircle}>
                <Ionicons name="home" size={20} color="#FFFFFF" />
              </View>
            ) : (
              <Ionicons name="home-outline" size={22} color={color} />
            )
        }} 
      />

      {/* 2. BUDGET TAB */}
      <Tabs.Screen 
        name="budget" 
        options={{ 
          title: 'Budget', 
          tabBarIcon: ({ color, focused }) => 
            focused ? (
              <View style={styles.activeTabBadgeCircle}>
                <Ionicons name="wallet" size={20} color="#FFFFFF" />
              </View>
            ) : (
              <Ionicons name="wallet-outline" size={22} color={color} />
            )
        }} 
      />

      {/* 3. SCAN RECEIPTS TAB (Pabilin nga dako sa tunga) */}
      <Tabs.Screen 
        name="scan" 
        options={{ 
          title: 'Scan Receipt', 
          tabBarIcon: () => (
            <View style={styles.centerScannerContainer}>
              <Ionicons name="scan" size={24} color="#1A365D" />
            </View>
          ) 
        }} 
      />

      {/* 4. GROUP SPLIT TAB */}
      <Tabs.Screen 
        name="split" 
        options={{ 
          title: 'Group Split', 
          tabBarIcon: ({ color, focused }) => 
            focused ? (
              <View style={styles.activeTabBadgeCircle}>
                <Ionicons name="layers" size={20} color="#FFFFFF" />
              </View>
            ) : (
              <Ionicons name="layers-outline" size={22} color={color} />
            )
        }} 
      />

      {/* 5. PROFILE TAB */}
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile', 
          tabBarIcon: ({ color, focused }) => 
            focused ? (
              <View style={styles.activeTabBadgeCircle}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>
            ) : (
              <Ionicons name="person-outline" size={22} color={color} />
            )
        }} 
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingTabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 16, 
    left: 16,
    right: 16,
    backgroundColor: '#03857e',
    borderRadius: 24,
    width: '95%',
    height: 45,
    borderTopWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  activeTabBadgeCircle: {
    width: 40,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#a5d4fc', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerScannerContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff', 
    bottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});