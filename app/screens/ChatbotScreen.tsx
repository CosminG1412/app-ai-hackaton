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

// Importăm datele despre locații
import locationsData from './locatii.json';

const LOCATIONS = locationsData;
const { height } = Dimensions.get('window');

// --- TIPURI DATE ---
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

const BOT_NAME = 'Asistent AI';

// --- LOGICĂ SIMULARE AI ---
const generateBotResponse = (query: string, locations: typeof LOCATIONS): string => {
  const lowerQuery = query.toLowerCase();

  // 1. Căutare după tip de locație (Cafea/Ceai)
  if (lowerQuery.includes('cafea') || lowerQuery.includes('coffee') || lowerQuery.includes('ceai')) {
    const coffeePlaces = locations.filter(loc => 
      loc.name.toLowerCase().includes('coffee') || 
      loc.name.toLowerCase().includes('café') || 
      loc.name.toLowerCase().includes('cafe') ||
      loc.short_description.toLowerCase().includes('cafea') ||
      loc.short_description.toLowerCase().includes('ceai')
    );
    
    if (coffeePlaces.length > 0) {
      const bestPlace = coffeePlaces.sort((a, b) => b.rating - a.rating)[0];
      return `Pentru o cafea excelentă, îți recomand **${bestPlace.name}** în ${bestPlace.address.split(',').pop()?.trim()}. Au un rating de ${bestPlace.rating} și sunt cunoscuți pentru: "${bestPlace.short_description}".`;
    }
    return "Nu am găsit nicio cafenea care să se potrivească. Poți încerca să cauți un oraș specific!";
  }

  // 2. Căutare după cel mai bun rating general (pentru întrebări generale)
  if (lowerQuery.includes('cel mai bun') || lowerQuery.includes('unde merg')) {
    const sorted = [...locations].sort((a, b) => b.rating - a.rating);
    const top3 = sorted.slice(0, 3);
    
    if (top3.length > 0) {
      const list = top3.map(loc => 
        `⭐ ${loc.name} (${loc.rating}) în ${loc.address.split(',').pop()?.trim()}`
      ).join('\n');
      return `Am o listă de top 3 locații pe baza rating-ului: \n${list}\n\nUnde dorești să mergi?`;
    }
    return "Nu am suficiente date pentru a face o recomandare.";
  }

  // 3. Căutare Pizza/Burger
  if (lowerQuery.includes('pizza') || lowerQuery.includes('burger')) {
    const pizzaBurger = locations.filter(loc => 
      loc.name.toLowerCase().includes('pizza') || 
      loc.name.toLowerCase().includes('burger') ||
      loc.short_description.toLowerCase().includes('pizza') ||
      loc.short_description.toLowerCase().includes('burger')
    );

    if (pizzaBurger.length > 0) {
        const bestFastFood = pizzaBurger.sort((a, b) => b.rating - a.rating)[0];
        return `Dacă îți este poftă de ceva rapid, **${bestFastFood.name}** este o alegere bună (${bestFastFood.rating}). Detalii: "${bestFastFood.short_description}".`;
    }
    return "Momentan nu am în baza de date localuri de tip fast-food care să se potrivească cererii tale.";
  }

  // 4. Răspuns implicit
  return `Îmi pare rău, nu am înțeles exact. Sunt antrenat să răspund la întrebări despre locațiile din aplicație (ex: 'Unde pot bea o cafea bună?' sau 'Care e cel mai bun restaurant?').`;
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

    // 2. Generează și adaugă răspunsul bot-ului
    const botResponseText = generateBotResponse(newUserMessage.text, LOCATIONS as any);
    
    const newBotMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponseText,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString(),
    };

    setTimeout(() => {
        setMessages(prev => [newBotMessage, ...prev]);
    }, 500); // Simulează un delay de răspuns

    // 3. Resetează input-ul
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
      <View style={styles.messageContent}>
        <Text style={[
            styles.senderName, 
            item.sender === 'user' && { color: '#FFF' }
        ]}>{item.sender === 'user' ? 'Eu' : BOT_NAME}</Text>
        <Text style={[
            styles.messageText, 
            item.sender === 'user' && { color: '#FFF' },
            item.sender === 'bot' && { flexShrink: 1 }
        ]}>{item.text}</Text>
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
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
});