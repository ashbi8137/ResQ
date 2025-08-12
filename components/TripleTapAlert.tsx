import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native'
import { EmergencyService } from '../lib/emergencyService'

interface TripleTapAlertProps {
  phoneNumber: string
  onAlertTriggered?: (incidentId: string) => void
}

export default function TripleTapAlert({ phoneNumber, onAlertTriggered }: TripleTapAlertProps) {
  const [tapCount, setTapCount] = useState(0)
  const [isTriggered, setIsTriggered] = useState(false)
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const resetTapCount = () => {
    setTapCount(0)
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current)
      tapTimeoutRef.current = null
    }
  }

  const handleTap = async () => {
    if (isTriggered || isLoading) return

    const newTapCount = tapCount + 1
    setTapCount(newTapCount)

    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    // Clear previous timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current)
    }

    // Set new timeout
    tapTimeoutRef.current = setTimeout(() => {
      resetTapCount()
    }, 2000) // Reset after 2 seconds

    // Check if triple tap is achieved
    if (newTapCount === 3) {
      await triggerEmergencyAlert()
      resetTapCount()
    }
  }

  const triggerEmergencyAlert = async () => {
    setIsLoading(true)
    
    try {
      // Strong haptic feedback for alert trigger
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      
      // Show confirmation dialog
      Alert.alert(
        'Emergency Alert',
        'Are you sure you want to send an emergency alert?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsLoading(false)
          },
          {
            text: 'Send Alert',
            style: 'destructive',
            onPress: async () => {
              await sendAlert()
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error triggering alert:', error)
      setIsLoading(false)
    }
  }

  const sendAlert = async () => {
    try {
      // Show emergency type selection
      Alert.alert(
        'Select Emergency Type',
        'What type of emergency are you experiencing?',
        [
          { text: 'Domestic Violence', onPress: () => createAlert('domestic_violence') },
          { text: 'Accident', onPress: () => createAlert('accident') },
          { text: 'Medical Emergency', onPress: () => createAlert('medical') },
          { text: 'Disaster', onPress: () => createAlert('disaster') },
          { text: 'Other', onPress: () => createAlert('other') },
          { text: 'Cancel', style: 'cancel', onPress: () => setIsLoading(false) }
        ]
      )
    } catch (error) {
      console.error('Error sending alert:', error)
      Alert.alert('Error', 'Failed to send emergency alert. Please try again.')
      setIsLoading(false)
    }
  }

  const createAlert = async (emergencyType: any) => {
    try {
      // Ask if safe to call
      Alert.alert(
        'Safe to Call?',
        'Are you in a safe position to receive a callback from authorities?',
        [
          {
            text: 'Not Safe',
            style: 'destructive',
            onPress: () => submitAlert(emergencyType, false)
          },
          {
            text: 'Safe to Call',
            onPress: () => submitAlert(emergencyType, true)
          }
        ]
      )
    } catch (error) {
      console.error('Error creating alert:', error)
      setIsLoading(false)
    }
  }

  const submitAlert = async (emergencyType: any, safeToCall: boolean) => {
    try {
      const result = await EmergencyService.createEmergencyAlert(
        phoneNumber,
        emergencyType,
        safeToCall
      )

      if (result.success && result.incidentId) {
        setIsTriggered(true)
        Vibration.vibrate([0, 500, 200, 500]) // Success vibration pattern
        
        Alert.alert(
          'Alert Sent Successfully',
          `Emergency alert sent with incident ID: ${result.incidentId}`,
          [
            {
              text: 'OK',
              onPress: () => {
                onAlertTriggered?.(result.incidentId!)
                setIsTriggered(false)
                setIsLoading(false)
              }
            }
          ]
        )
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error submitting alert:', error)
      Alert.alert('Error', 'Failed to send emergency alert. Please try again.')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current)
      }
    }
  }, [])

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.tapArea,
          isTriggered && styles.triggered,
          isLoading && styles.loading
        ]}
        onPress={handleTap}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <Text style={styles.tapText}>
          {isLoading ? 'Sending Alert...' : 
           isTriggered ? 'Alert Sent!' : 
           'Tap 3 times for emergency'}
        </Text>
        {tapCount > 0 && !isTriggered && !isLoading && (
          <Text style={styles.tapCount}>{3 - tapCount} more taps</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tapArea: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  triggered: {
    backgroundColor: '#4CAF50',
  },
  loading: {
    backgroundColor: '#FF9800',
  },
  tapText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  tapCount: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
    opacity: 0.8,
  },
})
