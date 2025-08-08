import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity
} from 'react-native';
import axios from 'axios';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Image } from 'react-native';

export default function ProviderDashboardScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [showAssigned, setShowAssigned] = useState(false);

const fetchAssignedTasks = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const res = await axios.get('http://192.168.10.15:5000/api/tasks/assigned', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setAssignedTasks(res.data);
  } catch (err) {
    console.error('Error fetching assigned tasks:', err);
  }
};

const logout = async (navigation) => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('role');
    navigation.replace('Login'); // or navigate, depending on your navigation setup
  } catch (err) {
    console.log('Logout error:', err);
  }
};

  const handleAcceptTask = async (taskId, taskTitle) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `http://192.168.10.15:5000/api/tasks/${taskId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.emailSent) {
        Alert.alert(
          'Task Accepted!',
          `You accepted "${taskTitle}". The task poster has been notified via email.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh the task list
                fetchNearbyTasks();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Task Accepted!',
          `You accepted "${taskTitle}".`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh the task list
                fetchNearbyTasks();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error accepting task:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to accept task');
    }
  };

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

  useEffect(() => {
    fetchNearbyTasks();
    fetchAssignedTasks();
  }, [location]);
const updateTaskStatus = async (taskId, newStatus) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const res = await axios.put(
      `http://192.168.10.15:5000/api/tasks/${taskId}/status`,
      { status: newStatus },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    Alert.alert('Success', `Task marked as ${newStatus}`);
    fetchAssignedTasks(); // refresh assigned list
  } catch (error) {
    console.error('Status update failed:', error);
    Alert.alert('Error', error.response?.data?.error || 'Failed to update task status');
  }
};
const renderAssignedTask = ({ item }) => (
  <View style={styles.taskCard}>
    <View style={styles.taskHeader}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <View style={[
        styles.statusBadge,
        {
          backgroundColor: item.status === 'assigned' ? '#3B82F6'
                          : item.status === 'completed' ? '#059669'
                          : item.status === 'cancelled' ? '#EF4444' : '#10B981'
        }
      ]}>
        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
      </View>
    </View>

    <Text>{item.description}</Text>

    <Text style={{ fontWeight: '600', marginTop: 6 }}>
      Budget: PKR {item.budget}
    </Text>

    <Text style={styles.locationText}>
      📍 {item.location?.coordinates?.join(', ') || 'Unknown'}
    </Text>

    {item.images?.map((img, idx) => (
      <Image
        key={idx}
        source={{ uri: `http://192.168.10.15:5000/uploads/${img}` }}
        style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 6 }}
        resizeMode="cover"
      />
    ))}

    {/* Action buttons */}
    {item.status === 'assigned' && (
      <View style={{ flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' }}>
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: '#059669', marginRight: 10 }]}
          onPress={() => updateTaskStatus(item._id, 'completed')}
        >
          <Text style={styles.statusButtonText}>Mark Completed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: '#EF4444', marginRight: 10 }]}
          onPress={() => updateTaskStatus(item._id, 'cancelled')}
        >
          <Text style={styles.statusButtonText}>Cancel Task</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: '#3B82F6', marginTop: 10 }]}
          onPress={async () => {
                try {
                  const token = await AsyncStorage.getItem('token');
                  const res = await axios.get(`http://192.168.10.15:5000/api/chat/by-task/${item._id}`, {
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
          <Text style={styles.statusButtonText}>💬 Chat</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);


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
      Budget: PKR {item.budget}
    </Text>

    <Text style={styles.locationText}>
      📍 {item.location?.coordinates?.join(', ') || 'Unknown'}
    </Text>

    {item.images?.map((img, idx) => (
      <Image
        key={idx}
        source={{ uri: `http://192.168.10.15:5000/uploads/${img}` }}
        style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 6 }}
        resizeMode="cover"
      />
    ))}

    {item.status === 'open' && (
      <View style={styles.taskActions}>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => handleAcceptTask(item._id, item.title)}
        >
          <Text style={styles.acceptText}>Accept Task</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.acceptBtn, { backgroundColor: '#3B82F6', marginLeft: 10 }]}
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
              // Find the task owner from chat participants
              const owner = chat.participants.find(p => p._id === item.user || p._id === item.user?._id);
              navigation.navigate('ChatScreen', {
                chatId: chat._id,
                taskId: item._id,
                taskTitle: item.title,
                otherParticipant: { name: owner ? owner.name : 'Task Owner' },
              });
            } catch (err) {
              console.error('Error fetching chat:', err.message);
              Alert.alert('Error', 'Could not fetch chat for this task.');
            }
          }}
        >
          <Text style={styles.acceptText}>💬 Chat</Text>
        </TouchableOpacity>
      </View>
    )}
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
    contentContainerStyle={{ paddingBottom: 40 }}
  />

  <TouchableOpacity
    onPress={() => setShowAssigned(!showAssigned)}
    style={styles.toggleAssignedBtn}
  >
    <Text style={styles.toggleAssignedText}>
      {showAssigned ? 'Hide' : 'View'} Assigned Tasks
    </Text>
  </TouchableOpacity>

  {showAssigned && (
    <View style={styles.assignedContainer}>
      <Text style={styles.subHeader}>Your Assigned Tasks</Text>
      <FlatList
        data={assignedTasks}
        keyExtractor={(item) => item._id}
        renderItem={renderAssignedTask}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  )}
        <View style={{
          justifyContent:'center', alignItems: 'center', marginTop: 20, marginBottom: 20
        }}>
          <TouchableOpacity 
style={{
  backgroundColor: '#3b82f6',
  padding: 10,
  width: '50%',
  borderRadius: 18,
}}
onPress={() => navigation.navigate('CompanyRegister')}>
  <Text style={{
    color: '#fff',
    textAlign: 'center',}}>
    Register as a company
  </Text>
</TouchableOpacity>
        </View>
  <View style={styles.buttonRow}>
    <TouchableOpacity onPress={() => navigation.navigate('ChatList')} style={styles.chatBtn}>
      <Text style={styles.chatBtnText}>💬 Messages</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => logout(navigation)} style={styles.logoutBtn}>
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
  </View>
</View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 10,
  },
  toggleAssignedBtn: {
  backgroundColor: '#3b82f6',
  padding: 12,
  borderRadius: 8,
  alignItems: 'center',
  marginVertical: 10,
},

toggleAssignedText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 16,
},

assignedContainer: {
  backgroundColor: '#f9fafb',
  borderRadius: 10,
  padding: 10,
  marginTop: 10,
},

subHeader: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 10,
}
,
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
  taskActions: {
    flexDirection: 'row',
    marginTop: 10,
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
statusButton: {
  padding: 10,
  borderRadius: 6,
  flex: 1,
  alignItems: 'center',
},
statusButtonText: {
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


});
