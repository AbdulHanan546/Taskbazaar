import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function EmployeeDashboard() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const token = await AsyncStorage.getItem('token');
    const res = await axios.get('http://192.168.10.15:5000/api/tasks/nearby', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTasks(res.data);
  };

  const acceptTask = async (taskId) => {
    const token = await AsyncStorage.getItem('token');
    try {
      await axios.post(`http://192.168.10.15:5000/api/tasks/${taskId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Task accepted');
      fetchTasks();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to accept task');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Available Tasks</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderWidth: 1, marginVertical: 8 }}>
            <Text>{item.title}</Text>
            <Text>{item.description}</Text>
            <TouchableOpacity
              onPress={() => acceptTask(item._id)}
              style={{ backgroundColor: 'green', padding: 8, marginTop: 5 }}
            >
              <Text style={{ color: '#fff' }}>Accept Task</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
