// app/(spenderTabs)/home.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase'; // I-adjust ang path sumala sa folder structure

interface DashboardSummary {
  allowanceName: string;
  totalAllowance: number;
  totalSpent: number;
  remaining: number;
}

interface CategoryTotal {
  food: number;
  travel: number;
  school: number;
}

interface RecentExpense {
  id: string;
  expense_name: string;
  amount: number;
  category: string;
}

export default function SpenderHomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<CategoryTotal>({ food: 0, travel: 0, school: 0 });
  const [recentExpenses, setRecentExpenses] = useState<RecentExpense[]>([]);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch the latest active allowance
      const { data: allowanceData, error: allowanceError } = await supabase
        .from('allowances')
        .select('id, allowance_name, amount')
        .eq('spender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (allowanceError) throw allowanceError;

      if (allowanceData && allowanceData.length > 0) {
        const activeAllowance = allowanceData[0];

        // 2. Fetch all expenses under this allowance
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('id, expense_name, amount, category')
          .eq('allowance_id', activeAllowance.id)
          .order('created_at', { ascending: false });

        if (expensesError) throw expensesError;

        const list = expensesData || [];
        
        // Kwentahon ang totals ug breakdown sa categories
        let totalSpent = 0;
        let foodSum = 0;
        let travelSum = 0;
        let schoolSum = 0;

        list.forEach((item) => {
          totalSpent += item.amount;
          if (item.category.toLowerCase() === 'food') foodSum += item.amount;
          else if (item.category.toLowerCase() === 'travel') travelSum += item.amount;
          else if (item.category.toLowerCase() === 'school') schoolSum += item.amount;
        });

        setSummary({
          allowanceName: activeAllowance.allowance_name,
          totalAllowance: activeAllowance.amount,
          totalSpent: totalSpent,
          remaining: activeAllowance.amount - totalSpent
        });

        setCategories({ food: foodSum, travel: travelSum, school: schoolSum });
        
        // I-set ang top 3 recent expenses ra para sa home preview
        setRecentExpenses(list.slice(0, 3));
      } else {
        setSummary(null);
      }
    } catch (error: any) {
      console.error("Spender Dashboard Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#0CD964" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0CD964']} />}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.welcomeText}>Kumusta, Spender! 👋</Text>
            <Text style={styles.subWelcome}>Ania ang dagan sa imong pitaka karon.</Text>
          </View>
        </View>

        {!summary ? (
          /* Empty State kung wala pay gi-set nga allowance */
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={54} color="#7DA08E" />
            <Text style={styles.emptyText}>Wala pa kay Active Allowance</Text>
            <Text style={styles.emptySub}>Inig hatag og allowance sa imong Sponsor, makita nimo ang imong dashboard diri dayon.</Text>
          </View>
        ) : (
          <View style={{ gap: 20 }}>
            
            {/* Big Wallet Progress Card */}
            <View style={styles.walletCard}>
              <Text style={styles.allowanceLabel}>{summary.allowanceName}</Text>
              <Text style={styles.remainingAmount}>Public ₱{summary.remaining.toFixed(2)}</Text>
              <Text style={styles.walletSubtext}>Nabilin nga Kwarta</Text>
              
              {/* Progress Bar Component */}
              <View style={styles.progressBarBg}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${Math.min((summary.totalSpent / summary.totalAllowance) * 100, 100)}%` }
                  ]} 
                />
              </View>

              <View style={styles.walletMetrics}>
                <Text style={styles.metricText}>Gihatag: ₱{summary.totalAllowance.toFixed(0)}</Text>
                <Text style={styles.metricText}>Nagasto: ₱{summary.totalSpent.toFixed(0)}</Text>
              </View>
            </View>

            {/* Category Breakdown Widgets */}
            <Text style={styles.sectionTitle}>Breakdown sa Gasto</Text>
            <View style={styles.categoryGrid}>
              <View style={[styles.catCard, { borderLeftColor: '#F1C40F' }]}>
                <Ionicons name="fast-food" size={20} color="#F1C40F" />
                <Text style={styles.catCardLabel}>Food</Text>
                <Text style={styles.catCardAmount}>₱{categories.food.toFixed(2)}</Text>
              </View>

              <View style={[styles.catCard, { borderLeftColor: '#3498DB' }]}>
                <Ionicons name="car" size={20} color="#3498DB" />
                <Text style={styles.catCardLabel}>Travel</Text>
                <Text style={styles.catCardAmount}>₱{categories.travel.toFixed(2)}</Text>
              </View>

              <View style={[styles.catCard, { borderLeftColor: '#9B59B6' }]}>
                <Ionicons name="book" size={20} color="#9B59B6" />
                <Text style={styles.catCardLabel}>School</Text>
                <Text style={styles.catCardAmount}>₱{categories.school.toFixed(2)}</Text>
              </View>
            </View>

            {/* Recent Expenses Preview List */}
            <View style={styles.recentSectionHeader}>
              <Text style={styles.sectionTitle}>Bag-ong Gasto</Text>
            </View>

            {recentExpenses.length === 0 ? (
              <View style={styles.noRecentBox}>
                <Text style={styles.noRecentText}>Wala pa kay narekord nga gasto.</Text>
              </View>
            ) : (
              <View style={styles.recentListContainer}>
                {recentExpenses.map((item) => (
                  <View key={item.id} style={styles.recentItem}>
                    <View style={styles.recentLeft}>
                      <View style={styles.iconBox}>
                        <Ionicons 
                          name={item.category.toLowerCase() === 'food' ? "fast-food" : item.category.toLowerCase() === 'travel' ? "car" : "book"} 
                          size={16} 
                          color="#213502" 
                        />
                      </View>
                      <Text style={styles.recentName}>{item.expense_name}</Text>
                    </View>
                    <Text style={styles.recentAmount}>-₱{item.amount.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            )}

          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  welcomeRow: { marginBottom: 20, marginTop: Platform.OS === 'android' ? 15 : 5 },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#213502' },
  subWelcome: { fontSize: 13, color: '#557261', marginTop: 2 },
  
  // Wallet Card Styles
  walletCard: { backgroundColor: '#213502', padding: 20, borderRadius: 16, elevation: 2 },
  allowanceLabel: { color: '#7DA08E', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  remainingAmount: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold', marginTop: 4 },
  walletSubtext: { color: '#7DA08E', fontSize: 12, marginTop: 2 },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, marginTop: 16, marginBottom: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#0CD964', borderRadius: 3 },
  walletMetrics: { flexDirection: 'row', justifyContent: 'space-between' },
  metricText: { color: '#FFFFFF', fontSize: 11, opacity: 0.8 },

  // Grid Categories Styles
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#213502', marginTop: 6 },
  categoryGrid: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  catCard: { flex: 1, backgroundColor: '#F4F7F5', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8E4', borderLeftWidth: 4, gap: 4 },
  catCardLabel: { fontSize: 12, color: '#557261', fontWeight: '500' },
  catCardAmount: { fontSize: 14, fontWeight: 'bold', color: '#213502' },

  // Recent Expenses Section
  recentSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentListContainer: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8E4', borderRadius: 12, overflow: 'hidden' },
  recentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F4F7F5' },
  recentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4F7F5', justifyContent: 'center', alignItems: 'center' },
  recentName: { fontSize: 14, fontWeight: '600', color: '#213502' },
  recentAmount: { fontSize: 14, fontWeight: 'bold', color: '#C0392B' },
  noRecentBox: { padding: 20, backgroundColor: '#F4F7F5', borderRadius: 10, alignItems: 'center' },
  noRecentText: { fontSize: 13, color: '#557261' },

  // Empty State
  emptyState: { padding: 40, alignItems: 'center', gap: 10, marginTop: 40 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#213502' },
  emptySub: { fontSize: 12, color: '#557261', textAlign: 'center', lineHeight: 18 }
});