import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer'; // Built into newer react-native environments or handled via array buffers
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SpenderProfileScreen() {
  const router = useRouter();
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
        setRole(profile.role || 'Spender');
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
      // 1. Request library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Payton needs gallery access to upload a profile photo.');
        return;
      }

      // 2. Launch picker UI
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6, // Compresses image to save storage space and bandwidth
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

      // 3. Define file naming protocol (uses userId so files overwrite cleanly instead of piling up)
      const filePath = `${user.id}/avatar.jpg`;
      
      // 4. Upload base64 encoded file directly to Supabase Storage Bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(asset.base64), {
          contentType: 'image/jpeg',
          upsert: true, // Overwrites old profile picture file automatically
        });

      if (uploadError) throw uploadError;

      // 5. Build public storage location link
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 6. Save publicUrl string directly into user profile database column row
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
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#58B0A5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Avatar Profile Photo Circle Component containing conditional rendering */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={pickAndUploadImage} disabled={isUploadingImage}>
              {isUploadingImage ? (
                <View style={[styles.avatarPlaceholder, styles.center]}>
                  <ActivityIndicator color="#58B0A5" />
                </View>
              ) : avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={54} color="#8A9A93" />
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.avatarBadge} onPress={pickAndUploadImage} disabled={isUploadingImage}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{fullName || "User Profile"}</Text>
          
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{role.toUpperCase()}</Text>
          </View>

          {/* Account Modification Form Fields */}
          <View style={styles.form}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your Full Name"
              placeholderTextColor="#8A9A93"
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>Registered Email Address</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={email}
              editable={false}
              selectTextOnFocus={false}
            />

            <TouchableOpacity 
              style={[styles.saveButton, isUpdating && styles.disabledButton]} 
              onPress={handleUpdateProfile}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={[styles.logoutButton, isLoggingOut && styles.disabledButton]} 
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.logoutButtonText}>Log Out</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F8' },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: 24, alignItems: 'center', paddingTop: 40 },
  
  // Avatar Styles
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatarWrapper: { overflow: 'hidden', borderRadius: 53 },
  avatarPlaceholder: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarImage: {
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    backgroundColor: '#58B0A5', 
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  title: { fontSize: 24, fontWeight: 'bold', color: '#1B3623', marginBottom: 6 },
  roleBadge: {
    backgroundColor: '#E0F2FE', 
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 32,
  },
  roleBadgeText: { color: '#0369A1', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },

  form: { width: '100%' },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#1B3623', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1B3623',
    marginBottom: 20,
  },
  disabledInput: { backgroundColor: '#EDF2F7', color: '#718096' },
  saveButton: {
    backgroundColor: '#1B3623',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#E2E8F0', width: '100%', marginVertical: 32 },

  logoutButton: {
    backgroundColor: '#58B0A5',
    borderRadius: 12,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#58B0A5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  disabledButton: { backgroundColor: '#A3B4AB' },
  logoutButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});