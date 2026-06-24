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
  
  // Dynamic Route parameters passed down globally from OCR receipt scanning screen hooks
  const { scannedName, scannedAmount } = useLocalSearchParams<{ scannedName?: string; scannedAmount?: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Structured State Collections
  const [budgets, setBudgets] = useState<BudgetOption[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<BudgetOption | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // 1. EVALUATE SCAN PARAMETERS PASSED FROM OCR VIEWS
  useEffect(() => {
    if (scannedAmount) {
      setAmount(scannedAmount);
    }
    if (scannedName) {
      setDescription(`Scanned: ${scannedName}`);
    }
  }, [scannedAmount, scannedName]);

  // 2. FETCH ACTIVE BUDGET RECORDS ASSOCIATED TO CURRENT USER ID
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
      
      if (validBudgets.length > 0 && !selectedBudget) {
        setSelectedBudget(validBudgets[0]); // Fallback validation default choice selection
      }
    } catch (error: any) {
      console.error("Fetch Budgets Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. PERSIST TRANSACTION AND UPDATE REMAINING BUDGET BALANCES
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
      
      // 1. Create entry within primary operational expenses table
      const { error: insertError } = await supabase
        .from('expenses')
        .insert({
          budget_id: selectedBudget.id,
          amount: expenseAmount,
          description: description.trim() || 'Uncategorized Expense',
          spent_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // 2. Reduce numerical ledger balance states from targets table
      const newRemaining = selectedBudget.remaining_amount - expenseAmount;
      const { error: updateError } = await supabase
        .from('budgets')
        .update({ remaining_amount: newRemaining })
        .eq('id', selectedBudget.id);

      if (updateError) throw updateError;

      Alert.alert("Success 🎉", `Your transaction of ₱${expenseAmount.toFixed(2)} was securely captured.`);
      
      // Clear transactional field contexts safely
      setAmount('');
      setDescription('');
      
      // Re-trigger global account lookup loops
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centeredContent]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="small" color="#10B981" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        {/* Modern Clean Header Stack */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Log New Expense</Text>
          <Text style={styles.headerSubtitle}>Manually record or audit transaction items parsed from your structured balance categories.</Text>
        </View>

        {budgets.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="wallet-outline" size={32} color="#64748B" />
            </View>
            <Text style={styles.emptyText}>No Active Budgets Allocated</Text>
            <Text style={styles.emptySub}>To populate transactional items, configure and allocate capital tokens to individual category slots via your Home layout first.</Text>
          </View>
        ) : (
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

            {/* HORIZONTAL STREAM PICKER COMPONENT FOR BUDGET CARDS */}
            <Text style={styles.label}>Select Budget Allocation Folder</Text>
            <FlatList
              data={budgets}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => {
                const isSelected = selectedBudget?.id === item.id;
                return (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setSelectedBudget(item)}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: item.categories.color || '#1E293B' },
                      isSelected && styles.selectedCard
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      {/* @ts-ignore */}
                      <Ionicons name={item.categories.icon || 'card-outline'} size={18} color="#FFFFFF" />
                      {isSelected && <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />}
                    </View>
                    <View>
                      <Text style={styles.categoryName} numberOfLines={1}>{item.categories.name}</Text>
                      <Text style={styles.categoryRemaining}>Bal: ₱{item.remaining_amount.toFixed(0)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

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
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFD' },
  centeredContent: { justifyContent: 'center', alignItems: 'center' },
  
  // Clean Adaptive Top Section Padding bounds
  header: { 
    paddingHorizontal: 22, 
    paddingTop: Platform.OS === 'android' ? (NativeStatusBar.currentHeight ? NativeStatusBar.currentHeight + 12 : 30) : 12, 
    paddingBottom: 20 
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 },
  
  formContainer: { flex: 1, paddingHorizontal: 22, paddingTop: 10 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 10 },
  
  // Immersive Input Configurations
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
  
  // Compact Horizontal Selector Deck Cards
  categoryList: { gap: 10, paddingBottom: 16, paddingTop: 4 },
  categoryCard: { 
    width: 120, 
    padding: 14, 
    borderRadius: 16, 
    height: 105, 
    justifyContent: 'space-between', 
    opacity: 0.65,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  selectedCard: { 
    opacity: 1, 
    borderWidth: 2, 
    borderColor: '#1E293B',
    transform: [{ scale: 1.02 }]
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryName: { color: '#FFFFFF', fontWeight: '600', fontSize: 13, marginTop: 12, letterSpacing: -0.2 },
  categoryRemaining: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '500', marginTop: 2 },
  
  // Main Submission Anchor Node
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
  
  // Structural Presentation Boundaries
  emptyState: { flex: 0.8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 36, gap: 14 },
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