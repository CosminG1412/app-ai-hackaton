import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth'; // <-- FIX AICI
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

const MOCK_USERNAME = "user@test.com";
const MOCK_PASSWORD = "password123";

const BLACK_TEXT = Colors.light.text;
const SUBTLE_GRAY_BACKGROUND = '#F8F8F8';
const WHITE_FORM_BACKGROUND = '#FFFFFF';

export default function LoginScreen() {
  const [email, setEmail] = useState(MOCK_USERNAME);
  const [password, setPassword] = useState(MOCK_PASSWORD);

  const { signIn } = useAuth();  // acum este corect

  const accentColor = useThemeColor({}, 'tint');

  const handleLogin = () => {
    if (email === MOCK_USERNAME && password === MOCK_PASSWORD) {
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      signIn(mockToken);
    } else {
      Alert.alert("Eroare Autentificare", "Email sau parolă incorectă.");
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: SUBTLE_GRAY_BACKGROUND }]}>
      <Ionicons
        name="person-circle-outline"
        size={90}
        color={BLACK_TEXT}
        style={styles.logoIcon}
      />

      <ThemedText type="title" style={[styles.title, { color: BLACK_TEXT }]}>
        Bine ați venit!
      </ThemedText>

      <ThemedView style={[styles.formContainer, { backgroundColor: WHITE_FORM_BACKGROUND }]}>
        <TextInput
          style={[styles.input, { color: BLACK_TEXT }]}
          placeholder="Email (user@test.com)"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
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

      <TouchableOpacity
        style={[styles.customButton, { backgroundColor: accentColor, width: '70%', height: 45 }]}
        onPress={handleLogin}
      >
        <Text style={[styles.buttonText, { color: BLACK_TEXT }]}>LOGIN</Text>
      </TouchableOpacity>
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
  formContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
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
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
