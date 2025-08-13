import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity,  SafeAreaView,
  Dimensions,

} from 'react-native';
import axios from 'axios';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Image } from 'react-native';
import OSMMap from './OSMMap'; 
import { API_BASE_URL } from '../config';
export default function ProviderDashboardScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [showAssigned, setShowAssigned] = useState(false);
  const { height } = Dimensions.get("window");
  const [activeTab, setActiveTab] = useState("nearby"); // nearby or assigned

  


const fetchAssignedTasks = async () => {
  const token = await AsyncStorage.getItem('token');
  try {
    const res = await axios.get(`${API_BASE_URL}/api/tasks/assigned`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setAssignedTasks(res.data.tasks || []);
  } catch (err) {
    console.error('Error fetching assigned tasks:', err.message);
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
        `${API_BASE_URL}/api/tasks/${taskId}/accept`,
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
      const res = await axios.get(`${API_BASE_URL}/api/tasks/nearby`, {
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
    let res;

    if (newStatus === 'completed') {
      res = await axios.put(
        `${API_BASE_URL}/api/tasks/${taskId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedTask = res.data.task;

      if (updatedTask.userCompleted && updatedTask.providerCompleted) {
        if (updatedTask.paymentStatus === 'completed') {
          Alert.alert('Task Completed', 'Payment completed successfully.');
        } else if (updatedTask.paymentStatus === 'initiated') {
          Alert.alert('Task Completed', 'Payment initiated. Waiting for confirmation.');
        } else if (updatedTask.paymentStatus === 'failed') {
          Alert.alert('Task Completed', 'Payment failed. Please retry.');
        } else {
          Alert.alert('Status Updated', 'Marked as completed. Waiting for other party.');
        }
      } else {
        Alert.alert('Status Updated', 'Marked as completed. Waiting for other party.');
      }

    } else {
      res = await axios.put(
        `${API_BASE_URL}/api/tasks/${taskId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', `Task marked as ${newStatus}`);
    }

    fetchAssignedTasks(); // refresh assigned list
  } catch (error) {
    console.error('Status update failed:', error);
    Alert.alert('Error', error.response?.data?.error || 'Failed to update task status');
  }
};

const getTaskDisplayStatus = (task) => {
  if (task.status === 'cancelled') return 'cancelled';
  if (task.status === 'completed') return 'completed';
  if (task.userCompleted) return 'waiting-for-other';
  return task.status; // assigned / in-progress
};


const renderAssignedTask = ({ item }) => (
  <View style={styles.taskCard}>
    <View style={styles.taskHeader}>
      <Text style={styles.taskTitle}>{item.title}</Text>
     <View style={[
  styles.statusBadge,
  {
    backgroundColor:
      item.paymentStatus === 'completed' ? '#059669' :
      item.paymentStatus === 'failed' ? '#EF4444' :
      item.status === 'assigned' ? '#3B82F6' :
      item.status === 'completed' ? '#10B981' :
      '#F59E0B'
  }
]}>
  <Text style={styles.statusText}>
    {item.paymentStatus === 'completed' ? 'PAYMENT COMPLETED' :
     item.paymentStatus === 'failed' ? 'PAYMENT FAILED' :
     item.status?.toUpperCase()}
  </Text>
</View>


    </View>

    {item.assignedEmployeeName && (
      <Text style={{ fontStyle: 'italic', color: '#555' }}>
        Assigned to: {item.assignedEmployeeName}
      </Text>
    )}

    <Text>{item.description}</Text>

    <Text style={{ fontWeight: '600', marginTop: 6 }}>
      Budget: PKR {item.budget}
    </Text>

    <Text style={styles.locationText}>
      📍 {item.location?.address || (item.location?.coordinates?.join(', ') || 'Unknown')}
    </Text>

    {item.images?.map((img, index) => (
      <Image
        key={`${item._id}-img-${index}`}
        source={{ uri: `${API_BASE_URL}/uploads/${img}` }}
        style={{ width: '100%', aspectRatio: 16 / 9, marginTop: 10, borderRadius: 6 }}
        resizeMode="contain"
      />
    ))}

    {['assigned', 'in-progress'].includes(item.status) && (
      <View style={{ flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' }}>
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: '#059669', marginRight: 10 }]}
          onPress={() => updateTaskStatus(item._id, 'completed')} // calls completeTask now
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
                otherParticipant: { name: item.assignedEmployeeName || 'Provider' }
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
  📍 {item.location?.address || item.location?.coordinates?.join(', ') || 'Unknown'}
</Text>


   {item.images?.map((img, index) => (
  <Image
    key={`${item._id}-${index}`}
    source={{ uri: `${API_BASE_URL}/uploads/${img}` }}
    style={{ width: '100%', aspectRatio: 16 / 9, marginTop: 10, borderRadius: 6 }}
    resizeMode="contain"
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
              const res = await axios.get(`${API_BASE_URL}/api/chat/task/${item._id}`, {
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
  <SafeAreaView style={styles.container}>
    {/* Header */}
    <Text style={styles.header}>Tasks</Text>

    {/* Tabs */}
    <View style={styles.tabRow}>
      <TouchableOpacity
        style={[
          styles.tabBtn,
          activeTab === "nearby" && styles.activeTabBtn,
        ]}
        onPress={() => setActiveTab("nearby")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "nearby" && styles.activeTabText,
          ]}
        >
          Nearby Tasks
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabBtn,
          activeTab === "assigned" && styles.activeTabBtn,
        ]}
        onPress={() => setActiveTab("assigned")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "assigned" && styles.activeTabText,
          ]}
        >
          Assigned Tasks
        </Text>
      </TouchableOpacity>
    </View>

    {/* Map */}
    {activeTab === "nearby" && (
      <View style={{ height: 300, marginHorizontal: 15, marginBottom: 10, borderRadius: 12, overflow: 'hidden', elevation: 2 }}>
  <OSMMap location={location} setLocation={setLocation} tasks={tasks} />
</View>

    )}
{/* Content */}
<View style={styles.listContainer}>
  <FlatList
  data={activeTab === "nearby" ? tasks : assignedTasks}
  keyExtractor={(item, index) => item._id ?? `item-${index}`}
  renderItem={activeTab === "nearby" ? renderTask : renderAssignedTask}
  contentContainerStyle={{ paddingBottom: 100 }}
  showsVerticalScrollIndicator={false}
/>

</View>


    {/* Fixed Footer Buttons */}
    <View style={styles.footer}>
      <TouchableOpacity
        style={styles.footerBtn}
        onPress={() => navigation.navigate("CompanyDashboard")}
      >
        <Text style={styles.footerBtnText}>Dashboard</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.footerBtn, styles.messageBtn]}
        onPress={() => navigation.navigate("ChatList")}
      >
        <Text style={styles.footerBtnText}>💬 Messages</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.footerBtn, styles.logoutBtn]}
        onPress={() => logout(navigation)}
      >
        <Text style={styles.footerBtnText}>Logout</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb", // Softer background
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    margin: 15,
    color: "#111827",
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginHorizontal: 15,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 25,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    elevation: 2,
  },
  activeTabBtn: {
    backgroundColor: "#2563eb",
    shadowColor: "#2563eb",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "600",
  },
  activeTabText: {
    color: "#fff",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 5,
  },
  taskCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  locationText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
  },
  taskActions: {
    flexDirection: "row",
    marginTop: 10,
    flexWrap: "wrap",
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: "#10B981",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    elevation: 2,
  },
  acceptText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  statusButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
footer: {
  flexDirection: "row",
  paddingHorizontal: 10,
  paddingVertical: 10,
  backgroundColor: "#fff",
  justifyContent: "space-between",
  borderTopWidth: 1,
  borderColor: "#e5e7eb",
  elevation: 8,
  paddingBottom: 20, // extra breathing room for gesture bar
  // optionally add alignItems center for vertical alignment
  alignItems: "center",
},
footerBtn: {
  flex: 1,
  marginHorizontal: 6,  // slightly more space between buttons
  paddingVertical: 12,
  backgroundColor: "#2563eb",
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center", // center text vertically
  elevation: 2,
  minHeight: 44, // consistent button height (optional)
},
footerBtnText: {
  color: "#fff",
  fontWeight: "bold",
  fontSize: 14,
},
messageBtn: {
  backgroundColor: "#10B981",
},
logoutBtn: {
  backgroundColor: "#ef4444",
},

});





