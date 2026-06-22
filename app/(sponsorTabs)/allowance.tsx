 // app/(sponsorTabs)/allowance.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AllowanceItem = {
  id: string;
  reference: string;
  period: string;
  spender: string;
  status: string;
  amount: string;
};

type NewAllowance = {
  spender: string;
  name: string;
  amount: string;
  startDate: string;
  endDate: string;
};

const initialAllowanceData: AllowanceItem[] = [
  {
    id: '1',
    reference: 'March 1-31',
    period: 'Mar 01 — Mar 31, 2026',
    spender: 'King James',
    status: 'Active',
    amount: '₱10,000.00',
  },
  {
    id: '2',
    reference: 'March 10-20',
    period: 'Mar 10 — Mar 20, 2026',
    spender: 'Lawrence Sumbi',
    status: 'Active',
    amount: '₱1,000.00',
  },
];

const spenderOptions = ['King James', 'Lawrence Sumbi', 'Maria Santos', 'John Doe'];

export default function AllowanceScreen() {
  const [allowanceData, setAllowanceData] = useState<AllowanceItem[]>(initialAllowanceData);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSpender, setSelectedSpender] = useState('Lawrence Sumbi');
  const [allowanceName, setAllowanceName] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showSpenderDropdown, setShowSpenderDropdown] = useState(false);

  // Calendar state
  const [selectedMonth, setSelectedMonth] = useState(3); // March
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const handleDaySelect = (day: number) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day].sort((a, b) => a - b);
      }
    });
  };

  const getMonthDays = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const handleCreateAllowance = () => {
    if (!allowanceName || !amount || selectedDays.length === 0) {
      Alert.alert('Error', 'Please fill in all fields and select dates.');
      return;
    }

    const startDay = Math.min(...selectedDays);
    const endDay = Math.max(...selectedDays);
    const monthName = monthNames[selectedMonth - 1];
    
    const newAllowance: AllowanceItem = {
      id: Date.now().toString(),
      reference: `${monthName} ${startDay}-${endDay}`,
      period: `${monthName.slice(0, 3)} ${startDay} — ${monthName.slice(0, 3)} ${endDay}, ${selectedYear}`,
      spender: selectedSpender,
      status: 'Active',
      amount: `₱${parseFloat(amount).toLocaleString()}.00`,
    };

    setAllowanceData([newAllowance, ...allowanceData]);
    setModalVisible(false);
    resetForm();
    
    Alert.alert('Success', `Allowance "${allowanceName}" created successfully!`);
  };

  const resetForm = () => {
    setAllowanceName('');
    setAmount('');
    setSelectedDays([]);
    setSelectedSpender('Lawrence Sumbi');
  };

  const renderAllowanceItem = ({ item }: { item: AllowanceItem }) => (
    <TouchableOpacity 
      style={styles.allowanceCard}
      onPress={() => router.push('/(sponsorTabs)/monitoring')}
    >
      <View style={styles.allowanceHeader}>
        <View>
          <Text style={styles.referenceText}>{item.reference}</Text>
          <Text style={styles.periodText}>{item.period}</Text>
        </View>
        <View style={styles.activeBadge}>
          <Text style={styles.activeText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.allowanceFooter}>
        <View style={styles.spenderContainer}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{item.spender.charAt(0)}</Text>
          </View>
          <Text style={styles.spenderText}>{item.spender}</Text>
        </View>
        <Text style={styles.amountText}>{item.amount}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Allowance Overview</Text>
            <Text style={styles.headerSubtitle}>Tracking all active allowance.</Text>
          </View>
          <TouchableOpacity style={styles.filterIcon}>
            <Ionicons name="options-outline" size={24} color="#213502" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>Current Allowance</Text>
          <Text style={styles.statCardValue}>₱11,000.00</Text>
        </View>
        <LinearGradient
          colors={['#0CD964', '#213502']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statCard, styles.statCardHighlight]}
        >
          <Text style={[styles.statCardLabel, { color: 'rgba(255,255,255,0.8)' }]}>Total Spent</Text>
          <Text style={[styles.statCardValue, { color: '#FFFFFF' }]}>₱1,500.00</Text>
        </LinearGradient>
      </View>

      <FlatList
        data={allowanceData}
        renderItem={renderAllowanceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#213502" />
      </TouchableOpacity>

      {/* Create Allowance Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Allowance</Text>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                resetForm();
              }}>
                <Ionicons name="close" size={24} color="#213502" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Select Spender */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>SELECT SPENDER</Text>
                <TouchableOpacity 
                  style={styles.selectButton}
                  onPress={() => setShowSpenderDropdown(!showSpenderDropdown)}
                >
                  <Text style={styles.selectButtonText}>{selectedSpender}</Text>
                  <Ionicons name="chevron-down" size={20} color="#7DA08E" />
                </TouchableOpacity>
                {showSpenderDropdown && (
                  <View style={styles.dropdownContainer}>
                    {spenderOptions.map((spender) => (
                      <TouchableOpacity
                        key={spender}
                        style={[
                          styles.dropdownItem,
                          selectedSpender === spender && styles.dropdownItemActive
                        ]}
                        onPress={() => {
                          setSelectedSpender(spender);
                          setShowSpenderDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          selectedSpender === spender && styles.dropdownItemTextActive
                        ]}>
                          {spender}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Allowance Name */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>ALLOWANCE NAME</Text>
                <TextInput
                  style={styles.input}
                  value={allowanceName}
                  onChangeText={setAllowanceName}
                  placeholder="Enter allowance name"
                  placeholderTextColor="#7DA08E"
                />
              </View>

              {/* Amount */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>AMOUNT</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0"
                  placeholderTextColor="#7DA08E"
                  keyboardType="numeric"
                />
              </View>

              {/* Timeline Range */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>TIMELINE RANGE</Text>
                <View style={styles.calendarContainer}>
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={() => {
                      if (selectedMonth > 1) setSelectedMonth(selectedMonth - 1);
                      else { setSelectedMonth(12); setSelectedYear(selectedYear - 1); }
                    }}>
                      <Ionicons name="chevron-back" size={20} color="#213502" />
                    </TouchableOpacity>
                    <Text style={styles.calendarMonth}>
                      {monthNames[selectedMonth - 1]} {selectedYear}
                    </Text>
                    <TouchableOpacity onPress={() => {
                      if (selectedMonth < 12) setSelectedMonth(selectedMonth + 1);
                      else { setSelectedMonth(1); setSelectedYear(selectedYear + 1); }
                    }}>
                      <Ionicons name="chevron-forward" size={20} color="#213502" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.weekDays}>
                    {days.map((day) => (
                      <Text key={day} style={styles.weekDay}>{day}</Text>
                    ))}
                  </View>

                  <View style={styles.daysGrid}>
                    {Array.from({ length: getFirstDayOfMonth(selectedMonth, selectedYear) }, (_, i) => (
                      <View key={`empty-${i}`} style={styles.dayCell} />
                    ))}
                    {Array.from({ length: getMonthDays(selectedMonth, selectedYear) }, (_, i) => {
                      const day = i + 1;
                      const isSelected = selectedDays.includes(day);
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.dayCell,
                            isSelected && styles.selectedDay
                          ]}
                          onPress={() => handleDaySelect(day)}
                        >
                          <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{day}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {selectedDays.length > 0 && (
                    <View style={styles.selectedRange}>
                      <Text style={styles.rangeText}>
                        {monthNames[selectedMonth - 1]} {Math.min(...selectedDays)} — {Math.max(...selectedDays)}
                      </Text>
                      <TouchableOpacity onPress={() => setSelectedDays([])}>
                        <Text style={styles.clearText}>Clear</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {/* Create Button */}
              <TouchableOpacity style={styles.createButton} onPress={handleCreateAllowance}>
                <Text style={styles.createButtonText}>Create Allowance</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F6',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#213502',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7DA08E',
    marginTop: 2,
  },
  filterIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardHighlight: {
    backgroundColor: '#0CD964',
  },
  statCardLabel: {
    fontSize: 12,
    color: '#7DA08E',
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#213502',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  allowanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  allowanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  referenceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#213502',
  },
  periodText: {
    fontSize: 13,
    color: '#7DA08E',
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#065F46',
  },
  allowanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  spenderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7DA08E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  spenderText: {
    fontSize: 14,
    color: '#213502',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0CD964',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#0CD964',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#213502',
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7DA08E',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectButtonText: {
    fontSize: 15,
    color: '#213502',
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownItemActive: {
    backgroundColor: '#E8F5E9',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#213502',
  },
  dropdownItemTextActive: {
    color: '#0CD964',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#213502',
  },
  calendarContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#213502',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#7DA08E',
    fontWeight: '500',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    color: '#213502',
  },
  selectedDay: {
    backgroundColor: '#0CD964',
    borderRadius: 8,
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  rangeText: {
    fontSize: 13,
    color: '#213502',
  },
  clearText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: '#0CD964',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  createButtonText: {
    color: '#213502',
    fontSize: 16,
    fontWeight: '600',
  },
});