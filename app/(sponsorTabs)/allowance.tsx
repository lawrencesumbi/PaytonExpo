// app/allowance.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StatusBar as NativeStatusBar,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity, // Gidugang para sa Android height calculation
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
      Alert.alert("Required Fields", "Please populate all mandatory fields to distribute this allowance.");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Invalid Amount", "Please input a valid numeric value greater than 0.");
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

      Alert.alert("Success 🎉", `Allowance allocation for ${spenderName} saved successfully!`);
      router.back(); 
    } catch (error: any) {
      Alert.alert("Database Error ❌", error.message || "Failed to commit record changes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Gi-force ang icons sa top system bar nga magpabiling dark ug makita */}
      <StatusBar style="dark" />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Navigation Layer */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <View style={styles.backButtonCircle}>
            <Ionicons name="arrow-back" size={16} color="#475569" />
          </View>
          <Text style={styles.backButtonText}>Cancel</Text>
        </TouchableOpacity>

        {/* Dynamic Context Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Set Allowance</Text>
          <Text style={styles.headerSubtitle}>Configure and allocate budget structures for your dependent:</Text>
          
          <View style={styles.spenderCard}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person-outline" size={16} color="#3AA39F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.spenderName}>{spenderName || 'Unknown Recipient'}</Text>
              <Text style={styles.spenderEmail} numberOfLines={1}>{spenderEmail || 'No verified email link'}</Text>
            </View>
          </View>
        </View>

        {/* Form Inputs Container */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Allowance Label</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g., Weekly Transportation & Meals" 
              placeholderTextColor="#94A3B8" 
              value={allowanceName} 
              onChangeText={setAllowanceName} 
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Allocation Budget (PHP)</Text>
            <View style={styles.currencyInputWrapper}>
              <Text style={styles.currencySymbol}>₱</Text>
              <TextInput 
                style={[styles.input, { paddingLeft: 34 }]} 
                placeholder="0.00" 
                placeholderTextColor="#94A3B8" 
                keyboardType="numeric" 
                value={amount} 
                onChangeText={setAmount} 
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Activation Effective Date</Text>
            <TextInput 
              style={styles.input} 
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
              value={startDate} 
              onChangeText={setStartDate} 
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Expiration Settlement Date</Text>
            <TextInput 
              style={styles.input} 
              placeholder="YYYY-MM-DD" 
              placeholderTextColor="#94A3B8" 
              value={endDate} 
              onChangeText={setEndDate} 
            />
          </View>

          {/* Core Action Call-To-Action Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveAllowance} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Confirm & Authorize Budget</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FAFBFD',
    // FIXED: Gi-inject ang system bar spacing para sa Android para protektado sa overlap sa taas
    paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0 
  },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  
  backButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 20, 
    marginTop: 12, // Gi-normalize ang top margin alang sa layout spacing
    alignSelf: 'flex-start' 
  },
  backButtonCircle: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  backButtonText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 },
  
  spenderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, marginTop: 14, borderWidth: 1, borderColor: '#F1F5F9' },
  avatarCircle: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EBF6F5', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#D1ECEB' },
  spenderName: { fontSize: 15, fontWeight: '600', color: '#1E293B', letterSpacing: -0.2 },
  spenderEmail: { fontSize: 12, color: '#64748B', marginTop: 1 },
  
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  label: { fontSize: 12, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.3, paddingLeft: 2 },
  currencyInputWrapper: { position: 'relative', justifyContent: 'center' },
  currencySymbol: { position: 'absolute', left: 14, zIndex: 10, fontSize: 14, fontWeight: '600', color: '#1E293B' },
  
  input: { backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, fontSize: 14, fontWeight: '500', borderWidth: 1, borderColor: '#E2E8F0', color: '#1E293B', height: 48 },
  
  saveButton: { backgroundColor: '#3AA39F', padding: 14, borderRadius: 16, alignItems: 'center', marginTop: 12, height: 50, justifyContent: 'center', shadowColor: '#3AA39F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, letterSpacing: -0.1 }
});