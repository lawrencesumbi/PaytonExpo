import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// I-define nato ang interface para sa type safety (TypeScript)
interface BudgetCardProps {
  category: string;
  amount: string;
  percent: number;
  color: string;
  indicatorColor: string;
  fillColor: string;
  onPressViewAll?: () => void;
  cardWidth?: number | string; // Puyde i-adjust depende sa parent setup
}

export default function BudgetCard({
  category,
  amount,
  percent,
  color,
  indicatorColor,
  fillColor,
  onPressViewAll,
  cardWidth = '100%', // Default width kon dili butangan
}: BudgetCardProps) {
  return (
    <View style={[styles.mainActiveCard, { backgroundColor: color, width: cardWidth as any }]}>
      {/* CARD TOP INDICATOR */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardIndicatorCircle, { backgroundColor: indicatorColor }]} />
      </View>
      
      {/* INFO ROW */}
      <View style={styles.cardInfoRow}>
        <Text style={styles.cardCategoryText}>{category}</Text>
        <Text style={styles.cardAmountText}>{amount}</Text>
      </View>

      {/* PROGRESS BAR TRACK & FILL */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${percent}%`, backgroundColor: fillColor }]} />
        <Text style={styles.progressPercentText}>{percent}%</Text>
      </View>

      {/* ACTION BUTTON */}
      <TouchableOpacity style={styles.viewAllCardButton} onPress={onPressViewAll}>
        <Text style={styles.viewAllCardText}>View all</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mainActiveCard: {
    height: 190,
    borderRadius: 28,
    padding: 20,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
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
});