# 英语冒险岛 - English Adventure Island

A gamified English speaking practice platform for elementary school children (Grade 3). Children complete speaking tasks to earn points and redeem real-world rewards set by their parents.

## Project Overview

**Target Audience**: Elementary school children (Grade 3, ~9 years old)
**Core Mechanic**: Complete speaking tasks → Earn points → Redeem prizes

## Features

### For Children
- 🎮 **Gamified Learning**: World map interface with locked subjects to unlock
- 🎤 **Speech Recognition**: Web Speech API for real-time pronunciation feedback
- 🏆 **Contest Mode**: Challenge mode with increasing difficulty (fail once = game over)
- ⭐ **Points System**: Earn points based on difficulty, streaks, and first-time bonuses
- 🎁 **Prize Shop**: Redeem points for prizes set by parents
- 🏅 **Achievements**: Unlock badges for milestones

### For Parents
- 👨‍👩‍👧‍👦 **Child Management**: Create multiple child profiles with PIN code login
- 🎁 **Prize Management**: Set custom prizes with automatic point calculation (1 yuan = 100 points)
- 📊 **Progress Dashboard**: View child's learning statistics and activity history
- 🔄 **Redemption Management**: Approve prize redemptions

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15 + React 19 |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Animation | Framer Motion |
| Speech Recognition | Web Speech API (Chrome) |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel (recommended) |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm or npm
- Supabase account (for production)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Set up Supabase
# 1. Create a new project at https://supabase.com
# 2. Copy your project URL and anon key to .env
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

Run the SQL migration in Supabase SQL Editor:

```bash
# Copy contents of supabase/migrations/001_initial_schema.sql
# and run in Supabase SQL Editor
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Parent authentication
│   ├── (child)/         # Child interface
│   │   ├── world/       # World map selector
│   │   ├── english/     # English practice tasks
│   │   ├── practice/    # Individual task practice
│   │   ├── contest/     # Contest/challenge mode
│   │   ├── prizes/      # Prize redemption shop
│   │   └── login/       # PIN code login
│   ├── parent/          # Parent dashboard
│   │   ├── dashboard/   # Main dashboard
│   │   ├── prizes/      # Prize management
│   │   ├── login/       # Parent login
│   │   ├── register/    # Parent registration
│   │   └── create-child/# Child profile creation
│   ├── api/             # API routes (future)
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Landing page
│
├── components/
│   ├── ui/              # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── Input.tsx
│   └── speech/          # Speech-related components
│       ├── TaskCard.tsx
│       └── RecordingButton.tsx
│
├── hooks/
│   └── useSpeech.ts     # Speech recognition hook
│
├── lib/
│   ├── supabase.ts      # Database client
│   └── utils.ts         # Utility functions
│
└── stores/
    └── gameStore.ts     # Global state (Zustand)
```

## Points System

```
Base Points = 10-30 (depending on task)
Difficulty Multiplier = 1.0 - 2.0 (Level 1-5)
Streak Bonus = 1.1x (3+), 1.2x (5+), 1.3x (10+)
First Time Bonus = 1.2x

Final Points = Base × Difficulty × Streak × FirstTime
```

## Speech Recognition

- **Primary**: Web Speech API (webkitSpeechRecognition)
- **Browser Support**: Chrome, Edge (Chromium-based)
- **Fallback**: Display error message for unsupported browsers
- **Scoring**: Levenshtein distance for fuzzy matching (60% threshold to pass)

## TODO / Future Enhancements

### Core Features
- [ ] Supabase integration (auth, database)
- [ ] Real-time database operations
- [ ] Achievement system with automatic detection
- [ ] Parent approval flow for redemptions

### Content
- [ ] More English tasks across all levels
- [ ] Math world (calculation practice)
- [ ] Chinese world (pinyin, character recognition)
- [ ] More contest levels

### Analytics
- [ ] Weekly/Monthly reports
- [ ] Pronunciation accuracy tracking
- [ ] Learning streak visualizations

### Platform
- [ ] iPad Safari support (Speech Recognition API)
- [ ] PWA support for offline access
- [ ] Dark mode
- [ ] Multi-language support

## License

MIT

## Contributing

This is a personal project for educational purposes.
# SSH Setup Complete
