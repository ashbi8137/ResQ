import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const [safeToCall, setSafeToCall] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [pressCount, setPressCount] = useState(0);

  const incidentTypes = [
    { id: 'violence', icon: 'alert-circle', label: 'Violence' },
    { id: 'accident', icon: 'car', label: 'Accident' },
    { id: 'fire', icon: 'flame', label: 'Fire' },
    { id: 'disaster', icon: 'earth', label: 'Disaster' },
    { id: 'other', icon: 'ellipsis-horizontal', label: 'Other' },
  ];

  const triggerAlert = () => {
    if (!selectedIncident) {
      Alert.alert('Select Incident Type', 'Please choose the type of incident before triggering.');
      return;
    }
    Alert.alert('🚨 Alert Triggered', `Type: ${selectedIncident}, Safe to call: ${safeToCall}`);
    // your backend alert logic here
  };

  const handlePanicPress = () => {
    const newCount = pressCount + 1;
    setPressCount(newCount);

    if (newCount === 3) {
      triggerAlert();
      setPressCount(0); // reset after triggering
    }
  };

  return (
    <View style={styles.container}>
      {/* Incident Type */}
      <Text style={styles.sectionTitle}>Select Incident Type</Text>
      <View style={styles.incidentGrid}>
        {incidentTypes.map((type) => {
          const isSelected = selectedIncident === type.id;
          const isFullWidth = type.id === 'other';

          return (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.incidentButton,
                isFullWidth && styles.fullWidthButton,
                isSelected && styles.incidentSelected,
              ]}
              onPress={() => setSelectedIncident(type.id)}
            >
              <Ionicons name={type.icon as any} size={32} color="#fff" />
              <Text style={styles.incidentLabel}>{type.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Safe to Call Toggle */}
      <View style={styles.toggleContainer}>
        <Ionicons
          name={safeToCall ? 'call' : 'call-outline'}
          size={26}
          color={safeToCall ? '#4CAF50' : '#ff4d4d'}
        />
        <Switch
          value={safeToCall}
          onValueChange={setSafeToCall}
          trackColor={{ false: '#ff4d4d', true: '#4CAF50' }}
          thumbColor="#fff"
        />
      </View>

      {/* Main Panic Trigger */}
      <TouchableOpacity style={styles.panicButton} onPress={handlePanicPress}>
        <Text style={styles.panicButtonText}>SEND ALERT</Text>
      </TouchableOpacity>

      {/* Info Button */}
      <TouchableOpacity
        style={styles.infoButton}
        onPress={() => {
          Alert.alert(
            'How to Use ResQ',
            '1. Select Incident Type\n2. Toggle Safe to Call\n3. Press SEND ALERT three times quickly.\n4. Authorities are notified immediately.'
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
    backgroundColor: '#110e0eff',
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
    aspectRatio: 6 / 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
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
