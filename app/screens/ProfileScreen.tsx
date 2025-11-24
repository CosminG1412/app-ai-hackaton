import React from "react";
import { Image, Text, View } from "react-native";

export default function ProfileScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", paddingTop: 60 }}>
      <Image
        source={{ uri: "https://i.pravatar.cc/150?img=12" }}
        style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 20 }}
      />
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>Cosmin</Text>
      <Text style={{ color: "gray", marginTop: 5 }}>@hackathon-2025</Text>
    </View>
  );
}
