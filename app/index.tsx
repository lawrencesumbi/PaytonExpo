import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.contentContainer}>
        <Image 
          source={require('../assets/images/logo-light.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandName}>Payton</Text>
        <Text style={styles.tagline}>Your all-in-one financial companion.</Text>
      </View>

      <View style={styles.footerContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 60,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 24,
  },
  brandName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#050505',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 24,
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  button: {
    backgroundColor: '#1B3623',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#1B3623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});