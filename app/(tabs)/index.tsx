import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, Text, TouchableOpacity, Vibration, View } from 'react-native';
import MediaUpload from '../../components/MediaUpload';
import { EmergencyService } from '../../lib/emergencyService';

export default function HomeScreen() {
  const [safeToCall, setSafeToCall] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [pressCount, setPressCount] = useState(0);
  const [currentIncidentId, setCurrentIncidentId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('+1234567890'); // Default for demo
  const [isLoading, setIsLoading] = useState(false);

  const incidentTypes = [
    { id: 'domestic_violence', icon: 'alert-circle', label: 'Violence' },
    { id: 'accident', icon: 'car', label: 'Accident' },
    { id: 'disaster', icon: 'flame', label: 'Fire' },
    { id: 'medical', icon: 'earth', label: 'Disaster' },
    { id: 'other', icon: 'ellipsis-horizontal', label: 'Other' },
  ];

  const triggerAlert = async () => {
    if (!selectedIncident) {
      Alert.alert('Select Incident Type', 'Please choose the type of incident before triggering.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await EmergencyService.createEmergencyAlert(
        phoneNumber,
        selectedIncident as any,
        safeToCall
      );

             if (result.success && result.incidentId) {
         setCurrentIncidentId(result.incidentId);
         // Vibration only works on mobile devices
         if (Platform.OS !== 'web') {
           Vibration.vibrate([0, 500, 200, 500]); // Success vibration pattern
         }
         Alert.alert(
           '🚨 Alert Triggered Successfully', 
           `Type: ${selectedIncident}\nSafe to call: ${safeToCall ? 'Yes' : 'No'}\nIncident ID: ${result.incidentId}`
         );
         setPressCount(0); // reset after triggering
       } else {
        Alert.alert('Error', result.error || 'Failed to send alert');
      }
    } catch (error) {
      console.error('Error triggering alert:', error);
      Alert.alert('Error', 'Failed to send emergency alert');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePanicPress = () => {
    const newCount = pressCount + 1;
    setPressCount(newCount);

    if (newCount === 3) {
      triggerAlert();
      setPressCount(0); // reset after triggering
    }
  };

  const handleMediaUploadComplete = () => {
    Alert.alert('Success', 'Evidence uploaded successfully!');
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
             <TouchableOpacity 
         style={[styles.panicButton, isLoading && styles.panicButtonLoading]} 
         onPress={handlePanicPress}
         disabled={isLoading}
       >
         <Text style={styles.panicButtonText}>
           {isLoading ? 'SENDING...' : 'SEND ALERT'}
         </Text>
         {pressCount > 0 && !isLoading && (
           <Text style={styles.tapCountText}>{pressCount}/3</Text>
         )}
       </TouchableOpacity>

      {/* Media Upload Section */}
      {currentIncidentId && (
        <View style={styles.mediaSection}>
          <MediaUpload 
            incidentId={currentIncidentId}
            onUploadComplete={handleMediaUploadComplete}
          />
        </View>
      )}

      {/* Info Button */}
      <TouchableOpacity
        style={styles.infoButton}
        onPress={() => {
          Alert.alert(
            'How to Use ResQ',
            '1. Select Incident Type\n2. Toggle Safe to Call\n3. Press SEND ALERT three times quickly.\n4. Authorities are notified immediately with your location.\n5. Upload evidence if needed.'
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
  panicButtonLoading: {
    backgroundColor: '#ff6666',
  },
  panicButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  tapCountText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
    opacity: 0.8,
  },
  mediaSection: {
    marginTop: 20,
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
  },
  infoButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
});
