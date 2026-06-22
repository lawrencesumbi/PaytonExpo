 // app/(sponsorTabs)/allowance.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AllowanceItem = {
  id: string;
  reference: string;
  period: string;
  spender: string;
  status: string;
  amount: string;
};

const allowanceData: AllowanceItem[] = [
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

export default function AllowanceScreen() {
  const renderAllowanceItem = ({ item }: { item: AllowanceItem }) => (
    <TouchableOpacity style={styles.allowanceCard}>
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
            <Ionicons name="options-outline" size={24} color="#FFFFFF" />
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
          colors={['#0A1A1A', '#1A3A3A', '#2D7A5E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statCard, styles.statCardHighlight]}
        >
          <Text style={[styles.statCardLabel, { color: 'rgba(255,255,255,0.7)' }]}>Total Spent</Text>
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

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/create-allowance')}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F0F',
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
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  filterIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A2A2A',
    padding: 16,
    borderRadius: 16,
  },
  statCardHighlight: {
    backgroundColor: '#2D7A5E',
  },
  statCardLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  allowanceCard: {
    backgroundColor: '#1A2A2A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    color: '#FFFFFF',
  },
  periodText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4ADE80',
  },
  allowanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2A3A3A',
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
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ADE80',
  },
  spenderText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ADE80',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#2D7A5E',
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
});