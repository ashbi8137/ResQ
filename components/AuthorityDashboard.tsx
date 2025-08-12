import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { EmergencyAlert, EmergencyService } from '../lib/emergencyService'

export default function AuthorityDashboard() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const emergencyAlerts = await EmergencyService.getEmergencyAlerts()
      setAlerts(emergencyAlerts)
    } catch (error) {
      console.error('Error loading alerts:', error)
      Alert.alert('Error', 'Failed to load emergency alerts')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAlerts()
    setRefreshing(false)
  }

  const updateAlertStatus = async (incidentId: string, newStatus: EmergencyAlert['status']) => {
    try {
      const result = await EmergencyService.updateAlertStatus(incidentId, newStatus)
      if (result.success) {
        // Update local state
        setAlerts(prevAlerts => 
          prevAlerts.map(alert => 
            alert.incident_id === incidentId 
              ? { ...alert, status: newStatus }
              : alert
          )
        )
        Alert.alert('Success', 'Alert status updated successfully')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error updating alert status:', error)
      Alert.alert('Error', 'Failed to update alert status')
    }
  }

  const getStatusColor = (status: EmergencyAlert['status']) => {
    switch (status) {
      case 'pending': return '#FF9800'
      case 'received': return '#2196F3'
      case 'in_progress': return '#FF5722'
      case 'resolved': return '#4CAF50'
      default: return '#999'
    }
  }

  const getEmergencyTypeIcon = (type: EmergencyAlert['emergency_type']) => {
    switch (type) {
      case 'domestic_violence': return 'warning'
      case 'accident': return 'car'
      case 'medical': return 'medical'
      case 'disaster': return 'earth'
      case 'other': return 'help-circle'
      default: return 'alert-circle'
    }
  }

  const renderAlert = ({ item }: { item: EmergencyAlert }) => (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <View style={styles.alertInfo}>
          <Ionicons 
            name={getEmergencyTypeIcon(item.emergency_type) as any} 
            size={24} 
            color="#FF4444" 
          />
          <Text style={styles.incidentId}>{item.incident_id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.alertDetails}>
        <Text style={styles.phoneNumber}>📞 {item.phone_number}</Text>
        <Text style={styles.location}>
          📍 {item.location_lat.toFixed(6)}, {item.location_lng.toFixed(6)}
        </Text>
        <Text style={styles.emergencyType}>
          🚨 {item.emergency_type.replace('_', ' ').toUpperCase()}
        </Text>
        <Text style={styles.safeToCall}>
          {item.safe_to_call ? '✅ Safe to call' : '❌ Not safe to call'}
        </Text>
        <Text style={styles.timestamp}>
          🕐 {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>

      {item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.callButton]}
          onPress={() => {
            if (item.safe_to_call) {
              Alert.alert('Call Victim', `Call ${item.phone_number}?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Call', onPress: () => console.log('Calling...') }
              ])
            } else {
              Alert.alert('Warning', 'Victim has marked as not safe to call')
            }
          }}
        >
          <Ionicons name="call" size={16} color="white" />
          <Text style={styles.actionButtonText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.statusButton]}
          onPress={() => {
            Alert.alert(
              'Update Status',
              'Select new status:',
              [
                { text: 'Received', onPress: () => updateAlertStatus(item.incident_id, 'received') },
                { text: 'In Progress', onPress: () => updateAlertStatus(item.incident_id, 'in_progress') },
                { text: 'Resolved', onPress: () => updateAlertStatus(item.incident_id, 'resolved') },
                { text: 'Cancel', style: 'cancel' }
              ]
            )
          }}
        >
          <Ionicons name="refresh" size={16} color="white" />
          <Text style={styles.actionButtonText}>Update Status</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading emergency alerts...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Emergency Alerts Dashboard</Text>
        <Text style={styles.headerSubtitle}>Authority View</Text>
      </View>

      <FlatList
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            <Text style={styles.emptyText}>No active emergency alerts</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FF4444',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'white',
    fontSize: 16,
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incidentId: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertDetails: {
    marginBottom: 12,
  },
  phoneNumber: {
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  location: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  emergencyType: {
    fontSize: 14,
    marginBottom: 4,
    color: '#FF4444',
    fontWeight: 'bold',
  },
  safeToCall: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  notesContainer: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6,
    gap: 4,
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  statusButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
})
