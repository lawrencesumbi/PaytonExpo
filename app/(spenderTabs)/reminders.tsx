// app/(spenderTabs)/reminders.tsx
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StatusBar as NativeStatusBar,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../../lib/supabase';

interface Reminder {
  id: string;
  title: string;
  amount: number;
  category_id: string;
  due_date: string;
  status: 'pending' | 'paid';
  categories?: {
    name: string;
    icon: string;
    color: string;
  };
}

interface CategorySelect {
  id: string;
  name: string;
}

export default function RemindersScreen() {
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [categories, setCategories] = useState<CategorySelect[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  
  // Selection and Modal Configuration States
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRemindersAndCategories = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Categories for Filter Dropdown Chips
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name')
        .or(`user_id.is.null,user_id.eq.${user.id}`);
      
      if (catData) setCategories(catData);

      // 2. Fetch Reminders featuring Category Relation Data
      const { data: remData, error: remError } = await supabase
        .from('reminders')
        .select(`
          id, title, amount, category_id, due_date, status,
          categories ( name, icon, color )
        `)
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (remError) throw remError;

      if (remData) {
        setReminders(remData as unknown as Reminder[]);
        
        // Formulate micro dot markers for Calendar layout
        const markers: any = {};
        remData.forEach((rem) => {
          markers[rem.due_date] = {
            marked: true,
            dotColor: rem.status === 'pending' ? '#EF4444' : '#10B981',
          };
        });
        setMarkedDates(markers);
      }
    } catch (error: any) {
      console.error('Error fetching reminders:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
  };

  const handleSaveReminder = async () => {
    if (!title || !amount || !selectedCategoryId || !selectedDate) {
      Alert.alert('Missing Fields', 'Please complete all fields to establish this reminder.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please input a valid positive currency figure.');
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('reminders').insert({
        user_id: user.id,
        title,
        amount: parsedAmount,
        category_id: selectedCategoryId,
        due_date: selectedDate,
        status: 'pending'
      });

      if (error) throw error;

      Alert.alert('Success 🎉', 'Your payment schedule has been saved successfully!');
      setModalVisible(false);
      setTitle('');
      setAmount('');
      setSelectedCategoryId('');
      fetchRemindersAndCategories();
    } catch (error: any) {
      Alert.alert('Database Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (reminder: Reminder) => {
    Alert.alert(
      'Confirm Payment',
      `Are you sure you want to mark "${reminder.title}" (₱${reminder.amount.toFixed(2)}) as paid? This will automatically deduct from your allocated budget ledger.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Bill',
          onPress: async () => {
            try {
              setLoading(true);
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              // 1. Verify availability of target category balance boundaries
              const { data: budget, error: budgetError } = await supabase
                .from('budgets')
                .select('id, remaining_amount')
                .eq('user_id', user.id)
                .eq('category_id', reminder.category_id)
                .maybeSingle();

              if (budgetError) throw budgetError;

              if (!budget) {
                Alert.alert('No Existing Budget', 'You have not allocated a structural budget for this specific category yet.');
                setLoading(false);
                return;
              }

              if (Number(budget.remaining_amount) < reminder.amount) {
                Alert.alert('Insufficient Balance', `Your remaining budget for this ledger category is only ₱${Number(budget.remaining_amount).toFixed(2)}.`);
                setLoading(false);
                return;
              }

              // 2. Perform math reduction on remaining_amount values
              const newRemaining = Number(budget.remaining_amount) - reminder.amount;
              const { error: updateBudgetError } = await supabase
                .from('budgets')
                .update({ remaining_amount: newRemaining })
                .eq('id', budget.id);

              if (updateBudgetError) throw updateBudgetError;

              // 3. Log into Expense table tracking analytics
              const { error: expenseError } = await supabase
                .from('expenses')
                .insert({
                  budget_id: budget.id,
                  description: `Paid Bill: ${reminder.title}`,
                  amount: reminder.amount,
                  spent_at: new Date().toISOString()
                });

              if (expenseError) throw expenseError;

              // 4. Update reminder structural flag parameters to 'paid'
              const { error: updateRemError } = await supabase
                .from('reminders')
                .update({ status: 'paid' })
                .eq('id', reminder.id);

              if (updateRemError) throw updateRemError;

              Alert.alert('Payment Logged 🎉', 'Bill successfully marked as paid and deducted from your budget.');
              fetchRemindersAndCategories();
            } catch (error: any) {
              Alert.alert('Transaction Refused', error.message);
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    fetchRemindersAndCategories();
  }, []);

  const renderReminderItem = ({ item }: { item: Reminder }) => (
    <View style={styles.reminderCard}>
      <View style={styles.reminderLeft}>
        <View style={[styles.categoryIndicator, { backgroundColor: item.categories?.color || '#0E2417' }]}>
          <Text style={styles.indicatorText}>{item.categories?.name.substring(0, 2).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reminderTitle}>{item.title}</Text>
          <Text style={styles.reminderSub}>{item.due_date} • ₱{item.amount.toFixed(2)}</Text>
        </View>
      </View>
      
      {item.status === 'pending' ? (
        <TouchableOpacity style={styles.payBtn} onPress={() => handleMarkAsPaid(item)}>
          <Text style={styles.payBtnText}>Pay Now</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.paidBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.paidText}>Paid</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Modern High Contrast Header Element */}
      <View style={styles.headerBackground}>
        <Text style={styles.headerTitle}>Reminders & Bills</Text>
        <Text style={styles.headerSubtext}>Tap any calendar date boundary block to log an upcoming payable entity.</Text>
      </View>

      {/* Floating Compact Calendar Wrapper */}
      <View style={styles.calendarWrapper}>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={{
            ...markedDates,
            [selectedDate]: { ...markedDates[selectedDate], selected: true, selectedColor: '#10B981' }
          }}
          theme={{
            backgroundColor: '#FFFFFF',
            calendarBackground: '#FFFFFF',
            textSectionTitleColor: '#94A3B8',
            selectedDayBackgroundColor: '#10B981',
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: '#10B981',
            dayTextColor: '#1E293B',
            arrowColor: '#1E293B',
            monthTextColor: '#1E293B',
            indicatorColor: '#10B981',
          }}
        />
      </View>

      {/* Ledger Feed View Block */}
      <View style={styles.feedWrapper}>
        <Text style={styles.sectionTitle}>Upcoming & Pending Bills</Text>
        {loading ? (
          <View style={styles.centeredLoader}>
            <ActivityIndicator size="small" color="#10B981" />
          </View>
        ) : (
          <FlatList
            data={reminders}
            keyExtractor={(item) => item.id}
            renderItem={renderReminderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListPadding}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-clear-outline" size={36} color="#94A3B8" />
                <Text style={styles.emptyText}>No reminders scheduled yet.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Modern Sheet Layer Add Reminder Modal Form */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Reminder ({selectedDate})</Text>
              <TouchableOpacity style={styles.closeBtnBox} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Bill Name / Title</Text>
            <TextInput style={styles.input} placeholder="e.g. Electric Bill, Fiber Internet" placeholderTextColor="#94A3B8" value={title} onChangeText={setTitle} />

            <Text style={styles.label}>Amount (₱)</Text>
            <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#94A3B8" keyboardType="numeric" value={amount} onChangeText={setAmount} />

            <Text style={styles.label}>Link to Budget Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, selectedCategoryId === cat.id && styles.categoryChipSelected]}
                  onPress={() => setSelectedCategoryId(cat.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, selectedCategoryId === cat.id && styles.chipTextSelected]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveReminder} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>Create Reminder</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFD' },
  
  // Custom Adaptive Top Branding Banner Layout
  headerBackground: { 
    backgroundColor: '#0E2417', 
    paddingHorizontal: 22, 
    paddingTop: Platform.OS === 'android' ? (NativeStatusBar.currentHeight ? NativeStatusBar.currentHeight + 16 : 40) : 16, 
    paddingBottom: 32, 
    borderBottomLeftRadius: 28, 
    borderBottomRightRadius: 28 
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSubtext: { fontSize: 13, color: '#94A3B8', marginTop: 4, lineHeight: 18, fontWeight: '400' },
  
  // Elevated Calendar Section
  calendarWrapper: { 
    backgroundColor: '#FFFFFF', 
    marginHorizontal: 16,
    marginTop: -20, // Clean overlap dynamic visual design style
    borderRadius: 24, 
    padding: 12, 
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.04, 
    shadowRadius: 12, 
    elevation: 4 
  },
  
  // Lower Item Stream Setup
  feedWrapper: { flex: 1, paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 12 },
  flatListPadding: { paddingBottom: 40 },
  centeredLoader: { marginTop: 30, alignItems: 'center' },
  
  // Fine Card Components
  reminderCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1
  },
  reminderLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  categoryIndicator: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', opacity: 0.9 },
  indicatorText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  reminderTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  reminderSub: { fontSize: 12, color: '#64748B', marginTop: 3 },
  
  // Call to Action Buttons
  payBtn: { backgroundColor: '#1E293B', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  payBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 10 },
  paidText: { color: '#10B981', fontSize: 12, fontWeight: '600' },
  
  // Empty State Fallback
  emptyContainer: { alignItems: 'center', marginTop: 40, gap: 10 },
  emptyText: { textAlign: 'center', color: '#64748B', fontSize: 13, fontWeight: '400' },
  
  // Bottom Form Drawer Presentation
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', letterSpacing: -0.3 },
  closeBtnBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#F1F5F9', padding: 14, borderRadius: 14, marginBottom: 18, backgroundColor: '#FAFBFD', fontSize: 14, color: '#1E293B' },
  
  // Chip Select Micro Grid Layout
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 26 },
  categoryChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  categoryChipSelected: { backgroundColor: '#0E2417', borderColor: '#0E2417' },
  chipText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  
  saveBtn: { backgroundColor: '#10B981', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' }
});