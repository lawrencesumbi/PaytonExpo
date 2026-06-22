import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SponsorProfileScreen() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Profile data from database
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error("No active user session found.");

      setEmail(user.email || '');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profile) {
        setFullName(profile.full_name || '');
        setRole(profile.role || 'Sponsor');
        setAvatarUrl(profile.avatar_url || null);
      }
    } catch (error: any) {
      Alert.alert("Profile Error", error.message);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const pickAndUploadImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Payton needs gallery access to upload a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        backgroundRotation: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert("Error", "Could not process image data stream.");
        return;
      }

      setIsUploadingImage(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const filePath = `${user.id}/avatar.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(asset.base64), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (dbError) throw dbError;

      setAvatarUrl(publicUrl);
      Alert.alert("Success", "Profile photo updated successfully!");
    } catch (error: any) {
      Alert.alert("Upload Failed", error.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert("Validation Error", "Full Name field cannot be left blank.");
      return;
    }

    try {
      setIsUpdating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert("Success", "Account records saved successfully.");
    } catch (error: any) {
      Alert.alert("Update Failed", error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Validation Error", "Please fill in both password fields.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Validation Error", "New password must be at least 6 characters long.");
      return;
    }

    try {
      setIsUpdating(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      Alert.alert("Success", "Password updated successfully.");
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      Alert.alert("Security Update Failed", error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of Payton?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            setIsLoggingOut(true);
            const { error } = await supabase.auth.signOut();
            setIsLoggingOut(false);

            if (error) {
              Alert.alert("Error", error.message);
            } else {
              router.replace('/');
            }
          }
        }
      ]
    );
  };

  if (isLoadingProfile) {
    return (
      <SafeAreaView style={[styles.container, styles.centerLoading]}>
        <ActivityIndicator size="large" color="#2D7A5E" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Profile</Text>
            </View>
            <TouchableOpacity style={styles.settingsIcon}>
              <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card */}
        <LinearGradient
          colors={['#0A1A1A', '#1A3A3A', '#2D7A5E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.profileInfo}>
            <View style={styles.profileImageContainer}>
              <TouchableOpacity onPress={pickAndUploadImage} disabled={isUploadingImage}>
                {isUploadingImage ? (
                  <View style={[styles.profileImagePlaceholder, styles.centerLoading]}>
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                ) : avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Ionicons name="person" size={44} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.editImageButton} onPress={pickAndUploadImage} disabled={isUploadingImage}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.profileTextWrapper}>
              <Text style={styles.profileName} numberOfLines={1}>{fullName || "Sponsor Node"}</Text>
              <Text style={styles.profileEmail} numberOfLines={1}>{email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{role.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Profile Completion Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Completion</Text>
          <View style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionPercentage}>100%</Text>
            </View>
            <View style={styles.completionItem}>
              <Text style={styles.completionLabel}>Account Setup</Text>
              <View style={styles.completionBar}>
                <View style={[styles.completionFill, { width: '100%' }]} />
              </View>
              <Text style={styles.completionPercent}>100%</Text>
            </View>
            <View style={styles.completionItem}>
              <Text style={styles.completionLabel}>Profile Image</Text>
              <View style={styles.completionBar}>
                <View style={[styles.completionFill, { width: avatarUrl ? '100%' : '0%' }]} />
              </View>
              <Text style={styles.completionPercent}>{avatarUrl ? '100%' : '0%'}</Text>
            </View>
          </View>
        </View>

        {/* Personal Information Modification Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <TextInput
              style={styles.editableInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Edit your name"
              placeholderTextColor="#6B7280"
              autoCapitalize="words"
            />
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.saveButton, isUpdating && styles.disabledButton]} 
            onPress={handleUpdateProfile}
            disabled={isUpdating}
          >
            {isUpdating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>

        {/* Security / Password Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.securityRow}>
            <Text style={styles.securityLabel}>Current Password</Text>
            <TextInput
              style={styles.securityInput}
              placeholder="Enter current password"
              placeholderTextColor="#6B7280"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
          </View>
          <View style={styles.securityRow}>
            <Text style={styles.securityLabel}>New Password</Text>
            <TextInput
              style={styles.securityInput}
              placeholder="Enter new password"
              placeholderTextColor="#6B7280"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>
          <TouchableOpacity 
            style={[styles.saveButton, styles.updatePasswordButton, isUpdating && styles.disabledButton]}
            onPress={handleUpdatePassword}
            disabled={isUpdating}
          >
            {isUpdating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Update Password</Text>}
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, isLoggingOut && styles.disabledButton]} 
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.logoutContent}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.footerSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F0F' },
  centerLoading: { justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  settingsIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A2A2A', justifyContent: 'center', alignItems: 'center' },
  
  // Profile Card Styles
  profileCard: { marginHorizontal: 20, padding: 20, borderRadius: 20, marginBottom: 20 },
  profileInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  profileTextWrapper: { flex: 1 },
  profileImageContainer: { position: 'relative' },
  profileImagePlaceholder: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  profileImage: { width: 70, height: 70, borderRadius: 35 },
  editImageButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2D7A5E', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0A0F0F' },
  profileName: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 2, borderRadius: 12, alignSelf: 'flex-start', marginTop: 6 },
  roleText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF', letterSpacing: 0.5 },
  
  // Sections Layout
  section: { backgroundColor: '#1A2A2A', marginHorizontal: 20, padding: 20, borderRadius: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 16 },
  completionCard: { backgroundColor: '#0A0F0F', borderRadius: 12, padding: 16 },
  completionHeader: { alignItems: 'center', marginBottom: 12 },
  completionPercentage: { fontSize: 28, fontWeight: '700', color: '#4ADE80' },
  completionItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  completionLabel: { flex: 0.4, fontSize: 13, color: '#FFFFFF' },
  completionBar: { flex: 0.5, height: 6, backgroundColor: '#2A3A3A', borderRadius: 3, marginHorizontal: 8, overflow: 'hidden' },
  completionFill: { height: '100%', backgroundColor: '#4ADE80', borderRadius: 3 },
  completionPercent: { flex: 0.1, fontSize: 12, color: '#9CA3AF', textAlign: 'right' },
  
  // Input Handling
  infoRow: { marginBottom: 12 },
  infoLabel: { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },
  infoValue: { fontSize: 15, color: '#FFFFFF', fontWeight: '500', paddingLeft: 4, paddingTop: 4 },
  editableInput: { backgroundColor: '#0A0F0F', borderWidth: 1, borderColor: '#2A3A3A', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, color: '#FFFFFF' },
  saveButton: { backgroundColor: '#2D7A5E', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  updatePasswordButton: { marginTop: 4 },
  securityRow: { marginBottom: 12 },
  securityLabel: { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },
  securityInput: { backgroundColor: '#0A0F0F', borderWidth: 1, borderColor: '#2A3A3A', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#FFFFFF' },
  
  // Logout Actions
  logoutButton: { backgroundColor: '#1A2A2A', marginHorizontal: 20, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2A3A3A', marginBottom: 20 },
  logoutContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  disabledButton: { opacity: 0.5 },
  logoutButtonText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
  footerSpacing: { height: 20 }
});