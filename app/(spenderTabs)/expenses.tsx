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
import { supabase } from '../../lib/supabase'; // I-adjust ang path sumala sa folder

interface AllowanceInfo {
  id: string;
  allowance_name: string;
  amount: number;
}

interface ExpenseItem {
  id: string;
  expense_name: string;
  amount: number;
  category: string;
  created_at: string;
}

export default function ExpensesScreen() {
  // Allowance States
  const [activeAllowance, setActiveAllowance] = useState<AllowanceInfo | null>(null);
  const [loadingAllowance, setLoadingAllowance] = useState(true);

  // Form States
  const [expenseName, setExpenseName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food'); // Default category
  const [submitting, setSubmitting] = useState(false);

  // Expenses List State
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);

  // 1. I-FETCH ANG ACTIVE ALLOWANCE SA SPENDER
  const fetchActiveAllowanceAndExpenses = async () => {
    try {
      setLoadingAllowance(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Kuhaon ang pinakabag-ong allowance nga gi-set para sa kaniya
      const { data: allowanceData, error: allowanceError } = await supabase
        .from('allowances')
        .select('id, allowance_name, amount')
        .eq('spender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (allowanceError) throw allowanceError;

      if (allowanceData && allowanceData.length > 0) {
        const currentAllowance = allowanceData[0];
        setActiveAllowance(currentAllowance);

        // 2. I-FETCH SAB ANG MGA EXPENSES UBOS NIINING ALLOWANCE
        const { data: expenseData, error: expenseError } = await supabase
          .from('expenses')
          .select('id, expense_name, amount, category, created_at')
          .eq('allowance_id', currentAllowance.id)
          .order('created_at', { ascending: false });

        if (expenseError) throw expenseError;

        setExpenses(expenseData || []);
        
        // Kwentahon ang total nga nagasto na
        const spent = (expenseData || []).reduce((sum, item) => sum + item.amount, 0);
        setTotalSpent(spent);
      } else {
        setActiveAllowance(null);
      }
    } catch (error: any) {
      console.error("Fetch Data Error:", error.message);
    } finally {
      setLoadingAllowance(false);
    }
  };

  useEffect(() => {
    fetchActiveAllowanceAndExpenses();
  }, []);

  // 3. FUNCTION PARA MO-RECORD OG EXPENSE
  const handleAddExpense = async () => {
    if (!activeAllowance) {
      Alert.alert("Ops!", "Dili ka ka-record og expense kay wala pa kay active allowance gikan sa imong Sponsor.");
      return;
    }

    if (!expenseName.trim() || !amount.trim()) {
      Alert.alert("Ops!", "Palihog og sulod sa ngalan sa gasto ug kantidad.");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Sayop nga Numero", "Siguroha nga husto ang kantidad.");
      return;
    }

    // Check kung ma-overdraft ba o molapas sa allowance limit
    if (totalSpent + numericAmount > activeAllowance.amount) {
      Alert.alert("Over Budget! ⚠️", "Dili na igo ang imong nabilin nga allowance para niini nga gasto.");
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('expenses')
        .insert([
          {
            allowance_id: activeAllowance.id,
            spender_id: user.id,
            expense_name: expenseName.trim(),
            amount: numericAmount,
            category: category
          }
        ]);

      if (error) throw error;

      Alert.alert("Recorded 🎉", `Na-save ang imong gasto para sa ${expenseName}!`);
      setExpenseName('');
      setAmount('');
      
      // I-refresh ang data aron mo-update ang listahan ug nabilin nga balanse
      fetchActiveAllowanceAndExpenses();

    } catch (error: any) {
      Alert.alert("Error ❌", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const remainingBalance = activeAllowance ? activeAllowance.amount - totalSpent : 0;

  if (loadingAllowance) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#0CD964" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        
        {/* Kung Walay Active Allowance */}
        {!activeAllowance ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="card-outline" size={64} color="#7DA08E" />
            <Text style={styles.noAllowanceText}>Walay Active Allowance</Text>
            <Text style={styles.noAllowanceSub}>Pahibalo-a ang imong Sponsor nga butangan ka og allowance para makasugod ka og record sa imong expenses.</Text>
          </View>
        ) : (
          <FlatList
            data={expenses}
            keyExtractor={(item) => item.id}
            refreshing={loadingAllowance}
            onRefresh={fetchActiveAllowanceAndExpenses}
            contentContainerStyle={styles.listPadding}
            
            // ANG FORM UG CARD SUMMARY MAO ANG HEADER SA FLATLIST
            ListHeaderComponent={
              <View>
                {/* Balance Summary Tracker Card */}
                <View style={styles.balanceCard}>
                  <Text style={styles.allowanceTitleLabel}>{activeAllowance.allowance_name}</Text>
                  <Text style={styles.balanceAmount}>₱{remainingBalance.toFixed(2)}</Text>
                  <Text style={styles.balanceSubtext}>Nabilin gikan sa ₱{activeAllowance.amount.toFixed(2)}</Text>
                </View>

                {/* Add Expense Form */}
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Record New Expense</Text>
                  
                  <TextInput 
                    style={styles.input}
                    placeholder="Unsa imong gipalit/gasto?"
                    placeholderTextColor="#7DA08E"
                    value={expenseName}
                    onChangeText={setExpenseName}
                  />

                  <View style={styles.rowInputs}>
                    <TextInput 
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      placeholder="₱ 0.00"
                      placeholderTextColor="#7DA08E"
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />

                    {/* Simple Category Selector Button toggles */}
                    <View style={styles.categoryRow}>
                      {['Food', 'Travel', 'School'].map((cat) => (
                        <TouchableOpacity 
                          key={cat}
                          style={[styles.catButton, category === cat && styles.catButtonActive]}
                          onPress={() => setCategory(cat)}
                        >
                          <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity style={styles.addButton} onPress={handleAddExpense} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.addButtonText}>Log Expense</Text>}
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>History sa mga Gasto</Text>
              </View>
            }

            // LIST RENDER SA MGA NAGASTO NA
            renderItem={({ item }) => (
              <View style={styles.expenseCard}>
                <View style={styles.cardLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons 
                      name={item.category === 'Food' ? "fast-food" : item.category === 'Travel' ? "car" : "book"} 
                      size={18} 
                      color="#213502" 
                    />
                  </View>
                  <View>
                    <Text style={styles.expenseNameText}>{item.expense_name}</Text>
                    <Text style={styles.categoryBadge}>{item.category}</Text>
                  </View>
                </View>
                <Text style={styles.expenseAmountText}>- ₱{item.amount.toFixed(2)}</Text>
              </View>
            )}

            ListEmptyComponent={
              <View style={styles.emptyExpenses}>
                <Text style={styles.emptyExpensesText}>Wala pa kay narekord nga gasto.</Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1 },
  listPadding: { padding: 20 },
  balanceCard: { backgroundColor: '#213502', padding: 20, borderRadius: 16, marginBottom: 20 },
  allowanceTitleLabel: { color: '#7DA08E', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  balanceAmount: { color: '#FFFFFF', fontSize: 34, fontWeight: 'bold', marginTop: 4 },
  balanceSubtext: { color: '#F4F7F5', fontSize: 12, marginTop: 8, opacity: 0.8 },
  formCard: { backgroundColor: '#F4F7F5', padding: 16, borderRadius: 12, marginBottom: 25, borderWidth: 1, borderColor: '#E2E8E4' },
  formTitle: { fontSize: 15, fontWeight: 'bold', color: '#213502', marginBottom: 12 },
  input: { backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, fontSize: 14, borderWidth: 1, borderColor: '#7DA08E', color: '#213502', marginBottom: 10 },
  rowInputs: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12 },
  categoryRow: { flexDirection: 'row', gap: 4 },
  catButton: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#7DA08E' },
  catButtonActive: { backgroundColor: '#213502', borderColor: '#213502' },
  catText: { fontSize: 11, color: '#557261', fontWeight: '600' },
  catTextActive: { color: '#FFFFFF' },
  addButton: { backgroundColor: '#0CD964', padding: 12, borderRadius: 8, alignItems: 'center', height: 46, justifyContent: 'center' },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#213502', marginBottom: 12 },
  expenseCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8E4' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F7F5', justifyContent: 'center', alignItems: 'center' },
  expenseNameText: { fontSize: 14, fontWeight: '600', color: '#213502' },
  categoryBadge: { fontSize: 10, color: '#557261', marginTop: 2 },
  expenseAmountText: { fontSize: 14, fontWeight: 'bold', color: '#C0392B' },
  emptyExpenses: { alignItems: 'center', padding: 20 },
  emptyExpensesText: { fontSize: 13, color: '#557261' },
  emptyStateContainer: { flex: 0.8, justifyContent: 'center', alignItems: 'center', padding: 30, gap: 12 },
  noAllowanceText: { fontSize: 18, fontWeight: 'bold', color: '#213502' },
  noAllowanceSub: { fontSize: 13, color: '#557261', textAlign: 'center', lineHeight: 18 }
});