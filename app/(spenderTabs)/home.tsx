import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Siguradoon nato nga na-import ni og tarong
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    ImageBackground,
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
    View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.84;
const CARD_MARGIN = 10;
const SNAP_INTERVAL = CARD_WIDTH + (CARD_MARGIN * 2);

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
  const router = useRouter(); // Initialize ang router engine
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [spenderName, setSpenderName] = useState('Spender');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); 
  
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<DynamicCategory[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<RecentExpense[]>([]);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DynamicCategory | null>(null);
  const [allocateAmount, setAllocateAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const autoScrollTimer = useRef<any>(null);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (profileData?.full_name) setSpenderName(profileData.full_name);
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

  const startAutoScrollEngine = () => {
    stopAutoScrollEngine(); 
    if (categories.length <= 1) return;

    autoScrollTimer.current = setInterval(() => {
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
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  };

  useEffect(() => {
    fetchDashboardData();
    return () => stopAutoScrollEngine(); 
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      startAutoScrollEngine();
    }
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
        <StatusBar style="light" />
        <ActivityIndicator size="small" color="#C5FF42" />
      </SafeAreaView>
    );
  }

  const globalSpentPercentage = summary && summary.totalAllowance > 0
    ? Math.min((summary.totalSpent / summary.totalAllowance) * 100, 100)
    : 0;

return (
  <ImageBackground
  source={require("../../assets/images/cover-bg.png")}
  resizeMode="cover"
  style={styles.backgroundImage}
  > 
  <SafeAreaView style={styles.container}>
    <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />
        }
      >
        {/* Profile & Balance Top Header Section */}
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
                <Text style={styles.welcomeText}>{spenderName}</Text>
              </View>
            </View>

            <View style={styles.iconGroupRow}>
              <TouchableOpacity 
                style={styles.iconBoxTop} 
                onPress={() => router.push('/invitations')}
              >
                <Ionicons name="mail-outline" size={20} color="#042F2E" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.iconBoxTop} 
                onPress={() => router.push('/reminders')} 
              >
                <Ionicons name="calendar-outline" size={20} color="#042F2E" />
                <View style={styles.calendarDot} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Total Remaining Balance</Text>
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
                <Text style={styles.headerMetricText}>Allowance: ₱{summary.totalAllowance.toLocaleString()}</Text>
                <Text style={styles.headerMetricText}>Spent: ₱{summary.totalSpent.toLocaleString()}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Carousel Section - Gi-maintain ang tibuok snapping engine props */}
        <View style={styles.cardsSectionContainer}>
          <FlatList
            ref={flatListRef}
            data={categories}
            horizontal
            decelerationRate="fast"
            snapToInterval={SNAP_INTERVAL} // Nag-maintain sa snap sliding
            snapToAlignment="center"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollMomentumEnd} // Para sa active dot indicator logic
            onScrollBeginDrag={stopAutoScrollEngine}   // Para mapunong ang auto scroll animation kung gina-drag
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
                  activeOpacity={0.95}
                  onPress={() => openAllocateModal(cat)}
                  style={[styles.originalCategoryCard, { backgroundColor: cat.color || '#0F766E' }]}
                >
                  <View style={styles.cardMainHeader}>
                    <View style={styles.cardTitleCluster}>
                      <View style={styles.originalIconCircle}>
                        <Ionicons name={cat.icon || 'folder'} size={16} color={cat.color || '#0F766E'} />
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

        {/* Recent Transactions List Component */}
        <View style={styles.contentBody}>
          <View style={styles.recentSectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/transaction')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
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
                      <Ionicons name={item.category_icon || 'cash-outline'} size={18} color="#0D9488" />
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

      {/* Allocation Budget Flow Modal */}
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
 </ImageBackground>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { paddingBottom: 40 },
  backgroundImage:{flex:1 },
  
  headerBackground: { 
    paddingHorizontal: 24, 
    paddingTop: Platform.OS === 'android' ? (NativeStatusBar.currentHeight ? NativeStatusBar.currentHeight + 16 : 50) : 20, 
    paddingBottom: 68, 
    borderBottomLeftRadius: 36, 
    borderBottomRightRadius: 36,
  },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(13, 148, 136, 0.15)', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 44, height: 44, borderRadius: 22, resizeMode: 'cover' }, 
  welcomeSubtext: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  welcomeText: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  
  iconGroupRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBoxTop: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, position: 'relative' },
  calendarDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#0D9488', position: 'absolute', top: 12, right: 12, borderWidth: 1, borderColor: '#FFFFFF' },
  
  balanceContainer: { alignItems: 'center', marginTop: 12 },
  balanceLabel: { fontSize: 13, color: '#475569', fontWeight: '600', letterSpacing: 0.3, marginBottom: 4 },
  mainBalance: { fontSize: 38, fontWeight: '800', color: '#0F172A', letterSpacing: -1 },
  
  headerMetricsWrapper: { marginTop: 24, paddingHorizontal: 4 },
  headerProgressBarBg: { height: 6, backgroundColor: 'rgba(15, 23, 42, 0.08)', borderRadius: 10, overflow: 'hidden', marginBottom: 10 },
  headerProgressBarFill: { height: '100%', backgroundColor: '#0D9488', borderRadius: 10 },
  headerMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerMetricText: { color: '#64748B', fontSize: 12, fontWeight: '600' },

  cardsSectionContainer: { marginTop: -40, marginBottom: 20, width: '100%' },
  originalCategoryCard: {
    width: CARD_WIDTH,
    height: 180,
    marginHorizontal: CARD_MARGIN,
    borderRadius: 24,
    padding: 22,
    justifyContent: 'space-between',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8
  },
  cardMainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitleCluster: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 0.75 },
  originalIconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  originalCardName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  remainingBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.18)' },
  remainingBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  
  originalCardMiddleBody: { marginVertical: 6 },
  originalRemainingAmount: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  
  originalCardBottomFooter: { gap: 10 },
  originalProgressBackground: { height: 5, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden' },
  originalProgressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 3 },
  originalCardMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  originalFooterMetaText: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, fontWeight: '500' },

  dotsRowContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 6 },
  indicatorDot: { height: 6, borderRadius: 3 },
  activeDot: { width: 16, backgroundColor: '#0D9488' },
  inactiveDot: { width: 6, backgroundColor: '#CBD5E1' },

  contentBody: { paddingHorizontal: 24, marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  recentSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seeAllText: { fontSize: 14, color: '#0D9488', fontWeight: '700' },
  
  recentListContainer: { backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden', padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  recentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  recentLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 0.75 },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center' },
  recentName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  recentCategory: { fontSize: 12, color: '#64748B', marginTop: 2 },
  recentAmount: { fontSize: 14, fontWeight: '700', color: '#0D9488' },
  noRecentBox: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', justifyContent: 'center' },
  noRecentText: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 28, width: '85%', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  modalSubText: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 20 },
  modalInput: { width: '100%', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 20, color: '#0F172A' },
  modalButtonsRow: { flexDirection: 'row', gap: 12, width: '100%' },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F1F5F9' },
  cancelBtnText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  confirmBtn: { backgroundColor: '#0D9488' },
  confirmBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  
  centeredLoading: { justifyContent: 'center', alignItems: 'center' },
  });