import { Image } from 'expo-image';
import {StyleSheet } from 'react-native';

// import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  return (
   <ParallaxScrollView
  headerBackgroundColor={{ light: '#ffffffff', dark: '#000000ff' }}
  headerImage={
    <Image
      source={require('@/assets/images/resq.jpg')}
      style={styles.reactLogo}
    />
  }>
  
  <ThemedView style={styles.titleContainer}>
    <ThemedText type="title">ResQ - Quick Emergency Response</ThemedText>
  </ThemedView>

  <ThemedView style={styles.stepContainer}>
    <ThemedText type="subtitle">1. Trigger Alert</ThemedText>
    <ThemedText>Triple-tap discreetly to start an emergency alert.</ThemedText>
  </ThemedView>

  <ThemedView style={styles.stepContainer}>
    <ThemedText type="subtitle">2. Share Details</ThemedText>
    <ThemedText>App collects emergency type, GPS location, and contact info.</ThemedText>
  </ThemedView>

  <ThemedView style={styles.stepContainer}>
    <ThemedText type="subtitle">3. Confirm Safety</ThemedText>
    <ThemedText>Select if you’re safe for a callback.</ThemedText>
  </ThemedView>

  <ThemedView style={styles.stepContainer}>
    <ThemedText type="subtitle">4. Send to Authorities</ThemedText>
    <ThemedText>Alert sent with incident ID, secure link, and location.</ThemedText>
  </ThemedView>

  <ThemedView style={styles.stepContainer}>
    <ThemedText type="subtitle">5. Optional Evidence</ThemedText>
    <ThemedText>Upload photos/videos linked to your incident dashboard.</ThemedText>
  </ThemedView>

  <ThemedView style={styles.stepContainer}>
    <ThemedText type="subtitle">6. Track Status</ThemedText>
    <ThemedText>Authorities update case progress: Received → In Progress → Resolved.</ThemedText>
  </ThemedView>

</ParallaxScrollView>

  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 5,
    left: 55,
    position: 'absolute',
  },
});
