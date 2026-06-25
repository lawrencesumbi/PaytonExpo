import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Error", "Palihog og fill up sa tanang fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Dili pareha ang password ug confirm password.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert(
        "Success", 
        "Nailisan na og malampuson ang imong password!",
        [{ text: "Mao ba", onPress: () => router.replace('/login') }]
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <View style={styles.innerContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Isulod ang imong bag-ong password sa ubos.</Text>
        </View>

        <View style={styles.form}>
          {/* New Password */}
          <View style={styles.inputWrapper}>
            <Feather name="lock" color="#085334" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor="#A0AEC0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          {/* Confirm Password */}
          <View style={styles.inputWrapper}>
            <Feather name="lock" color="#085334" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              placeholderTextColor="#A0AEC0"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Feather name={showPassword ? 'eye-off' : 'eye'} color="#718096" size={20} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, loading && { opacity: 0.7 }]} 
            onPress={handleUpdatePassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Updating..." : "Update Password"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Pareha nga styles gihapon para limpyo tan-awon
const styles = StyleSheet.create({
  innerContainer: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },
  headerContainer: { marginBottom: 40 },
  title: { fontSize: 30, fontWeight: 'bold', color: '#000000', marginBottom: 12 },
  subtitle: { fontSize: 14, color: '#0e9b59', lineHeight: 18 },
  form: { width: '100%' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e6f5ef', borderRadius: 30, paddingHorizontal: 20, height: 58, marginBottom: 18 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#1A202C', height: '100%' },
  eyeIcon: { padding: 4 },
  primaryButton: { backgroundColor: '#204d3a', borderRadius: 30, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' }
});