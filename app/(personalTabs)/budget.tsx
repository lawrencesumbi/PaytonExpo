import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase';

interface BudgetOption {
  id: string;
  allocated_amount: number;
  remaining_amount: number;
  categories: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

export default function PersonalExpensesScreen() {
  const router = useRouter();
  const { scannedName, scannedAmount } = useLocalSearchParams<{ scannedName?: string; scannedAmount?: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [budgets, setBudgets] = useState<BudgetOption[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<BudgetOption | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-fill trigger kon gikan sa scanner modules
  useEffect(() => {
    if (scannedAmount) setAmount(scannedAmount);
    if (scannedName) setDescription(`Scanned: ${scannedName}`);
    if (scannedAmount || scannedName) setIsModalOpen(true);
  }, [scannedAmount, scannedName]);

  const fetchActiveBudgets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('budgets')
        .select(`
          id,
          allocated_amount,
          remaining_amount,
          categories (
            id,
            name,
            icon,
            color
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      const validBudgets = (data || []).filter((b: any) => b.categories) as unknown as BudgetOption[];
      setBudgets(validBudgets);
      
      // Auto-select initial item kon gikan sa scan sequence
      if (validBudgets.length > 0 && (scannedAmount || scannedName) && !selectedBudget) {
        setSelectedBudget(validBudgets[0]);
      }
    } catch (error: any) {
      console.error("Fetch Personal Budgets Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogExpense = async () => {
    if (!selectedBudget) {
      Alert.alert("Missing Sector", "Please select an active budget target category folder.");
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      Alert.alert("Invalid Input", "Please input a positive dynamic spending currency metric.");
      return;
    }

    if (expenseAmount > selectedBudget.remaining_amount) {
      Alert.alert(
        "Insufficient Budget ❌", 
        `You cannot spend ₱${expenseAmount.toFixed(2)} because you only have ₱${selectedBudget.remaining_amount.toFixed(2)} remaining inside this structural folder.`
      );
      return;
    }

    try {
      setSubmitting(true);
      
      // 1. Insert and Record inside Expenses Database Ledger
      const { error: insertError } = await supabase
        .from('expenses')
        .insert({
          budget_id: selectedBudget.id,
          amount: expenseAmount,
          description: description.trim() || 'General Ledger Expense',
          spent_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // 2. Perform Calculations to update structural balance variables
      const newRemaining = selectedBudget.remaining_amount - expenseAmount;
      const { error: updateError } = await supabase
        .from('budgets')
        .update({ remaining_amount: newRemaining })
        .eq('id', selectedBudget.id);

      if (updateError) throw updateError;

      Alert.alert("Success 🎉", `Your transaction of ₱${expenseAmount.toFixed(2)} was securely captured.`);
      
      setAmount('');
      setDescription('');
      setIsModalOpen(false);
      setSelectedBudget(null);
      
      setLoading(true);
      await fetchActiveBudgets();
    } catch (error: any) {
      Alert.alert("Transaction Aborted", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchActiveBudgets();
  }, []);

  const handleCardPress = (item: BudgetOption) => {
    setSelectedBudget(item);
    setIsModalOpen(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActiveBudgets();
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.centeredContent]}>
        <ActivityIndicator size="small" color="#0D9488" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="dark" />
      
      <View style={styles.cardSelectionHeader}>
        <Text style={styles.cardSelectionTitle}>Select Folder</Text>
        <Text style={styles.cardSelectionSubtitle}>{budgets.length} active allocation sectors</Text>
      </View>

      {budgets.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="folder-open-outline" size={32} color="#94A3B8" />
          </View>
          <Text style={styles.emptyText}>No Active Sectors Found</Text>
          <Text style={styles.emptySub}>
            To populate tracking assets, log an active income flow and configure folder structural limits inside your Home panel first.
          </Text>
        </View>
      ) : (
        <FlatList
          data={budgets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.verticalCardList}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => handleCardPress(item)}
              style={[
                styles.modernFintechCard,
                { backgroundColor: item.categories.color || '#0F766E' }
              ]}
            >
              <View style={styles.modernCardHeaderRow}>
                <View style={styles.modernCardBadgeIconWrapper}>
                  {/* @ts-ignore */}
                  <Ionicons name={item.categories.icon || 'wallet'} size={18} color={item.categories.color || '#0F766E'} />
                </View>
                <Text style={styles.modernCardCategoryText}>{item.categories.name}</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" style={{ marginLeft: 'auto' }} />
              </View>
              
              <View style={styles.modernCardBalanceContainer}>
                <Text style={styles.modernCardBalanceLabel}>REMAINING BALANCE</Text>
                <Text style={styles.modernCardBalanceAmount}>
                  ₱{item.remaining_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* MODAL SYSTEM: POP OVERLAY TRANSACTION ENTRY LOGGING FORM */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        statusBarTranslucent
        onRequestClose={() => {
          setIsModalOpen(false);
          setSelectedBudget(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject} 
            activeOpacity={1} 
            onPress={() => {
              if (!submitting) {
                setIsModalOpen(false);
                setSelectedBudget(null);
              }
            }} 
          />

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.modalContent}
          >
            <View style={styles.modalDragHandle} />

            <View style={styles.header}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headerTitle}>Deduct Expense</Text>
                  {selectedBudget && (
                    <View style={[styles.modernCategoryBadge, { backgroundColor: `${selectedBudget.categories.color}15` }]}>
                      {/* @ts-ignore */}
                      <Ionicons name={selectedBudget.categories.icon || 'folder'} size={13} color={selectedBudget.categories.color} />
                      <Text style={[styles.modernCategoryBadgeText, { color: selectedBudget.categories.color }]}>
                        {selectedBudget.categories.name}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.closeModalHeaderIcon} 
                  activeOpacity={0.7}
                  onPress={() => {
                    setIsModalOpen(false);
                    setSelectedBudget(null);
                  }}
                  disabled={submitting}
                >
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.modernAmountContainer}>
                <Text style={styles.modernAmountLabel}>AMOUNT OUTFLOW</Text>
                <View style={styles.amountInputRow}>
                  <Text style={styles.currencySymbol}>₱</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor="#CBD5E1"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    editable={!submitting}
                    autoFocus={!scannedAmount}
                  />
                </View>
                {selectedBudget && (
                  <View style={styles.remainingBalanceRow}>
                    <Ionicons name="wallet-outline" size={13} color="#64748B" />
                    <Text style={styles.remainingBalanceText}>
                      Maximum Safe Draft: ₱{selectedBudget.remaining_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description / Reference Remarks</Text>
                <View style={styles.textInputWrapper}>
                  <Ionicons name="document-text-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., Grocery Shopping, Lunch"
                    placeholderTextColor="#94A3B8"
                    value={description}
                    onChangeText={setDescription}
                    editable={!submitting}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.disabledButton]}
                onPress={handleLogExpense}
                disabled={submitting}
                activeOpacity={0.82}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Commit Reduction</Text>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centeredContent: { justifyContent: 'center', alignItems: 'center' },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)', 
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '65%', 
    paddingTop: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 24,
      }
    })
  },
  modalDragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 6,
  },
  closeModalHeaderIcon: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 50,
  },
  modernCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    gap: 5,
  },
  modernCategoryBadgeText: { fontSize: 12, fontWeight: '700' },
  header: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', letterSpacing: -0.5 },
  formContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 4 },
  
  modernAmountContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modernAmountLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 6 },
  currencySymbol: { fontSize: 32, fontWeight: '700', color: '#0F172A', marginRight: 4 },
  amountInput: { flex: 1, fontSize: 36, fontWeight: '700', color: '#0F172A', letterSpacing: -1 },
  remainingBalanceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  remainingBalanceText: { fontSize: 12, color: '#64748B', fontWeight: '500' },

  inputGroup: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 8 },
  textInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, height: 52 },
  textInput: { flex: 1, fontSize: 14, color: '#0F172A', fontWeight: '500' },
  
  submitButton: { 
    backgroundColor: '#0F766E', 
    height: 54,
    borderRadius: 16, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 6, 
    marginTop: 'auto', 
    marginBottom: Platform.OS === 'ios' ? 24 : 32,
  },
  disabledButton: { opacity: 0.6 },
  submitButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  
  cardSelectionHeader: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 16
  },
  cardSelectionTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  cardSelectionSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '500' },
  verticalCardList: { paddingHorizontal: 24, gap: 14, paddingBottom: 32 },
  
  modernFintechCard: {
    borderRadius: 22,
    padding: 20,
    height: 140,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      }
    })
  },
  modernCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modernCardBadgeIconWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernCardCategoryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  modernCardBalanceContainer: {
    marginTop: 'auto',
  },
  modernCardBalanceLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modernCardBalanceAmount: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.5,
  },

  emptyState: { flex: 0.7, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 36, gap: 14 },
  emptyIconContainer: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#1E293B', letterSpacing: -0.4 },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, fontWeight: '400' }
});