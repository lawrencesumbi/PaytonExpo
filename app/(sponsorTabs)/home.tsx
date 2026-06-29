  // app/(sponsorTabs)/home.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  StatusBar as NativeStatusBar,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

interface AllowanceDashboardItem {
  id: string;
  allowance_name: string;
  amount: number;
  start_date: string;
  end_date: string;
  spender_name: string;
}

/* ---------- Dark Green Theme Tokens ---------- */
const COLORS = {
  bg: '#0A1A14', // Dark green-black background
  surface: '#0D2B1F', // Dark green surface
  surfaceLight: '#113728', // Slightly lighter dark green
  ink: '#E8F5E9', // Light green-white text
  inkSoft: '#A5D6A7', // Soft green text
  muted: '#6B9B7E', // Muted green
  hairline: '#1A3D2C', // Dark green border
  brand: '#1B5E20', // Deep green
  brandSoft: '#0D3320', // Very dark green
  brandBorder: '#1A4D2E', // Dark green border
  accent: '#4CAF50', // Bright green accent
  danger: '#EF5350', // Red for danger
  gold: '#FFD700', // Gold accent
};

export default function HomeScreen() {
  const router = useRouter();
  const [allowances, setAllowances] = useState<AllowanceDashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [sponsorProfile, setSponsorProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);

  // Animated values for hero card shadow - dark theme
  const heroShadowOpacity = useRef(new Animated.Value(0.4)).current;
  const heroShadowRadius = useRef(new Animated.Value(15)).current;
  const heroElevation = useRef(new Animated.Value(8)).current;
  
  // Store animations for each card
  const cardAnimations = useRef<{ [key: string]: {
    fadeSlide: Animated.Value;
    float: Animated.Value;
    shadowOpacity: Animated.Value;
    shadowRadius: Animated.Value;
    elevation: Animated.Value;
    glowOpacity: Animated.Value;
  } }>({}).current;

  // Initialize animations for a single card
  const initializeCardAnimations = (id: string) => {
    if (!cardAnimations[id]) {
      cardAnimations[id] = {
        fadeSlide: new Animated.Value(0),
        float: new Animated.Value(0),
        shadowOpacity: new Animated.Value(0.5),
        shadowRadius: new Animated.Value(8),
        elevation: new Animated.Value(6),
        glowOpacity: new Animated.Value(0.3),
      };
    }
  };

  // Animate card entry with floating and dark shadows
  const animateCardIn = (id: string) => {
    initializeCardAnimations(id);
    const anims = cardAnimations[id];
    
    // Reset values
    anims.fadeSlide.setValue(0);
    anims.float.setValue(0);
    anims.shadowOpacity.setValue(0.5);
    anims.shadowRadius.setValue(8);
    anims.elevation.setValue(6);
    anims.glowOpacity.setValue(0.3);
    
    // Entry animation
    Animated.parallel([
      // Smooth slide up and fade in
      Animated.timing(anims.fadeSlide, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Dark shadow breathing
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(anims.shadowOpacity, {
              toValue: 0.8,
              duration: 3000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
            Animated.timing(anims.shadowRadius, {
              toValue: 16,
              duration: 3000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
            Animated.timing(anims.elevation, {
              toValue: 12,
              duration: 3000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
            Animated.timing(anims.glowOpacity, {
              toValue: 0.15,
              duration: 3000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
          ]),
          Animated.parallel([
            Animated.timing(anims.shadowOpacity, {
              toValue: 0.5,
              duration: 3000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
            Animated.timing(anims.shadowRadius, {
              toValue: 8,
              duration: 3000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
            Animated.timing(anims.elevation, {
              toValue: 6,
              duration: 3000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
            Animated.timing(anims.glowOpacity, {
              toValue: 0.3,
              duration: 3000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
          ]),
        ])
      ),
    ]).start();
  };

  useEffect(() => {
    // Hero card dark shadow animation
    const heroAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(heroShadowOpacity, {
            toValue: 0.7,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(heroShadowRadius, {
            toValue: 25,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(heroElevation, {
            toValue: 16,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(heroShadowOpacity, {
            toValue: 0.4,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(heroShadowRadius, {
            toValue: 15,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(heroElevation, {
            toValue: 8,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ]),
      ])
    );
    
    heroAnimation.start();
    
    return () => heroAnimation.stop();
  }, []);

  const fetchDashboardData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();
      setSponsorProfile(profile);

      const { data, error } = await supabase
        .from('allowances')
        .select(`
          id, allowance_name, amount, start_date, end_date,
          profiles!allowances_spender_id_fkey (full_name)
        `)
        .eq('sponsor_id', user.id)
        .order('received_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        id: item.id,
        allowance_name: item.allowance_name,
        amount: Number(item.amount),
        start_date: item.start_date,
        end_date: item.end_date,
        spender_name: item.profiles?.full_name || 'Unknown',
      }));

      setAllowances(formatted);
      setTotalAllocated(formatted.reduce((s, i) => s + i.amount, 0));
      
      // Animate each card in with staggered delay
      formatted.forEach((item, index) => {
        setTimeout(() => animateCardIn(item.id), index * 150);
      });
    } catch (e: any) {
      console.error('Error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Reset all card animations
    Object.keys(cardAnimations).forEach(key => {
      delete cardAnimations[key];
    });
    await fetchDashboardData(true);
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert('Delete Allowance', 'Are you sure you want to delete this?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (cardAnimations[id]) {
            Animated.timing(cardAnimations[id].fadeSlide, {
              toValue: 0,
              duration: 300,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }).start(async () => {
              const { error } = await supabase.from('allowances').delete().eq('id', id);
              if (error) Alert.alert('Error', 'Failed to delete allowance.');
              else {
                delete cardAnimations[id];
                fetchDashboardData();
              }
            });
          } else {
            const { error } = await supabase.from('allowances').delete().eq('id', id);
            if (error) Alert.alert('Error', 'Failed to delete allowance.');
            else fetchDashboardData();
          }
        },
      },
    ]);
  };

  const handleEdit = (item: AllowanceDashboardItem) =>
    router.push({ pathname: '/allowance', params: { id: item.id } });

  const initials = (sponsorProfile?.full_name || 'S')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {sponsorProfile?.full_name || 'Sponsor'}
            </Text>
          </View>
          {sponsorProfile?.avatar_url ? (
            <Image source={{ uri: sponsorProfile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>

        {/* Hero Card with Dark Animated Shadow */}
        <Animated.View style={[
          styles.heroShadow,
          {
            shadowOpacity: heroShadowOpacity,
            shadowRadius: heroShadowRadius,
            elevation: heroElevation,
          }
        ]}>
          <LinearGradient
            colors={['#1B5E20', '#0D3B1F', '#061A10']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.orbLg} />
            <View style={styles.orbSm} />

            <View style={styles.heroTopRow}>
              <Text style={styles.heroLabel}>Total Allocated</Text>
              <View style={styles.heroBrandMark}>
                <View style={styles.heroBrandDot} />
                <Text style={styles.heroBrandText}>Sponsor</Text>
              </View>
            </View>

            <Text style={styles.heroAmount}>
              ₱{totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>

            <View style={styles.heroDivider} />

            <View style={styles.heroFooter}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Recipients</Text>
                <Text style={styles.heroStatValue}>{allowances.length}</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Status</Text>
                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.heroStatValue}>Active</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Allowances</Text>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{allowances.length}</Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={allowances}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listScrollContent}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.accent]}
                tintColor={COLORS.accent}
                progressBackgroundColor={COLORS.surface}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyCardShadow}>
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="wallet-outline" size={28} color={COLORS.accent} />
                  </View>
                  <Text style={styles.emptyTitle}>No active allowances</Text>
                  <Text style={styles.emptySubtitle}>
                    Head to the Members tab to select a person and set up their first allowance.
                  </Text>
                  <TouchableOpacity
                    style={styles.navigateBtn}
                    activeOpacity={0.85}
                    onPress={() => router.push('/(sponsorTabs)/members')}
                  >
                    <Text style={styles.navigateBtnText}>Go to Members</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            }
            renderItem={({ item, index }) => {
              initializeCardAnimations(item.id);
              const anims = cardAnimations[item.id];
              
              // Light floating interpolation
              const floatY = anims.float?.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, -1.5, 0],
              }) || 0;

              return (
                <Animated.View style={[
                  styles.floatingCardShadow,
                  {
                    opacity: anims.fadeSlide,
                    transform: [
                      { 
                        translateY: anims.fadeSlide.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        })
                      },
                      {
                        scale: anims.fadeSlide.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.98, 1],
                        }),
                      },
                    ],
                    shadowOpacity: anims.shadowOpacity,
                    shadowRadius: anims.shadowRadius,
                    elevation: anims.elevation,
                  },
                ]}>
                  {/* Green glow effect */}
                  <Animated.View style={[
                    styles.glowEffect,
                    {
                      opacity: anims.glowOpacity,
                    }
                  ]} />
                  
                  <View style={styles.allowanceCard}>
                    <View style={styles.cardLeft}>
                      <View style={styles.iconContainer}>
                        <Ionicons name="wallet" size={16} color={COLORS.accent} />
                      </View>
                      <View style={styles.infoBlock}>
                        <Text style={styles.allowanceName} numberOfLines={1}>
                          {item.allowance_name}
                        </Text>
                        <Text style={styles.spenderName} numberOfLines={1}>
                          {item.spender_name}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardRight}>
                      <Text style={styles.cardAmountText}>
                        ₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Text>
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          onPress={() => handleEdit(item)}
                          style={styles.actionBtn}
                          activeOpacity={0.6}
                        >
                          <Ionicons name="pencil" size={13} color={COLORS.inkSoft} />
                        </TouchableOpacity>
                        <View style={styles.actionDivider} />
                        <TouchableOpacity
                          onPress={() => handleDelete(item.id)}
                          style={styles.actionBtn}
                          activeOpacity={0.6}
                        >
                          <Ionicons name="trash" size={13} color={COLORS.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0,
  },
  content: { flex: 1, paddingHorizontal: 20 },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
    marginTop: 12,
  },
  welcomeText: { fontSize: 12, color: COLORS.muted, fontWeight: '500', letterSpacing: 0.2 },
  userName: { fontSize: 22, fontWeight: '700', color: COLORS.ink, letterSpacing: -0.5, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: COLORS.hairline },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.brandSoft,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.brandBorder,
  },
  avatarInitials: { color: COLORS.accent, fontWeight: '700', fontSize: 13, letterSpacing: 0.3 },

  /* Hero */
  heroShadow: { 
    borderRadius: 22, 
    marginBottom: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
  },
  heroCard: {
    padding: 22,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
  },
  orbLg: {
    position: 'absolute',
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(76,175,80,0.05)',
    top: -90, right: -70,
  },
  orbSm: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,215,0,0.05)',
    bottom: -50, left: -40,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroBrandMark: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroBrandDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: COLORS.gold, marginRight: 6,
  },
  heroBrandText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10, fontWeight: '700', letterSpacing: 0.6,
  },
  heroAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    marginTop: 4,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 18,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStat: { flex: 1 },
  heroStatDivider: {
    width: 1, height: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 14,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10, fontWeight: '600',
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroStatValue: {
    color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: -0.2,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#4ADE80', marginRight: 6,
  },

  /* Section header */
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 14, paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  countPill: {
    marginLeft: 8,
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: COLORS.brandSoft,
    borderWidth: 1, borderColor: COLORS.brandBorder,
  },
  countPillText: {
    fontSize: 10, fontWeight: '700',
    color: COLORS.accent, letterSpacing: 0.3,
  },

  listScrollContent: { paddingBottom: 110 },

  /* Floating Card with dark animated shadow */
  floatingCardShadow: {
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    backgroundColor: 'transparent',
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    opacity: 0,
  },
  allowanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 12 },
  iconContainer: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.brandSoft,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.brandBorder,
  },
  infoBlock: { marginLeft: 12, flex: 1 },
  allowanceName: {
    fontSize: 14, fontWeight: '700',
    color: COLORS.ink, letterSpacing: -0.2,
  },
  spenderName: {
    fontSize: 12, color: COLORS.inkSoft,
    fontWeight: '500', marginTop: 2,
  },

  cardRight: { alignItems: 'flex-end', justifyContent: 'space-between', height: 44 },
  cardAmountText: {
    fontSize: 14, fontWeight: '700',
    color: COLORS.accent, letterSpacing: -0.1,
  },
  actionRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.hairline,
    alignItems: 'center', height: 24, paddingHorizontal: 2,
  },
  actionBtn: { width: 24, height: 20, justifyContent: 'center', alignItems: 'center' },
  actionDivider: { width: 1, height: 12, backgroundColor: COLORS.hairline },

  /* Empty state with shadow */
  emptyCardShadow: {
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyContainer: {
    alignItems: 'center', padding: 28,
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.hairline,
  },
  emptyIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.brandSoft,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1, borderColor: COLORS.brandBorder,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  emptySubtitle: {
    fontSize: 13, color: COLORS.inkSoft,
    textAlign: 'center', marginTop: 6, marginBottom: 20,
    lineHeight: 18, paddingHorizontal: 16,
  },
  navigateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.accent,
    paddingVertical: 11, paddingHorizontal: 18,
    borderRadius: 10,
  },
  navigateBtnText: { color: '#0A1A14', fontWeight: '700', fontSize: 12, letterSpacing: 0.2 },
}); 