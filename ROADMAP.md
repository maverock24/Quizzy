# Quizzy Development Roadmap

## Current State
Quizzy is a feature-rich quiz platform with 67 quizzes, 350-term glossary, gamification, multiplayer, 5 learning modes, and cross-platform support. The roadmap below prioritizes impact vs. effort.

---

## Phase 1: Polish & Stability (1-2 weeks)

### 1.1 Testing & QA
- [ ] Add unit tests for quiz scoring, shuffle logic, timer expiry
- [ ] Add integration tests for quiz flow (select → answer → score → retry)
- [ ] Test glossary modal on all screen sizes (mobile, tablet, desktop web)
- [ ] Fix edge cases: empty quiz, single-question quiz, all-wrong quiz
- [ ] Test multiplayer with 3+ real clients simultaneously

### 1.2 Bug Fixes
- [ ] Fix PeerJS connection failures on restrictive networks (add TURN server config)
- [ ] Fix scroll position reset when glossary modal opens/closes
- [ ] Fix dark mode consistency across all components (some use hardcoded colors)
- [ ] Fix large glossary JSON blocking initial bundle load (lazy-load it)

### 1.3 Performance
- [ ] Lazy-load `glossary.json` on first glossary open, not at app startup
- [ ] Memoize `ClickableTerms` segment calculation to avoid re-parsing on re-renders
- [ ] Virtualize quiz selection list for 100+ quiz scenarios
- [ ] Profile and optimize animation performance (reduce JS thread load)
- [ ] Add `InteractionManager.runAfterInteractions` for heavy mount operations

### 1.4 UX Polish
- [ ] Add haptic feedback on Android (currently iOS only via expo-haptics)
- [ ] Add skeleton loading states for async operations (quiz load, multiplayer join)
- [ ] Improve empty states (no quizzes found, no players online)
- [ ] Add pull-to-refresh on quiz list
- [ ] Add "Are you sure?" confirmation when abandoning a quiz mid-way

---

## Phase 2: Content & Learning (2-3 weeks)

### 2.1 Quiz Content Expansion
- [ ] Add 5-10 more quizzes per existing category to reach 100 total
- [ ] Add missing categories: Data Science, DevOps, Mobile Dev, System Design
- [ ] Community quiz submission + moderation workflow
- [ ] Quiz difficulty ratings (Beginner/Intermediate/Advanced) with filtering
- [ ] Quiz completion certificates (PDF export)

### 2.2 Spaced Repetition Overhaul
- [ ] Replace current simple SRS with SM-2 algorithm (proven effectiveness)
- [ ] Add push notification reminders: "You have 5 cards due for review today"
- [ ] SRS review streaks and statistics
- [ ] Visual forgetting curve display per question

### 2.3 Learning Paths
- [ ] Curated quiz sequences: "Become an AI Engineer" (predefined quiz order)
- [ ] Progress tracking per learning path (X% complete)
- [ ] Prerequisite unlocking (must pass Quiz A to unlock Quiz B)
- [ ] Adaptive difficulty: quiz order adjusts based on performance

### 2.4 Enhanced Flashcards
- [ ] Spaced-repetition-aware flashcard mode (due cards first)
- [ ] Swipe gestures (right=known, left=review) with smooth animations
- [ ] Flashcard decks exportable as Anki-compatible files

---

## Phase 3: Multiplayer & Social (3-4 weeks)

### 3.1 Multiplayer Reliability
- [ ] Replace PeerJS with WebSocket-based solution for better NAT traversal
- [ ] Add spectator mode (watch friends play live)
- [ ] Add in-game chat (text + emoji reactions)
- [ ] Tournament mode: bracket-style, single elimination
- [ ] Team play: 2v2, 3v3 modes

### 3.2 Social Features
- [ ] User accounts (email + OAuth: Google, GitHub, Apple)
- [ ] Friend lists + friend activity feed
- [ ] Leaderboards: global, friends-only, per-category, weekly
- [ ] Share quiz results as image cards (social media ready)
- [ ] Challenge-a-friend: send direct quiz challenge links
- [ ] User profiles: avatar, bio, stats, achievement showcase

