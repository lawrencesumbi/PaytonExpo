 // app/(sponsorTabs)/members.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Member = {
  id: string;
  name: string;
  email: string;
  role?: string;
  status?: 'Active' | 'Pending';
};

const initialMembers: Member[] = [
  { id: '1', name: 'King James', email: 'king@gmail.com', role: 'Spender', status: 'Active' },
  { id: '2', name: 'Lawrence Sumbi', email: 'lawrence@gmail.com', role: 'Spender', status: 'Active' },
  { id: '3', name: 'Maria Santos', email: 'maria@gmail.com', role: 'Spender', status: 'Pending' },
];

export default function MembersScreen() {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendInvite = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      const newMember: Member = {
        id: Date.now().toString(),
        name: name || email.split('@')[0],
        email: email,
        role: 'Spender',
        status: 'Pending',
      };
      
      setMembers([...members, newMember]);
      setIsLoading(false);
      setEmail('');
      setName('');
      setInviteModalVisible(false);
      
      Alert.alert(
        'Success',
        `Invitation sent to ${email}`,
        [{ text: 'OK' }]
      );
    }, 1500);
  };

  const handleRemoveMember = (id: string, name: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setMembers(members.filter(member => member.id !== id));
          }
        },
      ]
    );
  };

  const renderMemberItem = ({ item }: { item: Member }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.memberDetails}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberEmail}>{item.email}</Text>
        </View>
      </View>
      <View style={styles.memberActions}>
        <View style={[styles.statusBadge, item.status === 'Active' ? styles.activeBadge : styles.pendingBadge]}>
          <Text style={[styles.statusText, item.status === 'Active' ? styles.activeText : styles.pendingText]}>
            {item.status}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemoveMember(item.id, item.name)}
        >
          <Ionicons name="close-outline" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Members</Text>
            <Text style={styles.headerSubtitle}>Manage your team members</Text>
          </View>
          <TouchableOpacity style={styles.filterIcon}>
            <Ionicons name="options-outline" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>Total Members</Text>
          <Text style={styles.statCardValue}>{members.length}</Text>
        </View>
        <LinearGradient
          colors={['#4FC3F7', '#0288D1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statCard, styles.statCardHighlight]}
        >
          <Text style={[styles.statCardLabel, { color: 'rgba(255,255,255,0.8)' }]}>Active</Text>
          <Text style={[styles.statCardValue, { color: '#FFFFFF' }]}>
            {members.filter(m => m.status === 'Active').length}
          </Text>
        </LinearGradient>
        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>Pending</Text>
          <Text style={styles.statCardValue}>
            {members.filter(m => m.status === 'Pending').length}
          </Text>
        </View>
      </View>

      <FlatList
        data={members}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No members yet</Text>
            <Text style={styles.emptySubtext}>Invite your first team member</Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setInviteModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Invite Member Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={inviteModalVisible}
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Member</Text>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Enter the email address and name to send a workspace invitation.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. John Doe"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <Text style={styles.sendButtonText}>Sending...</Text>
                ) : (
                  <Text style={styles.sendButtonText}>Send Invite</Text>
                )}
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
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
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
    backgroundColor: '#0288D1',
  },
  statCardLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0288D1',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  memberEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 1,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  activeText: {
    color: '#065F46',
  },
  pendingText: {
    color: '#92400E',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#0288D1',
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
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
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  sendButton: {
    backgroundColor: '#0288D1',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});