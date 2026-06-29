import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [categories, setCategories] = useState<CategorySelect[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  
  // Expandable toggle configuration states
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic Current Week Range Engine
  const getCurrentWeeklyDays = () => {
    const current = new Date(); 
    const dayOfWeek = current.getDay();
    
    const startOfWeek = new Date(current);
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(current.getDate() + distanceToMonday);

    const days = [];
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(startOfWeek);
      nextDay.setDate(startOfWeek.getDate() + i);
      const dateString = nextDay.toISOString().split('T')[0];
      days.push({
        dateString,
        dayNum: nextDay.getDate(),
        label: dayLabels[i],
      });
    }
    return days;
  };

  const weeklyDays = getCurrentWeeklyDays();

  const getHeaderMonthYear = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const fetchRemindersAndCategories = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: catData } = await supabase
        .from('categories')
        .select('id, name')
        .or(`user_id.is.null,user_id.eq.${user.id}`);
      
      if (catData) setCategories(catData);

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

  const handleFullCalendarDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    setShowFullCalendar(false); 
    setModalVisible(true);      
  };

  const handleWeeklyStripDayPress = (dateString: string) => {
    setSelectedDate(dateString);
    setModalVisible(true);      
  };

  const handleSaveReminder = async () => {
    if (!title || !amount || !selectedCategoryId || !selectedDate) {
      Alert.alert('Missing Fields', 'Please complete all fields to save this reminder.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please input a valid positive amount.');
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

      Alert.alert('Success 🎉', 'Reminder created successfully!');
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
      `Mark "${reminder.title}" (₱${reminder.amount.toFixed(2)}) as paid? This will deduct the amount from your remaining budget.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Bill',
          onPress: async () => {
            try {
              setLoading(true);
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { data: budget, error: budgetError } = await supabase
                .from('budgets')
                .select('id, remaining_amount')
                .eq('user_id', user.id)
                .eq('category_id', reminder.category_id)
                .maybeSingle();

              if (budgetError) throw budgetError;

              if (!budget) {
                Alert.alert('Missing Budget', 'You do not have a budget configured for this category yet.');
                setLoading(false);
                return;
              }

              if (Number(budget.remaining_amount) < reminder.amount) {
                Alert.alert('Insufficient Funds', `Your remaining category budget is only ₱${Number(budget.remaining_amount).toFixed(2)}.`);
                setLoading(false);
                return;
              }

              const newRemaining = Number(budget.remaining_amount) - reminder.amount;
              const { error: updateBudgetError } = await supabase
                .from('budgets')
                .update({ remaining_amount: newRemaining })
                .eq('id', budget.id);

              if (updateBudgetError) throw updateBudgetError;

              const { error: expenseError } = await supabase
                .from('expenses').insert({
                  budget_id: budget.id,
                  description: `Paid Bill: ${reminder.title}`,
                  amount: reminder.amount,
                  spent_at: new Date().toISOString()
                });

              if (expenseError) throw expenseError;

              const { error: updateRemError } = await supabase
                .from('reminders')
                .update({ status: 'paid' })
                .eq('id', reminder.id);

              if (updateRemError) throw updateRemError;

              Alert.alert('Payment Logged 🎉', 'Bill paid and deducted from your budget category.');
              fetchRemindersAndCategories();
            } catch (error: any) {
              Alert.alert('Transaction Error', error.message);
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
        <View style={[styles.categoryIndicator, { backgroundColor: item.categories?.color || '#10B981' }]}>
          <Text style={styles.indicatorText}>{item.categories?.name.substring(0, 2).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reminderTitle}>{item.title}</Text>
          <Text style={styles.reminderSub}>₱{item.amount.toFixed(2)}</Text>
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
      <StatusBar style="dark" />
      
      <View style={styles.calendarContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>{getHeaderMonthYear(selectedDate)}</Text>
          
          <TouchableOpacity 
            style={[styles.iconButton, showFullCalendar && styles.iconButtonActive]} 
            onPress={() => setShowFullCalendar(!showFullCalendar)}
          >
            <Ionicons name="calendar" size={20} color={showFullCalendar ? "#10B981" : "#0F172A"} />
          </TouchableOpacity>
        </View>

        {showFullCalendar ? (
          <View style={styles.fullCalendarWrapper}>
            <Calendar
              onDayPress={handleFullCalendarDayPress} 
              current={selectedDate}
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
                dayTextColor: '#0F172A',
                arrowColor: '#0F172A',
                monthTextColor: '#0F172A',
                indicatorColor: '#10B981',
              }}
            />
          </View>
        ) : (
          <View style={styles.weeklyStrip}>
            {weeklyDays.map((day) => {
              const isSelected = day.dateString === selectedDate;
              const hasEvent = markedDates[day.dateString]?.marked;
              return (
                <TouchableOpacity 
                  key={day.dateString} 
                  style={[styles.dayColumn, isSelected && styles.dayColumnSelected]}
                  onPress={() => handleWeeklyStripDayPress(day.dateString)} 
                >
                  <Text style={[styles.dayLabel, isSelected && styles.textSelectedActive]}>{day.label}</Text>
                  <View style={styles.dayNumWrapper}>
                    {hasEvent && <View style={[styles.dotIndicator, { backgroundColor: markedDates[day.dateString].dotColor }]} />}
                    <Text style={[styles.dayNum, isSelected && styles.textSelectedActive]}>{day.dayNum}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        
        <View style={styles.notchDecorator} />
      </View>

      <View style={styles.feedWrapper}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          
          {/* LABELS AND ICONS CHANGED ONLY - LOGIC UNTOUCHED */}
          <TouchableOpacity style={styles.addBillBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="filter" size={16} color="#64748B" />
            <Text style={styles.addBillText}>Filter By</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centeredLoader}>
            <ActivityIndicator size="small" color="#10B981" />
          </View>
        ) : (
          <FlatList
            data={reminders.filter(r => r.due_date === selectedDate)}
            keyExtractor={(item) => item.id}
            renderItem={renderReminderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListPadding}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-clear-outline" size={32} color="#CBD5E1" />
                <Text style={styles.emptyText}>No events or bills scheduled for this date.</Text>
              </View>
            }
          />
        )}
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Reminder ({selectedDate})</Text>
              <TouchableOpacity style={styles.closeBtnBox} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Bill Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Electric Bill, Rent" placeholderTextColor="#94A3B8" value={title} onChangeText={setTitle} />

            <Text style={styles.label}>Amount (₱)</Text>
            <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#94A3B8" keyboardType="numeric" value={amount} onChangeText={setAmount} />

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
              {submitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>Create Schedule</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 45 : 15,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconButtonActive: {
    backgroundColor: '#E6F4EA',
    borderColor: '#10B981',
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#0F172A',
  },
  weeklyStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dayColumn: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    width: 44,
  },
  dayColumnSelected: {
    backgroundColor: '#0F172A', 
  },
  dayLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 6,
  },
  dayNumWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  textSelectedActive: {
    color: '#FFFFFF', 
  },
  dotIndicator: {
    position: 'absolute',
    top: -8,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  fullCalendarWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notchDecorator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  feedWrapper: { 
    flex: 1, 
    paddingHorizontal: 20, 
    marginTop: 24 
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addBillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addBillText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  flatListPadding: { 
    paddingBottom: 40 
  },
  centeredLoader: { 
    marginTop: 30, 
    alignItems: 'center' 
  },
  reminderCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reminderLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 14, 
    flex: 1 
  },
  categoryIndicator: { 
    width: 38, 
    height: 38, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  indicatorText: { 
    color: '#FFFFFF', 
    fontSize: 11, 
    fontWeight: '700' 
  },
  reminderTitle: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#0F172A' 
  },
  reminderSub: { 
    fontSize: 13, 
    color: '#64748B', 
    marginTop: 2 
  },
  payBtn: { 
    backgroundColor: '#0F172A', 
    paddingVertical: 8, 
    paddingHorizontal: 14, 
    borderRadius: 10 
  },
  payBtnText: { 
    color: '#FFFFFF', 
    fontSize: 12, 
    fontWeight: '600' 
  },
  paidBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
  },
  paidText: { 
    color: '#10B981', 
    fontSize: 13, 
    fontWeight: '600' 
  },
  emptyContainer: { 
    alignItems: 'center', 
    marginTop: 60, 
    gap: 12 
  },
  emptyText: { 
    textAlign: 'center', 
    color: '#94A3B8', 
    fontSize: 14 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.3)', 
    justifyContent: 'flex-end' 
  },
  modalContainer: { 
    backgroundColor: '#FFFFFF', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 24, 
    maxHeight: '85%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#0F172A', 
  },
  closeBtnBox: { 
    width: 32, 
    height: 32, 
    borderRadius: 10, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  label: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#64748B', 
    marginBottom: 8 
  },
  input: { 
    backgroundColor: '#F8FAFC', 
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14, 
    borderRadius: 12, 
    marginBottom: 16, 
    fontSize: 15, 
    color: '#0F172A' 
  },
  categoryGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    marginBottom: 24 
  },
  categoryChip: { 
    paddingVertical: 8, 
    paddingHorizontal: 14, 
    borderRadius: 20, 
    backgroundColor: '#F1F5F9', 
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  categoryChipSelected: { 
    backgroundColor: '#E6F4EA', 
    borderColor: '#10B981'
  },
  chipText: { 
    fontSize: 12, 
    color: '#64748B', 
    fontWeight: '500' 
  },
  chipTextSelected: { 
    color: '#10B981', 
    fontWeight: '700' 
  },
  saveBtn: { 
    backgroundColor: '#10B981', 
    padding: 16, 
    borderRadius: 14, 
    alignItems: 'center', 
    marginTop: 8,
  },
  saveBtnText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600' 
  }
});