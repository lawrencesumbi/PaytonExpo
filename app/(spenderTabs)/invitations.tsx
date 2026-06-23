// app/(spenderTabs)/invitations.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// I-import ang imong gihimo nga supabase client file (i-adjust ang path sumala sa imong folder)
import { supabase } from '../../lib/supabase';

interface Invitation {
  id: string; // ID sa row gikan sa 'sponsor_spenders' table
  sponsor_name: string;
  sponsor_email: string;
}

export default function InvitationsScreen() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // 1. I-FETCH ANG MGA PENDING INVITATIONS ALANG NIINING SPENDER
  const fetchInvitations = async () => {
    try {
      setLoading(true);
      
      // Kuhaon ang kasamtangang naka-login nga Spender
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // I-query ang 'sponsor_spenders' diin ang status kay 'pending' ug iyaha ang spender_id
      // Gigamitan og 'profiles!sponsor_id' aron makuha ang mga detalye sa Sponsor nga nag-invite
      const { data, error } = await supabase
        .from('sponsor_spenders')
        .select(`
          id,
          status,
          sponsor_id,
          profiles!sponsor_id (
            full_name,
            email
          )
        `)
        .eq('spender_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      // I-format para sa FlatList state
      const formattedInvites = (data || []).map((item: any) => ({
        id: item.id,
        sponsor_name: item.profiles?.full_name || 'Unknown Sponsor',
        sponsor_email: item.profiles?.email || 'No Email'
      }));

      setInvitations(formattedInvites);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Wala na-fetch ang mga invitations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  // 2. FUNCTION PARA MO-ACCEPT OG INVITATION
  const handleAccept = async (id: string, sponsorName: string) => {
    try {
      setActionLoading(true);

      // I-update ang status ngadto sa 'accepted' sa database
      const { error } = await supabase
        .from('sponsor_spenders')
        .update({ status: 'accepted' })
        .eq('id', id);

      if (error) throw error;
      
      Alert.alert("Success 🎉", `Gi-accept nimo ang invitation ni ${sponsorName}. Naka-link na mo karon!`);
      // Kuhaon sa listahan sa UI
      setInvitations(prev => prev.filter(item => item.id !== id));
    } catch (error: any) {
      Alert.alert("Error ❌", error.message || "Napakyas ang pag-accept.");
    } finally {
      setActionLoading(false);
    }
  };

  // 3. FUNCTION PARA MO-DECLINE OG INVITATION
  const handleDecline = async (id: string) => {
    try {
      setActionLoading(true);

      // I-delete ang row gikan sa table kung gibalibaran
      const { error } = await supabase
        .from('sponsor_spenders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      Alert.alert("Declined", "Imong gibalibaran ang invitation.");
      // Kuhaon sa listahan sa UI
      setInvitations(prev => prev.filter(item => item.id !== id));
    } catch (error: any) {
      Alert.alert("Error ❌", error.message || "Napakyas ang pag-decline.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mga Invitation</Text>
          <Text style={styles.headerSubtitle}>Kini ang mga Sponsor nga gusto mo-link kanimo ingon ilang Spender.</Text>
        </View>

        {/* Listahan o Empty/Loading States */}
        {loading ? (
          <ActivityIndicator color="#0CD964" size="large" style={{ marginTop: 40 }} />
        ) : invitations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="mail-open-outline" size={50} color="#7DA08E" />
            </View>
            <Text style={styles.emptyText}>Walay pending nga invitation</Text>
            <Text style={styles.emptySubtext}>Kon naay mag-invite nimo nga Sponsor, makita nimo kini diri dayon.</Text>
          </View>
        ) : (
          <FlatList
            data={invitations}
            keyExtractor={(item) => item.id}
            refreshing={loading}
            onRefresh={fetchInvitations}
            renderItem={({ item }) => (
              <View style={styles.inviteCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Ionicons name="business" size={20} color="#213502" />
                  </View>
                  <View style={styles.infoContainer}>
                    <Text style={styles.sponsorName}>{item.sponsor_name}</Text>
                    <Text style={styles.sponsorEmail}>{item.sponsor_email}</Text>
                  </View>
                </View>

                {/* Mga Action Buttons */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity 
                    style={[styles.button, styles.declineButton]} 
                    onPress={() => handleDecline(item.id)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.declineText}>Decline</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.button, styles.acceptButton]} 
                    onPress={() => handleAccept(item.id, item.sponsor_name)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, padding: 20 },
  header: { marginBottom: 25, marginTop: Platform.OS === 'android' ? 20 : 10 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#213502' },
  headerSubtitle: { fontSize: 14, color: '#557261', marginTop: 4, lineHeight: 18 },
  listContent: { paddingBottom: 20 },
  inviteCard: { backgroundColor: '#F4F7F5', padding: 16, borderRadius: 12, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8E4' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(33, 53, 2, 0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoContainer: { flex: 1 },
  sponsorName: { fontSize: 16, fontWeight: '600', color: '#213502' },
  sponsorEmail: { fontSize: 13, color: '#557261', marginTop: 2 },
  actionsContainer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  button: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minWidth: 90 },
  acceptButton: { backgroundColor: '#0CD964' },
  acceptText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  declineButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#7DA08E' },
  declineText: { color: '#557261', fontWeight: '600', fontSize: 14 },
  emptyState: { flex: 0.8, justifyContent: 'center', alignItems: 'center' },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F4F7F5', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#213502', textAlign: 'center' },
  emptySubtext: { fontSize: 13, color: '#557261', textAlign: 'center', marginTop: 6, paddingHorizontal: 30, lineHeight: 18 }
});