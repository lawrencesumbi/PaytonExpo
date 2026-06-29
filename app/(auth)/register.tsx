 // app/(auth)/register.tsx
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName, 
        }
      }
    });

    setIsLoading(false);

    if (error) {
      Alert.alert("Signup Failed", error.message);
    } else {
      router.push('/verify-email');
    }
  };

  return (
    <LinearGradient
      colors={['#f0fdf4', '#dcfce7']} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
          <View style={styles.innerContainer}>
            
            {/* Symmetric Oval Main Card Component */}
            <View style={styles.card}>
              
              <View style={styles.headerContainer}>
                <Text style={styles.titleText}>
                  Create an <Text style={styles.brandText}>Account</Text>
                </Text>
                <Text style={styles.subtitle}>
                  Sign up with your email and password to continue.
                </Text>
              </View>

              <View style={styles.form}>
                
                {/* Oval Custom Input Layout: Full Name */}
                <View style={styles.inputWrapper}>
                  <Feather name="user" color="#64748B" size={18} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#94A3B8"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    editable={!isLoading}
                  />
                </View>

                {/* Oval Custom Input Layout: Email */}
                <View style={styles.inputWrapper}>
                  <Feather name="mail" color="#64748B" size={18} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>

                {/* Oval Custom Input Layout: Password */}
                <View style={styles.inputWrapper}>
                  <Feather name="lock" color="#64748B" size={18} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)} 
                    style={styles.eyeIcon}
                    disabled={isLoading}
                  >
                    <Feather name={showPassword ? 'eye-off' : 'eye'} color="#94A3B8" size={18} />
                  </TouchableOpacity>
                </View>

                {/* Oval Custom Input Layout: Confirm Password */}
                <View style={styles.inputWrapper}>
                  <Feather name="lock" color="#64748B" size={18} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="#94A3B8"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)} 
                    style={styles.eyeIcon}
                    disabled={isLoading}
                  >
                    <Feather name={showPassword ? 'eye-off' : 'eye'} color="#94A3B8" size={18} />
                  </TouchableOpacity>
                </View>

                {/* Oval Submission Action Button */}
                <TouchableOpacity 
                  style={[styles.primaryButton, isLoading && { opacity: 0.8 }]} 
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Sign Up</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Symmetric Oval Third-Party Brand Sub-Buttons */}
              <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
                  <FontAwesome name="google" color="#34A853" size={18} style={styles.socialIcon} />
                  <Text style={styles.socialButtonText}>Google</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
                  <FontAwesome name="facebook-official" color="#1877F2" size={18} style={styles.socialIcon} />
                  <Text style={styles.socialButtonText}>Facebook</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/login')} disabled={isLoading}>
                  <Text style={styles.linkText}>Sign In</Text>
                </TouchableOpacity>
              </View>

            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center', // Centered alignment window now that logo space is cleared
  },
  innerContainer: { 
    paddingHorizontal: 16, 
    paddingVertical: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 44, 
    paddingHorizontal: 24,
    paddingVertical: 36,
    ...Platform.select({
      ios: {
        shadowColor: '#1e293b',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 28,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerContainer: { 
    marginBottom: 24,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  brandText: {
    color: '#166534', 
  },
  subtitle: { 
    fontSize: 14, 
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  form: { 
    width: '100%', 
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 30, 
    paddingHorizontal: 18,
    height: 54,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    height: '100%',
  },
  eyeIcon: {
    padding: 6,
  },
  primaryButton: {
    backgroundColor: '#166534',
    borderRadius: 30, 
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#166534',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#94A3B8',
    fontSize: 13,
    paddingHorizontal: 12,
    fontWeight: '500',
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 30, 
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  socialIcon: {
    marginRight: 10,
  },
  socialButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 4,
  },
  footerText: { 
    color: '#64748B', 
    fontSize: 14,
  },
  linkText: { 
    color: '#166534',
    fontWeight: '600', 
    fontSize: 14,
  },
});