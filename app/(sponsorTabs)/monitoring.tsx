 // app/(sponsorTabs)/monitoring.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Transaction = {
  id: string;
  date: string;
  category: string;
  paymentMethod: string;
  description: string;
  amount: string;
};

const transactions: Transaction[] = [
  { id: '1', date: 'Mar 16, 2026', category: 'Food & Dining', paymentMethod: 'Cash', description: 'Jollibee', amount: '₱10.00' },
  { id: '2', date: 'Mar 15, 2026', category: 'Food & Dining', paymentMethod: 'Cash', description: 'Mang Inasal', amount: '₱100.00' },
  { id: '3', date: 'Mar 15, 2026', category: 'Food & Dining', paymentMethod: 'Cash', description: 'Snack', amount: '₱50.00' },
  { id: '4', date: 'Mar 15, 2026', category: 'Food & Dining', paymentMethod: 'Cash', description: 'Softdrink', amount: '₱25.00' },
  { id: '5', date: 'Mar 12, 2026', category: 'Transportation', paymentMethod: 'Cash', description: 'Gas Motor', amount: '₱150.00' },
  { id: '6', date: 'Mar 12, 2026', category: 'Food & Dining', paymentMethod: 'Cash', description: 'Chowking', amount: '₱200.00' },
  { id: '7', date: 'Mar 12, 2026', category: 'Bills & Utilities', paymentMethod: 'Online Payment', description: 'Internet Bill', amount: '₱199.00' },
  { id: '8', date: 'Mar 12, 2026', category: 'Miscellaneous', paymentMethod: 'Cash', description: 'Sample', amount: '₱10.00' },
];

export default function MonitoringScreen() {
  const [selectedSpender, setSelectedSpender] = useState('Lawrence Sumbi');
  const [selectedAllowance, setSelectedAllowance] = useState('March 10-20 (₱1,000)');

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'Food & Dining': return { bg: 'rgba(74, 222, 128, 0.2)', icon: '#4ADE80', name: 'restaurant-outline' };
      case 'Transportation': return { bg: 'rgba(96, 165, 250, 0.2)', icon: '#60A5FA', name: 'car-outline' };
      case 'Bills & Utilities': return { bg: 'rgba(251, 191, 36, 0.2)', icon: '#FBBF24', name: 'flash-outline' };
      default: return { bg: 'rgba(167, 139, 250, 0.2)', icon: '#A78BFA', name: 'grid-outline' };
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const category = getCategoryColor(item.category);
    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionLeft}>
          <View style={[styles.categoryIcon, { backgroundColor: category.bg }]}>
            <Ionicons name={category.name as any} size={18} color={category.icon} />
          </View>
          <View>
            <Text style={styles.transactionDescription}>{item.description}</Text>
            <Text style={styles.transactionMeta}>{item.date} • {item.paymentMethod}</Text>
          </View>
        </View>
        <Text style={styles.transactionAmount}>{item.amount}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Monitoring</Text>
            </View>
            <TouchableOpacity style={styles.searchIcon}>
              <Ionicons name="search-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>SELECT SPENDER</Text>
            <TouchableOpacity style={styles.filterSelect}>
              <Text style={styles.filterSelectText}>{selectedSpender}</Text>
              <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>SELECT ALLOWANCE</Text>
            <TouchableOpacity style={styles.filterSelect}>
              <Text style={styles.filterSelectText}>{selectedAllowance}</Text>
              <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#0A1A1A', '#1A3A3A', '#2D7A5E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <Text style={styles.statLabel}>Total Allowance</Text>
            <Text style={styles.statValue}>₱1,000.00</Text>
          </LinearGradient>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>₱854.00</Text>
          </View>
          <LinearGradient
            colors={['#0A1A1A', '#1A3A3A', '#2D7A5E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <Text style={styles.statLabel}>Allowance Left</Text>
            <Text style={styles.statValue}>₱146.00</Text>
          </LinearGradient>
        </View>

        {/* Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          
          <View style={styles.transactionHeader}>
            <Text style={[styles.headerText, styles.dateCol]}>Date</Text>
            <Text style={[styles.headerText, styles.categoryCol]}>Category</Text>
            <Text style={[styles.headerText, styles.paymentCol]}>Payment</Text>
            <Text style={[styles.headerText, styles.descCol]}>Description</Text>
            <Text style={[styles.headerText, styles.amountCol]}>Amount</Text>
            <Text style={[styles.headerText, styles.receiptCol]}>Receipt</Text>
          </View>

          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
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
    paddingBottom: 12,
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
  searchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  filterGroup: {
    gap: 4,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  filterSelect: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A2A2A',
    borderWidth: 1,
    borderColor: '#2A3A3A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterSelectText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A2A2A',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  transactionsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3A3A',
    marginBottom: 4,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  dateCol: { flex: 1.2 },
  categoryCol: { flex: 1.5 },
  paymentCol: { flex: 1.2 },
  descCol: { flex: 1 },
  amountCol: { flex: 0.8, textAlign: 'right' },
  receiptCol: { flex: 0.6, textAlign: 'center' },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A2A2A',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  transactionMeta: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});