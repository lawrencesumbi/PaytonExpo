import { Feather, FontAwesome } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient'; 
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Platform, Image } from 'react-native';
import { supabase } from '../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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

          if (sessionData?.user) {
            await handleProfileRouting(sessionData.user.id);
          }
        } catch (err: any) {
          Alert.alert("Session Error", err.message || "Could not re-establish session.");
        } finally {
          setLoading(false);
        }
      }
    };

    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleProfileRouting = async (userId: string) => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      Alert.alert("Error", "Could not fetch user profile details.");
      return;
    }

    const userRole = profile.role;

    if (!userRole) {
      router.replace('/role-selection');
    } else if (userRole === 'Personal') {
      router.replace('/(personalTabs)/home');
    } else if (userRole === 'Spender') {
      router.replace('/(spenderTabs)/home');
    } else if (userRole === 'Sponsor') {
      router.replace('/(sponsorTabs)/home');
    } else {
      Alert.alert("Error", "Unknown user role detected.");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both your email and password.");
      return;
    }

    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData?.user) {
      Alert.alert("Authentication Failed", authError?.message || "User data missing.");
      setLoading(false);
      return;
    }

    await handleProfileRouting(authData.user.id);
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const redirectTo = Linking.createURL('/login'); 

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        
        if (res.type === 'success' && res.url) {
          const normalizedUrl = res.url.replace('#', '?');
          const parsedUrl = Linking.parse(normalizedUrl);
          const { access_token, refresh_token } = parsedUrl.queryParams || {};

          if (access_token && refresh_token) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: access_token as string,
              refresh_token: refresh_token as string,
            });

            if (sessionError) throw sessionError;

            if (sessionData?.user) {
              await handleProfileRouting(sessionData.user.id);
            }
          }
        }
      }
    } catch (error: any) {
      Alert.alert("Google Login Error", error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    try {
      const redirectTo = Linking.createURL('/login'); 

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        
        if (res.type === 'success' && res.url) {
          const normalizedUrl = res.url.replace('#', '?');
          const parsedUrl = Linking.parse(normalizedUrl);
          const { access_token, refresh_token } = parsedUrl.queryParams || {};

          if (access_token && refresh_token) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: access_token as string,
              refresh_token: refresh_token as string,
            });

            if (sessionError) throw sessionError;

            if (sessionData?.user) {
              await handleProfileRouting(sessionData.user.id);
            }
          }
        }
      }
    } catch (error: any) {
      Alert.alert("Facebook Login Error", error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(
        "Email Required", 
        "Please enter your email address in the input field first so we know where to send the link."
      );
      return;
    }

    setLoading(true);
    const redirectUrl = Linking.createURL('reset-password');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl, 
    });

    setLoading(false);

    if (error) {
      Alert.alert("Reset Failed", error.message);
    } else {
      Alert.alert(
        "Email Sent", 
        "A password reset link has been sent to your email address. Please check your inbox."
      );
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
            
            {/* Highly Enlarged Logo Structure Layout Zone */}
            <View style={styles.gradientLogoContainer}>
              <Image 
                source={require('../../assets/images/logo-light1.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            
            {/* Symmetric Oval Main Card Component */}
            <View style={styles.card}>
              
              <View style={styles.headerContainer}>
                <Text style={styles.titleText}>Sign In</Text>
                <Text style={styles.subtitle}>
                  Access your account using your email and password.
                </Text>
              </View>

              <View style={styles.form}>
                {/* Oval Custom Input Layout */}
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
                    editable={!loading}
                  />
                </View>

                {/* Oval Custom Input Layout */}
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
                    editable={!loading}
                  />

                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)} 
                    style={styles.eyeIcon}
                    disabled={loading}
                  >
                    <Feather name={showPassword ? 'eye-off' : 'eye'} color="#94A3B8" size={18} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={handleForgotPassword} disabled={loading} style={styles.forgotWrapper}>
                  <Text style={styles.forgot}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Oval Submission Action Button */}
                <TouchableOpacity 
                  style={[styles.primaryButton, loading && { opacity: 0.8 }]} 
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Sign In</Text>
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
                <TouchableOpacity 
                  style={styles.socialButton} 
                  disabled={loading} 
                  onPress={handleGoogleLogin}
                >
                  <FontAwesome name="google" color="#34A853" size={18} style={styles.socialIcon} />
                  <Text style={styles.socialButtonText}>Google</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.socialButton} 
                  disabled={loading}
                  onPress={handleFacebookLogin}
                >
                  <FontAwesome name="facebook-official" color="#1877F2" size={18} style={styles.socialIcon} />
                  <Text style={styles.socialButtonText}>Facebook</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/register')} disabled={loading}>
                  <Text style={styles.linkText}>Sign Up</Text>
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
    justify: 'flex-end', 
  },
  innerContainer: { 
    paddingHorizontal: 16, 
    paddingBottom: 36, 
    paddingTop: 20,
  },
  gradientLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40, 
    width: '100%',
    height: 160, 
    ...Platform.select({
      ios: {
        shadowColor: '#166534',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoImage: {
    width: '100%', 
    height: '100%', 
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
  forgotWrapper: {
    alignSelf: 'flex-end',
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  forgot: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#166534',
    borderRadius: 30, 
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
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