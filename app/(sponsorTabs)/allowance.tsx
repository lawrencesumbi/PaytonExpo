// app/(sponsorTabs)/allowance.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StatusBar as NativeStatusBar,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function AllowanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const allowanceId = params.id as string;

  // State para sa Spender Selection
  const [selectedSpender, setSelectedSpender] = useState<{ id: string, name: string, email: string } | null>(null);
  const [allowanceName, setAllowanceName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // 2. State para sa refreshing animation

  // Custom Date States
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  const now = new Date();
  const autoStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const autoEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  // Sync params to state
  useEffect(() => {
    if (params.spenderId) {
      setSelectedSpender({
        id: params.spenderId as string,
        name: params.spenderName as string,
        email: params.spenderEmail as string
      });
    }
  }, [params.spenderId, params.spenderName, params.spenderEmail]);

  // Fetch data kung naa'y ID (Edit mode)
  useEffect(() => {
    if (allowanceId) {
      fetchAllowanceDetails();
    }
  }, [allowanceId]);

  const fetchAllowanceDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('allowances')
        .select('*')
        .eq('id', allowanceId)
        .single();

      if (error) throw error;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.spender_id)
        .single();

      setAllowanceName(data.allowance_name);
      setAmount(data.amount.toString());
      setStartDate(data.start_date);
      setEndDate(data.end_date);
      setIsCustomDate(true);
      setSelectedSpender({
        id: data.spender_id,
        name: profileData?.full_name || 'Member',
        email: ''
      });
    } catch (e: any) {
      Alert.alert("Error", "Dili ma-load ang detalye: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Function nga mo-reset sa tanan balik sa uno inig scroll up (pull-to-refresh)
  // 3. Function nga mo-reset sa tanan balik sa uno inig scroll up (pull-to-refresh)
  const onRefresh = async () => {
    setRefreshing(true);
    
    // I-clear ang 'id' ug uban pang params sa URL aron mapapasa ang Edit Mode
    router.setParams({ 
      id: '', 
      spenderId: '', 
      spenderName: '', 
      spenderEmail: '' 
    });

    // I-reset ang tanang input fields ug states balik sa uno
    setAllowanceName('');
    setAmount('');
    setSelectedSpender(null);
    setIsCustomDate(false);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');

    // Dili na nato tawgon ang fetchAllowanceDetails() kay Set Allowance na man atong gusto

    setRefreshing(false);
  };

  const handleSaveAllowance = async () => {
    if (!selectedSpender) {
      Alert.alert("Member Required", "Please select a member first.");
      return;
    }
    if (!allowanceName.trim() || !amount.trim()) {
      Alert.alert("Required Fields", "Please provide a name and amount.");
      return;
    }

    const finalStart = isCustomDate ? startDate : autoStart;
    const finalEnd = isCustomDate ? endDate : autoEnd;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (allowanceId) {
        const { error } = await supabase
          .from('allowances')
          .update({
            allowance_name: allowanceName,
            amount: parseFloat(amount),
            start_date: finalStart,
            end_date: finalEnd
          })
          .eq('id', allowanceId);
        if (error) throw error;
        Alert.alert("Success 🎉", "Allowance updated successfully!");
      } else {
        const { error } = await supabase.from('allowances').insert([{
          sponsor_id: user.id,
          spender_id: selectedSpender.id,
          allowance_name: allowanceName,
          amount: parseFloat(amount),
          start_date: finalStart,
          end_date: finalEnd
        }]);
        if (error) throw error;
        Alert.alert("Success 🎉", "Allowance allocated successfully!");
      }
      router.back();
    } catch (e: any) { 
      Alert.alert("Error", e.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={styles.content}
        // 4. Gidugang ang RefreshControl dinhi sa ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#3AA39F']} // Android spinner color
            tintColor="#3AA39F"  // iOS spinner color
          />
        }
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={16} color="#475569" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>{allowanceId ? 'Edit Allowance' : 'Set Allowance'}</Text>
          
          {selectedSpender ? (
            <View style={styles.selectedSpenderCard}>
              <View style={{flex: 1}}>
                <Text style={styles.headerSubtitle}>Allocating budget for:</Text>
                <Text style={styles.spenderName}>{selectedSpender.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedSpender(null)} style={styles.removeButton}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectMemberButton}
              onPress={() => router.push('/(sponsorTabs)/members')}
            >
              <Ionicons name="add-circle" size={20} color="#3AA39F" />
              <Text style={styles.selectMemberText}>Select a Member to allocate</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Allowance Name</Text>
            <TextInput style={styles.input} value={allowanceName} onChangeText={setAllowanceName} placeholder="e.g. January Allowance" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (PHP)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} placeholder="0.00" />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Coverage Period</Text>
              <View style={styles.row}>
                <Text style={styles.switchLabel}>Custom</Text>
                <Switch value={isCustomDate} onValueChange={setIsCustomDate} trackColor={{ true: '#3AA39F' }} />
              </View>
            </View>
            {isCustomDate ? (
              <View style={styles.customDateContainer}>
                <TextInput style={styles.input} placeholder="Start (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />
                <TextInput style={styles.input} placeholder="End (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} />
              </View>
            ) : (
              <View style={styles.dateDisplay}>
                <Ionicons name="calendar" size={18} color="#3AA39F" />
                <Text style={styles.dateText}>{now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveAllowance} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>{allowanceId ? 'Update Allocation' : 'Confirm Allocation'}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFD', paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0 },
  content: { padding: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  backButtonText: { fontWeight: '600', color: '#64748B' },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  headerSubtitle: { color: '#64748B', marginTop: 4, fontSize: 12 },
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  label: { fontSize: 12, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' },
  input: { backgroundColor: '#FFF', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', height: 48 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontSize: 12, color: '#64748B' },
  selectMemberButton: { flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 16, backgroundColor: '#F1F5F9', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },
  selectMemberText: { color: '#3AA39F', fontWeight: '600', marginLeft: 8 },
  selectedSpenderCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  spenderName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 2 },
  removeButton: { padding: 4 },
  customDateContainer: { gap: 10 },
  dateDisplay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF6F5', padding: 14, borderRadius: 14, gap: 10, borderWidth: 1, borderColor: '#D1ECEB' },
  dateText: { fontSize: 14, fontWeight: '600', color: '#3AA39F' },
  saveButton: { backgroundColor: '#3AA39F', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#FFF', fontWeight: '700' }
});