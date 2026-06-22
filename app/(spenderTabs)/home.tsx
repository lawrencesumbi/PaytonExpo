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
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
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
          colors={['#0A1A1A', '#1A3A3A', '#2D7A5E']}
          start={{ x: 0.0, y: 0.0 }}
          end={{ x: 1.0, y: 1.0 }}
          style={styles.gradient1}
        >
          <View style={styles.allowanceLeft}>
            <Text style={styles.cardLabelLight}>Total Allowance</Text>
            <Text style={styles.allowanceText}>₱ 12,000.00</Text>
          </View>
          <View style={styles.addIconContainer}>
            <Image source={require("../../components/icon-add.png")} style={styles.iconAdd} />
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
          <View style={[styles.paymentCard, { backgroundColor: "#1e3a2f" }]}>
            <View style={styles.paymentCardHeader}>
              <View style={styles.brandIconPlaceholder} />
              <Text style={styles.dotsText}>•••</Text>
            </View>
            <Text style={styles.paymentCardTitle}>Adobe Premium</Text>
            <Text style={styles.paymentCardPrice}>₱ 580.16/month</Text>
            <Text style={styles.paymentCardDays}>2 days left</Text>
          </View>

          <View style={[styles.paymentCard, { backgroundColor: "#2d3732" }]}>
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
    backgroundColor: "black",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "black",
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
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "400",
  },
  nameText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: "bold",
    marginTop: -4,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchIconBg: {
    padding: 5,
    borderRadius: 99,
  },
  iconSearch: {
    width: 20,
    height: 20,
    tintColor: "black", 
  },
  iconCalendar: {
    width: 30,
    height: 30,
  },
  gradient1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
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
    color: "#416955",
    fontSize: 13,
    fontWeight: "500",
    opacity: 0.8,
    marginBottom: 4,
  },
  allowanceText: {
    fontSize: 26,
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
    tintColor: "#163a24",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  subCard: {
    flex: 1,
    backgroundColor: "#16251e",
    padding: 16,
    borderRadius: 16,
  },
  cardLabelDark: {
    color: "#08a045",
    fontSize: 12,
    marginBottom: 6,
  },
  statsAmount: {
    color: "white",
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
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  seeAllText: {
    color: "#5cdbd0",
    fontSize: 14,
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
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dotsText: {
    color: "rgba(255,255,255,0.4)",
    fontWeight: "bold",
  },
  paymentCardTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  paymentCardPrice: {
    color: "#92bba7",
    fontSize: 13,
    marginBottom: 12,
  },
  paymentCardDays: {
    color: "#faf9d2",
    fontSize: 12,
    fontWeight: "500",
  },
  activitiesContainer: {
    backgroundColor: "#111b16",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1c2e25",
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
    backgroundColor: "#22332a",
  },
  activityName: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  activityDate: {
    color: "#688476",
    fontSize: 11,
    marginTop: 2,
  },
  activityAmountNegative: {
    color: "#ff6b6b",
    fontSize: 15,
    fontWeight: "bold",
  },
});