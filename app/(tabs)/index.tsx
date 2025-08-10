import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // for icons
export default function HomeScreen() {
  const [safeToCall, setSafeToCall] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);

  const incidentTypes = [
    { id: 'violence', icon: 'alert-circle', label: 'Violence' },
    { id: 'accident', icon: 'car', label: 'Accident' },
    { id: 'fire', icon: 'flame', label: 'Fire' },
    { id: 'disaster', icon: 'earth', label: 'Disaster' },
    { id: 'other', icon: 'ellipsis-horizontal', label: 'Other', fullWidth: true },

  ];

  const triggerAlert = () => {
    if (!selectedIncident) {
      Alert.alert('Select Incident Type', 'Please choose the type of incident before triggering.');
      return;
    }
    Alert.alert('Alert Triggered', `Type: ${selectedIncident}, Safe to call: ${safeToCall}`);
    // integrate your backend alert logic here
  };

  return (
    <View style={styles.container}>
      
      {/* Incident Type */}
      <Text style={styles.sectionTitle}>Select Incident Type</Text>
      <View style={styles.incidentGrid}>
        {incidentTypes.map(type => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.incidentButton,
              type.fullWidth && styles.fullWidthButton,
              selectedIncident === type.id && styles.incidentSelected
            ]}
            onPress={() => setSelectedIncident(type.id)}
          >
            <Ionicons name={type.icon as any} size={32} color="#fff" />
            <Text style={styles.incidentLabel}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      

      {/* Safe to Call Toggle */}
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Safe to Call</Text>
        <Switch
          value={safeToCall}
          onValueChange={setSafeToCall}
          trackColor={{ false: '#ff4d4d', true: '#4CAF50' }}
          thumbColor="#fff"
        />
      </View>

      {/* Main Panic Trigger */}
      <TouchableOpacity style={styles.panicButton} onPress={triggerAlert}>
        <Text style={styles.panicButtonText}>SEND ALERT</Text>
      </TouchableOpacity>

      {/* Info Button */}
      <TouchableOpacity
        style={styles.infoButton}
        onPress={() => {
          Alert.alert(
            'How to Use ResQ',
            '1. Select Incident Type\n2. Toggle Safe to Call\n3. Press SEND ALERT or triple tap anywhere.\n4. Authorities are notified immediately.'
          );
        }}
      >
        <Ionicons name="information-circle-outline" size={28} color="#888" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#110e0eff', // dark background for focus
    padding: 16,
    justifyContent: 'flex-start',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    marginTop: 30,
    marginBottom: 10,
    fontWeight: '600',
  },
  incidentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  incidentButton: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#444',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  incidentSelected: {
    backgroundColor: '#d9534f',
  },
  incidentLabel: {
    color: '#fff',
    marginTop: 1,
    fontSize: 16,
  },
  fullWidthButton: {
  width: '100%',
  aspectRatio: 6 / 1, // adjusts height to keep it visually balanced
},
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -100,
    paddingHorizontal: 4,
  },
  toggleLabel: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  panicButton: {
    marginTop: 40,
    backgroundColor: '#ff1a1a',
    borderRadius: 100,
    alignSelf: 'center',
    paddingVertical: 30,
    paddingHorizontal: 50,
    shadowColor: '#ff1a1a',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  panicButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  infoButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
});
