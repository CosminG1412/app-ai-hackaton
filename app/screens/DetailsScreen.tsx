import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Dimensions,
  Linking,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Importăm hook-urile necesare din expo-router
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function DetailsScreen() {
  // 1. Folosim hook-urile pentru navigare și parametri
  const router = useRouter();
  const params = useLocalSearchParams();

  // 2. Parsăm datele primite. 
  // useLocalSearchParams returnează string-uri sau array-uri de string-uri.
  let item: any = {};
  try {
    if (params.item && typeof params.item === 'string') {
      item = JSON.parse(params.item);
    }
  } catch (e) {
    console.error("Eroare la parsarea datelor:", e);
  }

  // Dacă nu avem date (caz de eroare), afișăm un mesaj simplu sau o încărcare
  if (!item || !item.name) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 50 }} />
      </View>
    );
  }

  const [aiLoading, setAiLoading] = useState(false);
  const [description, setDescription] = useState(item.short_description);

  const generateAiVibe = () => {
    setAiLoading(true);
    setTimeout(() => {
      setDescription("✨ Vibe Check: Un loc desprins parcă din povești, unde aroma de cafea dansează cu liniștea dimineții. Pereții șoptesc istorie, iar lumina cade perfect pentru următorul tău story. Ești gata să te pierzi în atmosferă?");
      setAiLoading(false);
    }, 2000);
  };

  const handleReservation = () => {
    const message = `Salut! Vreau să fac o rezervare la ${item.name}.`;
    const url = `whatsapp://send?text=${message}`;
    Linking.openURL(url).catch(() => {
      alert('Asigură-te că ai WhatsApp instalat!');
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* IMAGINE HERO */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image_url }} style={styles.image} />
          
          {/* 3. Folosim router.back() pentru navigare înapoi */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.imageOverlay} />
        </View>

        <View style={styles.contentContainer}>
          {/* HEADER: Titlu & Rating */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>{item.name}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          </View>

          <Text style={styles.address}>📍 {item.address}</Text>

          {/* BUTON AI GENERATOR */}
          <TouchableOpacity 
            style={styles.aiButton} 
            onPress={generateAiVibe}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.aiButtonText}>Generează Vibe cu AI</Text>
              </>
            )}
          </TouchableOpacity>

          {/* DESCRIERE */}
          <Text style={styles.sectionTitle}>Despre locație</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </ScrollView>

      {/* BUTON FIX JOS - REZERVARE */}
      <SafeAreaView style={styles.footer}>
        <TouchableOpacity style={styles.reserveButton} onPress={handleReservation}>
          <Ionicons name="logo-whatsapp" size={24} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={styles.reserveButtonText}>Rezervă Acum</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  imageContainer: {
    width: width,
    height: 350,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 50, // Ajustat pentru siguranță pe iOS
    left: 20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.4)', 
  },
  contentContainer: {
    marginTop: -30,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    marginRight: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontWeight: 'bold',
    color: '#B45309',
  },
  address: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  aiButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  aiButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 24,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFF',
  },
  reserveButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  reserveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});