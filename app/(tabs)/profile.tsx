// app/(tabs)/profile.tsx - Ecranul de Profil/Logout

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { Button, StyleSheet, View } from 'react-native';
import { useAuth } from '../_layout'; // Importăm noul hook de autentificare

export default function ProfileScreen() {
  const { signOut } = useAuth(); // Extragem funcția de signOut

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Ecranul Profil</ThemedText>
      <ThemedText style={styles.text}>
        Sunteți autentificat. Aceasta este o rută protejată.
      </ThemedText>
      
      <View style={styles.buttonContainer}>
        <Button title="Logout" onPress={signOut} color="#E74C3C" />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    width: '80%',
    marginTop: 20,
  }
});