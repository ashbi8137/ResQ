import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { Buffer } from 'buffer'
import { useState } from 'react'
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { supabase } from '../lib/supabase' // your Supabase client
import { EmergencyService } from '../lib/emergencyService'

interface MediaUploadProps {
  incidentId: string
  onUploadComplete?: () => void
}

export default function MediaUpload({ incidentId, onUploadComplete }: MediaUploadProps) {
  const [uploadedMedia, setUploadedMedia] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const requestPermissions = async () => {
    if (Platform.OS === 'web') return true
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync()
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert('Permissions Required', 'Camera and photo library permissions are required.')
      return false
    }
    return true
  }

  const pickImage = async (source: 'camera' | 'library') => {
    if (!await requestPermissions()) return
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      }

      let result
      if (source === 'camera') {
        result = Platform.OS === 'web'
          ? await ImagePicker.launchImageLibraryAsync(options)
          : await ImagePicker.launchCameraAsync(options)
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options)
      }

      if (!result.canceled && result.assets[0]) {
        await uploadMedia(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image.')
    }
  }

 

  const uploadMedia = async (uri: string) => {
    setIsUploading(true)
    const bucketName = 'evidence'
  
    try {
      const fileExt = uri.split('.').pop() || 'jpg'
      const fileName = `${incidentId}_${Date.now()}.${fileExt}`
      const filePath = `${FileSystem.cacheDirectory}${fileName}`
  
      await FileSystem.copyAsync({ from: uri, to: filePath })
  
      const fileBase64 = await FileSystem.readAsStringAsync(filePath, { encoding: FileSystem.EncodingType.Base64 })
      const fileBytes = Buffer.from(fileBase64, 'base64')
  
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileBytes, {
          contentType: `image/${fileExt}`,
          upsert: false,
        })
  
      if (uploadError) throw uploadError
  
      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName)
      const publicUrl = publicUrlData.publicUrl
  
      const result = await EmergencyService.addMediaToAlert(incidentId, [publicUrl])
  
      if (result.success) {
        setUploadedMedia(prev => [...prev, publicUrl])
        Alert.alert('Success', 'Media uploaded successfully!')
        onUploadComplete?.()
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading media:', error)
      Alert.alert('Error', 'Failed to upload media.')
    } finally {
      setIsUploading(false)
    }
  }
  
  const showUploadOptions = () => {
    const options = Platform.OS === 'web'
      ? [
          { text: 'Choose from Library', onPress: () => pickImage('library') },
          { text: 'Cancel', style: 'cancel' as const }
        ]
      : [
          { text: 'Take Photo', onPress: () => pickImage('camera') },
          { text: 'Choose from Library', onPress: () => pickImage('library') },
          { text: 'Cancel', style: 'cancel' as const }
        ]

    Alert.alert('Upload Evidence', Platform.OS === 'web'
      ? 'Choose from Library (Camera not on web)'
      : 'Choose source', options)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Evidence</Text>
      <TouchableOpacity
        style={[styles.uploadButton, isUploading && styles.uploading]}
        onPress={showUploadOptions}
        disabled={isUploading}
      >
        <Text style={styles.uploadButtonText}>
          {isUploading ? 'Uploading...' : '+ Add Photo/Video'}
        </Text>
      </TouchableOpacity>

      {uploadedMedia.length > 0 && (
        <View style={styles.mediaContainer}>
          <Text style={styles.mediaTitle}>Uploaded Evidence:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {uploadedMedia.map((uri, index) => (
              <View key={index} style={styles.mediaItem}>
                <Image source={{ uri }} style={styles.mediaImage} />
                <Text style={styles.mediaIndex}>#{index + 1}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#fff' },
  uploadButton: { backgroundColor: '#ff4444', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  uploading: { backgroundColor: '#999' },
  uploadButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  mediaContainer: { marginTop: 10 },
  mediaTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#fff' },
  mediaItem: { marginRight: 15, alignItems: 'center' },
  mediaImage: { width: 80, height: 80, borderRadius: 8, borderWidth: 2, borderColor: '#007AFF' },
  mediaIndex: { marginTop: 5, fontSize: 12, color: '#666' },
})
