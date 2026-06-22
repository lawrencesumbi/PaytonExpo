// app/(sponsorTabs)/archive.tsx
import { Ionicons } from '@expo/vector-icons';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ArchiveItem = {
  id: string;
  reference: string;
  period: string;
  spender: string;
  status: string;
  amount: string;
};

const archiveData: ArchiveItem[] = [
  {
    id: '1',
    reference: 'March 25-30',
    period: 'Mar 25—Mar 30, 2026',
    spender: 'Lawrence Sumbi',
    status: 'Inactive',
    amount: '₱500.00',
  },
  {
    id: '2',
    reference: 'February 1 - 15',
    period: 'Feb 01—Feb 15, 2026',
    spender: 'Lawrence Sumbi',
    status: 'Inactive',
    amount: '₱400.00',
  },
];

export default function ArchiveScreen() {
  const renderArchiveItem = ({ item }: { item: ArchiveItem }) => (
    <View style={styles.archiveRow}>
      <Text style={[styles.archiveText, styles.referenceCol]}>{item.reference}</Text>
      <View style={styles.spenderCol}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{item.spender.charAt(0)}</Text>
        </View>
        <Text style={styles.archiveText}>{item.spender}</Text>
      </View>
      <View style={styles.statusCol}>
        <View style={styles.inactiveBadge}>
          <Text style={styles.inactiveText}>{item.status}</Text>
        </View>
      </View>
      <Text style={[styles.archiveText, styles.amountCol]}>{item.amount}</Text>
      <TouchableOpacity style={styles.actionCol}>
        <Ionicons name="ellipsis-vertical" size={18} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Archived Allowances</Text>
            <Text style={styles.headerSubtitle}>Expired or inactive allowance records.</Text>
          </View>
          <TouchableOpacity style={styles.filterIcon}>
            <Ionicons name="options-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.referenceCol]}>Reference</Text>
          <Text style={[styles.headerText, styles.spenderCol]}>Spender</Text>
          <Text style={[styles.headerText, styles.statusCol]}>Status</Text>
          <Text style={[styles.headerText, styles.amountCol]}>Amount</Text>
          <Text style={[styles.headerText, styles.actionCol]}>Actions</Text>
        </View>

        <FlatList
          data={archiveData}
          renderItem={renderArchiveItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
  tableContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3A3A',
    marginBottom: 4,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  referenceCol: {
    flex: 1.5,
  },
  spenderCol: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusCol: {
    flex: 0.8,
  },
  amountCol: {
    flex: 0.8,
    textAlign: 'right',
  },
  actionCol: {
    flex: 0.5,
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  archiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2A2A',
  },
  archiveText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ADE80',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  inactiveText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#EF4444',
  },
});