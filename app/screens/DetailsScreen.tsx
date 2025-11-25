import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY; 

// Reintroducem calculul pentru înălțimea barei de stare pentru poziționare
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || (Platform.OS === 'ios' ? 44 : 24); 

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  let item: any = {};
  try {
    if (params.item && typeof params.item === 'string') {
      item = JSON.parse(params.item);
    }
  } catch (e) {
    console.error("Eroare la parsarea datelor:", e);
  }

  if (!item || !item.name) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 50 }} />
      </View>
    );
  }

  const [aiLoading, setAiLoading] = useState(false);
  const [description, setDescription] = useState(item.short_description);

  const generateAiVibe = async () => { 
    if (aiLoading) return;
    setAiLoading(true);

    if (!GEMINI_API_KEY) {
        setDescription("Eroare LLM: Cheia API nu este disponibilă pentru a genera Vibe Check.");
        setAiLoading(false);
        return;
    }
    
    const userPrompt = `Ești un expert în marketing turistic. Generează un scurt "Vibe Check" (maxim 2 fraze, inspirational, cu 1-2 emoji) pentru această locație. Detalii: Nume: ${item.name}, Rating: ${item.rating}, Descriere: ${item.short_description}`;
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
                temperature: 0.8, 
            },
          }),
        });
    
        const data = await response.json();
        
        if (!response.ok) {
            const errorMessage = data?.error?.message || `Eroare HTTP necunoscută: ${response.status} ${response.statusText}`;
            console.error("API Error:", data);
            setDescription(`Eroare API (${response.status}): ${errorMessage}.`);
            return;
        }

        const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!generatedText) {
            setDescription("LLM-ul nu a putut genera o descriere. Conținutul ar fi putut fi blocat din motive de siguranță.");
            return;
        }

        setDescription(generatedText);

    } catch (error) {
        console.error("Eroare la generarea LLM Vibe:", error);
        setDescription("A apărut o eroare la conexiunea cu serverul AI. Vă rugăm să verificați rețeaua.");
    } finally {
        setAiLoading(false);
    }
  };

  const handleReservation = () => {
    const message = `Salut! Vreau să fac o rezervare la ${item.name}.`;
    const url = `whatsapp://send?text=${message}`;
    Linking.openURL(url).catch(() => {
      alert('Asigură-te că ai WhatsApp instalat!');
    });
  };
  
  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Vă recomand locația: ${item.name} (${item.address}). Descriere: ${item.short_description}. Rating: ${item.rating}⭐.`,
        title: `Descoperă Locația: ${item.name}`
      });

      if (result.action === Share.sharedAction) {
        // Logica pentru succes (opțional)
      } else if (result.action === Share.dismissedAction) {
        // Logica pentru anulare (opțional)
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Status Bar: Transparent și text alb. ATENȚIE: Textul se poate pierde pe imagini deschise. */}
      <StatusBar 
        barStyle="light-content" 
        translucent={true} 
        backgroundColor="transparent"
      />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* IMAGINE HERO */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image_url }} style={styles.image} />
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

      {/* Butonul de back fix, poziționat sub Status Bar */}
      <TouchableOpacity 
        style={[
          styles.fixedBackButton, 
          { 
            top: STATUS_BAR_HEIGHT + 10 
          }
        ]} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Butonul de Share fix, poziționat pe dreapta */}
      <TouchableOpacity 
        style={[
          styles.fixedShareButton, 
          { 
            top: STATUS_BAR_HEIGHT + 10 
          }
        ]} 
        onPress={handleShare}
      >
        <Ionicons name="share-social" size={24} color="#FFF" />
      </TouchableOpacity>


      {/* BUTON FIX JOS - REZERVARE */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.reserveButton} onPress={handleReservation}>
          <Ionicons name="logo-whatsapp" size={24} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={styles.reserveButtonText}>Rezervă Acum</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  imageContainer: {
    width: width,
    height: 350,
    position: 'relative',
    // Imaginea începe de sus
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  // Stil pentru butonul de back FIX (rămâne pentru a fi deasupra imaginii)
  fixedBackButton: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0.0.0,0.5)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  // Stilul pentru butonul de Share FIX
  fixedShareButton: {
    position: 'absolute',
    right: 20, // Pozitionat pe dreapta
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
  // Culoarea butonului AI actualizată la #0a7ea4 (culoarea principală/tint a aplicației)
  aiButton: {
    backgroundColor: '#0a7ea4', 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 24,
    // Umbra actualizată pentru a se potrivi cu noua culoare
    shadowColor: '#0a7ea4', 
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
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'ios' ? 10 : 20, 
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