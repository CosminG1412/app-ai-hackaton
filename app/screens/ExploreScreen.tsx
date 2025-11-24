import { router } from 'expo-router';

import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  SafeAreaView, 
  Platform, 
  StatusBar, 
  Dimensions,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

// Asigură-te că importul este corect. 
import locationsData from './locatii.json';

const { width } = Dimensions.get('window');

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

// Transformăm datele
const LOCATIONS: TouristLocation[] = locationsData as TouristLocation[];

export default function ExploreScreen() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- STATE PENTRU FILTRE ---
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('Toate');
  const [minRating, setMinRating] = useState<number>(0);

  // --- LOGICA PENTRU EXTRAGERE ORAȘE ---
  const availableCities = useMemo(() => {
    const citiesSet = new Set<string>();
    LOCATIONS.forEach(loc => {
      const parts = loc.address.split(',');
      if (parts.length > 0) {
        // Presupune că orașul este ultima parte după virgulă
        const city = parts[parts.length - 1].trim();
        if (city) citiesSet.add(city);
      }
    });
    return ['Toate', ...Array.from(citiesSet).sort()];
  }, []);

  // --- LOGICA DE FILTRARE PRINCIPALĂ ---
  const filteredLocations = LOCATIONS.filter(loc => {
    // 1. Căutare text
    const matchesSearch = 
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      loc.address.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Filtru Oraș
    const matchesCity = selectedCity === 'Toate' || loc.address.includes(selectedCity);

    // 3. Filtru Rating
    const matchesRating = loc.rating >= minRating;

    return matchesSearch && matchesCity && matchesRating;
  });

 const renderListItem = ({ item }: { item: TouristLocation }) => (
    <TouchableOpacity 
      activeOpacity={0.9} 
      style={styles.card}
      onPress={() => {
        router.push({
          pathname: "/screens/DetailsScreen",
          // Trimitem obiectul 'item' convertit în text (JSON string)
          params: { item: JSON.stringify(item) } 
        });
      }}
    >
      <Image source={{ uri: item.image_url }} style={styles.cardImage} />
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#B45309" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>

        <Text style={styles.cardAddress}>📍 {item.address}</Text>

        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.short_description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // --- HTML HARTĂ (LEAFLET) ---
  const generateMapHTML = () => {
    const locationsJSON = JSON.stringify(filteredLocations);
    
    const centerLat = filteredLocations.length > 0 ? filteredLocations[0].coordinates.lat : 45.9432;
    const centerLng = filteredLocations.length > 0 ? filteredLocations[0].coordinates.long : 24.9668;
    const zoomLevel = filteredLocations.length > 0 ? 12 : 6;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; }
          /* Stiluri pentru popup pentru a arăta că este interactiv */
          .leaflet-popup-content-wrapper { border-radius: 12px; font-family: -apple-system, sans-serif; cursor: pointer; }
          .custom-popup { text-align: center; }
          .custom-popup b { font-size: 15px; color: #111827; display: block; margin-bottom: 4px; }
          .custom-popup p { font-size: 13px; color: #6B7280; margin: 0; }
          .cta-text { color: #7C3AED; font-size: 12px; font-weight: bold; margin-top: 6px !important; display: block; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var centerLat = ${centerLat};
          var centerLng = ${centerLng};
          var zoomLevel = ${zoomLevel};

          var map = L.map('map', { zoomControl: false }).setView([centerLat, centerLng], zoomLevel);
          
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '',
            subdomains: 'abcd',
            maxZoom: 19
          }).addTo(map);

          var locations = ${locationsJSON};
          
          // Funcție pentru a trimite datele către React Native
          function handlePopupClick(index) {
            if (window.ReactNativeWebView) {
              // Trimitem obiectul locației ca string JSON
              window.ReactNativeWebView.postMessage(JSON.stringify(locations[index]));
            }
          }

          locations.forEach(function(loc, index) {
            if(loc.coordinates && loc.coordinates.lat && loc.coordinates.long) {
              // Creăm conținut HTML cu onclick
              var content = '<div class="custom-popup" onclick="handlePopupClick(' + index + ')">' + 
                            '<b>' + loc.name + '</b>' + 
                            '<p>⭐ ' + loc.rating + '</p>' +
                            '<span class="cta-text">Vezi detalii &rarr;</span>' +
                            '</div>';

              L.marker([loc.coordinates.lat, loc.coordinates.long])
                .addTo(map)
                .bindPopup(content);
            }
          });
        </script>
      </body>
      </html>
    `;
  };

  const renderMap = () => (
    <View style={styles.mapContainer}>
      <WebView
        key={filteredLocations.length} 
        originWhitelist={['*']}
        source={{ html: generateMapHTML() }}
        style={styles.webview}
        scrollEnabled={false}
        onMessage={(event) => {
          try {
            const locationString = event.nativeEvent.data;
            
            if (locationString) {
              // Navigare către ecranul de detalii
              router.push({
                pathname: "/screens/DetailsScreen", 
                params: { item: locationString } 
              });
            }
          } catch (error) {
            console.error("Eroare la procesarea mesajului din hartă:", error);
          }
        }}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Explorează România 🇷🇴</Text>
      </View>

      {/* CONTROALE */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput 
            placeholder="Caută" 
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity 
          style={[styles.iconButton, (selectedCity !== 'Toate' || minRating > 0) && styles.iconButtonActive]} 
          onPress={() => setIsFilterVisible(true)}
        >
          <Ionicons 
            name="options" 
            size={20} 
            color={(selectedCity !== 'Toate' || minRating > 0) ? "#FFF" : "#333"} 
          />
        </TouchableOpacity>

        <View style={styles.toggleWrapper}>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={20} color={viewMode === 'list' ? '#FFF' : '#333'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons name="map" size={20} color={viewMode === 'map' ? '#FFF' : '#333'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONȚINUT */}
      <View style={styles.contentContainer}>
        {viewMode === 'list' ? (
          <FlatList
            data={filteredLocations}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderListItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nu am găsit locații.</Text>
              </View>
            }
          />
        ) : (
          renderMap()
        )}
      </View>

      {/* MODAL FILTRARE (CU FADE-IN ȘI ÎNCHIDERE LA APĂSAREA FUNDALULUI) */}
      <Modal
        // 🚨 MODIFICAREA: Folosim 'fade' pentru o tranziție mai fină
        animationType="fade"
        transparent={true}
        visible={isFilterVisible}
        onRequestClose={() => setIsFilterVisible(false)}
      >
        {/* TouchableOpacity pentru a gestiona apăsarea fundalului */}
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1} 
          onPress={() => setIsFilterVisible(false)} // Închide modalul la apăsarea fundalului
        >
          {/* View-ul de conținut care blochează propagarea evenimentului */}
          <View 
            style={styles.modalContent}
            onStartShouldSetResponder={() => true} 
            onResponderRelease={(e) => e.stopPropagation()} // Oprește închiderea la apăsarea conținutului
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrează</Text>
              <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.filterLabel}>Alege Orașul</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {availableCities.map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={[styles.chip, selectedCity === city && styles.chipActive]}
                    onPress={() => setSelectedCity(city)}
                  >
                    <Text style={[styles.chipText, selectedCity === city && styles.chipTextActive]}>
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.filterLabel}>Rating Minim</Text>
              <View style={styles.ratingOptions}>
                {[0, 3.5, 4.0, 4.5, 4.8].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[styles.ratingChip, minRating === rating && styles.ratingChipActive]}
                    onPress={() => setMinRating(rating)}
                  >
                    <Text style={[styles.ratingChipText, minRating === rating && styles.ratingChipTextActive]}>
                      {rating === 0 ? "Oricare" : `${rating}+`}
                    </Text>
                    {rating > 0 && <Ionicons name="star" size={12} color={minRating === rating ? "#FFF" : "#B45309"} />}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={() => {
                  setSelectedCity('Toate');
                  setMinRating(0);
                }}
              >
                <Text style={styles.resetButtonText}>Resetează</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setIsFilterVisible(false)}
              >
                <Text style={styles.applyButtonText}>Vezi {filteredLocations.length} Rezultate</Text>
              </TouchableOpacity>
            </View>

          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  controlsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonActive: {
    backgroundColor: '#111827',
  },
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    padding: 4,
    alignItems: 'center',
    height: 50,
  },
  toggleBtn: {
    width: 45,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: '#111827',
  },
  contentContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    marginRight: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
  },
  cardAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  mapContainer: {
    flex: 1,
    width: width,
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  // --- STILURI MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
  },
  chipsScroll: {
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#111827',
  },
  chipText: {
    color: '#4B5563',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  ratingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  ratingChipActive: {
    backgroundColor: '#111827',
  },
  ratingChipText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  ratingChipTextActive: {
    color: '#FFF',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
});