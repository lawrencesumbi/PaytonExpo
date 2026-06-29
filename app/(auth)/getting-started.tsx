 // app/(auth)/getting-started.tsx
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Platform
} from 'react-native';

const { width } = Dimensions.get('window');

const DESIGN_COLORS = {
  brandGreen: '#166534',     
  textDark: '#0F172A',       
  textMuted: '#64748B',      
  borderLight: '#E2E8F0',    
};

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

  useEffect(() => {
    if (currentStep === 0) {
      const timer = setTimeout(() => {
        setCurrentStep(1); 
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
    router.push('/login'); 
  };

  const step = ONBOARDING_STEPS[currentStep];

  // Step 0: Splash Loading Layout 
  if (currentStep === 0) {
    return (
      <LinearGradient
        colors={['#ffffff', '#ffffff']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContent}>
            <View style={styles.gradientLogoContainer}>
              <Image 
                source={require('../../assets/images/logo-light1.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.loadingText}>{step.title}</Text>
            <ActivityIndicator size="small" color={DESIGN_COLORS.brandGreen} style={{ marginTop: 24 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#ffffff', '#ffffff']} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
          <View style={styles.innerContainer}>
            
            {/* Logo area shown EXCLUSIVELY on the final 'get-started' step */}
            {step.id === 'get-started' && (
              <View style={styles.gradientLogoContainer}>
                <Image 
                  source={require('../../assets/images/logo-light1.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            )}
            
            {/* Floating Oval Content Presentation Card */}
            <View style={styles.card}>
              
              {/* Dashboard Preview Module Container */}
              {step.id !== 'get-started' && (
                <View style={styles.graphicContainer}>
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
                </View>
              )}

              {/* Messaging Context Block */}
              <View style={styles.textContainer}>
                <Text style={styles.heading}>{step.title}</Text>
                <Text style={styles.description}>{step.description}</Text>
              </View>

              {/* Progress Stepper Bullets */}
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

              {/* EMBEDDED NAVIGATION CONTAINER: Now inside the Card structure */}
              <View style={styles.embeddedNavigationContainer}>
                {step.id === 'get-started' ? (
                  <TouchableOpacity style={styles.primaryButtonFull} onPress={handleRedirectToLogin}>
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.navigationRow}>
                    
                    {/* Left Action Text Navigation Anchor */}
                    {step.id === 'track' ? (
                      <TouchableOpacity style={styles.navBarTextButton} onPress={handleRedirectToLogin}>
                        <Text style={styles.navBarSecondaryText}>Skip</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.navBarTextButton} onPress={handleBack}>
                        <Text style={styles.navBarSecondaryText}>Back</Text>
                      </TouchableOpacity>
                    )}

                    {/* Right Action Capsule Accent Anchor */}
                    <TouchableOpacity style={styles.primaryButtonHalf} onPress={handleNext}>
                      <Text style={styles.primaryButtonText}>Continue</Text>
                    </TouchableOpacity>

                  </View>
                )}
              </View>

            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center', 
  },
  innerContainer: { 
    paddingHorizontal: 16, 
    paddingVertical: 24,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  gradientLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32, 
    width: '100%',
    height: 160, 
    ...Platform.select({
      ios: {
        shadowColor: '#166534',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoImage: {
    width: '100%', 
    height: '100%', 
  },
  loadingText: {
    color: DESIGN_COLORS.textDark,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 16,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 44, 
    paddingHorizontal: 24,
    paddingTop: 32, 
    paddingBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#1e293b',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 28,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  graphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 28,
  },
  mockupCard: {
    width: '100%',
    height: 170,
    backgroundColor: '#F8FAFC',
    borderRadius: 30, 
    borderWidth: 1,
    borderColor: DESIGN_COLORS.borderLight,
    padding: 18,
    justifyContent: 'space-between',
  },
  mockupTopBar: {
    alignItems: 'center',
    width: '100%',
  },
  mockupPill: {
    width: 40,
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
    marginBottom: 2,
  },
  cardValue: {
    color: DESIGN_COLORS.textDark,
    fontSize: 24,
    fontWeight: '700',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DESIGN_COLORS.textDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardValueText: {
    color: DESIGN_COLORS.textDark,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardSubText: {
    color: DESIGN_COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  mockupChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
    marginTop: 8,
    paddingHorizontal: 10,
  },
  chartBar: {
    width: 20,
    borderRadius: 6,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_COLORS.borderLight,
  },
  darkText: { color: DESIGN_COLORS.textDark, fontSize: 14 },
  greenText: { color: DESIGN_COLORS.brandGreen, fontSize: 14, fontWeight: '600' },
  textContainer: { 
    width: '100%', 
    alignItems: 'center', 
    marginBottom: 20,
  },
  heading: { 
    color: DESIGN_COLORS.textDark, 
    fontSize: 24, 
    fontWeight: '700', 
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    color: DESIGN_COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
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
  embeddedNavigationContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', 
    width: '100%',
    gap: 32, 
  },
  navBarTextButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  navBarSecondaryText: {
    color: DESIGN_COLORS.brandGreen,
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButtonHalf: {
    backgroundColor: DESIGN_COLORS.brandGreen, 
    height: 52, 
    paddingHorizontal: 36,
    borderRadius: 26, 
    justifyContent: 'center', 
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#166534',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  primaryButtonFull: {
    width: '100%',
    backgroundColor: DESIGN_COLORS.brandGreen, 
    height: 54, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#166534',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  primaryButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600' 
  }
});