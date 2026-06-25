// app/(sponsorTabs)/home.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StatusBar as NativeStatusBar,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase';

interface AllowanceDashboardItem {
  id: string;
  allowance_name: string;
  amount: number;
  start_date: string;
  end_date: string;
  spender_name: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [allowances, setAllowances] = useState<AllowanceDashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [sponsorProfile, setSponsorProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();
      setSponsorProfile(profile);

      const { data, error } = await supabase
        .from('allowances')
        .select(`
          id, allowance_name, amount, start_date, end_date,
          profiles!allowances_spender_id_fkey (full_name)
        `)
        .eq('sponsor_id', user.id)
        .order('received_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        id: item.id,
        allowance_name: item.allowance_name,
        amount: Number(item.amount),
        start_date: item.start_date,
        end_date: item.end_date,
        spender_name: item.profiles?.full_name || 'Unknown'
      }));

      setAllowances(formatted);
      setTotalAllocated(formatted.reduce((sum, item) => sum + item.amount, 0));
    } catch (error: any) {
      console.error("Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));

  const handleDelete = (id: string) => {
    Alert.alert("Delete Allowance", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from('allowances').delete().eq('id', id);
          if (error) {
            Alert.alert("Error", "Failed to delete allowance.");
          } else {
            fetchDashboardData();
          }
        }
      }
    ]);
  };

  const handleEdit = (item: AllowanceDashboardItem) => {
    router.push({ pathname: '/allowance', params: { id: item.id } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{sponsorProfile?.full_name || 'Sponsor'}</Text>
          </View>
          {sponsorProfile?.avatar_url ? (
            <Image source={{ uri: sponsorProfile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}><Ionicons name="person" size={24} color="#3AA39F" /></View>
          )}
        </View>

        <LinearGradient 
          colors={['#3AA39F', '#133b13']} 
          start={{x: 0, y: 0}} end={{x: 1, y: 1}}
          style={styles.summaryCard}
        >
          <View style={styles.cardChip} />
          <Text style={styles.cardLabel}>TOTAL ALLOCATED</Text>
          <Text style={styles.cardAmount}>₱{totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          <View style={styles.cardFooter}>
            <View style={styles.cardBadge}><Text style={styles.cardBadgeText}>ACTIVE MONITORING</Text></View>
            <Ionicons name="card-outline" size={24} color="rgba(255,255,255,0.4)" />
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Active Allowances ({allowances.length})</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#3AA39F" style={{ marginTop: 40 }} />
        ) : allowances.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No active allowances</Text>
            <Text style={styles.emptySubtitle}>
              To set up an allowance, go to the Members tab and select the person you wish to assign one to.
            </Text>
            <TouchableOpacity 
              style={styles.navigateBtn}
              onPress={() => router.push('/(sponsorTabs)/members')}
            >
              <Text style={styles.navigateBtnText}>Go to Members</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={allowances}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <View style={styles.allowanceCard}>
                <View style={styles.cardLeft}>
                  <View style={styles.iconContainer}><Ionicons name="wallet" size={18} color="#3AA39F" /></View>
                  <View style={styles.infoBlock}>
                    <Text style={styles.allowanceName}>{item.allowance_name}</Text>
                    <Text style={styles.spenderName}>{item.spender_name}</Text>
                  </View>
                </View>
                
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  <Text style={styles.cardAmountText}>₱{item.amount.toLocaleString()}</Text>
                  <View style={styles.actionRow}>
                      <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                          <Ionicons name="pencil" size={16} color="#3AA39F" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                          <Ionicons name="trash" size={16} color="#FF6B6B" />
                      </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFD', paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0 },
  content: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  welcomeText: { fontSize: 14, color: '#64748B' },
  userName: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EBF6F5', justifyContent: 'center', alignItems: 'center' },
  summaryCard: { padding: 24, borderRadius: 24, marginBottom: 24, elevation: 8, shadowColor: '#133b13', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
  cardChip: { width: 45, height: 32, backgroundColor: 'rgb(255, 243, 136)', borderRadius: 8, marginBottom: 16 },
  cardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  cardAmount: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  cardBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  cardBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 14 },
  allowanceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EBF6F5', justifyContent: 'center', alignItems: 'center' },
  infoBlock: { gap: 2 },
  allowanceName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  spenderName: { fontSize: 12, color: '#64748B' },
  cardAmountText: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  actionRow: { flexDirection: 'row', gap: 15 },
  actionBtn: { padding: 4 },
  emptyContainer: { marginTop: 40, alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 20 },
  navigateBtn: { backgroundColor: '#3AA39F', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  navigateBtnText: { color: '#FFFFFF', fontWeight: '600' }
});