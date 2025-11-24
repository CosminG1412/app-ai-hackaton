import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router'; 

// Importăm datele despre locații
import locationsData from './locatii.json';

const LOCATIONS = locationsData;
const { height } = Dimensions.get('window');

// Culoarea principală de accent (din constants/theme.ts)
const TINT_COLOR = '#0a7ea4'; 

// 
// 🚨 ATENȚIE: Aici se accesează cheia din Variabilele de Mediu (EXPO_PUBLIC_ prefix este necesar în Expo) 🚨
//
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY; 

// --- TIPURI DATE ---
interface Coordinates {
  lat: number;
  long: number;
}

interface TouristLocation {
  name: string;
  address: string;
  coordinates: Coordinates;
  image_url: string;
  short_description: string;
  rating: number;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  recommendedLocations?: TouristLocation[]; 
}

const BOT_NAME = 'Asistent AI';

// Tipul de return pentru funcția de logică a bot-ului
interface BotResponse {
    text: string;
    locations?: TouristLocation[];
}

// Functie helper pentru a elimina diacriticele și a converti la litere mici
const normalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/ș/g, 's')
    .replace(/ţ/g, 't')
    .replace(/ț/g, 't');
};

// --- LOGICĂ NOUĂ: EXTRAGEREA DINAMICĂ A ORAȘELOR ---
const extractCities = (locations: typeof LOCATIONS): string[] => {
  const citiesSet = new Set<string>();
  locations.forEach(loc => {
    // Orașul este ultimul element din adresa separată prin virgulă
    const parts = loc.address.split(',');
    if (parts.length > 0) {
      const city = parts[parts.length - 1].trim();
      citiesSet.add(city);
    }
  });
  return Array.from(citiesSet).sort();
};

const KNOWN_CITIES = extractCities(LOCATIONS as any);
// --- SFÂRȘIT LOGICĂ NOUĂ ---

// --- LOGICĂ NOUĂ: INTEGRARE LLM REALĂ (CU APEL ASINCRON) ---
const generateBotResponse = async (query: string, locations: TouristLocation[]): Promise<BotResponse> => {
  
  if (!GEMINI_API_KEY) {
      return { text: "Eroare: Cheia API nu a fost găsită. Asigură-te că fișierul .env este setat corect și că serverul Expo a fost repornit." };
  }
  
  const normalizedQuery = normalizeString(query);
  let foundCity: string | undefined;
  
  for (const city of KNOWN_CITIES) {
      if (normalizedQuery.includes(normalizeString(city))) {
          foundCity = city; 
          break;
      }
  }

  const contextualLocations = foundCity 
    ? locations.filter(loc => loc.address.includes(foundCity!))
    : locations;
    
  // 1. Pregătește contextul pentru LLM (Top 5 locații relevante)
  const topLocationsContext = contextualLocations
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5) 
    .map(loc => 
      `{name: "${loc.name}", rating: ${loc.rating}, desc: "${loc.short_description}", city: "${loc.address.split(',').pop()?.trim()}"}`
    ).join('; ');
    
  // 2. Definirea prompt-ului (Instrucțiunea de sistem este mutată în prompt)
  const systemInstruction = `Ești un asistent AI specializat în recomandări de locații. Răspunde direct, bazându-te doar pe datele oferite. Dacă faci o recomandare, trebuie să menționezi explicit numele complet al locației și ratingul.`;
  
  const userPrompt = `${systemInstruction} Recomandă-mi 1-3 locații în funcție de cerere: "${query}". Folosește următoarele date: [${topLocationsContext}]`;

  // 3. APEL API REAL LLM (Exemplu pentru Gemini API)
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        // CORECTAT: A fost eliminat câmpul systemInstruction, deoarece dădea eroare 400
        generationConfig: { 
            temperature: 0.2, 
        },
      }),
    });

    const data = await response.json();
    
    // --- VERIFICARE 1: ERORI HTTP/API ---
    if (!response.ok) {
        const errorMessage = data?.error?.message || `Eroare HTTP necunoscută: ${response.status} ${response.statusText}`;
        console.error("API Error:", data);
        return { 
            text: `Eroare API (${response.status}): ${errorMessage}. Verifică cheia API și permisiunile proiectului.`,
            locations: []
        };
    }
    
    // Extragem textul generat
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // --- VERIFICARE 2: RĂSPUNS GOL (Blocare de Siguranță sau problemă de generare) ---
    if (!generatedText) {
        let rejectionReason = "Răspuns gol. Conținutul ar fi putut fi blocat din motive de siguranță sau modelul nu a găsit informații relevante.";
        
        const safetyRatings = data.candidates?.[0]?.safetyRatings;
        if (safetyRatings) {
             rejectionReason += ` (Safety Issue: ${JSON.stringify(safetyRatings)})`;
        }

        return {
            text: `LLM-ul nu a putut genera un răspuns valid. Motiv: ${rejectionReason}`,
            locations: []
        };
    }

    // 4. LOGICĂ DE PARSARE ȘI RECOMANDARE
    
    let recommended: TouristLocation[] = [];
    
    // Căutăm manual în lista originală de locații dacă LLM-ul a recomandat un loc anume
    for (const loc of LOCATIONS) {
        // Verificăm dacă textul generat conține numele exact al unei locații
        if (generatedText.includes(loc.name)) {
            recommended.push(loc);
            if (recommended.length >= 3) break; 
        }
    }
    
    return {
      text: generatedText,
      locations: recommended,
    };
    
  } catch (error) {
    console.error("Eroare la apelul LLM:", error);
    return { text: `Ne pare rău, a apărut o eroare la rețea. Mesaj: ${error.message}` };
  }
};

