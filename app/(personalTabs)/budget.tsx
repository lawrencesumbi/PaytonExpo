import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import BudgetCard from '../../app/(personalTabs)/budgetCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40; 

type BudgetItem = {
  id: string;
  category: string;
  amount: string;
  percent: number;
  percentValue: number;
  color: string;
  indicatorColor: string;
  fillColor: string;
};

const BUDGET_DATA: BudgetItem[] = [
  {
    id: '1',
    category: 'Food & Dining',
    amount: '$ 4,000.00',
    percent: 37,
    percentValue: 0.37,
    color: '#1E538C', // Dark Blue
    indicatorColor: '#4299E1',
    fillColor: '#63B3ED'
  },
  {
    id: '2',
    category: 'Transportation',
    amount: '$ 1,500.00',
    percent: 55,
    percentValue: 0.55,
    color: '#1D8A8A', // Teal/Green-blue
    indicatorColor: '#319795',
    fillColor: '#4FD1C5'
  },
  {
    id: '3',
    category: 'Utilities Bills',
    amount: '$ 2,200.00',
    percent: 80,
    percentValue: 0.80,
    color: '#6B8E23', // Olive/Light Green
    indicatorColor: '#9ACD32',
    fillColor: '#ADFF2F'
  },
  {
    id: '4',
    category: 'Entertainment & Others',
    amount: '$ 1,200.00',
    percent: 20,
    percentValue: 0.20,
    color: '#718096', // Slate Gray
    indicatorColor: '#A0AEC0',
    fillColor: '#CBD5E0'
  }
];

export default function BudgetScreen() {
  
  const renderBudgetCard = ({ item }: { item: BudgetItem }) => (
    <View style={[styles.mainActiveCard, { backgroundColor: item.color }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIndicatorCircle, { backgroundColor: item.indicatorColor }]} />
      </View>
      
      <View style={styles.cardInfoRow}>
        <Text style={styles.cardCategoryText}>{item.category}</Text>
        <Text style={styles.cardAmountText}>{item.amount}</Text>
      </View>

      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${item.percent}%`, backgroundColor: item.fillColor }]} />
        <Text style={styles.progressPercentText}>{item.percent}%</Text>
      </View>

      <TouchableOpacity style={styles.viewAllCardButton}>
        <Text style={styles.viewAllCardText}>View all</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER SECTION */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton}>
          <Feather name="arrow-left" color="#000000" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Budget</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* MAIN SCROLL CONTAINER */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        
        {/* CAROUSEL HORIZONTAL BUDGET CARDS */}
        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          {BUDGET_DATA.map((item) => (
            <BudgetCard
              key={item.id}
              category={item.category}
              amount={item.amount}
              percent={item.percent}
              color={item.color}
              indicatorColor={item.indicatorColor}
              fillColor={item.fillColor}
              onPressViewAll={() => console.log(`${item.category} clicked`)}
            />
          ))}
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchBarWrapper}>
          <Feather name="search" color="#A0AEC0" size={18} style={styles.searchIcon} />
          <TextInput 
            placeholder="Search for any transaction"
            placeholderTextColor="#A0AEC0"
            style={styles.searchInput}
          />
        </View>

        {/* TRANSACTIONS SECTION */}
        <View style={styles.transactionsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activeTransactionItem}>
            <View style={styles.transactionLeft}>
              <View style={styles.transactionIconPlaceholder} />
              <View>
                <Text style={styles.transactionMerchant}>Jollibee</Text>
                <Text style={styles.transactionCategory}>Food & Dining</Text>
              </View>
            </View>
            <View style={styles.transactionRight}>
              <Text style={styles.transactionAmount}>-$ 5.90</Text>
              <Text style={styles.transactionTimestamp}>06/22/26 - 02:30 pm</Text>
            </View>
          </View>

          <View style={styles.placeholderTransactionItem} />
          <View style={styles.placeholderTransactionItem} />
          <View style={styles.placeholderTransactionItem} />
          <View style={styles.placeholderTransactionItem} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 130, // Nagbilin og space para sa floating navigation layout
  },
  carouselWrapper: {
    marginBottom: 24,
    height: 200,
  },
  carouselContainer: {
    paddingHorizontal: 20, // Gi-pantay sa alignment sa search bar ug headers
    gap: 16, // Gidako-on sa distansya tali sa matag bar card
  },
  mainActiveCard: {
    width: CARD_WIDTH,
    height: 190,
    borderRadius: 28,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 5 },
    }),
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardIndicatorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  cardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardCategoryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  cardAmountText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBarTrack: {
    width: '100%',
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)', 
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  progressBarFill: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 16,
  },
  progressPercentText: {
    alignSelf: 'center',
    fontSize: 12,
    color: '#FFFFFF', 
    fontWeight: '700',
    zIndex: 2,
  },
  viewAllCardButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  viewAllCardText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '500',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9', 
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 24,
    marginHorizontal: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A202C',
  },
  transactionsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  seeAllText: {
    fontSize: 12,
    color: '#64748B',
  },
  activeTransactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
  },
  transactionMerchant: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  transactionCategory: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  transactionTimestamp: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 3,
  },
  placeholderTransactionItem: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 10,
    opacity: 0.5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
});