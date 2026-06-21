import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Role = 'Personal' | 'Spender' | 'Sponsor';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const roles: { type: Role; description: string }[] = [
    { type: 'Personal', description: 'Manage your individual expenses and standard budgets.' },
    { type: 'Spender', description: 'Track group shared-costs and request payment structures.' },
    { type: 'Sponsor', description: 'Fund wallets, handle allowances, or oversee allocations.' },
  ];

  const handleFinalize = () => {
    if (selectedRole) {
      // Save metadata logic goes here
      router.push('/verify-email');
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
          style={[styles.primaryButton, !selectedRole && styles.disabledButton]}
          disabled={!selectedRole}
          onPress={handleFinalize}
        >
          <Text style={styles.buttonText}>Complete Registration</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F8' },
  innerContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  headerContainer: { marginBottom: 32 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1B3623', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#586A61', lineHeight: 22 },
  roleList: { marginBottom: 32 },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  selectedCard: {
    borderColor: '#58B0A5',
    backgroundColor: '#F0F9F8',
  },
  roleName: { fontSize: 18, fontWeight: 'bold', color: '#1B3623', marginBottom: 6 },
  selectedText: { color: '#58B0A5' },
  roleDescription: { fontSize: 14, color: '#586A61', lineHeight: 20 },
  primaryButton: {
    backgroundColor: '#1B3623',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: { backgroundColor: '#A3B4AB' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});