// app/(spenderTabs)/friends.tsx
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
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

interface Friend {
  id: string;
  full_name: string;
  email: string;
}

export default function FriendsScreen() {
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  
  // Input Validation & Submission States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // FETCH STORED RELATIONSHIP LINKAGES
  const fetchFriends = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('friends')
        .select('id, full_name, email')
        .eq('user_id', user.id)
        .order('full_name', { ascending: true });

      if (error) throw error;
      if (data) setFriends(data);
    } catch (error: any) {
      console.error('Error fetching friends data matrix:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // COMMIT NEW FRIEND RECOGNITION DATA ENGINES
  const handleAddFriend = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert('Missing Information', 'Please complete both name and email text entry inputs.');
      return;
    }

    // Standard RFC Email Format Filter Validation Rules
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please supply a correctly structured email address layout.');
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
        });

      if (error) throw error;

      Alert.alert('Success 🎉', `${fullName} has been successfully added to your transaction ecosystem mapping.`);
      setFullName('');
      setEmail('');
      Keyboard.dismiss();
      fetchFriends();
    } catch (error: any) {
      Alert.alert('Processing Failure', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <View style={styles.friendCard}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>
          {item.full_name.substring(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName} numberOfLines={1}>{item.full_name}</Text>
        <Text style={styles.friendEmail} numberOfLines={1}>{item.email}</Text>
      </View>
      <View style={styles.statusDot} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Immersive Dark Section Navigation Header */}
      <View style={styles.headerBackground}>
        <Text style={styles.headerTitle}>Friends Registry</Text>
        <Text style={styles.headerSubtext}>Manage your trusted companions to seamlessly split upcoming collective group expenditures.</Text>
      </View>

      {/* Input Capture Context Form Module */}
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Add New Connection</Text>
        
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={16} color="#64748B" style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="Full Name" 
            placeholderTextColor="#94A3B8"
            value={fullName}
            onChangeText={setFullName}
            editable={!submitting}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={16} color="#64748B" style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="Email Address" 
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!submitting}
          />
        </View>

        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={handleAddFriend}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="person-add" size={15} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Connect Friend</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Dynamic Network Feed Directory Section */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Your Network Connections</Text>
        
        {loading ? (
          <View style={styles.loaderSpacing}>
            <ActivityIndicator size="small" color="#10B981" />
          </View>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            renderItem={renderFriendItem}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="people-outline" size={36} color="#94A3B8" />
                <Text style={styles.emptyText}>No registered connections configured yet.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFD' },
  
  // Structured Safe Top Navigation Block Bounds
  headerBackground: { 
    backgroundColor: '#1E293B', 
    paddingHorizontal: 22, 
    paddingTop: Platform.OS === 'android' ? (NativeStatusBar.currentHeight ? NativeStatusBar.currentHeight + 14 : 45) : 16, 
    paddingBottom: 28, 
    borderBottomLeftRadius: 28, 
    borderBottomRightRadius: 28 
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSubtext: { fontSize: 13, color: '#94A3B8', marginTop: 6, lineHeight: 18, fontWeight: '500' },
  
  // Non-Overlapping Elastic Layout Matrix Elements
  formContainer: { 
    backgroundColor: '#FFFFFF', 
    marginHorizontal: 22,
    marginTop: 20,
    marginBottom: 16,
    padding: 18, 
    borderRadius: 22, 
    borderWidth: 1, 
    borderColor: '#F1F5F9', 
    shadowColor: '#0F172A', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.02, 
    shadowRadius: 8, 
    elevation: 2 
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 14, letterSpacing: -0.2 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFBFD', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, marginBottom: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#1E293B', fontWeight: '500' },
  addBtn: { backgroundColor: '#1E293B', padding: 14, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4 },
  addBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  
  // Independent Flexible Directory Feed Box
  listContainer: { flex: 1, paddingHorizontal: 22 },
  loaderSpacing: { marginTop: 32, alignItems: 'center' },
  flatListContent: { paddingBottom: 24, paddingTop: 4 },
  friendCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 18, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  avatarCircle: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  avatarText: { color: '#475569', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  friendInfo: { flex: 1, marginLeft: 14, paddingRight: 8 },
  friendName: { fontSize: 14, fontWeight: '600', color: '#1E293B', letterSpacing: -0.1 },
  friendEmail: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  
  emptyBox: { alignItems: 'center', marginTop: 48, gap: 10 },
  emptyText: { color: '#64748B', fontSize: 13, fontWeight: '500' }
});