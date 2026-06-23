// app/(sponsorTabs)/home.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase'; // I-adjust ang path sumala sa folder structure

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

  // FUNCTION PARA MO-FETCH SA TANANG GI-SET NGA ALLOWANCE
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // I-query ang allowances ug i-join ang profile sa spender aron makuha ang iyang ngalan
      const { data, error } = await supabase
        .from('allowances')
        .select(`
          id,
          allowance_name,
          amount,
          start_date,
          end_date,
          profiles!spender_id (
            full_name,
            email
          )
        `)
        .eq('sponsor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // I-map ang nakuha nga relasyon gikan sa database ngadto sa state array
      const formatted = (data || []).map((item: any) => ({
        id: item.id,
        allowance_name: item.allowance_name,
        amount: item.amount,
        start_date: item.start_date,
        end_date: item.end_date,
        spender_name: item.profiles?.full_name || 'Unknown Spender',
        spender_email: item.profiles?.email || 'No Email'
      }));

      setAllowances(formatted);

      // Kwentahon ang kinatibuk-ang kwarta nga gi-allocate
      const total = formatted.reduce((sum, item) => sum + item.amount, 0);
      setTotalAllocated(total);

    } catch (error: any) {
      console.error("Dashboard Fetch Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Mo-run inig abli sa screen
  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Total Summary Header Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Allocated Allowance</Text>
          <Text style={styles.summaryAmount}>₱{totalAllocated.toFixed(2)}</Text>
          <View style={styles.summaryBadge}>
            <Ionicons name="trending-up" size={14} color="#0CD964" />
            <Text style={styles.summaryBadgeText}>Active Monitoring</Text>
          </View>
        </View>

        {/* List Section Header */}
        <Text style={styles.sectionTitle}>Mga Gi-set nga Allowance</Text>

        {loading ? (
          <ActivityIndicator color="#0CD964" size="large" style={{ marginTop: 30 }} />
        ) : allowances.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color="#7DA08E" />
            <Text style={styles.emptyText}>Wala pa kay allowance nga gitala</Text>
            <Text style={styles.emptySubtext}>Adto sa Members tab ug pilia ang 'Accepted Spender' para butangan og allowance.</Text>
          </View>
        ) : (
          <FlatList
            data={allowances}
            keyExtractor={(item) => item.id}
            refreshing={loading}
            onRefresh={fetchDashboardData} // Swipe to refresh down
            renderItem={({ item }) => (
              <View style={styles.allowanceCard}>
                <View style={styles.cardLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="cash" size={22} color="#0CD964" />
                  </View>
                  <View style={styles.infoBlock}>
                    <Text style={styles.allowanceName}>{item.allowance_name}</Text>
                    <Text style={styles.spenderName}>Para kang: {item.spender_name}</Text>
                    <Text style={styles.dateDuration}>
                      📅 {item.start_date} to {item.end_date}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardAmount}>₱{item.amount.toFixed(2)}</Text>
              </View>
            )}
            contentContainerStyle={styles.listPadding}
          />
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, padding: 20 },
  summaryCard: { backgroundColor: '#213502', padding: 20, borderRadius: 16, marginBottom: 25, marginTop: Platform.OS === 'android' ? 20 : 10 },
  summaryLabel: { color: '#7DA08E', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  summaryAmount: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold', marginTop: 6, marginBottom: 12 },
  summaryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(12, 217, 100, 0.15)', alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, gap: 4 },
  summaryBadgeText: { color: '#0CD964', fontSize: 11, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#213502', marginBottom: 14 },
  listPadding: { paddingBottom: 20 },
  allowanceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F4F7F5', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8E4' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconContainer: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8E4' },
  infoBlock: { flex: 1, gap: 2 },
  allowanceName: { fontSize: 15, fontWeight: 'bold', color: '#213502' },
  spenderName: { fontSize: 12, color: '#557261', fontWeight: '500' },
  dateDuration: { fontSize: 10, color: '#7DA08E', marginTop: 2 },
  cardAmount: { fontSize: 16, fontWeight: 'bold', color: '#213502' },
  emptyState: { flex: 0.6, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#213502', marginTop: 6 },
  emptySubtext: { fontSize: 12, color: '#557261', textAlign: 'center', paddingHorizontal: 30, lineHeight: 16 }
});