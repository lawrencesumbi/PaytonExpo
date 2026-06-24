// app/(sponsorTabs)/home.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StatusBar as NativeStatusBar,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
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
  spender_email: string;
}

export default function HomeScreen() {
  const [allowances, setAllowances] = useState<AllowanceDashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAllocated, setTotalAllocated] = useState(0);

  // FETCH ALL ALLOCATED ALLOWANCES FOR THE DASHBOARD
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Query allowances table and join profile metadata fields on spender relation
      const { data, error } = await supabase
        .from('allowances')
        .select(`
          id,
          allowance_name,
          amount,
          start_date,
          end_date,
          profiles!allowances_spender_id_fkey (
            full_name,
            email
          )
        `)
        .eq('sponsor_id', user.id)
        .order('received_at', { ascending: false }); // FIXED: Gi-saktong column name gikan sa imong schema

      if (error) throw error;

      // Transform response relations into structured data arrays
      const formatted = (data || []).map((item: any) => {
        const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;

        return {
          id: item.id,
          allowance_name: item.allowance_name || 'Allowance Allocation',
          amount: Number(item.amount),
          start_date: item.start_date || 'N/A',
          end_date: item.end_date || 'N/A',
          spender_name: profileData?.full_name || 'Unknown Recipient',
          spender_email: profileData?.email || 'No Email Registered'
        };
      });

      setAllowances(formatted);

      // Compute total absolute cumulative allowances issued
      const total = formatted.reduce((sum, item) => sum + item.amount, 0);
      setTotalAllocated(total);

    } catch (error: any) {
      console.error("Dashboard Fetch Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Automated trigger to refresh state metrics every time the screen becomes active
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        
        {/* Total Summary Header Card Frame */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Allocated Capital</Text>
          <Text style={styles.summaryAmount}>₱{totalAllocated.toFixed(2)}</Text>
          <View style={styles.summaryBadge}>
            <Ionicons name="trending-up" size={12} color="#21dad3" />
            <Text style={styles.summaryBadgeText}>Active Monitoring Enabled</Text>
          </View>
        </View>

        {/* List Section Title Header */}
        <Text style={styles.sectionTitle}>Active Allowances ({allowances.length})</Text>

        {loading && allowances.length === 0 ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color="#3AA39F" size="small" />
          </View>
        ) : allowances.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="wallet-outline" size={32} color="#94A3B8" />
            </View>
            <Text style={styles.emptyText}>No Active Allocations</Text>
            <Text style={styles.emptySubtext}>Navigate over to your Members channel and configure an active balance schema for an accepted dependent.</Text>
          </View>
        ) : (
          <FlatList
            data={allowances}
            keyExtractor={(item) => item.id}
            refreshing={loading}
            showsVerticalScrollIndicator={false}
            onRefresh={fetchDashboardData}
            contentContainerStyle={styles.listPadding}
            renderItem={({ item }) => (
              <View style={styles.allowanceCard}>
                <View style={styles.cardLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="cash-outline" size={18} color="#3AA39F" />
                  </View>
                  <View style={styles.infoBlock}>
                    <Text style={styles.allowanceName} numberOfLines={1}>{item.allowance_name}</Text>
                    <Text style={styles.spenderName} numberOfLines={1}>Recipient: {item.spender_name}</Text>
                    
                    <View style={styles.dateBadgeRow}>
                      <Ionicons name="calendar-outline" size={11} color="#64748B" />
                      <Text style={styles.dateDuration}>
                        {item.start_date} to {item.end_date}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardAmount}>₱{item.amount.toFixed(2)}</Text>
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
  container: { 
    flex: 1, 
    backgroundColor: '#FAFBFD',
    paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0 
  },
  content: { flex: 1, paddingHorizontal: 20 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  listPadding: { paddingBottom: 110 },
  
  summaryCard: { 
    backgroundColor: '#133b13', 
    padding: 20, 
    borderRadius: 24, 
    marginBottom: 24, 
    marginTop: 12, 
    shadowColor: '#0F172A', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 15, 
    elevation: 4 
  },
  summaryLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryAmount: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', marginTop: 6, marginBottom: 14, letterSpacing: -0.5 },
  summaryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(58, 163, 159, 0.12)', alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, gap: 6, borderWidth: 1, borderColor: 'rgba(58, 163, 159, 0.2)' },
  summaryBadgeText: { color: '#21dad3', fontSize: 11, fontWeight: '600' },
  
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 14, letterSpacing: 0.5, paddingLeft: 2 },
  
  allowanceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EBF6F5', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D1ECEB' },
  infoBlock: { flex: 1, gap: 2 },
  allowanceName: { fontSize: 15, fontWeight: '600', color: '#1E293B', letterSpacing: -0.2 },
  spenderName: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  
  dateBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dateDuration: { fontSize: 11, color: '#64748B', fontWeight: '400' },
  
  cardRight: { paddingLeft: 12, alignItems: 'flex-end' },
  cardAmount: { fontSize: 15, fontWeight: '700', color: '#1E293B', letterSpacing: -0.2 },
  
  emptyState: { flex: 0.8, justifyContent: 'center', alignItems: 'center' },
  emptyIconWrapper: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#1E293B', textAlign: 'center' },
  emptySubtext: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, paddingHorizontal: 32, lineHeight: 18 }
});