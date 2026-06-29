import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
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
const CARD_WIDTH = width * 0.84;
const CARD_MARGIN = 10;
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
  const router = useRouter(); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('User');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // State para sa hulagway ni user

  const [income, setIncome] = useState<IncomeSummary | null>(null);
  const [categories, setCategories] = useState<DynamicCategory[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const autoScrollTimer = useRef<any>(null);

  const [allocateModalVisible, setAllocateModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DynamicCategory | null>(null);
  const [allocateAmount, setAllocateAmount] = useState('');

  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [incomeName, setIncomeName] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDesc, setIncomeDesc] = useState('');
  const [incomeStart, setIncomeStart] = useState(new Date().toISOString().split('T')[0]);
  const [incomeEnd, setIncomeEnd] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  const [submitting, setSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Giapil na pag-fetch ang avatar_url gikan sa profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();
        
      if (profileData?.full_name) setUserName(profileData.full_name);
      if (profileData?.avatar_url) setAvatarUrl(profileData.avatar_url);

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
                dateString: dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
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

  const handleAllocateBudget = async () => {
    if (!selectedCategory || !income) return;
    const amountToAllocate = parseFloat(allocateAmount);

    if (isNaN(amountToAllocate) || amountToAllocate <= 0) {
      Alert.alert("Invalid Input", "Please enter a positive numeric value to allocate capital.");
      return;
    }

    const totalCurrentAllocated = categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
    const unallocatedPool = income.amount - totalCurrentAllocated;

    if (amountToAllocate > unallocatedPool) {
      Alert.alert("Allocation Denied", `Insufficient unallocated resources. Available: ₱${unallocatedPool.toFixed(2)}`);
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

      Alert.alert("Allocation Success 🎉", `Successfully injected ₱${amountToAllocate.toFixed(2)} into ${selectedCategory.name}.`);
      setAllocateModalVisible(false);
      setAllocateAmount('');
      fetchDashboardData();
    } catch (error: any) {
      Alert.alert("Process Aborted", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddIncome = async () => {
    const parsedAmount = parseFloat(incomeAmount);
    if (!incomeName || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Error", "Please input a valid source title and amount.");
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

      Alert.alert("Success 🎉", "Income statement completely logged.");
      setIncomeModalVisible(false);
      setIncomeName('');
      setIncomeAmount('');
      setIncomeDesc('');
      fetchDashboardData();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startAutoScrollEngine = () => {
    stopAutoScrollEngine();
    if (categories.length <= 1) return;
    autoScrollTimer.current = window.setInterval(() => {
      setCurrentCardIndex((prevIndex) => {
        const nextIndex = prevIndex >= categories.length - 1 ? 0 : prevIndex + 1;
        flatListRef.current?.scrollToOffset({
          offset: nextIndex * SNAP_INTERVAL,
          animated: true
        });
        return nextIndex;
      });
    }, 3500);
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

  const onScrollMomentumEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP_INTERVAL);
    if (index >= 0 && index < categories.length) {
      setCurrentCardIndex(index);
    }
    startAutoScrollEngine();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centeredLoading]}>
        <ExpoStatusBar style="light" />
        <ActivityIndicator size="small" color="#C5FF42" />
      </SafeAreaView>
    );
  }

  const totalAllocatedBudgetPool = categories.reduce((sum, c) => sum + c.allocatedAmount, 0);
  const totalSpentAcrossSystem = categories.reduce((sum, c) => sum + c.totalSpent, 0);
  const unallocatedBalance = income ? income.amount - totalAllocatedBudgetPool : 0;
  
  const globalSpentPercentage = income && income.amount > 0
    ? Math.min((totalSpentAcrossSystem / income.amount) * 100, 100)
    : 0;

  return (
    <ImageBackground
      source={require('../../assets/images/cover-bg.png')}
      resizeMode="cover"
      style={styles.backgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <ExpoStatusBar style="dark" />
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />}
        >
          <View style={styles.headerBackground}>
            <View style={styles.welcomeRow}>
              <View style={styles.avatarRow}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={16} color="#042F2E" />
                  </View>
                )}
                <View>
                  <Text style={styles.welcomeSubtext}>Hello, Welcome Back</Text>
                  <Text style={styles.welcomeText}>{userName}</Text>
                </View>
              </View>

              <View style={styles.iconGroupRow}>
                <TouchableOpacity style={styles.iconBoxTop} onPress={() => router.push('/reminders')}>
                  <Ionicons name="calendar-outline" size={20} color="#042F2E" />
                  <View style={styles.calendarDot} />
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity activeOpacity={0.9} onPress={() => setIncomeModalVisible(true)} style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Remaining Balance (Unallocated)</Text>
              <Text style={styles.mainBalance}>
                ₱{unallocatedBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </TouchableOpacity>

            <View style={styles.headerMetricsWrapper}>
              <View style={styles.headerProgressBarBg}>
                <View style={[styles.headerProgressBarFill, { width: `${globalSpentPercentage}%` }]} />
              </View>
              <View style={styles.headerMetricsRow}>
                <Text style={styles.headerMetricText}>Overall Income: ₱{income ? income.amount.toLocaleString() : '0'}</Text>
                <Text style={styles.headerMetricText}>Total Spent: ₱{totalSpentAcrossSystem.toLocaleString()}</Text>
              </View>
            </View>
          </View>

        {/* Carousel Section */}
        <View style={styles.cardsSectionContainer}>
          <FlatList
            ref={flatListRef}
            data={categories}
            horizontal
            decelerationRate="fast"
            snapToInterval={SNAP_INTERVAL}
            snapToAlignment="center"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollMomentumEnd}
            onScrollBeginDrag={stopAutoScrollEngine} 
            contentContainerStyle={{
              paddingHorizontal: (width - CARD_WIDTH) / 2 - CARD_MARGIN
            }}
            keyExtractor={(item) => item.id}
            renderItem={({ item: cat }) => {
              const remainingPercentage = cat.allocatedAmount > 0 
                ? Math.min((cat.remainingAmount / cat.allocatedAmount) * 100, 100) 
                : 0;

              return (
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setAllocateModalVisible(true);
                  }}
                  style={[styles.originalCategoryCard, { backgroundColor: cat.color || '#1E463A' }]}
                >
                  <View style={styles.cardMainHeader}>
                    <View style={styles.cardTitleCluster}>
                      <View style={styles.originalIconCircle}>
                        <Ionicons name={cat.icon as any} size={18} color={cat.color || '#1E463A'} />
                      </View>
                      <Text style={styles.originalCardName} numberOfLines={1}>{cat.name}</Text>
                    </View>
                    <View style={styles.remainingBadge}>
                      <Text style={styles.remainingBadgeText}>Remaining</Text>
                    </View>
                  </View>

                  <View style={styles.originalCardMiddleBody}>
                    <Text style={styles.originalRemainingAmount}>
                      ₱{cat.remainingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>

                  <View style={styles.originalCardBottomFooter}>
                    <View style={styles.originalProgressBackground}>
                      <View style={[styles.originalProgressFill, { width: `${remainingPercentage}%` }]} />
                    </View>
                    <View style={styles.originalCardMetricsRow}>
                      <Text style={styles.originalFooterMetaText}>Budget: ₱{cat.allocatedAmount.toLocaleString()}</Text>
                      <Text style={styles.originalFooterMetaText}>Spent: ₱{cat.totalSpent.toLocaleString()}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {categories.length > 0 && (
            <View style={styles.dotsRowContainer}>
              {categories.map((_, dotIndex) => (
                <View 
                  key={dotIndex} 
                  style={[styles.indicatorDot, currentCardIndex === dotIndex ? styles.activeDot : styles.inactiveDot]} 
                />
              ))}
            </View>
          )}
        </View>

        {/* Recent Transactions List */}
        <View style={styles.contentBody}>
          <View style={styles.recentSectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transaction</Text>
            <TouchableOpacity onPress={() => router.push('/transaction')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {recentActivities.length === 0 ? (
            <View style={styles.noRecentBox}>
              <Text style={styles.noRecentText}>No captured transaction entries found.</Text>
            </View>
          ) : (
            <View style={styles.recentListContainer}>
              {recentActivities.map((activity) => (
                <View key={activity.id} style={styles.recentItem}>
                  <View style={styles.recentLeft}>
                    <View style={styles.iconBox}>
                      <Ionicons name="fast-food-outline" size={16} color="#06261D" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recentName} numberOfLines={1}>{activity.name}</Text>
                      <Text style={styles.recentCategory}>{activity.category}</Text>
                    </View>
                  </View>
                  <Text style={styles.recentAmount}>-₱{activity.amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        </ScrollView>

        {/* MODAL 1: FUND ALLOCATION */}
        <Modal animationType="fade" transparent={true} visible={allocateModalVisible} onRequestClose={() => setAllocateModalVisible(false)}>
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
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setAllocateModalVisible(false)} disabled={submitting}>
                <Text style={styles.cancelBtnText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmBtn]} onPress={handleAllocateBudget} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.confirmBtnText}>Confirm Fund</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: UPDATE INCOME */}
      <Modal animationType="slide" transparent={true} visible={incomeModalVisible} onRequestClose={() => setIncomeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Update Income Statement</Text>
            <Text style={styles.modalSubText}>Set up your newest income deployment baseline pool below.</Text>
            <TextInput style={styles.modalInput} placeholder="Allowance Name (e.g., Monthly)" value={incomeName} onChangeText={setIncomeName} placeholderTextColor="#94A3B8" />
            <TextInput style={styles.modalInput} placeholder="Total Amount (₱)" keyboardType="numeric" value={incomeAmount} onChangeText={setIncomeAmount} placeholderTextColor="#94A3B8" />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setIncomeModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmBtn]} onPress={handleAddIncome} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.confirmBtnText}>Save Pool</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1, backgroundColor: 'transparent' },
  centeredLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#06261D' },
  scrollContent: { paddingBottom: 40 },
  
  headerBackground: { 
    backgroundColor: 'transparent',
    paddingHorizontal: 24, 
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 14 : 45) : 16, 
    paddingBottom: 64, 
    borderBottomLeftRadius: 32, 
    borderBottomRightRadius: 32 
  },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarImage: { width: 40, height: 40, borderRadius: 20, resizeMode: 'cover' }, 
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  welcomeSubtext: { fontSize: 13, color: '#64748B' },
  welcomeText: { fontSize: 16, fontWeight: '700', color: '#042F2E', marginTop: 1 },
  
  iconGroupRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBoxTop: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  calendarDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0D9488', position: 'absolute', top: 11, right: 11, borderWidth: 1.5, borderColor: '#FFFFFF' },
  
  balanceContainer: { alignItems: 'center', marginTop: 8,borderRadius: 20, paddingVertical: 16, paddingHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  balanceLabel: { fontSize: 13, color: '#64748B', fontWeight: '500', marginBottom: 6 },
  mainBalance: { fontSize: 36, fontWeight: '700', color: '#042F2E', letterSpacing: -0.5 },
  
  headerMetricsWrapper: { marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(4,47,46,0.12)' },
  headerProgressBarBg: { height: 5, backgroundColor: 'rgba(4,47,46,0.12)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  headerProgressBarFill: { height: '100%', backgroundColor: '#0D9488', borderRadius: 10 },
  headerMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerMetricText: { color: '#64748B', fontSize: 11, fontWeight: '500' },

  cardsSectionContainer: { marginTop: -45, marginBottom: 15, width: '100%' },
  
  originalCategoryCard: {
    width: CARD_WIDTH,
    height: 175,
    marginHorizontal: CARD_MARGIN,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6
  },
  cardMainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitleCluster: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 0.75 },
  originalIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  originalCardName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  remainingBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)' },
  remainingBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  
  originalCardMiddleBody: { marginVertical: 4 },
  originalRemainingAmount: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  
  originalCardBottomFooter: { gap: 8 },
  originalProgressBackground: { height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  originalProgressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 3 },
  originalCardMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  originalFooterMetaText: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '500' },

  dotsRowContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 14, gap: 6 },
  indicatorDot: { height: 6, borderRadius: 3 },
  activeDot: { width: 14, backgroundColor: '#06261D' },
  inactiveDot: { width: 6, backgroundColor: '#CBD5E1' },

  contentBody: { paddingHorizontal: 24, marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#06261D', letterSpacing: -0.2 },
  recentSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  seeAllText: { fontSize: 13, color: '#718096', fontWeight: '600' },
  
  recentListContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6 },
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