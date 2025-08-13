import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Alert
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../config';
export default function ChatListScreen() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
const [currentUserId, setCurrentUserId] = useState(null);

useEffect(() => {
  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUserId(user.id);
    }
  };

  loadUser();
}, []);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/chat/user-chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
      Alert.alert('Error', 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getLastMessage = (chat) => {
    if (chat.messages && chat.messages.length > 0) {
      const lastMsg = chat.messages[chat.messages.length - 1];
      return lastMsg.content.length > 30 
        ? lastMsg.content.substring(0, 30) + '...' 
        : lastMsg.content;
    }
    return 'No messages yet';
  };

 const getOtherParticipant = (chat) => {
  return chat.participants.find(p => p._id !== currentUserId);
};

  const renderChatItem = ({ item }) => {
  console.log('💬 Chat item:', item);
  console.log('🆔 Chat ID:', item._id);
  console.log('📦 Task:', item.taskId);
  console.log('📦 Task ID:', item.taskId?._id);
  console.log('📦 Task Title:', item.taskId?.title);

    const otherParticipant = getOtherParticipant(item);
    const lastMessage = getLastMessage(item);
    const lastMessageTime = item.lastMessage ? formatTime(item.lastMessage) : '';

    return (
      <TouchableOpacity
        style={styles.chatItem}

        onPress={() => navigation.navigate('ChatScreen', { 
          chatId: item._id||item.id, 
          taskId: item.taskId._id,
          taskTitle: item.taskId.title,
          otherParticipant: otherParticipant
        })
        
      }
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {otherParticipant?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.participantName}>
              {otherParticipant?.name || 'Unknown User'}
            </Text>
            <Text style={styles.timeText}>{lastMessageTime}</Text>
          </View>
          
          <Text style={styles.taskTitle} numberOfLines={1}>
            {item.taskId?.title || 'Task'}
          </Text>
          
          <Text style={[
            styles.lastMessage,
            item.unreadCount > 0 && styles.unreadMessage
          ]} numberOfLines={1}>
            {lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    if (currentUserId){
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading chats...</Text>
      </View>
    );}
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Messages</Text>
      
      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Start a conversation when you post or accept a task
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item._id}
          renderItem={renderChatItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  taskTitle: {
    fontSize: 14,
    color: '#4F46E5',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
  },
  unreadMessage: {
    color: '#1f2937',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 