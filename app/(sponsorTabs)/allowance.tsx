// app/allowance.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function AllowanceScreen() {
  const router = useRouter();
  const { spenderId, spenderName, spenderEmail } = useLocalSearchParams();

  const [allowanceName, setAllowanceName] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); 
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveAllowance = async () => {
    if (!allowanceName.trim() || !amount.trim() || !startDate.trim() || !endDate.trim()) {
      Alert.alert("Ops!", "Palihog og sulod sa tanang gikinahanglan nga fields.");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Sayop nga Amount", "Siguroha nga saktong numero ug mas dako sa 0.");
      return;
    }

    try {
      setLoading(true);
      const { data: { user: currentSponsor } } = await supabase.auth.getUser();
      if (!currentSponsor) return;

      const { error } = await supabase
        .from('allowances')
        .insert([
          {
            sponsor_id: currentSponsor.id,
            spender_id: spenderId,
            allowance_name: allowanceName.trim(),
            amount: numericAmount,
            start_date: startDate,
            end_date: endDate
          }
        ]);

      if (error) throw error;

      Alert.alert("Success 🎉", `Allowance para kang ${spenderName} na-save na!`);
      router.back(); 
    } catch (error: any) {
      Alert.alert("Database Error ❌", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#213502" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Set Allowance</Text>
          <Text style={styles.headerSubtitle}>Nagbutang ka og allowance para kang:</Text>
          <View style={styles.spenderCard}>
            <Text style={styles.spenderName}>{spenderName}</Text>
            <Text style={styles.spenderEmail}>{spenderEmail}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Allowance Name</Text>
            <TextInput style={styles.input} placeholder="e.g., Weekly Baon" placeholderTextColor="#7DA08E" value={allowanceName} onChangeText={setAllowanceName} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (PHP)</Text>
            <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#7DA08E" keyboardType="numeric" value={amount} onChangeText={setAmount} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Date</Text>
            <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>End Date</Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#7DA08E" value={endDate} onChangeText={setEndDate} />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveAllowance} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveButtonText}>Save Allowance</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 20 },
  backButton: { marginBottom: 15, marginTop: Platform.OS === 'android' ? 15 : 0 },
  header: { marginBottom: 25 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#213502' },
  headerSubtitle: { fontSize: 14, color: '#557261', marginTop: 4 },
  spenderCard: { backgroundColor: '#F4F7F5', padding: 14, borderRadius: 10, marginTop: 12, borderWidth: 1, borderColor: '#E2E8E4' },
  spenderName: { fontSize: 16, fontWeight: '600', color: '#213502' },
  spenderEmail: { fontSize: 12, color: '#557261', marginTop: 2 },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#213502' },
  input: { backgroundColor: '#F4F7F5', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, fontSize: 14, borderWidth: 1, borderColor: '#7DA08E', color: '#213502' },
  saveButton: { backgroundColor: '#0CD964', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10, height: 50, justifyContent: 'center' },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});