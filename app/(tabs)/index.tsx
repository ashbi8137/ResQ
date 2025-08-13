import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { 
  Alert, 
  Platform, 
  StyleSheet, 
  Switch, 
  Text, 
  TouchableOpacity, 
  Vibration, 
  View, 
  ScrollView, 
  Animated 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EmergencyService } from '../../lib/emergencyService';

const MediaUpload = React.lazy(() => import('../../components/MediaUpload'));

export default function HomeScreen() {
  // State Management
  const [safeToCall, setSafeToCall] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [pressCount, setPressCount] = useState(0);
  const [currentIncidentId, setCurrentIncidentId] = useState(null);
  const [phoneNumber] = useState('+1234567890');
  const [isLoading, setIsLoading] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  
  // Animation References
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  // Emergency Types Configuration
  const incidentTypes = [
    { 
      id: 'domestic_violence', 
      icon: 'shield-outline', 
      label: 'Domestic Violence', 
      color: '#DC2626', 
      bgColor: '#FEF2F2', 
      gradient: ['#FEF2F2', '#FEE2E2'] 
    },
    { 
      id: 'accident', 
      icon: 'car-outline', 
      label: 'Vehicle Accident', 
      color: '#D97706', 
      bgColor: '#FFFBEB', 
      gradient: ['#FFFBEB', '#FEF3C7'] 
    },
    { 
      id: 'disaster', 
      icon: 'flame-outline', 
      label: 'Fire/Disaster', 
      color: '#EA580C', 
      bgColor: '#FFF7ED', 
      gradient: ['#FFF7ED', '#FFEDD5'] 
    },
    { 
      id: 'medical', 
      icon: 'medical-outline', 
      label: 'Medical Emergency', 
      color: '#059669', 
      bgColor: '#F0FDF4', 
      gradient: ['#F0FDF4', '#DCFCE7'] 
    },
    { 
      id: 'other', 
      icon: 'help-circle-outline', 
      label: 'Other Emergency', 
      color: '#7C3AED', 
      bgColor: '#FAF5FF', 
      gradient: ['#FAF5FF', '#F3E8FF'] 
    },
  ];

  // Initialize Component
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const lastIncident = await AsyncStorage.getItem('lastIncident');
        if (lastIncident) setSelectedIncident(lastIncident);
      } catch (error) {
        console.error('Error loading saved incident:', error);
      }
    };

    initializeApp();

    // Start ripple animation
    const rippleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(rippleAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    rippleAnimation.start();

    return () => rippleAnimation.stop();
  }, []);

  // Emergency Alert Handler
  const triggerAlert = async (incidentOverride) => {
    const finalIncident = incidentOverride || selectedIncident;

    if (!finalIncident) {
      Alert.alert(
        '⚠️ Missing Information', 
        'Please select an emergency type before triggering the alert.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await EmergencyService.createEmergencyAlert(
        phoneNumber,
        finalIncident,
        safeToCall
      );

      if (result.success && result.incidentId) {
        setCurrentIncidentId(result.incidentId);
        setShowMediaUpload(true);

        if (Platform.OS !== 'web') {
          Vibration.vibrate([0, 500, 200, 500]);
        }

        const selectedTypeLabel = incidentTypes.find(t => t.id === finalIncident)?.label;
        Alert.alert(
          '🚨 Emergency Alert Sent',
          `Alert Type: ${selectedTypeLabel}\nCommunication: ${safeToCall ? 'Voice call enabled' : 'Silent mode'}\nIncident ID: ${result.incidentId}\n\nAuthorities have been notified of your location.`,
          [{ text: 'OK', style: 'default' }]
        );
        
        setPressCount(0);
      } else {
        Alert.alert(
          '❌ Alert Failed', 
          result.error || 'Unable to send emergency alert. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error triggering alert:', error);
      Alert.alert(
        '❌ Connection Error', 
        'Failed to send emergency alert. Check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Incident Selection Handler
  const handleIncidentSelect = async (id) => {
    setSelectedIncident(id);
    try {
      await AsyncStorage.setItem('lastIncident', id);
    } catch (error) {
      console.error('Error saving incident selection:', error);
    }
  };

  // Panic Button Handler
  const handlePanicPress = () => {
    const newCount = pressCount + 1;
    setPressCount(newCount);

    if (Platform.OS !== 'web') {
      Vibration.vibrate(100);
    }

    // Button press animation
    pulseAnim.setValue(1);
    Animated.sequence([
      Animated.timing(pulseAnim, { 
        toValue: 1.2, 
        duration: 100, 
        useNativeDriver: true 
      }),
      Animated.timing(pulseAnim, { 
        toValue: 1, 
        duration: 100, 
        useNativeDriver: true 
      })
    ]).start();

    if (newCount === 3) {
      triggerAlert(selectedIncident || 'other');
    } else {
      // Reset count after 3 seconds if not completed
      setTimeout(() => {
        setPressCount(0);
      }, 3000);
    }
  };

  // Media Upload Complete Handler
  const handleMediaUploadComplete = () => {
    Alert.alert(
      '✅ Upload Successful', 
      'Evidence has been uploaded and attached to your emergency report.'
    );
  };

  // Get selected incident type
  const selectedType = incidentTypes.find(type => type.id === selectedIncident);
  const handleCloseCase = () => {
    setCurrentIncidentId(null);
    setShowMediaUpload(false);
  };

  return (
    <View style={styles.container}>
      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.headerBackground} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Ready</Text>
            </View>
            <View style={styles.headerIconContainer}>
              <Ionicons name="shield-checkmark" size={20} color="#ffffff" />
            </View>
          </View>
          <Text style={styles.headerTitle}>ResQ</Text>
          <Text style={styles.headerSubtitle}>Rescue at your Fingertips</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Compact Emergency Type Selection */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.sectionTitle}>Emergency Type</Text>
            </View>

            <View style={styles.incidentGrid}>
              {incidentTypes.map((type) => {
                const isSelected = selectedIncident === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.incidentCard,
                      isSelected && styles.incidentCardSelected,
                      { borderColor: isSelected ? type.color : '#E5E7EB' }
                    ]}
                    onPress={() => handleIncidentSelect(type.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.incidentIconContainer,
                      { backgroundColor: isSelected ? type.color : type.bgColor }
                    ]}>
                      <Ionicons
                        name={type.icon}
                        size={16}
                        color={isSelected ? '#ffffff' : type.color}
                      />
                    </View>
                    <Text style={[
                      styles.incidentLabel,
                      { color: isSelected ? type.color : '#374151' }
                    ]}>
                      {type.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark-circle" size={12} color={type.color} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Compact Communication Toggle */}
          <View style={styles.communicationToggle}>
            <View style={styles.toggleContent}>
              <Ionicons
                name={safeToCall ? 'call' : 'call'}
                size={18}
                color={safeToCall ? '#059669' : '#3B82F6'}
              />
              <Text style={styles.toggleTitle}>
                {safeToCall ? 'Safe to Call' : 'Safe to Call'}
              </Text>
            </View>
            <Switch
              value={safeToCall}
              onValueChange={setSafeToCall}
              trackColor={{ false: '#E5E7EB', true: '#DCFCE7' }}
              thumbColor={safeToCall ? '#059669' : '#6B7280'}
              ios_backgroundColor="#E5E7EB"
              style={styles.switch}
            />
          </View>

          {/* Compact Emergency Alert Section */}
          <View style={styles.emergencySection}>
            <View style={styles.emergencyHeader}>
              <Text style={styles.emergencyTitle}>Emergency Alert</Text>
              <Text style={styles.emergencySubtitle}>
                {pressCount === 0
                  ? 'Triple-tap SOS to send alert'
                  : `${3 - pressCount} more tap${3 - pressCount !== 1 ? 's' : ''} needed`}
              </Text>
            </View>

            {/* Compact Progress Indicator */}
            {pressCount > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      { width: `${(pressCount / 3) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{pressCount}/3</Text>
              </View>
            )}

            {/* Compact SOS Button */}
            <View style={styles.sosContainer}>
              <Animated.View style={[styles.pulseWrapper, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity
                  style={[
                    styles.sosButton,
                    isLoading ? styles.sosButtonLoading : selectedIncident && styles.sosButtonReady
                  ]}
                  onPress={handlePanicPress}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  <View style={styles.sosButtonInner}>
                    <Ionicons
                      name={isLoading ? 'hourglass' : 'warning'}
                      size={28}
                      color="#fff"
                      style={styles.icon}
                    />
                    <Text style={styles.sosButtonText}>
                      {isLoading ? 'SENDING' : 'SOS'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Selected Emergency Type Display */}
            {selectedType && (
              <View style={styles.selectedTypeDisplay}>
                <View style={[
                  styles.selectedTypeIcon,
                  { backgroundColor: selectedType.bgColor }
                ]}>
                  <Ionicons
                    name={selectedType.icon}
                    size={14}
                    color={selectedType.color}
                  />
                </View>
                <Text style={styles.selectedTypeText}>
                  Ready: {selectedType.label}
                </Text>
              </View>
            )}
          </View>

          {/* Media Upload Section */}
          {showMediaUpload && currentIncidentId && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cloud-upload" size={20} color="#7C3AED" />
                <Text style={styles.sectionTitle}>Evidence Upload</Text>
              </View>

              <Suspense fallback={
                <View style={styles.uploadLoader}>
                  <Ionicons name="hourglass" size={20} color="#6B7280" />
                  <Text style={styles.uploadLoaderText}>Loading...</Text>
                </View>
              }>
                <MediaUpload
                  incidentId={currentIncidentId}
                  onUploadComplete={handleMediaUploadComplete}
                />
              </Suspense>

              {/* Close Case Button */}
              <TouchableOpacity
                style={styles.closeCaseButton}
                onPress={handleCloseCase}
              >
                <Text style={styles.closeCaseButtonText}>
                  Close Case
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Compact Safety Tips */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={16} color="#F59E0B" />
              <Text style={styles.tipsTitle}>Safety Reminders</Text>
            </View>
            <View style={styles.tipsContent}>
              <Text style={styles.tipText}>• Enable location services • Keep phone charged</Text>
              <Text style={styles.tipText}>• Genuine emergencies only • Follow responder instructions</Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container & Layout
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  scrollView: {
    flex: 1,
  },
  
  content: {
    padding: 16,
    paddingBottom: 60,
  },

  // Compact Header Styles
  header: {
    position: 'relative',
    backgroundColor: '#0F172A',
    paddingTop: Platform.OS === 'ios' ? 35 : 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F172A',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  
  headerContent: {
    alignItems: 'center',
  },
  
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  
  statusText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  headerTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 2,
  },

  // Compact Section Card Styles
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },

  // Compact Incident Grid Styles
  incidentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  
  incidentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    minHeight: 80,
  },
  
  incidentCardSelected: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  
  incidentIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  
  incidentLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
  
  selectedIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Compact Communication Toggle Styles
  communicationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },

  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },

  // Compact Emergency Section Styles
  emergencySection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  
  emergencyHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  
  emergencySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Compact Progress Indicator Styles
  progressContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 3,
  },
  
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },

  // Compact SOS Button Styles
  sosContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  
  pulseWrapper: {
    borderRadius: 60,
  },
  
  sosButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  
  sosButtonReady: {
    backgroundColor: '#DC2626',
    shadowColor: '#dc2626',
  },
  
  sosButtonLoading: {
    backgroundColor: '#6b7280',
    shadowColor: '#6b7280',
  },
  
  sosButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  sosButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },

  // Selected Type Display Styles
  selectedTypeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  
  selectedTypeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  
  selectedTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  // Upload Loader Styles
  uploadLoader: {
    alignItems: 'center',
    padding: 20,
  },
  
  uploadLoaderText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },

  // Close Case Button
  closeCaseButton: {
    backgroundColor: '#DC2626',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },

  closeCaseButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Compact Safety Tips Styles
  tipsCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 6,
  },
  
  tipsContent: {
    gap: 4,
  },
  
  tipText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 16,
  },
});