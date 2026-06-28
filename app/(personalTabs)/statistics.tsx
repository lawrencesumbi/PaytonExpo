// app/(spenderTabs)/statistics.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
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
import { Circle, Path, Svg } from 'react-native-svg';
import { supabase } from '../../lib/supabase';

interface TransactionItem {
  id: string;
  amount: number;
  description: string;
  spent_at: string;
  budgets: {
    categories: {
      name: string;
      icon: string;
      color: string;
    } | null;
  } | null;
}

type FilterPeriod = 'Day' | 'Week' | 'Month' | 'Year';

export default function StatisticsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<FilterPeriod>('Week');
  const [loading, setLoading] = useState(true);
  const [totalSpendings, setTotalSpendings] = useState(0);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  const fetchStatisticsData = useCallback(async (selectedPeriod: FilterPeriod) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let dateLimit = new Date();
      if (selectedPeriod === 'Day') dateLimit.setDate(dateLimit.getDate() - 1);
      else if (selectedPeriod === 'Week') dateLimit.setDate(dateLimit.getDate() - 7);
      else if (selectedPeriod === 'Month') dateLimit.setMonth(dateLimit.getMonth() - 1);
      else if (selectedPeriod === 'Year') dateLimit.setFullYear(dateLimit.getFullYear() - 1);

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id,
          amount,
          description,
          spent_at,
          budgets (
            categories (
              name,
              icon,
              color
            )
          )
        `)
        .gte('spent_at', dateLimit.toISOString())
        .order('spent_at', { ascending: false });

      if (error) throw error;

      const validExpenses = (data || []) as unknown as TransactionItem[];
      setTransactions(validExpenses);

      const total = validExpenses.reduce((sum, item) => sum + item.amount, 0);
      setTotalSpendings(total);
    } catch (error: any) {
      console.error('Fetch Statistics Error:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatisticsData(period);
  }, [period, fetchStatisticsData]);

  const formatTransactionDate = (dateString: string) => {
    const tDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (tDate.toDateString() === today.toDateString()) return 'TODAY';
    if (tDate.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
    
    return tDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header Row - Giwagtang ang mga icons sa tuo ug gi-fix ang spacing */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          onPress={() => router.replace('/(personalTabs)/budget')} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistic</Text>
        <View style={styles.headerPlaceholder} /> 
      </View>

      {/* Period Filter Tabs */}
      <View style={styles.tabContainer}>
        {(['Day', 'Week', 'Month', 'Year'] as FilterPeriod[]).map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            style={[styles.tabButton, period === p && styles.activeTabButton]}
          >
            <Text style={[styles.tabText, period === p && styles.activeTabText]}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Total Spendings Display */}
      <View style={styles.spendingContainer}>
        <Text style={styles.spendingLabel}>Total Spendings</Text>
        <Text style={styles.spendingAmount}>
          ₱{totalSpendings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>

      {/* Curved Graph Simulation */}
      <View style={styles.chartContainer}>
        <Svg height="120" width="100%">
          <Path
            d="M0,90 Q40,40 90,70 T200,40 T300,80 T400,30"
            fill="none"
            stroke="#164E63"
            strokeWidth="3"
          />
          <Path
            d="M0,75 Q50,110 110,60 T220,35 T320,65 T400,55"
            fill="none"
            stroke="#A3E635"
            strokeWidth="3"
          />
          <Circle cx="180" cy="42" r="7" fill="#FFFFFF" stroke="#A3E635" strokeWidth="4" />
        </Svg>
        <View style={styles.tooltipBadge}>
          <Text style={styles.tooltipText}>
            ₱{(totalSpendings * 0.12).toFixed(0)}
          </Text>
        </View>
      </View>

      {/* Transaction History Bottom Sheet */}
      <View style={styles.historyContainer}>
        <View style={styles.dragIndicator} />
        
        <View style={styles.historyHeaderRow}>
          <Text style={styles.historyTitle}>Transaction History</Text>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => router.push('/(personalTabs)/transaction')} // Pwede sad replace() kung gusto nimo dretso ilis ang screen
            >
            <Text style={styles.viewAllText}>View all {'>'}</Text>
            </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#0F172A" style={{ marginTop: 40 }} />
        ) : transactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions logged for this duration.</Text>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => {
              const category = item.budgets?.categories;
              return (
                <View style={styles.transactionCard}>
                  <View style={styles.leftRow}>
                    <View style={[styles.avatarIcon, { backgroundColor: category?.color ? `${category.color}15` : '#F1F5F9' }]}>
                      <Ionicons 
                        name={(category?.icon as any) || 'document-text-outline'} 
                        size={18} 
                        color={category?.color || '#64748B'} 
                      />
                    </View>
                    <View style={styles.textMetadata}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.description}</Text>
                      <Text style={styles.itemTime}>
                        {formatTransactionDate(item.spent_at)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.rightRow}>
                    <Text style={styles.itemAmount}>
                      -₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.itemCategoryName}>
                      {category?.name || 'Expense'}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#061F1A',
    // Gi-fix ang top spacing para sa Android ug iOS status bars aron dili mo-overlap
    paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0 
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 10,
  },
  backButton: { 
    padding: 6,
    marginLeft: -6 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#FFFFFF',
    textAlign: 'center' 
  },
  headerPlaceholder: { 
    width: 32 // Gigamit para magpabiling sentro ang title bisan walay icon sa tuo
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 4,
    marginTop: 12,
  },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20 },
  activeTabButton: { backgroundColor: '#A3E635' },
  tabText: { color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: 13 },
  activeTabText: { color: '#061F1A', fontWeight: '700' },
  spendingContainer: { alignItems: 'center', marginTop: 24, marginBottom: 6 },
  spendingLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500' },
  spendingAmount: { color: '#FFFFFF', fontSize: 36, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
  chartContainer: { height: 120, width: '100%', paddingHorizontal: 10, position: 'relative', justifyContent: 'center', marginBottom: 8 },
  tooltipBadge: {
    position: 'absolute',
    top: 5,
    left: '42%',
    backgroundColor: '#A3E635',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tooltipText: { color: '#061F1A', fontSize: 11, fontWeight: '700' },
  historyContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  historyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  historyTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  viewAllText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  emptyText: { color: '#94A3B8', textAlign: 'center', marginTop: 40, fontSize: 14 },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  leftRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 0.7 },
  avatarIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  textMetadata: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  itemTime: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  rightRow: { alignItems: 'flex-end', flex: 0.3 },
  itemAmount: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  itemCategoryName: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '400' },
});