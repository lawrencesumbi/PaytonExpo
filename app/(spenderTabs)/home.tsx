// app/(spenderTabs)/home.tsx
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  StatusBar as NativeStatusBar,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.78; 

interface DashboardSummary {
  allowanceId: string;
  allowanceName: string;
  totalAllowance: number;
  totalSpent: number;
  remaining: number;
}

interface DynamicCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalSpent: number;
  allocatedAmount: number;
  remainingAmount: number; 
}

interface RecentExpense {
  id: string;
  expense_name: string;
  amount: number;
  category: string;
  category_icon: string;
}

export default function SpenderHomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [spenderName, setSpenderName] = useState('Spender');
  
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<DynamicCategory[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<RecentExpense[]>([]);

  // Modal Allocation Layer States
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DynamicCategory | null>(null);
  const [allocateAmount, setAllocateAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // FETCH INTEGRATED LEDGER DASHBOARD DATA DATASETS
  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (profileData?.full_name) setSpenderName(profileData.full_name);

      const { data: allCategoriesData, error: catError } = await supabase
        .from('categories')
        .select('id, name, icon, color')
        .or(`user_id.is.null,user_id.eq.${user.id}`);

      if (catError) throw catError;

      const categoryMap: { [key: string]: DynamicCategory } = {};
      (allCategoriesData || []).forEach((cat) => {
        categoryMap[cat.id] = {
          id: cat.id,
          name: cat.name,
          icon: cat.icon || 'options',
          color: cat.color || '#1E293B',
          totalSpent: 0,
          allocatedAmount: 0,
          remainingAmount: 0 
        };
      });

      const { data: allowanceData, error: allowanceError } = await supabase
        .from('allowances')
        .select('id, allowance_name, amount')
        .eq('spender_id', user.id)
        .order('received_at', { ascending: false })
        .limit(1);

      if (allowanceError) throw allowanceError;

      let totalSpentCounter = 0;
      let totalAllocatedCounter = 0;
      const allExpenses: RecentExpense[] = [];

      if (allowanceData && allowanceData.length > 0) {
        const activeAllowance = allowanceData[0];

        const { data: budgetsData, error: budgetsError } = await supabase
          .from('budgets')
          .select(`
            id,
            category_id,
            allocated_amount,
            remaining_amount,
            expenses (
              id,
              description,
              amount,
              spent_at
            )
          `)
          .eq('user_id', user.id);

        if (budgetsError) throw budgetsError;

        (budgetsData || []).forEach((budget: any) => {
          const catId = budget.category_id;
          const currentAllocation = Number(budget.allocated_amount || 0);
          const dbRemaining = Number(budget.remaining_amount || 0); 
          
          totalAllocatedCounter += currentAllocation;

          const expensesList = budget.expenses || [];
          const categoryTotalSpent = expensesList.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0);
          
          totalSpentCounter += categoryTotalSpent;

          if (categoryMap[catId]) {
            categoryMap[catId].totalSpent = categoryTotalSpent;
            categoryMap[catId].allocatedAmount = currentAllocation;
            categoryMap[catId].remainingAmount = dbRemaining; 
          }

          expensesList.forEach((exp: any) => {
            if (categoryMap[catId]) {
              allExpenses.push({
                id: exp.id,
                expense_name: exp.description || 'Uncategorized Expense',
                amount: Number(exp.amount),
                category: categoryMap[catId].name,
                category_icon: categoryMap[catId].icon
              });
            }
          });
        });

        allExpenses.sort((a, b) => b.id.localeCompare(a.id));

        setSummary({
          allowanceId: activeAllowance.id,
          allowanceName: activeAllowance.allowance_name,
          totalAllowance: Number(activeAllowance.amount),
          totalSpent: totalSpentCounter,
          remaining: Number(activeAllowance.amount) - totalAllocatedCounter 
        });

        setRecentExpenses(allExpenses.slice(0, 5));
      } else {
        setSummary(null);
        setRecentExpenses([]);
      }

      setCategories(Object.values(categoryMap));

    } catch (error: any) {
      console.error("Spender Dashboard Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAllocateBudget = async () => {
    if (!selectedCategory || !summary) return;
    const amountToAllocate = parseFloat(allocateAmount);

    if (isNaN(amountToAllocate) || amountToAllocate <= 0) {
      Alert.alert("Invalid Input", "Please enter a positive numeric value to allocate capital.");
      return;
    }

    const totalCurrentAllocated = categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
    const unallocatedPool = summary.totalAllowance - totalCurrentAllocated;

    if (amountToAllocate > unallocatedPool) {
      Alert.alert("Allocation Denied", `You do not have enough unallocated allowance tokens. Remaining unallocated pool is ₱${unallocatedPool.toFixed(2)}.`);
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingBudget, error: checkError } = await supabase
        .from('budgets')
        .select('id, allocated_amount, remaining_amount')
        .eq('user_id', user.id)
        .eq('category_id', selectedCategory.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingBudget) {
        const newTotalAllocation = Number(existingBudget.allocated_amount) + amountToAllocate;
        const newRemainingAmount = Number(existingBudget.remaining_amount || 0) + amountToAllocate;
        
        const { error: updateError } = await supabase
          .from('budgets')
          .update({ 
            allocated_amount: newTotalAllocation,
            remaining_amount: newRemainingAmount
          })
          .eq('id', existingBudget.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('budgets')
          .insert({
            user_id: user.id,
            category_id: selectedCategory.id,
            allocated_amount: amountToAllocate,
            remaining_amount: amountToAllocate
          });

        if (insertError) throw insertError;
      }

      Alert.alert("Allocation Success 🎉", `Successfully injected ₱${amountToAllocate.toFixed(2)} into ${selectedCategory.name}.`);
      setModalVisible(false);
      setAllocateAmount('');
      fetchDashboardData();

    } catch (error: any) {
      Alert.alert("Process Aborted", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openAllocateModal = (category: DynamicCategory) => {
    if (!summary) {
      Alert.alert("No Allowance Active", "You cannot allocate capital folders because there is no active wallet allowance provision recorded on your account dashboard.");
      return;
    }
    setSelectedCategory(category);
    setModalVisible(true);
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
      <SafeAreaView style={[styles.container, styles.centeredLoading]}>
        <StatusBar style="light" />
        <ActivityIndicator size="small" color="#10B981" />
      </SafeAreaView>
    );
  }

  // Calculate global spent percentage for header progress alignment
  const globalSpentPercentage = summary && summary.totalAllowance > 0
    ? Math.min((summary.totalSpent / summary.totalAllowance) * 100, 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />}
      >
        {/* Immersive Dark Fintech Balance Card Panel */}
        <View style={styles.headerBackground}>
          <View style={styles.welcomeRow}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.welcomeSubtext}>Welcome Back</Text>
                <Text style={styles.welcomeText}>Hello, {spenderName}! 👋</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Unallocated Allowance Pool</Text>
            <Text style={styles.mainBalance}>
              ₱{summary ? summary.remaining.toLocaleString('en-US', { minimumFractionDigits: 2 }) : "0.00"}
            </Text>
          </View>

          {/* NEW INTEGRATED ALLOWANCE INSIGHT BLOCK */}
          {summary && (
            <View style={styles.headerMetricsWrapper}>
              <View style={styles.headerProgressBarBg}>
                <View style={[styles.headerProgressBarFill, { width: `${globalSpentPercentage}%` }]} />
              </View>
              <View style={styles.headerMetricsRow}>
                <Text style={styles.headerMetricText}>Total Matrix Target: ₱{summary.totalAllowance.toLocaleString()}</Text>
                <Text style={styles.headerMetricText}>Aggregate Spent: ₱{summary.totalSpent.toLocaleString()}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Categories Horizon Stream Slider */}
        <View style={[styles.contentBody, { marginTop: 24 }]}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sectionTitle}>Expense Folders</Text>
            {categories.length > 1 && <Text style={styles.swipeHint}>Tap Card to Fund ➔</Text>}
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.swipeableCardsContainer}
          >
            {categories.map((cat) => {
              const remainingPercentage = cat.allocatedAmount > 0 
                ? Math.min((cat.remainingAmount / cat.allocatedAmount) * 100, 100) 
                : 0;

              return (
                <TouchableOpacity 
                  key={cat.id} 
                  activeOpacity={0.9}
                  onPress={() => openAllocateModal(cat)}
                  style={[styles.catCard, { backgroundColor: cat.color || '#1E293B', width: CARD_WIDTH }]}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.cardIconWrapper}>
                      {/* @ts-ignore */}
                      <Ionicons name={cat.icon} size={22} color="#FFFFFF" />
                    </View>
                    <Text style={styles.cardNetwork}>{cat.name}</Text>
                  </View>

                  <View style={styles.cardMiddle}>
                    <Text style={styles.cardBalanceAmount}>
                      ₱{cat.remainingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.cardLabel}>Remaining Balance</Text>
                  </View>

                  {/* Progressive Matrix Metric Fill */}
                  <View style={styles.cardBottomRowVertical}>
                    <View style={styles.cardProgressBarBg}>
                      <View style={[styles.cardProgressBarFill, { width: `${remainingPercentage}%` }]} />
                    </View>
                    <View style={styles.cardProgressLabels}>
                      <Text style={styles.cardProgressText}>Limit: ₱{cat.allocatedAmount.toFixed(0)}</Text>
                      <Text style={styles.cardProgressText}>Spent: ₱{cat.totalSpent.toFixed(0)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Recents Ledger Stack */}
        <View style={styles.contentBody}>
          <View style={styles.recentSectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
          </View>

          {recentExpenses.length === 0 ? (
            <View style={styles.noRecentBox}>
              <Text style={styles.noRecentText}>No captured transaction entries found.</Text>
            </View>
          ) : (
            <View style={styles.recentListContainer}>
              {recentExpenses.map((item) => (
                <View key={item.id} style={styles.recentItem}>
                  <View style={styles.recentLeft}>
                    <View style={styles.iconBox}>
                      {/* @ts-ignore */}
                      <Ionicons name={item.category_icon} size={16} color="#475569" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recentName} numberOfLines={1}>{item.expense_name}</Text>
                      <Text style={styles.recentCategory}>{item.category}</Text>
                    </View>
                  </View>
                  <Text style={styles.recentAmount}>-₱{item.amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Allocation Budget Flow Modal Component */}
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Fund Allocation Folder</Text>
            <Text style={styles.modalSubText}>Inject unallocated allowance pool assets directly into this designated expense folder stream.</Text>
            
            <TextInput 
              style={styles.modalInput} 
              placeholder="₱0.00" 
              placeholderTextColor="#94A3B8"
              keyboardType="numeric" 
              value={allocateAmount} 
              onChangeText={setAllocateAmount} 
              editable={!submitting}
            />
            
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setModalVisible(false)} disabled={submitting}>
                <Text style={styles.cancelBtnText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmBtn]} onPress={handleAllocateBudget} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm Fund</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFD' },
  centeredLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E293B' },
  scrollContent: { paddingBottom: 40 },
  
  // Immersive Fintech Header Node
  headerBackground: { 
    backgroundColor: '#1E293B', 
    paddingHorizontal: 22, 
    paddingTop: Platform.OS === 'android' ? (NativeStatusBar.currentHeight ? NativeStatusBar.currentHeight + 14 : 45) : 16, 
    paddingBottom: 28, 
    borderBottomLeftRadius: 28, 
    borderBottomRightRadius: 28 
  },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  welcomeSubtext: { fontSize: 11, color: '#94A3B8' },
  welcomeText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.3 },
  balanceContainer: { alignItems: 'center', marginTop: 10 },
  balanceLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginBottom: 4 },
  mainBalance: { fontSize: 38, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.8 },
  
  // NEW Header Metrics UI Stack
  headerMetricsWrapper: { marginTop: 22, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  headerProgressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  headerProgressBarFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 10}, // Renders fill progress working from left leaning into the RIGHT target anchor point
  headerMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerMetricText: { color: '#94A3B8', fontSize: 11, fontWeight: '500' },

  contentBody: { paddingHorizontal: 22, marginTop: 14 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  swipeHint: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  swipeableCardsContainer: { paddingRight: 22, paddingBottom: 8 },
  
  // Custom Card Matrix Styling Bounds
  catCard: { 
    padding: 20, 
    borderRadius: 22, 
    height: 175, 
    justifyContent: 'space-between', 
    marginRight: 14, 
    shadowColor: '#0F172A', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.12, 
    shadowRadius: 8, 
    elevation: 4 
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardIconWrapper: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  cardNetwork: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', letterSpacing: -0.2 },
  cardMiddle: { marginTop: 12 },
  cardBalanceAmount: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  cardLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 },
  cardBottomRowVertical: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', paddingTop: 12, marginTop: 4, width: '100%' },
  cardProgressBarBg: { height: 5, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 10, overflow: 'hidden', marginBottom: 6 },
  cardProgressBarFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 10 },
  cardProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardProgressText: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 11, fontWeight: '500' },
  
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', letterSpacing: -0.3 },
  recentSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  
  // Ledger Stream Items
  recentListContainer: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 18, overflow: 'hidden' },
  recentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#FAFBFD' },
  recentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 0.75 },
  iconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  recentName: { fontSize: 14, fontWeight: '600', color: '#1E293B', letterSpacing: -0.2 },
  recentCategory: { fontSize: 11, color: '#64748B', marginTop: 1 },
  recentAmount: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  noRecentBox: { padding: 32, backgroundColor: '#FFFFFF', borderRadius: 18, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  noRecentText: { fontSize: 13, color: '#64748B' },
  
  // Adaptive Modal Frameworks
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#FFFFFF', width: '88%', padding: 24, borderRadius: 24, shadowColor: '#0F172A', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', letterSpacing: -0.4 },
  modalSubText: { fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 18, lineHeight: 18 },
  modalInput: { borderWidth: 1, borderColor: '#E2E8F0', padding: 14, borderRadius: 14, marginBottom: 20, fontSize: 18, fontWeight: '600', color: '#1E293B', backgroundColor: '#FAFBFD' },
  modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalButton: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F1F5F9' },
  cancelBtnText: { color: '#475569', fontWeight: '600', fontSize: 14 },
  confirmBtn: { backgroundColor: '#1E293B', minWidth: 110 },
  confirmBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 }
});