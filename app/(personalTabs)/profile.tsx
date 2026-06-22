import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function PersonalProfileScreen() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Profile fields fetched from database
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
        setRole(profile.role || 'Personal');
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
      Alert.alert("Validation Error", "Full Name cannot be blank.");
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

      Alert.alert("Success", "Account information updated successfully!");
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert("Update Failed", error.message);
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
        <ActivityIndicator size="large" color="#1B3623" />
      </SafeAreaView>
    );
  }

  // --- RENDERING SCREEN 2: EDIT PROFILE ---
  if (isEditing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.navButton} onPress={() => setIsEditing(false)}>
            <Ionicons name="chevron-back" size={22} color="#1B3623" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.avatarEditContainer}>
            <TouchableOpacity onPress={pickAndUploadImage} style={styles.avatarWrapper} disabled={isUploadingImage}>
              {isUploadingImage ? (
                <ActivityIndicator color="#1B3623" />
              ) : avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.editAvatarImage} />
              ) : (
                <Ionicons name="person" size={50} color="#8A9A93" />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.editCameraBadge} onPress={pickAndUploadImage} disabled={isUploadingImage}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.editProfileName}>{fullName || "User Name"}</Text>
          <Text style={styles.editProfileRole}>{role.toUpperCase()}</Text>

          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#8A9A93" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                value={fullName} 
                onChangeText={setFullName} 
                placeholder="Your Full Name"
                placeholderTextColor="#8A9A93"
                autoCapitalize="words"
              />
            </View>

            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[styles.inputWrapper, styles.disabledInputWrapper]}>
              <Ionicons name="mail-outline" size={18} color="#A3B4AB" style={styles.inputIcon} />
              <TextInput style={[styles.input, styles.disabledInput]} value={email} editable={false} />
            </View>

            <TouchableOpacity style={[styles.saveChangesBtn, isUpdating && styles.disabledButton]} onPress={handleUpdateProfile} disabled={isUpdating}>
              {isUpdating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveChangesBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- RENDERING SCREEN 1: PROFILE LIST MENU ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.navButton} onPress={() => setIsEditing(true)}>
          <Ionicons name="create-outline" size={20} color="#1B3623" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User Hero Row */}
        <View style={styles.heroRow}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.heroAvatar} />
          ) : (
            <View style={styles.heroAvatarPlaceholder}>
              <Ionicons name="person" size={32} color="#8A9A93" />
            </View>
          )}
          <View>
            <Text style={styles.heroName}>{fullName || "User Profile"}</Text>
            <Text style={styles.heroRole}>{role || "Personal"}</Text>
          </View>
        </View>

        {/* Menu Navigation Items matching image reference structure */}
        <View style={styles.menuContainer}>
          {[
            { id: 'personal', label: 'Personal Information', icon: 'person-outline', action: () => setIsEditing(true) },
            { id: 'payments', label: 'Payment Preferences', icon: 'wallet-outline' },
            { id: 'cards', label: 'Banks and Cards', icon: 'card-outline' },
            { id: 'notifications', label: 'Notifications', icon: 'notifications-outline', badge: '2' },
            { id: 'messages', label: 'Message Center', icon: 'chatbubble-outline' },
            { id: 'settings', label: 'Settings', icon: 'settings-outline' },
          ].map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.action}>
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={20} color="#586A61" />
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <View style={styles.menuItemRight}>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={16} color="#A3B4AB" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Logout Block */}
        <TouchableOpacity style={[styles.logoutBtn, isLoggingOut && styles.disabledButton]} onPress={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? (
            <ActivityIndicator color="#EF4444" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              <Text style={styles.logoutBtnText}>Log Out</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F8' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  
  // Custom Top Appbar Navigation Layout
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  navButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1B3623' },

  // Screen 1: Profile View List styles
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, marginVertical: 16 },
  heroAvatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#FFFFFF' },
  heroAvatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  heroName: { fontSize: 20, fontWeight: '700', color: '#1B3623' },
  heroRole: { fontSize: 13, color: '#586A61', marginTop: 2 },
  
  menuContainer: { marginTop: 20, borderTopWidth: 1, borderColor: '#E2E8F0' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 24, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuItemLabel: { fontSize: 15, color: '#1B3623', fontWeight: '500' },
  menuItemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

  // Screen 2: Edit Profile specific UI items
  avatarEditContainer: { alignSelf: 'center', position: 'relative', marginTop: 20 },
  avatarWrapper: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 3, borderColor: '#FFFFFF' },
  editAvatarImage: { width: '100%', height: '100%' },
  editCameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1B3623', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F7F9F8' },
  editProfileName: { color: '#1B3623', fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 16 },
  editProfileRole: { color: '#586A61', fontSize: 12, textAlign: 'center', marginTop: 4, letterSpacing: 0.5 },
  
  formContainer: { paddingHorizontal: 24, marginTop: 32 },
  inputLabel: { color: '#1B3623', fontSize: 13, fontWeight: '700', marginBottom: 8, paddingLeft: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, paddingHorizontal: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#1B3623', fontSize: 15, height: '100%' },
  disabledInputWrapper: { backgroundColor: '#EDF2F7', borderColor: '#E2E8F0' },
  disabledInput: { color: '#718096' },
  disabledButton: { backgroundColor: '#A3B4AB' },
  
  saveChangesBtn: { backgroundColor: '#1B3623', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveChangesBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 24, marginTop: 32, height: 54, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  logoutBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '600' }
});