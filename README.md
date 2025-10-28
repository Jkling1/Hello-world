# CPT-7 Prep - NASM-Aligned Study Application

A polished, mobile-first study app for NASM CPT-7 exam preparation featuring flashcards, spaced-repetition, mini-games, realistic practice tests, detailed rationales, progress analytics, and an authoring console.

## Features

### Study Tools
- **Flashcards** - Spaced repetition using SM-2 algorithm with difficulty ratings
- **Practice Tests** - Full 120-question exam simulations with 2-hour timer
- **Mini-Games** - Match-Up, Lightning Round, and Case Builder (coming soon)
- **Progress Analytics** - Domain mastery tracking and weak-area identification
- **Blueprint Map** - Visual representation of all 6 CPT-7 domains

### Content
- **Original Content** - All questions and flashcards are original and aligned to the CPT-7 blueprint
- **Blueprint-Aligned** - Content follows official NASM domain weights:
  - D1: Basic & Applied Sciences + Nutrition (15%)
  - D2: Client Relations & Behavioral Coaching (15%)
  - D3: Assessment (16%)
  - D4: Exercise Technique & Training Instruction (24%)
  - D5: Program Design (20%)
  - D6: Professional Development & Responsibility (10%)

### Technical Features
- **PWA Support** - Installable with offline caching
- **Dark Mode** - Light/dark theme support
- **Responsive Design** - Mobile-first, works on all devices
- **TypeScript** - Full type safety
- **Database** - SQLite for dev, Postgres for production

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: Prisma ORM with SQLite/Postgres
- **Auth**: NextAuth (magic-link)
- **Testing**: Vitest + Playwright

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd Hello-world
```

2. Install dependencies
```bash
npm install --legacy-peer-deps
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

4. Generate Prisma client and run migrations
```bash
npx prisma generate
npx prisma db push
```

5. Seed the database
```bash
npm run db:seed
```

6. Run the development server
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Database Schema

### Core Models
- **Domain** - The 6 CPT-7 performance domains
- **Subtopic** - Specific topics within each domain
- **Question** - Practice exam questions with rationales
- **Flashcard** - Study cards with spaced repetition
- **Term** - Glossary terms and definitions
- **ExamTemplate** - Test configurations
- **Attempt** - User test attempts and results
- **Progress** - Domain mastery tracking
- **Review** - Spaced repetition schedule

## Content Guidelines

### Creating Questions

All questions must:
1. Be **original** - Never copy or closely paraphrase NASM materials
2. Be **blueprint-aligned** - Map to official CPT-7 domains and subtopics
3. Include **rationales** - Explain why the correct answer is right and why distractors are wrong
4. Use **appropriate difficulty** - Easy, Moderate, or Challenging
5. Follow NASM terminology - Use OPT model, acute variables, etc.

### Question Format
```typescript
{
  stem: "The question text",
  choices: ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
  answerIdx: 1, // 0-based index
  rationale: "Explanation of correct answer and why others are wrong",
  difficulty: "Moderate",
  domainId: "D1",
  subtopicId: "subtopic-id",
  tags: ["energy-systems", "anaerobic"]
}
```

### Creating Flashcards

Flashcards should:
1. Focus on **key concepts** from the blueprint
2. Use **clear, concise language**
3. Include **context** when necessary
4. Be **self-contained** - Don't require external resources
5. Progress from **simple to complex**

## Admin Console

Access at `/admin` to:
- Add/edit/delete questions, flashcards, and terms
- Import/export content via CSV/JSON
- Validate domain weight distribution
- Manage domains and subtopics

## Compliance & Legal

**Important**: This application:
- Contains **original educational content** aligned to the NASM CPT-7 blueprint
- Is **not affiliated with or endorsed by** NASM
- Does **not reproduce** proprietary exam items
- Is for **educational purposes** only

All questions and flashcards are created independently based on publicly available information about the CPT-7 exam domains and objectives.

## License

MIT License

---

**Built with Claude Code**