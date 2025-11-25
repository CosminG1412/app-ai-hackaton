// cosming1412/app-ai-hackaton/app-ai-hackaton-e9aec78dc2c364af443a8ce82d907bf32556ab6c/app/screens/ChatbotScreen.tsx

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

const TINT_COLOR = '#0a7ea4'; 

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
  category: string; 
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  recommendedLocations?: TouristLocation[]; 
}

const BOT_NAME = 'Asistent AI';

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

const extractCityFromAddress = (address: string) => {
    const parts = address.split(',');
    return parts[parts.length - 1].trim();
};

const extractCities = (locations: typeof LOCATIONS): string[] => {
  const citiesSet = new Set<string>();
  (locations as TouristLocation[]).forEach(loc => { 
    const city = extractCityFromAddress(loc.address);
    citiesSet.add(city);
  });
  return Array.from(citiesSet).sort();
};

const KNOWN_CITIES = extractCities(LOCATIONS as any);

// --- LOGICĂ NOUĂ: DETERMINAREA ORAȘULUI DE CONTEXT DIN ISTORIC ---
const getHistoricalCity = (messages: Message[]): string | undefined => {
    const lastNMessages = messages.slice(0, 10); // Verificăm ultimele 10 mesaje
    
    for (const msg of lastNMessages) {
        const normalizedText = normalizeString(msg.text);

        // 1. Caută un oraș menționat explicit de UTILIZATOR
        if (msg.sender === 'user') {
            for (const city of KNOWN_CITIES) {
                if (normalizedText.includes(normalizeString(city))) {
                    return city; 
                }
            }
        }

        // 2. Caută un oraș recomandat de BOT (dacă a făcut o recomandare)
        if (msg.sender === 'bot' && msg.recommendedLocations && msg.recommendedLocations.length > 0) {
            // Ia orașul primei locații recomandate
            const firstRecommended = msg.recommendedLocations[0];
            return extractCityFromAddress(firstRecommended.address);
        }
    }
    return undefined;
};

// --- LOGICĂ VECHE ACTUALIZATĂ: CONTEXT DE REZERVĂ ---
const getDefaultContextCity = (locations: TouristLocation[]) => {
    // Orașul cu cea mai mare rată (cel mai popular)
    const sortedLocations = locations.sort((a, b) => b.rating - a.rating);
    
    if (sortedLocations.length > 0) {
        return extractCityFromAddress(sortedLocations[0].address);
    }
    return 'România'; 
};


