// screens/RegisterScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // You can also add picker if needed

  const handleRegister = async () => {
    if (!name || !email || !password || !role) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const res = await axios.post('http://192.168.10.9:5000/api/auth/register', {
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
