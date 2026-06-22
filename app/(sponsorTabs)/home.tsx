 // app/(sponsorTabs)/home.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const renderBudgetItem = ({ item }: { item: BudgetItem }) => (
    <View style={styles.budgetRow}>
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
    </View>
  );

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
                <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="search-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={['#0A1A1A', '#1A3A3A', '#2D7A5E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
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
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#1A3A3A', '#2D7A5E']}
              style={styles.actionIcon}
            >
              <Ionicons name="person-add-outline" size={22} color="#4ADE80" />
            </LinearGradient>
            <Text style={styles.actionLabel}>Add Member</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#1A3A3A', '#2D7A5E']}
              style={styles.actionIcon}
            >
              <Ionicons name="wallet-outline" size={22} color="#60A5FA" />
            </LinearGradient>
            <Text style={styles.actionLabel}>New Allowance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#1A3A3A', '#2D7A5E']}
              style={styles.actionIcon}
            >
              <Ionicons name="analytics-outline" size={22} color="#FBBF24" />
            </LinearGradient>
            <Text style={styles.actionLabel}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#1A3A3A', '#2D7A5E']}
              style={styles.actionIcon}
            >
              <Ionicons name="settings-outline" size={22} color="#A78BFA" />
            </LinearGradient>
            <Text style={styles.actionLabel}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Budget Distribution */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Budget Distribution</Text>
            <TouchableOpacity>
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
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
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
    borderColor: '#0A0F0F',
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
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 16,
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 16,
  },
  balanceStat: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    color: '#9CA3AF',
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
    color: '#FFFFFF',
  },
  seeAll: {
    fontSize: 14,
    color: '#4ADE80',
    fontWeight: '500',
  },
  budgetList: {
    backgroundColor: '#1A2A2A',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3A3A',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
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
    borderBottomColor: '#2A3A3A',
  },
  budgetInfo: {
    flex: 1,
  },
  budgetName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  budgetDate: {
    fontSize: 12,
    color: '#9CA3AF',
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
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  activeText: {
    color: '#4ADE80',
  },
  inactiveText: {
    color: '#EF4444',
  },
});