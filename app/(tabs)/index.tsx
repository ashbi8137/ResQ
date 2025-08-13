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

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerBackground} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Emergency Ready</Text>
            </View>
            <View style={styles.headerIconContainer}>
              <Ionicons name="shield-checkmark" size={28} color="#ffffff" />
            </View>
          </View>
          <Text style={styles.headerTitle}>ResQ</Text>
          <Text style={styles.headerSubtitle}>Immediate Response System</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Emergency Type Selection */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="alert-circle" size={24} color="#DC2626" />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Emergency Type</Text>
                <Text style={styles.sectionSubtitle}>Select the nature of your emergency</Text>
              </View>
            </View>

            <View style={styles.incidentGridContainer}>
              {/* First row - 3 items */}
              <View style={styles.incidentRow}>
                {incidentTypes.slice(0, 3).map((type) => {
                  const isSelected = selectedIncident === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.incidentCard,
                        styles.incidentCardThreeColumn,
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
                          size={28}
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
                          <Ionicons name="checkmark-circle" size={16} color={type.color} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Second row - 2 items */}
              <View style={styles.incidentRow}>
                {incidentTypes.slice(3, 5).map((type) => {
                  const isSelected = selectedIncident === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.incidentCard,
                        styles.incidentCardTwoColumn,
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
                          size={28}
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
                          <Ionicons name="checkmark-circle" size={16} color={type.color} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Communication Preferences */}
          <View style={styles.communicationToggle}>
            <View style={styles.toggleContent}>
              <View style={styles.toggleIcon}>
                <Ionicons
                  name={safeToCall ? 'call' : 'chatbubble-ellipses'}
                  size={20}
                  color={safeToCall ? '#059669' : '#3B82F6'}
                />
              </View>
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>
                  {safeToCall ? 'Voice Calls OK' : 'Text Only Mode'}
                </Text>
                <Text style={styles.toggleSubtitle}>
                  {safeToCall ? 'Safe to call' : 'Silent situation'}
                </Text>
              </View>
            </View>
            <Switch
              value={safeToCall}
              onValueChange={setSafeToCall}
              trackColor={{ false: '#E5E7EB', true: '#DCFCE7' }}
              thumbColor={safeToCall ? '#059669' : '#6B7280'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>

          {/* Emergency Alert Section */}
          <View style={styles.emergencySection}>
            <View style={styles.emergencyHeader}>
              <Text style={styles.emergencyTitle}>Emergency Alert</Text>
              <Text style={styles.emergencySubtitle}>
                {pressCount === 0
                  ? 'Triple-tap the SOS button to send emergency alert'
                  : `${3 - pressCount} more tap${3 - pressCount !== 1 ? 's' : ''} required`}
              </Text>
            </View>

            {/* Progress Indicator */}
            {pressCount > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <Animated.View style={[
                    styles.progressFill,
                    { width: `${(pressCount / 3) * 100}%` }
                  ]} />
                </View>
                <Text style={styles.progressText}>{pressCount}/3</Text>
              </View>
            )}

{/* SOS Button */}
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
          size={40}
          color="#fff"
          style={styles.icon}
        />
        <Text style={styles.sosButtonText}>
          {isLoading ? 'SENDING' : 'SOS'}
        </Text>
        <Text style={styles.sosButtonSubtext}>
          {isLoading ? 'Please wait...' : 'Emergency'}
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
                    size={20}
                    color={selectedType.color}
                  />
                </View>
                <Text style={styles.selectedTypeText}>
                  Ready to send: {selectedType.label}
                </Text>
              </View>
            )}
          </View>

          {/* Media Upload Section */}
          {showMediaUpload && currentIncidentId && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="cloud-upload" size={24} color="#7C3AED" />
                </View>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>Evidence Upload</Text>
                  <Text style={styles.sectionSubtitle}>Attach photos, videos, or audio</Text>
                </View>
              </View>
              <Suspense fallback={
                <View style={styles.uploadLoader}>
                  <Ionicons name="hourglass" size={24} color="#6B7280" />
                  <Text style={styles.uploadLoaderText}>Loading uploader...</Text>
                </View>
              }>
                <MediaUpload
                  incidentId={currentIncidentId}
                  onUploadComplete={handleMediaUploadComplete}
                />
              </Suspense>
            </View>
          )}

          {/* Safety Tips */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={styles.tipsTitle}>Safety Reminder</Text>
            </View>
            <View style={styles.tipsContent}>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Ensure your location services are enabled</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Keep your phone charged when possible</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Only use this for genuine emergencies</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Stay calm and follow responder instructions</Text>
              </View>
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
    padding: 20,
    paddingBottom: 100,
  },

  // Header Styles
  header: {
    position: 'relative',
    backgroundColor: '#0F172A',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F172A',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  
  headerContent: {
    alignItems: 'center',
  },
  
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  
  statusText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  headerTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },

  // Section Card Styles
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  
  sectionTitleContainer: {
    flex: 1,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Incident Grid Styles
  incidentGridContainer: {
    marginTop: 16,
  },
  
  incidentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  
  incidentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  
  incidentCardThreeColumn: {
    flex: 0.32,
  },
  
  incidentCardTwoColumn: {
    flex: 0.48,
  },
  
  incidentCardSelected: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  
  incidentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  incidentLabel: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
  
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Communication Toggle Styles
  communicationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  toggleText: {
    flex: 1,
  },
  
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  
  toggleSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Emergency Section Styles
  emergencySection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  
  emergencyHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  
  emergencyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  emergencySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Progress Indicator Styles
  progressContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },

  // SOS Button Styles
  sosContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  
  pulseWrapper: {
    borderRadius: 100,
  },
  
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#000000ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  
  sosButtonReady: {
    backgroundColor: '#ca2020ff',
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
  
  iconContainer: {
    marginBottom: 8,
  },
  
  sosButtonText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  
  sosButtonSubtext: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },



  // Selected Type Display Styles
  selectedTypeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  
  selectedTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  selectedTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },

  // Upload Loader Styles
  uploadLoader: {
    alignItems: 'center',
    padding: 32,
  },
  
  uploadLoaderText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },

  // Safety Tips Styles
  tipsCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginLeft: 8,
  },
  
  tipsContent: {
    gap: 12,
  },
  
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
    marginTop: 6,
    marginRight: 12,
  },
  
  tipText: {
    fontSize: 14,
    color: '#92400e',
    flex: 1,
    lineHeight: 20,
  },
});