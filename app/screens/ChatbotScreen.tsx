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
  ActivityIndicator, // <--- ADĂUGAT
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router'; 

// Importăm datele despre locații
// Asigură-te că fișierul locatii.json este în aceeași structură de foldere
import locationsData from './locatii.json';

const LOCATIONS = locationsData as TouristLocation[]; 
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
  isLoading?: boolean; // <--- MODIFICARE: Flag pentru starea de încărcare
}

const BOT_NAME = 'Jon';

// Cuvinte cheie principale (folosite pentru a detecta intentul)
const LOCATION_KEYWORDS = [
  'restaurant', 'cafenea', 'cafea', 'pub', 'bar', 'pizza', 'burger', 
  'vegan', 'sushi', 'döner', 'steakhouse', 'bistro', 'fast food', 'desert', 'club', 'lounge', 
  'pizzerie', 'pizzarie'
];

// 🎯 MAPA DE SINONIME/SUBCATEGORII (Garantează potrivirea)
const CATEGORY_MAP: { [key: string]: string[] } = {
  'fast food': ['fast food', 'fastfood', 'burger', 'doner', 'döner', 'shaorma', 'kebap', 'sandvis'],
  'cafenea': ['cafenea', 'cafea', 'cafe', 'coffee', 'coffee shop', 'patiserie', 'ceai'],
  'cafea': ['cafenea', 'cafea', 'cafe', 'coffee', 'coffee shop', 'patiserie', 'ceai'],
  'restaurant': ['restaurant', 'trattoria', 'steakhouse', 'bistro', 'tavern', 'asiatic', 'mexican', 'traditional', 'mancare'],
  'pub': ['pub', 'bar', 'lounge', 'club'],
  'bar': ['pub', 'bar', 'lounge', 'club'],
  'pizza': ['pizza', 'pizzerie', 'pizzarie', 'italian', 'trattoria'], 
  'pizzerie': ['pizza', 'pizzerie', 'pizzarie', 'italian', 'trattoria'],
  'pizzarie': ['pizza', 'pizzerie', 'pizzarie', 'italian', 'trattoria'],
};

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
    .replace(/ț/g, 't')
    .trim();
};

// --- LOGICĂ ORAȘE ---
const extractCities = (locations: TouristLocation[]): string[] => {
  const citiesSet = new Set<string>();
  locations.forEach(loc => {
    const parts = loc.address.split(',');
    if (parts.length > 0) {
      const city = parts[parts.length - 1].trim();
      if (city) {
        citiesSet.add(city);
      }
    }
  });
  return Array.from(citiesSet).sort();
};

const KNOWN_CITIES = extractCities(LOCATIONS);
// --- SFÂRȘIT LOGICĂ ORAȘE ---

// Funcție pentru resetarea contextului (mesaje simple)
const isNonLocationQuery = (normalizedText: string): boolean => {
    const chatWords = ['salut', 'buna', 'multumesc', 'ms', 'mersi', 'ce faci', 'pa', 'la revedere', 'ok', 'bine', 'mulțumesc mult'];
    return !LOCATION_KEYWORDS.some(k => normalizedText.includes(k)) && chatWords.some(word => normalizedText.includes(word));
};

// 🌟 FUNCTIE DE CĂUTARE DETERMINISTICĂ LOCALĂ (Motorul de Căutare Garantat)
const findLocationsByKeywordAndCity = (query: string, city?: string): TouristLocation[] => {
    const normalizedQuery = normalizeString(query);
    
    // 1. Identifică keyword-urile principale
    const rawKeywordsFound = LOCATION_KEYWORDS.filter(keyword => normalizedQuery.includes(normalizeString(keyword)));
    
    if (rawKeywordsFound.length === 0) {
        return []; 
    }
    
    // 2. Colectează TOȚI termenii de căutare asociați folosind CATEGORY_MAP
    const searchTerms = new Set<string>();
    rawKeywordsFound.forEach(keyword => {
        const normalizedKeyword = normalizeString(keyword);
        const mappedTerms = CATEGORY_MAP[normalizedKeyword] || [normalizedKeyword]; 
        mappedTerms.forEach(term => searchTerms.add(normalizeString(term)));
    });

    // 3. Filtrare pe întregul set de date
    const results = LOCATIONS.filter(loc => {
        const normalizedAddress = normalizeString(loc.address);
        const normalizedCategory = normalizeString(loc.category);
        
        // Criteriul 1: Orașul (dacă este specificat)
        const cityMatch = !city || normalizedAddress.includes(normalizeString(city));
        
        // Criteriul 2: Categoria (potrivire pe setul extins de termeni)
        const categoryMatch = Array.from(searchTerms).some(term => {
            return normalizedCategory.includes(term);
        });

        return cityMatch && categoryMatch;
    });

    // 4. Sortare și limitare
    return results.sort((a, b) => b.rating - a.rating).slice(0, 3);
};


