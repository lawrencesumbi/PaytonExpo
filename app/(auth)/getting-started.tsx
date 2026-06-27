 // app/(auth)/getting-started.tsx
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const DESIGN_COLORS = {
  bgDark: '#FFFFFF',       // Deep Dark Slate Gray base sa SwiftPay design reference
  brandGreen: '#84CC16',   // Neon / Lime Green para sa primary action button
  textLight: '#FFFFFF',
};

export default function GettingStartedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        
        { }
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logo-light1.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* 2. TEXT SECTION */}
        <View style={styles.textContainer}>
          <Text style={styles.heading}>Welcome to Payton</Text>
        </View>

        {/* 3. SINGLE FULL-WIDTH GET STARTED BUTTON (Direct to Login) */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.getStartedButton} 
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: DESIGN_COLORS.bgDark 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 28, 
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 60
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: { 
    width: 160, 
    height: 160,
  },
  textContainer: { 
    width: '100%', 
    alignItems: 'center', 
    marginBottom: 40
  },
  heading: { 
    color: DESIGN_COLORS.textLight, 
    fontSize: 28, 
    fontWeight: '700', 
    textAlign: 'center', 
  },
  actionContainer: { 
    width: '100%',
    alignItems: 'center',
  },
  getStartedButton: { 
    width: '100%', 
    backgroundColor: DESIGN_COLORS.brandGreen, 
    height: 56, 
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: DESIGN_COLORS.brandGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2
  },
  getStartedText: { 
    color: DESIGN_COLORS.bgDark, 
    fontSize: 16, 
    fontWeight: '700' 
  }
});