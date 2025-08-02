import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Button, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

export default function ProviderRegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [services, setServices] = useState('');
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Cannot access location.');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setLocation(coords);
      } catch (err) {
        console.error('Error getting location', err);
        Alert.alert('Error', 'Could not get current location');
      } finally {
        setLoadingLocation(false);
      }
    };

    getCurrentLocation();
  }, []);

  const handleRegister = async () => {
    if (!location) {
      Alert.alert('Location Missing', 'Please wait for location to load.');
      return;
    }

    try {
      const res = await axios.post('http://192.168.10.15:5000/api/auth/register', {
        name,
        email,
        password,
        role: 'provider',
        services: services.split(',').map(service => service.trim()),
        location: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        }
      });

      Alert.alert('Success', 'Registration successful');
      navigation.navigate('Login');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.error || 'Registration failed');
    }
  };

  if (loadingLocation) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading your current location...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Provider Registration</Text>

      <TextInput
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <TextInput
        placeholder="Services (e.g. Plumbing, AC Repair)"
        value={services}
        onChangeText={setServices}
        style={styles.input}
      />

      <Text style={styles.label}>Drag the pin to your service location:</Text>

      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            ...location,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={(e) => setLocation(e.nativeEvent.coordinate)}
        >
          <Marker
            draggable
            coordinate={location}
            onDragEnd={(e) => setLocation(e.nativeEvent.coordinate)}
          />
        </MapView>
      )}

      <Button title="Register as Provider" onPress={handleRegister} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
  },
  label: {
    fontWeight: '600',
    marginVertical: 10,
  },
  map: {
    height: 250,
    borderRadius: 10,
    marginBottom: 20,
  },
});
