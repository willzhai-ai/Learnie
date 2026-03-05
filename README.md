# Learnie

A gamified multi-subject learning platform for elementary school children. Children complete learning tasks to earn points and redeem real-world rewards set by their parents.

## Project Overview

**Target Audience**: Elementary school children (Grade 1-6, ~7-12 years old)
**Core Mechanic**: Complete learning tasks → Earn points → Redeem prizes

**Current Module**:
- 🏝️ **English Adventure Island** - English speaking practice with speech recognition

**Coming Soon**:
- 🔢 **Math Playground** - Mathematical logic and calculation
- ✏️ **Chinese World** - Pinyin, character recognition, and reading

## Features

### For Children
- 🎮 **Gamified Learning**: Subject-based worlds to explore and unlock
- 🎤 **AI Speech Evaluation**: Real-time pronunciation feedback using speech recognition
- 🏔️ **Tower Climbing Mode**: Challenge levels with national leaderboard
- 🏆 **Contest Mode**: Progressive challenge with boss battles
- 📚 **Smart Practice Mode**: Optimized question bank that minimizes API calls
- ⭐ **Points System**: Earn points based on difficulty and performance
- 🎁 **Prize Shop**: Redeem points for prizes set by parents
- 🏅 **Achievements**: Unlock badges for milestones

### For Parents
- 👨‍👩‍👧‍👦 **Child Management**: Create multiple child profiles with grade levels
- 🔐 **PIN Code Login**: Secure login system for children
- 🎁 **Prize Management**: Set custom prizes with automatic point calculation (1 yuan = 100 points)
- 📊 **Progress Dashboard**: View child's learning statistics and activity history
- 🔄 **Redemption Management**: Approve prize redemptions
- ☁️ **Cloud Sync**: Automatic data backup to Supabase

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15 + React 19 |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Animation | Framer Motion |
| Speech Recognition | Web Speech API (Chrome) |
| AI Evaluation | OpenAI / Zhipu AI / FunASR |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel (recommended) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase account (for production)
- OpenAI API key (optional, for AI evaluation)

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

# Optional: AI Speech Evaluation
OPENAI_API_KEY=your-openai-api-key
# Or use Zhipu AI
ZHIPU_API_KEY=your-zhipu-api-key
```

### Database Setup

Run the SQL migrations in Supabase SQL Editor in order:

1. `supabase/migrations/001_initial_schema.sql` - Core schema (tables, policies, sample tasks)
2. `supabase/migrations/002_tower_mode.sql` - Tower climbing mode tables
3. `supabase/migrations/003_answer_history.sql` - Answer history for smart question bank

Or use the quick setup:
```bash
# Copy contents of supabase/quick_setup.sql
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
│   ├── child/           # Child interface
│   │   ├── world/       # Subject/world selector
│   │   ├── english/     # English Adventure Island module
│   │   │   ├── practice/    # Individual task practice
│   │   │   ├── contest/     # Contest/challenge mode
│   │   │   ├── tower/       # Tower climbing mode
│   │   │   └── prizes/      # Prize redemption shop
│   │   └── login/       # PIN code login
│   ├── parent/          # Parent dashboard
│   │   ├── dashboard/   # Main dashboard with statistics
│   │   ├── prizes/      # Prize management
│   │   ├── create-child/# Child profile creation
│   │   ├── login/       # Parent login
│   │   └── register/    # Parent registration
│   ├── api/             # API routes
│   │   ├── questions/   # Question generation and smart fetching
│   │   ├── speech/      # Speech evaluation endpoints
│   │   └── tower/       # Tower mode APIs
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Landing page
│
├── components/
│   ├── ui/              # Base UI components (Button, Card, Badge, Input)
│   └── speech/          # Speech-related components (RecordingButton, TaskCard)
│
├── hooks/
│   ├── useSpeech.ts              # Speech recognition hook
│   ├── useSpeechWithScoring     # Speech with automatic scoring
│   ├── useSpeechWithOpenAI      # Speech with AI evaluation
│   ├── useQuestionBank.ts       # Standard question bank hook
│   └── useSmartQuestionBank.ts  # Smart question bank (minimizes LLM calls)
│
├── lib/
│   ├── api.ts            # API fetch wrapper
│   ├── dataSync.ts       # Supabase sync functions
│   ├── openai.ts        # OpenAI integration
│   ├── zhipu.ts         # Zhipu AI integration
│   ├── questionGenerator.ts  # AI question generation
│   ├── supabase.ts      # Database client
│   └── utils.ts         # Utility functions (points calculation, fuzzy matching)
│
├── stores/
│   └── gameStore.ts     # Global state (Zustand)
│
└── server/
    └── main.py          # Python server for AI speech evaluation (optional)
```

## Key Features Deep Dive

### Smart Question Bank
The practice mode uses an intelligent question bank that:
- Checks Supabase for completed questions (score >= 80)
- Only generates new questions when all current questions are completed
- Significantly reduces LLM API calls and costs

### Tower Climbing Mode
- Random questions from shared question pool
- Difficulty increases with level
- National leaderboard for competitive motivation
- 1 point per level, no upper limit

### Speech Recognition
- **Primary**: Web Speech API (webkitSpeechRecognition)
- **Browser Support**: Chrome, Edge (Chromium-based)
- **AI Evaluation**: OpenAI / Zhipu AI for detailed feedback
- **Scoring**: Levenshtein distance for fuzzy matching (60% threshold to pass)

## Points System

```
Base Points = 10-30 (depending on difficulty)
Difficulty Multiplier = 1.0 - 2.0 (Level 1-5)
Streak Bonus = 1.1x (3+), 1.2x (5+), 1.3x (10+)
First Time Bonus = 1.2x

Final Points = Base × Difficulty × Streak × FirstTime
```

## TODO / Roadmap

### Core Features
- [x] Supabase integration (auth, database)
- [x] Real-time database operations
- [x] Smart question bank with cloud-based completion tracking
- [ ] Achievement system with automatic detection
- [ ] Parent approval flow for redemptions

### Content
- [x] More English tasks across all levels
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
- [ ] Multi-language interface

## Contributing

This is a personal project for educational purposes.

## License

MIT
