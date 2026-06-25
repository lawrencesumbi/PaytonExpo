// app/(spenderTabs)/expenses.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal // Gi-add para sa Log Expense popup form
    ,
    StatusBar as NativeStatusBar,
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

export default function SpenderExpensesScreen() {
  const router = useRouter();
  
  // DYNAMIC ROUTE PARAMETERS (INTACT)
  const { scannedName, scannedAmount } = useLocalSearchParams<{ scannedName?: string; scannedAmount?: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // STRUCTURED STATE COLLECTIONS (INTACT)
  const [budgets, setBudgets] = useState<BudgetOption[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<BudgetOption | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  // MODAL VISIBILITY STATE
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. EVALUATE SCAN PARAMETERS
  useEffect(() => {
    if (scannedAmount) {
      setAmount(scannedAmount);
    }
    if (scannedName) {
      setDescription(`Scanned: ${scannedName}`);
    }
    // Kung naay scanned properties, i-open diretso ang modal placeholder logic loop
    if (scannedAmount || scannedName) {
      setIsModalOpen(true);
    }
  }, [scannedAmount, scannedName]);

  // 2. FETCH ACTIVE BUDGET RECORDS (INTACT BACKEND DATA LOOKUP)
  const fetchActiveBudgets = async () => {
    try {
      setLoading(true);
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
      
      // Kung naay scanned content, e-assign ang pre-selected base choice matching fold
      if (validBudgets.length > 0 && (scannedAmount || scannedName) && !selectedBudget) {
        setSelectedBudget(validBudgets[0]);
      }
    } catch (error: any) {
      console.error("Fetch Budgets Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. PERSIST TRANSACTION AND UPDATE REMAINING BUDGET BALANCES (INTACT DB WRITES)
  const handleLogExpense = async () => {
    if (!selectedBudget) {
      Alert.alert("Missing Category", "Please select an active budget category target.");
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      Alert.alert("Invalid Amount", "Please input a positive numeric transaction value.");
      return;
    }

    if (expenseAmount > selectedBudget.remaining_amount) {
      Alert.alert(
        "Insufficient Budget ❌", 
        `You cannot spend ₱${expenseAmount.toFixed(2)} because you only have ₱${selectedBudget.remaining_amount.toFixed(2)} remaining inside this specific folder.`
      );
      return;
    }

    try {
      setSubmitting(true);
      
      // DB Action 1: Expenses Insert
      const { error: insertError } = await supabase
        .from('expenses')
        .insert({
          budget_id: selectedBudget.id,
          amount: expenseAmount,
          description: description.trim() || 'Uncategorized Expense',
          spent_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // DB Action 2: Budgets Remaining Balance Update
      const newRemaining = selectedBudget.remaining_amount - expenseAmount;
      const { error: updateError } = await supabase
        .from('budgets')
        .update({ remaining_amount: newRemaining })
        .eq('id', selectedBudget.id);

      if (updateError) throw updateError;

      Alert.alert("Success 🎉", `Your transaction of ₱${expenseAmount.toFixed(2)} was securely captured.`);
      
      setAmount('');
      setDescription('');
      setIsModalOpen(false); // Iclose ang Modal inig human og log expense
      setSelectedBudget(null);
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
    setIsModalOpen(true); // Buksan ang Modal inig pislit sa card
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centeredContent]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="small" color="#10B981" />
      </SafeAreaView>
    );
  }

  // MAIN SCREEN VIEW: MAG DISPLAY RA GYUD ANG MGA CARDS (ORIGINAL LAYOUT & COLORS UNTOUCHED)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Top Header Row pareha sa image */}
      <View style={styles.cardSelectionHeader}>
        <Text style={styles.cardSelectionTitle}>Select Card</Text>
        <TouchableOpacity 
          style={styles.newCardButton} 
          onPress={() => Alert.alert("Feature Trigger", "Redirect user to setup dynamic budget slots.")}
        >
          <Ionicons name="add" size={16} color="#1E293B" />
          <Text style={styles.newCardButtonText}>New card</Text>
        </TouchableOpacity>
      </View>

      {budgets.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="wallet-outline" size={32} color="#64748B" />
          </View>
          <Text style={styles.emptyText}>No Active Budgets Allocated</Text>
          <Text style={styles.emptySub}>To populate transactional items, configure and allocate capital tokens via your Home layout first.</Text>
        </View>
      ) : (
        /* Vertical Credit Card List View Stack (ORIGINAL DESIGN) */
        <FlatList
          data={budgets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.verticalCardList}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleCardPress(item)}
              style={[
                styles.largeCreditCard,
                { backgroundColor: item.categories.color || '#1E293B' }
              ]}
            >
              <View style={styles.creditCardTop}>
                <View style={styles.creditCardUserContainer}>
                  <Text style={styles.creditCardCategoryName}>{item.categories.name}</Text>
                  <Text style={styles.creditCardAmount}>₱{item.remaining_amount.toLocaleString()}</Text>
                </View>
                {/* @ts-ignore -- Gi-ignore ang string typing para sa icon name aron dili mag-puwa */}
                <Ionicons name={item.categories.icon || 'card-outline'} size={24} color="#FFFFFF" style={styles.creditCardLogo} />
              </View>
              
              <View style={styles.creditCardBottom}>
                <Text style={styles.creditCardNumber}>•••• {item.id.substring(0, 4).toUpperCase()}</Text>
                <View style={styles.mainCardBadge}>
                  <Text style={styles.mainCardBadgeText}>Active Budget</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Floating Close Control Anchor sa ubos base sa image layout */}
      <View style={styles.closeButtonContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={16} color="#FFFFFF" />
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================= */}
      {/* LOG NEW EXPENSE MODAL MODIFIER               */}
      {/* ========================================================= */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsModalOpen(false);
          setSelectedBudget(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.modalContent}
          >
            {/* Modal Drag Handle Decorator */}
            <View style={styles.modalDragHandle} />

            {/* Modern Clean Header Stack inside Modal */}
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>Log New Expense</Text>
                <TouchableOpacity 
                  style={styles.closeModalHeaderIcon} 
                  onPress={() => {
                    setIsModalOpen(false);
                    setSelectedBudget(null);
                  }}
                >
                  <Ionicons name="close-circle" size={28} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              {selectedBudget && (
                <Text style={styles.headerSubtitle}>
                  Selected Folder: <Text style={{fontWeight: '700', color: selectedBudget.categories.color}}>{selectedBudget.categories.name}</Text> (Remaining: ₱{selectedBudget.remaining_amount.toFixed(2)})
                </Text>
              )}
            </View>

            <View style={styles.formContainer}>
              
              {/* LARGE FINTECH AMOUNT INPUT FIELD */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Amount Spent</Text>
                <View style={styles.amountInputRow}>
                  <Text style={styles.currencySymbol}>₱</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    editable={!submitting}
                    autoFocus
                  />
                </View>
              </View>

              {/* DESCRIPTION FIELD INPUT ROW */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description / Reference Remarks</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Dinner at canteen, taxi fare commute"
                  placeholderTextColor="#94A3B8"
                  value={description}
                  onChangeText={setDescription}
                  editable={!submitting}
                />
              </View>

              {/* SAVE ACTION TRIGGER CONTROL BUTTON */}
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.disabledButton]}
                onPress={handleLogExpense}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="receipt-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Commit Expense Record</Text>
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
  container: { flex: 1, backgroundColor: '#FAFBFD' },
  centeredContent: { justifyContent: 'center', alignItems: 'center' },
  
  // MODAL WRAPPER LAYER BOX BOUNDS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)', // semi-transparent backdrop dark overlay
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '75%', // Gibound sa sakto nga kataason aron mupakita as structural sliding modal card sheet
    paddingTop: 12,
  },
  modalDragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
  },
  closeModalHeaderIcon: {
    padding: 2,
  },

  header: { 
    paddingHorizontal: 22, 
    paddingTop: 12, 
    paddingBottom: 20 
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 },
  
  formContainer: { flex: 1, paddingHorizontal: 22, paddingTop: 10 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 10 },
  
  amountInputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 2, 
    borderBottomColor: '#1E293B', 
    paddingVertical: 4 
  },
  currencySymbol: { fontSize: 32, fontWeight: '700', color: '#1E293B', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 36, fontWeight: '700', color: '#1E293B', letterSpacing: -0.5 },
  textInput: { 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    borderRadius: 14, 
    padding: 14, 
    fontSize: 14, 
    color: '#1E293B' 
  },
  
  submitButton: { 
    backgroundColor: '#1E293B', 
    paddingVertical: 16, 
    borderRadius: 16, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 8, 
    marginTop: 'auto', 
    marginBottom: Platform.OS === 'ios' ? 24 : 36, 
    shadowColor: '#1E293B', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 4 
  },
  disabledButton: { opacity: 0.6 },
  submitButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  
  // --- CARD SELECTION COMPONENT UI STYLES ---
  cardSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? (NativeStatusBar.currentHeight ? NativeStatusBar.currentHeight + 16 : 34) : 16,
    paddingBottom: 16
  },
  cardSelectionTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  newCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  newCardButtonText: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  verticalCardList: { paddingHorizontal: 22, gap: 14, paddingBottom: 120 },
  
  // Credit Card Shape Bounds
  largeCreditCard: {
    borderRadius: 24,
    padding: 24,
    height: 170,
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  creditCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  creditCardUserContainer: { flex: 1 },
  creditCardCategoryName: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  creditCardAmount: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginTop: 4 },
  creditCardLogo: { opacity: 0.9 },
  creditCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  creditCardNumber: { color: 'rgba(255,255,255,0.7)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14, letterSpacing: 1 },
  mainCardBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  mainCardBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  
  // Close Anchor Component
  closeButtonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 36,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  closeButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },

  emptyState: { flex: 0.7, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 36, gap: 14 },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#1E293B', letterSpacing: -0.4 },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 22, fontWeight: '400' }
});