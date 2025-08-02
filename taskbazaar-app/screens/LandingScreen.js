import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, ScrollView, Alert, ActivityIndicator, SafeAreaView, TouchableOpacity
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';

export default function ProviderDashboardScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [providerLocation, setProviderLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const navigation = useNavigation();
  const webviewRef = useRef(null);

  // Use a single useEffect to handle all the setup
  useEffect(() => {
    const setupDashboard = async () => {
      setLoading(true);
      try {
        // Step 1: Get location permission and the provider's location
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Permission to access location was denied. Cannot find nearby tasks.');
          setLoading(false);
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        setProviderLocation({ latitude, longitude });
        setSelectedLocation({ latitude, longitude }); // Set default selected location
      } catch (error) {
        Alert.alert('Location Error', 'Could not get your location. Please check your settings.');
        console.error(error);
        setLoading(false);
      }
    };
    setupDashboard();
  }, []);

  // This useEffect now depends only on the selectedLocation
  useEffect(() => {
    const fetchTasks = async () => {
      if (!selectedLocation) {
        // Do not fetch tasks if a location isn't available
        return;
      }
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token missing. Please log in again.');
        navigation.navigate('Login');
        return;
      }
      
      const API_URL = 'http://192.168.10.13:5000/api/tasks/nearby';
      
      try {
        const res = await axios.get(API_URL, {
          params: {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            radius: 50
          },
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(res.data);
      } catch (err) {
        console.error('Error fetching tasks:', err.response?.data?.error || err.message);
        Alert.alert('Error', 'Failed to fetch tasks.');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [selectedLocation]);

  const handleWebViewMessage = (event) => {
    try {
      const { data } = event.nativeEvent;
      const newCoords = JSON.parse(data);
      setSelectedLocation(newCoords);
    } catch (e) {
      console.error('Failed to parse WebView message:', e);
    }
  };

  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text>{item.description}</Text>
      <Text style={styles.taskLocation}>📍 {item.location}</Text>
      <TouchableOpacity style={styles.acceptButton} onPress={() => Alert.alert('Task Accepted!', `You have accepted: ${item.title}`)}>
        <Text style={styles.acceptButtonText}>Accept Task</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  // Once all data is loaded, display the dashboard
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.greeting}>Hello, Provider!</Text>
        
        <WebView
          style={styles.map}
          originWhitelist={['*']}
          source={require('../map.html')}
          onLoad={() => {
              if (webviewRef.current && selectedLocation) {
                webviewRef.current.injectJavaScript(
                  `initMap(${JSON.stringify(selectedLocation)}, ${JSON.stringify(tasks)}); true;`
                );
              }
          }}
          onMessage={handleWebViewMessage}
          ref={webviewRef}
        />

        <Text style={styles.sectionTitle}>Available Tasks Nearby</Text>
        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id}
          renderItem={renderTask}
          scrollEnabled={false}
          ListEmptyComponent={() => <Text style={{ textAlign: 'center' }}>No tasks found in your area.</Text>}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    padding: 20,
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
  map: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 15,
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
  acceptButton: {
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});