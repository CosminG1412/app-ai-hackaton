import { router } from "expo-router";
import React from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const dummyData = [
  {
    id: 1,
    title: "Locație Test",
    address: "Strada Exemplu 1",
    image: "https://picsum.photos/200",
    rating: 4.5,
  },
];

export default function ListScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={dummyData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/screens/DetailsScreen",
                params: { id: item.id },
              })
            }
          >
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.address}>{item.address}</Text>
              <Text style={styles.rating}>⭐ {item.rating}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  card: {
    flexDirection: "row",
    padding: 12,
    marginBottom: 12,
    backgroundColor: "white",
    borderRadius: 12,
    elevation: 2,
  },
  image: { width: 70, height: 70, borderRadius: 10, marginRight: 10 },
  title: { fontSize: 18, fontWeight: "600" },
  address: { color: "gray", marginTop: 4 },
  rating: { marginTop: 4, fontWeight: "700", color: "#007AFF" },
});
