import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function Screen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Spender Dashboard Component</Text>
        <Text style={styles.subtitle}>Customize features for individual financial tracking.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F8' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1B3623', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#586A61', textAlign: 'center' },
});