// app/(sponsorTabs)/members.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Gikinahanglan para sa navigation
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase'; // I-adjust ang path sumala sa imong folder structure

interface Spender {
  id: string; // ID sa rows gikan sa 'sponsor_spenders' table
  spender_id: string; // Tinuod nga User ID gikan sa profiles table
  name: string;
  email: string;
  status: string;
}

export default function MembersScreen() {
  const router = useRouter(); // Instance sa router
  const [spenderEmail, setSpenderEmail] = useState('');
  const [members, setMembers] = useState<Spender[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. I-FETCH ANG MGA MEMBERS / SPENDERS
  const fetchMembers = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Gi-query gamit ang profiles!spender_id aron malikayan ang double relationship ambiguity
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
        spender_id: item.spender_id, // Atong i-save aron mapasa sa allowance screen
        name: item.profiles?.full_name || 'No Name',
        email: item.profiles?.email || 'No Email',
        status: item.status
      }));

      setMembers(formattedMembers);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Wala na-fetch ang mga members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // 2. FUNCTION PARA MAG-INVITE OG SPENDER GAMIT ANG EMAIL
  const handleInviteSpender = async () => {
    const emailToInvite = spenderEmail.trim();
    if (!emailToInvite) return;

    try {
      setSubmitting(true);

      const { data: { user: currentSponsor } } = await supabase.auth.getUser();
      if (!currentSponsor) {
        Alert.alert("Error", "Kinahanglan naka-login ka.");
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
        Alert.alert("Wala Makita", `Dili makit-an ang "${emailToInvite}". Siguroha nga sakto kini.`);
        return;
      }

      const targetSpender = profileData[0];

      if (targetSpender.id === currentSponsor.id) {
        Alert.alert("Ops!", "Dili nimo mapadad-an og invite ang imong kaugalingon.");
        return;
      }

      if (targetSpender.role !== 'Spender') {
        Alert.alert("Dili Pwede", "Ang account nga imong gi-invite dili usa ka Spender.");
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
          Alert.alert("Dili Pwede", "Kini nga spender na-link na kanimo o sa laing sponsor.");
        } else {
          Alert.alert("Insert Error ❌", insertError.message);
        }
        return;
      }

      Alert.alert("Success 🎉", `Malampusong na-invite si ${targetSpender.email}!`);
      setSpenderEmail('');
      fetchMembers();
      
    } catch (error: any) {
      Alert.alert("Error Exception", error.message || "Naay sayop sa pag-invite.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Managed Spenders</Text>
          <Text style={styles.headerSubtitle}>I-invite ug dumi-dala ang imong gina-sponsoran.</Text>
        </View>

        {/* Input Card para sa Pag-Invite */}
        <View style={styles.addCard}>
          <Text style={styles.inputLabel}>Invite New Spender</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="I-type ang Spender Email..."
              placeholderTextColor="#7DA08E"
              value={spenderEmail}
              onChangeText={setSpenderEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!submitting}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleInviteSpender} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="send" size={18} color="#FFF" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Listahan sa mga Spenders */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Imong Listahan ({members.length})</Text>
          
          {loading ? (
            <ActivityIndicator color="#0CD964" size="large" style={{ marginTop: 40 }} />
          ) : members.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#7DA08E" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>Wala pa kay ginalink nga Spender</Text>
              <Text style={styles.emptySubtext}>Sugdi pinaagi sa pag-invite sa ilang email sa ibabaw.</Text>
            </View>
          ) : (
            <FlatList
              data={members}
              keyExtractor={(item) => item.id}
              refreshing={loading}
              onRefresh={fetchMembers}
              renderItem={({ item }) => (
                <View style={styles.memberCard}>
                  <View style={styles.avatar}>
                    <Ionicons 
                      name={item.status === 'accepted' ? "person" : "mail-unread"} 
                      size={20} 
                      color={item.status === 'accepted' ? "#0CD964" : "#7DA08E"} 
                    />
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <Text style={styles.memberEmail}>{item.email}</Text>
                    
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

                  {/* KINI ANG BUTTON NGA MODALA SA ALLOWANCE FORM SCREEN (KUNG ACCEPTED NA) */}
                  {item.status === 'accepted' && (
                    <TouchableOpacity 
                      style={styles.setAllowanceBtn}
                      onPress={() => {
                        router.push({
                          pathname: '/allowance', // Mo-navigate sa app/allowance.tsx
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
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, padding: 20 },
  header: { marginBottom: 25, marginTop: Platform.OS === 'android' ? 20 : 10 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#213502' },
  headerSubtitle: { fontSize: 14, color: '#557261', marginTop: 4 },
  addCard: { backgroundColor: '#F4F7F5', padding: 16, borderRadius: 12, marginBottom: 25, borderWidth: 1, borderColor: '#E2E8E4' },
  inputLabel: { color: '#213502', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#FFFFFF', color: '#213502', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, fontSize: 14, borderWidth: 1, borderColor: '#7DA08E' },
  addButton: { backgroundColor: '#0CD964', padding: 12, borderRadius: 8, marginLeft: 10, justifyContent: 'center', alignItems: 'center', minWidth: 48, height: 48 },
  listContainer: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#213502', marginBottom: 12 },
  listContent: { paddingBottom: 20 },
  memberCard: { flexDirection: 'row', backgroundColor: '#F4F7F5', padding: 14, borderRadius: 10, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8E4' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(12, 217, 100, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  memberInfo: { flex: 1 },
  memberName: { color: '#213502', fontSize: 15, fontWeight: '600' },
  memberEmail: { color: '#557261', fontSize: 12, marginTop: 2, marginBottom: 6 },
  statusBadge: { alignSelf: 'flex-start', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 4 },
  badgeAccepted: { backgroundColor: 'rgba(12, 217, 100, 0.15)' },
  badgePending: { backgroundColor: 'rgba(241, 196, 15, 0.15)' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  textAccepted: { color: '#0CD964' },
  textPending: { color: '#D4AC0D' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyIcon: { marginBottom: 12, opacity: 0.6 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#213502', textAlign: 'center' },
  emptySubtext: { fontSize: 13, color: '#557261', textAlign: 'center', marginTop: 4, paddingHorizontal: 20 },
  // Bag-ong mga styles para sa button sa kilid sa list card
  setAllowanceBtn: { backgroundColor: '#213502', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, justifyContent: 'center' },
  setAllowanceBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' }
});