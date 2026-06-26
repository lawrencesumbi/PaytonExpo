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

  // 2. FETCH SPECIFIC TRANSACTIONS
  const fetchSpenderExpenses = async (spenderId: string) => {
    try {
      setLoadingExpenses(true);
      
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name');

      const categoryMap: { [key: string]: string } = {};
      (categoriesData || []).forEach(cat => {
        categoryMap[cat.id] = cat.name || 'Food & Dining';
      });

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

            {/* CREDIT CARD STYLE FOR DETAILS HEADER */}
            <View style={styles.creditCardDetail}>
              <View style={styles.ccHeader}>
                <View>
                  <Text style={styles.ccTypeLabel}>{selectedSpender.allowance_name.toUpperCase()}</Text>
                  <Text style={styles.ccEmailText}>{selectedSpender.email}</Text>
                </View>
                <Ionicons name="wifi" size={20} color="rgba(255,255,255,0.6)" style={{ transform: [{ rotate: '90deg' }] }} />
              </View>

              <View style={styles.ccChipContainer}>
                <View style={styles.ccChip} />
              </View>

              <View style={styles.ccBalanceContainer}>
                <Text style={styles.ccBalanceLabel}>REMAINING BALANCE</Text>
                <Text style={styles.ccBalanceValue}>
                  ₱{(selectedSpender.total_allowance - selectedSpender.total_allocated).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View style={styles.ccFooter}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ccHolderLabel}>CARDHOLDER</Text>
                  <Text style={styles.ccHolderNameDetail}>{selectedSpender.full_name}</Text>
                </View>
                
                {/* 3 COLUMN METRICS (ALLOCATED IS NOW MINUS SPENT) */}
                <View style={styles.ccMiniMetricsRow}>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.ccMiniLabel}>TOTAL</Text>
                    <Text style={styles.ccMiniValue}>₱{selectedSpender.total_allowance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.ccMiniLabel}>ALLOCATED</Text>
                    <Text style={[styles.ccMiniValue, { color: '#FFD166' }]}>
                      ₱{(selectedSpender.total_allocated - selectedSpender.total_spent).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.ccMiniLabel}>SPENT</Text>
                    <Text style={[styles.ccMiniValue, { color: '#F87171' }]}>₱{selectedSpender.total_spent.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Recent Transactions</Text>

            {loadingExpenses ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color="#0F172A" />
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
                <ActivityIndicator size="small" color="#0F172A" />
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
                    <TouchableOpacity style={styles.creditCardOverview} onPress={() => handleSelectSpender(item)}>
                      <View style={styles.ccHeader}>
                        <View>
                          <Text style={styles.ccTypeLabel}>{item.allowance_name.toUpperCase()}</Text>
                          <Text style={styles.ccHolderName}>{item.full_name}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
                      </View>

                      <View style={styles.ccChipContainer}>
                        <View style={styles.ccChip} />
                        
                      </View>

                      <View style={styles.ccMetricsContainer}>
                        <View>
                          <Text style={styles.ccLabelText}>REMAINING BALANCE</Text>
                          <Text style={styles.ccBalanceOverviewText}>₱{remaining.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.ccLabelText}>TOTAL ALLOWANCE</Text>
                          <Text style={styles.ccAllowanceOverviewText}>₱{item.total_allowance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
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
  
  // CREDIT CARD PREMIUM STYLES
  creditCardOverview: {
    backgroundColor: '#0F172A',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  creditCardDetail: {
    backgroundColor: '#1E1B4B',
    padding: 22,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  ccHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ccTypeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1.5,
  },
  ccEmailText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2
  },
  ccHolderName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: 0.5
  },
  ccChipContainer: {
    marginTop: 14,
    marginBottom: 10
  },
  ccChip: {
    width: 38,
    height: 28,
    backgroundColor: '#ffd900',
    borderRadius: 6,
    opacity: 0.85,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  ccMetricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12
  },
  ccLabelText: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 1
  },
  ccBalanceOverviewText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34D399',
    marginTop: 2
  },
  ccAllowanceOverviewText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2
  },
  ccBalanceContainer: {
    marginVertical: 14,
  },
  ccBalanceLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 1.2
  },
  ccBalanceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#34D399',
    marginTop: 4
  },
  ccFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 14,
    marginTop: 4,
    gap: 12
  },
  ccHolderLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 1
  },
  ccHolderNameDetail: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  ccMiniMetricsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  ccMiniLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.8
  },
  ccMiniValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2
  },

  // COMMON UI ELEMENTS
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, marginTop: 12 },
  backButtonText: { fontSize: 14, fontWeight: '600', color: '#475569' },
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