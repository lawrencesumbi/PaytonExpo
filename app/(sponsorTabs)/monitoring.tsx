// app/(sponsorTabs)/monitoring.tsx
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StatusBar as NativeStatusBar,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase';

interface SpenderMonitoringInfo {
  id: string; // spender_id
  full_name: string;
  email: string;
  active_allowance_id: string | null;
  allowance_name: string;
  total_allowance: number; // ₱5000
  total_allocated: number; // ₱1900
  total_spent: number;     // ₱50
}

interface ExpenseHistoryItem {
  id: string;
  description: string;
  amount: number;
  category_name: string;
  spent_at: string;
}

export default function MonitoringScreen() {
  const [spenders, setSpenders] = useState<SpenderMonitoringInfo[]>([]);
  const [selectedSpender, setSelectedSpender] = useState<SpenderMonitoringInfo | null>(null);
  const [expenses, setExpenses] = useState<ExpenseHistoryItem[]>([]);
  
  const [loadingSpenders, setLoadingSpenders] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  // 1. FETCH MASTER LIST OF SPENDERS WITH DIRECT BUDGET SUMS
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
          // Sakto nga subquery method: basahon ang budgets sa spender
          const { data: budgetsData } = await supabase
            .from('budgets')
            .select(`
              id, 
              allocated_amount,
              expenses (
                amount
              )
            `)
            .eq('user_id', allowance.spender_id);
            
          const userBudgets = budgetsData || [];
          const totalAllocated = userBudgets.reduce((sum, b) => sum + Number(b.allocated_amount || 0), 0);
          
          let totalSpent = 0;
          userBudgets.forEach((budget: any) => {
            const expensesList = budget.expenses || [];
            totalSpent += expensesList.reduce((sum: number, exp: any) => sum + Number(exp.amount || 0), 0);
          });

          return {
            id: allowance.spender_id,
            full_name: allowance.profiles?.full_name || 'Spender User',
            email: allowance.profiles?.email || 'No Email Registered',
            active_allowance_id: allowance.id,
            allowance_name: allowance.allowance_name || 'Active Allowance',
            total_allowance: Number(allowance.amount || 0),
            total_allocated: totalAllocated,
            total_spent: totalSpent
          };
        })
      );

      setSpenders(formattedSpenders);
    } catch (error: any) {
      console.error("Fetch Monitored Spenders Error:", error.message);
    } finally {
      setLoadingSpenders(false);
    }
  };

  // 2. FETCH SPECIFIC TRANSACTIONS (Gisunod sa exact logic sa Spender's home.tsx)
  const fetchSpenderExpenses = async (spenderId: string) => {
    try {
      setLoadingExpenses(true);
      
      // Mag-fetch sa categories para sa text mapping
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name');

      const categoryMap: { [key: string]: string } = {};
      (categoriesData || []).forEach(cat => {
        categoryMap[cat.id] = cat.name || 'Food & Dining';
      });

      // Relational embedding method para ma-bypass ang standalone RLS restrictions sa expenses table
      const { data: budgetsData, error: budgetError } = await supabase
        .from('budgets')
        .select(`
          id,
          category_id,
          expenses (
            id,
            description,
            amount,
            spent_at
          )
        `)
        .eq('user_id', spenderId);

      if (budgetError) throw budgetError;

      const allExpenses: ExpenseHistoryItem[] = [];

      (budgetsData || []).forEach((budget: any) => {
        const catId = budget.category_id;
        const expensesList = budget.expenses || [];
        
        expensesList.forEach((exp: any) => {
          allExpenses.push({
            id: exp.id,
            description: exp.description || 'No Description',
            amount: Number(exp.amount),
            spent_at: exp.spent_at || new Date().toISOString(),
            category_name: categoryMap[catId] || 'Food & Dining'
          });
        });
      });

      // I-sort gikan sa pinakabag-o nga transaction spent_at timestamp
      allExpenses.sort((a, b) => b.spent_at.localeCompare(a.spent_at));

      setExpenses(allExpenses);
    } catch (error: any) {
      console.error("Fetch Spender Expenses Error:", error.message);
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    fetchMonitoredSpenders();
  }, []);

  const handleSelectSpender = (spender: SpenderMonitoringInfo) => {
    setSelectedSpender(spender);
    fetchSpenderExpenses(spender.id);
  };

  const handleBackToList = () => {
    setSelectedSpender(null);
    setExpenses([]);
    fetchMonitoredSpenders(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'food':
      case 'food & dining': return 'fast-food-outline';
      case 'travel':
      case 'transport': return 'car-outline';
      case 'education':
      case 'books': return 'book-outline';
      case 'bills':
      case 'utilities': return 'receipt-outline';
      default: return 'cart-outline';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        
        {/* VIEW 1: DRILLDOWN TRANSACTION LEDGER */}
        {selectedSpender ? (
          <View style={{ flex: 1 }}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackToList}>
              <Ionicons name="arrow-back" size={18} color="#1E293B" />
              <Text style={styles.backButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>

            <View style={styles.detailHeaderCard}>
              <Text style={styles.detailSpenderName}>{selectedSpender.full_name}</Text>
              <Text style={styles.detailSpenderEmail}>{selectedSpender.email}</Text>
              <View style={styles.divider} />
              
              <View style={styles.allowanceLabelRow}>
                <Ionicons name="bookmark-outline" size={14} color="#94A3B8" />
                <Text style={styles.detailAllowanceName}>{selectedSpender.allowance_name}</Text>
              </View>
              
              <View style={styles.budgetRow}>
                <View>
                  <Text style={styles.budgetLabel}>Allowance</Text>
                  <Text style={styles.budgetAmount}>₱{selectedSpender.total_allowance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                </View>
                <View>
                  <Text style={styles.budgetLabel}>Allocated</Text>
                  <Text style={[styles.budgetAmount, { color: '#FFA500' }]}>₱{selectedSpender.total_allocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.budgetLabel}>Remaining Balance</Text>
                  <Text style={[styles.budgetAmount, { color: '#3AA39F' }]}>
                    ₱{(selectedSpender.total_allowance - selectedSpender.total_allocated).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Recent Transactions</Text>

            {loadingExpenses ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color="#3AA39F" />
              </View>
            ) : expenses.length === 0 ? (
              <View style={styles.emptyExpensesBlock}>
                <View style={styles.emptyIconWrapper}>
                  <Ionicons name="receipt-outline" size={32} color="#94A3B8" />
                </View>
                <Text style={styles.emptyExpensesText}>No recorded transactions found.</Text>
              </View>
            ) : (
              <FlatList
                data={expenses}
                keyExtractor={(item) => item.id}
                refreshing={loadingExpenses}
                showsVerticalScrollIndicator={false}
                onRefresh={() => fetchSpenderExpenses(selectedSpender.id)}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <View style={styles.expenseListItem}>
                    <View style={styles.expenseItemLeft}>
                      <View style={styles.iconCircle}>
                        <Ionicons name={getCategoryIcon(item.category_name)} size={16} color="#475569" />
                      </View>
                      <View>
                        <Text style={styles.expenseItemName}>{item.description}</Text> 
                        <Text style={styles.expenseItemCategory}>{item.category_name}</Text>
                      </View>
                    </View>
                    <Text style={styles.expenseItemAmount}>- ₱{item.amount.toFixed(2)}</Text>
                  </View>
                )}
              />
            )}
          </View>
        ) : (
          
          /* VIEW 2: MONITORING OVERVIEW SCREEN */
          <View style={{ flex: 1 }}>
            <Text style={styles.mainTitle}>Spender Monitoring</Text>
            <Text style={styles.mainSubtitle}>Select a dependent below to inspect their ledger updates.</Text>

            {loadingSpenders ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color="#3AA39F" />
              </View>
            ) : spenders.length === 0 ? (
              <View style={styles.emptySpendersBlock}>
                <View style={styles.emptyIconWrapper}>
                  <Ionicons name="analytics-outline" size={32} color="#94A3B8" />
                </View>
                <Text style={styles.emptySpendersText}>No Monitored Allowances</Text>
                <Text style={styles.emptySubtext}>Monitor your Spender's Expenses in real time.</Text>
              </View>
            ) : (
              <FlatList
                data={spenders}
                keyExtractor={(item) => item.id}
                refreshing={loadingSpenders}
                showsVerticalScrollIndicator={false}
                onRefresh={() => fetchMonitoredSpenders(true)}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const remaining = item.total_allowance - item.total_allocated;
                  return (
                    <TouchableOpacity style={styles.spenderCard} onPress={() => handleSelectSpender(item)}>
                      <View style={styles.cardTopRow}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.spenderName}>{item.full_name}</Text>
                          <Text style={styles.allowanceTag}>{item.allowance_name}</Text>
                        </View>
                        <View style={styles.chevronWrapper}>
                          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                        </View>
                      </View>
                      
                      <View style={styles.cardMetricsRow}>
                        <View>
                          <Text style={styles.metricLabel}>Total</Text>
                          <Text style={styles.metricValue}>₱{item.total_allowance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
                        </View>
                        <View>
                          <Text style={styles.metricLabel}>Allocated</Text>
                          <Text style={[styles.metricValue, { color: '#FFA500' }]}>₱{item.total_allocated.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
                        </View>
                        <View style={styles.metricLabelBlockRight}>
                          <Text style={styles.metricLabelRight}>Remaining Balance</Text>
                          <Text style={[styles.metricValueRight, { color: '#3AA39F' }]}>
                            ₱{remaining.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFD', paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0 },
  content: { flex: 1, paddingHorizontal: 20 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  listContent: { paddingBottom: 110 },
  mainTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B', marginTop: 12 },
  mainSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 24, lineHeight: 18 },
  spenderCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  spenderName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  allowanceTag: { fontSize: 12, color: '#64748B', marginTop: 2 },
  chevronWrapper: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  cardMetricsRow: { flexDirection: 'row', gap: 32, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  metricLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' },
  metricValue: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginTop: 2 },
  metricLabelBlockRight: { marginLeft: 'auto', alignItems: 'flex-end' },
  metricLabelRight: { fontSize: 11, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' },
  metricValueRight: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, marginTop: 12 },
  backButtonText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  detailHeaderCard: { backgroundColor: '#133b13', padding: 20, borderRadius: 24, marginBottom: 24 },
  detailSpenderName: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  detailSpenderEmail: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(148, 163, 184, 0.15)', marginVertical: 14 },
  allowanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailAllowanceName: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  budgetLabel: { fontSize: 10, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
  budgetAmount: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 2 },
  expenseListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  expenseItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  expenseItemName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  expenseItemCategory: { fontSize: 12, color: '#64748B', marginTop: 1 },
  expenseItemAmount: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  emptySpendersBlock: { flex: 0.8, justifyContent: 'center', alignItems: 'center' },
  emptyIconWrapper: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptySpendersText: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  emptyExpensesBlock: { flex: 0.5, justifyContent: 'center', alignItems: 'center' },
  emptyExpensesText: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  emptySubtext: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4, paddingHorizontal: 32, lineHeight: 18 },
});