import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CompanyDashboardScreen = () => {
  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profession, setProfession] = useState('');

  const addEmployee = () => {
    if (!name.trim() || !email.trim() || !profession.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const newEmployee = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim(),
      profession: profession.trim(),
      status: 'free',
    };

    setEmployees([...employees, newEmployee]);
    setName('');
    setEmail('');
    setProfession('');
  };

  const removeEmployee = (id) => {
    setEmployees(employees.filter(emp => emp.id !== id));
  };

  const toggleEmployeeStatus = (id) => {
    setEmployees(employees.map(emp => 
      emp.id === id 
        ? { ...emp, status: emp.status === 'free' ? 'at-work' : 'free' }
        : emp
    ));
  };

  const totalEmployees = employees.length;
  const freeEmployees = employees.filter(emp => emp.status === 'free').length;
  const atWorkEmployees = employees.filter(emp => emp.status === 'at-work').length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Company Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage your employees</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={[styles.statsCard, { marginRight: 8 }]}> 
              <Text style={styles.statsCardNumber}>{totalEmployees}</Text>
              <Text style={styles.statsCardLabel}>Total Employees</Text>
            </View>
            <View style={[styles.statsCard, { backgroundColor: '#dcfce7', marginRight: 8 }]}> 
              <Text style={[styles.statsCardNumber, { color: '#16a34a' }]}>{freeEmployees}</Text>
              <Text style={styles.statsCardLabel}>Free Employees</Text>
            </View>
            <View style={[styles.statsCard, { backgroundColor: '#ffedd5' }]}> 
              <Text style={[styles.statsCardNumber, { color: '#ea580c' }]}>{atWorkEmployees}</Text>
              <Text style={styles.statsCardLabel}>At Work</Text>
            </View>
          </View>
        </View>

        {/* Add Employee Form */}
        <View style={styles.formSection}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add New Employee</Text>
            <TextInput
              style={styles.input}
              placeholder="Employee Name"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Profession"
              value={profession}
              onChangeText={setProfession}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={addEmployee}
            >
              <Text style={styles.addButtonText}>Add Employee</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Employee List */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>Employee List</Text>
          {employees.length === 0 ? (
            <View style={styles.emptyListCard}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyListText}>No employees added yet</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {employees.map((employee) => (
                <View key={employee.id} style={styles.employeeCard}>
                  <View style={styles.employeeRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.employeeName}>{employee.name}</Text>
                      <Text style={styles.employeeEmail}>{employee.email}</Text>
                      <Text style={styles.employeeProfession}>{employee.profession}</Text>
                      <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: employee.status === 'free' ? '#22c55e' : '#f59e42' }]} />
                        <Text style={[styles.statusText, { color: employee.status === 'free' ? '#16a34a' : '#ea580c' }]}>
                          {employee.status === 'free' ? 'Available' : 'At Work'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.statusToggleBtn}
                        onPress={() => toggleEmployeeStatus(employee.id)}
                      >
                        <Ionicons 
                          name={employee.status === 'free' ? 'briefcase' : 'person'} 
                          size={20} 
                          color="#6B7280" 
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => removeEmployee(employee.id)}
                      >
                        <Ionicons name="trash" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  headerSection: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#dbeafe',
    marginTop: 4,
  },
  statsSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    elevation: 2,
  },
  statsCardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statsCardLabel: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 2,
  },
  formSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  emptyListCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyListText: {
    color: '#6b7280',
    marginTop: 8,
  },
  employeeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  employeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  employeeEmail: {
    color: '#6b7280',
    marginTop: 2,
  },
  employeeProfession: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 8,
  },
  statusToggleBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    padding: 8,
    marginRight: 8,
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 999,
    padding: 8,
  },
});


export default CompanyDashboardScreen;
