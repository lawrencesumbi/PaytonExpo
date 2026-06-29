 import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill out all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });

    setIsLoading(false);
    if (error) Alert.alert("Signup Failed", error.message);
    else router.push('/verify-email');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your journey with us today.</Text>
        </View>

        {/* The Card Layout */}
        <View style={styles.card}>
          <View style={styles.form}>
            {[
              { icon: 'user', placeholder: 'Full Name', value: fullName, setter: setFullName, type: 'words' },
              { icon: 'mail', placeholder: 'Email Address', value: email, setter: setEmail, type: 'none', keyboard: 'email-address' },
              { icon: 'lock', placeholder: 'Password', value: password, setter: setPassword, secure: true },
              { icon: 'lock', placeholder: 'Confirm Password', value: confirmPassword, setter: setConfirmPassword, secure: true },
            ].map((item, index) => (
              <View key={index} style={styles.inputWrapper}>
                <Feather name={item.icon as any} color="#64748B" size={18} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={item.placeholder}
                  placeholderTextColor="#94A3B8"
                  value={item.value}
                  onChangeText={item.setter}
                  secureTextEntry={item.secure && !showPassword}
                  autoCapitalize={item.type as any || 'none'}
                  keyboardType={item.keyboard as any || 'default'}
                />
                {item.secure && (
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Feather name={showPassword ? 'eye-off' : 'eye'} color="#94A3B8" size={18} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Sign Up</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.line} /><Text style={styles.dividerText}>or continue with</Text><View style={styles.line} />
        </View>

        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome5 name="google" color="#166534" size={16} /><Text style={styles.socialText}> Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome5 name="facebook" color="#166534" size={16} /><Text style={styles.socialText}> Facebook</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.footer} onPress={() => router.push('/login')}>
          <Text style={styles.footerText}>Already have an account? <Text style={styles.linkText}>Sign In</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContainer: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  headerContainer: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748B' },
  
  // Card Styles with Shadow
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  
  form: { width: '100%' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
    borderRadius: 25, paddingHorizontal: 16, height: 50, marginBottom: 12,
    borderWidth: 1, borderColor: '#E2E8F0'
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 14, color: '#0F172A' },
  primaryButton: { backgroundColor: '#166534', borderRadius: 25, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 10, color: '#94A3B8', fontSize: 12 },
  
  socialContainer: { flexDirection: 'row', gap: 12 },
  socialButton: { flex: 1, height: 48, borderRadius: 25, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  socialText: { fontSize: 13, fontWeight: '600', color: '#166534' },
  
  footer: { marginTop: 30, alignItems: 'center' },
  footerText: { color: '#64748B', fontSize: 14 },
  linkText: { color: '#166534', fontWeight: 'bold' }
});