import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

export default function MapScreen() {
  const [region, setRegion] = useState<Region | null>(null);

  useEffect(() => {
    setRegion({
      latitude: 44.4268,
      longitude: 26.1025,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  }, []);

  if (!region) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <MapView style={styles.map} initialRegion={region}>
      <Marker
        coordinate={{ latitude: 44.4268, longitude: 26.1025 }}
        title="Punct Exemplu"
        description="Locație din JSON"
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