// --- LOGICĂ PRINCIPALĂ DE GENERARE A RĂSPUNSULUI ---
const generateBotResponse = async (query: string, locations: TouristLocation[], messages: Message[]): Promise<BotResponse> => {
  
  if (!GEMINI_API_KEY) {
      return { text: "Eroare: Cheia API nu a fost găsită. Asigură-te că fișierul .env este setat corect și că serverul Expo a fost repornit." };
  }
  
  const typedLocations = locations as TouristLocation[];
  const normalizedQuery = normalizeString(query);
  let foundCityInQuery: string | undefined;
  
  // 1. Caută orașul explicit în query
  for (const city of KNOWN_CITIES) {
      if (normalizedQuery.includes(normalizeString(city))) {
          foundCityInQuery = city; 
          break;
      }
  }

  // 2. Determinarea orașului de context (ORDINE DE PRIORITATE NOUĂ):
  const historicalCity = getHistoricalCity(messages);
  
  const contextCity = foundCityInQuery || historicalCity || getDefaultContextCity(typedLocations);
    
  // 3. Filtrează locațiile pe baza orașului determinat
  const contextualLocations = typedLocations.filter(loc => loc.address.includes(contextCity));

  // 4. Pregătește contextul pentru LLM (Top 5 locații relevante)
  const topLocationsContext = contextualLocations
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5) 
    .map(loc => 
      `{name: "${loc.name}", category: "${loc.category}", rating: ${loc.rating}, city: "${extractCityFromAddress(loc.address)}"}`
    ).join('; ');
    
  // 5. Definirea prompt-ului cu contextualizare îmbunătățită
  // NOU: Instrucțiunile sunt mult mai detaliate, punând accentul pe conversație și non-tranzacționalism
  const systemInstruction = `Ești un asistent AI prietenos, dar concis, specializat în recomandări de locații.
Obiectivul tău este să oferi cea mai bună experiență de conversație.
1. **Dacă cererea NU este despre recomandări de locuri (ex: "salut", "ce mai faci", "mersi"), răspunde natural și scurt, fără a oferi o listă de locații.**
2. **Dacă cererea este despre locuri (ex: "unde mananc", "vreau o cafea", "cluburi"), oferă o recomandare** și evită să folosești fraze generice de început ca "Desigur", "Absolut" sau "Iată recomandările". Începe răspunsul direct și firesc.
3. Contextul implicit determinat pentru localizare este: ${contextCity}. Prioritizează locațiile din acest oraș.
4. Structura recomandării: nume complet, categoria, rating.
`;
  
  // Am inclus instrucțiunea de sistem direct în prompt (contents) pentru a ne asigura că este citită
  const userPrompt = `${systemInstruction} Cererea utilizatorului: "${query}". Folosește următoarele date: [${topLocationsContext}]`;

  // 6. APEL API REAL LLM
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { 
            temperature: 0.5, // NOU: Mărim temperatura pentru un ton mai natural, mai puțin mecanic
        },
      }),
    });

    const data = await response.json();
    
    // ... (Logica de verificare erori)
    if (!response.ok) {
        const errorMessage = data?.error?.message || `Eroare HTTP necunoscută: ${response.status} ${response.statusText}`;
        console.error("API Error:", data);
        return { 
            text: `Eroare API (${response.status}): ${errorMessage}. Verifică cheia API și permisiunile proiectului.`,
            locations: []
        };
    }
    
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
        let rejectionReason = "Răspuns gol. Conținutul ar fi putut fi blocat din motive de siguranță sau problemă de generare.";
        
        const safetyRatings = data.candidates?.[0]?.safetyRatings;
        if (safetyRatings) {
             rejectionReason += ` (Safety Issue: ${JSON.stringify(safetyRatings)})`;
        }

        return {
            text: `LLM-ul nu a putut genera un răspuns valid. Motiv: ${rejectionReason}`,
            locations: []
        };
    }

    // 7. LOGICĂ DE PARSARE ȘI RECOMANDARE (Rulăm logica doar dacă textul generat pare să conțină o recomandare)
    let recommended: TouristLocation[] = [];
    
    // O logică simplă pentru a determina dacă răspunsul conține o recomandare:
    const isRecommendationResponse = typedLocations.some(loc => generatedText.includes(loc.name));

    if (isRecommendationResponse) {
        for (const loc of typedLocations) { 
            if (generatedText.includes(loc.name)) {
                recommended.push(loc);
                if (recommended.length >= 3) break; 
            }
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

// --- COMPONENTĂ PRINCIPALĂ (Rămâne neschimbată) ---
export default function ChatbotScreen() { 
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: `Salut! Sunt ${BOT_NAME}, asistentul tău personal. Întreabă-mă despre locațiile din aplicație. De exemplu: "Unde pot să mănânc o pizza în Timișoara?"`,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  
  const navigateToDetails = useCallback((location: TouristLocation) => {
    router.push({
        pathname: "/screens/DetailsScreen",
        params: { item: JSON.stringify(location) } 
    });
  }, []);

  const handleSend = useCallback(async () => { 
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText(''); 

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: textToSend, 
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [newUserMessage, ...prev]);

    // Mesajele sunt trimise corect la funcția de generare
    const botResponse = await generateBotResponse(textToSend, LOCATIONS as any, messages); 
    
    const newBotMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponse.text,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString(),
      recommendedLocations: botResponse.locations, 
    };

    setMessages(prev => [newBotMessage, ...prev]);
  }, [inputText, messages]); 

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'user' ? styles.userMessageContainer : styles.botMessageContainer,
    ]}>
      {item.sender === 'bot' && (
         <Ionicons name="sparkles" size={20} color={TINT_COLOR} style={styles.botIcon} />
      )}
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
                        onPress={() => navigateToDetails(loc as any)}
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

  return ( 
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    padding: 20,
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
    borderRadius: 12, 
    borderTopRightRadius: 0,
    marginLeft: 10, 
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: 12, 
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
    flexShrink: 1, 
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
    color: TINT_COLOR,
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