import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 170; // Gi-adjust para sa nindot nga horizontal category look
const CARD_MARGIN = 8;
const SNAP_INTERVAL = CARD_WIDTH + (CARD_MARGIN * 2);

interface IncomeSummary {
  id: string;
  sourceName: string;
  amount: number;
  description?: string;
  startDate: string;
  endDate: string;
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

interface RecentActivity {
  id: string;
  name: string;
  amount: number;
  category: string;
  dateString: string;
}

export default function PersonalHomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('User');

  const [income, setIncome] = useState<IncomeSummary | null>(null);
  const [categories, setCategories] = useState<DynamicCategory[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  // Carousels control
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const autoScrollTimer = useRef<any>(null);

  // Modal Allocation States
  const [allocateModalVisible, setAllocateModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DynamicCategory | null>(null);
  const [allocateAmount, setAllocateAmount] = useState('');

  // Modal Add Income States
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [incomeName, setIncomeName] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDesc, setIncomeDesc] = useState('');
  const [incomeStart, setIncomeStart] = useState(new Date().toISOString().split('T')[0]);
  const [incomeEnd, setIncomeEnd] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  const [submitting, setSubmitting] = useState(false);

  // FETCH ALL DATASETS FROM DATABASE
  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Profile Lookup
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (profileData?.full_name) setUserName(profileData.full_name.split(' ')[0]);

      // Category Map Generation
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
          color: cat.color || '#0F766E',
          totalSpent: 0,
          allocatedAmount: 0,
          remainingAmount: 0
        };
      });

      // Income Layer Retrieval (Latest Entry)
      const { data: incomeData, error: incomeError } = await supabase
        .from('income')
        .select('id, source_name, amount, description, start_date, end_date')
        .eq('user_id', user.id)
        .order('received_at', { ascending: false })
        .limit(1);
      if (incomeError) throw incomeError;

      let totalSpentCounter = 0;
      let totalAllocatedCounter = 0;
      const parsedActivities: RecentActivity[] = [];

      if (incomeData && incomeData.length > 0) {
        const activeIncome = incomeData[0];
        setIncome({
          id: activeIncome.id,
          sourceName: activeIncome.source_name,
          amount: Number(activeIncome.amount),
          description: activeIncome.description,
          startDate: activeIncome.start_date,
          endDate: activeIncome.end_date
        });

        // Budgets and Nested Expenses mapping
        const { data: budgetsData, error: budgetsError } = await supabase
          .from('budgets')
          .select(`
            id, category_id, allocated_amount, remaining_amount,
            expenses ( id, description, amount, spent_at )
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
            categoryMap[catId].allocatedAmount = currentAllocation;
            categoryMap[catId].totalSpent = categoryTotalSpent;
            categoryMap[catId].remainingAmount = dbRemaining;
          }

          expensesList.forEach((exp: any) => {
            if (categoryMap[catId]) {
              const dateObj = new Date(exp.spent_at);
              parsedActivities.push({
                id: exp.id,
                name: exp.description || 'General Expense',
                amount: Number(exp.amount),
                category: categoryMap[catId].name,
                dateString: dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) + `, ` + dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              });
            }
          });
        });

        parsedActivities.sort((a, b) => b.id.localeCompare(a.id));
        setRecentActivities(parsedActivities.slice(0, 5));
      } else {
        setIncome(null);
        setRecentActivities([]);
      }

      setCategories(Object.values(categoryMap));
    } catch (error: any) {
      console.error("Personal Dashboard Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // HANDLERS FOR ACTIONS
  const handleAddIncome = async () => {
    const parsedAmount = parseFloat(incomeAmount);
    if (!incomeName || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Error", "Please input a valid source title and dynamic amount configuration.");
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('income')
        .insert({
          user_id: user.id,
          source_name: incomeName,
          amount: parsedAmount,
          description: incomeDesc,
          start_date: incomeStart,
          end_date: incomeEnd
        });

      if (error) throw error;

      Alert.alert("Success 🎉", "Income statement completely logged into ledger account.");
      setIncomeModalVisible(false);
      setIncomeName('');
      setIncomeAmount('');
      setIncomeDesc('');
      fetchDashboardData();
    } catch (error: any) {
      Alert.alert("Execution Refused", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAllocateBudget = async () => {
    if (!selectedCategory || !income) return;
    const amountToAllocate = parseFloat(allocateAmount);

    if (isNaN(amountToAllocate) || amountToAllocate <= 0) {
      Alert.alert("Invalid Input", "Please map a standard positive value.");
      return;
    }

    const totalCurrentAllocated = categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
    const unallocatedPool = income.amount - totalCurrentAllocated;

    if (amountToAllocate > unallocatedPool) {
      Alert.alert("Allocation Denied", `Insufficient unallocated resources remaining. Available asset pool: ₱${unallocatedPool.toFixed(2)}`);
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
        const { error: updateError } = await supabase
          .from('budgets')
          .update({
            allocated_amount: Number(existingBudget.allocated_amount) + amountToAllocate,
            remaining_amount: Number(existingBudget.remaining_amount || 0) + amountToAllocate
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

      Alert.alert("Injected 🎉", `₱${amountToAllocate.toFixed(2)} securely moved into ${selectedCategory.name}.`);
      setAllocateModalVisible(false);
      setAllocateAmount('');
      fetchDashboardData();
    } catch (error: any) {
      Alert.alert("Failure", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ENGINE AUTO ROTATION CAROUSEL FOR CATEGORIES
  const startAutoScrollEngine = () => {
    stopAutoScrollEngine();
    if (categories.length <= 1) return;
    autoScrollTimer.current = window.setInterval(() => {
      setCurrentCardIndex((prevIndex) => {
        const nextIndex = prevIndex >= categories.length - 1 ? 0 : prevIndex + 1;
        flatListRef.current?.scrollToOffset({
          offset: nextIndex * (CARD_WIDTH + CARD_MARGIN),
          animated: true
        });
        return nextIndex;
      });
    }, 4000);
  };

  const stopAutoScrollEngine = () => {
    if (autoScrollTimer.current) {
      window.clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  };

  useEffect(() => {
    fetchDashboardData();
    return () => stopAutoScrollEngine();
  }, []);

  useEffect(() => {
    if (categories.length > 0) startAutoScrollEngine();
  }, [categories]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color="#0D9488" />
      </SafeAreaView>
    );
  }

  // CALCULATING REVENUE AND SPENDING METRICS
  const totalAllocatedBudgetPool = categories.reduce((sum, c) => sum + c.allocatedAmount, 0);
  const totalSpentAcrossSystem = categories.reduce((sum, c) => sum + c.totalSpent, 0);
  const availableLiquidity = income ? income.amount - totalSpentAcrossSystem : 0;
  
  const budgetAllocationPercentage = income && income.amount > 0
    ? Math.min((totalAllocatedBudgetPool / income.amount) * 100, 100)
    : 0;

  // FORMAT DATE RANGES FOR CARD DISPLAY
  const formatDateRange = () => {
    if (!income) return "No active framework tracked";
    const startStr = new Date(income.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const endStr = new Date(income.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />}
      >
        {/* Header Block Section */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Hello, {userName}👋</Text>
            <Text style={styles.nameText}>Spender Overview</Text>
          </View>
          <View style={styles.searchRow}>
            <TouchableOpacity onPress={() => setIncomeModalVisible(true)}>
              <LinearGradient
                colors={["#c5dbd0", "#92bba7"]}
                start={{ x: 0.0, y: 0.0 }}
                end={{ x: 1.0, y: 1.0 }}
                style={styles.searchIconBg}
              >
                <Ionicons name="add" size={20} color="#000000" />
              </LinearGradient>
            </TouchableOpacity>
            <Ionicons name="calendar-clear" size={26} color="#64748B" />
          </View>
        </View>

        {/* Main LinearGradient Wallet Display Context */}
        <TouchableOpacity activeOpacity={0.95} onPress={() => setIncomeModalVisible(true)}>
          <LinearGradient
            colors={['#79b5c7', '#ccf3d7']}
            start={{ x: 0.0, y: 0.0 }}
            end={{ x: 1.1, y: 1.0 }}
            style={styles.gradient1}
          >
            <View style={styles.allowanceFullWidth}>
              <Text style={styles.cardLabelLight}>Total Budget (Income: {income?.sourceName || 'None'})</Text>

              <View style={styles.amountRow}>
                <Text style={styles.allowanceText}>₱ {totalAllocatedBudgetPool.toLocaleString('en-US', { minimumFractionDigits: 2 })}/</Text>
                <Text style={styles.totalLimitText}>₱{income ? income.amount.toLocaleString() : '0'}</Text>
              </View>

              <Text style={styles.dateText}>{formatDateRange()}</Text>

              <View style={styles.progressBarContainer}>
                <LinearGradient
                  colors={['#38BDF8', '#166534']}
                  start={{ x: 0.0, y: 0.5 }}
                  end={{ x: 1.0, y: 0.5 }}
                  style={[styles.progressBarFill, { width: `${budgetAllocationPercentage}%` }]}
                />
                <Text style={styles.progressText}>{budgetAllocationPercentage.toFixed(0)}% Allocated</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Sub-Metric System Grid */}
        <View style={styles.statsRow}>
          <View style={styles.subCard}>
            <Text style={styles.cardLabelDark}>Total Spent</Text>
            <Text style={styles.statsAmount}>₱ {totalSpentAcrossSystem.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.subCard}>
            <Text style={styles.cardLabelDark}>Available Cash</Text>
            <Text style={styles.statsAmount}>₱ {availableLiquidity.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        {/* Categories Structural Slider System */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Budget Sectors Folder</Text>
          <Text style={styles.seeAllText}>Swipe to View</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={categories}
          horizontal
          decelerationRate="fast"
          snapToInterval={SNAP_INTERVAL}
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={stopAutoScrollEngine}
          style={styles.horizontalScroll}
          contentContainerStyle={styles.horizontalScrollContent}
          keyExtractor={(item) => item.id}
          renderItem={({ item: cat }) => {
            const progressRatio = cat.allocatedAmount > 0
              ? Math.min((cat.remainingAmount / cat.allocatedAmount) * 100, 100)
              : 0;

            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  setSelectedCategory(cat);
                  setAllocateModalVisible(true);
                }}
                style={[styles.paymentCard, { backgroundColor: '#FFFFFF' }]}
              >
                <View style={styles.paymentCardHeader}>
                  <View style={[styles.brandIconPlaceholder, { backgroundColor: cat.color || '#0F766E', justifyContent: 'center', alignItems: 'center' }]}>
                    {/* @ts-ignore */}
                    <Ionicons name={cat.icon} size={14} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.dotsText, { color: cat.color }]}>●</Text>
                </View>
                <Text style={styles.paymentCardTitle} numberOfLines={1}>{cat.name}</Text>
                <Text style={styles.paymentCardPrice}>₱{cat.remainingAmount.toLocaleString()}</Text>
                
                {/* Sector Micro ProgressBar Indicators */}
                <View style={{ height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${progressRatio}%`, height: '100%', backgroundColor: cat.color || '#0F766E' }} />
                </View>
                <Text style={styles.paymentCardDays}>{progressRatio.toFixed(0)}% Left</Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Recent Activities Dataset View */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <TouchableOpacity onPress={fetchDashboardData}><Text style={styles.seeAllText}>Refresh</Text></TouchableOpacity>
        </View>

        <View style={styles.activitiesContainer}>
          {recentActivities.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: '#94A3B8' }}>No recorded transactions found across budget segments.</Text>
            </View>
          ) : (
            recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityLeft}>
                  <View style={styles.activityIconPlaceholder}>
                    <Ionicons name="card" size={16} color="#64748B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityName} numberOfLines={1}>{activity.name}</Text>
                    <Text style={styles.activityDate}>{activity.dateString} • {activity.category}</Text>
                  </View>
                </View>
                <Text style={styles.activityAmountNegative}>-₱ {activity.amount.toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* MODAL SYSTEM 1: FUND INJECTION OVERLAY FLOW */}
      <Modal animationType="slide" transparent={true} visible={allocateModalVisible} onRequestClose={() => setAllocateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Allocate Capital Pool</Text>
            <Text style={styles.modalSubText}>Distribute available revenue resources directly into your dynamic segment folder: <Text style={{fontWeight: '700', color: '#0F172A'}}>{selectedCategory?.name}</Text></Text>

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
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setAllocateModalVisible(false)} disabled={submitting}>
                <Text style={styles.cancelBtnText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmBtn]} onPress={handleAllocateBudget} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.confirmBtnText}>Inject Funds</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL SYSTEM 2: COMPREHENSIVE ADD NEW INCOME SYSTEM */}
      <Modal animationType="slide" transparent={true} visible={incomeModalVisible} onRequestClose={() => setIncomeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Establish Revenue Statement</Text>
            <Text style={styles.modalSubText}>Input active incoming payroll, gifts, or contracts metrics.</Text>

            <TextInput
              style={[styles.modalInput, { marginBottom: 12, fontSize: 14, fontWeight: 'normal' }]}
              placeholder="Source Name (e.g., Monthly Salary)"
              placeholderTextColor="#94A3B8"
              value={incomeName}
              onChangeText={setIncomeName}
              editable={!submitting}
            />

            <TextInput
              style={[styles.modalInput, { marginBottom: 12, fontSize: 14, fontWeight: 'normal' }]}
              placeholder="Amount (₱)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={incomeAmount}
              onChangeText={setIncomeAmount}
              editable={!submitting}
            />

            <TextInput
              style={[styles.modalInput, { marginBottom: 12, fontSize: 14, fontWeight: 'normal' }]}
              placeholder="Description (Optional)"
              placeholderTextColor="#94A3B8"
              value={incomeDesc}
              onChangeText={setIncomeDesc}
              editable={!submitting}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Start Date</Text>
                <TextInput
                  style={[styles.modalInput, { fontSize: 12, padding: 8, fontWeight: 'normal' }]}
                  placeholder="YYYY-MM-DD"
                  value={incomeStart}
                  onChangeText={setIncomeStart}
                  editable={!submitting}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>End Date</Text>
                <TextInput
                  style={[styles.modalInput, { fontSize: 12, padding: 8, fontWeight: 'normal' }]}
                  placeholder="YYYY-MM-DD"
                  value={incomeEnd}
                  onChangeText={setIncomeEnd}
                  editable={!submitting}
                />
              </View>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setIncomeModalVisible(false)} disabled={submitting}>
                <Text style={styles.cancelBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmBtn]} onPress={handleAddIncome} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.confirmBtnText}>Save Income</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 110 : 90,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "column",
  },
  welcomeText: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "600",
  },
  nameText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: "bold",
    marginTop: -2,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchIconBg: {
    padding: 8,
    borderRadius: 99,
    justifyContent: 'center',
    alignItems: 'center'
  },
  gradient1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 22,
    borderRadius: 24,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#14B8A6",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardLabelLight: {
    color: "#094b3d",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  allowanceText: {
    fontSize: 26,
    color: "#ffffff",
    fontWeight: "bold",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  subCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardLabelDark: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  statsAmount: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "bold",
  },
  seeAllText: {
    color: "#0D9488",
    fontSize: 14,
    fontWeight: "600",
  },
  horizontalScroll: {
    marginBottom: 28,
    marginHorizontal: -20,
  },
  horizontalScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  paymentCard: {
    width: CARD_WIDTH,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: CARD_MARGIN
  },
  paymentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brandIconPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  dotsText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  paymentCardTitle: {
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  paymentCardPrice: {
    color: "#475569",
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  paymentCardDays: {
    color: "#0F766E",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4
  },
  activitiesContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 0.75
  },
  activityIconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: 'center',
    alignItems: 'center'
  },
  activityName: {
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "600",
  },
  activityDate: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 2,
  },
  activityAmountNegative: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "bold",
  },
  allowanceFullWidth: {
    width: '100%',
    flexDirection: 'column',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  totalLimitText: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "700",
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#0F766E",
    fontWeight: '600',
    marginBottom: 10,
  },
  progressBarContainer: {
    width: '100%',
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    marginTop: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 16,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressText: {
    alignSelf: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
    zIndex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    width: '88%',
    padding: 24,
    borderRadius: 24,
    elevation: 10
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A'
  },
  modalSubText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#F8FAFC'
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9'
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600'
  },
  confirmBtn: {
    backgroundColor: '#0F766E',
    minWidth: 100
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '600'
  }
});