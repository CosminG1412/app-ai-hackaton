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
        name="index" // Poziția 1: ExploreScreen (index.tsx)
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      {/* Tab-ul "chatbot" este acum în mijloc (poziția 2) */}
      <Tabs.Screen
        name="chatbot" // Poziția 2: ChatbotScreen (chatbox.tsx)
        options={{
          title: "Asistent AI",
          // CORECȚIE FINALĂ: Utilizăm un operator ternar pentru a forța pictograma plină/goală
          // care este mai specifică pentru un chatbox.
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "chatbox-ellipses" : "chatbox-ellipses-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile" // Poziția 3: ProfileScreen (profile.tsx)
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