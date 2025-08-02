import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://192.168.10.15:5000/api/auth/login', { email, password });
      const { token, user } = res.data;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      navigation.navigate('Dashboard');
    } catch (err) {
      Alert.alert('Login failed', err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 28, marginBottom: 20, fontWeight: 'bold' }}>Login</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail}
        style={{ borderBottomWidth: 1, marginBottom: 12 }} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword}
        secureTextEntry style={{ borderBottomWidth: 1, marginBottom: 20 }} />
      <TouchableOpacity onPress={handleLogin}
        style={{ backgroundColor: '#4F46E5', padding: 15, borderRadius: 8 }}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}
