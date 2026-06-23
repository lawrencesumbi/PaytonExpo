// app/(sponsorTabs)/monitoring.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase'; // I-adjust ang path sumala sa folder

interface SpenderMonitoringInfo {
  id: string; // spender_id
  full_name: string;
  email: string;
  active_allowance_id: string | null;
  allowance_name: string;
  total_allowance: number;
  total_spent: number;
}

interface ExpenseHistoryItem {
  id: string;
  expense_name: string;
  amount: number;
  category: string;
  created_at: string;
}

export default function MonitoringScreen() {
  // States
  const [spenders, setSpenders] = useState<SpenderMonitoringInfo[]>([]);
  const [selectedSpender, setSelectedSpender] = useState<SpenderMonitoringInfo | null>(null);
  const [expenses, setExpenses] = useState<ExpenseHistoryItem[]>([]);
  
  const [loadingSpenders, setLoadingSpenders] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  // 1. FETCH MASTER LIST SA MGA SPENDERS
  const fetchMonitoredSpenders = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) setLoadingSpenders(true);
      const { data: { user: currentSponsor } } = await supabase.auth.getUser();
      if (!currentSponsor) return;

      const { data: allowancesData, error: allowanceError } = await supabase
        .from('allowances')
        .select(`
          id,
          allowance_name,
          amount,
          spender_id,
          profiles!spender_id (
            full_name,
            email
          )
        `)
        .eq('sponsor_id', currentSponsor.id);

      if (allowanceError) throw allowanceError;

      if (!allowancesData || allowancesData.length === 0) {
        setSpenders([]);
        return;
      }

      const formattedSpenders: SpenderMonitoringInfo[] = await Promise.all(
        allowancesData.map(async (allowance: any) => {
          const { data: expensesData } = await supabase
            .from('expenses')
            .select('amount')
            .eq('allowance_id', allowance.id);

          const totalSpent = (expensesData || []).reduce((sum, exp) => sum + exp.amount, 0);

          return {
            id: allowance.spender_id,
            full_name: allowance.profiles?.full_name || 'Unknown Spender',
            email: allowance.profiles?.email || 'No Email',
            active_allowance_id: allowance.id,
            allowance_name: allowance.allowance_name,
            total_allowance: allowance.amount,
            total_spent: totalSpent
          };
        })
      );

      setSpenders(formattedSpenders);
      // Gi-tangtang nato ang block nga nag-overwrite sa selectedSpender diri aron malikayan ang bug!

    } catch (error: any) {
      console.error("Fetch Monitored Spenders Error:", error.message);
    } finally {
      setLoadingSpenders(false);
    }
  };

  // 2. FETCH EXPENSES SA USA KA PINIKONG SPENDER (PAG-DRILL DOWN)
  const fetchSpenderExpenses = async (allowanceId: string) => {
    try {
      setLoadingExpenses(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('id, expense_name, amount, category, created_at')
        .eq('allowance_id', allowanceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error: any) {
      console.error("Fetch Expenses Error:", error.message);
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    fetchMonitoredSpenders();
  }, []);

  // Inig click sa usa ka spender card sa Master List
  const handleSelectSpender = (spender: SpenderMonitoringInfo) => {
    setSelectedSpender(spender);
    if (spender.active_allowance_id) {
      fetchSpenderExpenses(spender.active_allowance_id);
    } else {
      setExpenses([]);
    }
  };

  // FIX: DIRETSO OG LIMPYO NGA PAG-BACK
  const handleBackToList = () => {
    setSelectedSpender(null);
    setExpenses([]);
    fetchMonitoredSpenders(true); // Mobalik na gyud ni diretso sa listahan samtang mag-load
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* VIEW 1: DETALYADONG MONITORING SA PINILING SPENDER */}
        {selectedSpender ? (
          <View style={{ flex: 1 }}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={handleBackToList}>
              <Ionicons name="arrow-back" size={22} color="#213502" />
              <Text style={styles.backButtonText}>Balik sa Spenders</Text>
            </TouchableOpacity>

            {/* Spender Header Card Summary */}
            <View style={styles.detailHeaderCard}>
              <Text style={styles.detailSpenderName}>{selectedSpender.full_name}</Text>
              <Text style={styles.detailSpenderEmail}>{selectedSpender.email}</Text>
              
              <View style={styles.divider} />
              
              <Text style={styles.detailAllowanceName}>🏷️ {selectedSpender.allowance_name}</Text>
              
              <View style={styles.budgetRow}>
                <View>
                  <Text style={styles.budgetLabel}>Gi-allocate</Text>
                  <Text style={styles.budgetAmount}>₱{selectedSpender.total_allowance.toFixed(2)}</Text>
                </View>
                <View>
                  <Text style={styles.budgetLabel}>Nagasto Na</Text>
                  <Text style={[styles.budgetAmount, { color: '#C0392B' }]}>₱{selectedSpender.total_spent.toFixed(2)}</Text>
                </View>
                <View>
                  <Text style={styles.budgetLabel}>Nabilin</Text>
                  <Text style={[styles.budgetAmount, { color: '#0CD964' }]}>
                    ₱{(selectedSpender.total_allowance - selectedSpender.total_spent).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {/* History Label */}
            <Text style={styles.sectionTitle}>Mga Gipalit / Gasto</Text>

            {loadingExpenses ? (
              <ActivityIndicator size="small" color="#0CD964" style={{ marginTop: 20 }} />
            ) : expenses.length === 0 ? (
              <View style={styles.emptyExpensesBlock}>
                <Ionicons name="receipt-outline" size={40} color="#7DA08E" />
                <Text style={styles.emptyExpensesText}>Wala pay narekord nga gasto kini nga spender.</Text>
              </View>
            ) : (
              <FlatList
                data={expenses}
                keyExtractor={(item) => item.id}
                refreshing={loadingExpenses}
                onRefresh={() => selectedSpender.active_allowance_id && fetchSpenderExpenses(selectedSpender.active_allowance_id)}
                renderItem={({ item }) => (
                  <View style={styles.expenseListItem}>
                    <View style={styles.expenseItemLeft}>
                      <View style={styles.iconCircle}>
                        <Ionicons 
                          name={item.category === 'Food' ? "fast-food" : item.category === 'Travel' ? "car" : "book"} 
                          size={16} 
                          color="#213502" 
                        />
                      </View>
                      <View>
                        <Text style={styles.expenseItemName}>{item.expense_name}</Text>
                        <Text style={styles.expenseItemCategory}>{item.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.expenseItemAmount}>- ₱{item.amount.toFixed(2)}</Text>
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        ) : (
          
          /* VIEW 2: MASTER LISTAHAN SA MGA SPENDERS */
          <View style={{ flex: 1 }}>
            <Text style={styles.mainTitle}>Spender Monitoring</Text>
            <Text style={styles.mainSubtitle}>Pilia ang spender aron masusi ang ilang mga narekord nga gasto.</Text>

            {loadingSpenders ? (
              <ActivityIndicator size="large" color="#0CD964" style={{ marginTop: 30 }} />
            ) : spenders.length === 0 ? (
              <View style={styles.emptySpendersBlock}>
                <Ionicons name="people-outline" size={52} color="#7DA08E" />
                <Text style={styles.emptySpendersText}>Walay spender nga naay allowance</Text>
                <Text style={styles.emptySpendersSub}>Siguroha nga nahatagan na nimo sila og allowance sa 'Home' o 'Members' tab.</Text>
              </View>
            ) : (
              <FlatList
                data={spenders}
                keyExtractor={(item) => item.id}
                refreshing={loadingSpenders}
                onRefresh={() => fetchMonitoredSpenders(true)}
                renderItem={({ item }) => {
                  const remaining = item.total_allowance - item.total_spent;
                  return (
                    <TouchableOpacity style={styles.spenderCard} onPress={() => handleSelectSpender(item)}>
                      <View style={styles.cardTopRow}>
                        <View>
                          <Text style={styles.spenderName}>{item.full_name}</Text>
                          <Text style={styles.allowanceTag}>{item.allowance_name}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#7DA08E" />
                      </View>
                      
                      {/* Progress Metrics */}
                      <View style={styles.cardMetricsRow}>
                        <View>
                          <Text style={styles.metricLabel}>Budget</Text>
                          <Text style={styles.metricValue}>₱{item.total_allowance.toFixed(0)}</Text>
                        </View>
                        <View>
                          <Text style={styles.metricLabel}>Nagasto</Text>
                          <Text style={[styles.metricValue, { color: '#C0392B' }]}>₱{item.total_spent.toFixed(0)}</Text>
                        </View>
                        <View style={styles.metricLabelBlockRight}>
                          <Text style={styles.metricLabelRight}>Nabilin</Text>
                          <Text style={[styles.metricValueRight, { color: remaining < 50 ? '#C0392B' : '#0CD964' }]}>
                            ₱{remaining.toFixed(0)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, padding: 20 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#213502', marginTop: Platform.OS === 'android' ? 15 : 5 },
  mainSubtitle: { fontSize: 13, color: '#557261', marginTop: 4, marginBottom: 20 },
  spenderCard: { backgroundColor: '#F4F7F5', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8E4' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  spenderName: { fontSize: 16, fontWeight: 'bold', color: '#213502' },
  allowanceTag: { fontSize: 11, color: '#557261', fontWeight: '500', marginTop: 2 },
  cardMetricsRow: { flexDirection: 'row', gap: 24, borderTopWidth: 1, borderTopColor: '#E2E8E4', paddingTop: 10 },
  metricLabel: { fontSize: 11, color: '#7DA08E', fontWeight: '600' },
  metricValue: { fontSize: 13, fontWeight: '700', color: '#213502', marginTop: 2 },
  metricLabelBlockRight: { marginLeft: 'auto', alignItems: 'flex-end' },
  metricLabelRight: { fontSize: 11, color: '#7DA08E', fontWeight: '600' },
  metricValueRight: { fontSize: 14, fontWeight: 'bold', marginTop: 1 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backButtonText: { fontSize: 14, fontWeight: '600', color: '#213502' },
  detailHeaderCard: { backgroundColor: '#213502', padding: 18, borderRadius: 14, marginBottom: 20 },
  detailSpenderName: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  detailSpenderEmail: { fontSize: 12, color: '#7DA08E', marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(125, 160, 142, 0.3)', marginVertical: 12 },
  detailAllowanceName: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  budgetLabel: { fontSize: 10, color: '#7DA08E', fontWeight: 'bold', textTransform: 'uppercase' },
  budgetAmount: { fontSize: 15, fontWeight: 'bold', color: '#FFFFFF', marginTop: 3 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#213502', marginBottom: 12 },
  expenseListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8E4' },
  expenseItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4F7F5', justifyContent: 'center', alignItems: 'center' },
  expenseItemName: { fontSize: 14, fontWeight: '600', color: '#213502' },
  expenseItemCategory: { fontSize: 10, color: '#557261', marginTop: 1 },
  expenseItemAmount: { fontSize: 14, fontWeight: 'bold', color: '#C0392B' },
  emptySpendersBlock: { flex: 0.6, justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 20 },
  emptySpendersText: { fontSize: 15, fontWeight: '700', color: '#213502' },
  emptySpendersSub: { fontSize: 12, color: '#557261', textAlign: 'center', lineHeight: 16 },
  emptyExpensesBlock: { alignItems: 'center', padding: 30, gap: 6 },
  emptyExpensesText: { fontSize: 13, color: '#557261', textAlign: 'center' }
});