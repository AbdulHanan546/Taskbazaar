import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function LandingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to TaskBazaar</Text>
      <Text style={styles.subtitle}>Find and post local tasks with ease</Text>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}
        style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}
        style={[styles.button, { backgroundColor: '#6366F1' }]}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: '#4F46E5', padding: 16, borderRadius: 10, marginBottom: 12 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600' }
});
