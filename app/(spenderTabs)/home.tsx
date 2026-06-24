// app/(spenderTabs)/home.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
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
const CARD_WIDTH = width * 0.75; 

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

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DynamicCategory | null>(null);
  const [allocateAmount, setAllocateAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Profile Name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (profileData?.full_name) setSpenderName(profileData.full_name);

      // 2. Fetch ALL system/default categories
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
          color: cat.color || '#1F4F59',
          totalSpent: 0,
          allocatedAmount: 0,
          remainingAmount: 0 
        };
      });

      // 3. Fetch active allowance
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

        // 4. Fetch Budgets ug ang direct 'remaining_amount' gikan sa DB
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
                expense_name: exp.description || 'No Description',
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
      Alert.alert("Sipyat", "Palihog pagbutang og saktong kantidad.");
      return;
    }

    const totalCurrentAllocated = categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
    const unallocatedPool = summary.totalAllowance - totalCurrentAllocated;

    if (amountToAllocate > unallocatedPool) {
      Alert.alert("Kulang ang Kwarta", `Ang nabilin nga pool kay ₱${unallocatedPool.toFixed(2)} nalang.`);
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

      Alert.alert("Success", `Na-allocate na ang ₱${amountToAllocate.toFixed(2)}!`);
      setModalVisible(false);
      setAllocateAmount('');
      fetchDashboardData();

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openAllocateModal = (category: DynamicCategory) => {
    if (!summary) {
      Alert.alert("Wala ka'y Allowance", "Dili ka ka-allocate og budget.");
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
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#54C6CC" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#54C6CC']} />}
      >
        {/* Header Block */}
        <View style={styles.headerBackground}>
          <View style={styles.welcomeRow}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.welcomeSubtext}>Welcome Back</Text>
                <Text style={styles.welcomeText}>Hello, {spenderName}! 👋</Text>
              </View>
            </View>
          </View>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Total Remaining Balance</Text>
            <Text style={styles.mainBalance}>
              ₱{summary ? summary.remaining.toLocaleString('en-US', { minimumFractionDigits: 2 }) : "0.00"}
            </Text>
          </View>
        </View>

        {/* Categories Slider */}
        <View style={[styles.contentBody, { marginTop: 25 }]}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sectionTitle}>Expense Categories</Text>
            {categories.length > 1 && <Text style={styles.swipeHint}>Tap to Allocate ➔</Text>}
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.swipeableCardsContainer}
          >
            {categories.map((cat) => {
              // SAKTONG LOGIC: Gi-base ang bar sa nabilin nga kwarta (remainingAmount)
              const remainingPercentage = cat.allocatedAmount > 0 
                ? Math.min((cat.remainingAmount / cat.allocatedAmount) * 100, 100) 
                : 0;

              return (
                <TouchableOpacity 
                  key={cat.id} 
                  activeOpacity={0.85}
                  onPress={() => openAllocateModal(cat)}
                  style={[styles.catCard, { backgroundColor: cat.color, width: CARD_WIDTH }]}
                >
                  <View style={styles.cardTop}>
                    {/* @ts-ignore */}
                    <Ionicons name={cat.icon} size={26} color="#FFFFFF" />
                    <Text style={styles.cardNetwork}>{cat.name}</Text>
                  </View>

                  <View style={styles.cardMiddle}>
                    <Text style={styles.cardBalanceAmount}>
                      ₱{cat.remainingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.cardLabel}>Budget Left</Text>
                  </View>

                  {/* Progressive Bar: Mo-shrink samtang hurot-hurot ang budget */}
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

        {/* Dynamic Allowance Status Widget */}
        {summary && (
          <View style={styles.contentBody}>
            <View style={styles.budgetOverviewCard}>
              <Text style={styles.overviewTitle}>{summary.allowanceName}</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min((summary.totalSpent / summary.totalAllowance) * 100, 100)}%` }]} />
              </View>
              <View style={styles.walletMetrics}>
                <Text style={styles.metricText}>Total Allowance: ₱{summary.totalAllowance.toFixed(0)}</Text>
                <Text style={styles.metricText}>Spent: ₱{summary.totalSpent.toFixed(0)}</Text>
              </View>
            </View>

            {/* Transactions List */}
            <View style={styles.recentSectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
            </View>

            {recentExpenses.length === 0 ? (
              <View style={styles.noRecentBox}>
                <Text style={styles.noRecentText}>No recorded expenses yet.</Text>
              </View>
            ) : (
              <View style={styles.recentListContainer}>
                {recentExpenses.map((item) => (
                  <View key={item.id} style={styles.recentItem}>
                    <View style={styles.recentLeft}>
                      <View style={styles.iconBox}>
                        {/* @ts-ignore */}
                        <Ionicons name={item.category_icon} size={18} color="#213502" />
                      </View>
                      <View>
                        <Text style={styles.recentName}>{item.expense_name}</Text>
                        <Text style={styles.recentCategory}>{item.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.recentAmount}>-₱{item.amount.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Allocation Budget Modal */}
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Allocate Budget</Text>
            <TextInput style={styles.modalInput} placeholder="₱0.00" keyboardType="numeric" value={allocateAmount} onChangeText={setAllocateAmount} />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setModalVisible(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmBtn]} onPress={handleAllocateBudget}><Text style={styles.confirmBtnText}>Allocate</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9' },
  scrollContent: { paddingBottom: 40 },
  headerBackground: { backgroundColor: '#0E2417', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 45 : 20, paddingBottom: 35, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  welcomeSubtext: { fontSize: 12, color: '#A3B8AD' },
  welcomeText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  balanceContainer: { alignItems: 'center', marginVertical: 10 },
  balanceLabel: { fontSize: 13, color: '#A3B8AD', marginBottom: 5 },
  mainBalance: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF' },
  contentBody: { paddingHorizontal: 20, marginTop: 15 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  swipeHint: { fontSize: 11, color: '#8A9A91', fontWeight: '600' },
  swipeableCardsContainer: { gap: 15, paddingHorizontal: 5, paddingBottom: 10 },
  catCard: { padding: 18, borderRadius: 18, height: 165, justifyContent: 'space-between', marginRight: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNetwork: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: 'bold' },
  cardMiddle: { marginTop: 8 },
  cardBalanceAmount: { color: '#FFFFFF', fontSize: 26, fontWeight: 'bold' },
  cardLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBottomRowVertical: { borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 10, marginTop: 4, width: '100%' },
  cardProgressBarBg: { height: 6, backgroundColor: 'rgba(255, 255, 255, 0.25)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  cardProgressBarFill: { height: '100%', backgroundColor: '#0CD964', borderRadius: 3 },
  cardProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardProgressText: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 11, fontWeight: '500' },
  budgetOverviewCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#EBEFEF', marginVertical: 15 },
  overviewTitle: { fontSize: 14, fontWeight: 'bold', color: '#0E2417', textTransform: 'uppercase' },
  progressBarBg: { height: 6, backgroundColor: '#EBEFEF', borderRadius: 3, marginTop: 12, marginBottom: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#0CD964', borderRadius: 3 },
  walletMetrics: { flexDirection: 'row', justifyContent: 'space-between' },
  metricText: { color: '#557261', fontSize: 12 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#0E2417' },
  recentSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 12 },
  recentListContainer: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEFEF', borderRadius: 14, overflow: 'hidden' },
  recentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F8FAF9' },
  recentLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EBF7F1', justifyContent: 'center', alignItems: 'center' },
  recentName: { fontSize: 14, fontWeight: '600', color: '#0E2417' },
  recentCategory: { fontSize: 11, color: '#8A9A91', marginTop: 2 },
  recentAmount: { fontSize: 14, fontWeight: 'bold', color: '#C0392B' },
  noRecentBox: { padding: 30, backgroundColor: '#FFFFFF', borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#EBEFEF' },
  noRecentText: { fontSize: 13, color: '#8A9A91' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#FFFFFF', width: '85%', padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalInput: { borderWidth: 1, borderColor: '#CCC', padding: 10, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalButton: { padding: 10, borderRadius: 8 },
  cancelBtn: { backgroundColor: '#EEE' },
  cancelBtnText: { color: '#333' },
  confirmBtn: { backgroundColor: '#0E2417' },
  confirmBtnText: { color: '#FFF' }
});