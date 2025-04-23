import React, { useState } from 'react';
import { StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { TouchableOpacity } from 'react-native-gesture-handler';

const serviceTypes = ['Sunday Service', 'Prayer and Worship Night', 'E2E', 'Victory Weekend', 'Other'];

export default function ServiceDetailsScreen() {
  const [pastorName, setPastorName] = useState('');
  const [serviceType, setServiceType] = useState(serviceTypes[0]);
  const [otherServiceType, setOtherServiceType] = useState('');
  const [location, setLocation] = useState('');
  const [timekeeperName, setTimekeeperName] = useState('');
  const [serviceTime, setServiceTime] = useState(''); // Add state for service time

  const handleStartService = () => {
    // Validate inputs
    if (!pastorName.trim()) {
      Alert.alert('Error', 'Please enter the pastor\'s name');
      return;
    }

    if (serviceType === 'Other' && !otherServiceType.trim()) {
      Alert.alert('Error', 'Please specify the service type');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Error', 'Please enter the location');
      return;
    }

    if (!serviceTime.trim()) { // Add validation for service time
      Alert.alert('Error', 'Please enter the service time');
      return;
    }

    if (!timekeeperName.trim()) {
      Alert.alert('Error', 'Please enter the timekeeper\'s name');
      return;
    }

    // Navigate to timekeeper screen with service details
    router.push({
      pathname: '/screens/timekeeper',
      params: {
        pastorName,
        serviceType: serviceType === 'Other' ? otherServiceType : serviceType,
        location,
        serviceTime, // Pass service time
        timekeeperName,
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ThemedText style={styles.title}>Admin Team Timekeeper</ThemedText>
        
        <ThemedText style={styles.label}>Pastor Name</ThemedText>
        <TextInput
          style={styles.input}
          value={pastorName}
          onChangeText={setPastorName}
          placeholder="Enter pastor's name"
          placeholderTextColor="#888"
        />

        <ThemedText style={styles.label}>Service Type</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceTypeContainer}>
          {serviceTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.serviceTypeButton, serviceType === type && styles.selectedServiceType]}
              onPress={() => setServiceType(type)}
            >
              <ThemedText style={[styles.serviceTypeText, serviceType === type && styles.selectedServiceTypeText]}>
                {type}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {serviceType === 'Other' && (
          <TextInput
            style={styles.input}
            value={otherServiceType}
            onChangeText={setOtherServiceType}
            placeholder="Specify service type"
            placeholderTextColor="#888"
          />
        )}

        <ThemedText style={styles.label}>Location</ThemedText>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Enter location"
          placeholderTextColor="#888"
        />

        <ThemedText style={styles.label}>Service Time</ThemedText> {/* Add label for service time */}
        <TextInput
          style={styles.input}
          value={serviceTime}
          onChangeText={setServiceTime}
          placeholder="Enter service time (e.g., 10:00 AM)" // Add input for service time
          placeholderTextColor="#888"
        />

        <ThemedText style={styles.label}>Timekeeper Name</ThemedText>
        <TextInput
          style={styles.input}
          value={timekeeperName}
          onChangeText={setTimekeeperName}
          placeholder="Enter timekeeper's name"
          placeholderTextColor="#888"
        />

        <TouchableOpacity style={styles.button} onPress={handleStartService}>
          <ThemedText style={styles.buttonText}>Start Service</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  serviceTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  serviceTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  selectedServiceType: {
    backgroundColor: '#3498db',
  },
  serviceTypeText: {
    fontSize: 14,
  },
  selectedServiceTypeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});