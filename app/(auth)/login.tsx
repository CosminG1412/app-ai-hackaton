// app/(auth)/login.tsx - STILIZARE FINALĂ: Contrast Alb-Negru și Layout Complet

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme'; // Importăm culorile direct pentru consistență
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../_layout';

// Date de Login Mock
const MOCK_USERNAME = "user@test.com";
const MOCK_PASSWORD = "password123";

// Culoare de contrast (Negru) din tema Light pentru icon și text principal
const BLACK_TEXT = Colors.light.text; 
// O nuanță subtilă de gri deschis pentru fundalul general
const SUBTLE_GRAY_BACKGROUND = '#F8F8F8'; 
// O nuanță mai deschisă de alb pentru cardul de formular
const WHITE_FORM_BACKGROUND = '#FFFFFF';

export default function LoginScreen() {
  const [email, setEmail] = useState(MOCK_USERNAME); 
  const [password, setPassword] = useState(MOCK_PASSWORD);
  const { signIn } = useAuth(); 

  // Folosim tint (culoarea primară) doar pentru accent, dar Textul/Icon-ul sunt Negru
  const accentColor = useThemeColor({}, 'tint'); 

  const handleLogin = () => {
    if (email === MOCK_USERNAME && password === MOCK_PASSWORD) {
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      signIn(mockToken);
    } else {
      Alert.alert("Eroare Autentificare", "Email sau parolă incorectă.");
    }
  };

  const handleSignUp = () => {
    Alert.alert("Înregistrare", "Navigare la ecranul de înregistrare...");
    // Aici ar veni logica de navigare la ecranul de Sign Up
  };

  return (
    // Setăm fundalul general la gri deschis
    <ThemedView style={[styles.container, { backgroundColor: SUBTLE_GRAY_BACKGROUND }]}>
      {/* Icon/Logo de accent: Negru */}
      <Ionicons 
        name="person-circle-outline" 
        size={90} 
        color={BLACK_TEXT} 
        style={styles.logoIcon}
      />

      {/* Textul Principal: Negru */}
      <ThemedText type="title" style={[styles.title, { color: BLACK_TEXT }]}>Bine ați venit!</ThemedText>
      <ThemedText style={styles.subtitle}>
        Vă rugăm să vă autentificați pentru a continua.
      </ThemedText>
      
      {/* Container pentru Inputuri cu umbră: Fundal Alb */}
      <ThemedView style={[styles.formContainer, { backgroundColor: WHITE_FORM_BACKGROUND }]}>
          <TextInput
            style={[styles.input, { color: BLACK_TEXT }]}
            placeholder="Email (user@test.com)"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={[styles.input, { color: BLACK_TEXT }]}
            placeholder="Parolă (password123)"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
      </ThemedView>
      
      {/* Buton LOGARE (Fundal Culoare Accent, Text Negru) */}
      <TouchableOpacity 
        style={[styles.customButton, { backgroundColor: accentColor, width: '70%', height: 45 }]}
        onPress={handleLogin}
        activeOpacity={0.8}
      >
        {/* Textul butonului: Negru */}
        <Text style={[styles.buttonText, { color: BLACK_TEXT }]}>LOGIN</Text> 
      </TouchableOpacity>
      
      {/* Panou de Text și Buton Sign Up */}
      <View style={styles.signUpContainer}>
          <ThemedText style={styles.signUpText}>
              Nu ai cont?
          </ThemedText>
          <TouchableOpacity onPress={handleSignUp}>
              {/* Textul butonului Sign Up: Culoare Accent */}
              <ThemedText type="defaultSemiBold" style={[styles.signUpButtonText, { color: '#3749b0dd' }]}>
                  Fă-ți cont
              </ThemedText>
          </TouchableOpacity>
      </View>
      
      <ThemedText style={styles.mockInfo}>
        *Demo Login: user@test.com / password123
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    alignItems: 'center',
  },
  logoIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280', // Gri închis pentru textul secundar
    marginBottom: 30,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  customButton: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpContainer: {
    flexDirection: 'row',
    marginTop: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpText: {
    fontSize: 14,
    marginRight: 5,
    color: '#6B7280',
  },
  signUpButtonText: {
    fontSize: 14,
  },
  mockInfo: {
    marginTop: 20,
    fontSize: 12,
    color: '#888',
  }
});