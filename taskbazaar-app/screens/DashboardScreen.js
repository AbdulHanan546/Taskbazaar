import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, Button, Alert, StyleSheet, FlatList, ScrollView, Dimensions,TouchableOpacity
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
const { width, height } = Dimensions.get('window');

export default function DashboardScreen() {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [images, setImages] = useState([]);
  const mapRef = useRef(null);
  const [budget, setBudget] = useState('');

  const navigation = useNavigation();

const logout = async (navigation) => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.replace('Login'); // or navigate, depending on your navigation setup
  } catch (err) {
    console.log('Logout error:', err);
  }
};

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setLocation({ latitude: coords.latitude, longitude: coords.longitude });
      setMapRegion(coords);
    })();

    const fetchUserInfo = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setName(user.name);
        fetchTasks();
      }
    };

    fetchUserInfo();
  }, []);

  const fetchTasks = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await axios.get('http://192.168.10.15:5000/api/tasks/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (err) {
      console.log('Error fetching tasks:', err.message);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0]]);
    }
  };

  const handlePostTask = async () => {
  const token = await AsyncStorage.getItem('token');

  if (!location || !location.latitude || !location.longitude) {
    Alert.alert('Error', 'Please select a location on the map.');
    return;
  }
console.log('Sending location:', location);

  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', desc);
 formData.append(
  'location',
  JSON.stringify({
    latitude: location.latitude,
    longitude: location.longitude,
  })
);
formData.append('budget', budget);


  images.forEach((img, index) => {
    formData.append('images', {
      uri: img.uri,
      name: `image_${index}.jpg`,
      type: 'image/jpeg',
    });
  });

  try {
    await axios.post('http://192.168.10.15:5000/api/tasks', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    Alert.alert('Success', 'Task posted successfully!');
    setTitle('');
    setDesc('');
    setLocation(null);
    setImages([]);
    fetchTasks();
    setBudget(''); // ✅ reset after post
  } catch (err) {
    Alert.alert('Error', err.response?.data?.error || 'Failed to post task');
  }
};


  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text>{item.description}</Text>
      <Text style={{ fontWeight: '600', marginTop: 6 }}>
  Budget: PKR{item.budget}
</Text>
      <Text style={styles.taskLocation}>
        📍 {item.location?.coordinates?.join(', ')}
      </Text>
      {item.images?.map((img, idx) => (
        <Image
          key={idx}
          source={{ uri: `http://192.168.10.15:5000/uploads/${img}` }}
          style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 6 }}
          resizeMode="cover"
        />
      ))}
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
  value={budget}
  onChangeText={setBudget}
  keyboardType="numeric"
  placeholder="Enter budget (PKR)"
/>

      <Text style={styles.sectionTitle}>📍 Select Location</Text>
      {mapRegion && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={mapRegion}
            onRegionChangeComplete={(region) => {
              setLocation({
                latitude: region.latitude,
                longitude: region.longitude,
              });
            }}
          />
          {/* Center pointer */}
          <View style={styles.mapPin} pointerEvents="none">
            <Text style={{ fontSize: 28 }}>📍</Text>
          </View>
        </View>
      )}

      {location && (
        <Text style={{ color: 'gray', marginTop: 5 }}>
          Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </Text>
      )}

      <Button title="Pick Image" onPress={pickImage} />
      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        {images.map((img, i) => (
          <Image
            key={i}
            source={{ uri: img.uri }}
            style={{ width: 60, height: 60, marginRight: 10 }}
          />
        ))}
      </View>

      <Button title="Post Task" onPress={handlePostTask} />

      <Text style={styles.sectionTitle}>Your Posts</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        renderItem={renderTask}
        scrollEnabled={false}
      />
      <TouchableOpacity onPress={() => logout(navigation)} style={styles.logoutBtn}>
  <Text style={styles.logoutText}>Logout</Text>
</TouchableOpacity>

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
  mapContainer: {
  height: 300,
  marginVertical: 10,
  width: '95%',             // reduce width
  alignSelf: 'center',      // center the map
  borderRadius: 12,
  overflow: 'hidden',       // clip map corners
},
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -14,
    marginTop: -34,
    zIndex: 10,
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
