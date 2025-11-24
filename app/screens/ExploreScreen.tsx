import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explore</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/screens/MapScreen")}
      >
        <Text style={styles.buttonText}>Open Map</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/screens/ListScreen")}
      >
        <Text style={styles.buttonText}>View List</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 25,
  },
  button: {
    width: "70%",
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
