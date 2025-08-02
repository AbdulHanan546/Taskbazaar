import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Button, Alert, StyleSheet, FlatList, ScrollView
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen() {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState('');
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setName(user.name);
        fetchTasks(); // fetch tasks after setting name
      }
    };

    fetchUserInfo();
  }, []);

  const fetchTasks = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await axios.get('http://192.168.10.13:5000/api/tasks/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (err) {
      console.log('Error fetching tasks:', err.message);
    }
  };

  const handlePostTask = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      await axios.post(
        'http://192.168.10.13:5000/api/tasks',
        {
          title,
          description: desc,
          location,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert('Success', 'Task posted successfully!');
      setTitle('');
      setDesc('');
      setLocation('');
      fetchTasks(); // refresh tasks list
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to post task');
    }
  };

  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text>{item.description}</Text>
      <Text style={styles.taskLocation}>📍 {item.location}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Hello, {name}</Text>

      <Text style={styles.sectionTitle}>Create New Task</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter task title"
      />
      <TextInput
        style={styles.input}
        value={desc}
        onChangeText={setDesc}
        placeholder="Enter task description"
      />
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="Enter location"
      />
      <Button title="Post Task" onPress={handlePostTask} />

      <Text style={styles.sectionTitle}>Your Posts</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        renderItem={renderTask}
        scrollEnabled={false}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f9fafb',
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskLocation: {
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
