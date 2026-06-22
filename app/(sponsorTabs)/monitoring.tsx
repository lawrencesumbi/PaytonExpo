 // app/(sponsorTabs)/monitoring.tsx
import { Ionicons } from '@expo/vector-icons';
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
      case 'Food & Dining': return { bg: '#E8F5E9', icon: '#2D7A5E', name: 'restaurant-outline' };
      case 'Transportation': return { bg: '#E3F2FD', icon: '#1565C0', name: 'car-outline' };
      case 'Bills & Utilities': return { bg: '#FFF3E0', icon: '#E65100', name: 'flash-outline' };
      default: return { bg: '#F3E5F5', icon: '#7B1FA2', name: 'grid-outline' };
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
              <Ionicons name="search-outline" size={22} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>SELECT SPENDER</Text>
            <TouchableOpacity style={styles.filterSelect}>
              <Text style={styles.filterSelectText}>{selectedSpender}</Text>
              <Ionicons name="chevron-down" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>SELECT ALLOWANCE</Text>
            <TouchableOpacity style={styles.filterSelect}>
              <Text style={styles.filterSelectText}>{selectedAllowance}</Text>
              <Ionicons name="chevron-down" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.7)' }]}>Total Allowance</Text>
            <Text style={[styles.statValue, { color: '#FFFFFF' }]}>₱1,000.00</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={[styles.statValue, { color: '#DC2626' }]}>₱854.00</Text>
          </View>
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.7)' }]}>Allowance Left</Text>
            <Text style={[styles.statValue, { color: '#FFFFFF' }]}>₱146.00</Text>
          </View>
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
    backgroundColor: '#F5F7F6',
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
    color: '#1F2937',
  },
  searchIcon: {
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
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  filterSelect: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterSelectText: {
    fontSize: 14,
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardHighlight: {
    backgroundColor: '#2D7A5E',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  transactionsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 4,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
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
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    color: '#1F2937',
  },
  transactionMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
});