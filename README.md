# Crawl 🗺

A social outing planner for friend groups in NYC. The hero feature is a **group swipe system** where friends independently swipe on spots and the app reveals what everyone agreed on — like a match.

## Features

- **Swipe Mode** — Tinder-style swipe on nearby restaurants and bars powered by Google Places
- **Group Match** — Firebase real-time sync reveals when 2+ friends swipe YES on the same spot
- **Browse Mode** — Search, filter, and discover spots with real photos and health grades
- **AI Vibe Planner** — Claude AI generates a custom 3-stop NYC crawl plan based on vibe, budget, and group size
- **Outing Map** — Live map with stop markers, SVG route lines, and animated progress
- **Group Voting** — Real-time voting on next stop saved to Firebase
- **AI Recap** — Claude AI writes a fun recap of your night out
- **Star Ratings** — Rate each stop, saved to Firebase
- **Bill Split** — Per-person cost with Venmo deep links
- **Profile** — Stats, achievements, NYC map, and past outings

## Tech Stack

- **Expo SDK 51** / React Native 0.74
- **expo-router** for file-based navigation
- **Firebase** (Firestore + Auth) for real-time data
- **Google Places API** for restaurant data and photos
- **Yelp API** as photo fallback
- **Foursquare API** for trending spots
- **Claude API** for AI recap and outing planning
- **OpenWeather API** for live NYC weather
- **NYC Open Data** for restaurant health grades
- **react-native-maps** for the outing map
- **react-native-reanimated** + **PanResponder** for swipe gestures

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your API keys
3. Install dependencies: `npm install`
4. Start the app: `expo start`
5. Scan the QR code with **Expo Go**

## Environment Variables

See `.env.example` for all required keys:

| Variable | Service |
|---|---|
| `GOOGLE_PLACES_KEY` | Google Places API |
| `YELP_API_KEY` | Yelp Fusion API |
| `NYC_OPEN_DATA_TOKEN` | NYC Open Data |
| `FOURSQUARE_KEY` | Foursquare Places API |
| `CLAUDE_API_KEY` | Anthropic Claude API |
| `FIREBASE_API_KEY` | Firebase |
| `OPENWEATHER_KEY` | OpenWeather API |

## Project Structure

```
crawl/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Tab bar
│   │   ├── discover.tsx      # Swipe + Browse screens
│   │   ├── outing.tsx        # Live outing tracker
│   │   ├── recap.tsx         # Post-outing recap
│   │   └── profile.tsx       # User profile
│   ├── _layout.tsx           # Root layout
│   └── index.tsx             # Splash/entry screen
├── services/
│   ├── firebase.ts           # Firebase config + functions
│   ├── googlePlaces.ts       # Google Places API
│   ├── yelp.ts               # Yelp API
│   ├── nycOpenData.ts        # NYC health grades
│   ├── foursquare.ts         # Foursquare trending
│   ├── claude.ts             # Claude AI
│   └── weather.ts            # OpenWeather
├── components/
│   ├── SwipeCard.tsx         # Swipeable card with PanResponder
│   ├── RestaurantCard.tsx    # Browse mode card
│   ├── StopItem.tsx          # Stop list item
│   ├── VoteCard.tsx          # Group voting card
│   ├── MatchModal.tsx        # Group match modal with confetti
│   ├── ProgressBar.tsx       # Animated progress bar
│   └── Toast.tsx             # Animated toast notification
├── constants/
│   └── colors.ts             # App color palette
├── .env                      # Environment variables
├── app.json                  # Expo config
├── metro.config.js           # Metro bundler config
└── package.json
```

## Rules Followed

- Zero NativeWind / Tailwind / className — StyleSheet.create() only
- Zero tRPC / Drizzle / SQL — Firebase only
- Zero server folder / Express / backend
- Expo SDK 51, React Native 0.74 exactly
- Every API call wrapped in try/catch with fallback data
- metro.config.js is exactly 3 lines
