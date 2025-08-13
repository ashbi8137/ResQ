import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { Alert, FlatList, Platform, RefreshControl, Image,StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { EmergencyAlert, EmergencyService } from '../lib/emergencyService'


export default function AuthorityDashboard() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'critical'>('all')

  useEffect(() => {
    loadAlerts()
    // Auto refresh every 30 seconds
    const interval = setInterval(loadAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadAlerts = async () => {
    try {
      if (!refreshing) setLoading(true)
      const emergencyAlerts = await EmergencyService.getEmergencyAlerts()
      // Sort by priority and creation time
      const sortedAlerts = emergencyAlerts.sort((a, b) => {
        const aPriority = getPriorityLevel(a.emergency_type, a.safe_to_call)
        const bPriority = getPriorityLevel(b.emergency_type, b.safe_to_call)
        const priorityOrder = { 'CRITICAL': 3, 'HIGH': 2, 'MEDIUM': 1 }
        const priorityDiff = priorityOrder[bPriority] - priorityOrder[aPriority]
        if (priorityDiff !== 0) return priorityDiff
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      setAlerts(sortedAlerts)
    } catch (error) {
      console.error('Error loading alerts:', error)
      Alert.alert('⚠️ Connection Error', 'Failed to load emergency alerts. Please check your connection.')
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
        setAlerts(prevAlerts => 
          prevAlerts.map(alert => 
            alert.incident_id === incidentId 
              ? { ...alert, status: newStatus, updated_at: new Date().toISOString() }
              : alert
          )
        )
        Alert.alert('✅ Status Updated', `Alert #${incidentId.slice(-8)} has been marked as ${newStatus.replace('_', ' ')}.`)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error updating alert status:', error)
      Alert.alert('❌ Update Failed', 'Unable to update alert status. Please try again.')
    }
  }

  const getStatusColor = (status: EmergencyAlert['status']) => {
    switch (status) {
      case 'pending': return { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' }
      case 'received': return { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' }
      case 'in_progress': return { bg: '#FEE2E2', text: '#B91C1C', border: '#EF4444' }
      case 'resolved': return { bg: '#D1FAE5', text: '#065F46', border: '#10B981' }
      default: return { bg: '#F3F4F6', text: '#374151', border: '#9CA3AF' }
    }
  }

  const getEmergencyTypeIcon = (type: EmergencyAlert['emergency_type']) => {
    switch (type) {
      case 'domestic_violence': return 'shield-outline'
      case 'accident': return 'car-outline'
      case 'medical': return 'medical-outline'
      case 'disaster': return 'flame-outline'
      case 'other': return 'help-circle-outline'
      default: return 'alert-circle-outline'
    }
  }

  const getEmergencyTypeConfig = (type: EmergencyAlert['emergency_type']) => {
    switch (type) {
      case 'domestic_violence': 
        return { color: '#DC2626', bg: '#FEF2F2', label: 'Domestic Violence' }
      case 'accident': 
        return { color: '#D97706', bg: '#FFFBEB', label: 'Accident' }
      case 'medical': 
        return { color: '#059669', bg: '#F0FDF4', label: 'Medical Emergency' }
      case 'disaster': 
        return { color: '#EA580C', bg: '#FFF7ED', label: 'Disaster/Fire' }
      case 'other': 
        return { color: '#7C3AED', bg: '#FAF5FF', label: 'Other Emergency' }
      default: 
        return { color: '#6B7280', bg: '#F9FAFB', label: 'Unknown' }
    }
  }

  const getPriorityLevel = (type: EmergencyAlert['emergency_type'], safeToCall: boolean) => {
    const highPriority = ['domestic_violence', 'medical'];
    if (highPriority.includes(type) && !safeToCall) return 'CRITICAL';
    if (highPriority.includes(type)) return 'HIGH';
    return 'MEDIUM';
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return { color: '#DC2626', bg: '#FEE2E2', pulse: true }
      case 'HIGH': return { color: '#EA580C', bg: '#FED7AA', pulse: false }
      case 'MEDIUM': return { color: '#D97706', bg: '#FEF3C7', pulse: false }
      default: return { color: '#6B7280', bg: '#F3F4F6', pulse: false }
    }
  }

  const getTimeDifference = (createdAt: string) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const initiateCall = (phoneNumber: string, safeToCall: boolean) => {
    if (!safeToCall) {
      Alert.alert(
        '⚠️ Safety Warning',
        'This victim has indicated it is NOT safe to call. Consider alternative contact methods or silent response.',
        [
          { text: 'Understood', style: 'cancel' },
          { text: 'Emergency Call Anyway', style: 'destructive', onPress: () => console.log('Emergency call initiated') }
        ]
      )
    } else {
      Alert.alert(
        '📞 Initiate Call',
        `Contact victim at ${phoneNumber}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call Now', onPress: () => console.log(`Calling ${phoneNumber}`) }
        ]
      )
    }
  }

  const getFilteredAlerts = () => {
    switch (filterStatus) {
      case 'active':
        return alerts.filter(alert => alert.status !== 'resolved')
      case 'critical':
        return alerts.filter(alert => getPriorityLevel(alert.emergency_type, alert.safe_to_call) === 'CRITICAL')
      default:
        return alerts
    }
  }

  const renderAlert = ({ item }: { item: EmergencyAlert }) => {
    const priority = getPriorityLevel(item.emergency_type, item.safe_to_call)
    const priorityConfig = getPriorityConfig(priority)
    const statusConfig = getStatusColor(item.status)
    const typeConfig = getEmergencyTypeConfig(item.emergency_type)
    const timeAgo = getTimeDifference(item.created_at)

    return (
      <View style={[
        styles.alertCard, 
        { borderLeftColor: priorityConfig.color },
        priorityConfig.pulse && styles.criticalAlert
      ]}>
        {/* Alert Header */}
        <View style={styles.alertHeader}>
          <View style={styles.alertMainInfo}>
            <View style={[styles.typeIconContainer, { backgroundColor: typeConfig.bg }]}>
              <Ionicons 
                name={getEmergencyTypeIcon(item.emergency_type) as any} 
                size={20} 
                color={typeConfig.color} 
              />
            </View>
            <View style={styles.alertTitleSection}>
              <View style={styles.titleRow}>
                <Text style={styles.incidentId}>#{item.incident_id.slice(-8)}</Text>
                <Text style={styles.timeStamp}>{timeAgo}</Text>
              </View>
              <Text style={styles.emergencyType}>{typeConfig.label}</Text>
            </View>
          </View>
          
          <View style={styles.badgeSection}>
            <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.bg }]}>
              <Text style={[styles.priorityText, { color: priorityConfig.color }]}>{priority}</Text>
            </View>
          </View>
        </View>

        {/* Status Bar */}
        <View style={[styles.statusBar, { backgroundColor: statusConfig.bg }]}>
          <Ionicons name="information-circle" size={14} color={statusConfig.text} />
          <Text style={[styles.statusText, { color: statusConfig.text }]}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <View style={styles.contactRow}>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text style={styles.contactText}>{item.phone_number}</Text>
            </View>
            <View style={styles.locationItem}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.locationText}>
                {item.location_lat.toFixed(4)}, {item.location_lng.toFixed(4)}
              </Text>
            </View>
          </View>
        </View>

       {/* Safety Status */}
<View style={[
  styles.safetyCard,
  { backgroundColor: item.safe_to_call ? '#F0FDF4' : '#FEF2F2' }
]}>
  <Ionicons 
    name={item.safe_to_call ? "checkmark-circle" : "warning"} 
    size={18} 
    color={item.safe_to_call ? "#059669" : "#DC2626"} 
  />
  <Text style={[
    styles.safetyText, 
    { color: item.safe_to_call ? "#059669" : "#DC2626" }
  ]}>
    {item.safe_to_call 
      ? 'Safe to contact via phone' 
      : 'Silent response required - NOT safe to call'}
  </Text>
</View>
{/* Uploaded Evidence */}
{Array.isArray(item.media_urls) && item.media_urls.length > 0 && (
  <View style={styles.evidenceContainer}>
    <Text style={styles.evidenceTitle}>Uploaded Evidence</Text>
    <FlatList
      horizontal
      data={item.media_urls}
      keyExtractor={(uri, idx) => `${item.incident_id}-media-${idx}`}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item: mediaUrl, index }) => (
        <View style={styles.evidenceItem}>
          <Image
            source={{ uri: mediaUrl }}
            style={styles.evidenceImage}
            resizeMode="cover"
          />
          <Text style={styles.mediaIndex}>#{index + 1}</Text>
        </View>
      )}
    />
  </View>
)}

      {/* Additional Notes */}
{item.notes && (
  <View style={styles.notesCard}>
    <View style={styles.notesHeader}>
      <Ionicons name="document-text-outline" size={16} color="#6B7280" />
      <Text style={styles.notesLabel}>Additional Information</Text>
    </View>
    <Text style={styles.notesText}>{item.notes}</Text>
  </View>
)}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.contactButton,
              !item.safe_to_call && styles.warningButton
            ]}
            onPress={() => initiateCall(item.phone_number, item.safe_to_call)}
          >
            <Ionicons 
              name={item.safe_to_call ? "call" : "warning"} 
              size={16} 
              color="white" 
            />
            <Text style={styles.actionButtonText}>
              {item.safe_to_call ? 'Contact' : 'Unsafe'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.updateButton]}
            onPress={() => {
              const statusOptions = [
                { label: 'Mark as Received', value: 'received' },
                { label: 'Set In Progress', value: 'in_progress' },
                { label: 'Mark Resolved', value: 'resolved' }
              ].filter(option => option.value !== item.status)

              Alert.alert(
                'Update Status',
                'Choose new alert status:',
                [
                  ...statusOptions.map(option => ({
                    text: option.label,
                    onPress: () => updateAlertStatus(item.incident_id, option.value as any)
                  })),
                  { text: 'Cancel', style: 'cancel' }
                ]
              )
            }}
          >
            <Ionicons name="sync" size={16} color="white" />
            <Text style={styles.actionButtonText}>Update</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.locationButton]}
            onPress={() => {
              Alert.alert(
                '📍 Location Details',
                `Coordinates: ${item.location_lat.toFixed(6)}, ${item.location_lng.toFixed(6)}\n\nWould you like to open this location in maps?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Open Maps', onPress: () => console.log('Opening maps...') }
                ]
              )
            }}
          >
            <Ionicons name="map" size={16} color="white" />
            <Text style={styles.actionButtonText}>Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (loading && alerts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <Ionicons name="sync" size={48} color="#3B82F6" />
          <Text style={styles.loadingTitle}>Loading Emergency Dashboard</Text>
          <Text style={styles.loadingSubtitle}>Connecting to emergency services...</Text>
        </View>
      </View>
    )
  }

  const filteredAlerts = getFilteredAlerts()
  const activeAlerts = alerts.filter(alert => alert.status !== 'resolved')
  const criticalAlerts = alerts.filter(alert => getPriorityLevel(alert.emergency_type, alert.safe_to_call) === 'CRITICAL')
  const inProgressAlerts = alerts.filter(alert => alert.status === 'in_progress')

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerIcon}>
            <Ionicons name="shield-checkmark" size={28} color="#fff" />
          </View>
          <View style={styles.headerTitle}>
            <Text style={styles.headerMainTitle}>Emergency Command</Text>
            <Text style={styles.headerSubtitle}>Authority Response Center</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Stats Dashboard */}
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={[styles.statCard, filterStatus === 'active' && styles.activeFilter]}
            onPress={() => setFilterStatus(filterStatus === 'active' ? 'all' : 'active')}
          >
            <Text style={styles.statNumber}>{activeAlerts.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statCard, filterStatus === 'critical' && styles.activeFilter]}
            onPress={() => setFilterStatus(filterStatus === 'critical' ? 'all' : 'critical')}
          >
            <Text style={[styles.statNumber, { color: '#FEE2E2' }]}>{criticalAlerts.length}</Text>
            <Text style={styles.statLabel}>Critical</Text>
          </TouchableOpacity>
          
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#FED7AA' }]}>{inProgressAlerts.length}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.statCard, filterStatus === 'all' && styles.activeFilter]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={styles.statNumber}>{alerts.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Alerts List */}
      <FlatList
        data={filteredAlerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
              <Text style={styles.emptyTitle}>
                {filterStatus === 'critical' ? 'No Critical Alerts' : 
                 filterStatus === 'active' ? 'No Active Alerts' : 'All Clear'}
              </Text>
              <Text style={styles.emptyText}>
                {filterStatus === 'all' 
                  ? 'No emergency alerts reported at this time'
                  : `No ${filterStatus} alerts found`
                }
              </Text>
              <TouchableOpacity 
                style={styles.clearFilterButton}
                onPress={() => setFilterStatus('all')}
              >
                <Text style={styles.clearFilterText}>View All Alerts</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1E293B',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerMainTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#CBD5E1',
    fontSize: 14,
    marginTop: 2,
  },
  evidenceContainer: {
    marginBottom: 16,
  },
  evidenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  evidenceItem: {
    marginRight: 12,
    alignItems: 'center',
  },
  evidenceImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  mediaIndex: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeFilter: {
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  criticalAlert: {
    shadowColor: '#DC2626',
    shadowOpacity: 0.2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  alertMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  typeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertTitleSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incidentId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  timeStamp: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  emergencyType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  badgeSection: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  contactSection: {
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  safetyText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  notesCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  contactButton: {
    backgroundColor: '#059669',
  },
  warningButton: {
    backgroundColor: '#DC2626',
  },
  updateButton: {
    backgroundColor: '#3B82F6',
  },
  locationButton: {
    backgroundColor: '#7C3AED',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  clearFilterButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  clearFilterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});