// --- COMPONENTĂ PRINCIPALĂ ---
export default function ChatbotScreen() { // Aici începe funcția
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: `Salut! Sunt ${BOT_NAME}, asistentul tău personal. Întreabă-mă despre locațiile din aplicație. De exemplu: "Unde pot să mănânc o pizza?"`,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  
  // Funcția de navigare către DetailsScreen
  const navigateToDetails = useCallback((location: TouristLocation) => {
    // Navigăm către ecranul de detalii trimițând obiectul de locație ca string JSON
    router.push({
        pathname: "/screens/DetailsScreen",
        params: { item: JSON.stringify(location) } 
    });
  }, []);

  const handleSend = useCallback(async () => { // Adăugăm 'async'
    if (!inputText.trim()) return;

    // CAPTURĂM TEXTUL ȘI ȘTERGEM INPUT-UL IMEDIAT AICI:
    const textToSend = inputText.trim();
    setInputText(''); // CLEARS THE INPUT INSTANTLY

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: textToSend, 
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
    };

    // 1. Adaugă mesajul utilizatorului
    setMessages(prev => [newUserMessage, ...prev]);

    // 2. Generează răspunsul bot-ului ASINCRON și AȘTEAPTĂ
    const botResponse = await generateBotResponse(textToSend, LOCATIONS as any);
    
    // 3. Creează noul mesaj al bot-ului stocând și locațiile recomandate
    const newBotMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponse.text,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString(),
      recommendedLocations: botResponse.locations, // Stochează locațiile
    };

    // Setarea noului mesaj al bot-ului
    setMessages(prev => [newBotMessage, ...prev]);
  }, [inputText]);

  // --- RENDERIZARE MESAJ ---
  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'user' ? styles.userMessageContainer : styles.botMessageContainer,
    ]}>
      {item.sender === 'bot' && (
         <Ionicons name="sparkles" size={20} color={TINT_COLOR} style={styles.botIcon} />
      )}
      {/* Aplică flex: 1 pentru ca messageContent să ocupe spațiul rămas, rezolvând problema de wrap */}
      <View style={[
        styles.messageContent,
        item.sender === 'bot' && { flex: 1 } 
      ]}>
        <Text style={[
            styles.senderName, 
            item.sender === 'bot' ? { color: TINT_COLOR } : { color: '#FFF' }
        ]}>{item.sender === 'user' ? 'Eu' : BOT_NAME}</Text>
        <Text style={[
            styles.messageText, 
            item.sender === 'user' && { color: '#FFF' },
        ]}>{item.text}</Text>
        
        {/* LOGICĂ: Afișează butoane/link-uri pentru fiecare locație recomandată */}
        {item.sender === 'bot' && item.recommendedLocations && item.recommendedLocations.length > 0 && (
            <View style={styles.recommendedLinksContainer}>
                <Text style={[styles.recommendedLinksTitle, { color: TINT_COLOR }]}>Apasă pentru detalii:</Text>
                {item.recommendedLocations.map((loc, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.detailsButton}
                        onPress={() => navigateToDetails(loc)}
                    >
                        <Text style={styles.detailsButtonText}>
                          {loc.name}
                        </Text>
                        <Ionicons name="arrow-forward" size={14} color={TINT_COLOR} />
                    </TouchableOpacity>
                ))}
            </View>
        )}

        <Text style={[
            styles.timestamp, 
            item.sender === 'user' && { color: 'rgba(255, 255, 255, 0.7)' }
        ]}>{item.timestamp}</Text>
      </View>
    </View>
  );

  return ( // Aici începe return-ul componentei
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Asistent AI Locații</Text>
        <Text style={styles.headerSubtitle}>Vă ajut cu sugestii bazate pe datele aplicației.</Text>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={styles.listContent}
      />
      
      <KeyboardAvoidingView 
        // CORECȚIE: Schimbăm 'height' la 'padding' și pe Android pentru o mai bună vizibilitate
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} 
        style={styles.inputArea}
      >
        <View style={styles.inputContainer}>
            <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Întreabă-mă ceva..."
            placeholderTextColor="#9CA3AF"
            returnKeyType="send"
            onSubmitEditing={handleSend}
            />
            <TouchableOpacity 
                style={styles.sendButton} 
                onPress={handleSend} 
                disabled={!inputText.trim()}
            >
                <Ionicons name="send" size={24} color="#FFF" />
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  ); // Aici se închide return-ul
} // Aici se închide funcția ChatbotScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    padding: 20,
    // MODIFICARE: Mărim padding-ul de sus pentru a evita notch-ul/bara de stare
    paddingTop: 40, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
    minHeight: height - 150, 
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: TINT_COLOR,
    borderRadius: 12, // Folosim borderRadius direct aici
    borderTopRightRadius: 0,
    marginLeft: 10, 
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: 12, // Folosim borderRadius direct aici
    borderTopLeftRadius: 0,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  botIcon: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginRight: 5,
  },
  messageContent: {
    padding: 10,
    borderRadius: 12,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#7C3AED', 
  },
  messageText: {
    fontSize: 16,
    color: '#111827',
    flexShrink: 1, // Asigură că textul se încadrează
  },
  timestamp: {
    fontSize: 10,
    color: '#6B7280',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  inputArea: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingRight: 10,
    // Elimină padding-ul inutil din input pe Android pentru a evita problemele de înălțime
    paddingVertical: 0, 
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TINT_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // STILURI PENTRU LINK-URILE RECOMANDATE
  recommendedLinksContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', 
    gap: 8,
  },
  recommendedLinksTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 4,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginRight: 10,
  }
});