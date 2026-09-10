# 🏃 PlexQo RUN

> A lightweight GPS running tracker built with **React Native (Expo)** for the PlexQo hiring assignment.

---

## 🛠️ Tech Stack

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![AsyncStorage](https://img.shields.io/badge/AsyncStorage-FF6B6B?style=for-the-badge&logo=react&logoColor=white)
![React Context](https://img.shields.io/badge/React_Context-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![expo--router](https://img.shields.io/badge/Expo_Router-000020?style=for-the-badge&logo=expo&logoColor=white)
![Google Maps](https://img.shields.io/badge/Google_Maps-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white)
![GPS](https://img.shields.io/badge/GPS_Tracking-00C853?style=for-the-badge&logo=googlemaps&logoColor=white)
![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![iOS](https://img.shields.io/badge/iOS-000000?style=for-the-badge&logo=apple&logoColor=white)

---

## ✨ Features

- 🚀 **Start a run** with a single tap
- 📍 **Live GPS tracking** — distance, duration, and average pace update in real time
- ⏸️ **Pause & Resume** — timer and distance freeze during pauses
- 🏁 **Finish run** with a confirmation prompt to avoid accidental stops
- 📊 **Run Summary** — total distance, duration, avg pace, and a route map
- 🗂️ **Last Run Card** — home screen shows your most recent run stats
- ⚠️ **Edge case handling** — GPS permission denied, signal loss, zero-distance runs

---

---

## Project Structure

```
plexqo-run/
├── app/
│   ├── _layout.tsx     # Root layout, RunProvider wrapper
│   ├── index.tsx       # Home / Start screen
│   ├── run.tsx         # Active run screen
│   └── summary.tsx     # Run summary screen
├── src/
│   ├── context/
│   │   └── RunContext.tsx     # Global run state machine
│   ├── hooks/
│   │   ├── useTimer.ts        # 1-second interval timer
│   │   └── useLocation.ts     # GPS subscription + filtering
│   ├── utils/
│   │   ├── distance.ts        # Haversine formula
│   │   └── format.ts          # Duration / distance / pace formatters
│   ├── components/
│   │   ├── MetricCard.tsx     # Reusable metric display tile
│   │   ├── RunControls.tsx    # Pause / Resume / Finish buttons
│   │   └── RouteMap.tsx       # MapView with Polyline
│   └── storage/
│       └── runStorage.ts      # AsyncStorage persistence
```

---

## Setup & Running

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`) — or use `npx expo`
- **Physical device** strongly recommended for GPS (simulators have limited location support)
- Install the **Expo Go** app on your phone (iOS App Store / Google Play)

### Install & Start

```bash
cd plexqo-run
npm install
npx expo start
```

Then scan the QR code with Expo Go on your phone.

### Running on Android Emulator

```bash
npx expo start --android
```

You can simulate GPS movement via the emulator's "Extended Controls → Location" panel.

### Running on iOS Simulator (macOS only)

```bash
npx expo start --ios
```

Use Xcode's Features → Location → Custom Location to simulate GPS.

---

## Testing the App

1. Open the app → tap **Start Run**
2. Walk around (or simulate GPS movement)
3. Watch Distance / Duration / Pace update live
4. Tap **Pause** → verify metrics freeze
5. Tap **Resume** → verify metrics continue
6. Tap **Finish** → confirm in the modal
7. View the **Summary screen** with stats and route map
8. Tap **Start New Run** to reset

---

## Assumptions & Decisions

- **Metric units** (km, min/km) — no imperial unit toggle for this scope
- **Foreground-only GPS** — background location is configured in `app.json` but foreground permission is sufficient for the demo flow
- **Single run storage** — only the most recent run is persisted (no run history list)
- **No auth / backend** — all data is local to the device
- **No gamification** — intentionally excluded per assignment brief

---

## Known Limitations

- **Background tracking on iOS**: After the app is backgrounded on iOS, GPS updates may be throttled by the OS. A production implementation would use a background location task with a foreground service notification.
- **GPS accuracy in buildings**: Indoor GPS is inherently inaccurate; points worse than 50 m accuracy are discarded to reduce noise.
- **Maps on Expo Go**: `react-native-maps` works on Expo Go for Android and iOS. For production builds, Google Maps API key configuration is required for Android.
- **No run history**: Only the last run is stored. A full implementation would use a proper database (SQLite).

---

## Architecture Notes

The app uses a single `RunContext` with a `useReducer`-based state machine. All screens read from and write to this context — there is no local component state for run data. GPS and timer logic are isolated in custom hooks (`useLocation`, `useTimer`) that dispatch actions to the reducer. This keeps screens thin and business logic testable in isolation.

Distance is computed with the **Haversine formula** on each GPS update. A `distanceInterval: 5` (metres) filter on `watchPositionAsync` and a minimum delta threshold of 2 m eliminate most GPS jitter without affecting perceived accuracy.
