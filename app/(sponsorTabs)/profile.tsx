 // app/(sponsorTabs)/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

type ArchiveItem = {
  id: string;
  reference: string;
  period: string;
  spender: string;
  status: 'Inactive' | 'Expired';
  amount: string;
  archivedDate: string;
};

export default function SponsorProfileScreen() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  
  // Personal Information State
  const [fullName, setFullName] = useState('Patricia Ann Mae Obaob');
  const [email, setEmail] = useState('patriciaannmaeobaob721@gmail.com');
  const [originalFullName, setOriginalFullName] = useState('Patricia Ann Mae Obaob');
  const [originalEmail, setOriginalEmail] = useState('patriciaannmaeobaob721@gmail.com');

  // Archive Data
  const [archiveData, setArchiveData] = useState<ArchiveItem[]>([
    {
      id: '1',
      reference: 'March 25-30',
      period: 'Mar 25—Mar 30, 2026',
      spender: 'Lawrence Sumbi',
      status: 'Inactive',
      amount: '₱500.00',
      archivedDate: 'Mar 31, 2026',
    },
    {
      id: '2',
      reference: 'February 1 - 15',
      period: 'Feb 01—Feb 15, 2026',
      spender: 'Lawrence Sumbi',
      status: 'Inactive',
      amount: '₱400.00',
      archivedDate: 'Feb 16, 2026',
    },
    {
      id: '3',
      reference: 'January 10-20',
      period: 'Jan 10—Jan 20, 2026',
      spender: 'King James',
      status: 'Expired',
      amount: '₱2,000.00',
      archivedDate: 'Jan 21, 2026',
    },
  ]);

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of Payton?",
      [
        { 
          text: "Cancel", 
          style: "cancel" 
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                Alert.alert("Error", error.message);
              } else {
                router.replace('/');
              }
            } catch (error) {
              Alert.alert("Error", "Something went wrong. Please try again.");
            } finally {
              setIsLoggingOut(false);
            }
          }
        }
      ]
    );
  };

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to change your profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      Alert.alert('Success', 'Profile photo updated successfully!');
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setProfileImage(null);
            Alert.alert('Success', 'Profile photo removed successfully!');
          }
        }
      ]
    );
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setFullName(originalFullName);
      setEmail(originalEmail);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setOriginalFullName(fullName);
    setOriginalEmail(email);
    setIsEditing(false);
    
    Alert.alert('Success', 'Profile changes saved successfully!');
  };

  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Please fill in both password fields.');
      return;
    }
    Alert.alert('Success', 'Password updated successfully!');
    setCurrentPassword('');
    setNewPassword('');
  };

  const handleRestore = (id: string, reference: string) => {
    Alert.alert(
      'Restore Allowance',
      `Are you sure you want to restore "${reference}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: () => {
            setArchiveData(archiveData.filter(item => item.id !== id));
            Alert.alert('Success', `"${reference}" has been restored.`);
          }
        }
      ]
    );
  };

  const handleDeleteArchive = (id: string, reference: string) => {
    Alert.alert(
      'Delete Allowance',
      `Are you sure you want to permanently delete "${reference}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setArchiveData(archiveData.filter(item => item.id !== id));
            Alert.alert('Success', `"${reference}" has been deleted.`);
          }
        }
      ]
    );
  };

  const renderArchiveItem = ({ item }: { item: ArchiveItem }) => (
    <View style={styles.archiveCard}>
      <View style={styles.archiveHeader}>
        <View style={styles.referenceContainer}>
          <Text style={styles.referenceText}>{item.reference}</Text>
          <Text style={styles.periodText}>{item.period}</Text>
        </View>
        <View style={[styles.statusBadge, item.status === 'Inactive' ? styles.inactiveBadge : styles.expiredBadge]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.archiveBody}>
        <View style={styles.spenderContainer}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{item.spender.charAt(0)}</Text>
          </View>
          <Text style={styles.spenderText}>{item.spender}</Text>
        </View>
        <Text style={styles.amountText}>{item.amount}</Text>
      </View>
      
      <View style={styles.archiveFooter}>
        <Text style={styles.archivedDateText}>Archived: {item.archivedDate}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.restoreButton]} 
            onPress={() => handleRestore(item.id, item.reference)}
          >
            <Ionicons name="refresh-outline" size={16} color="#0CD964" />
            <Text style={styles.restoreButtonText}>Restore</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]} 
            onPress={() => handleDeleteArchive(item.id, item.reference)}
          >
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Profile</Text>
            </View>
            <TouchableOpacity style={styles.settingsIcon} onPress={handleEditToggle}>
              <Ionicons 
                name={isEditing ? "close-outline" : "settings-outline"} 
                size={22} 
                color={isEditing ? "#DC2626" : "#213502"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card - Green Gradient */}
        <LinearGradient
          colors={['#0CD964', '#213502']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.profileInfo}>
            <View style={styles.profileImageContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={50} color="#213502" />
                </View>
              )}
              <TouchableOpacity style={styles.editImageButton} onPress={handleChangePhoto}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View>
              {isEditing ? (
                <TextInput
                  style={[styles.profileNameInput, { color: '#FFFFFF' }]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Full Name"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                />
              ) : (
                <Text style={styles.profileName}>{fullName}</Text>
              )}
              {isEditing ? (
                <TextInput
                  style={[styles.profileEmailInput, { color: 'rgba(255,255,255,0.8)' }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email Address"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.profileEmail}>{email}</Text>
              )}
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>SPONSOR</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Photo Actions */}
        <View style={styles.photoActions}>
          <TouchableOpacity style={[styles.photoButton, styles.changePhotoButton]} onPress={handleChangePhoto}>
            <Ionicons name="camera-outline" size={18} color="#213502" />
            <Text style={styles.photoButtonText}>Change Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.photoButton, styles.savePhotoButton]} onPress={handleSaveChanges}>
            <Ionicons name="save-outline" size={18} color="#FFFFFF" />
            <Text style={[styles.photoButtonText, { color: '#FFFFFF' }]}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.photoButton, styles.removePhotoButton]} onPress={handleRemovePhoto}>
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
            <Text style={[styles.photoButtonText, { color: '#DC2626' }]}>Remove</Text>
          </TouchableOpacity>
        </View>

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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {isEditing && (
              <TouchableOpacity onPress={handleSaveChanges}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.infoInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
              />
            ) : (
              <Text style={styles.infoValue}>{fullName}</Text>
            )}
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Address</Text>
            {isEditing ? (
              <TextInput
                style={styles.infoInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.infoValue}>{email}</Text>
            )}
          </View>

          {!isEditing && (
            <TouchableOpacity style={styles.editButton} onPress={handleEditToggle}>
              <Ionicons name="create-outline" size={18} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Archived Allowances Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.archiveHeaderToggle}
            onPress={() => setShowArchived(!showArchived)}
          >
            <View style={styles.archiveHeaderLeft}>
              <Ionicons name="archive" size={22} color="#213502" />
              <Text style={styles.sectionTitle}>Archived Allowances</Text>
            </View>
            <View style={styles.archiveHeaderRight}>
              <Text style={styles.archiveCount}>{archiveData.length} items</Text>
              <Ionicons 
                name={showArchived ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#7DA08E" 
              />
            </View>
          </TouchableOpacity>

          {showArchived && (
            <View>
              {archiveData.length === 0 ? (
                <View style={styles.emptyArchiveContainer}>
                  <Ionicons name="archive-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyArchiveText}>No archived allowances</Text>
                  <Text style={styles.emptyArchiveSubtext}>Archived records will appear here</Text>
                </View>
              ) : (
                <FlatList
                  data={archiveData}
                  renderItem={renderArchiveItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={styles.archiveList}
                />
              )}
            </View>
          )}
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.securityRow}>
            <Text style={styles.securityLabel}>Current Password</Text>
            <TextInput
              style={styles.securityInput}
              placeholder="Enter current password"
              placeholderTextColor="#7DA08E"
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
              placeholderTextColor="#7DA08E"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>
          <TouchableOpacity style={[styles.saveButton, styles.updatePasswordButton]} onPress={handleUpdatePassword}>
            <Text style={styles.saveButtonText}>Update Password</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, isLoggingOut && styles.disabledButton]} 
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.7}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.logoutContent}>
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
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
    color: '#213502',
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
    marginBottom: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  profileImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#7DA08E',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileNameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
    paddingBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  profileEmailInput: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
    paddingBottom: 2,
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
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  changePhotoButton: {
    backgroundColor: '#F3F4F6',
  },
  savePhotoButton: {
    backgroundColor: '#0CD964',
  },
  removePhotoButton: {
    backgroundColor: '#FEE2E2',
  },
  photoButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#213502',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#213502',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0CD964',
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
    color: '#0CD964',
  },
  completionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionLabel: {
    flex: 0.4,
    fontSize: 13,
    color: '#213502',
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
    backgroundColor: '#0CD964',
    borderRadius: 3,
  },
  completionPercent: {
    flex: 0.1,
    fontSize: 12,
    color: '#7DA08E',
    textAlign: 'right',
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#7DA08E',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#213502',
    fontWeight: '500',
  },
  infoInput: {
    fontSize: 15,
    color: '#213502',
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 4,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#0CD964',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  editButtonText: {
    color: '#213502',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#0CD964',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#213502',
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
    color: '#7DA08E',
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
    color: '#213502',
  },
  logoutButton: {
    backgroundColor: '#54090C',
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerSpacing: {
    height: 20,
  },
  // Archive Styles
  archiveHeaderToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  archiveHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  archiveHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  archiveCount: {
    fontSize: 13,
    color: '#7DA08E',
  },
  archiveList: {
    paddingTop: 12,
  },
  archiveCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  archiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  referenceContainer: {
    flex: 1,
  },
  referenceText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#213502',
  },
  periodText: {
    fontSize: 12,
    color: '#7DA08E',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  expiredBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#DC2626',
  },
  archiveBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    marginBottom: 10,
  },
  spenderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7DA08E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  spenderText: {
    fontSize: 13,
    color: '#213502',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0CD964',
  },
  archiveFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  archivedDateText: {
    fontSize: 11,
    color: '#7DA08E',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  restoreButton: {
    backgroundColor: '#E8F5E9',
  },
  restoreButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0CD964',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#DC2626',
  },
  emptyArchiveContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyArchiveText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#213502',
    marginTop: 8,
  },
  emptyArchiveSubtext: {
    fontSize: 13,
    color: '#7DA08E',
    marginTop: 2,
  },
});