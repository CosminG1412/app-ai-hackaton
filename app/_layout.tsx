// app/_layout.tsx - MODIFICĂ ÎNTREGUL CONȚINUT

import { router, SplashScreen, Stack, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

// 1. Creăm Contextul de Autentificare
interface AuthContextType {
  isLoggedIn: boolean;
  signIn: (token: string) => void;
  signOut: () => void;
}
const AuthContext = createContext<AuthContextType | null>(null);

// Hook customizat pentru a folosi contextul
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth trebuie folosit în interiorul unui AuthProvider');
  }
  return context;
};

// Provider de Autentificare
function AuthProvider({ children }: { children: React.ReactNode }) {
  // Vom simula starea de autentificare. În realitate, aici ați folosi AsyncStorage.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); 
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Funcții de login/logout
  const signIn = (token: string) => {
    // În producție, aici ați salva tokenul.
    console.log("User signed in with token:", token);
    setIsLoggedIn(true);
  };

  const signOut = () => {
    // În producție, aici ați șterge tokenul.
    console.log("User signed out.");
    setIsLoggedIn(false);
  };

  useEffect(() => {
    // Simulează verificarea rapidă a tokenului
    // Înlocuiți cu logica reală: citirea tokenului din AsyncStorage
    setIsLoading(false); 
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, signIn, signOut }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

// Componentă de redirecționare (Router Guard)
function RootLayoutNav() {
  const segments = useSegments();
  const { isLoggedIn, isLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ascunde splash screen-ul după ce AuthProvider este gata
    if (!isLoading) {
      SplashScreen.hideAsync();
      setIsReady(true);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    // Logica de redirecționare:
    if (!isLoggedIn && !inAuthGroup) {
      // Dacă NU ești logat și încerci să accesezi o rută protejată, mergi la Login.
      router.replace('/(auth)/login');
    } else if (isLoggedIn && inAuthGroup) {
      // Dacă ești logat și ești pe pagina de login, mergi la paginile principale.
      router.replace('/');
    }
  }, [isLoggedIn, segments, isReady]);

  return (
    <Stack>
      {/* 1. Ruta pentru ecranele de autentificare (ne-protejate) */}
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      
      {/* 2. Ruta pentru taburi (protejată) */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* 3. Ruta pentru modal (sau alte rute publice) */}
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

// Layout-ul final al aplicației
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}