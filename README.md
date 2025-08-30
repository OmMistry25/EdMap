# EdMap - Visual Academic Planner

A Next.js application that helps students visualize their academic workload as an interactive flowchart, connecting various course management systems.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Supabase account
- Git

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd EdMap
   npm install
   ```

2. **Environment Variables:**
   Create `.env.local` in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Database Setup:**
   - Run migrations in Supabase SQL Editor:
     - `supabase/migrations/001_create_profiles_table.sql`
     - `supabase/migrations/002_create_core_tables.sql`

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Open http://localhost:3000
   - Sign in with magic link authentication

## 🎓 Demo Data Setup

### Option 1: Automatic Seeding (Recommended)
Run the automatic seed script in your Supabase SQL Editor:
```sql
-- Copy and paste the contents of scripts/seed-demo-data.sql
```

### Option 2: Manual Seeding
1. Get your user ID:
   ```sql
   SELECT id FROM auth.users WHERE email = 'your-email@example.com';
   ```

2. Update `supabase/seed.sql` with your user ID (replace `USER_ID_HERE`)

3. Run the seed script in Supabase SQL Editor

### What the Demo Data Creates:
- **4 Courses**: Computer Science, Calculus I, Physics Lab, Academic Writing
- **7 Sources**: Canvas, Gradescope, PrairieLearn, Lab Manual
- **15 Items**: Assignments, quizzes, exams, projects, labs with realistic due dates

## 🧪 Testing

### Test Components Available:
1. **TestQueryAndState**: Tests TanStack Query and Zustand state management
2. **TestProfiles**: Tests user profile CRUD operations
3. **TestCoreTables**: Tests basic course/source/item creation
4. **TestSeedData**: Tests comprehensive demo data (NEW!)

### How to Test:
1. Sign in to the application
2. Navigate to the dashboard
3. Use the test components to verify functionality
4. Check the "Seed Data Test" component to see all demo data

## 📊 Demo Data Features

The seed script creates a realistic academic scenario with:

### Courses:
- **CS101**: Introduction to Computer Science (Blue)
- **MATH201**: Calculus I (Green) 
- **PHYS101L**: Physics Lab (Orange)
- **ENG101**: Academic Writing (Purple)

### Item Types:
- Assignments (100-150 points, 90-240 min)
- Quizzes (25-75 points, 30-60 min)
- Exams (200-300 points, 120-180 min)
- Projects (150-300 points, 300-600 min)
- Labs (80 points, 120 min)
- Reading (30 points, 45 min)

### Item Statuses:
- **Upcoming**: Items due in the future
- **Submitted**: Items that have been turned in
- **Graded**: Items that have been graded

### Time Distribution:
- Items due today/tomorrow
- Items due this week
- Items due next week
- Items due in 2-4 weeks
- Items due at the end of semester

### Labels for Filtering:
- Programming, Python, Quiz, Basics
- Homework, Limits, Derivatives
- Lab, Motion, Forces, Report
- Essay, Argumentative, Research, Final

## 🏗️ Architecture

### Tech Stack:
- **Frontend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: Zustand + TanStack Query
- **UI**: shadcn/ui + Tailwind CSS
- **Graphs**: React Flow (upcoming)

### Database Schema:
```
users (auth.users)
├── profiles
├── courses
│   ├── sources
│   │   └── items
│   └── grades
├── events
├── integrations
└── settings
```

## 🔧 Development

### Project Structure:
```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── demo/           # Test components
│   └── providers/      # Context providers
├── lib/                # Utilities and configurations
│   ├── auth.ts         # Authentication helpers
│   ├── supabaseClient.ts # Supabase client setup
│   └── db/             # Database queries
├── state/              # Zustand stores
└── types/              # TypeScript type definitions
```

### Key Files:
- `supabase/migrations/`: Database schema migrations
- `supabase/seed.sql`: Manual seed script
- `scripts/seed-demo-data.sql`: Automatic seed script
- `src/components/demo/TestSeedData.tsx`: Demo data test component

## 🚧 Current Status

### Completed:
- ✅ Authentication (magic link)
- ✅ User profiles with onboarding
- ✅ Core database schema (courses, sources, items)
- ✅ Row Level Security (RLS)
- ✅ Basic CRUD operations
- ✅ Demo data seeding
- ✅ Test components

### Next Steps:
- 🔄 React Flow graph visualization
- 🔄 Course system integrations (Canvas, etc.)
- 🔄 Calendar view
- 🔄 Planning algorithms

## 🤝 Contributing

1. Follow the coding protocol: write minimal, precise, testable code
2. Complete one task at a time
3. Test thoroughly before moving to the next task
4. Commit to GitHub after each successful task

## 📝 License

This project is part of the EdMap academic planning system.
