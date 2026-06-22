import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      Alert.alert("Authentication Failed", authError.message);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      Alert.alert("Error", "Could not fetch user profile details.");
      return;
    }

    const userRole = profile.role;

    if (!userRole) {
      // Intercept users who haven't picked a role yet
      router.replace('/role-selection');
    } else if (userRole === 'Personal') {
      router.replace('/(personalTabs)/home');
    } else if (userRole === 'Spender') {
      router.replace('/(spenderTabs)/home');
    } else if (userRole === 'Sponsor') {
      router.replace('/(sponsorTabs)/home');
    }
  };

  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "white"}}>
        <View style={styles.innerContainer}>
          
          <View style={styles.headerContainer}>
            <Text style={styles.title}>
              Hello!{'\n'}Welcome to <Text style={styles.brandText}>Payton</Text>
            </Text>
            <Text style={styles.subtitle}>
              Access your account separately by using your email and password.
            </Text>
          </View>

          <View style={styles.form}>
            
            <View style={styles.inputWrapper}>
              <Feather name="mail" color="#085334" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#A0AEC0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Feather name="lock" color="#085334" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#A0AEC0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />

              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} color="#718096" size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.forgot} onPress={() => router.push('/forgot-password')}>Forgot Password?</Text>

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
            </View>

            <View style={styles.dividerContainer}>
              <Text style={styles.dividerText}>Or continue with</Text>
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialButtonText}>Continue with Apple</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  innerContainer: { 
    flex: 1, 
    paddingHorizontal: 28, 
    justifyContent: 'center' 
  },
  headerContainer: { 
    marginBottom: 40 
  },
  title: { 
    fontSize: 34, 
    fontWeight: 'bold', 
    color: '#000000', 
    lineHeight: 42,
    marginBottom: 12, 
  },
  brandText: {
    color: '#276916', 
  },
  subtitle: { 
    fontSize: 13, 
    color: '#0e9b59',
    lineHeight: 18,
  },
  form: { 
    width: '100%', 
    marginBottom: 20 
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f5ef',
    borderRadius: 30, 
    paddingHorizontal: 20,
    height: 58,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A202C',
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  primaryButton: {
    backgroundColor: '#204d3a',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#15492f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  dividerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerText: {
    color: '#0c9c6c',
    fontSize: 14,
  },
  socialContainer: {
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    backgroundColor: '#f3fdec',
    borderRadius: 30,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  socialButtonText: {
    color: '#1A202C',
    fontSize: 15,
    fontWeight: '500',
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  footerText: { 
    color: '#3e973b', 
    fontSize: 14 
  },
  linkText: { 
    color: '#07756c' ,
    fontWeight: 'bold', 
    fontSize: 14 
  },
  forgot: {
    color: "#3f7c77",
    textAlign: "right",
    marginBottom: 10,
  }
});