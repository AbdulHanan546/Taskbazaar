import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, Button, Alert, StyleSheet, FlatList, ScrollView, Dimensions,Modal,TouchableOpacity
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
const { width, height } = Dimensions.get('window');
import OSMMap from './OSMMap';
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
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
const [currentTaskId, setCurrentTaskId] = useState(null);
const [rating, setRating] = useState(0);


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

    const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `http://192.168.10.15:5000/api/tasks/${taskId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (newStatus === 'completed') {
        setCurrentTaskId(taskId);
        setRating(0);
        setRatingModalVisible(true); // Open rating modal
      } else {
        fetchTasks();
      }

      Alert.alert('Status Updated!', `Task status updated to ${newStatus}.`);
    } catch (error) {
      console.error('Error updating task status:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update task status');
    }
  };

  const submitRating = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert('Invalid', 'Please select a rating between 1 and 5.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `http://192.168.10.15:5000/api/tasks/${currentTaskId}/rating`,
        { rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Thank you!', 'Your rating has been submitted.');
      setRatingModalVisible(false);
      fetchTasks();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit rating.');
    }
  };




  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: item.status === 'open' ? '#10B981' : 
                          item.status === 'assigned' ? '#3B82F6' : 
                          item.status === 'completed' ? '#059669' : '#EF4444' }
        ]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text>{item.description}</Text>
      <Text style={{ fontWeight: '600', marginTop: 6 }}>
        Budget: PKR{item.budget}
      </Text>
      <Text style={styles.taskLocation}>
        📍 {item.location?.coordinates?.join(', ')}
      </Text>
      {item.provider && item.provider.avgRating !== null && (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
    <Text style={{ fontSize: 16, fontWeight: '600', marginRight: 4 }}>
      ⭐ {item.provider.avgRating.toFixed(1)}
    </Text>
    <Text style={{ color: 'gray' }}>by {item.provider.name}</Text>
  </View>
)}
      {item.images?.map((img, idx) => (
        <Image
          key={idx}
          source={{ uri: `http://192.168.10.15:5000/uploads/${img}` }}
          style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 6 }}
          resizeMode="cover"
        />
      ))}
      
      {/* Task Status Management Buttons */}
      {item.status === 'assigned' && (
        
        <View style={styles.actionButtons}>
          

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
            onPress={() => handleUpdateTaskStatus(item._id, 'completed')}
          >
            <Text style={styles.actionBtnText}>Mark Completed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
            onPress={() => handleUpdateTaskStatus(item._id, 'cancelled')}
          >
            <Text style={styles.actionBtnText}>Cancel Task</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Chat Button for assigned tasks */}
      {item.status === 'assigned' && (
  <TouchableOpacity
    style={[styles.actionBtn, { backgroundColor: '#3B82F6', marginTop: 10 }]}
    onPress={async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`http://192.168.10.15:5000/api/chat/task/${item._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const chat = res.data;
        if (!chat || !chat._id) {
          Alert.alert('Chat not found for this task.');
          return;
        }

        navigation.navigate('ChatScreen', {
          chatId: chat._id,
          taskId: item._id,
          taskTitle: item.title,
          otherParticipant: { name: 'Provider' }, // Update this with actual participant if needed
        });
      } catch (err) {
        console.error('Error fetching chat:', err.message);
        Alert.alert('Error', 'Could not fetch chat for this task.');
      }
    }}
  >
    <Text style={styles.actionBtnText}>💬 Chat with Provider</Text>
  </TouchableOpacity>
)}
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
      {location && (
  <View style={styles.mapContainer}>
    <OSMMap location={location} setLocation={setLocation} />
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
            {/* Rating Modal */}
      <Modal visible={ratingModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 8, width: 300 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>Rate your provider</Text>
            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text style={{ fontSize: 28, color: star <= rating ? 'gold' : 'gray' }}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Submit Rating" onPress={submitRating} />
            <Button title="Cancel" color="red" onPress={() => setRatingModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={() => navigation.navigate('ChatList')} style={styles.chatBtn}>
          <Text style={styles.chatBtnText}>💬 Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => logout(navigation)} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

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
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  chatBtn: {
    backgroundColor: '#10B981',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  chatBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  }

});
