import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const CompanyRegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    businessType: '',
    registrationNumber: '',
    email: '',
    phone: '',
    website: '',
    officeAddress: '',
    city: '',
    operatingHours: '',
  });

  const businessTypes = [
    'Construction',
    'Electrical',
    'Plumbing',
    'HVAC',
    'Landscaping',
    'Painting',
    'Roofing',
    'Flooring',
    'Carpentry',
    'Cleaning',
    'Security',
    'IT Services',
    'Consulting',
    'Other'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.companyName.trim()) {
      Alert.alert('Error', 'Company Name is required');
      return false;
    }
    if (!formData.businessType) {
      Alert.alert('Error', 'Business Type is required');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email Address is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Phone Number is required');
      return false;
    }
    if (!formData.officeAddress.trim()) {
      Alert.alert('Error', 'Office Address is required');
      return false;
    }
    if (!formData.city.trim()) {
      Alert.alert('Error', 'City is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Prepare payload for backend
      const payload = {
        name: formData.companyName,
        email: formData.email,
        password: 'changeme123', // TODO: Add password field to form for real use
        address: formData.officeAddress,
        phone: formData.phone,
        businessType: formData.businessType,
        registrationNumber: formData.registrationNumber,
        website: formData.website,
        city: formData.city,
        operatingHours: formData.operatingHours,
      };

      const response = await fetch('http://localhost:5000/api/company/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          'Company registered successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('CompanyDashboard')
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', data.error || 'Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Company Registration</Text>
          <Text style={styles.subtitle}>Register your company to start providing services</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Company Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your company name"
              value={formData.companyName}
              onChangeText={(text) => handleInputChange('companyName', text)}
            />
          </View>

          {/* Business Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Type *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.businessType}
                onValueChange={(value) => handleInputChange('businessType', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Business Type" value="" />
                {businessTypes.map((type) => (
                  <Picker.Item key={type} label={type} value={type} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Registration Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Registration Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional - Business registration number"
              value={formData.registrationNumber}
              onChangeText={(text) => handleInputChange('registrationNumber', text)}
            />
          </View>

          {/* Email Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="company@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="+1 (555) 123-4567"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
            />
          </View>

          {/* Website */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              placeholder="https://www.yourcompany.com"
              keyboardType="url"
              autoCapitalize="none"
              value={formData.website}
              onChangeText={(text) => handleInputChange('website', text)}
            />
          </View>

          {/* Office Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Office Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter your complete office address"
              multiline
              numberOfLines={3}
              value={formData.officeAddress}
              onChangeText={(text) => handleInputChange('officeAddress', text)}
            />
          </View>

          {/* City */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your city"
              value={formData.city}
              onChangeText={(text) => handleInputChange('city', text)}
            />
          </View>

          {/* Operating Hours */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Operating Hours</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Mon-Fri 9:00 AM - 6:00 PM"
              value={formData.operatingHours}
              onChangeText={(text) => handleInputChange('operatingHours', text)}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Register Company</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    textAlign: 'center',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CompanyRegisterScreen;
