// app/(auth)/login.tsx - Ecranul de Login Mock

import { ThemedText } from '@/components/themed-text';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, TextInput, View } from 'react-native';
import { useAuth } from '../_layout';

// Date de Login Mock (simulare "mokapi")
const MOCK_USERNAME = "user@test.com";
const MOCK_PASSWORD = "password123";

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth(); 

  const handleLogin = () => {
    if (email === MOCK_USERNAME && password === MOCK_PASSWORD) {
      // Simulăm primirea unui token după autentificare
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      signIn(mockToken);
    } else {
      Alert.alert("Eroare Autentificare", "Email sau parolă incorectă. Folosiți: user@test.com / password123");
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.title}>Login</ThemedText>
      
      <TextInput
        style={styles.input}
        placeholder="Email (user@test.com)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Parolă (password123)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <View style={styles.buttonContainer}>
        <Button title="Logare" onPress={handleLogin} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'white', 
  },
  title: {
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  buttonContainer: {
    marginTop: 10,
  },
});