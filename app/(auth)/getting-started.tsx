 // app/(auth)/getting-started.tsx
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

// Color palette configured with a clean white primary background
const DESIGN_COLORS = {
  bgLight: '#FFFFFF',       // Primary white background
  bgCard: '#F3F4F6',        // Light gray background for mockup cards
  brandGreen: '#84CC16',    // Vibrant brand accent green
  textDark: '#111827',      // Bold dark text for headings and primary labels
  textMuted: '#6B7280',     // Muted gray text for quotes and descriptions
  borderLight: '#E5E7EB',   // Subtle light gray border lines
};

// Onboarding structural flow steps mapping your physical sketch layout
const ONBOARDING_STEPS = [
  {
    id: 'loading',
    title: 'Payton',
    description: 'Loading your financial ecosystem...',
  },
  {
    id: 'track',
    title: 'Track Expense',
    description: '"Watch your leaks, or small expenses will sink a large ship." — Payton App Analytics.',
  },
  {
    id: 'reminders',
    title: 'Smart Reminders',
    description: '"An organized wallet leads to a peaceful mind." — Stay ahead of your upcoming obligations.',
  },
  {
    id: 'splitting',
    title: 'Bill Splitting',
    description: '"Clear accounts make long friendships." — Divide shared expenses fairly and instantly.',
  },
  {
    id: 'get-started',
    title: "Let's Get Started!",
    description: 'With Payton, sending, receiving, and managing your money is easier than ever before.',
  }
];

export default function GettingStartedScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // Simulating the auto-loading timeout splash screen for Step 0
  useEffect(() => {
    if (currentStep === 0) {
      const timer = setTimeout(() => {
        setCurrentStep(1); // Auto-advances directly to Track Expense dashboard
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRedirectToLogin = () => {
    router.push('/(auth)/login'); 
  };

  const step = ONBOARDING_STEPS[currentStep];

  // Render Step 0: Loading Screen with Payton Logo
  if (currentStep === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContent}>
          <Image 
            source={require('../../assets/images/logo-light1.png')} 
            style={styles.mainLogo}
            resizeMode="contain"
          />
          <Text style={styles.loadingText}>{step.title}</Text>
          <ActivityIndicator size="small" color={DESIGN_COLORS.brandGreen} style={{ marginTop: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        
        {/* Top Graphical Zone reflecting UI element cards */}
        <View style={styles.graphicContainer}>
          {step.id === 'get-started' ? (
            <Image 
              source={require('../../assets/images/logo-light1.png')} 
              style={styles.getStartedLogo}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.mockupCard}>
              <View style={styles.mockupTopBar}>
                <View style={[styles.mockupPill, { backgroundColor: DESIGN_COLORS.brandGreen }]} />
              </View>
              
              {step.id === 'track' && (
                <View style={styles.mockupContent}>
                  <Text style={styles.cardLabel}>Expense Summary</Text>
                  <Text style={styles.cardValue}>$1,240.50</Text>
                  <View style={styles.mockupChartRow}>
                    <View style={[styles.chartBar, { height: 35, backgroundColor: DESIGN_COLORS.brandGreen }]} />
                    <View style={[styles.chartBar, { height: 65, backgroundColor: DESIGN_COLORS.brandGreen }]} />
                    <View style={[styles.chartBar, { height: 45, backgroundColor: DESIGN_COLORS.brandGreen }]} />
                  </View>
                </View>
              )}

              {step.id === 'reminders' && (
                <View style={styles.mockupContentCentered}>
                  <View style={styles.iconCircle}>
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 }}>🔔</Text>
                  </View>
                  <Text style={styles.cardValueText}>Electricity Bill Due</Text>
                  <Text style={styles.cardSubText}>In 2 days</Text>
                </View>
              )}

              {step.id === 'splitting' && (
                <View style={styles.mockupContent}>
                  <Text style={styles.cardLabel}>Group Expense Split</Text>
                  <View style={styles.splitRow}><Text style={styles.darkText}>You owe</Text><Text style={styles.greenText}>$12.50</Text></View>
                  <View style={styles.splitRow}><Text style={styles.darkText}>Alex owes</Text><Text style={styles.greenText}>$12.50</Text></View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Text Content Section for Dashboard Titles and Quotes */}
        <View style={styles.textContainer}>
          <Text style={styles.heading}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>
        </View>

        {/* Dynamic Pagination Dashboard Indicator Dots */}
        <View style={styles.indicatorContainer}>
          {ONBOARDING_STEPS.slice(1).map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.dot, 
                currentStep - 1 === index ? styles.activeDot : styles.inactiveDot
              ]} 
            />
          ))}
        </View>

        {/* Action Buttons Interface Layer */}
        <View style={styles.actionContainer}>
          {step.id === 'track' && (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleRedirectToLogin}>
                <Text style={styles.secondaryButtonText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButtonHalf} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {(step.id === 'reminders' || step.id === 'splitting') && (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButtonHalf} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {step.id === 'get-started' && (
            <TouchableOpacity style={styles.primaryButtonFull} onPress={handleRedirectToLogin}>
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: DESIGN_COLORS.bgLight 
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainLogo: {
    width: 150,
    height: 150,
  },
  loadingText: {
    color: DESIGN_COLORS.textDark,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 16,
    letterSpacing: 1,
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 24, 
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 40
  },
  graphicContainer: {
    flex: 1.1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  getStartedLogo: { 
    width: 130, 
    height: 130,
  },
  mockupCard: {
    width: width * 0.68,
    height: '80%',
    backgroundColor: DESIGN_COLORS.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.borderLight,
    padding: 20,
    justifyContent: 'space-between',
  },
  mockupTopBar: {
    alignItems: 'center',
    width: '100%',
  },
  mockupPill: {
    width: 48,
    height: 5,
    borderRadius: 3,
  },
  mockupContent: {
    flex: 1,
    justifyContent: 'center',
  },
  mockupContentCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    color: DESIGN_COLORS.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  cardValue: {
    color: DESIGN_COLORS.textDark,
    fontSize: 26,
    fontWeight: '700',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: DESIGN_COLORS.textDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardValueText: {
    color: DESIGN_COLORS.textDark,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardSubText: {
    color: DESIGN_COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  mockupChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
    marginTop: 15,
  },
  chartBar: {
    width: 18,
    borderRadius: 4,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_COLORS.borderLight,
  },
  darkText: { color: DESIGN_COLORS.textDark, fontSize: 14 },
  greenText: { color: DESIGN_COLORS.brandGreen, fontSize: 14, fontWeight: '600' },
  textContainer: { 
    width: '100%', 
    alignItems: 'center', 
    paddingHorizontal: 8,
  },
  heading: { 
    color: DESIGN_COLORS.textDark, 
    fontSize: 26, 
    fontWeight: '700', 
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    color: DESIGN_COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: DESIGN_COLORS.brandGreen,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: DESIGN_COLORS.borderLight,
  },
  actionContainer: { 
    width: '100%',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryButtonHalf: {
    flex: 1,
    backgroundColor: DESIGN_COLORS.brandGreen, 
    height: 56, 
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  primaryButtonFull: {
    width: '100%',
    backgroundColor: DESIGN_COLORS.brandGreen, 
    height: 56, 
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    height: 56, 
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DESIGN_COLORS.borderLight,
  },
  primaryButtonText: { 
    color: '#FFFFFF', // White text inside buttons for contrast
    fontSize: 16, 
    fontWeight: '700' 
  },
  secondaryButtonText: {
    color: DESIGN_COLORS.textDark,
    fontSize: 16,
    fontWeight: '600'
  }
});