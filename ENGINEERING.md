# JobFit — Engineering Specification

> **Source of Truth**: [PROJECT_SPEC.md](file:///d:/projects/JobFit/PROJECT_SPEC.md)
> **Product Context**: [PRODUCT.md](file:///d:/projects/JobFit/PRODUCT.md)
> **UI Context**: [UI.md](file:///d:/projects/JobFit/UI.md)
> This document is the implementation-ready engineering blueprint for JobFit.

---

## 1. Architecture

### 1.1 Overall Application Architecture

JobFit is a **monolithic Next.js application** using the App Router. All frontend, backend logic (Server Actions + Route Handlers), and database access live in a single Next.js project. AI calls, job aggregation, and file storage are abstracted behind service layers.

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (Browser)                     │
│   React Components (Client Components + Server Components)   │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      Next.js App Router                      │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  Server Actions   │  │  Route Handlers  │                 │
│  │  (mutations)      │  │  (API endpoints) │                 │
│  └────────┬─────────┘  └────────┬─────────┘                 │
│           │                      │                           │
│  ┌────────▼──────────────────────▼─────────┐                │
│  │            Service Layer                 │                │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────┐│                │
│  │  │ AI      │ │ Matching │ │ Job Agg.  ││                │
│  │  │ Service │ │ Engine   │ │ Service   ││                │
│  │  └────┬────┘ └────┬─────┘ └─────┬─────┘│                │
│  │       │           │              │       │                │
│  │  ┌────▼───────────▼──────────────▼─────┐│                │
│  │  │         Data Access Layer (DAL)      ││                │
│  │  │         Prisma Client                ││                │
│  │  └────────────────┬────────────────────┘│                │
│  └───────────────────┼─────────────────────┘                │
└──────────────────────┼──────────────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │      PostgreSQL          │
          └─────────────────────────┘

External Services:
  ├── OpenAI / Gemini API
  ├── AWS S3 (file storage)
  ├── Auth.js providers (Google OAuth)
  └── Job Source APIs (Adzuna, etc.)
```

### 1.2 Next.js App Router Architecture

#### Route Groups

```
src/app/
├── (public)/                    # Public pages (no auth required)
│   ├── page.tsx                 # Landing page
│   ├── jobs/
│   │   ├── page.tsx             # Public job listing
│   │   └── [jobId]/
│   │       └── page.tsx         # Public job detail
│   └── layout.tsx               # Public layout (top nav)
│
├── (auth)/                      # Authentication pages
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── forgot-password/
│   │   └── page.tsx
│   └── layout.tsx               # Auth layout (centered card)
│
├── (student)/                   # Student dashboard pages
│   ├── dashboard/
│   │   └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   ├── resume/
│   │   ├── page.tsx             # Resume view/upload
│   │   └── analysis/
│   │       └── page.tsx         # Resume analysis
│   ├── jobs/
│   │   ├── page.tsx             # Job discovery (authenticated)
│   │   ├── top-matches/
│   │   │   └── page.tsx         # Top 10 matches
│   │   └── [jobId]/
│   │       ├── page.tsx         # Job detail (with match info)
│   │       └── analysis/
│   │           └── page.tsx     # Resume vs Job analysis
│   ├── applications/
│   │   └── page.tsx             # Application tracker
│   ├── skill-gap/
│   │   └── page.tsx
│   ├── dsa/
│   │   ├── page.tsx             # DSA overview
│   │   └── [topicId]/
│   │       └── page.tsx         # Topic problems
│   ├── interview/
│   │   ├── page.tsx             # Interview prep overview
│   │   ├── practice/
│   │   │   └── page.tsx         # Practice session
│   │   └── mock/
│   │       ├── page.tsx         # Mock interview setup
│   │       ├── [sessionId]/
│   │       │   └── page.tsx     # Active mock interview
│   │       └── report/
│   │           └── [sessionId]/
│   │               └── page.tsx # Interview report
│   ├── ai-assistant/
│   │   └── page.tsx
│   ├── notifications/
│   │   └── page.tsx
│   └── layout.tsx               # Student layout (sidebar)
│
├── (recruiter)/                 # Recruiter pages
│   ├── recruiter/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── jobs/
│   │   │   ├── page.tsx         # Recruiter's jobs
│   │   │   ├── new/
│   │   │   │   └── page.tsx     # Create job
│   │   │   └── [jobId]/
│   │   │       ├── page.tsx     # Edit job
│   │   │       └── applicants/
│   │   │           └── page.tsx # View applicants
│   │   ├── candidates/
│   │   │   ├── page.tsx         # Search candidates
│   │   │   └── [candidateId]/
│   │   │       └── page.tsx     # Candidate profile
│   │   └── interviews/
│   │       └── page.tsx
│   └── layout.tsx               # Recruiter layout (sidebar)
│
├── (admin)/                     # Admin pages
│   ├── admin/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── users/
│   │   │   └── page.tsx
│   │   ├── companies/
│   │   │   └── page.tsx
│   │   ├── jobs/
│   │   │   └── page.tsx
│   │   └── analytics/
│   │       └── page.tsx
│   └── layout.tsx               # Admin layout (sidebar)
│
├── api/                         # Route Handlers
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts
│   ├── upload/
│   │   └── resume/
│   │       └── route.ts         # Resume upload endpoint
│   ├── jobs/
│   │   └── route.ts             # Job listing API (public)
│   ├── webhooks/
│   │   └── route.ts             # External webhooks
│   └── cron/
│       └── jobs/
│           └── route.ts         # Job sync cron endpoint
│
├── layout.tsx                   # Root layout
├── not-found.tsx                # 404 page
├── error.tsx                    # Error boundary
└── globals.css                  # Global styles
```

### 1.3 Feature-Oriented Folder Structure

```
src/
├── app/                         # Next.js App Router pages (above)
├── components/
│   ├── ui/                      # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── skeleton.tsx
│   │   ├── toast.tsx
│   │   └── ... (all shadcn components)
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── top-nav.tsx
│   │   ├── mobile-nav.tsx
│   │   ├── page-header.tsx
│   │   └── footer.tsx
│   ├── resume/
│   │   ├── resume-upload.tsx
│   │   ├── resume-preview.tsx
│   │   ├── resume-score.tsx
│   │   ├── resume-analysis-view.tsx
│   │   └── resume-comparison.tsx
│   ├── jobs/
│   │   ├── job-card.tsx
│   │   ├── job-list.tsx
│   │   ├── job-filters.tsx
│   │   ├── job-search.tsx
│   │   ├── match-score.tsx
│   │   ├── match-breakdown.tsx
│   │   └── skill-tag.tsx
│   ├── applications/
│   │   ├── kanban-board.tsx
│   │   ├── application-card.tsx
│   │   └── application-detail.tsx
│   ├── interview/
│   │   ├── interview-chat.tsx
│   │   ├── question-card.tsx
│   │   ├── interview-report.tsx
│   │   └── mock-setup.tsx
│   ├── dsa/
│   │   ├── topic-card.tsx
│   │   ├── problem-view.tsx
│   │   └── progress-chart.tsx
│   ├── dashboard/
│   │   ├── stat-card.tsx
│   │   ├── dashboard-jobs.tsx
│   │   └── dashboard-activity.tsx
│   ├── shared/
│   │   ├── empty-state.tsx
│   │   ├── error-state.tsx
│   │   ├── loading-state.tsx
│   │   ├── confirm-dialog.tsx
│   │   ├── file-upload.tsx
│   │   ├── radar-chart.tsx
│   │   └── pdf-viewer.tsx
│   └── providers/
│       ├── auth-provider.tsx
│       ├── toast-provider.tsx
│       └── theme-provider.tsx
│
├── lib/
│   ├── prisma.ts                # Prisma client singleton
│   ├── auth.ts                  # Auth.js configuration
│   ├── utils.ts                 # General utilities
│   ├── constants.ts             # App-wide constants
│   └── validators/
│       ├── resume.ts            # Resume validation schemas (Zod)
│       ├── job.ts               # Job validation schemas
│       ├── profile.ts           # Profile validation schemas
│       └── auth.ts              # Auth validation schemas
│
├── services/
│   ├── ai/
│   │   ├── ai-client.ts         # AI provider abstraction
│   │   ├── prompts/
│   │   │   ├── resume-analysis.ts
│   │   │   ├── resume-improvement.ts
│   │   │   ├── interview-questions.ts
│   │   │   ├── interview-evaluation.ts
│   │   │   ├── follow-up.ts
│   │   │   ├── mock-interview.ts
│   │   │   ├── dsa-generation.ts
│   │   │   └── career-recommendation.ts
│   │   ├── schemas/
│   │   │   ├── resume-analysis-schema.ts
│   │   │   ├── interview-schema.ts
│   │   │   └── dsa-schema.ts
│   │   └── index.ts             # AI service public API
│   ├── resume/
│   │   ├── parser.ts            # Text extraction
│   │   ├── analyzer.ts          # Resume analysis orchestrator
│   │   └── storage.ts           # S3 upload/download
│   ├── jobs/
│   │   ├── aggregator.ts        # Job aggregation orchestrator
│   │   ├── normalizer.ts        # Job data normalization
│   │   ├── deduplicator.ts      # Deduplication logic
│   │   └── adapters/
│   │       ├── base-adapter.ts  # Abstract adapter interface
│   │       ├── recruiter-adapter.ts  # Internal recruiter jobs
│   │       ├── adzuna-adapter.ts     # Adzuna API
│   │       ├── remotive-adapter.ts   # Remotive API
│   │       └── rss-adapter.ts        # RSS feed adapter
│   ├── matching/
│   │   ├── engine.ts            # Deterministic matching engine
│   │   ├── scorer.ts            # Score calculator
│   │   ├── config.ts            # Weight configuration
│   │   └── semantic.ts          # Optional AI-enhanced matching
│   ├── skill-gap/
│   │   ├── analyzer.ts          # Skill gap analysis
│   │   └── roadmap.ts           # Learning roadmap generator
│   ├── interview/
│   │   ├── generator.ts         # Question generation orchestrator
│   │   ├── evaluator.ts         # Answer evaluation
│   │   ├── follow-up.ts         # Follow-up logic
│   │   └── mock.ts              # Mock interview orchestrator
│   ├── dsa/
│   │   ├── generator.ts         # DSA question generation
│   │   ├── recommender.ts       # Topic recommendation
│   │   └── tracker.ts           # Progress tracking
│   ├── notifications/
│   │   └── notification-service.ts
│   └── admin/
│       └── analytics-service.ts
│
├── actions/                     # Next.js Server Actions
│   ├── auth.ts
│   ├── profile.ts
│   ├── resume.ts
│   ├── jobs.ts
│   ├── matching.ts
│   ├── applications.ts
│   ├── interview.ts
│   ├── dsa.ts
│   ├── skill-gap.ts
│   ├── notifications.ts
│   ├── recruiter.ts
│   └── admin.ts
│
├── dal/                         # Data Access Layer
│   ├── users.ts
│   ├── profiles.ts
│   ├── resumes.ts
│   ├── jobs.ts
│   ├── applications.ts
│   ├── skills.ts
│   ├── interviews.ts
│   ├── dsa.ts
│   ├── notifications.ts
│   └── companies.ts
│
├── types/
│   ├── index.ts                 # Shared type exports
│   ├── resume.ts
│   ├── job.ts
│   ├── matching.ts
│   ├── interview.ts
│   ├── dsa.ts
│   └── ai.ts
│
├── hooks/
│   ├── use-auth.ts
│   ├── use-toast.ts
│   ├── use-debounce.ts
│   └── use-pagination.ts
│
├── config/
│   ├── navigation.ts            # Sidebar nav items by role
│   ├── matching-weights.ts      # Matching algorithm weights
│   └── dsa-topics.ts            # DSA topic definitions
│
└── middleware.ts                 # Auth + RBAC middleware
```

### 1.4 Server vs Client Component Boundaries

**Server Components** (default):
- Page components (`page.tsx`)
- Layout components (`layout.tsx`)
- Data-fetching containers
- Static content sections
- Components that access Prisma directly via DAL/Services

**Client Components** (`"use client"`):
- Interactive forms (inputs, buttons with state)
- Components using `useState`, `useEffect`, `useRef`
- Event handlers (onClick, onSubmit, onChange)
- Components using browser APIs
- Toast/notification triggers
- Charts and data visualizations
- File upload with drag-and-drop
- Kanban board (drag-and-drop)
- Interview chat interface
- PDF viewer
- Sidebar collapse toggle
- Mobile navigation

**Pattern**: Server Component wraps Client Component, passing data as props:
```typescript
// page.tsx (Server Component)
async function JobsPage() {
  const jobs = await getJobs(); // DAL call
  return <JobList jobs={jobs} />; // Client Component
}
```

### 1.5 Server Actions vs Route Handlers

**Server Actions** (preferred for mutations from UI):
- Profile updates
- Resume analysis trigger
- Application status changes
- Job CRUD (recruiter)
- Interview session management
- DSA answer submission
- Notification read/dismiss
- Admin moderation actions

**Route Handlers** (for API endpoints):
- `POST /api/upload/resume` — File upload (multipart form data)
- `GET /api/jobs` — Public job listing API (pagination, filters)
- `POST /api/webhooks/*` — External service webhooks
- `POST /api/cron/jobs` — Cron-triggered job sync
- `GET /api/auth/[...nextauth]` — Auth.js routes

### 1.6 Service Layer Architecture

Services encapsulate business logic and are called by Server Actions and Route Handlers. Services never import React or client-side code.

```
Server Action / Route Handler
    → Validates input (Zod)
    → Checks authorization
    → Calls Service function
        → Service orchestrates logic
        → Calls DAL for database operations
        → Calls AI Service for AI operations
        → Calls external APIs via adapters
    → Returns result
```

---

## 2. Database

### 2.1 PostgreSQL Architecture

- **Single PostgreSQL instance** for development and staging
- **Managed PostgreSQL** (e.g., Supabase, Neon, or Railway) for production
- **Connection pooling** via Prisma's built-in connection pool (or PgBouncer for production)
- **Schema**: Single `public` schema

### 2.2 Prisma Strategy

- **Prisma Client** singleton in `src/lib/prisma.ts`
- **Schema file**: `prisma/schema.prisma`
- **Migrations**: Generated via `prisma migrate dev`, applied via `prisma migrate deploy`
- **Seeding**: `prisma/seed.ts` for development data (admin user, sample jobs, DSA topics)
- **Type generation**: Prisma generates TypeScript types, used throughout the app

### 2.3 Complete Entity/Model Relationships

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ───

enum Role {
  STUDENT
  RECRUITER
  ADMIN
}

enum WorkMode {
  REMOTE
  HYBRID
  ONSITE
}

enum EmploymentType {
  FULL_TIME
  PART_TIME
  CONTRACT
  INTERNSHIP
}

enum ExperienceLevel {
  FRESHER
  JUNIOR
  MID
  SENIOR
  LEAD
}

enum ApplicationStatus {
  SAVED
  APPLIED
  SHORTLISTED
  INTERVIEW
  OFFER
  REJECTED
}

enum SkillProficiency {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

enum SkillCategory {
  PROGRAMMING_LANGUAGE
  FRAMEWORK
  LIBRARY
  DATABASE
  CLOUD
  TOOL
  SOFT_SKILL
  OTHER
}

enum DSADifficulty {
  EASY
  MEDIUM
  HARD
}

enum DSAStatus {
  NOT_ATTEMPTED
  ATTEMPTED
  SOLVED
  INCORRECT
}

enum InterviewType {
  RESUME_BASED
  JOB_BASED
  MOCK
}

enum InterviewStatus {
  SETUP
  IN_PROGRESS
  COMPLETED
  ABANDONED
}

enum QuestionCategory {
  TECHNICAL
  PROJECT
  BEHAVIORAL
  HR
  ROLE_SPECIFIC
  SYSTEM_DESIGN
}

enum NotificationType {
  RESUME_ANALYSIS
  NEW_JOB_MATCH
  APPLICATION_STATUS
  INTERVIEW_SCHEDULED
  INTERVIEW_REMINDER
  SKILL_GAP_UPDATE
  DSA_PROGRESS
  SYSTEM
}

enum JobStatus {
  DRAFT
  ACTIVE
  CLOSED
  EXPIRED
}

// ─── MODELS ───

model User {
  id             String    @id @default(cuid())
  email          String    @unique
  emailVerified  DateTime?
  passwordHash   String?
  name           String
  image          String?
  role           Role      @default(STUDENT)
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime? // Soft delete

  profile        Profile?
  resumes        Resume[]
  applications   Application[]
  savedJobs      SavedJob[]
  dsaProgress    DSAProgress[]
  interviewSessions InterviewSession[]
  notifications  Notification[]
  aiConversations AIConversation[]
  userSkills     UserSkill[]
  accounts       Account[]   // Auth.js
  sessions       Session[]   // Auth.js

  // Recruiter relations
  company        Company?    @relation("CompanyRecruiter")
  postedJobs     Job[]       @relation("JobPoster")

  @@index([email])
  @@index([role])
  @@index([isActive])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Profile {
  id               String          @id @default(cuid())
  userId           String          @unique
  phone            String?
  location         String?
  city             String?
  state            String?
  country          String?
  linkedinUrl      String?
  githubUrl        String?
  portfolioUrl     String?
  bio              String?         @db.Text
  targetRole       String?
  experienceLevel  ExperienceLevel?
  preferredWorkMode WorkMode?
  preferredLocations String[]      // Array of preferred locations
  expectedSalaryMin  Int?
  expectedSalaryMax  Int?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model Company {
  id          String    @id @default(cuid())
  name        String
  description String?   @db.Text
  website     String?
  logoUrl     String?
  industry    String?
  size        String?   // e.g., "11-50", "51-200"
  location    String?
  isVerified  Boolean   @default(false)
  recruiterId String    @unique
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  recruiter   User      @relation("CompanyRecruiter", fields: [recruiterId], references: [id])
  jobs        Job[]

  @@index([name])
  @@index([recruiterId])
}

model JobSource {
  id          String   @id @default(cuid())
  name        String   @unique // e.g., "adzuna", "remotive", "recruiter"
  type        String   // "api", "feed", "recruiter", "ats"
  baseUrl     String?
  isActive    Boolean  @default(true)
  config      Json?    // Source-specific configuration
  lastSyncAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  jobs        Job[]

  @@index([name])
  @@index([isActive])
}

model Job {
  id               String         @id @default(cuid())
  title            String
  description      String         @db.Text
  companyId        String?
  companyName      String         // Denormalized for external jobs
  location         String?
  workMode         WorkMode?
  employmentType   EmploymentType?
  experienceLevel  ExperienceLevel?
  salaryMin        Int?
  salaryMax        Int?
  salaryCurrency   String?        @default("INR")
  sourceId         String
  externalJobId    String?        // ID from external source
  applicationUrl   String?        // Original application URL
  postedAt         DateTime?
  expiresAt        DateTime?
  status           JobStatus      @default(ACTIVE)
  posterId         String?        // Recruiter who posted (if internal)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  deletedAt        DateTime?

  company          Company?       @relation(fields: [companyId], references: [id])
  source           JobSource      @relation(fields: [sourceId], references: [id])
  poster           User?          @relation("JobPoster", fields: [posterId], references: [id])
  jobSkills        JobSkill[]
  applications     Application[]
  savedBy          SavedJob[]
  interviewSessions InterviewSession[]

  @@unique([sourceId, externalJobId]) // Prevent duplicate imports
  @@index([title])
  @@index([status])
  @@index([companyId])
  @@index([sourceId])
  @@index([posterId])
  @@index([experienceLevel])
  @@index([workMode])
  @@index([postedAt])
  @@index([createdAt])
}

model Skill {
  id          String        @id @default(cuid())
  name        String        @unique
  normalizedName String     @unique // lowercase, trimmed
  category    SkillCategory @default(OTHER)
  createdAt   DateTime      @default(now())

  userSkills  UserSkill[]
  jobSkills   JobSkill[]

  @@index([normalizedName])
  @@index([category])
}

model UserSkill {
  id          String           @id @default(cuid())
  userId      String
  skillId     String
  proficiency SkillProficiency @default(INTERMEDIATE)
  source      String           @default("resume") // "resume", "manual", "assessment"
  createdAt   DateTime         @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  skill Skill @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@unique([userId, skillId])
  @@index([userId])
  @@index([skillId])
}

model JobSkill {
  id         String  @id @default(cuid())
  jobId      String
  skillId    String
  isRequired Boolean @default(true) // true = required, false = preferred

  job   Job   @relation(fields: [jobId], references: [id], onDelete: Cascade)
  skill Skill @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@unique([jobId, skillId])
  @@index([jobId])
  @@index([skillId])
}

model Resume {
  id            String          @id @default(cuid())
  userId        String
  fileName      String
  fileUrl       String          // S3 URL
  fileSize      Int
  mimeType      String
  rawText       String?         @db.Text
  parsedData    Json?           // Structured parsed resume data
  isActive      Boolean         @default(true) // Only one active per user
  version       Int             @default(1)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  analysis      ResumeAnalysis?

  @@index([userId])
  @@index([userId, isActive])
}

model ResumeAnalysis {
  id                  String   @id @default(cuid())
  resumeId            String   @unique
  overallScore        Int      // 0-100
  atsScore            Int      // 0-100
  strengths           Json     // string[]
  weaknesses          Json     // string[]
  suggestions         Json     // { section, current, suggested, reason }[]
  atsBreakdown        Json     // { sectionCompleteness, keywordDensity, formatting, actionVerbs }
  extractedSkills     Json     // string[]
  sectionAnalysis     Json     // Per-section analysis
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  resume              Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)

  @@index([resumeId])
}

model Application {
  id              String            @id @default(cuid())
  userId          String
  jobId           String
  status          ApplicationStatus @default(SAVED)
  notes           String?           @db.Text
  interviewDate   DateTime?
  appliedAt       DateTime?
  statusHistory   Json?             // { status, timestamp }[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  job  Job  @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@unique([userId, jobId])
  @@index([userId])
  @@index([jobId])
  @@index([status])
  @@index([userId, status])
}

model SavedJob {
  id        String   @id @default(cuid())
  userId    String
  jobId     String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  job  Job  @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@unique([userId, jobId])
  @@index([userId])
}

model DSAQuestion {
  id               String        @id @default(cuid())
  title            String
  problemStatement String        @db.Text
  topic            String        // e.g., "arrays", "dynamic_programming"
  difficulty       DSADifficulty
  hints            Json          // string[]
  expectedApproach String?       @db.Text
  solution         String?       @db.Text
  timeComplexity   String?
  spaceComplexity  String?
  relatedConcepts  Json?         // string[]
  tags             String[]
  isGenerated      Boolean       @default(true) // AI-generated vs seeded
  createdAt        DateTime      @default(now())

  progress         DSAProgress[]

  @@index([topic])
  @@index([difficulty])
  @@index([topic, difficulty])
}

model DSAProgress {
  id           String    @id @default(cuid())
  userId       String
  questionId   String
  status       DSAStatus @default(NOT_ATTEMPTED)
  userApproach String?   @db.Text
  attempts     Int       @default(0)
  solvedAt     DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user     User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  question DSAQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([userId, questionId])
  @@index([userId])
  @@index([userId, status])
}

model InterviewSession {
  id              String          @id @default(cuid())
  userId          String
  jobId           String?         // Optional: for job-based interviews
  type            InterviewType
  status          InterviewStatus @default(SETUP)
  config          Json?           // { questionCount, categories, difficulty }
  overallScore    Int?
  technicalScore  Int?
  communicationScore Int?
  feedback        Json?           // { strengths, weaknesses, suggestions }
  startedAt       DateTime?
  completedAt     DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  user      User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  job       Job?                @relation(fields: [jobId], references: [id])
  questions InterviewQuestion[]

  @@index([userId])
  @@index([userId, type])
  @@index([status])
}

model InterviewQuestion {
  id          String           @id @default(cuid())
  sessionId   String
  content     String           @db.Text
  category    QuestionCategory
  difficulty  String?          // "easy", "medium", "hard"
  orderIndex  Int
  createdAt   DateTime         @default(now())

  session     InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  answer      InterviewAnswer?
  followUps   FollowUpQuestion[]

  @@index([sessionId])
  @@index([sessionId, orderIndex])
}

model InterviewAnswer {
  id          String            @id @default(cuid())
  questionId  String            @unique
  content     String            @db.Text
  evaluation  Json?             // { correctness, depth, clarity, relevance, completeness, score }
  createdAt   DateTime          @default(now())

  question    InterviewQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@index([questionId])
}

model FollowUpQuestion {
  id               String            @id @default(cuid())
  parentQuestionId String
  content          String            @db.Text
  answer           String?           @db.Text
  evaluation       Json?
  orderIndex       Int
  createdAt        DateTime          @default(now())

  parentQuestion   InterviewQuestion @relation(fields: [parentQuestionId], references: [id], onDelete: Cascade)

  @@index([parentQuestionId])
}

model InterviewFeedback {
  id              String   @id @default(cuid())
  sessionId       String   @unique
  overallScore    Int      // 0-100
  technicalScore  Int      // 0-100
  communicationScore Int   // 0-100
  strengths       Json     // string[]
  weaknesses      Json     // string[]
  suggestions     Json     // string[]
  detailedFeedback String? @db.Text
  createdAt       DateTime @default(now())

  @@index([sessionId])
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  message   String           @db.Text
  data      Json?            // { jobId, applicationId, etc. }
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, isRead])
  @@index([createdAt])
}

model AIConversation {
  id        String      @id @default(cuid())
  userId    String
  title     String?
  context   Json?       // { resumeId, jobId, etc. }
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  user     User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages AIMessage[]

  @@index([userId])
}

model AIMessage {
  id             String         @id @default(cuid())
  conversationId String
  role           String         // "user" | "assistant" | "system"
  content        String         @db.Text
  metadata       Json?          // { model, tokens, latency }
  createdAt      DateTime       @default(now())

  conversation   AIConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId])
  @@index([conversationId, createdAt])
}
```

### 2.4 Indexing Strategy

Indexes are defined inline in the schema above. Key indexing decisions:

| Table | Index | Rationale |
|-------|-------|-----------|
| `User` | `email` | Login lookup |
| `User` | `role` | Role-based queries |
| `Job` | `status, postedAt` | Active job listing sorted by date |
| `Job` | `sourceId, externalJobId` | Unique constraint for deduplication |
| `Job` | `experienceLevel, workMode` | Filter queries |
| `Application` | `userId, status` | Dashboard queries per user per status |
| `Notification` | `userId, isRead` | Unread notifications per user |
| `DSAProgress` | `userId, status` | Progress dashboard |
| `InterviewSession` | `userId, type` | Session history per user |
| `Skill` | `normalizedName` | Skill lookup for matching |

### 2.5 Soft Delete Strategy

Soft deletes (via `deletedAt` field) are used for:
- `User` — Users can be deactivated by admin
- `Company` — Companies can be removed but history preserved
- `Job` — Jobs can be closed/removed but applications reference them

All DAL queries must filter `deletedAt IS NULL` by default. A helper function `withSoftDelete()` wraps Prisma `where` clauses.

### 2.6 Migration Strategy

1. **Development**: `npx prisma migrate dev --name <description>`
2. **Production**: `npx prisma migrate deploy` (in CI/CD pipeline)
3. **Naming convention**: `YYYYMMDD_description` (e.g., `20240901_initial_schema`)
4. **Destructive changes**: Always create a new migration, never edit existing ones
5. **Data migrations**: Separate scripts in `prisma/data-migrations/`

### 2.7 Seed Strategy

```
prisma/seed.ts
├── Create admin user (from env vars)
├── Create sample job sources (recruiter, adzuna, remotive)
├── Create DSA topics with seed questions
├── Create sample skills (common tech skills)
└── (Dev only) Create sample students, recruiters, jobs
```

---

## 3. Authentication & Authorization

### 3.1 Auth.js Strategy

- **Provider**: Auth.js v5 (NextAuth v5) with App Router
- **Providers**: Credentials (email/password) + Google OAuth
- **Session strategy**: JWT (stateless, Vercel-friendly)
- **Password hashing**: bcrypt (12 rounds)

### 3.2 Authentication Flow

```
Registration:
  Form → Validate (Zod) → Check email unique → Hash password → Create User → Create Profile → Auto login → Redirect to dashboard

Login (Credentials):
  Form → Validate → Verify password → Create JWT session → Redirect based on role

Login (Google):
  Google OAuth → Auth.js callback → Find/create user → Create JWT session → Redirect

Logout:
  Clear session → Redirect to landing page

Forgot Password:
  Email form → Generate reset token → Send email → User clicks link → New password form → Update password hash
```

### 3.3 Session Handling

```typescript
// JWT payload
{
  sub: userId,
  email: string,
  name: string,
  role: Role,        // STUDENT | RECRUITER | ADMIN
  image?: string,
}
```

- Session accessible in Server Components via `auth()` from Auth.js
- Session accessible in Client Components via `useSession()` from Auth.js React provider
- Session refreshed automatically by Auth.js

### 3.4 Role-Based Access Control

| Resource | Student | Recruiter | Admin |
|----------|---------|-----------|-------|
| Public pages | ✓ | ✓ | ✓ |
| Own profile | ✓ | ✓ | ✓ |
| Own resume | ✓ | ✗ | ✗ |
| Job listing | ✓ | ✓ | ✓ |
| Job matching | ✓ | ✗ | ✗ |
| Save/apply jobs | ✓ | ✗ | ✗ |
| Application tracker | ✓ | ✗ | ✗ |
| Interview prep | ✓ | ✗ | ✗ |
| DSA practice | ✓ | ✗ | ✗ |
| AI assistant | ✓ | ✗ | ✗ |
| Post jobs | ✗ | ✓ | ✓ |
| Edit own jobs | ✗ | ✓ | ✓ |
| View applicants | ✗ | ✓ | ✓ |
| Candidate search | ✗ | ✓ | ✓ |
| Shortlist/reject | ✗ | ✓ | ✓ |
| Manage all users | ✗ | ✗ | ✓ |
| Manage all jobs | ✗ | ✗ | ✓ |
| Manage companies | ✗ | ✗ | ✓ |
| Platform analytics | ✗ | ✗ | ✓ |

### 3.5 Protected Routes & Middleware

```typescript
// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/", "/jobs", "/jobs/:id", "/login", "/register", "/forgot-password"];
const studentRoutes = ["/dashboard", "/profile", "/resume", "/applications", "/skill-gap", "/dsa", "/interview", "/ai-assistant", "/notifications"];
const recruiterRoutes = ["/recruiter"];
const adminRoutes = ["/admin"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes — always accessible
  if (isPublicRoute(pathname)) return NextResponse.next();

  // Not authenticated — redirect to login
  if (!session) return redirectToLogin(req);

  // Role-based route protection
  if (isStudentRoute(pathname) && session.user.role !== "STUDENT")
    return redirectToDashboard(session.user.role);
  if (isRecruiterRoute(pathname) && session.user.role !== "RECRUITER")
    return redirectToDashboard(session.user.role);
  if (isAdminRoute(pathname) && session.user.role !== "ADMIN")
    return redirectToDashboard(session.user.role);

  return NextResponse.next();
});
```

---

## 4. Resume System

### 4.1 Resume Upload Pipeline

```
Client: Select file
  → Client-side validation (type, size)
  → Upload to /api/upload/resume (multipart/form-data)
  → Server validates (MIME type, size, magic bytes)
  → Generate unique filename (userId_timestamp_hash.pdf)
  → Upload to S3
  → Create Resume record in DB (isActive: true, deactivate previous)
  → Extract text (pdf-parse library)
  → Store raw text in DB
  → Trigger AI parsing (Server Action)
  → AI extracts structured data
  → Store parsedData JSON in DB
  → Trigger AI analysis
  → Generate scores, strengths, weaknesses, suggestions
  → Store ResumeAnalysis in DB
  → Create UserSkill records from extracted skills
  → Send notification: "Resume analysis completed"
  → Return success response
```

### 4.2 File Validation

```typescript
const RESUME_CONSTRAINTS = {
  maxSize: 5 * 1024 * 1024,        // 5MB
  allowedMimeTypes: ["application/pdf"],
  allowedExtensions: [".pdf"],
  magicBytes: {
    pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  },
};
```

Server-side validation:
1. Check `Content-Type` header
2. Check file extension
3. Check file size
4. Verify magic bytes (first 4 bytes match PDF signature)
5. Attempt text extraction (rejects corrupted/password-protected PDFs)

### 4.3 Storage Strategy

- **Service**: AWS S3 or S3-compatible (MinIO for local dev, Cloudflare R2 for production alternative)
- **Bucket structure**: `jobfit-resumes/{userId}/{filename}`
- **Access**: Private bucket. Files accessed only via signed URLs (expiry: 1 hour)
- **Deletion**: Old resume files retained for 30 days after replacement, then purged
- **SDK**: `@aws-sdk/client-s3` with `@aws-sdk/s3-request-presigner`

### 4.4 Resume Parsing

**Text Extraction**: `pdf-parse` library extracts raw text from PDF.

**AI Parsing**: AI service receives raw text and returns structured JSON:

```typescript
interface ParsedResume {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  summary: string | null;
  education: Array<{
    degree: string;
    field: string;
    institution: string;
    year: string;
    gpa: string | null;
  }>;
  skills: {
    programmingLanguages: string[];
    frameworks: string[];
    libraries: string[];
    databases: string[];
    cloudTechnologies: string[];
    tools: string[];
    other: string[];
  };
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    description: string[];
  }>;
  internships: Array<{
    company: string;
    role: string;
    duration: string;
    description: string[];
  }>;
  projects: Array<{
    name: string;
    techStack: string[];
    description: string[];
    url: string | null;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string | null;
  }>;
  achievements: string[];
}
```

### 4.5 Resume Versioning

- Each upload creates a new `Resume` record with incremented `version`
- Only one resume is `isActive: true` per user at a time
- Previous resumes have `isActive: false` but are retained
- `ResumeAnalysis` is linked 1:1 to each `Resume` record
- `UserSkill` records are updated (not replaced) on re-upload

### 4.6 Resume Security

- Files stored in private S3 bucket
- Access via short-lived signed URLs only
- Users can only access their own resumes (enforced in DAL)
- Resume text and parsed data stored in DB, accessible only by owner
- Admin cannot view resume files (only metadata)

---

## 5. Jobs

### 5.1 Job Aggregation Architecture

```
                    ┌─────────────────────┐
                    │   Job Aggregator     │
                    │   (Orchestrator)     │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
  ┌───────▼──────┐   ┌───────▼──────┐   ┌─────────▼────────┐
  │ Recruiter    │   │ Adzuna       │   │ Remotive         │
  │ Adapter      │   │ Adapter      │   │ Adapter          │
  └───────┬──────┘   └───────┬──────┘   └─────────┬────────┘
          │                    │                     │
          └────────────────────┼─────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Job Normalizer    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Job Deduplicator  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Skill Extractor   │
                    │   (for JobSkills)   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │    Database (Job)    │
                    └─────────────────────┘
```

### 5.2 Source Adapter Pattern

```typescript
// src/services/jobs/adapters/base-adapter.ts
interface RawJob {
  externalId: string;
  title: string;
  company: string;
  description: string;
  location?: string;
  workMode?: WorkMode;
  employmentType?: EmploymentType;
  experienceLevel?: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  applicationUrl?: string;
  postedAt?: Date;
  expiresAt?: Date;
}

abstract class BaseJobAdapter {
  abstract readonly sourceName: string;
  abstract fetchJobs(options?: FetchOptions): Promise<RawJob[]>;
  abstract isAvailable(): Promise<boolean>;
}
```

Each source implements `BaseJobAdapter`:
- `RecruiterAdapter` — reads from internal DB (recruiter-posted jobs)
- `AdzunaAdapter` — calls Adzuna API with API key
- `RemotiveAdapter` — calls Remotive public API
- `RSSAdapter` — parses RSS/Atom feeds

### 5.3 Authorized API/Feed Strategy

| Source | Type | Auth | Priority |
|--------|------|------|----------|
| Internal (Recruiter) | Database | N/A | P0 |
| Adzuna | REST API | API Key | P1 |
| Remotive | REST API | Public | P1 |
| The Muse | REST API | API Key | P2 |
| GitHub Jobs (if available) | REST API | Public | P2 |
| RSS Feeds | RSS/Atom | Public | P2 |

### 5.4 Job Normalization

All raw jobs are normalized to the standard `Job` schema:
- Title: trimmed, title-cased
- Company: matched against existing `Company` records or stored as `companyName` string
- Location: standardized format "City, State, Country"
- Skills: extracted from description via keyword matching + AI assistance
- Salary: normalized to annual INR (with currency field)
- Work mode: inferred from keywords if not explicit ("remote", "hybrid", "onsite")

### 5.5 Deduplication

```typescript
// Deduplication hash: lowercase(title) + lowercase(company) + sourceId
function generateJobHash(job: NormalizedJob): string {
  const key = `${job.title.toLowerCase()}_${job.companyName.toLowerCase()}_${job.sourceId}`;
  return createHash("sha256").update(key).digest("hex");
}
```

Cross-source deduplication uses fuzzy title + company matching (Levenshtein distance ≤ 3).

### 5.6 Refresh/Sync Strategy

- **Recruiter jobs**: Real-time (created immediately when recruiter posts)
- **External sources**: Periodic sync via cron job endpoint `/api/cron/jobs`
  - Adzuna: Every 6 hours
  - Remotive: Every 12 hours
  - RSS feeds: Every 4 hours
- **Expired jobs**: Jobs past `expiresAt` are marked `EXPIRED` during sync
- **Error handling**: If a source fails, log error, skip that source, continue with others

---

## 6. Matching

### 6.1 Deterministic Job Matching Algorithm

The matching engine calculates a score from 0 to 100 for each user-job pair.

#### Weight Configuration (default, configurable)

```typescript
// src/config/matching-weights.ts
export const MATCHING_WEIGHTS = {
  skills: 0.70,       // 70%
  experience: 0.15,   // 15%
  education: 0.05,    // 5%
  other: 0.10,        // 10% (location, work mode, role fit)
};
```

#### Skills Matching (70% of total)

```typescript
function calculateSkillScore(userSkills: string[], job: Job): number {
  const requiredSkills = job.requiredSkills; // normalized
  const preferredSkills = job.preferredSkills; // normalized

  const requiredMatches = intersection(userSkills, requiredSkills).length;
  const preferredMatches = intersection(userSkills, preferredSkills).length;

  // Required skills: weighted 80% of skill score
  const requiredScore = requiredSkills.length > 0
    ? (requiredMatches / requiredSkills.length) * 0.8
    : 0.8; // If no required skills listed, give full required score

  // Preferred skills: weighted 20% of skill score
  const preferredScore = preferredSkills.length > 0
    ? (preferredMatches / preferredSkills.length) * 0.2
    : 0;

  return (requiredScore + preferredScore) * 100;
}
```

Skill matching uses **normalized names** (lowercase, trimmed). Common aliases are resolved:
- "js" → "javascript"
- "ts" → "typescript"
- "postgres" → "postgresql"
- "react.js" → "react"
- "node" → "node.js"

#### Experience Matching (15% of total)

```typescript
function calculateExperienceScore(userLevel: ExperienceLevel, jobLevel: ExperienceLevel): number {
  const levels = { FRESHER: 0, JUNIOR: 1, MID: 2, SENIOR: 3, LEAD: 4 };
  const userIdx = levels[userLevel];
  const jobIdx = levels[jobLevel];
  const diff = Math.abs(userIdx - jobIdx);

  if (diff === 0) return 100;
  if (diff === 1) return 70;
  if (diff === 2) return 30;
  return 0;
}
```

#### Education Matching (5% of total)

- If job has no education requirement: 100
- If user's degree field matches job domain: 100
- If user has a degree but field doesn't match: 60
- If no education data on resume: 30

#### Other Factors (10% of total)

```typescript
function calculateOtherScore(user: Profile, job: Job): number {
  let score = 0;

  // Location match (40% of other)
  if (!job.location || user.preferredLocations?.includes(job.location)) score += 40;
  else score += 10; // Partial credit

  // Work mode match (40% of other)
  if (!job.workMode || user.preferredWorkMode === job.workMode || !user.preferredWorkMode) score += 40;
  else score += 10;

  // Role/title alignment (20% of other)
  if (user.targetRole && job.title.toLowerCase().includes(user.targetRole.toLowerCase())) score += 20;
  else score += 5;

  return score;
}
```

#### Final Score

```typescript
function calculateMatchScore(user: UserWithProfile, job: JobWithSkills): MatchResult {
  const skillScore = calculateSkillScore(user.skills, job);
  const experienceScore = calculateExperienceScore(user.experienceLevel, job.experienceLevel);
  const educationScore = calculateEducationScore(user.education, job);
  const otherScore = calculateOtherScore(user.profile, job);

  const totalScore = Math.round(
    skillScore * MATCHING_WEIGHTS.skills +
    experienceScore * MATCHING_WEIGHTS.experience +
    educationScore * MATCHING_WEIGHTS.education +
    otherScore * MATCHING_WEIGHTS.other
  );

  return {
    score: totalScore,
    breakdown: {
      skills: Math.round(skillScore),
      experience: Math.round(experienceScore),
      education: Math.round(educationScore),
      other: Math.round(otherScore),
    },
    matchedSkills: intersection(user.skills, job.requiredSkills.concat(job.preferredSkills)),
    missingSkills: difference(job.requiredSkills, user.skills),
  };
}
```

### 6.2 Top 10 Selection

1. Fetch all `ACTIVE` jobs
2. Calculate match score for each job against user
3. Sort by score descending
4. Return top 10
5. Cache result per user (invalidate on resume update or new jobs)

### 6.3 Optional Semantic Enhancement

For future enhancement, AI can be used to:
- Improve skill synonym resolution (beyond hardcoded aliases)
- Detect implicit skill matches (user has "built REST APIs" → matches "API Development")
- Score project relevance to job description

This is optional and additive — it adjusts the deterministic score, not replaces it.

---

## 7. Skill Gap

### 7.1 Skill Gap Analysis

```typescript
interface SkillGapResult {
  overallReadiness: number; // 0-100
  skills: Array<{
    name: string;
    userLevel: "strong" | "good" | "needs_improvement" | "missing";
    requiredLevel: "required" | "preferred";
    priority: "high" | "medium" | "low";
  }>;
  learningRoadmap: Array<{
    skill: string;
    priority: "high" | "medium" | "low";
    estimatedTime: string;
    resources: string[];
  }>;
}
```

### 7.2 Categorization Logic

- **Strong**: User has skill, proficiency >= ADVANCED, skill is required
- **Good**: User has skill, proficiency >= INTERMEDIATE
- **Needs Improvement**: User has skill, proficiency <= BEGINNER
- **Missing**: User does not have skill at all

### 7.3 Priority Logic

- **High**: Skill is required and user is Missing or Needs Improvement
- **Medium**: Skill is required and user is Good (but could improve), or preferred and Missing
- **Low**: Skill is preferred and user has partial proficiency

### 7.4 Learning Recommendations

AI generates personalized learning roadmap items based on:
- The missing/weak skills
- The user's current skill level
- The target role
- Estimated learning time

---

## 8. AI

### 8.1 AI Service Abstraction

```typescript
// src/services/ai/ai-client.ts

interface AIClient {
  generateStructuredOutput<T>(params: {
    prompt: string;
    systemPrompt: string;
    schema: z.ZodSchema<T>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<T>;

  generateText(params: {
    prompt: string;
    systemPrompt: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string>;

  chat(params: {
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string>;
}
```

**Implementation**: Two concrete implementations:
- `OpenAIClient` — uses OpenAI SDK (`openai`)
- `GeminiClient` — uses Google Generative AI SDK (`@google/generative-ai`)

Selected via `AI_PROVIDER` environment variable. Default: OpenAI.

### 8.2 Prompt Organization

All prompts live in `src/services/ai/prompts/`:

```typescript
// src/services/ai/prompts/resume-analysis.ts
export const RESUME_ANALYSIS_SYSTEM_PROMPT = `
You are a professional resume analyst. Analyze the provided resume text and return a structured assessment.

RULES:
- Never fabricate skills, experience, projects, certifications, or education.
- All analysis must be based solely on information present in the resume.
- Be specific and actionable in suggestions.
- Score from 0-100 based on concrete criteria.
`;

export function buildResumeAnalysisPrompt(resumeText: string): string {
  return `Analyze the following resume:\n\n${resumeText}`;
}
```

### 8.3 Structured Outputs

All AI responses are validated against Zod schemas:

```typescript
const resumeAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  atsScore: z.number().min(0).max(100),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()).min(1),
  suggestions: z.array(z.object({
    section: z.string(),
    current: z.string(),
    suggested: z.string(),
    reason: z.string(),
  })),
  // ...
});
```

If AI output fails validation, retry once with error context. If retry fails, return error to user.

### 8.4 Error Handling & Rate Limits

- **Rate limiting**: Track API calls per user per hour. Default: 30 AI calls/hour per user.
- **Token budget**: Cap total tokens per request (e.g., 4000 input + 2000 output).
- **Timeouts**: 30-second timeout per AI call.
- **Retry**: Retry once on 429 (rate limit) or 500 (server error) with exponential backoff.
- **Fallback**: If AI fails after retry, return graceful error message (not crash).
- **Cost tracking**: Log token usage per request (model, input tokens, output tokens) for cost monitoring.

### 8.5 Avoiding Unnecessary AI Calls

- Cache resume analysis results. Only re-analyze on resume update.
- Cache interview questions per session. Don't regenerate on page refresh.
- DSA questions: Generate in batches (10 at a time), not per request.
- Skill gap roadmap: Cache per user+job pair.
- AI assistant: Use conversation history, don't re-process from scratch.

---

## 9. DSA

### 9.1 Question Data Model

See `DSAQuestion` in Prisma schema. Key fields:
- `topic`: String matching one of the 18 defined topics
- `difficulty`: EASY | MEDIUM | HARD
- `problemStatement`: Full problem description
- `hints`: JSON array of progressive hints
- `expectedApproach`: Ideal solution approach
- `solution`: Complete solution with explanation
- `timeComplexity`, `spaceComplexity`: Big-O notation strings
- `relatedConcepts`: Related DSA topics

### 9.2 Topic/Difficulty Structure

```typescript
// src/config/dsa-topics.ts
export const DSA_TOPICS = [
  { id: "arrays", name: "Arrays", order: 1 },
  { id: "strings", name: "Strings", order: 2 },
  { id: "linked_list", name: "Linked List", order: 3 },
  { id: "stack", name: "Stack", order: 4 },
  { id: "queue", name: "Queue", order: 5 },
  { id: "hashing", name: "Hashing", order: 6 },
  { id: "recursion", name: "Recursion", order: 7 },
  { id: "trees", name: "Trees", order: 8 },
  { id: "bst", name: "BST", order: 9 },
  { id: "heap", name: "Heap", order: 10 },
  { id: "graph", name: "Graph", order: 11 },
  { id: "dynamic_programming", name: "Dynamic Programming", order: 12 },
  { id: "greedy", name: "Greedy", order: 13 },
  { id: "binary_search", name: "Binary Search", order: 14 },
  { id: "sorting", name: "Sorting", order: 15 },
  { id: "sliding_window", name: "Sliding Window", order: 16 },
  { id: "two_pointers", name: "Two Pointers", order: 17 },
  { id: "backtracking", name: "Backtracking", order: 18 },
] as const;
```

### 9.3 Personalized Question Selection

1. Determine user's target role and experience level from profile
2. Identify skill gaps from skill gap analysis
3. Prioritize topics that appear most frequently in target jobs
4. Start with Easy difficulty, progress to Medium/Hard based on solve rate
5. AI generates questions tailored to user's specific context

### 9.4 Progress Tracking

```typescript
interface DSAProgressSummary {
  totalQuestions: number;
  solved: number;
  attempted: number;
  incorrect: number;
  topicProgress: Array<{
    topic: string;
    total: number;
    solved: number;
    percentage: number;
  }>;
  difficultyProgress: Array<{
    difficulty: DSADifficulty;
    total: number;
    solved: number;
    percentage: number;
  }>;
}
```

---

## 10. Interview

### 10.1 Interview Session State Machine

```
SETUP → IN_PROGRESS → COMPLETED
  │                       ↑
  └── ABANDONED ──────────┘ (can't transition back)
```

```typescript
const VALID_TRANSITIONS: Record<InterviewStatus, InterviewStatus[]> = {
  SETUP: ["IN_PROGRESS", "ABANDONED"],
  IN_PROGRESS: ["COMPLETED", "ABANDONED"],
  COMPLETED: [],        // Terminal state
  ABANDONED: [],         // Terminal state
};
```

### 10.2 Question Generation

**Resume-Based**:
```
Input: ParsedResume
→ AI generates questions from skills, projects, experience, certifications
→ Categorizes each question (Technical, Project, Behavioral, HR, Role-Specific, System Design)
→ Assigns difficulty
→ Returns ordered list of questions
```

**Job-Based**:
```
Input: Job (title, description, required skills, preferred skills)
→ AI generates questions targeting job requirements
→ Categories weighted toward Technical and Role-Specific
→ Returns ordered list of questions
```

### 10.3 Dynamic Follow-up Logic

```
1. AI asks question Q1
2. User provides answer A1
3. AI evaluates A1 for: correctness, depth, clarity, relevance, completeness
4. Based on evaluation:
   - If answer is shallow → AI asks for deeper explanation
   - If answer mentions a technology → AI asks about trade-offs
   - If answer is incorrect → AI probes understanding
   - If answer is strong → AI asks a harder related question
5. Follow-up depth: max 3 levels per question
6. After max depth, move to next main question
```

### 10.4 Mock Interview Architecture

```
1. User selects job + interview type
2. System creates InterviewSession (SETUP)
3. AI generates 8-12 questions based on resume + job
4. Session transitions to IN_PROGRESS
5. For each question:
   a. Display question
   b. User types/speaks answer
   c. AI evaluates answer
   d. AI generates 0-2 follow-ups
   e. User answers follow-ups
6. After all questions:
   a. Session transitions to COMPLETED
   b. AI generates comprehensive feedback
   c. Store InterviewFeedback
   d. Display report
```

### 10.5 Feedback Structure

```typescript
interface InterviewFeedback {
  overallScore: number;      // 0-100
  technicalScore: number;    // 0-100
  communicationScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  questionBreakdown: Array<{
    question: string;
    score: number;
    evaluation: string;
  }>;
}
```

---

## 11. Applications

### 11.1 Application Lifecycle

```
         ┌──────────────────────────────────────────┐
         │                                          │
  SAVED ──→ APPLIED ──→ SHORTLISTED ──→ INTERVIEW ──→ OFFER
                │              │            │
                └──────────────┴────────────┴───→ REJECTED
```

Rules:
- Users can transition forward or to REJECTED from any state after SAVED
- Status history is tracked in `statusHistory` JSON field
- Each transition records timestamp

### 11.2 Application Tracker Features

- **Notes**: Free-text notes per application
- **Interview Date**: Optional date+time for scheduled interviews
- **Timeline**: Status history with timestamps
- **Dashboard Analytics**: Count per status, activity trend chart

---

## 12. Recruiter

### 12.1 Recruiter Dashboard

- Active jobs count
- Total applicants
- Shortlisted count
- Scheduled interviews
- Recent applicant activity
- Application pipeline funnel (Applied → Shortlisted → Interview → Offer)

### 12.2 Job Creation

Recruiters create jobs with:
- Title, description, location, work mode, employment type, experience level
- Salary range (optional)
- Required skills (tag input)
- Preferred skills (tag input)
- Application deadline (optional)
- External application URL (optional — if not set, application goes through JobFit's tracker)

Jobs are saved to the `Job` table with `sourceId` pointing to the "recruiter" `JobSource`.

### 12.3 Candidate Discovery

Recruiters can search candidates by:
- Skills (must-have, nice-to-have)
- Experience level
- Location
- Match score against a specific job

Results show:
- Candidate name, experience level, key skills
- Match score against the recruiter's job
- Matched and missing skills
- Actions: View profile, Shortlist, Reject

**Privacy**: Recruiters see candidate's public profile, skills, and match score. They do NOT see the full resume unless the candidate has applied.

---

## 13. Admin

### 13.1 User Management

- View all users (paginated, filterable by role, status)
- Suspend/unsuspend user (sets `isActive = false`)
- View user details (profile, not resume)
- Delete user (soft delete via `deletedAt`)

### 13.2 Company Management

- View all companies
- Verify/unverify companies
- Edit company details
- Remove company (soft delete)

### 13.3 Job Management

- View all jobs (paginated, filterable by status, source)
- Remove inappropriate job listings
- Manage job sources (enable/disable, configure)

### 13.4 Analytics

- User growth over time (line chart)
- Jobs posted per week (bar chart)
- Applications per week
- AI usage stats (calls, tokens)
- Top skills in demand
- Active user count

---

## 14. Notifications

### 14.1 In-App Notifications

Notifications are stored in the `Notification` table and fetched per user.

### 14.2 Notification Triggers

| Event | Notification Type | Recipient |
|-------|-------------------|-----------|
| Resume analysis completed | RESUME_ANALYSIS | Student |
| New job matches > 85% | NEW_JOB_MATCH | Student |
| Application status changed by recruiter | APPLICATION_STATUS | Student |
| Interview scheduled | INTERVIEW_SCHEDULED | Student |
| Interview tomorrow | INTERVIEW_REMINDER | Student |
| Skill gap analysis updated | SKILL_GAP_UPDATE | Student |
| DSA milestone reached | DSA_PROGRESS | Student |
| New applicant for job | SYSTEM | Recruiter |

### 14.3 Email-Ready Architecture

Notifications flow through a `NotificationService`:
```typescript
class NotificationService {
  async send(params: { userId: string; type: NotificationType; title: string; message: string; data?: any }) {
    // 1. Save to DB (always)
    await dal.notifications.create(params);

    // 2. Send email (if enabled, future feature)
    // if (userPreferences.emailEnabled) {
    //   await emailService.send(params);
    // }
  }
}
```

---

## 15. Security

### 15.1 Input Validation

All inputs validated with **Zod** schemas at the Server Action / Route Handler level.

```typescript
const createJobSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(50).max(10000),
  location: z.string().max(200).optional(),
  workMode: z.nativeEnum(WorkMode).optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  experienceLevel: z.nativeEnum(ExperienceLevel).optional(),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  requiredSkills: z.array(z.string().max(50)).max(20),
  preferredSkills: z.array(z.string().max(50)).max(20),
});
```

### 15.2 File Validation

- Server-side MIME type verification (magic bytes)
- Maximum file size enforcement (5MB)
- File extension whitelist (.pdf)
- Virus scanning (optional, via ClamAV in production)

### 15.3 Authorization

- Every Server Action checks session and role before proceeding
- DAL functions accept `userId` and scope queries to that user
- Recruiters can only manage their own jobs and applicants
- Admin bypasses some user-scoping for management operations

### 15.4 Rate Limiting

- AI endpoints: 30 requests/hour per user
- File upload: 5 uploads/hour per user
- Auth attempts: 5 per minute per IP
- API routes: 100 requests/minute per IP

Implementation: In-memory rate limiter using `Map<key, { count, resetAt }>` (production: Redis-based).

### 15.5 API Security

- CSRF protection via Next.js built-in (Server Actions use action tokens)
- CORS: Restrict to same-origin
- No sensitive data in URL query parameters
- Response headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`

### 15.6 AI Abuse Prevention

- Sanitize user input before passing to AI prompts (strip injection patterns)
- System prompts are hardcoded, never user-modifiable
- AI output validated against schemas (prevents unexpected content)
- Rate limit AI calls per user

### 15.7 Secrets Management

- All secrets in `.env` / `.env.local` (never committed)
- `.env.example` with placeholder values
- Vercel environment variables for production
- Required env vars validated at startup

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AI_PROVIDER=             # "openai" or "gemini"
OPENAI_API_KEY=
GEMINI_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_S3_REGION=
```

---

## 16. Reliability

### 16.1 Error Handling

```typescript
// Consistent error pattern in Server Actions
export async function updateProfile(data: ProfileInput): Promise<ActionResult<Profile>> {
  try {
    const session = await auth();
    if (!session) return { success: false, error: "Unauthorized" };

    const validated = profileSchema.safeParse(data);
    if (!validated.success) return { success: false, error: validated.error.flatten() };

    const result = await profileService.update(session.user.id, validated.data);
    return { success: true, data: result };
  } catch (error) {
    console.error("[updateProfile]", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
```

### 16.2 Logging

- **Development**: `console.log`, `console.error` with context prefixes
- **Production**: Structured JSON logging (future: Vercel Log Drain or Axiom)
- **Log levels**: ERROR, WARN, INFO, DEBUG
- **Sensitive data**: Never log user PII, API keys, or file contents

### 16.3 Retry Strategy

- AI API calls: Retry 1x with 2-second delay on 429/500
- S3 uploads: Retry 2x with exponential backoff (1s, 3s)
- External job APIs: Retry 1x, then skip source and continue

### 16.4 External API Failure Handling

- Job source failures are isolated (one source failing doesn't affect others)
- AI failures return user-friendly error messages
- S3 failures prevent upload but don't crash the app
- Auth provider failures show "Service temporarily unavailable"

---

## 17. Testing

### 17.1 Test Strategy

| Level | Tool | Target | Coverage Goal |
|-------|------|--------|---------------|
| Unit | Vitest | Services, utils, matching engine | 80%+ |
| Integration | Vitest + Prisma | DAL, Server Actions | 70%+ |
| API | Vitest + supertest | Route Handlers | 70%+ |
| Component | React Testing Library | Complex UI components | Key flows |
| E2E | Playwright | Critical user journeys | Top 5 flows |

### 17.2 Critical Tests

**Matching Algorithm** (unit):
- Skill matching with various overlap scenarios
- Experience level matching
- Edge cases: no skills, no experience, perfect match, zero match
- Top 10 ranking correctness
- Weight configuration changes

**Authentication** (integration):
- Registration with valid/invalid data
- Login with correct/incorrect credentials
- Role-based route protection
- Session handling

**Resume Pipeline** (integration):
- Upload validation (type, size, magic bytes)
- Text extraction from valid PDF
- Parsed data structure validation
- Analysis score ranges

**AI Output Validation** (unit):
- Schema validation of AI responses
- Handling of malformed AI output
- Retry on failure

**Application State Machine** (unit):
- Valid transitions
- Invalid transitions rejected
- Status history recorded

### 17.3 Test Database

- Use a separate PostgreSQL database for tests
- Reset database before each test suite (using Prisma `migrate reset`)
- Use factories for test data creation

---

## 18. Performance

### 18.1 Caching Strategy

| Data | Cache Method | TTL | Invalidation |
|------|-------------|-----|--------------|
| Top 10 matches | In-memory (per user) | 1 hour | Resume update, new jobs |
| Resume analysis | Database (ResumeAnalysis table) | Permanent | Resume re-upload |
| Job listings | Next.js ISR / `revalidate` | 5 minutes | — |
| Skill list | In-memory | 24 hours | Admin update |
| User session | JWT | 30 days | Logout |
| Notifications (unread count) | Fetch on mount | — | Real-time update |

### 18.2 Database Performance

- Indexes on all frequently queried columns (defined in schema)
- Pagination using cursor-based pagination for large lists (jobs, candidates)
- Select only needed fields (Prisma `select` clauses)
- Avoid N+1 queries (use Prisma `include` for relations)

### 18.3 Frontend Performance

- **Lazy loading**: Heavy components (PDF viewer, charts, Kanban) loaded with `next/dynamic`
- **Image optimization**: `next/image` for all images
- **Font optimization**: `next/font` for Inter
- **Code splitting**: Automatic via Next.js App Router
- **Prefetching**: `<Link>` components prefetch on hover

### 18.4 AI Call Optimization

- Batch DSA question generation (10 at a time)
- Cache resume analysis (don't re-analyze unchanged resumes)
- Use lower temperature for structured output (0.3)
- Use higher temperature for creative content (0.7)
- Limit conversation history sent to AI (last 10 messages)

---

## 19. DevOps

### 19.1 Environment Variables

Three environments:
- **Development**: `.env.local` (local PostgreSQL, local MinIO, test API keys)
- **Staging**: Vercel Preview (staging DB, staging S3, test API keys)
- **Production**: Vercel Production (production DB, production S3, production API keys)

### 19.2 Git/GitHub Workflow

- **Main branch**: `main` (production)
- **Development branch**: `develop` (staging)
- **Feature branches**: `feature/<name>` → PR to `develop`
- **Hotfix branches**: `hotfix/<name>` → PR to `main`
- **Commit convention**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **PR reviews**: Required before merge

### 19.3 CI/CD

GitHub Actions:
```
On PR to develop:
  → Lint (eslint)
  → Type check (tsc --noEmit)
  → Unit tests (vitest)
  → Build (next build)
  → Preview deployment (Vercel)

On merge to main:
  → All above
  → Integration tests
  → Production deployment (Vercel)
  → Database migration (prisma migrate deploy)
```

### 19.4 Docker

```dockerfile
# docker-compose.yml (development only)
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: jobfit
      POSTGRES_USER: jobfit_user
      POSTGRES_PASSWORD: jobfit_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

### 19.5 Vercel Deployment

- **Framework**: Next.js (auto-detected)
- **Build command**: `prisma generate && next build`
- **Environment variables**: Set via Vercel dashboard
- **Database**: External managed PostgreSQL (Neon, Supabase, or Railway)
- **Regions**: Auto (nearest to user)

---

## 20. Packages

> **DO NOT install these yet.** This is a reference list for planning purposes.

### Core

| Package | Purpose |
|---------|---------|
| `next` (v14+) | React framework |
| `react`, `react-dom` | UI library |
| `typescript` | Type safety |
| `tailwindcss`, `postcss`, `autoprefixer` | Styling |
| `prisma`, `@prisma/client` | Database ORM |
| `next-auth` (v5 beta / Auth.js) | Authentication |

### UI

| Package | Purpose |
|---------|---------|
| `@radix-ui/*` | shadcn/ui primitives |
| `class-variance-authority` | Component variants |
| `clsx`, `tailwind-merge` | Class name utilities |
| `lucide-react` | Icons |
| `recharts` | Charts/data visualization |
| `@dnd-kit/core`, `@dnd-kit/sortable` | Drag and drop (Kanban) |
| `react-pdf` or `@react-pdf-viewer/core` | PDF viewer |
| `react-dropzone` | File upload drag-and-drop |
| `sonner` | Toast notifications |

### Backend

| Package | Purpose |
|---------|---------|
| `zod` | Schema validation |
| `bcrypt` | Password hashing |
| `pdf-parse` | PDF text extraction |
| `@aws-sdk/client-s3` | S3 file storage |
| `@aws-sdk/s3-request-presigner` | Signed URLs |

### AI

| Package | Purpose |
|---------|---------|
| `openai` | OpenAI API client |
| `@google/generative-ai` | Gemini API client |

### Development

| Package | Purpose |
|---------|---------|
| `eslint`, `eslint-config-next` | Linting |
| `prettier`, `prettier-plugin-tailwindcss` | Formatting |
| `vitest`, `@testing-library/react` | Testing |
| `playwright` | E2E testing |
| `@types/*` | TypeScript type definitions |

---

## 21. Implementation Phases

### Phase 0: Project Setup

**What**: Initialize Next.js project, configure tools, set up Docker.

**Build**:
- `npx create-next-app@latest` with TypeScript, Tailwind, App Router, ESLint
- Configure `tsconfig.json` with strict mode
- Set up Tailwind with custom theme (colors, fonts from UI.md)
- Install and configure Prettier
- Initialize shadcn/ui
- Create folder structure (`src/components`, `src/services`, `src/dal`, etc.)
- Create `docker-compose.yml` for PostgreSQL + MinIO
- Create `.env.example` and `.env.local`
- Create `.gitignore`
- Initialize Git repository

**Dependencies**: None
**Expected Output**: Running Next.js app with landing page skeleton, Docker services, configured tools
**Definition of Done**: `npm run dev` works, `npm run build` succeeds, `npm run lint` passes, Docker services start

---

### Phase 1: Authentication

**What**: Implement Auth.js with credentials + Google, role-based access, middleware.

**Build**:
- Install and configure Auth.js (next-auth v5)
- Create Prisma schema for User, Account, Session, VerificationToken
- Implement login page, register page, forgot password page
- Implement credentials provider (email/password with bcrypt)
- Implement Google OAuth provider
- Create auth middleware for protected routes
- Implement role-based route guards
- Create auth-related Server Actions (register, login)
- Create auth validation schemas (Zod)

**Dependencies**: Phase 0
**Expected Output**: Working auth flow with login, register, role-based redirects
**Definition of Done**: Can register as Student/Recruiter, login, access role-appropriate dashboard, blocked from other role's routes

---

### Phase 2: Database & Core Models

**What**: Complete Prisma schema, migrations, seed data.

**Build**:
- Complete Prisma schema (all models from section 2.3)
- Run initial migration
- Create seed script (admin user, job sources, skills, DSA topics)
- Create DAL functions for CRUD operations
- Create type definitions for all entities
- Set up Prisma Client singleton

**Dependencies**: Phase 0
**Expected Output**: Complete database schema, seed data, DAL layer
**Definition of Done**: All migrations run, seed data loads, DAL functions tested

---

### Phase 3: Resume System

**What**: Resume upload, storage, parsing, analysis.

**Build**:
- Create S3 storage service (upload, download, signed URLs)
- Create resume upload Route Handler (multipart)
- Create file validation (MIME, size, magic bytes)
- Create resume upload UI (drag-and-drop)
- Implement PDF text extraction (pdf-parse)
- Create AI resume parsing prompt and service
- Create AI resume analysis prompt and service
- Store parsed data and analysis results
- Create resume view page with PDF viewer
- Create resume analysis page (scores, strengths, weaknesses, suggestions)
- Create UserSkill records from parsed resume

**Dependencies**: Phase 1, Phase 2
**Expected Output**: Full resume pipeline from upload to analysis display
**Definition of Done**: Upload PDF → see extracted info, scores, analysis. Replace resume works. Analysis shows real data.

---

### Phase 4: Job System

**What**: Job CRUD (recruiter), job listing, job detail, source adapters.

**Build**:
- Create recruiter job creation/edit forms and Server Actions
- Create job listing page (public + authenticated)
- Create job detail page
- Create job search and filtering
- Implement source adapter pattern (base adapter, recruiter adapter)
- Implement at least one external adapter (Adzuna or Remotive)
- Create job normalizer
- Create job deduplicator
- Create job skill extraction
- Create cron endpoint for job sync

**Dependencies**: Phase 2
**Expected Output**: Jobs visible on listing page, recruiter can post jobs, external jobs imported
**Definition of Done**: Can browse/search/filter jobs, view job details, recruiter can CRUD jobs, external source imports work

---

### Phase 5: Matching

**What**: Deterministic matching engine, Top 10, match breakdown.

**Build**:
- Implement skill matching algorithm
- Implement experience matching
- Implement education matching
- Implement other-factors matching (location, work mode, role)
- Create skill alias resolution
- Implement configurable weight system
- Implement Top 10 selection and ranking
- Create match score display components (MatchScore, MatchBreakdown, SkillTag)
- Create Top 10 matched jobs page
- Add match info to job detail page
- Add match badges to job cards (authenticated users)

**Dependencies**: Phase 3, Phase 4
**Expected Output**: Students see Top 10 matched jobs with scores and breakdowns
**Definition of Done**: Match scores are calculated correctly, Top 10 is ranked, breakdown shows accurate skill/experience/education/other scores

---

### Phase 6: Skill Gap

**What**: Skill gap analysis, categorization, learning roadmap.

**Build**:
- Implement skill gap analysis service
- Skill categorization (Strong, Good, Needs Improvement, Missing)
- Priority assignment (High, Medium, Low)
- AI-generated learning roadmap
- Create skill gap page with table + radar chart
- Create resume improvement page with suggestions

**Dependencies**: Phase 5
**Expected Output**: Skill gap page shows categorized skills, priorities, and roadmap
**Definition of Done**: Skill gap accurately compares user skills vs job requirements, AI generates relevant learning roadmap

---

### Phase 7: AI Features

**What**: AI service layer, resume improvement, career recommendations.

**Build**:
- Create AI client abstraction (OpenAI + Gemini)
- Implement all prompt templates
- Implement structured output validation (Zod schemas)
- Create resume vs job analysis feature
- Create AI resume improvement suggestions
- Create AI assistant chat interface
- Implement rate limiting for AI calls
- Implement token tracking

**Dependencies**: Phase 3 (for resume AI), Phase 4 (for job AI)
**Expected Output**: All AI features working with structured, validated outputs
**Definition of Done**: AI resume analysis, resume improvement, resume vs job analysis, and AI assistant all return valid structured data

---

### Phase 8: DSA

**What**: Personalized DSA questions, practice, progress tracking.

**Build**:
- Create DSA topic configuration
- Implement AI DSA question generation
- Create DSA overview page (topic grid, progress)
- Create problem view page
- Implement answer submission and evaluation
- Implement progress tracking
- Implement personalized recommendation logic

**Dependencies**: Phase 7 (AI service)
**Expected Output**: Students can practice personalized DSA problems and track progress
**Definition of Done**: DSA questions generated per user context, progress tracked across topics and difficulties

---

### Phase 9: Interview

**What**: Question generation, practice, follow-up, mock interview, feedback.

**Build**:
- Implement resume-based question generation
- Implement job-based question generation
- Create interview preparation page (tabs, question cards)
- Create interview practice chat interface
- Implement answer evaluation
- Implement dynamic follow-up question generation
- Implement mock interview flow (setup, in-progress, completed)
- Implement interview session state machine
- Create mock interview report page
- Implement interview feedback generation

**Dependencies**: Phase 7 (AI service)
**Expected Output**: Full interview preparation flow from question generation to mock interview report
**Definition of Done**: Can generate questions, practice with follow-ups, conduct mock interview, receive comprehensive feedback report

---

### Phase 10: Application Tracking

**What**: Save/apply jobs, status management, Kanban board, analytics.

**Build**:
- Implement save job functionality
- Implement apply flow (redirect + status update)
- Create application tracker page (Kanban + table views)
- Implement status transitions with validation
- Create application detail panel (notes, dates)
- Create application analytics for dashboard

**Dependencies**: Phase 4 (jobs), Phase 5 (matching)
**Expected Output**: Full application tracking with Kanban board and analytics
**Definition of Done**: Can save jobs, mark as applied, update statuses, add notes, view analytics on dashboard

---

### Phase 11: Recruiter

**What**: Recruiter dashboard, candidate management, interview scheduling.

**Build**:
- Create recruiter dashboard (stats, active jobs, recent applicants)
- Create candidate search and filtering
- Create candidate profile view (skills, match score)
- Implement shortlist/reject actions
- Create application pipeline view
- Implement interview scheduling (date/time)
- Update recruiter navigation and layout

**Dependencies**: Phase 1 (auth), Phase 4 (jobs), Phase 5 (matching)
**Expected Output**: Recruiters can manage jobs, discover candidates, manage pipeline
**Definition of Done**: Recruiter can post jobs, view applicants ranked by match score, shortlist/reject, schedule interviews

---

### Phase 12: Admin

**What**: Admin dashboard, user/company/job management, analytics.

**Build**:
- Create admin dashboard (stats, charts, activity feed)
- Create user management page (table, suspend, delete)
- Create company management page
- Create job management page (moderation)
- Create analytics page (growth, activity charts)
- Update admin navigation and layout

**Dependencies**: Phase 1 (auth), Phase 2 (models)
**Expected Output**: Admin can manage all platform entities and view analytics
**Definition of Done**: Admin can view/manage users, companies, jobs, and see platform analytics

---

### Phase 13: Notifications

**What**: In-app notification system with triggers.

**Build**:
- Create NotificationService
- Implement notification triggers for all events
- Create notification bell with unread count
- Create notification dropdown
- Create full notifications page
- Implement mark as read/dismiss
- Create notification preferences (future email toggle)

**Dependencies**: Phase 3 (resume events), Phase 4 (job events), Phase 10 (application events)
**Expected Output**: Users receive contextual notifications for platform events
**Definition of Done**: Notifications appear for resume analysis, job matches, application updates, interview reminders

---

### Phase 14: Testing, Polish & Deployment

**What**: Comprehensive testing, UI polish, security audit, deployment.

**Build**:
- Write unit tests for matching engine, state machines, validators
- Write integration tests for Server Actions and DAL
- Write E2E tests for critical flows (register → upload resume → view matches → apply)
- Security audit: validate RBAC, input validation, file security
- UI polish: responsive testing, empty states, loading states, error states
- Performance optimization: query analysis, caching, lazy loading
- Set up CI/CD (GitHub Actions)
- Configure Vercel deployment
- Set up production database
- Set up production S3 bucket
- Production environment variables
- Final testing in staging

**Dependencies**: All phases
**Expected Output**: Tested, secure, polished, deployed application
**Definition of Done**: All tests pass, no security vulnerabilities, responsive on all breakpoints, deployed to production, CI/CD pipeline green

---

## 22. Engineering Rules

These rules must be followed by all implementation agents:

1. **Read `PROJECT_SPEC.md` before any implementation.** Understand the complete product scope.
2. **Read `PRODUCT.md`, `UI.md`, and `ENGINEERING.md` before modifying architecture.** These are the source of truth.
3. **Do not change product scope** without explicit user instruction.
4. **Do not install unnecessary packages.** Only install what's listed in the Packages section or explicitly requested.
5. **Do not create duplicate utilities.** Check existing code first.
6. **Keep business logic out of UI components.** UI components render data; services process it.
7. **Validate all external/user input** with Zod schemas at the Server Action / Route Handler boundary.
8. **Never expose secrets.** Use environment variables. Never log API keys.
9. **Use TypeScript strict mode.** No `any` types unless absolutely necessary (and documented).
10. **Prefer reusable components.** Check `src/components/` before creating new ones.
11. **Keep AI calls behind `src/services/ai/`.** Never call AI APIs directly from components or actions.
12. **Keep external job sources behind adapters** in `src/services/jobs/adapters/`.
13. **Write tests for critical business logic**: matching algorithm, auth, state machines, validation.
14. **Do not break existing features.** Run tests before committing.
15. **Do not rewrite working code unnecessarily.** Only refactor with a strong technical reason.
16. **Follow the folder structure** defined in this document.
17. **Use the DAL layer** for all database access. No raw Prisma calls in components or actions.
18. **Handle all states**: loading, empty, error, success. No "happy path only" implementations.
19. **Use Server Components by default.** Only add `"use client"` when interactivity requires it.
20. **Use Server Actions for mutations.** Use Route Handlers only for file uploads, webhooks, and cron.
21. **Implement one phase at a time.** Complete and verify before moving to the next phase.
22. **Never implement unauthorized scraping** of any platform. Only use authorized APIs, feeds, and integrations.

---

## 23. Definition of Done — Complete JobFit Project

The JobFit project is complete when ALL of the following are true:

### Functional Completeness
- [ ] Students can register, login, and manage profiles
- [ ] Students can upload, view, and replace resumes
- [ ] Resumes are automatically parsed and analyzed
- [ ] Resume score, ATS score, strengths, weaknesses, and suggestions are displayed
- [ ] Jobs are aggregated from authorized sources and recruiter postings
- [ ] Students can browse, search, and filter jobs
- [ ] Top 10 matched jobs are calculated with deterministic scoring
- [ ] Match score with breakdown (skills, experience, education, other) is shown
- [ ] Students can analyze their resume against a specific job
- [ ] Skill gap analysis shows categorized skills with priorities
- [ ] Personalized learning roadmap is generated
- [ ] AI suggests resume improvements (without fabricating information)
- [ ] Personalized DSA questions are generated and progress is tracked
- [ ] Interview questions are generated from resume and job description
- [ ] Dynamic follow-up questions work based on candidate answers
- [ ] AI mock interviews produce comprehensive feedback reports
- [ ] Application tracker works with Kanban board and status management
- [ ] Recruiters can post jobs, view applicants, and manage pipeline
- [ ] Admin can manage users, companies, jobs, and view analytics
- [ ] In-app notifications work for all defined events

### Technical Quality
- [ ] TypeScript strict mode, no `any` types
- [ ] All inputs validated with Zod
- [ ] All AI calls behind service layer
- [ ] All database access through DAL
- [ ] All job sources behind adapter pattern
- [ ] Unit tests for matching engine, state machines, validators
- [ ] Integration tests for critical Server Actions
- [ ] E2E tests for top 5 user journeys
- [ ] No secrets in source code
- [ ] RBAC enforced at middleware and action level

### UI/UX Quality
- [ ] Responsive on mobile, tablet, and desktop
- [ ] Loading states with skeletons on all data-dependent views
- [ ] Empty states with actions on all lists/collections
- [ ] Error states with retry on all fallible operations
- [ ] Consistent design system (colors, typography, spacing)
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Professional, startup-level visual quality

### Deployment
- [ ] CI/CD pipeline with lint, type check, test, build
- [ ] Deployed to Vercel (production)
- [ ] Production database configured and migrated
- [ ] Production S3 bucket configured
- [ ] Environment variables secured
- [ ] No critical security vulnerabilities
