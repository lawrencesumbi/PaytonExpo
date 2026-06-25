// app/(spenderTabs)/split.tsx
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
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../../lib/supabase';

interface Friend {
  id: string;
  full_name: string;
  email: string;
}

interface UserBudget {
  id: string;
  allocated_amount: number;
  remaining_amount: number;
  categories: {
    name: string;
  };
}

interface SplitMember {
  id: string;
  friend_id: string;
  owed_amount: number;
  status: 'unpaid' | 'paid';
  friends: {
    full_name: string;
  };
}

interface ActiveSplit {
  id: string;
  description: string;
  total_amount: number;
  personal_share: number;
  created_at: string;
  split_members: SplitMember[];
}

export default function SplitExpenseScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [budgets, setBudgets] = useState<UserBudget[]>([]);
  const [activeSplits, setActiveSplits] = useState<ActiveSplit[]>([]);
  
  // Transaction Context Capture States
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [selectedBudgetId, setSelectedBudgetId] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  // Settle Modal Interface Layers
  const [settleModalVisible, setSettleModalVisible] = useState(false);
  const [currentSplitToSettle, setCurrentSplitToSettle] = useState<ActiveSplit | null>(null);

  // DATASET SYNCHRONIZATION MATRIX
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Friends Directory
      const { data: friendsData } = await supabase
        .from('friends')
        .select('id, full_name, email')
        .eq('user_id', user.id)
        .order('full_name', { ascending: true });
      if (friendsData) setFriends(friendsData);

      // 2. Fetch Configured Allocations
      const { data: budgetsData } = await supabase
        .from('budgets')
        .select(`id, allocated_amount, remaining_amount, categories ( name )`)
        .eq('user_id', user.id);
      if (budgetsData) setBudgets(budgetsData as any);

      // 3. Fetch Historical Split Indexes
      const { data: splitsData } = await supabase
        .from('split_expenses')
        .select(`
          id, description, total_amount, personal_share, created_at,
          split_members ( id, friend_id, owed_amount, status, friends ( full_name ) )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (splitsData) setActiveSplits(splitsData as unknown as ActiveSplit[]);

    } catch (error: any) {
      console.error('Error compiling asset metrics:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFriendSelection = (id: string) => {
    if (selectedFriendIds.includes(id)) {
      setSelectedFriendIds(selectedFriendIds.filter(fId => fId !== id));
    } else {
      setSelectedFriendIds([...selectedFriendIds, id]);
    }
  };

  // EXECUTE TRANSACTION LEDGER ATOMIC WRITE OPERATIONS
  const handleProcessSplit = async () => {
    const parsedTotal = parseFloat(totalAmount);
    if (!description.trim() || isNaN(parsedTotal) || parsedTotal <= 0 || !selectedBudgetId) {
      Alert.alert('Validation Error', 'Please supply a transaction reason description, valid positive numeric sum value, and corresponding category folder target.');
      return;
    }

    if (selectedFriendIds.length === 0) {
      Alert.alert('Missing Selection', 'Please isolate at least one connected connection friend registry entry node to initialize this ledger division split operation.');
      return;
    }

    const totalPeople = selectedFriendIds.length + 1;
    const shareAmount = parsedTotal / totalPeople;

    const selectedBudget = budgets.find(b => b.id === selectedBudgetId);
    if (!selectedBudget || Number(selectedBudget.remaining_amount) < shareAmount) {
      Alert.alert('Insufficient Allocation', `Your personal obligation calculation totals ₱${shareAmount.toFixed(2)}, but the selected asset folder pool only holds a remaining balance margin of ₱${Number(selectedBudget?.remaining_amount || 0).toFixed(2)}.`);
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Deduct operational ledger balance margins
      const newRemaining = Number(selectedBudget.remaining_amount) - shareAmount;
      const { error: budgetError } = await supabase
        .from('budgets')
        .update({ remaining_amount: newRemaining })
        .eq('id', selectedBudgetId);
      if (budgetError) throw budgetError;

      // 2. Archive baseline single expense structural record
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert({
          budget_id: selectedBudgetId,
          description: `Split: ${description.trim()} (Your Share)`,
          amount: shareAmount,
          spent_at: new Date().toISOString()
        });
      if (expenseError) throw expenseError;

      // 3. Document shared anchor expense envelope record 
      const { data: splitExpense, error: splitError } = await supabase
        .from('split_expenses')
        .insert({
          user_id: user.id,
          budget_id: selectedBudgetId,
          description: description.trim(),
          total_amount: parsedTotal,
          personal_share: shareAmount
        })
        .select()
        .single();
      if (splitError) throw splitError;

      // 4. Batch push relational map rows for corresponding target group peers
      const memberInserts = selectedFriendIds.map(fId => ({
        split_expense_id: splitExpense.id,
        friend_id: fId,
        owed_amount: shareAmount,
        status: 'unpaid'
      }));

      const { error: membersError } = await supabase
        .from('split_members')
        .insert(memberInserts);
      if (membersError) throw membersError;

      Alert.alert('Success 🎉', `Shared transaction initialized successfully! Net share balances out to ₱${shareAmount.toFixed(2)} per node participant entry.`);
      
      setDescription('');
      setTotalAmount('');
      setSelectedBudgetId('');
      setSelectedFriendIds([]);
      fetchData();

    } catch (error: any) {
      Alert.alert('Execution Terminated', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // UPDATE STATUS RESOLUTION RECORD FLAGS
  const handleSettleFriend = async (memberId: string, friendName: string, amount: number) => {
    Alert.alert(
      'Payment Settlement Confirmation',
      `Are you sure you want to settle the ₱${amount.toFixed(2)} contribution ledger flag for ${friendName}? Confirming means you have received the payment funds securely.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Settlement',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('split_members')
                .update({ status: 'paid', updated_at: new Date().toISOString() })
                .eq('id', memberId);

              if (error) throw error;

              Alert.alert('Settled 🎉', `The transaction stream ledger balance for ${friendName} has been flagged as balanced.`);
              setSettleModalVisible(false);
              fetchData();
            } catch (error: any) {
              Alert.alert('Processing Error', error.message);
            }
          }
        }
      ]
    );
  };

  const openSettleModal = (split: ActiveSplit) => {
    setCurrentSplitToSettle(split);
    setSettleModalVisible(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const previewTotalPeople = selectedFriendIds.length + 1;
  const previewShare = parseFloat(totalAmount) > 0 ? parseFloat(totalAmount) / previewTotalPeople : 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Immersive Slate Top Navigation Block Area */}
      <View style={styles.headerBackground}>
        <Text style={styles.headerTitle}>Split Expense</Text>
        <Text style={styles.headerSubtext}>Divide group accounts, distribute costs, and coordinate structural repayment metrics among your collection peer network groups.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Baseline Metadata Entry Component Frame */}
        <View style={styles.mainCard}>
          <Text style={styles.sectionTitle}>Expense Particulars</Text>
          
          <Text style={styles.label}>What is this expenditure for? (Description)</Text>
          <TextInput style={styles.input} placeholder="e.g., Jollibee Dinner, Grab Bill Carpool" placeholderTextColor="#94A3B8" value={description} onChangeText={setDescription} />

          <Text style={styles.label}>Gross Invoice Billing Total (Total Amount ₱)</Text>
          <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#94A3B8" keyboardType="numeric" value={totalAmount} onChangeText={setTotalAmount} />

          <Text style={styles.label}>Fund Allocation Source Folder Account</Text>
          <View style={styles.categoryContainer}>
            {budgets.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[styles.budgetChip, selectedBudgetId === b.id && styles.budgetChipSelected]}
                onPress={() => setSelectedBudgetId(b.id)}
              >
                <Text style={[styles.chipText, selectedBudgetId === b.id && styles.chipTextSelected]}>
                  {b.categories?.name} (₱{Number(b.remaining_amount).toFixed(0)} left)
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Directory Network Selector Matrix Frame */}
        <View style={styles.friendsCard}>
          <Text style={styles.sectionTitle}>Select Shared Recipients</Text>
          {friends.length === 0 ? (
            <Text style={styles.emptyFriendsText}>No registry items mapped. Connect friends via your main roster tabs first.</Text>
          ) : (
            friends.map((friend) => {
              const isSelected = selectedFriendIds.includes(friend.id);
              return (
                <TouchableOpacity key={friend.id} style={[styles.friendRow, isSelected && styles.friendRowSelected]} onPress={() => toggleFriendSelection(friend.id)} activeOpacity={0.8}>
                  <View style={styles.friendLeft}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                      {isSelected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.friendName} numberOfLines={1}>{friend.full_name}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Predictive Computational Ledger Division Preview Container */}
        {previewShare > 0 && (
          <View style={styles.previewBanner}>
            <Ionicons name="calculator-outline" size={18} color="#1E293B" />
            <Text style={styles.previewText}>Calculated Target: ₱{previewShare.toFixed(2)} per user node ({previewTotalPeople} total active connections combined).</Text>
          </View>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleProcessSplit} disabled={submitting} activeOpacity={0.85}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="pie-chart" size={16} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Execute Account Division</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Historical Split Tracking Stream Ledger Node Row Mapping Layer */}
        <View style={{ marginTop: 28, marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Shared Ledger Allocation Streams</Text>
          
          {loading ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#10B981" />
            </View>
          ) : activeSplits.length === 0 ? (
            <Text style={styles.emptyHistoryText}>No historical shared transaction matrix balances captured.</Text>
          ) : (
            activeSplits.map((split) => {
              const unpaidCount = split.split_members.filter(m => m.status === 'unpaid').length;

              return (
                <View key={split.id} style={styles.historyCard}>
                  <View style={styles.historyTop}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={styles.historyDesc} numberOfLines={1}>{split.description}</Text>
                      <Text style={styles.historyMeta}>Total: ₱{split.total_amount.toFixed(0)} • Personal Share: ₱{split.personal_share.toFixed(0)}</Text>
                    </View>
                    
                    {unpaidCount > 0 ? (
                      <TouchableOpacity style={styles.settleOpenBtn} onPress={() => openSettleModal(split)} activeOpacity={0.85}>
                        <Text style={styles.settleOpenBtnText}>Settle ({unpaidCount})</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.fullySettledBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.fullySettledText}>Balanced</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Repayment Settlement Flow Management Modal Overlay Control Layer */}
      <Modal animationType="slide" transparent={true} visible={settleModalVisible} onRequestClose={() => setSettleModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>Settle: {currentSplitToSettle?.description}</Text>
              <TouchableOpacity onPress={() => setSettleModalVisible(false)} style={styles.closeModalTargetBox}>
                <Ionicons name="close" size={22} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>Isolate and identify the specific contact registry row that has cleared their corresponding calculated cash obligation balance:</Text>

            <FlatList
              data={currentSplitToSettle?.split_members}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.settleMemberRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.settleMemberName} numberOfLines={1}>{item.friends?.full_name}</Text>
                    <Text style={styles.settleMemberAmount}>Calculated Due: ₱{item.owed_amount.toFixed(2)}</Text>
                  </View>

                  {item.status === 'unpaid' ? (
                    <TouchableOpacity style={styles.settleActionBtn} onPress={() => handleSettleFriend(item.id, item.friends?.full_name, item.owed_amount)} activeOpacity={0.8}>
                      <Text style={styles.settleActionBtnText}>Mark Paid</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.memberPaidBadge}>
                      <Ionicons name="checkmark" size={12} color="#10B981" />
                      <Text style={styles.memberPaidText}>Balanced</Text>
                    </View>
                  )}
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E293B' }, // Set to deep slate to cleanly absorb system navbar margins
  
  // Custom Safe Boundary Platform Dynamic Paddings
  headerBackground: { 
    backgroundColor: '#1E293B', 
    paddingHorizontal: 22, 
    paddingTop: Platform.OS === 'android' ? (NativeStatusBar.currentHeight ? NativeStatusBar.currentHeight + 14 : 45) : 16, 
    paddingBottom: 28, 
    borderBottomLeftRadius: 28, 
    borderBottomRightRadius: 28 
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSubtext: { fontSize: 13, color: '#94A3B8', marginTop: 6, lineHeight: 18, fontWeight: '500' },
  
  // Flexible Elastic Layout Grid Components 
  scrollContent: { paddingBottom: 40, paddingHorizontal: 22, paddingTop: 20, backgroundColor: '#FAFBFD' },
  mainCard: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 22, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12, letterSpacing: -0.2 },
  label: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', padding: 12, borderRadius: 14, backgroundColor: '#FAFBFD', fontSize: 14, color: '#1E293B', fontWeight: '500' },
  
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  budgetChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  budgetChipSelected: { backgroundColor: '#1E293B', borderColor: '#1E293B' },
  chipText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  
  friendsCard: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 22, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 16 },
  emptyFriendsText: { color: '#64748B', fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  friendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8 },
  friendRowSelected: { backgroundColor: '#F1F5F9', borderRadius: 12 },
  friendLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  checkbox: { width: 18, height: 18, borderRadius: 6, borderWidth: 1.5, borderColor: '#94A3B8', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#1E293B', borderColor: '#1E293B' },
  friendName: { fontSize: 14, fontWeight: '600', color: '#1E293B', flex: 1 },
  
  previewBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', padding: 14, borderRadius: 14, gap: 10, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  previewText: { fontSize: 12, color: '#1E293B', flex: 1, fontWeight: '500' },
  submitBtn: { backgroundColor: '#1E293B', padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  // History Non-Overlapping Feed Component Rows
  emptyHistoryText: { color: '#64748B', fontSize: 13, textAlign: 'center', marginTop: 16 },
  historyCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 22, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10 },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyDesc: { fontSize: 14, fontWeight: '700', color: '#1E293B', letterSpacing: -0.1 },
  historyMeta: { fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '500' },
  settleOpenBtn: { backgroundColor: '#1E293B', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  settleOpenBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  fullySettledBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fullySettledText: { color: '#10B981', fontSize: 12, fontWeight: '600' },

  // Bottom Fixed Sheet Settle Modal Structural Style Configurations
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  closeModalTargetBox: { padding: 4 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', flex: 1, marginRight: 8 },
  modalSub: { fontSize: 13, color: '#64748B', marginBottom: 18, lineHeight: 18, fontWeight: '500' },
  settleMemberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#FAFBFD' },
  settleMemberName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  settleMemberAmount: { fontSize: 12, color: '#64748B', marginTop: 3, fontWeight: '500' },
  settleActionBtn: { backgroundColor: '#1E293B', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  settleActionBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  memberPaidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 },
  memberPaidText: { color: '#10B981', fontSize: 12, fontWeight: '600' }
});