// app/screens/ProfileScreen.tsx - RESTAURAT + LOGOUT FUNCȚIONAL

import { Ionicons } from '@expo/vector-icons';
import React from "react";
import { Button, Image, Platform, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from '@/constants/theme';
import { useThemeColor } from "@/hooks/use-theme-color";
// IMPORT CORECT: Folosim alias-ul de root pentru useAuth
import { useAuth } from '@/hooks/use-auth';

// Calculează spațiul de siguranță (notch/status bar) + spațiul suplimentar cerut
const SAFE_AREA_TOP_PADDING = Platform.OS === 'ios' ? 50 : 30; 
const ADDITIONAL_SPACE_REQUESTED = 30; 
const TOTAL_TOP_OFFSET = SAFE_AREA_TOP_PADDING + ADDITIONAL_SPACE_REQUESTED;

// Culoarea principală de accent din tema: #0a7ea4
const TINT_COLOR = '#0a7ea4';

export default function ProfileScreen() {
  // NOU: Extragem funcția de signOut
  const { signOut } = useAuth(); 
  
  // Preluarea culorilor din sistemul de teme
  const tint = useThemeColor({}, 'tint');
  
  // Setăm culorile explicit la Alb pentru a asigura fundalul deschis
  const white = '#FFFFFF';
  const headerBackground = TINT_COLOR; 
  
  // Culori de text fixe, închise, pentru a asigura lizibilitatea pe fundal alb
  const primaryTextColor = Colors.light.text;
  const secondaryTextColor = '#6B7280';

  return (
    <ThemedView lightColor={white} darkColor={white} style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Secțiunea de Antet / Banner - Culoare deschisă. */}
        <View style={[styles.header, { backgroundColor: headerBackground }]} />

        {/* 2. Cardul de Profil - Fundal Alb (forțat) */}
        <ThemedView lightColor={white} darkColor={white} style={styles.profileCard}>
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=12" }}
            style={[styles.profileImage, { borderColor: white }]}
          />
          
          {/* Numele (Andrei) este setat explicit la primaryTextColor (negru) pentru lizibilitate maximă */}
          <ThemedText 
            type="title" 
            style={[styles.nameText, { color: primaryTextColor }]}
          >
            Andrei
          </ThemedText>
          
          {/* Textul @handle folosește o culoare secundară (dark gray) */}
          <ThemedText style={{ color: secondaryTextColor, marginBottom: 10 }}>@andrei_popescu15</ThemedText>

          {/* 3. Afișare Oraș - Design simplificat și lizibil */}
          <View style={styles.cityContainer}>
            <Ionicons name="location-sharp" size={16} color={secondaryTextColor} style={{ marginRight: 5 }} />
            <ThemedText style={{ color: secondaryTextColor, fontSize: 16 }}>
                Oraș: <ThemedText type="defaultSemiBold" style={{ color: primaryTextColor }}>Galati</ThemedText>
            </ThemedText>
          </View>

          <View style={styles.bioContainer}>
            {/* Textul bio folosește primaryTextColor (negru) pentru lizibilitate */}
            <ThemedText style={[styles.bioText, { color: primaryTextColor }]} >
              Student pasionat de AI și dezvoltare mobilă. Îmi place să explorez cele mai frumoase locații din România! 🇷🇴❤️
            </ThemedText>
          </View>
          
          {/* NOU: Butonul de Logout integrat în profil */}
          <View style={styles.logoutButton}>
            <Button title="LOGOUT" onPress={signOut} color="#E74C3C" />
          </View>
          
        </ThemedView>

        {/* Spațiu de umplere */}
        <View style={styles.bottomSpace} />
        
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: TOTAL_TOP_OFFSET, 
  },
  header: {
    height: 150, 
    position: 'relative',
    marginTop: -SAFE_AREA_TOP_PADDING, 
  },
  profileCard: {
    marginTop: -70, 
    marginHorizontal: 20,
    padding: 20,
    paddingTop: 0, 
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 4, 
    marginTop: -60,
  },
  nameText: {
    fontSize: 24,
    marginBottom: 0, 
  },
  cityContainer: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30, 
  },
  bioContainer: {
    paddingHorizontal: 10,
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6', 
  },
  bioText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  bottomSpace: {
    height: 50, 
  },
  logoutButton: { 
    width: '100%', 
    marginTop: 20,
  }
});