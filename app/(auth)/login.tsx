 import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animation for the logo highlight effect
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, { toValue: 1.1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scaleValue, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleDeepLink = async (url: string) => {
    const normalizedUrl = url.replace('#', '?');
    const parsedUrl = Linking.parse(normalizedUrl);
    const { access_token, refresh_token } = parsedUrl.queryParams || {};

    if (access_token && refresh_token) {
      setLoading(true);
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: access_token as string,
          refresh_token: refresh_token as string,
        });
        if (sessionError) throw sessionError;
        if (sessionData?.user) await handleProfileRouting(sessionData.user.id);
      } catch (err: any) {
        Alert.alert("Session Error", err.message || "Could not re-establish session.");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => handleDeepLink(event.url));
    Linking.getInitialURL().then((url) => { if (url) handleDeepLink(url); });
    return () => subscription.remove();
  }, []);

  const handleProfileRouting = async (userId: string) => {
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
    if (profileError || !profile) { Alert.alert("Error", "Could not fetch user profile details."); return; }
    if (!profile.role) router.replace('/role-selection');
    else if (profile.role === 'Personal') router.replace('/(personalTabs)/home');
    else if (profile.role === 'Spender') router.replace('/(spenderTabs)/home');
    else if (profile.role === 'Sponsor') router.replace('/(sponsorTabs)/home');
  };

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert("Missing Fields", "Please enter credentials."); return; }
    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData?.user) { Alert.alert("Authentication Failed", authError?.message); setLoading(false); return; }
    await handleProfileRouting(authData.user.id);
    setLoading(false);
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    try {
      const redirectTo = Linking.createURL('/login');
      const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
      if (error) throw error;
      if (data?.url) await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    } catch (e: any) { Alert.alert("Error", e.message); } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email) { Alert.alert("Email Required", "Please enter your email."); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: Linking.createURL('reset-password') });
    setLoading(false);
    if (error) Alert.alert("Reset Failed", error.message);
    else Alert.alert("Email Sent", "Check your inbox for the reset link.");
  };

  return (
    <LinearGradient colors={['#ffffff', '#ffffff']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
            <View style={styles.innerContainer}>
              <Animated.View style={[styles.gradientLogoContainer, { transform: [{ scale: scaleValue }] }]}>
                <Image source={require('../../assets/images/logo-light1.png')} style={styles.logoImage} resizeMode="contain" />
              </Animated.View>
              
              <View style={styles.card}>
                <View style={styles.headerContainer}>
                  <Text style={styles.titleText}>Sign In</Text>
                  <Text style={styles.subtitle}>Access your account securely.</Text>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputWrapper}>
                    <Feather name="mail" color="#64748B" size={16} style={styles.inputIcon} />
                    <TextInput style={styles.input} placeholder="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Feather name="lock" color="#64748B" size={16} style={styles.inputIcon} />
                    <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <Feather name={showPassword ? 'eye-off' : 'eye'} color="#94A3B8" size={16} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotWrapper}>
                    <Text style={styles.forgot}>Forgot Password?</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
                    {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Sign In</Text>}
                  </TouchableOpacity>
                </View>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} /><Text style={styles.dividerText}>or</Text><View style={styles.dividerLine} />
                </View>

                <View style={styles.socialContainer}>
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleOAuthLogin('google')}>
                    <FontAwesome5 name="google" color="#166534" size={16} style={styles.socialIcon} /><Text style={styles.socialButtonText}>Google</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleOAuthLogin('facebook')}>
                    <FontAwesome5 name="facebook" color="#166534" size={16} style={styles.socialIcon} /><Text style={styles.socialButtonText}>Facebook</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => router.push('/register')}><Text style={styles.linkText}>Sign Up</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center' },
  innerContainer: { paddingHorizontal: 20, paddingVertical: 10 },
  gradientLogoContainer: { 
    alignItems: 'center', justifyContent: 'center', marginBottom: 20, 
    height: 150, width: 150, borderRadius: 80, overflow: 'hidden',
    alignSelf: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#166534', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
      android: { elevation: 6 },
    }),
  },
  logoImage: { width: '60%', height: '60%' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 30, paddingHorizontal: 20, paddingVertical: 20, elevation: 5 },
  headerContainer: { marginBottom: 15, alignItems: 'center' },
  titleText: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  form: { width: '100%' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 25, paddingHorizontal: 15, height: 44, marginBottom: 10 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: '#0F172A', height: '100%' },
  eyeIcon: { padding: 5 },
  forgotWrapper: { alignSelf: 'flex-end', marginBottom: 12 },
  forgot: { color: '#166534', fontSize: 12, fontWeight: '600' },
  primaryButton: { backgroundColor: '#166534', borderRadius: 25, height: 46, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { color: '#94A3B8', fontSize: 12, paddingHorizontal: 10 },
  socialContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  socialButton: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 25, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  socialIcon: { marginRight: 8 },
  socialButtonText: { color: '#0F172A', fontSize: 13, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  footerText: { color: '#64748B', fontSize: 13 },
  linkText: { color: '#166534', fontWeight: '600', fontSize: 13 },
});