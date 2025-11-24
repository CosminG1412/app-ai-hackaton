import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { HapticTab } from "@/components/haptic-tab";

export default function TabsLayout() {
  return (
    <Tabs 
        screenOptions={{ 
            headerShown: false,
            // Setează culorile de tab pentru coerență
            tabBarActiveTintColor: '#0a7ea4',
            tabBarInactiveTintColor: '#687076',
            tabBarStyle: { 
                backgroundColor: '#fff',
                borderTopColor: '#f0f0f0',
                paddingTop: 5,
                height: 90, 
            },
            tabBarButton: HapticTab, 
        }}
    >
      <Tabs.Screen
        name="index" // Poziția 1: Explore
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      {/* Tab-ul "chatbot" este acum în mijloc (poziția 2) */}
      <Tabs.Screen
        name="chatbot"
        options={{
          title: "Asistent AI",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore" // Poziția 3: Profile
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}