// 🤖 LOGICĂ LLM: Folosită pentru a genera textul final al răspunsului
const generateBotResponse = async (userQuery: string, locationsToAnalyze: TouristLocation[]): Promise<BotResponse> => {
  
  if (!GEMINI_API_KEY) {
      return { text: "Eroare: Cheia API nu a fost găsită." };
  }
  
  // 1. Pregătește contextul (trimitem LLM-ului doar lista de locații relevante găsite local)
  const locationsForPrompt = locationsToAnalyze.length > 0 ? locationsToAnalyze : LOCATIONS.slice(0, 10);
  
  const topLocationsContext = locationsForPrompt
    .map(loc => {
      let simplifiedCategory = normalizeString(loc.category);
      simplifiedCategory = simplifiedCategory.replace(/[\/\-]/g, ', '); 
      return `{name: "${loc.name}", rating: ${loc.rating}, category: "${simplifiedCategory}", city: "${loc.address.split(',').pop()?.trim()}"}`;
    }).join('; ');
    
  const systemInstruction = `Ești un asistent AI specializat în recomandări de locații. Răspunde direct și concis, folosind o formulare naturală. Analizează cererea: "${userQuery}". Dacă ai primit locații în lista de date, folosește-le pentru a formula o recomandare de top (menționează numele și ratingul). Dacă lista de date este goală, răspunde politicos că nu ai găsit nimic. Nu inventa informații.`;
  
  const userPrompt = `${systemInstruction} Date de analizat: [${topLocationsContext}]`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    });

    const data = await response.json();
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Ne pare rău, a fost o eroare la generarea răspunsului LLM.";
    
    return { text: generatedText, locations: locationsToAnalyze };
    
  } catch (error) {
    const err = error as Error; // <--- MODIFICARE MINORĂ PENTRU EROARE CONSISTENTĂ
    return { text: `A apărut o eroare la comunicarea cu serverul AI. Mesaj: ${err.message}`, locations: locationsToAnalyze };
  }
};

