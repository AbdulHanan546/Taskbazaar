import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, Button, Alert, StyleSheet, FlatList,
  ScrollView, Dimensions, Modal, TouchableOpacity, RefreshControl
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import OSMMap from './OSMMap';
import { API_BASE_URL } from '../config';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen() {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [images, setImages] = useState([]);
  const [budget, setBudget] = useState('');
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [rating, setRating] = useState(0);
 const [activeTab, setActiveTab] = useState('create');
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation();
  const mapRef = useRef(null);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      navigation.replace('Login');
    } catch (err) {
      console.log('Logout error:', err);
    }
  };

  // Initial permissions + user
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
      }
    };
    fetchUserInfo();
  }, []);

  const fetchTasks = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tasks/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data || []);
    } catch (err) {
      console.log('Error fetching tasks:', err.message);
    }
  };

  // Re-fetch whenever the Posts tab becomes active
  useEffect(() => {
    if (activeTab === 'posts') {
      fetchTasks();
    }
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0]]);
    }
  };

  const handlePostTask = async () => {
    const token = await AsyncStorage.getItem('token');

    if (!location || !location.latitude || !location.longitude) {
      Alert.alert('Error', 'Please select a location on the map.');
      return;
    }

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
      await axios.post(`${API_BASE_URL}/api/tasks`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Task posted successfully!');
      setTitle('');
      setDesc('');
      setLocation(location); // keep last selected location
      setImages([]);
      setBudget('');
      setActiveTab('posts'); // switch to posts
      fetchTasks(); // refresh immediately
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to post task');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/tasks/${taskId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (newStatus === 'completed') {
        setCurrentTaskId(taskId);
        setRating(0);
        setRatingModalVisible(true);
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
        `${API_BASE_URL}/api/tasks/${currentTaskId}/rating`,
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
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'open'
                  ? '#10B981'
                  : item.status === 'assigned'
                  ? '#3B82F6'
                  : item.status === 'completed'
                  ? '#059669'
                  : '#EF4444',
            },
          ]}
        >
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.taskDesc}>{item.description}</Text>

      <Text style={styles.taskBudget}>
        Budget: <Text style={{ fontWeight: '700' }}>PKR {item.budget}</Text>
      </Text>

      <Text style={styles.taskLocation}>
        📍 {item.location?.address || item.location?.coordinates?.join(', ') || 'Unknown'}
      </Text>

      {item?.provider && item.provider.avgRating !== null && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginRight: 4 }}>
            ⭐ {Number(item.provider.avgRating).toFixed(1)}
          </Text>
          <Text style={{ color: 'gray' }}>by {item.provider.name}</Text>
        </View>
      )}

      {/* Task images */}
      {Array.isArray(item.images) &&
        item.images.map((img, idx) => (
          <Image
            key={idx}
            source={{ uri: `${API_BASE_URL}/uploads/${img}` }}
            style={styles.taskImage}
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
              const res = await axios.get(`${API_BASE_URL}/api/chat/task/${item._id}`, {
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
                otherParticipant: { name: 'Provider' },
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
    <View style={styles.screen}>
      <Text style={styles.greeting}>Hello, {name}</Text>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'create' && styles.tabActive]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={activeTab === 'create' ? styles.tabTextActive : styles.tabText}>Create Task</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'posts' && styles.tabActive]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={activeTab === 'posts' ? styles.tabTextActive : styles.tabText}>My Posts</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'create' ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.sectionTitle}>Task Details</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
          />
          <TextInput
            style={[styles.input, { minHeight: 90 }]}
            value={desc}
            onChangeText={setDesc}
            placeholder="Enter task description"
            multiline
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
            <Text style={{ color: 'gray', marginTop: 6, marginBottom: 8 }}>
              Location: {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
            </Text>
          )}

          <View style={{ marginTop: 8 }}>
            <Button title="Pick Image" onPress={pickImage} />
            <View style={{ flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <Image
                  key={i}
                  source={{ uri: img.uri }}
                  style={{ width: 70, height: 70, marginRight: 10, marginBottom: 10, borderRadius: 8 }}
                />
              ))}
            </View>
          </View>

          <View style={{ marginTop: 12 }}>
            <Button title="Post Task" onPress={handlePostTask} />
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={tasks}
            keyExtractor={(item) => item._id}
            renderItem={renderTask}
            contentContainerStyle={{ paddingBottom: 110 }} // space for floating bar
            ListEmptyComponent={
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#6b7280' }}>No posts yet.</Text>
              </View>
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />

          {/* Floating bottom action bar (not too bottom) */}
          <View style={styles.floatingBar}>
            <TouchableOpacity onPress={() => navigation.navigate('ChatList')} style={styles.chatBtn}>
              <Text style={styles.chatBtnText}>💬 Messages</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Rating Modal */}
      <Modal visible={ratingModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>Rate your provider</Text>
            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text style={{ fontSize: 32, marginRight: 6, color: star <= rating ? 'gold' : 'gray' }}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Submit Rating" onPress={submitRating} />
            <View style={{ height: 10 }} />
            <Button title="Cancel" color="red" onPress={() => setRatingModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  mapContainer: {
    height: 300,
    marginVertical: 10,
    width: '100%',
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },

  /* Tabs */
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },

  /* Task cards */
  taskCard: {
    backgroundColor: '#fff',
    padding: 14,
    marginHorizontal: 2,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
    paddingRight: 8,
  },
  taskDesc: {
    color: '#374151',
    marginTop: 2,
  },
  taskBudget: {
    marginTop: 8,
    color: '#111827',
  },
  taskLocation: {
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  taskImage: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },

  /* Floating bottom bar */
  floatingBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    gap: 10,
  },
  chatBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  chatBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logoutBtn: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: 320,
  },
});
