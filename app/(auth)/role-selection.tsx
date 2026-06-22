import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

type Role = 'Personal' | 'Spender' | 'Sponsor';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const roles: { type: Role; description: string }[] = [
    { type: 'Personal', description: 'Manage your individual expenses and standard budgets.' },
    { type: 'Spender', description: 'Track group shared-costs and request payment structures.' },
    { type: 'Sponsor', description: 'Fund wallets, handle allowances, or oversee allocations.' },
  ];

  const handleFinalize = async () => {
    if (!selectedRole) return;

    setIsLoading(true);

    try {
      // 1. Get the current authenticated user's ID securely from the active session
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert("Session Expired", "No active session found. Please log in again.");
        router.replace('/login');
        return;
      }

      // 2. Update the profile row with the selected role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', user.id);

      if (updateError) {
        Alert.alert("Error updating role", updateError.message);
        return;
      }

      // 3. Send them directly to their dedicated feature stack layout
      if (selectedRole === 'Personal') {
        router.replace('/(personalTabs)/home');
      } else if (selectedRole === 'Spender') {
        router.replace('/(spenderTabs)/home');
      } else if (selectedRole === 'Sponsor') {
        router.replace('/(sponsorTabs)/home');
      }

    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>Select the primary account feature stack that fits your needs.</Text>
        </View>

        <View style={styles.roleList}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.type}
              style={[
                styles.roleCard,
                selectedRole === role.type && styles.selectedCard,
              ]}
              disabled={isLoading}
              onPress={() => setSelectedRole(role.type)}
            >
              <Text style={[styles.roleName, selectedRole === role.type && styles.selectedText]}>
                {role.type}
              </Text>
              <Text style={styles.roleDescription}>{role.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton, 
            (!selectedRole || isLoading) && styles.disabledButton
          ]}
          disabled={!selectedRole || isLoading}
          onPress={handleFinalize}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Complete Registration</Text>
          )}
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F7F9F8' 
  },
  innerContainer: { 
    flex: 1, 
    padding: 24, 
    justifyContent: 'center' 
  },
  headerContainer: { 
    marginBottom: 32 
  },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#1B3623', 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 15, 
    color: '#586A61', 
    lineHeight: 22 
  },
  roleList: { 
    marginBottom: 32 
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCard: {
    borderColor: '#58B0A5',
    backgroundColor: '#F0F9F8',
  },
  roleName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1B3623', 
    marginBottom: 6 
  },
  selectedText: { 
    color: '#58B0A5' 
  },
  roleDescription: { 
    fontSize: 14, 
    color: '#586A61', 
    lineHeight: 20 
  },
  primaryButton: {
    backgroundColor: '#1B3623',
    borderRadius: 30, // Updated to 30 to match your pill-shaped theme in login/register
    height: 56,      // Matching the standard size of your other forms
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B3623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  disabledButton: { 
    backgroundColor: '#A3B4AB',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});