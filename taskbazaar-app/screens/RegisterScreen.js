// screens/RegisterScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config';
export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // You can also add picker if needed
const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

  const verifyEmailExists = async (email) => {
  try {
    // Example using Abstract API (replace with your API key)
    const apiKey = '250789ef0cc44263bd5d520c91774016';
    const response = await axios.get(`https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${email}`);
    
    // You can check response.data.is_valid_format.value, is_smtp_valid.value, etc.
    return response.data.is_smtp_valid.value;  // true if email exists
  } catch (error) {
    console.log('Email verification API error:', error.message);
    // Optional: allow registration if API fails or block it
    return false;
  }
};

const handleRegister = async () => {
  if (!name || !email || !password || !role) {
    Alert.alert('Error', 'Please fill in all fields.');
    return;
  }

  if (!validateEmailFormat(email)) {
    Alert.alert('Invalid Email', 'Please enter a valid email address.');
    return;
  }

  const emailExists = await verifyEmailExists(email);
  if (!emailExists) {
    Alert.alert('Invalid Email', 'Email does not exist or is not reachable.');
    return;
  }

  try {
    const res = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      name,
      email,
      password,
      role
    });

    Alert.alert('Success', 'Registered successfully! Please login.');
    navigation.navigate('Login');
  } catch (err) {
    console.log(err.response?.data || err.message);
    Alert.alert('Registration Failed', err.response?.data?.message || 'Server error');
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register for TaskBazaar</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        autoCapitalize="words"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize='none'
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        autoCapitalize='none'
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Role (user/provider)"
        autoCapitalize='none'
        value={role}
        onChangeText={setRole}
      />
      <Button title="Register" onPress={handleRegister} />
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Sign in here.</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 12, borderRadius: 5 },
  link: { marginTop: 12, textAlign: 'center', color: '#4F46E5' }
});
