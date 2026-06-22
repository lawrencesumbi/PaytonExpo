// app/create-allowance.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateAllowanceScreen() {
  const [selectedSpender, setSelectedSpender] = useState('Lawrence Sumbi');
  const [allowanceName, setAllowanceName] = useState('March 10-20');
  const [amount, setAmount] = useState('1000');

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const selectedDays = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  const handleCreateAllowance = () => {
    Alert.alert(
      'Success',
      `Allowance "${allowanceName}" created for ${selectedSpender} with amount ₱${amount}`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Allowance</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Select Spender */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>SELECT SPENDER</Text>
          <TouchableOpacity style={styles.selectButton}>
            <Text style={styles.selectButtonText}>{selectedSpender}</Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Allowance Name */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>ALLOWANCE NAME</Text>
          <TextInput
            style={styles.input}
            value={allowanceName}
            onChangeText={setAllowanceName}
            placeholder="Enter allowance name"
            placeholderTextColor="#9CA3AF"
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
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>

        {/* Timeline Range */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>TIMELINE RANGE</Text>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarMonth}>March 2026</Text>
            </View>
            <View style={styles.weekDays}>
              {days.map((day) => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>
            <View style={styles.daysGrid}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const isSelected = selectedDays.includes(day);
                const isStart = day === 10;
                const isEnd = day === 20;
                return (
                  <View
                    key={day}
                    style={[
                      styles.dayCell,
                      isSelected && styles.selectedDay,
                      isStart && styles.startDay,
                      isEnd && styles.endDay,
                    ]}
                  >
                    <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{day}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.selectedRange}>
              <Text style={styles.rangeText}>Tue Mar 10 2026 - Fri Mar 20 2026</Text>
              <TouchableOpacity>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity style={styles.createButton} onPress={handleCreateAllowance}>
          <Text style={styles.createButtonText}>Create Allowance</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectButtonText: {
    fontSize: 15,
    color: '#1F2937',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calendarHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: '#6B7280',
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
    color: '#1F2937',
  },
  selectedDay: {
    backgroundColor: '#2D7A5E',
  },
  startDay: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  endDay: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
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
    borderTopColor: '#F3F4F6',
  },
  rangeText: {
    fontSize: 13,
    color: '#1F2937',
  },
  clearText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: '#2D7A5E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});