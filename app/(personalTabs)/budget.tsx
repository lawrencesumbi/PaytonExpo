import { supabase } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface BudgetEntry {
  id: string;
  category: string;
  amount: number;
  month_year: string;
}

interface ExpenseSummary {
  [category: string]: number;
}

export default function BudgetScreen() {
  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseSummary>({});
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Form States para sa Bag-ong Budget
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('All');
  const [formLoading, setFormLoading] = useState(false);

  // DYNAMIC DATE: Awtomatiko nga mokuha sa kasamtangang tuig ug bulan (Format: YYYY-MM)
  const getCurrentMonthYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // i-ensure nga 2 digits (e.g., '06')
    return `${year}-${month}`;
  };

  const currentMonthYear = getCurrentMonthYear(); 

  // Para sa human-readable display sa UI (e.g., "Hunyo 2026")
  const getReadableMonth = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    return new Date().toLocaleDateString('eb-PH', options); // Pwede ra 'en-US' kung gusto kag English text
  };

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) throw new Error('Walay active user session.');

      const userId = session.user.id;

      // 1. Fetch Budgets para sa kasamtangang bulan ('YYYY-MM')
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', currentMonthYear);

      if (budgetError) throw budgetError;

      // I-calculate ang sugod ug katapusan nga adlaw sa kasamtangang bulan para sa DATE ranges
      // Pananglitan para sa Hunyo 2026: '2026-06-01' ug '2026-06-30'
      const startDate = `${currentMonthYear}-01`;
      const endDate = `${currentMonthYear}-30`; // Pwede ra '2026-06-31' pero kadaghanan sa DB mosugot ra og exact range filter

      // 2. Fetch Paid Reminders (Expenses) gamit ang saktong DATE range indicators (.gte ug .lte)
      const { data: reminderData, error: reminderError } = await supabase
        .from('reminders')
        .select('amount, category')
        .eq('user_id', userId)
        .eq('status', 'paid')
        .gte('due_date', startDate)
        .lte('due_date', endDate);

      if (reminderError) throw reminderError;

      // I-aggregate o i-sum ang expenses matag kategorya
      const expenseMap: ExpenseSummary = { All: 0 };
      reminderData?.forEach((rem) => {
        const amt = parseFloat(rem.amount as any);
        expenseMap[rem.category] = (expenseMap[rem.category] || 0) + amt;
        expenseMap['All'] += amt;
      });

      setBudgets(budgetData || []);
      setExpenses(expenseMap);
    } catch (error: any) {
      console.error('Error loading budget data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    if (!amount) {
      Alert.alert('Oops!', 'Palihog butangi og kantidad.');
      return;
    }

    setFormLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) throw new Error('Walay active user session.');

      const { error } = await supabase
        .from('budgets')
        .upsert({
          user_id: session.user.id,
          category,
          amount: parseFloat(amount),
          month_year: currentMonthYear, // i-save gamit ang dynamic month string
        }, { onConflict: 'user_id,category,month_year' });

      if (error) throw error;

      Alert.alert('Success', 'Ang imong budget malampusong na-save!');
      setAmount('');
      setCategory('All');
      setIsModalVisible(false);
      loadBudgetData(); // I-refresh dretso ang UI
    } catch (error: any) {
      Alert.alert('Error saving budget', error.message || 'Naay sayop nga nahitabo.');
    } finally {
      setFormLoading(false);
    }
  };

  const mainBudgetEntry = budgets.find(b => b.category === 'All');
  const totalAllocatedBudget = mainBudgetEntry ? mainBudgetEntry.amount : 0;
  const totalSpent = expenses['All'] || 0;
  const totalRemaining = totalAllocatedBudget - totalSpent;
  const totalProgress = totalAllocatedBudget > 0 ? (totalSpent / totalAllocatedBudget) : 0;

  return (
    <View style={styles.screenContainer}>
      
      {/* HEADER GROUP */}
      <View style={styles.topHeaderGroup}>
        <View>
          <Text style={styles.mainHeading}>Dashboard</Text>
          <Text style={styles.subHeadingText}>Bulan: {getReadableMonth()}</Text>
        </View>
        <TouchableOpacity style={styles.topAddButton} onPress={() => setIsModalVisible(true)}>
          <Text style={styles.topAddButtonText}>+ Add Budget</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#15803d" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollLayout}>
          
          {/* MAIN OVERVIEW CARD */}
          <View style={styles.mainSummaryCard}>
            <Text style={styles.cardHeaderLabel}>Kinatibuk-ang Budget ('All')</Text>
            <Text style={styles.mainBudgetText}>₱{totalAllocatedBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
            
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${Math.min(totalProgress * 100, 100)}%`, backgroundColor: totalProgress > 0.9 ? '#ef4444' : '#34d399' }]} />
            </View>

            <View style={styles.cardFooterGrid}>
              <View>
                <Text style={styles.footerLabel}>Nagasto (Paid)</Text>
                <Text style={styles.footerValueSpent}>₱{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.footerLabel}>Nabilin (Remaining)</Text>
                <Text style={[styles.footerValueLeft, totalRemaining < 0 && { color: '#f87171' }]}>
                  ₱{totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </View>

          {/* CATEGORIES BREAKDOWN SECTION */}
          <Text style={styles.sectionTitle}>Breakdown Matag Kategorya</Text>
          
          {budgets.filter(b => b.category !== 'All').length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Walay mga piho nga budget sa kategorya.</Text>
            </View>
          ) : (
            budgets.filter(b => b.category !== 'All').map((item) => {
              const catSpent = expenses[item.category] || 0;
              const catProgress = item.amount > 0 ? (catSpent / item.amount) : 0;
              return (
                <View key={item.id} style={styles.categoryCard}>
                  <View style={styles.categoryHeaderRow}>
                    <Text style={styles.categoryCardName}>{item.category}</Text>
                    <Text style={styles.categoryCardValues}>
                      ₱{catSpent} / <Text style={{ fontWeight: 'bold' }}>₱{item.amount}</Text>
                    </Text>
                  </View>
                  <View style={styles.progressBarBackgroundSmall}>
                    <View style={[styles.progressBarFillSmall, { width: `${Math.min(catProgress * 100, 100)}%`, backgroundColor: catProgress > 0.9 ? '#ef4444' : '#10b981' }]} />
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* CUSTOM FORM OVERLAY POPUP */}
      {isModalVisible && (
        <View style={styles.overlayContainer}>
          <View style={styles.formContainer}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              
              <View style={styles.formHeader}>
                <View>
                  <Text style={styles.headerTitle}>I-set ang Limit sa Budget</Text>
                  <Text style={styles.headerSubtitle}>Bulan: {currentMonthYear}</Text>
                </View>
                <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
              </View>

              {/* Form Input: Category */}
              <Text style={styles.inputLabel}>Pilia ang Kategorya</Text>
              <View style={styles.categoryContainer}>
                {['All', 'Utilities', 'Subscription', 'Loan', 'Food', 'Others'].map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[styles.categoryBadge, isSelected ? styles.categoryBadgeActive : styles.categoryBadgeInactive]}
                    >
                      <Text style={[styles.categoryText, isSelected ? styles.categoryTextActive : styles.categoryTextInactive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Form Input: Amount Limit */}
              <Text style={styles.inputLabel}>Kantidad Limit (₱)</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#a7f3d0"
                keyboardType="numeric"
                style={styles.textInput}
              />

              {/* Form Action Submit Button */}
              <TouchableOpacity
                onPress={handleSaveBudget}
                disabled={formLoading}
                style={[styles.saveButton, formLoading && { opacity: 0.6 }]}
              >
                <Text style={styles.saveButtonText}>
                  {formLoading ? 'Gisave pa...' : 'I-save ang Setup'}
                </Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

// MANAGEMENT SA TANANG LAYOUT STYLES
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  topHeaderGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subHeadingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  topAddButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  topAddButtonText: {
    color: '#022c22',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollLayout: {
    flex: 1,
  },
  mainSummaryCard: {
    backgroundColor: '#064e3b', 
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
    marginTop: 10,
  },
  cardHeaderLabel: {
    color: '#a7f3d0',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  mainBudgetText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  progressBarBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  cardFooterGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  footerLabel: {
    color: '#a7f3d0',
    fontSize: 12,
  },
  footerValueSpent: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  footerValueLeft: {
    color: '#34d399',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryCardName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  categoryCardValues: {
    fontSize: 14,
    color: '#64748b',
  },
  progressBarBackgroundSmall: {
    backgroundColor: '#f1f5f9',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFillSmall: {
    height: '100%',
    borderRadius: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    zIndex: 100, 
  },
  formContainer: {
    backgroundColor: '#022c22', 
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '75%',
    borderTopWidth: 1,
    borderTopColor: '#064e3b',
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34d399',
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: '#064e3b',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#a7f3d0',
    fontWeight: 'bold',
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a7f3d0',
    marginBottom: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
    borderWidth: 1,
  },
  categoryBadgeActive: {
    backgroundColor: '#10b981',
    borderColor: '#34d399',
  },
  categoryBadgeInactive: {
    backgroundColor: '#064e3b',
    borderColor: '#0f766e',
  },
  categoryText: {
    fontWeight: '600',
    fontSize: 13,
  },
  categoryTextActive: {
    color: '#022c22',
  },
  categoryTextInactive: {
    color: '#a7f3d0',
  },
  textInput: {
    backgroundColor: '#064e3b',
    color: '#ffffff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#0f766e',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#022c22',
    fontWeight: 'bold',
    fontSize: 16,
  },
});