// --- COMPONENTĂ PRINCIPALĂ ---
export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: `Salut! Sunt ${BOT_NAME}. Asistentul tău AI pentru a găsi locația perfectă oriunde în țară`,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  
  // Context persistent
  const [lastIntent, setLastIntent] = useState(''); 
  const [lastCity, setLastCity] = useState(''); 
  
  // <--- ADĂUGAT: Stare pentru a gestiona încărcarea
  const [isBotLoading, setIsBotLoading] = useState(false); 

  const navigateToDetails = useCallback((location: TouristLocation) => {
    router.push({
        pathname: "/screens/DetailsScreen",
        params: { item: JSON.stringify(location) } 
    });
  }, []);

  const handleSend = useCallback(async () => {
    // MODIFICARE: Prevenirea trimiterii multiple în timpul încărcării
    if (!inputText.trim() || isBotLoading) return; 

    const textToSend = inputText.trim();
    setInputText(''); 

    const normalizedText = normalizeString(textToSend);
    
    // 1. LOGICĂ DE DETECTARE ȘI CONTEXT
    let currentCity: string | undefined;
    for (const city of KNOWN_CITIES) {
        if (normalizedText.includes(normalizeString(city))) {
            currentCity = city; 
            break;
        }
    }
    const isLocationQuery = LOCATION_KEYWORDS.some(keyword => normalizedText.includes(normalizeString(keyword)));
    const isCityQuery = !!currentCity;

    let searchIntent = ''; 
    let searchCity = '';
    let queryForLLM = textToSend;
    let newIntent = lastIntent;
    let newCity = lastCity;
    
    // --- LOGICĂ DE APLICARE A CONTEXTULUI ---
    
    if (isNonLocationQuery(normalizedText)) {
        // Resetare context la mesaje simple (Multumesc, Salut)
        newIntent = '';
        newCity = '';
        queryForLLM = "Răspunde politicos la mesajul: " + textToSend;
        
    } else if (isLocationQuery && isCityQuery) {
        // SCENARIU 1: Query Complet (Pizza în Iași)
        searchIntent = textToSend;
        searchCity = currentCity!;
        newIntent = textToSend; 
        newCity = currentCity!;
        queryForLLM = `Recomandări pentru ${textToSend} în ${currentCity}`;
        
    } else if (isCityQuery) {
        // SCENARIU 2: Doar Oraș (în Cluj / Cluj-Napoca)
        searchCity = currentCity!;
        newCity = currentCity!;
        if (lastIntent) {
            // Aplică Intentul Vechi (ex: "în Cluj" după "pub")
            searchIntent = lastIntent;
            queryForLLM = `Recomandări pentru ${lastIntent} în ${currentCity}`;
        } else {
            // Doar schimbă orașul. LLM-ul va răspunde cu o confirmare.
            queryForLLM = `Confirmă schimbarea orașului la ${currentCity} și întreabă ce tip de locație este căutat.`;
            newIntent = ''; 
        }
        
    } else if (isLocationQuery) {
        // SCENARIU 3: Doar Locație (Vreau un pub)
        searchIntent = textToSend;
        newIntent = textToSend;
        
        if (lastCity) {
            // Aplică Orașul Vechi (ex: "pub" cu lastCity = Brașov)
            searchCity = lastCity;
            queryForLLM = `Recomandări pentru ${textToSend} în ${lastCity}`;
        } else {
            // Fără oraș: Prompt pentru oraș (se rulează LLM-ul cu instrucțiunea de prompt)
            queryForLLM = `Utilizatorul caută "${textToSend}" dar nu a specificat orașul. Roagă-l politicos să specifice orașul pentru a putea face o căutare precisă.`;
        }
    } else {
        // SCENARIU 4: Follow-up sau Query General necunoscut
        searchIntent = lastIntent; 
        searchCity = lastCity; 
        queryForLLM = `Răspunde la mesajul: "${textToSend}", utilizând ca referință contextul: ${lastIntent || 'niciun intent'} în ${lastCity || 'niciun oraș'}.`;
    }

    // 2. Adaugă mesajul Utilizatorului + Mesajul de ÎNCĂRCARE
    setLastIntent(newIntent);
    setLastCity(newCity);
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
    };
    
    const loadingMessageId = 'loading-temp-' + Date.now(); 
    const loadingMessage: Message = {
        id: loadingMessageId,
        text: "Jon se gândește…", 
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        isLoading: true, // <--- ADAUGARE
    };

    setMessages(prev => [loadingMessage, newUserMessage, ...prev]); // <--- ADAUGARE: Inserare loading message
    setIsBotLoading(true); // <--- ADAUGARE: Pornire loading
    
    // 3. RULARE CĂUTARE DETERMINISTICĂ LOCALĂ
    let filteredLocations: TouristLocation[] = [];
    if (searchIntent && searchCity) {
        filteredLocations = findLocationsByKeywordAndCity(searchIntent, searchCity);
    } else if (searchIntent && !searchCity && lastCity) {
        // Căutare cu intent nou și oraș vechi
        filteredLocations = findLocationsByKeywordAndCity(searchIntent, lastCity);
    } else if (searchIntent && !searchCity && !lastCity) {
        // Căutare generală (se așteaptă prompt pentru oraș de la LLM)
    } else {
        // Query general sau follow-up
        const contextCity = currentCity || lastCity;
        if (contextCity) {
            filteredLocations = LOCATIONS.filter(loc => loc.address.includes(contextCity)).slice(0, 3);
        }
    }


    // 4. APEL LLM PENTRU GENERAREA RĂSPUNSULUI TEXTUAL
    let botResponse: BotResponse;
    
    if (filteredLocations.length > 0) {
        botResponse = await generateBotResponse(queryForLLM, filteredLocations);
        botResponse.locations = filteredLocations; 
    } else if (isLocationQuery && !searchCity && !lastCity) {
        botResponse = await generateBotResponse(queryForLLM, []);
    } else {
        const contextLocations = KNOWN_CITIES.some(c => queryForLLM.includes(c)) 
            ? LOCATIONS.filter(loc => loc.address.includes(currentCity || lastCity || '')) 
            : LOCATIONS.slice(0, 10);
            
        botResponse = await generateBotResponse(queryForLLM, contextLocations);
        botResponse.locations = filteredLocations; // Folosim locațiile găsite (chiar dacă e 0)
    }
    
    // 5. Creează și adaugă noul mesaj al bot-ului (înlocuind mesajul de încărcare)
    const newBotMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponse.text,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString(),
      recommendedLocations: botResponse.locations,
    };

    setMessages(prev => {
        // Filtram mesajul de încărcare și adăugăm răspunsul real
        const filteredMessages = prev.filter(msg => msg.id !== loadingMessageId);
        return [newBotMessage, ...filteredMessages];
    });

    // 6. Finalizare
    setIsBotLoading(false);
  }, [inputText, lastIntent, lastCity, isBotLoading]); // <--- MODIFICARE: Adăugarea isBotLoading în dependencies

  // --- RENDERIZARE MESAJ (MODIFICATĂ) ---
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    const isBot = item.sender === 'bot';
    
    // MODIFICARE: Logica de afișare a stării de încărcare
    if (item.isLoading) {
        return (
            <View style={[styles.messageContainer, styles.botMessageContainer]}>
                <Ionicons name="sparkles" size={20} color={TINT_COLOR} style={styles.botIcon} />
                <View style={[styles.messageContent, { flex: 1 }]}>
                    <Text style={[styles.senderName, { color: TINT_COLOR }]}>{BOT_NAME}</Text>
                    <View style={styles.loadingContainer}>
                        <Text style={styles.messageText}>Jon se gândește… </Text>
                        <ActivityIndicator size="small" color={TINT_COLOR} />
                    </View>
                    <Text style={styles.timestamp}>{item.timestamp}</Text>
                </View>
            </View>
        );
    }
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.botMessageContainer,
      ]}>
      {isBot && (
         <Ionicons name="sparkles" size={20} color={TINT_COLOR} style={styles.botIcon} />
      )}
      {/* Aplică flex: 1 pentru ca messageContent să ocupe spațiul rămas, rezolvând problema de wrap */}
      <View style={[
        styles.messageContent,
        isBot && { flex: 1 } 
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
                          {loc.name} (Rating: {loc.rating})
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
}; // SFÂRȘIT renderMessage

  return ( 
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Asistent AI Locații</Text>
        <Text style={styles.headerSubtitle}>Descoperă locurile ideale cu ajutorul AI.</Text>
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
            // MODIFICARE: Placeholder dinamic
            placeholder={isBotLoading ? "Așteaptă răspunsul AI..." : "Întreabă"}
            placeholderTextColor="#9CA3AF"
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!isBotLoading} // MODIFICARE: Dezactivat la încărcare
            />
            <TouchableOpacity 
                // MODIFICARE: Stil dinamic pentru dezactivare
                style={[styles.sendButton, (!inputText.trim() || isBotLoading) && styles.sendButtonDisabled]} 
                onPress={handleSend} 
                disabled={!inputText.trim() || isBotLoading} // MODIFICARE: Dezactivat la încărcare
            >
                <Ionicons name="send" size={24} color="#FFF" />
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  ); 
} 

// --- STYLING ---
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
  // ADĂUGAT: Stil pentru butonul dezactivat
  sendButtonDisabled: {
    opacity: 0.5,
  },
  // ADĂUGAT: Container pentru indicatorul de încărcare
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 5,
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