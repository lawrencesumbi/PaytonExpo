import { supabase } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

// I-define ang type para sa matag Reminder row
interface Reminder {
  id: string;
  title: string;
  amount: number;
  due_date: string;
  category: string;
  notes: string | null;
  status: string;
}

export default function RemindersScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Form States
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Utilities');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. I-fetch ang data gikan sa Supabase sa pag-load sa screen
  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setRefreshing(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) throw new Error('Walay active user session.');

      // I-query ang reminders gikan sa Supabase ordered pinaagi sa pinakaduol nga due_date
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error: any) {
      console.error('Error fetching reminders:', error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDayPress = (day: DateData) => {
    // Kung gi-click na daan ang parehas nga petsa, i-unselect kini aron mapakita ang tanang reminders
    if (selectedDate === day.dateString) {
      setSelectedDate('');
    } else {
      setSelectedDate(day.dateString);
      setIsModalVisible(true);
    }
  };

  const handleSaveReminder = async () => {
    if (!title || !amount) {
      Alert.alert('Oops!', 'Palihog butangi og Title ug Amount.');
      return;
    }

    setLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) throw new Error('Walay active user session.');

      const { error } = await supabase.from('reminders').insert([
        {
          user_id: session.user.id,
          title,
          amount: parseFloat(amount),
          due_date: selectedDate,
          category,
          notes,
          status: 'unpaid'
        },
      ]);

      if (error) throw error;

      Alert.alert('Success', 'Ang imong reminder malampusong na-save!');
      
      // I-reset ang form fields ug i-refresh ang listahan
      setTitle('');
      setAmount('');
      setCategory('Utilities');
      setNotes('');
      setIsModalVisible(false);
      fetchReminders(); // Awtomatiko nga i-load ang bag-ong data

    } catch (error: any) {
      Alert.alert('Error saving reminder', error.message || 'Naay sayop nga nahitabo.');
    } finally {
      setLoading(false);
    }
  };

  // 2. I-prepare ang marked dates para sa Calendar dots UI
  const getMarkedDates = () => {
    const marked: any = {};
    
    // Butangan og dots ang mga adlaw nga naay sulod nga bayranon
    reminders.forEach((rem) => {
      marked[rem.due_date] = {
        marked: true,
        dotColor: '#10b981', // Berde nga tuldok
      };
    });

    // Kon naay gi-select nga petsa ang user, i-highlight sad ang tibuok adlaw
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        disableTouchEvent: true,
        selectedColor: '#15803d',
      };
    }

    return marked;
  };

  // 3. I-filter ang listahan sa reminders kon naay gi-select nga adlaw
  const filteredReminders = selectedDate
    ? reminders.filter((rem) => rem.due_date === selectedDate)
    : reminders;

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.mainHeading}>Mga Bayranon & Reminders</Text>

      {/* Calendar Grid Container */}
      <View style={styles.calendarWrapper}>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={getMarkedDates()}
          theme={{
            calendarBackground: 'transparent',
            textSectionTitleColor: '#64748b',
            selectedDayBackgroundColor: '#15803d',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#15803d',
            dayTextColor: '#334155',
            textDisabledColor: '#cbd5e1',
            arrowColor: '#15803d',
            monthTextColor: '#0f172a',
            indicatorColor: '#15803d',
            textDayFontWeight: '500',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: 'bold',
          }}
        />
      </View>

      {/* DYNAMIC LIST VIEW SA MGA FETCHED DATA */}
      <View style={styles.listSectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedDate ? `Mga Bayranon sa ${selectedDate}` : 'Tanan nga Umaabot nga Bayranon'}
        </Text>
        {selectedDate !== '' && (
          <TouchableOpacity onPress={() => setSelectedDate('')}>
            <Text style={styles.clearFilterText}>I-pakita Tanan</Text>
          </TouchableOpacity>
        )}
      </View>

      {refreshing ? (
        <ActivityIndicator size="large" color="#15803d" style={{ marginTop: 20 }} />
      ) : filteredReminders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Walay nakit-an nga bayranon.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.remindersList}>
          {filteredReminders.map((item) => (
            <View key={item.id} style={styles.reminderCard}>
              <View style={styles.cardLeft}>
                <View style={styles.categoryIconPlaceholder}>
                  <Text style={styles.iconText}>₱</Text>
                </View>
                <View style={styles.cardDetails}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>Due: {item.due_date} • {item.category}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardAmount}>₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                <View style={[styles.statusBadge, item.status === 'paid' ? styles.statusPaid : styles.statusUnpaid]}>
                  <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* FORM OVERLAY POPUP */}
      {isModalVisible && (
        <View style={styles.overlayContainer}>
          <View style={styles.formContainer}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              
              <View style={styles.formHeader}>
                <View>
                  <Text style={styles.headerTitle}>Bag-ong Reminder</Text>
                  <Text style={styles.headerSubtitle}>Petsa: {selectedDate}</Text>
                </View>
                <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Ngalan sa Bayranon</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Kuryente (Veco), Netflix"
                placeholderTextColor="#a7f3d0"
                style={styles.textInput}
              />

              <Text style={styles.inputLabel}>Kantidad (₱)</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#a7f3d0"
                keyboardType="numeric"
                style={styles.textInput}
              />

              <Text style={styles.inputLabel}>Kategorya</Text>
              <View style={styles.categoryContainer}>
                {['Utilities', 'Subscription', 'Loan', 'Food', 'Others'].map((cat) => {
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

              <Text style={styles.inputLabel}>Dugang Nota (Optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Ibutang ang dugang detalye dri..."
                placeholderTextColor="#a7f3d0"
                multiline
                numberOfLines={3}
                style={styles.textAreaInput}
              />

              <TouchableOpacity
                onPress={handleSaveReminder}
                disabled={loading}
                style={[styles.saveButton, loading && { opacity: 0.6 }]}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Gi-save pa...' : 'I-save ang Reminder'}
                </Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    position: 'relative',
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    marginTop: 24,
  },
  calendarWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
  },
  listSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
  },
  clearFilterText: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '600',
  },
  remindersList: {
    flex: 1,
  },
  reminderCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconPlaceholder: {
    backgroundColor: '#f1f5f9',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    color: '#15803d',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardDetails: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  statusPaid: {
    backgroundColor: '#d1fae5',
  },
  statusUnpaid: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
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
    zIndex: 50,
  },
  formContainer: {
    backgroundColor: '#022c22',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '82%',
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
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#064e3b',
    color: '#ffffff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#0f766e',
    fontSize: 16,
  },
  textAreaInput: {
    backgroundColor: '#064e3b',
    color: '#ffffff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#0f766e',
    fontSize: 16,
    height: 90,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
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