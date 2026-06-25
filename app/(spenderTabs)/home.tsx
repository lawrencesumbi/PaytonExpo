// app/(spenderTabs)/home.tsx
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  StatusBar as NativeStatusBar,
  PanResponder,
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
const CARD_WIDTH = width * 0.86;
const SWIPE_THRESHOLD = 80; // Gi-ubasan gamay para mas sensitibo ug dali ra i-swipe

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

  // Carousel Stack Index Tracker State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Modal Allocation Layer States
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DynamicCategory | null>(null);
  const [allocateAmount, setAllocateAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Animation drivers para sa swipe mechanics
  const position = useRef(new Animated.ValueXY()).current;

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
          color: cat.color || '#1E463A',
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

  // Sigurado ug solid nga PanResponder bindings para sa pag-swipe sa states
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        position.setValue({ x: gestureState.dx, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD && currentCardIndex < categories.length - 1) {
          // Swipe Left -> Balhin sa Next Card
          Animated.timing(position, {
            toValue: { x: -width - 50, y: 0 },
            duration: 180,
            useNativeDriver: false
          }).start(() => {
            setCurrentCardIndex(currentCardIndex + 1);
            position.setValue({ x: 0, y: 0 });
          });
        } else if (gestureState.dx > SWIPE_THRESHOLD && currentCardIndex > 0) {
          // Swipe Right -> Balik sa Previous Card
          Animated.timing(position, {
            toValue: { x: width + 50, y: 0 },
            duration: 180,
            useNativeDriver: false
          }).start(() => {
            setCurrentCardIndex(currentCardIndex - 1);
            position.setValue({ x: 0, y: 0 });
          });
        } else {
          // Balik sa tunga kung kulang ang swipe distance
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 4,
            useNativeDriver: false
          }).start();
        }
      }
    })
  ).current;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centeredLoading]}>
        <StatusBar style="light" />
        <ActivityIndicator size="small" color="#C5FF42" />
      </SafeAreaView>
    );
  }

  const globalSpentPercentage = summary && summary.totalAllowance > 0
    ? Math.min((summary.totalSpent / summary.totalAllowance) * 100, 100)
    : 0;

  // Deck Interface Render Logic
  const renderCardDeck = () => {
    if (categories.length === 0) {
      return (
        <View style={styles.emptyCardsBox}>
          <Text style={styles.emptyCardsText}>Walay category folders nga nakit-an.</Text>
        </View>
      );
    }

    const currentCat = categories[currentCardIndex];
    const remainingPercentage = currentCat.allocatedAmount > 0 
      ? Math.min((currentCat.remainingAmount / currentCat.allocatedAmount) * 100, 100) 
      : 0;

    return (
      <View style={styles.deckWrapper}>
        {/* BACKGROUND CARD LAYER - preview sa sunod nga card para nindot tan-awon */}
        {currentCardIndex < categories.length - 1 && (
          <View 
            style={[
              styles.creditCardLayout, 
              styles.backgroundCardLayer, 
              { backgroundColor: categories[currentCardIndex + 1].color || '#1E463A' }
            ]} 
          />
        )}

        {/* ACTIVE DRAGGABLE CARD LAYER */}
        <Animated.View 
          {...panResponder.panHandlers}
          style={[styles.creditCardLayout, position.getLayout()]}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={() => openAllocateModal(currentCat)}
            style={{ flex: 1 }}
          >
            {/* Top segment */}
            <View style={[styles.creditCardTopHalf, { backgroundColor: currentCat.color || '#1E463A' }]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardBrandCircles}>
                  <View style={[styles.brandCircle, { backgroundColor: '#FF5F56' }]} />
                  <View style={[styles.brandCircle, { backgroundColor: '#FFA500', marginLeft: -10 }]} />
                </View>
                <View style={styles.categoryIconCapsule}>
                  {/* @ts-ignore */}
                  <Ionicons name={currentCat.icon} size={16} color="#FFFFFF" />
                </View>
              </View>
              
              <Text style={styles.maskedCardNumbers}>••••   ••••   ••••   {currentCat.name.substring(0,4).toUpperCase()}</Text>
            </View>

            {/* Bottom segment */}
            <View style={styles.creditCardBottomHalf}>
              <View style={styles.metaDataColumns}>
                <View>
                  <Text style={styles.metaLabelText}>Card holder</Text>
                  <Text style={styles.metaValueText} numberOfLines={1}>{currentCat.name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.metaLabelText}>Remaining</Text>
                  <Text style={styles.metaValueText}>₱{currentCat.remainingAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
                </View>
              </View>

              <View style={styles.cardProgressSystem}>
                <View style={styles.miniProgressBg}>
                  <View style={[styles.miniProgressFill, { width: `${remainingPercentage}%` }]} />
                </View>
                <View style={styles.miniTextRow}>
                  <Text style={styles.miniProgressLabel}>Budget: ₱{currentCat.allocatedAmount}</Text>
                  <Text style={styles.miniProgressLabel}>Spent: ₱{currentCat.totalSpent}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* DOTS TRACKER INDICATOR */}
        <View style={styles.dotsRowContainer}>
          {categories.map((_, dotIndex) => (
            <View 
              key={dotIndex} 
              style={[styles.indicatorDot, currentCardIndex === dotIndex ? styles.activeDot : styles.inactiveDot]} 
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#C5FF42']} />}
      >
        {/* Emerald Header */}
        <View style={styles.headerBackground}>
          <View style={styles.welcomeRow}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={15} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.welcomeSubtext}>Hello, {spenderName}</Text>
                <Text style={styles.welcomeText}>Welcome Back</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.bellIconBox}>
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              <View style={styles.bellDot} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.mainBalance}>
              ₱{summary ? summary.remaining.toLocaleString('en-US', { minimumFractionDigits: 2 }) : "0.00"}
            </Text>
          </View>

          {summary && (
            <View style={styles.headerMetricsWrapper}>
              <View style={styles.headerProgressBarBg}>
                <View style={[styles.headerProgressBarFill, { width: `${globalSpentPercentage}%` }]} />
              </View>
              <View style={styles.headerMetricsRow}>
                <Text style={styles.headerMetricText}>Total Allowance: ₱{summary.totalAllowance.toLocaleString()}</Text>
                <Text style={styles.headerMetricText}>Total Spent: ₱{summary.totalSpent.toLocaleString()}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Categories Carousel Center Deck */}
        <View style={styles.cardsSectionContainer}>
          {renderCardDeck()}
        </View>

        {/* Recent Transactions List */}
        <View style={styles.contentBody}>
          <View style={styles.recentSectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transaction</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
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
                      <Ionicons name={item.category_icon} size={16} color="#06261D" />
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
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centeredLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#06261D' },
  scrollContent: { paddingBottom: 40 },
  
  headerBackground: { 
    backgroundColor: '#06261D', 
    paddingHorizontal: 24, 
    paddingTop: Platform.OS === 'android' ? (NativeStatusBar.currentHeight ? NativeStatusBar.currentHeight + 14 : 45) : 16, 
    paddingBottom: 64, 
    borderBottomLeftRadius: 32, 
    borderBottomRightRadius: 32 
  },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  welcomeSubtext: { fontSize: 13, color: '#A3B8B0' },
  welcomeText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginTop: 1 },
  bellIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  bellDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C5FF42', position: 'absolute', top: 11, right: 11, borderWidth: 1.5, borderColor: '#06261D' },
  balanceContainer: { alignItems: 'center', marginTop: 8 },
  balanceLabel: { fontSize: 13, color: '#A3B8B0', fontWeight: '500', marginBottom: 6 },
  mainBalance: { fontSize: 36, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },
  
  headerMetricsWrapper: { marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  headerProgressBarBg: { height: 5, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  headerProgressBarFill: { height: '100%', backgroundColor: '#C5FF42', borderRadius: 10 },
  headerMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerMetricText: { color: '#A3B8B0', fontSize: 11, fontWeight: '500' },

  // Center Deck Carousel Configuration
  cardsSectionContainer: { marginTop: -45, marginBottom: 15, alignItems: 'center', justifyContent: 'center', width: '100%' },
  deckWrapper: { width: '100%', alignItems: 'center', position: 'relative', height: 225 },
  backgroundCardLayer: { position: 'absolute', transform: [{ scale: 0.92 }], top: 10, opacity: 0.45, zIndex: -1 },
  
  creditCardLayout: {
    width: CARD_WIDTH,
    height: 190,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden'
  },
  creditCardTopHalf: {
    flex: 1.1,
    padding: 18,
    justifyContent: 'space-between'
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBrandCircles: { flexDirection: 'row', alignItems: 'center' },
  brandCircle: { width: 22, height: 22, borderRadius: 11, opacity: 0.85 },
  categoryIconCapsule: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  maskedCardNumbers: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', letterSpacing: 2, opacity: 0.9 },
  
  creditCardBottomHalf: {
    flex: 1,
    backgroundColor: '#C5FF42',
    paddingHorizontal: 18,
    paddingVertical: 12,
    justifyContent: 'space-between'
  },
  metaDataColumns: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLabelText: { fontSize: 10, color: '#5C7A11', textTransform: 'uppercase', fontWeight: '600' },
  metaValueText: { fontSize: 14, fontWeight: '700', color: '#06261D', marginTop: 2, maxWidth: width * 0.4 },
  
  cardProgressSystem: { borderTopWidth: 1, borderTopColor: 'rgba(92,122,17,0.12)', paddingTop: 8 },
  miniProgressBg: { height: 4, backgroundColor: 'rgba(6,38,29,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  miniProgressFill: { height: '100%', backgroundColor: '#06261D', borderRadius: 2 },
  miniTextRow: { flexDirection: 'row', justifyContent: 'space-between' },
  miniProgressLabel: { fontSize: 9, color: '#5C7A11', fontWeight: '500' },

  dotsRowContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 14, gap: 6 },
  indicatorDot: { height: 6, borderRadius: 3 },
  activeDot: { width: 14, backgroundColor: '#06261D' },
  inactiveDot: { width: 6, backgroundColor: '#CBD5E1' },

  emptyCardsBox: { width: CARD_WIDTH, height: 190, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  emptyCardsText: { color: '#718096', fontSize: 13 },

  contentBody: { paddingHorizontal: 24, marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#06261D', letterSpacing: -0.2 },
  recentSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  seeAllText: { fontSize: 13, color: '#718096', fontWeight: '600' },
  
  recentListContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  recentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F7F9FA' },
  recentLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 0.75 },
  iconBox: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F0F4F2', justifyContent: 'center', alignItems: 'center' },
  recentName: { fontSize: 14, fontWeight: '600', color: '#06261D' },
  recentCategory: { fontSize: 11, color: '#718096', marginTop: 1 },
  recentAmount: { fontSize: 14, fontWeight: '700', color: '#06261D' },
  noRecentBox: { padding: 32, backgroundColor: '#FFFFFF', borderRadius: 20, alignItems: 'center' },
  noRecentText: { fontSize: 13, color: '#718096' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(6, 38, 29, 0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#FFFFFF', width: '88%', padding: 24, borderRadius: 24, shadowColor: '#06261D', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#06261D' },
  modalSubText: { fontSize: 13, color: '#718096', marginTop: 4, marginBottom: 18, lineHeight: 18 },
  modalInput: { borderWidth: 1, borderColor: '#E2E8F0', padding: 14, borderRadius: 14, marginBottom: 20, fontSize: 18, fontWeight: '600', color: '#06261D', backgroundColor: '#F8F9FA' },
  modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalButton: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F1F5F9' },
  cancelBtnText: { color: '#475569', fontWeight: '600', fontSize: 14 },
  confirmBtn: { backgroundColor: '#06261D', minWidth: 110 },
  confirmBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 }
});