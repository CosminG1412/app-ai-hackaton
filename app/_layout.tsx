// app/_layout.tsx - CODUL CENTRAL DE AUTENTIFICARE ȘI GUARD (Final)

import { router, SplashScreen, Stack, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
// IMPORT CORECT: Folosește alias-ul de root
import { AuthProvider, useAuth } from "@/hooks/use-auth";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const segments = useSegments();
  const { isAuthenticated, isAuthLoading } = useAuth();
  
  const inAuthGroup = segments[0] === '(auth)';
  
  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isAuthLoading]);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}