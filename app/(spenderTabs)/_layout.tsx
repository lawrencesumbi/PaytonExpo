import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

export default function SpenderLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarInactiveTintColor: '#A0AEC0',
        tabBarStyle: styles.floatingTabBar,
      }}
    >
      {/* 1. HOME TAB */}
      <Tabs.Screen 
        name="home" 
        options={{ 
          tabBarIcon: ({ color, focused }) => 
            focused ? (
              <View style={styles.activePillBadge}>
                <Ionicons name="home" size={16} color="#000000" />
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
          tabBarIcon: ({ color, focused }) => 
            focused ? (
              <View style={styles.activePillBadge}>
                <Ionicons name="wallet" size={16} color="#000000" />
              </View>
            ) : (
              <Ionicons name="wallet-outline" size={22} color={color} />
            )
        }} 
      />

      {/* 3. SCAN RECEIPTS (Ang Floating U-Dip Scanner sa tunga) */}
      <Tabs.Screen 
        name="scan" 
        options={{ 
          tabBarIcon: () => (
            <View style={styles.centerScannerWrapper}>
              <View style={styles.uCurveBackground} />
              
              <View style={styles.actualScannerButton}>
                <Ionicons name="scan" size={24} color="#000000" />
              </View>
            </View>
          ) 
        }} 
      />

      {/* 4. SPLIT TAB */}
      <Tabs.Screen 
        name="split" 
        options={{ 
          tabBarIcon: ({ color, focused }) => 
            focused ? (
              <View style={styles.activePillBadge}>
                <Ionicons name="layers" size={16} color="#000000" />
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
          tabBarIcon: ({ color, focused }) => 
            focused ? (
              <View style={styles.activePillBadge}>
                <Ionicons name="person" size={16} color="#000000" />
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
    backgroundColor: '#0a666d', 
    borderRadius: 24,
    height: 45,
    borderTopWidth: 0,
    overflow: 'visible', 
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  activePillBadge: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#0ccec4c4', 
    width: 35,
    height: 35,
    borderRadius: 20,
    gap: 4,
  },
  centerScannerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    bottom: 14, 
    position: 'relative',
  },
  uCurveBackground: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF', 
    top: -6,
  },
  actualScannerButton: {
    width: 50,
    height: 50,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: { elevation: 3 },
    }),
  },
});