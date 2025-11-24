import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DetailsScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [vibe, setVibe] = useState("");

  const generateVibe = async () => {
    setLoading(true);

    // exemplu API mock
    setTimeout(() => {
      setVibe("Un loc vibrant, perfect pentru o experiență memorabilă. 🔥");
      setLoading(false);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: "https://picsum.photos/800" }}
        style={styles.image}
      />

      <Text style={styles.title}>Locație #{id}</Text>

      <TouchableOpacity style={styles.button} onPress={generateVibe}>
        <Text style={styles.buttonText}>Generează Vibe</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#007AFF" />}

      {vibe !== "" && (
        <Text style={styles.vibe}>{vibe}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  image: { width: "100%", height: 220, borderRadius: 12, marginBottom: 15 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 10 },
  button: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  vibe: { fontSize: 18, marginTop: 20, lineHeight: 24 },
});
