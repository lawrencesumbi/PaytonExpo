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

      <View style={styles.statsContainer}>
        <LinearGradient
          colors={['#0CD964', '#213502']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statCard, styles.statCardHighlight]}
        >
          <Text style={[styles.statCardLabel, { color: 'rgba(255,255,255,0.8)' }]}>Current Allowance</Text>
          <Text style={[styles.statCardValue, { color: '#FFFFFF' }]}>₱11,000.00</Text>
        </LinearGradient>
        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>Total Spent</Text>
          <Text style={styles.statCardValue}>₱1,500.00</Text>
        </View>
      </View>

      <FlatList
        data={allowanceData}
        renderItem={renderAllowanceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('../(sponsorTabs)/create-allowance')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#213502" />
      </TouchableOpacity>
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
    backgroundColor: '#0CD964',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
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
});