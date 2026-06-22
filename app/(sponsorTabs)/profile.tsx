 // app/(sponsorTabs)/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SponsorProfileScreen() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Profile</Text>
            </View>
            <TouchableOpacity style={styles.settingsIcon}>
              <Ionicons name="settings-outline" size={22} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card - Sky Blue Gradient */}
        <LinearGradient
          colors={['#4FC3F7', '#0288D1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.profileInfo}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={50} color="#FFFFFF" />
              </View>
              <TouchableOpacity style={styles.editImageButton}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View>
              <Text style={styles.profileName}>Patricia Ann Mae Obaob</Text>
              <Text style={styles.profileEmail}>patriciaannmaeobaob721@gmail.com</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>SPONSOR</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Profile Completion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Completion</Text>
          <View style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionPercentage}>100%</Text>
            </View>
            <View style={styles.completionItem}>
              <Text style={styles.completionLabel}>Account Setup</Text>
              <View style={styles.completionBar}>
                <View style={[styles.completionFill, { width: '10%' }]} />
              </View>
              <Text style={styles.completionPercent}>10%</Text>
            </View>
            <View style={styles.completionItem}>
              <Text style={styles.completionLabel}>Profile Image</Text>
              <View style={styles.completionBar}>
                <View style={[styles.completionFill, { width: '20%' }]} />
              </View>
              <Text style={styles.completionPercent}>20%</Text>
            </View>
            <View style={styles.completionItem}>
              <Text style={styles.completionLabel}>Personal Info</Text>
              <View style={styles.completionBar}>
                <View style={[styles.completionFill, { width: '50%' }]} />
              </View>
              <Text style={styles.completionPercent}>50%</Text>
            </View>
            <View style={styles.completionItem}>
              <Text style={styles.completionLabel}>Security Set</Text>
              <View style={styles.completionBar}>
                <View style={[styles.completionFill, { width: '20%' }]} />
              </View>
              <Text style={styles.completionPercent}>20%</Text>
            </View>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>Patricia Ann Mae Obaob</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>patriciaannmaeobaob721@gmail.com</Text>
          </View>
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.securityRow}>
            <Text style={styles.securityLabel}>Current Password</Text>
            <TextInput
              style={styles.securityInput}
              placeholder="Enter current password"
              placeholderTextColor="#9CA3AF"
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
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>
          <TouchableOpacity style={[styles.saveButton, styles.updatePasswordButton]}>
            <Text style={styles.saveButtonText}>Update Password</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, isLoggingOut && styles.disabledButton]} 
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#DC2626" />
          ) : (
            <View style={styles.logoutContent}>
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
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
  container: {
    flex: 1,
    backgroundColor: '#F5F7F6',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0288D1',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  completionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  completionHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  completionPercentage: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0288D1',
  },
  completionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionLabel: {
    flex: 0.4,
    fontSize: 13,
    color: '#1F2937',
  },
  completionBar: {
    flex: 0.5,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    backgroundColor: '#0288D1',
    borderRadius: 3,
  },
  completionPercent: {
    flex: 0.1,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#0288D1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  updatePasswordButton: {
    marginTop: 4,
  },
  securityRow: {
    marginBottom: 12,
  },
  securityLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  securityInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  footerSpacing: {
    height: 20,
  },
});