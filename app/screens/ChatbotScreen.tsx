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

// --- LOGICĂ SIMULARE AI ---
const generateBotResponse = (query: string, locations: typeof LOCATIONS): BotResponse => {
  const normalizedQuery = normalizeString(query);

  // 1. Căutare după oraș
  let foundCity: string | undefined;
  for (const city of KNOWN_CITIES) {
      if (normalizedQuery.includes(normalizeString(city))) {
          foundCity = city; 
          break;
      }
  }

  if (foundCity) {
      const cityLocations = locations
          .filter(loc => loc.address.includes(foundCity!))
          .sort((a, b) => b.rating - a.rating);
      
      if (cityLocations.length > 0) {
          const top5 = cityLocations.slice(0, 5) as TouristLocation[];
          
          let list = `Am găsit ${cityLocations.length} locații în **${foundCity}**. Iată top ${Math.min(5, cityLocations.length)} (sortate după rating):`;
          
          top5.forEach((loc, index) => {
              list += `\n${index + 1}. ⭐ ${loc.name} (Rating: ${loc.rating})`; 
          });

          return {
              text: list,
              locations: top5
          };
      }
      return { text: `Îmi pare rău, nu am găsit nicio locație în baza de date pentru orașul **${foundCity}**.` };
  }
  
  // 2. Căutare după tip de locație (Cafea/Ceai)
  if (normalizedQuery.includes('cafea') || normalizedQuery.includes('coffee') || normalizedQuery.includes('ceai')) {
    const coffeePlaces = locations.filter(loc => 
      normalizeString(loc.name).includes('coffee') || 
      normalizeString(loc.name).includes('cafe') || 
      normalizeString(loc.short_description).includes('cafea') ||
      normalizeString(loc.short_description).includes('ceai')
    );
    
    if (coffeePlaces.length > 0) {
      const bestPlace = coffeePlaces.sort((a, b) => b.rating - a.rating)[0] as TouristLocation;
      return {
          text: `Pentru o cafea excelentă, îți recomand **${bestPlace.name}** în ${bestPlace.address.split(',').pop()?.trim()}. Au un rating de ${bestPlace.rating} și sunt cunoscuți pentru: "${bestPlace.short_description}".`,
          locations: [bestPlace]
      };
    }
    return { text: "Nu am găsit nicio cafenea care să se potrivească. Poți încerca să cauți un oraș specific!" };
  }

  // 3. Căutare după cel mai bun rating general (pentru întrebări generale)
  if (normalizedQuery.includes('cel mai bun') || normalizedQuery.includes('unde merg')) {
    const sorted = [...locations].sort((a, b) => b.rating - a.rating);
    const top3 = sorted.slice(0, 3) as TouristLocation[];
    
    if (top3.length > 0) {
        const list = top3.map(loc => 
            `⭐ ${loc.name} (${loc.rating}) în ${loc.address.split(',').pop()?.trim()}`
        ).join('\n');
        
        return {
            text: `Am o listă de top 3 locații pe baza rating-ului: \n${list}`,
            locations: top3
        };
    }
    return { text: "Nu am suficiente date pentru a face o recomandare." };
  }

  // 4. Căutare Pizza/Burger
  if (normalizedQuery.includes('pizza') || normalizedQuery.includes('burger')) {
    const pizzaBurger = locations.filter(loc => 
      normalizeString(loc.name).includes('pizza') || 
      normalizeString(loc.name).includes('burger') ||
      normalizeString(loc.short_description).includes('pizza') ||
      normalizeString(loc.short_description).includes('burger')
    );

    if (pizzaBurger.length > 0) {
        const bestFastFood = pizzaBurger.sort((a, b) => b.rating - a.rating)[0] as TouristLocation;
        return {
             text: `Dacă îți este poftă de ceva rapid, **${bestFastFood.name}** este o alegere bună (${bestFastFood.rating}). Detalii: "${bestFastFood.short_description}".`,
             locations: [bestFastFood]
        };
    }
    return { text: "Momentan nu am în baza de date localuri de tip fast-food care să se potrivească cererii tale." };
  }

  // 5. Răspuns implicit
  return { text: `Îmi pare rău, nu am înțeles exact. Sunt antrenat să răspund la întrebări despre locațiile din aplicație (ex: 'Unde pot bea o cafea bună?', 'Care e cel mai bun restaurant?' sau 'Ce pot face în Iași?').` };
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

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
    };

    // 1. Adaugă mesajul utilizatorului
    setMessages(prev => [newUserMessage, ...prev]);

    // 2. Generează răspunsul bot-ului
    const botResponse = generateBotResponse(newUserMessage.text, LOCATIONS as any);
    
    // 3. Creează noul mesaj al bot-ului stocând și locațiile recomandate
    const newBotMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponse.text,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString(),
      recommendedLocations: botResponse.locations, // Stochează locațiile
    };

    setTimeout(() => {
        setMessages(prev => [newBotMessage, ...prev]);
    }, 500); // Simulează un delay de răspuns

    // 4. Resetează input-ul
    setInputText('');
  }, [inputText]);

  // --- RENDERIZARE MESAJ ---
  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'user' ? styles.userMessageContainer : styles.botMessageContainer,
    ]}>
      {item.sender === 'bot' && (
         <Ionicons name="sparkles" size={20} color="#7C3AED" style={styles.botIcon} />
      )}
      {/* Aplică flex: 1 pentru ca messageContent să ocupe spațiul rămas, rezolvând problema de wrap */}
      <View style={[
        styles.messageContent,
        item.sender === 'bot' && { flex: 1 } 
      ]}>
        <Text style={[
            styles.senderName, 
            item.sender === 'user' && { color: '#FFF' }
        ]}>{item.sender === 'user' ? 'Eu' : BOT_NAME}</Text>
        <Text style={[
            styles.messageText, 
            item.sender === 'user' && { color: '#FFF' },
        ]}>{item.text}</Text>
        
        {/* LOGICĂ: Afișează butoane/link-uri pentru fiecare locație recomandată */}
        {item.sender === 'bot' && item.recommendedLocations && item.recommendedLocations.length > 0 && (
            <View style={styles.recommendedLinksContainer}>
                <Text style={styles.recommendedLinksTitle}>Apasă pentru detalii:</Text>
                {item.recommendedLocations.map((loc, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.detailsButton}
                        onPress={() => navigateToDetails(loc)}
                    >
                        <Text style={styles.detailsButtonText}>
                          {loc.name}
                        </Text>
                        <Ionicons name="arrow-forward" size={14} color="#7C3AED" />
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
    backgroundColor: '#111827',
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
    backgroundColor: '#7C3AED',
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