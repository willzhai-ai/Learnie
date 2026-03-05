# CLAUDE.md - Project-Specific Instructions

## Project Overview

**Project Name**: 英语冒险岛 (English Adventure Island)

A gamified English speaking practice platform for elementary school children (Grade 3). Built with Next.js 15, React 19, Tailwind CSS, and Supabase.

## Key Development Rules

1. **Child-Friendly Design**: All UI should be colorful, engaging, and easy for children to navigate
2. **Speech Recognition Priority**: The core feature is speech recognition - always test with Chrome browser
3. **Browser Compatibility**: Web Speech API only works in Chrome/Edge - show friendly error for other browsers
4. **Parent Controls**: Parents manage prizes and approve redemptions - children only earn and redeem
5. **Data Persistence**: Use Zustand persist for local state during development, integrate Supabase for production

## Technology Constraints

- **Next.js 15**: Use App Router (not Pages Router)
- **React 19**: Use latest React patterns (no forwardRef if not needed)
- **Tailwind CSS**: All styling via Tailwind - no CSS modules
- **TypeScript**: Strict mode enabled
- **Speech Recognition**: Web Speech API only (Chrome/Edge) - no backend API fallback for MVP

## Important File Locations

| File | Purpose |
|------|---------|
| `src/stores/gameStore.ts` | Global state (Zustand) - child data, points, streaks |
| `src/hooks/useSpeech.ts` | Speech recognition hook with scoring |
| `src/lib/utils.ts` | Points calculation, fuzzy matching (Levenshtein) |
| `supabase/migrations/001_initial_schema.sql` | Database schema |
| `src/app/child/practice/page.tsx` | Core practice flow |
| `src/app/child/contest/page.tsx` | Contest/challenge mode |

## Common Tasks

### Adding a New Task
1. Add task definition to `src/app/child/english/page.tsx` SAMPLE_TASKS array
2. Add task data to `src/app/child/practice/page.tsx` TASK_DATA object
3. Include: prompt, expectedAnswers, emoji, difficulty, basePoints, hint

### Modifying Points Calculation
Edit `src/lib/utils.ts` - `calculatePoints()` function:
```typescript
export function calculatePoints(
  basePoints: number,
  difficulty: number = 1,
  streak: number = 0,
  isFirstTime: boolean = false
): number
```

### Adding Achievement
1. Add to `supabase/migrations/001_initial_schema.sql` achievements table
2. Create detection logic in achievement system (TODO)

## Speech Recognition Notes

- **Language**: en-US (American English)
- **Threshold**: 60% similarity to pass
- **Scoring**: Uses Levenshtein distance for fuzzy matching
- **Timeout**: Auto-stops after silence (browser controlled)
- **Error Handling**: Show user-friendly messages in Chinese

## Points System

| Level | Type | Base Points |
|-------|------|-------------|
| 1 | Word | 10 |
| 2 | Phrase | 15 |
| 3 | Sentence | 20 |
| 4 | Question | 25 |
| 5 | Scenario | 30 |

**Multipliers**:
- Difficulty: 1.0 - 2.0
- Streak: 1.1x (3+), 1.2x (5+), 1.3x (10+)
- First time: 1.2x

## Color Scheme

- **Primary**: Pink/Rose (`bg-primary-500` = #f43f5e)
- **Secondary**: Blue (`bg-secondary-500` = #0ea5e9)
- **Accent**: Amber (`bg-accent-500` = #d97706)
- **Success**: Green (`bg-success-500` = #22c55e)
- **Yellow**: For points/stars (`bg-yellow-500`)

## Development Workflow

1. Test speech recognition in Chrome only
2. Use Zustand persist to maintain state across page reloads during development
3. Mock API calls with setTimeout for realistic loading states
4. Test responsive design on iPad sizes (768x1024)

## When User Corrects You

Add new rules to this file so mistakes aren't repeated.
