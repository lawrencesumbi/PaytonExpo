// app/(spenderTabs)/expenses.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form States
  const [budgets, setBudgets] = useState<BudgetOption[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<BudgetOption | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Fetch only active budgets that this user has allocated money to
  const fetchActiveBudgets = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Gi-join nato ang budgets ug categories para makuha ang ngalan ug icon sa kategorya
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
      
      // I-filter lang kadtong mga kategorya nga naay tarong nga join data
      const validBudgets = (data || []).filter((b: any) => b.categories) as unknown as BudgetOption[];
      setBudgets(validBudgets);
      
      if (validBudgets.length > 0 && !selectedBudget) {
        setSelectedBudget(validBudgets[0]); // Default selection
      }
    } catch (error: any) {
      console.error("Fetch Budgets Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogExpense = async () => {
    if (!selectedBudget) {
      Alert.alert("Sipyat", "Palihog pagpili og kategorya sa budget.");
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      Alert.alert("Sipyat", "Palihog pagbutang og saktong kantidad sa gasto.");
      return;
    }

    if (expenseAmount > selectedBudget.remaining_amount) {
      Alert.alert(
        "Kulang ang Budget", 
        `Dili ka ka-gasto og ₱${expenseAmount.toFixed(2)} kay ₱${selectedBudget.remaining_amount.toFixed(2)} nalang ang nabilin nga budget niini nga kategorya.`
      );
      return;
    }

    try {
      setSubmitting(true);
      
      // 1. I-insert ang record sa expenses table
      const { error: insertError } = await supabase
        .from('expenses')
        .insert({
          budget_id: selectedBudget.id,
          amount: expenseAmount,
          description: description.trim() || 'No Description',
          spent_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // 2. I-update/I-deduct ang remaining_amount sa budgets table
      const newRemaining = selectedBudget.remaining_amount - expenseAmount;
      const { error: updateError } = await supabase
        .from('budgets')
        .update({ remaining_amount: newRemaining })
        .eq('id', selectedBudget.id);

      if (updateError) throw updateError;

      Alert.alert("Success", `Na-record na ang imong gasto nga ₱${expenseAmount.toFixed(2)}!`);
      
      // I-clear ang form fields
      setAmount('');
      setDescription('');
      
      // I-refresh ang listahan para updated ang remaining amounts
      await fetchActiveBudgets();

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchActiveBudgets();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#54C6CC" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Log New Expense</Text>
          <Text style={styles.headerSubtitle}>I-rekord ang imong mga nagasto gikan sa imong gi-allocate nga budget</Text>
        </View>

        {budgets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color="#8A9A91" />
            <Text style={styles.emptyText}>No Active Budgets Allocated</Text>
            <Text style={styles.emptySub}>Pang-allocate una og kwarta sa imong mga kategorya didto sa Home Screen aron ka makasugod og log og expenses.</Text>
          </View>
        ) : (
          <View style={styles.formContainer}>
            
            {/* INPUT SA KANTIDAD */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount Spent</Text>
              <View style={styles.amountInputRow}>
                <Text style={styles.currencySymbol}>₱</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  editable={!submitting}
                />
              </View>
            </View>

            {/* DESCRIPTION INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description / Remarks</Text>
              <TextInput
                style={styles.textInput}
                placeholder="E.g., Gi-paniudto sa canteen, plete sa jeep"
                value={description}
                onChangeText={setDescription}
                editable={!submitting}
              />
            </View>

            {/* SELECT BUDGET CATEGORY */}
            <Text style={styles.label}>Select Budget Category</Text>
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
                    activeOpacity={0.8}
                    onPress={() => setSelectedBudget(item)}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: item.categories.color },
                      isSelected && styles.selectedCard
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      {/* @ts-ignore */}
                      <Ionicons name={item.categories.icon} size={20} color="#FFFFFF" />
                      {isSelected && <Ionicons name="checkmark-circle" size={18} color="#0CD964" />}
                    </View>
                    <Text style={styles.categoryName} numberOfLines={1}>{item.categories.name}</Text>
                    <Text style={styles.categoryRemaining}>Bal: ₱{item.remaining_amount.toFixed(0)}</Text>
                  </TouchableOpacity>
                );
              }}
            />

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.disabledButton]}
              onPress={handleLogExpense}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="receipt-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Save Expense</Text>
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
  container: { flex: 1, backgroundColor: '#F8FAF9' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0E2417' },
  headerSubtitle: { fontSize: 13, color: '#557261', marginTop: 4, lineHeight: 18 },
  formContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#0E2417', marginBottom: 8 },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomWidth: 2, borderBottomColor: '#0E2417', paddingVertical: 5 },
  currencySymbol: { fontSize: 28, fontWeight: 'bold', color: '#0E2417', marginRight: 5 },
  amountInput: { flex: 1, fontSize: 32, fontWeight: 'bold', color: '#0E2417' },
  textInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEFEF', borderRadius: 10, padding: 14, fontSize: 15, color: '#0E2417' },
  categoryList: { gap: 12, paddingBottom: 15, paddingTop: 5 },
  categoryCard: { width: 115, padding: 12, borderRadius: 12, height: 95, justifyContent: 'space-between', opacity: 0.7, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  selectedCard: { opacity: 1, borderWidth: 2, borderColor: '#0E2417' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryName: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13, marginTop: 8 },
  categoryRemaining: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  submitButton: { backgroundColor: '#0E2417', paddingVertical: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 'auto', marginBottom: Platform.OS === 'ios' ? 20 : 35, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  disabledButton: { opacity: 0.6 },
  submitButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#0E2417' },
  emptySub: { fontSize: 13, color: '#557261', textAlign: 'center', lineHeight: 20 }
});