import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
     
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Hello, Jema👋</Text>
            <Text style={styles.nameText}>Spender Overview</Text>
          </View>
          <View style={styles.searchRow}>
            <LinearGradient
              colors={["#c5dbd0", "#92bba7"]}
              start={{ x: 0.0, y: 0.0 }}
              end={{ x: 1.0, y: 1.0 }}
              style={styles.searchIconBg}
            >
              <Image source={require("../../components/icon-search.png")} style={styles.iconSearch} />
            </LinearGradient>
            <Image source={require("../../components/icon-calendar.png")} style={styles.iconCalendar} />
          </View>
        </View>

        <LinearGradient
          colors={['#79b5c7', '#ccf3d7']} 
          start={{ x: 0.0, y: 0.0 }}
          end={{ x: 1.1, y: 1.0 }}
          style={styles.gradient1}
        >
          <View style={styles.allowanceFullWidth}>
            <Text style={styles.cardLabelLight}>Total Budget</Text>
            
            <View style={styles.amountRow}>
              <Text style={styles.allowanceText}>₱ 6,000.00/</Text>
              <Text style={styles.totalLimitText}>₱10,000</Text>
            </View>

            <Text style={styles.dateText}>September 1 - 30, 2025</Text>

            <View style={styles.progressBarContainer}>
              <LinearGradient
                colors={['#38BDF8', '#166534']} 
                start={{ x: 0.0, y: 0.5 }}
                end={{ x: 1.0, y: 0.5 }}
                style={[styles.progressBarFill, { width: '31%' }]} 
              />
              <Text style={styles.progressText}>31%</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={styles.subCard}>
            <Text style={styles.cardLabelDark}>Total Spent</Text>
            <Text style={styles.statsAmount}>₱ 200.00</Text>
          </View>
          <View style={styles.subCard}>
            <Text style={styles.cardLabelDark}>Available</Text>
            <Text style={styles.statsAmount}>₱ 11,800.00</Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Upcoming payment</Text>
          <Text style={styles.seeAllText}>See all</Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.horizontalScroll}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          <View style={[styles.paymentCard, { backgroundColor: "#E6F4EA" }]}>
            <View style={styles.paymentCardHeader}>
              <View style={styles.brandIconPlaceholder} />
              <Text style={styles.dotsText}>•••</Text>
            </View>
            <Text style={styles.paymentCardTitle}>Adobe Premium</Text>
            <Text style={styles.paymentCardPrice}>₱ 580.16/month</Text>
            <Text style={styles.paymentCardDays}>2 days left</Text>
          </View>

          <View style={[styles.paymentCard, { backgroundColor: "#F0FDF4" }]}>
            <View style={styles.paymentCardHeader}>
              <View style={styles.brandIconPlaceholder} />
              <Text style={styles.dotsText}>•••</Text>
            </View>
            <Text style={styles.paymentCardTitle}>Apple Premium</Text>
            <Text style={styles.paymentCardPrice}>₱ 580.16/month</Text>
            <Text style={styles.paymentCardDays}>2 days left</Text>
          </View>
        </ScrollView>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <Text style={styles.seeAllText}>See all</Text>
        </View>

        <View style={styles.activitiesContainer}>
          <View style={styles.activityItem}>
            <View style={styles.activityLeft}>
              <View style={styles.activityIconPlaceholder} />
              <View>
                <Text style={styles.activityName}>Apple Inc.</Text>
                <Text style={styles.activityDate}>21 Sept, 03:02 PM</Text>
              </View>
            </View>
            <Text style={styles.activityAmountNegative}>-₱ 230.50</Text>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityLeft}>
              <View style={styles.activityIconPlaceholder} />
              <View>
                <Text style={styles.activityName}>Adobe</Text>
                <Text style={styles.activityDate}>21 Sept, 03:22 PM</Text>
              </View>
            </View>
            <Text style={styles.activityAmountNegative}>-₱ 130.50</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC", 
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 110 : 90, 
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "column",
  },
  welcomeText: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "600",
  },
  nameText: {
    fontSize: 14,
    color: '#64748B', 
    fontWeight: "bold",
    marginTop: -2,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchIconBg: {
    padding: 6,
    borderRadius: 99,
  },
  iconSearch: {
    width: 20,
    height: 20,
    tintColor: "black", 
  },
  iconCalendar: {
    width: 35,
    height: 35,
  },
  gradient1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 22,
    borderRadius: 24,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#14B8A6",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  allowanceLeft: {
    flexDirection: "column",
  },
  cardLabelLight: {
    color: "#094b3d", 
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  allowanceText: {
    fontSize: 32,
    color: "#ffffff",
    fontWeight: "bold",
  },
  addIconContainer: {
    backgroundColor: "white",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  iconAdd: {
    width: 18,
    height: 18,
    tintColor: "#0D9488",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  subCard: {
    flex: 1,
    backgroundColor: "#FFFFFF", 
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0", 
  },
  cardLabelDark: {
    color: "#0F766E", 
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  statsAmount: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "bold",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "bold",
  },
  seeAllText: {
    color: "#0D9488", 
    fontSize: 14,
    fontWeight: "600",
  },
  horizontalScroll: {
    marginBottom: 28,
    marginHorizontal: -20, 
  },
  horizontalScrollContent: {
    paddingHorizontal: 20, 
    gap: 12,
  },
  paymentCard: {
    width: 160,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  paymentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  brandIconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.06)", 
  },
  dotsText: {
    color: "rgba(0,0,0,0.3)",
    fontWeight: "bold",
  },
  paymentCardTitle: {
    color: "#1E293B",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  paymentCardPrice: {
    color: "#475569",
    fontSize: 13,
    marginBottom: 12,
  },
  paymentCardDays: {
    color: "#B45309", 
    fontSize: 12,
    fontWeight: "600",
  },
  activitiesContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activityIconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
  },
  activityName: {
    color: "#1E293B",
    fontSize: 15,
    fontWeight: "600",
  },
  activityDate: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 2,
  },
  activityAmountNegative: {
    color: "#EF4444", 
    fontSize: 15,
    fontWeight: "bold",
  },
  allowanceFullWidth: {
    width: '100%',
    flexDirection: 'column',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  totalLimitText: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "600",
    marginLeft: 4,
  },
  dateText: {
    fontSize: 13,
    color: "#052450",
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.45)', 
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    marginTop: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 16,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressText: {
    alignSelf: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B', 
    zIndex: 1,
  },
});