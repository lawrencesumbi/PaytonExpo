// app/(spenderTabs)/reminders.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
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
  
  // Selection and Modal States
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

      // 1. Fetch Categories for Dropdown Selection
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name')
        .or(`user_id.is.null,user_id.eq.${user.id}`);
      
      if (catData) setCategories(catData);

      // 2. Fetch Reminders (including category join)
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
        
        // Setup markers para sa Calendar
        const markers: any = {};
        remData.forEach((rem) => {
          markers[rem.due_date] = {
            marked: true,
            dotColor: rem.status === 'pending' ? '#C0392B' : '#0CD964',
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
      Alert.alert('Sipyat', 'Palihog og sulod sa tanang gikinahanglan nga fields.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Sipyat', 'Invalid nga kantidad.');
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

      Alert.alert('Success', 'Na-save na ang imong reminder!');
      setModalVisible(false);
      setTitle('');
      setAmount('');
      setSelectedCategoryId('');
      fetchRemindersAndCategories();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (reminder: Reminder) => {
    Alert.alert(
      'Kumpirmasyon',
      `Sigurado ka ba nga bayran kining ₱${reminder.amount.toFixed(2)} alang sa "${reminder.title}"? Kini awtomatikong ma-deduct sa imong budget.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Bayran Na',
          onPress: async () => {
            try {
              setLoading(true);
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              // 1. Susiha kung naa ba'y existing budget para sa kani nga category
              const { data: budget, error: budgetError } = await supabase
                .from('budgets')
                .select('id, remaining_amount')
                .eq('user_id', user.id)
                .eq('category_id', reminder.category_id)
                .maybeSingle();

              if (budgetError) throw budgetError;

              if (!budget) {
                Alert.alert('Walay Budget', 'Wala nimo ma-allocate og budget kini nga kategorya sa imong Home screen.');
                setLoading(false);
                return;
              }

              if (Number(budget.remaining_amount) < reminder.amount) {
                Alert.alert('Kulang ang Budget', `Ang nahabilin nga budget sa kini nga kategorya kay ₱${Number(budget.remaining_amount).toFixed(2)} na lang.`);
                setLoading(false);
                return;
              }

              // 2. Awtomatikong Deduct gikan sa Budgets table (remaining_amount)
              const newRemaining = Number(budget.remaining_amount) - reminder.amount;
              const { error: updateBudgetError } = await supabase
                .from('budgets')
                .update({ remaining_amount: newRemaining })
                .eq('id', budget.id);

              if (updateBudgetError) throw updateBudgetError;

              // 3. I-insert isip opisyal nga record sa Expenses table para ma-track sa home/analytics
              const { error: expenseError } = await supabase
                .from('expenses')
                .insert({
                  budget_id: budget.id,
                  description: `Paid Bill: ${reminder.title}`,
                  amount: reminder.amount,
                  spent_at: new Date().toISOString()
                });

              if (expenseError) throw expenseError;

              // 4. Update sa status sa Reminder ngadto sa 'paid'
              const { error: updateRemError } = await supabase
                .from('reminders')
                .update({ status: 'paid' })
                .eq('id', reminder.id);

              if (updateRemError) throw updateRemError;

              Alert.alert('Success', 'Bayranan na-markahan isip Paid ug na-deduct na sa budget!');
              fetchRemindersAndCategories();
            } catch (error: any) {
              Alert.alert('Error', error.message);
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
        <View style={[styles.categoryIndicator, { backgroundColor: item.categories?.color || '#1F4F59' }]}>
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
          <Ionicons name="checkmark-circle" size={16} color="#0CD964" />
          <Text style={styles.paidText}>Paid</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Block */}
      <View style={styles.headerBackground}>
        <Text style={styles.headerTitle}>Reminders & Bills</Text>
        <Text style={styles.headerSubtext}>I-tap ang petsa sa calendar para mag-add og bayranan.</Text>
      </View>

      {/* Calendar Area */}
      <View style={styles.calendarWrapper}>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={{
            ...markedDates,
            [selectedDate]: { ...markedDates[selectedDate], selected: true, selectedColor: '#54C6CC' }
          }}
          theme={{
            backgroundColor: '#FFFFFF',
            calendarBackground: '#FFFFFF',
            textSectionTitleColor: '#A3B8AD',
            selectedDayBackgroundColor: '#54C6CC',
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: '#54C6CC',
            dayTextColor: '#0E2417',
            arrowColor: '#0E2417',
            monthTextColor: '#0E2417',
            indicatorColor: '#0E2417',
          }}
        />
      </View>

      {/* List section */}
      <View style={{ flex: 1, paddingHorizontal: 20, marginTop: 10 }}>
        <Text style={styles.sectionTitle}>Upcoming & Pending Bills</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#54C6CC" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={reminders}
            keyExtractor={(item) => item.id}
            renderItem={renderReminderItem}
            contentContainerStyle={{ paddingBottom: 20, marginTop: 10 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Wala kay nakaschedule nga mga reminders.</Text>
            }
          />
        )}
      </View>

      {/* Add Reminder Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Reminder ({selectedDate})</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0E2417" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Bill Name / Title</Text>
            <TextInput style={styles.input} placeholder="e.g. Electric Bill, Internet" value={title} onChangeText={setTitle} />

            <Text style={styles.label}>Amount (₱)</Text>
            <TextInput style={styles.input} placeholder="0.00" keyboardType="numeric" value={amount} onChangeText={setAmount} />

            <Text style={styles.label}>Link to Budget Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, selectedCategoryId === cat.id && styles.categoryChipSelected]}
                  onPress={() => setSelectedCategoryId(cat.id)}
                >
                  <Text style={[styles.chipText, selectedCategoryId === cat.id && styles.chipTextSelected]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveReminder} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Reminder</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9' },
  headerBackground: { backgroundColor: '#0E2417', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 45 : 20, paddingBottom: 25, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtext: { fontSize: 13, color: '#A3B8AD', marginTop: 4 },
  calendarWrapper: { backgroundColor: '#FFFFFF', margin: 15, borderRadius: 16, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0E2417', marginBottom: 5 },
  reminderCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EBEFEF' },
  reminderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  categoryIndicator: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  indicatorText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  reminderTitle: { fontSize: 14, fontWeight: '600', color: '#0E2417' },
  reminderSub: { fontSize: 12, color: '#8A9A91', marginTop: 2 },
  payBtn: { backgroundColor: '#0E2417', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  payBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10 },
  paidText: { color: '#0CD964', fontSize: 12, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#8A9A91', marginTop: 30, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0E2417' },
  label: { fontSize: 13, fontWeight: '600', color: '#557261', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#EBEFEF', padding: 12, borderRadius: 10, marginBottom: 15, backgroundColor: '#F8FAF9', fontSize: 15 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  categoryChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#EBF7F1', borderWidth: 1, borderColor: '#D0E8DD' },
  categoryChipSelected: { backgroundColor: '#0E2417', borderColor: '#0E2417' },
  chipText: { fontSize: 12, color: '#213502' },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  saveBtn: { backgroundColor: '#0E2417', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});