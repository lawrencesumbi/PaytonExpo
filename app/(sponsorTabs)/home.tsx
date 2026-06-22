 // app/(sponsorTabs)/home.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

type Member = {
  id: string;
  name: string;
  email: string;
};

const budgetData: BudgetItem[] = [
  { id: '1', name: 'Lawrence Sumbi', amount: '₱500.00', endDate: 'Mar 30, 2026', status: 'Inactive' },
  { id: '2', name: 'King James', amount: '₱10,000.00', endDate: 'Mar 31, 2026', status: 'Active' },
  { id: '3', name: 'Lawrence Sumbi', amount: '₱1,000.00', endDate: 'Mar 20, 2026', status: 'Active' },
  { id: '4', name: 'Lawrence Sumbi', amount: '₱400.00', endDate: 'Feb 15, 2026', status: 'Inactive' },
];

const initialMembers: Member[] = [
  { id: '1', name: 'King James', email: 'king@gmail.com' },
  { id: '2', name: 'Lawrence Sumbi', email: 'lawrence@gmail.com' },
];

export default function SponsorHomeScreen() {
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [membersModalVisible, setMembersModalVisible] = useState(false);
  const [members, setMembers] = useState<Member[]>(initialMembers);

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
    if (!email) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    const newMember: Member = {
      id: Date.now().toString(),
      name: name || email.split('@')[0],
      email: email,
    };

    setMembers([...members, newMember]);
    setEmail('');
    setName('');
    setInviteModalVisible(false);
    
    Alert.alert('Success', `Invitation sent to ${email}`);
  };

  const handleRemoveMember = (id: string, name: string) => {
    Alert.alert('Remove Member', `Are you sure you want to remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Remove', 
        style: 'destructive',
        onPress: () => {
          setMembers(members.filter(member => member.id !== id));
        }
      },
    ]);
  };

  const renderMemberItem = ({ item }: { item: Member }) => (
    <View style={styles.memberRow}>
      <View style={styles.memberInfo}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.memberNameText}>{item.name}</Text>
          <Text style={styles.memberEmailText}>{item.email}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.memberRemoveButton}
        onPress={() => handleRemoveMember(item.id, item.name)}
      >
        <Text style={styles.memberRemoveText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hello, Jema 👋</Text>
              <Text style={styles.headerSubtitle}>Spender Overview</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={22} color="#213502" />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="search-outline" size={22} color="#213502" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Balance Card - Green Gradient */}
        <LinearGradient
          colors={['#0CD964', '#213502']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Total Budget</Text>
          <Text style={styles.balanceAmount}>₱ 6,000.00/₱ 10,000</Text>
          <Text style={styles.balancePeriod}>September 1 - 30, 2025</Text>
          
          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={styles.statValue}>₱ 200.00</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStat}>
              <Text style={styles.statLabel}>Available</Text>
              <Text style={styles.statValue}>₱ 11,800.00</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Upcoming Payment - List style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming payment</Text>

          <View style={styles.paymentItem}>
            <View style={styles.paymentLeft}>
              <Text style={styles.paymentName}>Adobe Premium</Text>
              <Text style={styles.paymentAmount}>₱ 580.16/month</Text>
            </View>
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentBadgeText}>2 days left</Text>
            </View>
          </View>

          <View style={styles.paymentItem}>
            <View style={styles.paymentLeft}>
              <Text style={styles.paymentName}>Apple Premium</Text>
              <Text style={styles.paymentAmount}>₱ 580.16/month</Text>
            </View>
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentBadgeText}>2 days left</Text>
            </View>
          </View>
        </View>

        {/* Recent Activities - List style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>

          <View style={styles.activityItem}>
            <View style={styles.activityLeft}>
              <Text style={styles.activityName}>Apple Inc.</Text>
              <Text style={styles.activityDate}>21 Sept, 03:02 PM</Text>
            </View>
            <Text style={styles.activityAmount}>₱ 230.50</Text>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityLeft}>
              <Text style={styles.activityName}>Adobe</Text>
              <Text style={styles.activityDate}>21 Sept, 03:22 PM</Text>
            </View>
            <Text style={styles.activityAmount}>₱ 130.50</Text>
          </View>

          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Budget Distribution */}
        <View style={styles.section}>
          <View style={styles.budgetSectionHeader}>
            <Text style={styles.sectionTitle}>Budget Distribution</Text>
            <TouchableOpacity onPress={() => router.push('/(sponsorTabs)/allowance')}>
              <Text style={styles.seeAll}>See all</Text>
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
              <Text style={[styles.modalTitle, { color: '#213502' }]}>Manage Members</Text>
              <TouchableOpacity onPress={() => setMembersModalVisible(false)}>
                <Ionicons name="close" size={24} color="#213502" />
              </TouchableOpacity>
            </View>

            <View style={styles.memberTableHeader}>
              <Text style={[styles.memberHeaderText, styles.memberNameHeader]}>Member Details</Text>
              <Text style={[styles.memberHeaderText, styles.memberEmailHeader]}>Email Address</Text>
              <Text style={[styles.memberHeaderText, styles.memberActionHeader]}>Actions</Text>
            </View>

            <FlatList
              data={members}
              renderItem={renderMemberItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyMembersContainer}>
                  <Text style={styles.emptyMembersText}>No members yet</Text>
                  <Text style={styles.emptyMembersSubtext}>Invite your first team member</Text>
                </View>
              }
            />

            <TouchableOpacity 
              style={styles.inviteButton}
              onPress={() => {
                setMembersModalVisible(false);
                setInviteModalVisible(true);
              }}
            >
              <Ionicons name="person-add" size={20} color="#213502" />
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
              <Text style={[styles.modalTitle, { color: '#213502' }]}>Invite Member</Text>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <Ionicons name="close" size={24} color="#213502" />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalSubtitle, { color: '#7DA08E' }]}>
              Enter an email address to send a workspace invitation.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: '#54090C' }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#F9FAFB', borderColor: '#7DA08E', color: '#213502' }]}
                placeholder="e.g. John Doe"
                placeholderTextColor="#7DA08E"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: '#54090C' }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#F9FAFB', borderColor: '#7DA08E', color: '#213502' }]}
                placeholder="e.g. name@company.com"
                placeholderTextColor="#7DA08E"
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
    color: '#213502',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7DA08E',
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
    backgroundColor: '#F47590',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  balanceCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 2,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  balancePeriod: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginBottom: 16,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 16,
  },
  balanceStat: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginBottom: 2,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#213502',
    marginBottom: 12,
  },
  budgetSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: '#0CD964',
    fontWeight: '500',
  },
  seeAllButton: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#0CD964',
    fontWeight: '500',
  },
  // Payment Items - List style without card background
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  paymentLeft: {
    flex: 1,
  },
  paymentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#213502',
  },
  paymentAmount: {
    fontSize: 12,
    color: '#7DA08E',
    marginTop: 2,
  },
  paymentBadge: {
    backgroundColor: '#F47590',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // Activity Items - List style without card background
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityLeft: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#213502',
  },
  activityDate: {
    fontSize: 12,
    color: '#7DA08E',
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0CD964',
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
    color: '#7DA08E',
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
    color: '#213502',
  },
  budgetDate: {
    fontSize: 12,
    color: '#7DA08E',
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
    color: '#213502',
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
    backgroundColor: '#0CD964',
  },
  inactiveBadge: {
    backgroundColor: '#F47590',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  activeText: {
    color: '#FFFFFF',
  },
  inactiveText: {
    color: '#FFFFFF',
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
    color: '#213502',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7DA08E',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#54090C',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#7DA08E',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#213502',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
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
    color: '#7DA08E',
    fontSize: 14,
    fontWeight: '500',
  },
  sendButton: {
    backgroundColor: '#0CD964',
  },
  sendButtonText: {
    color: '#213502',
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
    color: '#7DA08E',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7DA08E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  memberNameText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#213502',
  },
  memberEmailText: {
    fontSize: 12,
    color: '#7DA08E',
  },
  memberRemoveButton: {
    backgroundColor: '#F47590',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  memberRemoveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  inviteButton: {
    flexDirection: 'row',
    backgroundColor: '#0CD964',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  inviteButtonText: {
    color: '#213502',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyMembersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyMembersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#213502',
  },
  emptyMembersSubtext: {
    fontSize: 14,
    color: '#7DA08E',
    marginTop: 4,
  },
});