## 📘 README — Explorează România 🇷🇴

# 🌄 Explorează România — Aplicație Mobilă cu AI

Explorează România este o aplicație mobilă modernă, construită pentru Hackathonul AI 2025, ce ajută utilizatorii să descopere locații din România într-un mod inteligent, rapid și personalizat.
Aplicația combină o interfață intuitivă cu un asistent AI puternic, generare de „vibe” pentru locații, căutare rapidă, vizualizare pe hartă și funcții sociale precum rezervare directă pe WhatsApp.

👥 Echipă

Groza Cosmin — Anul 3 CTI

Robert Andone — Anul 3 CTI

🤖 Tehnologii & AI

Aplicația integrează multiple modele AI pentru precizie și flexibilitate:

OpenAI GPT-5.1 (Plus)

Google Gemini Pro

Claude (VS Code Helper)

🚀 Funcționalități principale
🔐 1. Autentificare (Mock Login)

Ecran modern de login cu validare locală.
Pentru a intra în aplicație, trebuie folosite credențialele mock:

👉 Email: user@test.com
👉 Parola: password123

✔️ Rutare protejată cu guard logic
✔️ După logout, utilizatorul revine automat la ecranul de login

🏠 2. Explore — Lista completă de locații

Listă card-based modernă

Poze HD

Rating ⭐

Descriere scurtă

Search bar funcțional

Filter icon (UI + logic local)

🗺️ 3. Map View (Hartă interactivă)

Afișare locații pe hartă

Selectarea unui pin → deschidere ecran de detalii

Hărți optimizate pentru performanță

Integrare perfectă cu navigarea

📝 4. Detalii locație + Vibe Generator AI

Pe ecranul de detalii ai:

Poză mare a locației

Nume, rating, adresă

Buton „Generează vibe cu AI”

Generează un text creativ, stil „vibe”

Folosește GPT-5.1 / Gemini Pro

UX modern + loading state

Secțiune „Despre locație”

Buton „Rezervă acum” → WhatsApp precompletat

💬 5. Asistent AI (Chatbot Inteligent)

Asistentul AI înțelege întrebări tematice despre România, precum:

„Cel mai bun restaurant din Timișoara?”

„Un restaurant asiatic în Brașov?”

„Top 3 cafenele din Cluj.”

„Descrie vibe-ul unui loc.”

✔️ Folosește datele interne ale aplicației
✔️ Răspunsuri naturale, structurate
✔️ Bilete interactive → tap pentru detalii

👤 6. Profil utilizator

Poză de profil

Nume + username

Oraș

Bio

Card modern

Buton Logout

🛠️ Tehnologii folosite

React Native + Expo

Expo Router

TypeScript

react-native-maps

OpenAI API

Gemini API

Context API

WhatsApp deep-linking

Haptic feedback (expo-haptics)

📂 Structură proiect (simplificată)
app/
 ├── (auth)/
 │     └── login.tsx
 ├── (tabs)/
 │     ├── index.tsx        # Explore
 │     ├── map.tsx          # Map view
 │     ├── chatbot.tsx      # AI Assistant
 │     └── profile.tsx      # Profile
 ├── screens/
 │     └── DetailsScreen.tsx
 ├── hooks/
 │     └── use-auth.ts
 ├── data/
 │     └── locations.json
 └── components/

▶️ Instalare & rulare
git clone https://github.com/...
cd app-ai-hackaton
npm install
npx expo start

🌟 Ce aduce aplicația?

Interfață prietenoasă și modernă

AI contextual și rapid

Recomandări reale din dataset

Skin complet cu list view + map view

Funcții sociale (WhatsApp)

Vibe generator cu AI

Login mock + profile page
