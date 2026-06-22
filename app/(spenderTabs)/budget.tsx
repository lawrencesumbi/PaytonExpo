import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
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

export default function BudgetScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton}>
          <Feather name="arrow-left" color="#000000" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Budget</Text>
        <View style={{ width: 40 }} /> {/* Layout Spacer */}
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.cardStackContainer}>

          <View style={[styles.backgroundCardBase, styles.bgCard2]} />
          
          <View style={[styles.backgroundCardBase, styles.bgCard1]} />

          <View style={styles.mainActiveCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIndicatorCircle} />
            </View>
            
            <View style={styles.cardInfoRow}>
              <Text style={styles.cardCategoryText}>Food & Dining</Text>
              <Text style={styles.cardAmountText}>$ 4,000.00</Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '37%' }]} />
              <Text style={styles.progressPercentText}>37%</Text>
            </View>

            <TouchableOpacity style={styles.viewAllCardButton}>
              <Text style={styles.viewAllCardText}>View all</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchBarWrapper}>
          <Feather name="search" color="#A0AEC0" size={18} style={styles.searchIcon} />
          <TextInput 
            placeholder="Search for any transaction"
            placeholderTextColor="#A0AEC0"
            style={styles.searchInput}
          />
        </View>

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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 130,
  },
  cardStackContainer: {
    height: 230,
    width: '100%',
    position: 'relative',
    marginBottom: 20,
  },
  backgroundCardBase: {
    position: 'absolute',
    left: '4%',
    right: '4%',
    height: 180,
    borderRadius: 28,
  },
  bgCard2: {
    backgroundColor: '#6B8E23', 
    top: 0,
    transform: [{ scaleX: 0.92 }],
  },
  bgCard1: {
    backgroundColor: '#1D8A8A', 
    top: 12,
    transform: [{ scaleX: 0.96 }],
  },
  mainActiveCard: {
    position: 'absolute',
    top: 24,
    left: 0,
    right: 0,
    height: 190,
    backgroundColor: '#1E538C', 
    borderRadius: 28,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardIndicatorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4299E1', 
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
    backgroundColor: 'rgba(255, 255, 255, 0.35)', 
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#63B3ED', 
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