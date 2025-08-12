import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Platform, StyleSheet, Switch, Text, TouchableOpacity, Vibration, View, ScrollView, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Speech from 'expo-speech';
import { EmergencyService } from '../../lib/emergencyService';

const MediaUpload = React.lazy(() => import('../../components/MediaUpload'));

export default function HomeScreen() {
  const [safeToCall, setSafeToCall] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [pressCount, setPressCount] = useState(0);
  const [currentIncidentId, setCurrentIncidentId] = useState<string | null>(null);
  const [phoneNumber] = useState('+1234567890');
  const [isLoading, setIsLoading] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  const incidentTypes = [
    { id: 'domestic_violence', icon: 'shield-outline', label: 'Domestic Violence', color: '#DC2626', bgColor: '#FEF2F2', gradient: ['#FEF2F2', '#FEE2E2'] },
    { id: 'accident', icon: 'car-outline', label: 'Vehicle Accident', color: '#D97706', bgColor: '#FFFBEB', gradient: ['#FFFBEB', '#FEF3C7'] },
    { id: 'disaster', icon: 'flame-outline', label: 'Fire/Disaster', color: '#EA580C', bgColor: '#FFF7ED', gradient: ['#FFF7ED', '#FFEDD5'] },
    { id: 'medical', icon: 'medical-outline', label: 'Medical Emergency', color: '#059669', bgColor: '#F0FDF4', gradient: ['#F0FDF4', '#DCFCE7'] },
    { id: 'other', icon: 'help-circle-outline', label: 'Other Emergency', color: '#7C3AED', bgColor: '#FAF5FF', gradient: ['#FAF5FF', '#F3E8FF'] },
  ];

  useEffect(() => {
    (async () => {
      const lastIncident = await AsyncStorage.getItem('lastIncident');
      if (lastIncident) setSelectedIncident(lastIncident);
    })();

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

  const triggerAlert = async (incidentOverride?: string) => {
    const finalIncident = incidentOverride || selectedIncident;

    if (!finalIncident) {
      Alert.alert('⚠️ Missing Information', 'Please select an emergency type before triggering the alert.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await EmergencyService.createEmergencyAlert(
        phoneNumber,
        finalIncident as any,
        safeToCall
      );

      if (result.success && result.incidentId) {
        setCurrentIncidentId(result.incidentId);
        setShowMediaUpload(true);

        if (Platform.OS !== 'web') {
          Vibration.vibrate([0, 500, 200, 500]);
        }

        Alert.alert(
          '🚨 Emergency Alert Sent',
          `Alert Type: ${incidentTypes.find(t => t.id === finalIncident)?.label}\nCommunication: ${safeToCall ? 'Voice call enabled' : 'Silent mode'}\nIncident ID: ${result.incidentId}\n\nAuthorities have been notified of your location.`,
          [{ text: 'OK', style: 'default' }]
        );
        setPressCount(0);
      } else {
        Alert.alert('❌ Alert Failed', result.error || 'Unable to send emergency alert. Please try again.');
      }
    } catch (error) {
      console.error('Error triggering alert:', error);
      Alert.alert('❌ Connection Error', 'Failed to send emergency alert. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncidentSelect = async (id: string) => {
    setSelectedIncident(id);
    await AsyncStorage.setItem('lastIncident', id);
    // Speech.speak(`${incidentTypes.find(type => type.id === id)?.label} selected`);
  };

  const handlePanicPress = () => {
    const newCount = pressCount + 1;
    setPressCount(newCount);

    if (Platform.OS !== 'web') {
      Vibration.vibrate(100);
    }

    pulseAnim.setValue(1);
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();

    if (newCount === 3) {
      triggerAlert(selectedIncident || 'other');
    } else {
      setTimeout(() => {
        setPressCount(0);
      }, 3000);
    }
  };

  const handleMediaUploadComplete = () => {
    Alert.alert('✅ Upload Successful', 'Evidence has been uploaded and attached to your emergency report.');
  };

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
          <Text style={styles.headerTitle}>ResQ Emergency</Text>
          <Text style={styles.headerSubtitle}>Immediate Response System</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Quick Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusCardHeader}>
              <View style={styles.statusCardIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
              </View>
              <Text style={styles.statusCardTitle}>System Status</Text>
            </View>
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Text style={styles.statusValue}>GPS</Text>
                <Text style={styles.statusLabel}>Active</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusValue}>Network</Text>
                <Text style={styles.statusLabel}>Connected</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusValue}>Services</Text>
                <Text style={styles.statusLabel}>Available</Text>
              </View>
            </View>
          </View>

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
                        name={type.icon as any}
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

          {/* Communication Preferences */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="call" size={24} color="#3B82F6" />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Communication Method</Text>
                <Text style={styles.sectionSubtitle}>How emergency services should contact you</Text>
              </View>
            </View>

            <View style={styles.communicationContainer}>
              <View style={styles.communicationOption}>
                <View style={[
                  styles.communicationIcon,
                  { backgroundColor: safeToCall ? '#DCFCE7' : '#FEF2F2' }
                ]}>
                  <Ionicons
                    name={safeToCall ? 'call' : 'call-off'}
                    size={24}
                    color={safeToCall ? '#059669' : '#DC2626'}
                  />
                </View>
                <View style={styles.communicationContent}>
                  <Text style={styles.communicationTitle}>
                    {safeToCall ? 'Voice Communication' : 'Silent Mode'}
                  </Text>
                  <Text style={styles.communicationDescription}>
                    {safeToCall 
                      ? 'Emergency services can call you directly' 
                      : 'Text messages and data communication only'
                    }
                  </Text>
                  <View style={[
                    styles.communicationStatus,
                    { backgroundColor: safeToCall ? '#DCFCE7' : '#FEF2F2' }
                  ]}>
                    <Text style={[
                      styles.communicationStatusText,
                      { color: safeToCall ? '#059669' : '#DC2626' }
                    ]}>
                      {safeToCall ? 'ENABLED' : 'DISABLED'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={safeToCall}
                  onValueChange={setSafeToCall}
                  trackColor={{ false: '#FEE2E2', true: '#DCFCE7' }}
                  thumbColor={safeToCall ? '#059669' : '#DC2626'}
                  style={styles.communicationSwitch}
                />
              </View>
            </View>
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
                  <View style={[
                    styles.progressFill,
                    { width: `${(pressCount / 3) * 100}%` }
                  ]} />
                </View>
                <Text style={styles.progressText}>{pressCount}/3</Text>
              </View>
            )}

            {/* SOS Button */}
            <View style={styles.sosContainer}>
              {/* Ripple Effect */}
              <Animated.View style={[
                styles.rippleOuter,
                {
                  opacity: rippleAnim,
                  transform: [{
                    scale: rippleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.5]
                    })
                  }]
                }
              ]} />
              <Animated.View style={[
                styles.rippleInner,
                {
                  opacity: rippleAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.3, 0]
                  }),
                  transform: [{
                    scale: rippleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3]
                    })
                  }]
                }
              ]} />

              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[
                    styles.sosButton,
                    selectedIncident && styles.sosButtonReady,
                    isLoading && styles.sosButtonLoading
                  ]}
                  onPress={handlePanicPress}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <View style={styles.sosButtonInner}>
                    {isLoading ? (
                      <>
                        <Ionicons name="hourglass" size={36} color="#ffffff" />
                        <Text style={styles.sosButtonText}>SENDING</Text>
                        <Text style={styles.sosButtonSubtext}>Please wait...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="warning" size={36} color="#ffffff" />
                        <Text style={styles.sosButtonText}>SOS</Text>
                        <Text style={styles.sosButtonSubtext}>Emergency</Text>
                      </>
                    )}
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
                    name={selectedType.icon as any}
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
                  <Text style={styles.sectionSubtitle}>Attach photos, videos, or audio to your report</Text>
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
            <Text style={styles.tipsText}>
              • Ensure your location services are enabled{'\n'}
              • Keep your phone charged when possible{'\n'}
              • Only use this for genuine emergencies{'\n'}
              • Stay calm and follow responder instructions
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
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
    backgroundColor: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
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
  incidentGrid: {
    gap: 16,
  },
  incidentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    position: 'relative',
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
    marginRight: 16,
  },
  incidentLabel: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  communicationContainer: {
    gap: 16,
  },
  communicationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  communicationIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  communicationContent: {
    flex: 1,
  },
  communicationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  communicationDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  communicationStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  communicationStatusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  communicationSwitch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
  emergencySection: {
    alignItems: 'center',
    marginVertical: 32,
    paddingHorizontal: 20,
  },
  emergencyHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emergencyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  emergencySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  progressBar: {
    width: 200,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DC2626',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  sosContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  rippleOuter: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#DC2626',
  },
  rippleInner: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#EF4444',
  },
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  sosButtonReady: {
    backgroundColor: '#B91C1C',
    shadowOpacity: 0.6,
  },
  sosButtonLoading: {
    backgroundColor: '#6B7280',
    shadowColor: '#6B7280',
  },
  sosButtonInner: {
    alignItems: 'center',
  },
  sosButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 8,
  },
  sosButtonSubtext: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
    marginTop: 2,
  },
  selectedTypeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  uploadLoader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  uploadLoaderText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
});