import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Location from 'expo-location';
import { API_BASE_URL } from '../config';
import OSMMap from './OSMMap';

export default function EmployeeDashboard() {
  const [tasks, setTasks] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location access is required.');
      setLoading(false);
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});
    const coords = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
    setLocation(coords);
    fetchTasks(coords);
  };

  const fetchTasks = async (coords) => {
    setLoading(true);
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tasks/nearby`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (err) {
      console.log('Error fetching tasks:', err.message);
    }
    setLoading(false);
  };

  const acceptTask = async (taskId) => {
    const token = await AsyncStorage.getItem('token');
    try {
      await axios.post(`${API_BASE_URL}/api/tasks/${taskId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Task accepted');
      fetchTasks(location);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to accept task');
    }
  };

  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor:
              item.status === 'open' ? '#10B981' :
              item.status === 'assigned' ? '#3B82F6' :
              '#EF4444'
          }
        ]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.taskDesc}>{item.description}</Text>
      {item.budget && <Text style={styles.taskBudget}>💰 PKR {item.budget}</Text>}
      <TouchableOpacity
        style={styles.acceptBtn}
        onPress={() => acceptTask(item._id)}
      >
        <Text style={styles.acceptText}>Accept Task</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Nearby Tasks</Text>

      {/* Map View */}
      <View style={styles.mapContainer}>
        {location ? (
          <OSMMap location={location} setLocation={setLocation} tasks={tasks} />
        ) : (
          <ActivityIndicator size="large" color="#10B981" />
        )}
      </View>

      {/* Task List */}
      {loading ? (
        <ActivityIndicator size="large" color="#10B981" />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id}
          renderItem={renderTask}
          ListEmptyComponent={<Text style={styles.noTasks}>No nearby tasks available</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 10 },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  mapContainer: {
    height: 300,
    marginHorizontal: 5,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    backgroundColor: '#ddd'
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 6,
    elevation: 2
  },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  taskDesc: { color: '#4b5563', marginVertical: 5 },
  taskBudget: { fontWeight: 'bold', marginBottom: 8 },
  acceptBtn: {
    backgroundColor: '#10B981',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  acceptText: { color: '#fff', fontWeight: 'bold' },
  noTasks: { textAlign: 'center', color: '#6b7280', marginTop: 20 }
});
