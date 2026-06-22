 // app/(sponsorTabs)/home.tsx - Removed Archive from quick actions since it's not a tab
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type BudgetItem = {
  id: string;
  name: string;
  amount: string;
  endDate: string;
  status: 'Active' | 'Inactive';
};

const budgetData: BudgetItem[] = [
  { id: '1', name: 'Lawrence Sumbi', amount: '₱500.00', endDate: 'Mar 30, 2026', status: 'Inactive' },
  { id: '2', name: 'King James', amount: '₱10,000.00', endDate: 'Mar 31, 2026', status: 'Active' },
  { id: '3', name: 'Lawrence Sumbi', amount: '₱1,000.00', endDate: 'Mar 20, 2026', status: 'Active' },
  { id: '4', name: 'Lawrence Sumbi', amount: '₱400.00', endDate: 'Feb 15, 2026', status: 'Inactive' },
];

export default function SponsorHomeScreen() {
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [membersModalVisible, setMembersModalVisible] = useState(false);

  const members = [
    { id: '1', name: 'King James', email: 'king@gmail.com' },
    { id: '2', name: 'Lawrence Sumbi', email: 'lawrence@gmail.com' },
  ];

  const renderBudgetItem = ({ item }: { item: BudgetItem }) => (
    <TouchableOpacity 
      style={styles.budgetRow}
      onPress={() => router.push('/(sponsorTabs)/monitoring')}
    >
      <View style={styles.budgetInfo}>
        <Text style={styles.budgetName}>{item.name}</Text>
        <Text style={styles.budgetDate}>{item.endDate}</Text>
      </View>
      <View style={styles.budgetRight}>
        <Text style={styles.budgetAmount}>{item.amount}</Text>
        <View style={[styles.statusBadge, item.status === 'Active' ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.statusText, item.status === 'Active' ? styles.activeText : styles.inactiveText]}>
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleSendInvite = () => {
    if (email) {
      Alert.alert('Success', `Invitation sent to ${email}`);
      setEmail('');
      setInviteModalVisible(false);
    }
  };

  const handleRemoveMember = (name: string) => {
    Alert.alert('Remove Member', `Are you sure you want to remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hello, Patricia 👋</Text>
              <Text style={styles.headerSubtitle}>Sponsor Overview</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={22} color="#1F2937" />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="search-outline" size={22} color="#1F2937" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Capital Allocated</Text>
          <Text style={styles.balanceAmount}>₱11,900.00</Text>
          <View style={styles.balanceFooter}>
            <View style={styles.balanceStat}>
              <Text style={styles.statLabel}>Current Allowance</Text>
              <Text style={styles.statValue}>₱11,000.00</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStat}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={styles.statValue}>₱1,500.00</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStat}>
              <Text style={styles.statLabel}>Available</Text>
              <Text style={styles.statValue}>₱9,500.00</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setMembersModalVisible(true)}>
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="people" size={22} color="#2D7A5E" />
            </View>
            <Text style={styles.actionLabel}>Members</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(sponsorTabs)/allowance')}>
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="wallet" size={22} color="#1565C0" />
            </View>
            <Text style={styles.actionLabel}>Allowance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/archive')}>
            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="archive" size={22} color="#E65100" />
            </View>
            <Text style={styles.actionLabel}>Archive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setInviteModalVisible(true)}>
            <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="person-add" size={22} color="#7B1FA2" />
            </View>
            <Text style={styles.actionLabel}>Invite</Text>
          </TouchableOpacity>
        </View>

        {/* Budget Distribution */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Budget Distribution</Text>
            <TouchableOpacity onPress={() => router.push('/(sponsorTabs)/allowance')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.budgetList}>
            <View style={styles.budgetHeader}>
              <Text style={[styles.headerText, styles.budgetNameHeader]}>Budget Name</Text>
              <View style={styles.budgetRightHeader}>
                <Text style={[styles.headerText, styles.budgetAmountHeader]}>Amount</Text>
                <Text style={[styles.headerText, styles.budgetStatusHeader]}>Status</Text>
              </View>
            </View>
            <FlatList
              data={budgetData}
              renderItem={renderBudgetItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        </View>
      </ScrollView>

      {/* Members Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={membersModalVisible}
        onRequestClose={() => setMembersModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#1F2937' }]}>Manage Members</Text>
              <TouchableOpacity onPress={() => setMembersModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <View style={styles.memberTableHeader}>
              <Text style={[styles.memberHeaderText, styles.memberNameHeader]}>Member Details</Text>
              <Text style={[styles.memberHeaderText, styles.memberEmailHeader]}>Email Address</Text>
              <Text style={[styles.memberHeaderText, styles.memberActionHeader]}>Actions</Text>
            </View>

            {members.map((member) => (
              <View key={member.id} style={[styles.memberRow, { borderBottomColor: '#E5E7EB' }]}>
                <Text style={[styles.memberText, styles.memberName, { color: '#1F2937' }]}>{member.name}</Text>
                <Text style={[styles.memberText, styles.memberEmail, { color: '#6B7280' }]}>{member.email}</Text>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => handleRemoveMember(member.name)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity 
              style={styles.inviteButton}
              onPress={() => {
                setMembersModalVisible(false);
                setInviteModalVisible(true);
              }}
            >
              <Ionicons name="person-add" size={20} color="#FFFFFF" />
              <Text style={styles.inviteButtonText}>Invite New Member</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Invite Member Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={inviteModalVisible}
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#1F2937' }]}>Invite Member</Text>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: '#6B7280' }]}>Enter an email address to send a workspace invitation.</Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: '#6B7280' }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', color: '#1F2937' }]}
                placeholder="e.g. name@company.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setInviteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.sendButton]} 
                onPress={handleSendInvite}
              >
                <Text style={styles.sendButtonText}>Send Invite</Text>
              </TouchableOpacity>
            </View>
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
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
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
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  balanceCard: {
    backgroundColor: '#E8F5E9',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: 14,
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#1F2937',
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 16,
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: 16,
  },
  balanceStat: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  statLabel: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 11,
    marginBottom: 2,
  },
  statValue: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  seeAll: {
    fontSize: 14,
    color: '#2D7A5E',
    fontWeight: '500',
  },
  budgetList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  budgetNameHeader: {
    flex: 1,
  },
  budgetRightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  budgetAmountHeader: {
    minWidth: 70,
    textAlign: 'right',
  },
  budgetStatusHeader: {
    minWidth: 60,
    textAlign: 'right',
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  budgetInfo: {
    flex: 1,
  },
  budgetName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  budgetDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  budgetRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  budgetAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 70,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  activeText: {
    color: '#065F46',
  },
  inactiveText: {
    color: '#991B1B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
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
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  sendButton: {
    backgroundColor: '#2D7A5E',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  memberTableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  memberHeaderText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  memberNameHeader: {
    flex: 2,
  },
  memberEmailHeader: {
    flex: 2,
  },
  memberActionHeader: {
    flex: 1,
    textAlign: 'right',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  memberText: {
    fontSize: 14,
    color: '#1F2937',
  },
  memberName: {
    flex: 2,
  },
  memberEmail: {
    flex: 2,
  },
  removeButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
  },
  inviteButton: {
    flexDirection: 'row',
    backgroundColor: '#2D7A5E',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});