import * as Location from 'expo-location';
import { EmergencyAlert, supabase } from './supabase';
// Removed incorrect import of Image, FlatList, Alert here — those belong in component files, not service files

// Re-export EmergencyAlert for components to use
export type { EmergencyAlert };

export class EmergencyService {
  // Create a new emergency alert
  static async createEmergencyAlert(
    phoneNumber: string,
    emergencyType: EmergencyAlert['emergency_type'],
    safeToCall: boolean,
    notes?: string,
    media_urls?: string[]
  ): Promise<{ success: boolean; incidentId?: string; error?: string }> {
    try {
      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return { success: false, error: 'Location permission denied' };
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Insert into database
      const { data, error } = await supabase
        .from('emergency_alerts')
        .insert({
          phone_number: phoneNumber,
          location_lat: latitude,
          location_lng: longitude,
          emergency_type: emergencyType,
          safe_to_call: safeToCall,
          notes: notes,
          media_urls: media_urls || []
        })
        .select('incident_id')
        .single();

      if (error) {
        console.error('Error creating emergency alert:', error);
        return { success: false, error: error.message };
      }

      return { success: true, incidentId: data.incident_id };
    } catch (error) {
      console.error('Error in createEmergencyAlert:', error);
      return { success: false, error: 'Failed to create emergency alert' };
    }
  }

  // Get all emergency alerts (for dashboard)
  static async getEmergencyAlerts(): Promise<EmergencyAlert[]> {
    try {
      const { data, error } = await supabase
        .from('emergency_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching emergency alerts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getEmergencyAlerts:', error);
      return [];
    }
  }

  // Update alert status
  static async updateAlertStatus(
    incidentId: string,
    status: EmergencyAlert['status']
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('emergency_alerts')
        .update({ status })
        .eq('incident_id', incidentId);

      if (error) {
        console.error('Error updating alert status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateAlertStatus:', error);
      return { success: false, error: 'Failed to update status' };
    }
  }

  // Add media URLs to an alert
  static async addMediaToAlert(
    incidentId: string,
    mediaUrls: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First get current media URLs
      const { data: currentAlert, error: fetchError } = await supabase
        .from('emergency_alerts')
        .select('media_urls')
        .eq('incident_id', incidentId)
        .single();

      if (fetchError) {
        console.error('Error fetching current alert:', fetchError);
        return { success: false, error: fetchError.message };
      }

      // Combine existing and new media URLs
      const currentUrls = currentAlert.media_urls || [];
      const updatedUrls = [...currentUrls, ...mediaUrls];

      // Update with combined URLs
      const { error } = await supabase
        .from('emergency_alerts')
        .update({ media_urls: updatedUrls })
        .eq('incident_id', incidentId);

      if (error) {
        console.error('Error adding media to alert:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in addMediaToAlert:', error);
      return { success: false, error: 'Failed to add media' };
    }
  }

  // Get authority contacts
  static async getAuthorityContacts() {
    try {
      const { data, error } = await supabase
        .from('authority_contacts')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching authority contacts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAuthorityContacts:', error);
      return [];
    }
  }
}
