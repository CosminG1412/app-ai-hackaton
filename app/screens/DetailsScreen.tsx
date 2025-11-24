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

const { width } = Dimensions.get('window');

export default function DetailsScreen({ route, navigation }: any) {
  // Primim datele. Dacă vin ca string (JSON), le convertim înapoi în obiect.
  const params = route.params || {};
  const item = typeof params.item === 'string' ? JSON.parse(params.item) : params.item;

  const [aiLoading, setAiLoading] = useState(false);
  const [description, setDescription] = useState(item.short_description);

  // Funcție simulată pentru butonul AI (cerința din brief)
  const generateAiVibe = () => {
    setAiLoading(true);
    // Aici vei pune apelul către API-ul tău AI mai târziu
    setTimeout(() => {
      setDescription("✨ Vibe Check: Un loc desprins parcă din povești, unde aroma de cafea dansează cu liniștea dimineții. Pereții șoptesc istorie, iar lumina cade perfect pentru următorul tău story. Ești gata să te pierzi în atmosferă?");
      setAiLoading(false);
    }, 2000);
  };

  // Funcție pentru rezervare pe WhatsApp
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
          
          {/* Buton Back */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          {/* Overlay Gradient */}
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

          {/* Facilități (Hardcoded pentru aspect vizual) */}
          <Text style={styles.sectionTitle}>Facilități</Text>
          <View style={styles.featuresRow}>
            {['Wi-Fi', 'Parcare', 'Vegan', 'Pet Friendly'].map((feat, index) => (
              <View key={index} style={styles.featureChip}>
                <Text style={styles.featureText}>{feat}</Text>
              </View>
            ))}
          </View>
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
    top: 50,
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
    backgroundColor: 'rgba(0,0,0,0.4)', // Gradient fake
  },
  contentContainer: {
    marginTop: -30, // Suprapunere peste poză
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
    backgroundColor: '#7C3AED', // Violet modern pentru AI
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
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  featureText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFF',
  },
  reserveButton: {
    backgroundColor: '#25D366', // WhatsApp Green
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