### 3.3 Live Features
- [ ] Live trivia events (scheduled, host-led quiz sessions)
- [ ] Real-time audience participation (join via code, like Kahoot)
- [ ] Live scoreboard during events

---

## Phase 4: AI-Powered Features (3-4 weeks)

### 4.1 AI Quiz Generation
- [ ] "Generate a quiz on any topic" — user enters topic, LLM creates questions
- [ ] AI-generated explanations for wrong answers
- [ ] AI difficulty adjustment: generate harder questions on topics you've mastered
- [ ] AI-powered quiz summaries: "Your weak areas are: neural networks, gradient descent"

### 4.2 AI Tutoring
- [ ] Post-quiz AI tutor: conversational review of missed questions
- [ ] "Explain this concept to me" — AI explains any glossary term in detail
- [ ] AI study plan generator based on quiz performance history
- [ ] AI-generated practice questions targeting your weak areas

### 4.3 Content Enhancement
- [ ] AI-generated category essays (expand current essay system)
- [ ] AI quiz translation to all supported languages
- [ ] AI fact-checking of user-submitted quiz content

---

## Phase 5: Platform Expansion (4-6 weeks)

### 5.1 Backend Infrastructure
- [ ] Full backend API (replace AsyncStorage with cloud-synced data)
- [ ] Database: PostgreSQL for user data, Redis for leaderboards/sessions
- [ ] Authentication service (JWT + refresh tokens)
- [ ] Cloud-synced progress: continue on any device
- [ ] Admin dashboard for content management and analytics

### 5.2 Platform Features
- [ ] Custom quiz builder with rich editor (images, code blocks, math)
- [ ] Quiz marketplace: discover and rate community quizzes
- [ ] Quiz forking: copy and modify existing quizzes
- [ ] Organizations/Teams (corporate training use case)
- [ ] API for embedding quizzes in external websites

### 5.3 Analytics
- [ ] Personal analytics dashboard: strengths, weaknesses, trends over time
- [ ] Per-question analytics: which questions are hardest/easiest
- [ ] Time-of-day performance analysis
- [ ] Export analytics as CSV/PDF

### 5.4 Monetization (if desired)
- [ ] Premium subscription: unlimited AI quiz generation, advanced analytics
- [ ] Ad-free experience tier
- [ ] Team/enterprise plans for organizations
- [ ] One-time purchase for offline packs (specialized exam prep)

---

## Phase 6: Advanced Learning Science (4-6 weeks)

### 6.1 Evidence-Based Techniques
- [ ] Interleaved practice: mix questions from different topics in one session
- [ ] Retrieval practice with increasing intervals
- [ ] Elaborative interrogation prompts ("Why is this answer correct?")
- [ ] Dual coding: image + text questions
- [ ] Concrete examples: real-world scenario questions

### 6.2 Accessibility
- [ ] Full screen reader support (ARIA labels, semantic structure)
- [ ] High contrast mode
- [ ] Dyslexia-friendly font option
- [ ] Keyboard-only navigation for all features
- [ ] Reduced motion option for animations

### 6.3 Internationalization
- [ ] Add Spanish, French, Japanese, Chinese language support
- [ ] RTL language support (Arabic, Hebrew)
- [ ] Locale-aware number/date formatting
- [ ] Community translation platform

---

## Priority Matrix

|                           | Low Effort      | Medium Effort   | High Effort      |
|---------------------------|-----------------|-----------------|------------------|
| **High Impact**           | Bug fixes, A11y | AI quiz gen, SRS overhaul | Backend, Social |
| **Medium Impact**         | UX polish, i18n | Learning paths, Flashcards | Multiplayer v2  |
| **Low Impact**            | Analytics, Certificates | Quiz builder | Monetization, Marketplace |

---

## Recommended Next Sprint (2 weeks)

1. Fix remaining bugs (TURN servers, scroll issues, dark mode)
2. Lazy-load glossary.json
3. SM-2 spaced repetition implementation
4. Pull-to-refresh on quiz list
5. "Abandon quiz?" confirmation dialog
6. AI quiz generation MVP (single endpoint, simple prompt)
