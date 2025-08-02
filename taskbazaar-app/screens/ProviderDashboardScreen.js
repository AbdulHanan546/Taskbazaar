import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity
} from 'react-native';
import axios from 'axios';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'react-native';

export default function ProviderDashboardScreen() {
  const [location, setLocation] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
const logout = async (navigation) => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('role');
    navigation.replace('Login'); // or navigate, depending on your navigation setup
  } catch (err) {
    console.log('Logout error:', err);
  }
};
const navigation = useNavigation();

  useEffect(() => {
    const loadLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location denied', 'Cannot get nearby tasks without location.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      setLocation(coords);
    };

    loadLocation();
  }, []);

  useEffect(() => {
    const fetchNearbyTasks = async () => {
      if (!location) return;
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get('http://192.168.10.15:5000/api/tasks/nearby', {
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
            radius: 500,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTasks(res.data);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyTasks();
  }, [location]);

  const renderTask = ({ item }) => (
  <View style={styles.taskCard}>
    <Text style={styles.taskTitle}>{item.title}</Text>
    <Text>{item.description}</Text>
    <Text style={styles.locationText}>
      📍 {item.location?.coordinates?.join(', ') || 'Unknown'}
    </Text>

    {item.images?.map((img, idx) => (
      <Image
        key={idx}
        source={{ uri: `http://192.168.10.15:5000/uploads/${img}` }}
        style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 8 }}
        resizeMode="cover"
      />
    ))}

    <TouchableOpacity
      style={styles.acceptBtn}
      onPress={() => Alert.alert('Task Accepted', `You accepted "${item.title}"`)}
    >
      <Text style={styles.acceptText}>Accept Task</Text>
    </TouchableOpacity>
  </View>
);


  if (loading || !location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading tasks...</Text>
      </View>
    );
  }

  return (
    
    <View style={styles.container}>
      <Text style={styles.header}>Nearby Tasks</Text>
      
      <MapView
        style={styles.map}
        initialRegion={{
          ...location,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        <Marker coordinate={location} pinColor="blue" />
        {tasks.map((task) => (
          <Marker
            key={task._id}
            coordinate={{
              latitude: task.location.coordinates[1],
              longitude: task.location.coordinates[0],
            }}
            title={task.title}
            description={task.description}
          />
        ))}
      </MapView>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        renderItem={renderTask}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <TouchableOpacity onPress={() => logout(navigation)} style={styles.logoutBtn}>
  <Text style={styles.logoutText}>Logout</Text>
</TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  map: {
    height: 250,
    borderRadius: 10,
    marginBottom: 15,
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  locationText: {
    fontStyle: 'italic',
    color: '#6b7280',
    marginTop: 5,
  },
  acceptBtn: {
    marginTop: 10,
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  acceptText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
  backgroundColor: '#ef4444',
  padding: 10,
  borderRadius: 6,
  alignItems: 'center',
  marginVertical: 10,
},
logoutText: {
  color: '#fff',
  fontWeight: 'bold',
}

});
