// app/(sponsorTabs)/members.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  StatusBar as NativeStatusBar,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase';

interface Spender {
  id: string; // ID of rows from 'sponsor_spenders' table
  spender_id: string; // True User ID from profiles table
  name: string;
  email: string;
  status: string;
}

export default function MembersScreen() {
  const router = useRouter();
  const [spenderEmail, setSpenderEmail] = useState('');
  const [members, setMembers] = useState<Spender[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. FETCH MEMBERS / SPENDERS
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Queried using profiles!spender_id to prevent double relationship ambiguity
      const { data, error } = await supabase
        .from('sponsor_spenders')
        .select(`
          id,
          status,
          spender_id,
          profiles!spender_id (
            full_name,
            email
          )
        `)
        .eq('sponsor_id', user.id);

      if (error) throw error;

      const formattedMembers = (data || []).map((item: any) => ({
        id: item.id,
        spender_id: item.spender_id, // Saved to pass over to the allowance screen
        name: item.profiles?.full_name || 'No Name',
        email: item.profiles?.email || 'No Email',
        status: item.status
      }));

      setMembers(formattedMembers);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to fetch members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // 2. INVITE SPENDER VIA EMAIL
  const handleInviteSpender = async () => {
    const emailToInvite = spenderEmail.trim();
    if (!emailToInvite) return;

    try {
      setSubmitting(true);
      const { data: { user: currentSponsor } } = await supabase.auth.getUser();
      if (!currentSponsor) {
        Alert.alert("Error", "You must be logged in to invite users.");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .ilike('email', emailToInvite);

      if (profileError) {
        Alert.alert("Supabase Error ❌", profileError.message);
        return;
      }

      if (!profileData || profileData.length === 0) {
        Alert.alert("Not Found", `Could not find an account for "${emailToInvite}". Please double-check the email address.`);
        return;
      }

      const targetSpender = profileData[0];

      if (targetSpender.id === currentSponsor.id) {
        Alert.alert("Invalid Action", "You cannot send an invitation to your own account.");
        return;
      }

      if (targetSpender.role !== 'Spender') {
        Alert.alert("Action Denied", "The user account you are trying to invite is not registered as a Spender.");
        return;
      }

      const { error: insertError } = await supabase
        .from('sponsor_spenders')
        .insert([
          {
            sponsor_id: currentSponsor.id,
            spender_id: targetSpender.id,
            status: 'pending'
          }
        ]);

      if (insertError) {
        if (insertError.code === '23505') {
          Alert.alert("Action Denied", "This spender is already linked to your account or another sponsor.");
        } else {
          Alert.alert("Insert Error ❌", insertError.message);
        }
        return;
      }

      Alert.alert("Success 🎉", `Successfully invited ${targetSpender.email}!`);
      setSpenderEmail('');
      fetchMembers();
      
    } catch (error: any) {
      Alert.alert("Exception Error", error.message || "An unexpected error occurred while sending the invite.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Managed Spenders</Text>
          <Text style={styles.headerSubtitle}>Invite and manage the dependents you are sponsoring.</Text>
        </View>

        {/* Input Card for Invitations */}
        <View style={styles.addCard}>
          <Text style={styles.inputLabel}>Invite New Spender</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type spender email address..."
              placeholderTextColor="#94A3B8"
              value={spenderEmail}
              onChangeText={setSpenderEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!submitting}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleInviteSpender} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="send" size={16} color="#FFF" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Spenders List View */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Your List ({members.length})</Text>
          
          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator color="#3AA39F" size="small" />
            </View>
          ) : members.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrapper}>
                <Ionicons name="people-outline" size={32} color="#94A3B8" />
              </View>
              <Text style={styles.emptyText}>No Linked Spenders Yet</Text>
              <Text style={styles.emptySubtext}>Get started by sending an invitation to their email above.</Text>
            </View>
          ) : (
            <FlatList
              data={members}
              keyExtractor={(item) => item.id}
              refreshing={loading}
              onRefresh={fetchMembers}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.memberCard}>
                  <View style={[styles.avatar, item.status === 'accepted' ? styles.avatarAccepted : styles.avatarPending]}>
                    <Ionicons 
                      name={item.status === 'accepted' ? "person" : "mail-unread-outline"} 
                      size={18} 
                      color={item.status === 'accepted' ? "#3AA39F" : "#64748B"} 
                    />
                  </View>
                  
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <Text style={styles.memberEmail} numberOfLines={1}>{item.email}</Text>
                    
                    <View style={[
                      styles.statusBadge, 
                      item.status === 'accepted' ? styles.badgeAccepted : styles.badgePending
                    ]}>
                      <Text style={[
                        styles.statusText, 
                        item.status === 'accepted' ? styles.textAccepted : styles.textPending
                      ]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Route to allowance setup configuration screen (if accepted invitation status) */}
                  {item.status === 'accepted' && (
                    <TouchableOpacity 
                      style={styles.setAllowanceBtn}
                      onPress={() => {
                        router.push({
                          pathname: '/(sponsorTabs)/allowance',
                          params: { 
                            spenderId: item.spender_id, 
                            spenderName: item.name,
                            spenderEmail: item.email
                          }
                        });
                      }}
                    >
                      <Text style={styles.setAllowanceBtnText}>Set Allowance</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FAFBFD', 
    paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0 
  },
  content: { flex: 1, paddingHorizontal: 20 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  
  header: { marginBottom: 24, marginTop: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '400' },
  
  addCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 1 },
  inputLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.3 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingLeft: 12, paddingRight: 6, height: 48 },
  input: { flex: 1, backgroundColor: 'transparent', color: '#1E293B', fontSize: 14, fontWeight: '500', height: '100%', padding: 0 },
  addButton: { backgroundColor: '#3AA39F', width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  
  listContainer: { flex: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5, paddingLeft: 2 },
  listContent: { paddingBottom: 110 },
  
  memberCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  avatar: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1 },
  avatarAccepted: { backgroundColor: '#EBF6F5', borderColor: '#D1ECEB' },
  avatarPending: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  
  memberInfo: { flex: 1, paddingRight: 8 },
  memberName: { color: '#1E293B', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  memberEmail: { color: '#64748B', fontSize: 12, marginTop: 1, marginBottom: 6 },
  
  statusBadge: { alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1 },
  badgeAccepted: { backgroundColor: '#EBF6F5', borderColor: '#D1ECEB' },
  badgePending: { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' },
  statusText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  textAccepted: { color: '#3AA39F' },
  textPending: { color: '#D97706' },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyIconWrapper: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#1E293B', textAlign: 'center' },
  emptySubtext: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4, paddingHorizontal: 32, lineHeight: 18 },
  
  setAllowanceBtn: { backgroundColor: '#1E293B', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, justifyContent: 'center' },
  setAllowanceBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' }
});