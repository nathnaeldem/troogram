# Troogram — No Filters. No Fakes. No AI.

A next-generation social media platform built on authenticity. Every post is captured live through the camera. No gallery uploads. No filters. No AI-generated media.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (TypeScript) |
| Backend / DB | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime (WebSockets) |
| Auth | Supabase Auth + `expo-local-authentication` (Face ID) |
| State Management | TanStack Query (React Query) |
| Storage | Supabase Storage (S3-backed) |
| Session Security | `expo-secure-store` |

---

## Project Structure

```
troogram/
├── src/
│   ├── context/
│   │   └── AuthContext.tsx         # Session + profile state
│   ├── hooks/
│   │   ├── usePosts.ts             # Feed, create post, toggle like
│   │   ├── useMessages.ts          # Conversations + realtime chat
│   │   └── useProfile.ts          # Profile, follow/unfollow
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client (SecureStore adapter)
│   │   └── queryClient.ts         # TanStack Query config
│   ├── navigation/
│   │   ├── AppNavigator.tsx        # Tab + stack (authenticated)
│   │   └── AuthNavigator.tsx       # Auth stack (unauthenticated)
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── LoginScreen.tsx     # Email + Face ID login
│   │   │   └── SignUpScreen.tsx
│   │   ├── FeedScreen.tsx          # Live global feed
│   │   ├── CameraScreen.tsx        # Camera-only capture (no gallery)
│   │   ├── MessagesScreen.tsx      # Conversation list
│   │   ├── ChatScreen.tsx          # Real-time E2E chat
│   │   └── ProfileScreen.tsx       # Profile + follow + grid
│   ├── components/
│   │   ├── Avatar.tsx
│   │   ├── PostCard.tsx
│   │   └── GradientBackground.tsx
│   └── theme/
│       └── colors.ts               # Brand colors: Blue/Purple/Orange
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Full DB schema + RLS + RPC functions
├── App.tsx
├── app.json
└── babel.config.js
```

---

## Setup

### 1. Clone & Install

```bash
cd troogram
npm install
```

### 2. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **anon/public key**

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the Database Migration

In the Supabase Dashboard → **SQL Editor**, paste and run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

This creates all tables, RLS policies, indexes, and RPC helper functions.

### 5. Create Storage Buckets

In Supabase Dashboard → **Storage** → New Bucket:

| Bucket name | Public |
|---|---|
| `posts` | ✅ Yes |
| `avatars` | ✅ Yes |

### 6. Enable Realtime

In Supabase Dashboard → **Database** → **Replication**, enable realtime for:
- `public.posts`
- `public.messages`

### 7. Run the App

```bash
# Development (Expo Go)
npx expo start

# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android
```

---

## Key Features (Phase 1 MVP)

- **Camera-only capture** — `expo-camera` with no gallery access path
- **Face ID / Biometric login** — `expo-local-authentication`, credentials stored in `expo-secure-store`
- **Live global feed** — TanStack Query + Supabase Realtime INSERT subscription
- **Verified capture badge** — Every post is marked `is_verified_capture: true`
- **Follow system** — Atomic follower/following counts via Supabase RPC
- **Encrypted messaging** — E2E architecture with per-conversation RLS policies
- **Dark UI** — Troogram brand colors: Blue `#4F46E5` / Purple `#7C3AED` / Orange `#F97316`

---

## Phase 2 Roadmap

- AI moderation (anti-deepfake detection via Edge Functions)
- Device fingerprinting
- Content verification pipeline
- Live streaming

## Phase 3 Roadmap

- Creator economy tools
- Verified identity badges (paid tier)
- Brand partnerships & sponsored events
- Global discovery features
