# JobFit — UI/UX Specification

> **Source of Truth**: [PROJECT_SPEC.md](file:///d:/projects/JobFit/PROJECT_SPEC.md)
> **Product Context**: [PRODUCT.md](file:///d:/projects/JobFit/PRODUCT.md)
> This document defines the complete UI/UX system for JobFit.

---

## 1. Overall Design Direction

JobFit must look and feel like a **modern, premium SaaS career platform** — not a student project. The design should communicate trust, intelligence, and professionalism.

### Design Principles

1. **Clean & Professional** — Minimal visual noise, generous whitespace, clear hierarchy
2. **Data-Dense but Readable** — Dashboards show meaningful data without overwhelming
3. **Intelligent & Alive** — Subtle animations, smart interactions, AI-aware UI patterns
4. **Consistent** — Every page follows the same design system
5. **Accessible** — WCAG 2.1 AA compliant, keyboard navigable, screen-reader friendly
6. **State-Aware** — Every view handles loading, empty, error, and success states

### Design Inspiration

- Linear (clean navigation, minimalist)
- Vercel Dashboard (professional dark mode, data visualization)
- Notion (clean typography, subtle interactions)
- Stripe (premium feel, excellent documentation layout)

---

## 2. Brand & Design Language

### Brand Identity

- **Name**: JobFit
- **Tagline**: "Your AI-Powered Career Assistant"
- **Personality**: Intelligent, trustworthy, modern, approachable
- **Logo**: Text-based "JobFit" with a subtle accent on "Fit" — a visual cue for matching/alignment

### Design Tokens

All design tokens will be defined as CSS custom properties and consumed via Tailwind CSS configuration.

---

## 3. Color System

### Primary Palette

```
--color-primary-50:   #EEF2FF   (lightest tint)
--color-primary-100:  #E0E7FF
--color-primary-200:  #C7D2FE
--color-primary-300:  #A5B4FC
--color-primary-400:  #818CF8
--color-primary-500:  #6366F1   (primary — Indigo)
--color-primary-600:  #4F46E5
--color-primary-700:  #4338CA
--color-primary-800:  #3730A3
--color-primary-900:  #312E81
--color-primary-950:  #1E1B4B
```

### Accent / Success / Warning / Error

```
--color-success-500:  #22C55E   (green — matched skills, good scores)
--color-success-50:   #F0FDF4

--color-warning-500:  #F59E0B   (amber — needs improvement, medium priority)
--color-warning-50:   #FFFBEB

--color-error-500:    #EF4444   (red — missing skills, errors, rejected)
--color-error-50:     #FEF2F2

--color-info-500:     #3B82F6   (blue — informational, tips)
--color-info-50:      #EFF6FF
```

### Neutral / Gray Scale

```
--color-gray-50:      #F9FAFB
--color-gray-100:     #F3F4F6
--color-gray-200:     #E5E7EB
--color-gray-300:     #D1D5DB
--color-gray-400:     #9CA3AF
--color-gray-500:     #6B7280
--color-gray-600:     #4B5563
--color-gray-700:     #374151
--color-gray-800:     #1F2937
--color-gray-900:     #111827
--color-gray-950:     #030712
```

### Match Score Colors

Used specifically for JobFit match percentages:

```
90-100%:  --color-success-500   (Excellent match)
70-89%:   --color-primary-500   (Good match)
50-69%:   --color-warning-500   (Moderate match)
0-49%:    --color-gray-400      (Low match)
```

### Background & Surface (Light Mode — Default)

```
--bg-page:            #FFFFFF
--bg-surface:         #FFFFFF
--bg-surface-raised:  #F9FAFB
--bg-surface-overlay: #FFFFFF
--border-default:     #E5E7EB
--border-subtle:      #F3F4F6
```

### Background & Surface (Dark Mode — Future)

```
--bg-page:            #030712
--bg-surface:         #111827
--bg-surface-raised:  #1F2937
--bg-surface-overlay: #1F2937
--border-default:     #374151
--border-subtle:      #1F2937
```

> **Decision**: Launch with light mode only. Architecture CSS variables to support dark mode in a future iteration.

---

## 4. Typography

### Font Stack

```
--font-sans:    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
--font-mono:    'JetBrains Mono', 'Fira Code', 'Consolas', monospace
```

**Inter** is loaded from Google Fonts via `next/font/google` for optimal performance.

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `display-lg` | 48px / 3rem | 700 | 1.1 | Landing page hero |
| `display-sm` | 36px / 2.25rem | 700 | 1.2 | Section headings |
| `heading-lg` | 30px / 1.875rem | 600 | 1.3 | Page titles |
| `heading-md` | 24px / 1.5rem | 600 | 1.3 | Card titles, section headers |
| `heading-sm` | 20px / 1.25rem | 600 | 1.4 | Sub-section headers |
| `body-lg` | 18px / 1.125rem | 400 | 1.6 | Landing page body |
| `body-md` | 16px / 1rem | 400 | 1.5 | Default body text |
| `body-sm` | 14px / 0.875rem | 400 | 1.5 | Secondary text, labels |
| `caption` | 12px / 0.75rem | 400 | 1.4 | Timestamps, metadata |
| `mono` | 14px / 0.875rem | 400 | 1.5 | Code, technical content |

---

## 5. Spacing & Layout

### Spacing Scale

```
4px  — xs
8px  — sm
12px — md
16px — base
20px — lg
24px — xl
32px — 2xl
40px — 3xl
48px — 4xl
64px — 5xl
80px — 6xl
```

### Layout Grid

- **Max content width**: 1280px (7xl)
- **Dashboard content**: 1152px (6xl)
- **Page padding**: 16px (mobile), 24px (tablet), 32px (desktop)
- **Card padding**: 20px (mobile), 24px (desktop)
- **Section gap**: 32px (mobile), 48px (desktop)
- **Grid columns**: 12 (desktop), 8 (tablet), 4 (mobile)
- **Grid gap**: 16px (mobile), 24px (desktop)

### Breakpoints

```
sm:   640px    (large mobile / small tablet)
md:   768px    (tablet)
lg:   1024px   (small desktop / landscape tablet)
xl:   1280px   (desktop)
2xl:  1536px   (large desktop)
```

### Border Radius

```
--radius-sm:    6px
--radius-md:    8px
--radius-lg:    12px
--radius-xl:    16px
--radius-full:  9999px
```

### Shadows

```
--shadow-sm:    0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-md:    0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)
--shadow-lg:    0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)
--shadow-xl:    0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)
```

---

## 6. Navigation Architecture

### Public Navigation (Top Bar)

```
[Logo: JobFit]     [Jobs]  [About]  [Login]  [Get Started →]
```

- Sticky top bar, white background, subtle bottom border
- CTA "Get Started" is primary-colored button

### Student Navigation (Sidebar)

```
┌─────────────────────┐
│  JobFit Logo        │
├─────────────────────┤
│  📊 Dashboard       │
│  👤 Profile         │
│  📄 Resume          │
│  💼 Jobs            │
│  📋 Applications    │
│  📈 Skill Gap       │
│  🧮 DSA Practice    │
│  🎤 Interview       │
│  🤖 AI Assistant    │
│  🔔 Notifications   │
├─────────────────────┤
│  ⚙️ Settings        │
│  🚪 Logout          │
└─────────────────────┘
```

- Fixed left sidebar on desktop (width: 256px)
- Collapsible to icon-only mode (width: 64px)
- Bottom sheet / hamburger on mobile
- Active item highlighted with primary-100 background and primary-600 text
- Hover state with gray-50 background
- Notification badge (red dot) on bell icon when unread

### Recruiter Navigation (Sidebar)

```
┌─────────────────────┐
│  JobFit Logo        │
├─────────────────────┤
│  📊 Dashboard       │
│  💼 Jobs            │
│  👥 Candidates      │
│  📋 Applications    │
│  📅 Interviews      │
├─────────────────────┤
│  🏢 Company         │
│  ⚙️ Settings        │
│  🚪 Logout          │
└─────────────────────┘
```

### Admin Navigation (Sidebar)

```
┌─────────────────────┐
│  JobFit Logo        │
├─────────────────────┤
│  📊 Dashboard       │
│  👥 Users           │
│  🏢 Companies       │
│  💼 Jobs            │
│  📈 Analytics       │
├─────────────────────┤
│  ⚙️ Settings        │
│  🚪 Logout          │
└─────────────────────┘
```

### Mobile Navigation

- Sidebar collapses to a hamburger menu (top-left)
- Slide-in drawer from left
- Bottom navigation bar with 5 key items for students:
  ```
  [Dashboard] [Jobs] [Resume] [Interview] [More]
  ```

---

## 7. Page Specifications

### 7.1 Public Pages

#### Landing Page

**Purpose**: Convert visitors to registered users.

**Layout**:
```
[Top Nav]

[Hero Section]
  - Headline: "Your AI-Powered Career Assistant"
  - Subheadline: "Upload your resume once. Get matched jobs, skill analysis, 
    interview prep, and more."
  - CTA: "Get Started Free →" (primary button, large)
  - Secondary CTA: "Browse Jobs" (outline button)
  - Hero illustration/graphic (abstract AI/career visual)

[How It Works — 4 Steps]
  1. Upload Your Resume
  2. Get AI Analysis & Matching
  3. Prepare with Personalized Practice
  4. Apply with Confidence
  (Each step: icon + title + description)

[Key Features Grid — 3x2]
  - Smart Job Matching
  - Resume Analysis
  - Skill Gap Analysis
  - Interview Preparation
  - DSA Practice
  - Application Tracking
  (Each: icon + title + short description + learn more link)

[Stats Bar]
  - "X+ Jobs Available" | "Y% Average Match Accuracy" | "Z+ Users"

[Testimonials / Social Proof]
  (Placeholder section for future testimonials)

[CTA Banner]
  "Ready to find your perfect job fit?"
  [Get Started Free →]

[Footer]
  Logo | About | Privacy | Terms | Contact
```

**Design Notes**:
- Hero uses a subtle gradient background (primary-50 → white)
- Features use card layout with subtle shadow-sm
- Smooth scroll animations on section entry (intersection observer)
- Stats use animated counting effect on scroll

#### Job Listing Page (Public)

**Purpose**: Browse available jobs. Accessible without login.

**Layout**:
```
[Top Nav]

[Search Bar — Full Width]
  [🔍 Search jobs, skills, companies...]  [Location ▾]  [Search]

[Filters Row]
  [Employment Type ▾] [Experience ▾] [Work Mode ▾] [Salary ▾] [Clear All]

[Results Header]
  "Showing 142 jobs"   [Sort: Most Relevant ▾]   [Grid | List view]

[Job Cards Grid / List]
  ┌──────────────────────────────────────────┐
  │  [Company Logo]                          │
  │  Software Engineer                       │
  │  Acme Corp · Bangalore · Remote          │
  │  ₹12-18 LPA                             │
  │  [React] [Node.js] [PostgreSQL]          │
  │  Posted 2 days ago                       │
  │                        [View Job →]      │
  └──────────────────────────────────────────┘

[Pagination]
  [← Previous]  1  2  3  ...  10  [Next →]
```

**Design Notes**:
- Job cards use shadow-sm, radius-lg, hover: shadow-md + translateY(-2px)
- Skill tags are small rounded pills (gray-100 bg, gray-700 text)
- If user is logged in, cards also show match percentage badge
- Filters use popover dropdowns (shadcn/ui Popover)

#### Job Detail Page

**Purpose**: Full job information + match analysis for logged-in users.

**Layout**:
```
[Breadcrumb: Jobs > Software Engineer at Acme Corp]

[Two-Column Layout]

LEFT (60%):
  [Company Logo + Name]
  [Job Title — heading-lg]
  [Metadata Row: Location · Remote · Full-time · 2-4 years · Posted 3 days ago]
  [Salary: ₹12-18 LPA]

  [Job Description — rendered markdown]
  
  [Required Skills]
    [React ✓] [Node.js ✓] [PostgreSQL ✓] [AWS ✗] [Docker ✗]
    (✓ = matched, colored green; ✗ = missing, colored red/gray)

  [Preferred Skills]
    [GraphQL] [Redis] [Kubernetes]

  [Apply Button]
    [Apply on Company Site →]  (opens original URL in new tab)

RIGHT (40%):
  [JobFit Match Card]
    ┌────────────────────────────┐
    │  🎯 92% JobFit Match       │
    │                            │
    │  Skills ████████░░ 70%     │
    │  Experience ██████░░░ 60%  │
    │  Education █████████░ 90%  │
    │  Other ███████░░░ 70%      │
    │                            │
    │  Matched: 5 skills         │
    │  Missing: 2 skills         │
    │                            │
    │  [Analyze My Resume →]     │
    └────────────────────────────┘

  [Why This Job Matches]
    • Strong alignment with your React and Node.js experience
    • Your project experience demonstrates relevant skills

  [Potential Concerns]
    • AWS experience is required but not found on your resume
    • Consider highlighting Docker experience if applicable

  [Save Job ♡]
```

**Design Notes**:
- Match card has a primary-50 background with primary border
- Progress bars use semantic colors (green/amber/red based on percentage)
- Skills tags are interactive — hover shows proficiency context
- "Analyze My Resume" triggers the detailed resume-vs-job analysis

---

### 7.2 Authentication Pages

#### Login Page

```
[Centered Card — max-width 420px]
  [JobFit Logo]
  
  "Welcome back"
  "Sign in to your account"
  
  [Email input]
  [Password input]
  [Remember me checkbox]    [Forgot password? →]
  
  [Sign In — primary button, full width]
  
  ───── or ─────
  
  [Continue with Google — outline button, full width]
  
  "Don't have an account?" [Sign up →]
```

#### Register Page

```
[Centered Card — max-width 480px]
  [JobFit Logo]
  
  "Create your account"
  
  [Role Toggle: Student | Recruiter]
  
  [Full Name input]
  [Email input]
  [Password input]
  [Confirm Password input]
  
  (If Recruiter: [Company Name input])
  
  [☑ I agree to Terms of Service and Privacy Policy]
  
  [Create Account — primary button, full width]
  
  ───── or ─────
  
  [Continue with Google — outline button, full width]
  
  "Already have an account?" [Sign in →]
```

#### Forgot Password

```
[Centered Card — max-width 420px]
  [JobFit Logo]
  
  "Reset your password"
  "Enter your email and we'll send you a reset link."
  
  [Email input]
  
  [Send Reset Link — primary button, full width]
  
  [← Back to Sign In]
```

**Design Notes**:
- Auth pages have a subtle gradient background
- Cards use shadow-lg, radius-xl
- Form validation shows inline errors below inputs
- Loading state replaces button text with spinner

---

### 7.3 Student Dashboard

**Purpose**: Central hub showing resume status, top matches, recent activity.

**Layout**:
```
[Sidebar] [Main Content Area]

[Page Title: "Dashboard"]
[Greeting: "Welcome back, Priya"]

[Top Stats Row — 4 cards]
  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
  │ Resume     │ │ Top Match  │ │ Applied    │ │ Interviews │
  │ Score      │ │            │ │            │ │ Scheduled  │
  │ 78/100     │ │ 94%        │ │ 12         │ │ 3          │
  └────────────┘ └────────────┘ └────────────┘ └────────────┘

[Two-Column Grid]

LEFT:
  [Top 5 Job Matches — compact list]
    1. Frontend Developer at Acme — 94% match
    2. React Engineer at Beta — 91% match
    3. Full-Stack at Gamma — 88% match
    4. ...
    [View All Top 10 →]

  [Recent Applications — compact list]
    • Applied: React Dev at XYZ — 2 days ago
    • Shortlisted: SDE at ABC — 1 day ago
    • Interview: SDE-2 at DEF — Tomorrow
    [View All →]

RIGHT:
  [Resume Summary Card]
    Score: 78/100 | ATS: 72/100
    Top Strength: Strong project section
    Top Weakness: Missing metrics in experience
    [View Full Analysis →]

  [Skill Gap Summary]
    3 critical skills missing for your target role
    [View Skill Gap →]

  [DSA Progress]
    ███████░░░░░ 62%
    12/18 topics started · 45 problems solved
    [Continue Practice →]

[Notifications — Recent 3]
  🔔 New high-match job: Backend Developer at TechCorp (91%)
  🔔 Resume analysis updated
  🔔 Interview reminder: Tomorrow 2:00 PM
```

**Design Notes**:
- Stat cards use subtle colored accents (top border or icon color)
- Job match items show colored badge for match %
- Dashboard loads with skeleton states, then fades in
- Charts use Recharts or similar lightweight library

---

### 7.4 Student Profile Page

**Layout**:
```
[Page Title: "Profile"]

[Profile Header]
  [Avatar (initials-based)]  [Name]  [Email]  [Edit Profile →]

[Two-Column Form]

  Personal Information:
    - Full Name
    - Email (read-only from auth)
    - Phone
    - Location (city, state, country)
    - LinkedIn URL
    - GitHub URL
    - Portfolio URL

  Career Preferences:
    - Target Role (e.g., "Frontend Developer")
    - Experience Level (Fresher / Junior / Mid / Senior)
    - Preferred Work Mode (Remote / Hybrid / Onsite / Any)
    - Preferred Location(s)
    - Expected Salary Range

  [Save Changes]
```

---

### 7.5 Resume Upload & Analysis

#### Resume Page

```
[Page Title: "Resume"]

[IF no resume uploaded:]
  [Empty State]
    📄 Upload your resume to get started
    "Upload your resume and JobFit will automatically analyze it,
     extract your skills, and match you with relevant jobs."
    [Upload Resume — primary button]
    Supported: PDF · Max 5MB

[IF resume exists:]
  [Resume Header]
    📄 resume_priya_2024.pdf
    Uploaded: Sep 1, 2024
    Last analyzed: Sep 1, 2024
    [Replace Resume]  [Download Original]

  [Resume Preview — PDF viewer embed]
    (Embedded PDF viewer or first-page preview image)

  [Extracted Information — Collapsible Sections]
    ▶ Personal Info (Name, Email, Phone, Links)
    ▶ Summary
    ▶ Education (degree, institution, year, CGPA)
    ▶ Skills (categorized: languages, frameworks, databases, cloud, tools)
    ▶ Experience (company, role, duration, bullet points)
    ▶ Internships
    ▶ Projects (name, tech stack, description)
    ▶ Certifications
    ▶ Achievements
```

#### Resume Analysis Page

```
[Page Title: "Resume Analysis"]

[Score Cards — 2 side by side]
  ┌─────────────────┐  ┌──────────────────┐
  │ Resume Score     │  │ ATS Score        │
  │  [Circular       │  │  [Circular        │
  │   Progress: 78]  │  │   Progress: 72]   │
  │ Good             │  │ Needs Improvement │
  └─────────────────┘  └──────────────────┘

[Strengths — Green section]
  ✓ Strong project section with 4 well-described projects
  ✓ Good technical skills coverage
  ✓ Clear education section
  ✓ ...

[Weaknesses — Amber/Red section]
  ✗ Experience section lacks quantifiable metrics
  ✗ No summary/objective section
  ✗ Missing cloud technology keywords
  ✗ ...

[Improvement Suggestions — Actionable list]
  1. Add a professional summary highlighting your key strengths
     → "Consider: 'Full-stack developer with 2 years of experience...'"
  2. Add metrics to your experience bullets
     → "Instead of 'Improved performance', write 'Improved page load by 40%'"
  3. Include relevant keywords: AWS, Docker, CI/CD
     → "These appear in 78% of your target jobs"
  ...

[ATS Breakdown]
  Section Completeness  ████████░░ 80%
  Keyword Density       ██████░░░░ 60%
  Formatting            █████████░ 90%
  Action Verbs          ███████░░░ 70%
```

---

### 7.6 Job Discovery UI

#### Jobs Page (Authenticated Student)

```
[Page Title: "Jobs"]

[Tab Bar]
  [All Jobs]  [Top 10 Matches]  [Saved Jobs]

[Search + Filters]
  (Same as public job listing but with match % visible)

[Job Cards — include match badge]
  ┌──────────────────────────────────────────┐
  │  [Company Logo]           [🎯 92% Match] │
  │  Software Engineer                        │
  │  Acme Corp · Bangalore · Remote           │
  │  ₹12-18 LPA                              │
  │  [React ✓] [Node.js ✓] [AWS ✗]           │
  │  Posted 2 days ago                        │
  │  [♡ Save]              [View Details →]   │
  └──────────────────────────────────────────┘
```

#### Top 10 Matched Jobs

```
[Tab: Top 10 Matches — active]

[Info Banner]
  "These are your best job matches based on your resume, skills, and preferences."
  [↻ Recalculate] (if resume was recently updated)

[Ranked List — numbered 1-10]
  Each card shows:
  - Rank badge (#1, #2, ...)
  - Match percentage (large, colored)
  - Job title + company
  - Matched skills (green tags)
  - Missing skills (gray/red tags)
  - Match breakdown mini-chart
  - [View Details →]
```

---

### 7.7 Resume vs Job Analysis UI

Triggered by "Analyze My Resume Against This Job" on a Job Detail page.

```
[Modal or Full Page]

[Header]
  "Resume Analysis: Your Resume vs Software Engineer at Acme Corp"

[Compatibility Score]
  ┌───────────────────────────────────────┐
  │  Resume-Job Compatibility: 78%        │
  │  ████████████████░░░░░ 78%            │
  └───────────────────────────────────────┘

[Three-Column Comparison]

  Matched Skills (5)      Missing Skills (3)      Bonus Skills (2)
  ✓ React                 ✗ AWS                   ★ Python
  ✓ Node.js               ✗ Docker                ★ GraphQL
  ✓ TypeScript            ✗ Kubernetes
  ✓ PostgreSQL
  ✓ Git

[Missing Keywords]
  Keywords found in job but not in resume:
  "scalable", "microservices", "CI/CD pipeline", "agile"

[Relevant Projects]
  Your project "E-Commerce Platform" aligns with this role because...

[Relevant Experience]
  Your internship at XYZ Corp demonstrates relevant backend experience...

[Resume Improvements for This Job]
  1. Add "microservices" to your skills section
  2. Mention CI/CD experience in your project descriptions
  3. Highlight scalability aspects of your projects

[ATS Suggestions]
  - Include exact keywords from the job description
  - Add a summary section tailored to this role
```

---

### 7.8 Skill Gap Visualization

```
[Page Title: "Skill Gap Analysis"]

[Target Role Selector]
  "Analyzing gaps for: [Frontend Developer ▾] at [Senior level ▾]"

[Overall Gap Score]
  ████████████████████░░░░░ 72% Ready

[Skills Matrix — Table]
  | Skill         | Your Level        | Required | Gap      | Priority |
  |---------------|-------------------|----------|----------|----------|
  | React         | ████████░░ Strong | Required | None     | —        |
  | TypeScript    | ███████░░░ Good   | Required | Minor    | Low      |
  | AWS           | ░░░░░░░░░░ None   | Required | Critical | High     |
  | Docker        | ██░░░░░░░░ Basic  | Required | Major    | High     |
  | Node.js       | ███████░░░ Good   | Preferred| Minor    | Medium   |

[Visual: Radar/Spider Chart]
  (Skills plotted on radar: user level vs required level)

[Learning Roadmap]
  Priority 1 (High):
    🔴 AWS — Start with AWS fundamentals, then focus on EC2, S3, Lambda
       Estimated: 4-6 weeks
       Resources: AWS Free Tier, AWS Certified Cloud Practitioner path

  Priority 2 (High):
    🔴 Docker — Learn containerization basics, Dockerfile, Docker Compose
       Estimated: 2-3 weeks

  Priority 3 (Medium):
    🟡 Node.js — Deepen knowledge in Express middleware, error handling
       Estimated: 1-2 weeks
```

---

### 7.9 Resume Improvement UI

```
[Page Title: "Resume Improvement"]

[Job Selector — if improving for specific job]
  "Improving resume for: Software Engineer at Acme Corp"

[Suggestions List]
  Each suggestion card:
  ┌────────────────────────────────────────────────┐
  │ 📝 Section: Experience                         │
  │                                                │
  │ Current:                                       │
  │ "Worked on improving website performance"      │
  │                                                │
  │ Suggested:                                     │
  │ "Optimized website performance, reducing page  │
  │  load time by 40% through code splitting and   │
  │  lazy loading implementation"                  │
  │                                                │
  │ Why: Adds quantifiable metrics and specific    │
  │ techniques, improving ATS score and recruiter  │
  │ impact.                                        │
  │                                                │
  │ [Copy Suggestion]  [Dismiss]                   │
  └────────────────────────────────────────────────┘

[ATS Keyword Suggestions]
  Missing keywords for target jobs:
  [microservices] [CI/CD] [agile] [scalable] [REST API]
  "Adding these keywords could improve your ATS score by ~15%"
```

---

### 7.10 Personalized DSA UI

```
[Page Title: "DSA Practice"]

[Progress Overview]
  ████████░░░░░░░ 53%
  45/85 problems solved · 12/18 topics covered

[Topic Grid — Cards]
  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
  │ Arrays         │ │ Strings        │ │ Linked List    │
  │ ████████░░ 80% │ │ ██████░░░░ 60% │ │ ████░░░░░░ 40% │
  │ 8/10 solved    │ │ 6/10 solved    │ │ 4/10 solved    │
  │ [Continue →]   │ │ [Continue →]   │ │ [Start →]      │
  └────────────────┘ └────────────────┘ └────────────────┘
  ... (all 18 topics)

[Recommended Next]
  Based on your target role (Frontend Developer) and skill gaps:
  "Focus on: Dynamic Programming (0% complete, appears in 65% of interviews)"

[Difficulty Distribution]
  Easy: ████████████ 20 solved
  Medium: ████████ 15 solved
  Hard: ████ 10 solved

[Problem View]
  ┌──────────────────────────────────────────────┐
  │ Two Sum                          [Easy] 🟢   │
  │ Topic: Arrays, Hashing                       │
  │                                              │
  │ Problem Statement:                           │
  │ Given an array of integers nums and an       │
  │ integer target, return indices of the two     │
  │ numbers such that they add up to target.      │
  │                                              │
  │ [Show Hint]                                  │
  │                                              │
  │ Your Approach:                               │
  │ [Text area for solution approach]            │
  │                                              │
  │ [Submit Answer]                              │
  │                                              │
  │ Expected Approach: Hash Map O(n)             │
  │ Time: O(n) | Space: O(n)                    │
  │ Related: Two Pointers, Sliding Window        │
  └──────────────────────────────────────────────┘
```

---

### 7.11 Interview Preparation UI

```
[Page Title: "Interview Preparation"]

[Tab Bar]
  [Resume-Based] [Job-Based] [Sessions] [Mock Interview]

[Resume-Based Tab]
  [Generate Questions]
  "Generate interview questions based on your resume"
  
  [Category Filter]
    [All] [Technical] [Project] [Behavioral] [HR]

  [Question Cards]
    ┌──────────────────────────────────────────────┐
    │ Q1: Explain how you implemented              │
    │ authentication in your E-Commerce project.   │
    │                                              │
    │ Category: [Technical] [Project]              │
    │ Difficulty: Medium                           │
    │                                              │
    │ [Practice This Question →]                   │
    └──────────────────────────────────────────────┘

[Job-Based Tab]
  [Select a Job ▾]
  [Generate Questions]
  (Same card layout as resume-based)
```

---

### 7.12 Dynamic Follow-up Question UI

```
[Interview Practice — Chat-like Interface]

┌────────────────────────────────────────────────────┐
│  Interview Session: Technical Interview            │
│  Duration: 12:34  |  Questions: 4/10              │
├────────────────────────────────────────────────────┤
│                                                    │
│  🤖 AI Interviewer:                               │
│  "How did you implement authentication in your     │
│   E-Commerce project?"                             │
│                                                    │
│  👤 You:                                           │
│  "I used JWT tokens for authentication. The user   │
│   logs in with email and password, and the server  │
│   returns a JWT which is stored in an httpOnly     │
│   cookie."                                         │
│                                                    │
│  [Evaluation]                                      │
│  ✓ Correctness: Good                              │
│  ✓ Depth: Moderate                                │
│  ✓ Clarity: Good                                  │
│                                                    │
│  🤖 AI Interviewer (Follow-up):                   │
│  "Why did you choose JWT over session-based        │
│   authentication? What are the trade-offs?"        │
│                                                    │
│  [Your Answer]                                     │
│  ┌──────────────────────────────────────────┐     │
│  │ Type your answer...                      │     │
│  │                                          │     │
│  └──────────────────────────────────────────┘     │
│  [Submit Answer]  [Skip Question]  [End Session]   │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### 7.13 AI Mock Interview UI

```
[Mock Interview Setup]
  Select Job: [Software Engineer at Acme Corp ▾]
  Interview Type: [Technical ▾]
  Duration: [30 minutes ▾]
  [Start Mock Interview →]

[During Interview — Full Screen Mode]
  (Same chat-like interface as follow-up questions)
  - Timer in header
  - Question counter
  - "End Interview" button always visible

[After Interview — Report]
  ┌────────────────────────────────────────────────┐
  │  Mock Interview Report                         │
  │  Software Engineer at Acme Corp                │
  │  Duration: 28 minutes · 8 questions            │
  ├────────────────────────────────────────────────┤
  │                                                │
  │  Overall Score:     ████████░░  78/100          │
  │  Technical Score:   ███████░░░  72/100          │
  │  Communication:     █████████░  85/100          │
  │                                                │
  │  Strengths:                                    │
  │  • Strong understanding of React fundamentals  │
  │  • Clear communication of project experience   │
  │                                                │
  │  Weaknesses:                                   │
  │  • Limited depth in system design answers      │
  │  • Could improve explanation of trade-offs     │
  │                                                │
  │  Improvement Suggestions:                      │
  │  1. Study system design patterns               │
  │  2. Practice explaining technical trade-offs   │
  │  3. Review distributed systems concepts        │
  │                                                │
  │  [Download Report]  [Practice Again]            │
  └────────────────────────────────────────────────┘
```

---

### 7.14 Application Tracker UI

```
[Page Title: "Applications"]

[Stats Row]
  Saved: 8 | Applied: 12 | Shortlisted: 3 | Interview: 2 | Offer: 1 | Rejected: 4

[Kanban Board View]
  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────┐ ┌─────────┐
  │  Saved   │ │  Applied │ │Shortlisted│ │Interview │ │Offer │ │Rejected │
  │          │ │          │ │           │ │          │ │      │ │         │
  │ [Card 1] │ │ [Card 3] │ │ [Card 5]  │ │ [Card 7] │ │[C 8] │ │ [Card 9]│
  │ [Card 2] │ │ [Card 4] │ │ [Card 6]  │ │          │ │      │ │         │
  │          │ │          │ │           │ │          │ │      │ │         │
  └──────────┘ └──────────┘ └───────────┘ └──────────┘ └──────┘ └─────────┘

  (Cards are draggable between columns)

[Alternative: Table View]
  | Job Title    | Company  | Status      | Applied  | Interview | Notes |
  |-------------|----------|-------------|----------|-----------|-------|
  | Frontend Dev | Acme     | Interview   | Sep 1    | Sep 10    | ...   |
  | SDE          | Beta     | Applied     | Aug 28   | —         | ...   |

[Application Detail — Side Panel or Modal]
  Job: Frontend Developer at Acme Corp
  Status: [Interview ▾]
  Applied: Sep 1, 2024
  Interview: Sep 10, 2024 at 2:00 PM
  Notes: "Second round, prepare system design"
  Match: 92%
  [View Job →]  [Add Note]  [Update Status]
```

---

### 7.15 Recruiter Dashboard

```
[Page Title: "Recruiter Dashboard"]

[Stats Row]
  Active Jobs: 5 | Total Applicants: 48 | Shortlisted: 12 | Interviews: 4

[Active Jobs — Card List]
  ┌──────────────────────────────────────────┐
  │ Software Engineer                         │
  │ 23 applicants · 8 shortlisted            │
  │ Posted: Sep 1 · Status: Active           │
  │ [View Applicants]  [Edit]  [Close Job]   │
  └──────────────────────────────────────────┘

[Recent Applicants]
  - Priya S. — Frontend Dev — 94% match — [View] [Shortlist] [Reject]
  - Rahul K. — Frontend Dev — 87% match — [View] [Shortlist] [Reject]

[Pipeline Chart]
  (Funnel visualization: Applied → Shortlisted → Interview → Offer)
```

### Recruiter Job Management

```
[Create/Edit Job Form]
  Job Title
  Description (rich text)
  Location
  Work Mode (Remote/Hybrid/Onsite)
  Employment Type (Full-time/Part-time/Contract/Internship)
  Experience Level (Fresher/Junior/Mid/Senior)
  Salary Range (optional)
  Required Skills [tag input]
  Preferred Skills [tag input]
  Application Deadline (optional)
  External Application URL (optional)
  [Post Job]  [Save Draft]
```

### Candidate Management

```
[Candidates for: Software Engineer]

[Filters]
  [Skill Filter ▾] [Experience ▾] [Match Score ▾] [Status ▾]

[Candidate Cards]
  ┌──────────────────────────────────────────┐
  │ Priya Sharma              [🎯 94% Match] │
  │ B.Tech CSE · 2 years exp                │
  │ [React] [Node.js] [TypeScript] [AWS ✗]  │
  │ Status: Shortlisted                      │
  │ [View Profile] [Schedule Interview]      │
  │                [Reject]                  │
  └──────────────────────────────────────────┘
```

---

### 7.16 Admin Dashboard

```
[Page Title: "Admin Dashboard"]

[Stats Cards]
  Total Users: 1,234 | Active Recruiters: 45 | Jobs Posted: 320 | Applications: 2,890

[Charts Row]
  [User Growth — Line Chart]  [Jobs by Category — Bar Chart]

[Recent Activity Feed]
  • New recruiter registered: TechCorp
  • Job flagged: "Data Entry" by user report
  • 12 new users today
```

### Admin Management Pages

```
[Users Management — Table]
  | Name  | Email | Role    | Status | Joined   | Actions            |
  |-------|-------|---------|--------|----------|--------------------|
  | Priya | p@... | Student | Active | Sep 2024 | [View] [Suspend]   |
  | Rahul | r@... | Recruiter| Active| Aug 2024 | [View] [Suspend]   |

  [Search]  [Filter by Role]  [Filter by Status]
  [Pagination]

[Companies Management — similar table]
[Jobs Management — similar table with moderation actions]
```

---

### 7.17 Notification UI

```
[Notification Bell — in sidebar header]
  🔔 (red badge with unread count)

[Notification Dropdown / Panel]
  ┌──────────────────────────────────────────┐
  │ Notifications              [Mark All Read]│
  ├──────────────────────────────────────────┤
  │ 🔵 New high-match job: Backend Developer │
  │    at TechCorp (91% match)               │
  │    2 hours ago                           │
  │                                          │
  │ ⚪ Resume analysis completed             │
  │    Your score: 78/100                    │
  │    Yesterday                             │
  │                                          │
  │ ⚪ Application update: Shortlisted for   │
  │    Frontend Dev at Acme Corp             │
  │    2 days ago                            │
  │                                          │
  │ [View All Notifications →]              │
  └──────────────────────────────────────────┘

[Full Notifications Page]
  (Same items but full width, paginated, with filters)
  [Filter: All | Unread | Jobs | Applications | Interview | System]
```

---

### 7.18 AI Assistant / Conversation UI

```
[Page Title: "AI Assistant"]

[Chat Interface — Full height]
  ┌────────────────────────────────────────────────┐
  │ 🤖 JobFit AI                                   │
  │                                                │
  │ "Hi Priya! I can help you with:"               │
  │ • Resume analysis and improvement              │
  │ • Job recommendations                          │
  │ • Interview preparation                        │
  │ • Career advice                                │
  │                                                │
  │ 👤 "What skills should I focus on for a         │
  │    frontend developer role?"                    │
  │                                                │
  │ 🤖 "Based on your resume and current market     │
  │    trends, here are the key skills..."          │
  │    (structured response with skill categories)  │
  │                                                │
  ├────────────────────────────────────────────────┤
  │ [Type your question...]           [Send →]     │
  └────────────────────────────────────────────────┘
```

---

## 8. Reusable Component System

### Core Components (shadcn/ui-based)

All components are built on shadcn/ui primitives, customized to the JobFit design system.

| Component | Usage |
|-----------|-------|
| `Button` | Primary, secondary, outline, ghost, destructive variants |
| `Input` | Text, email, password, with label and error state |
| `Textarea` | Multi-line text input |
| `Select` | Dropdown selection |
| `Checkbox` | Boolean toggle |
| `Badge` | Status indicators, skill tags, match scores |
| `Card` | Content containers — job cards, stat cards, info cards |
| `Dialog` | Confirmation, detail views |
| `Sheet` | Side panels, mobile navigation |
| `Tabs` | Page sections, content switching |
| `Table` | Data tables with sorting and pagination |
| `Tooltip` | Contextual information |
| `Avatar` | User/company initials or image |
| `Progress` | Scores, completion bars |
| `Skeleton` | Loading states |
| `Toast` | Success/error notifications |
| `Popover` | Filter dropdowns, quick actions |
| `Command` | Search/command palette |
| `Separator` | Visual dividers |
| `ScrollArea` | Scrollable containers |
| `DropdownMenu` | Action menus |
| `AlertDialog` | Destructive action confirmation |

### Custom JobFit Components

| Component | Props | Usage |
|-----------|-------|-------|
| `MatchScore` | `score: number` | Circular/linear score display with color |
| `SkillTag` | `name, matched?, level?` | Color-coded skill badge |
| `JobCard` | `job, matchScore?` | Job listing card |
| `StatCard` | `title, value, icon, trend?` | Dashboard stat widget |
| `ScoreBreakdown` | `breakdown: {}` | Multi-bar match breakdown |
| `EmptyState` | `icon, title, description, action?` | Empty content placeholder |
| `PageHeader` | `title, description?, actions?` | Consistent page titles |
| `SidebarNav` | `items, role` | Role-based sidebar |
| `InterviewChat` | `messages, onSend` | Chat-style interview UI |
| `RadarChart` | `skills[]` | Skill gap spider chart |
| `KanbanBoard` | `columns, cards` | Application tracker board |
| `FileUpload` | `accept, maxSize, onUpload` | Drag-and-drop file upload |
| `PDFViewer` | `url` | Resume preview |

---

## 9. State Patterns

### Loading States

- **Page load**: Full-page skeleton (matching final layout structure)
- **Section load**: Section-specific skeleton
- **Button action**: Button shows spinner, text changes to "Loading..."
- **Data fetch**: Skeleton cards/rows replace actual content
- **File upload**: Progress bar with percentage

### Skeleton States

Every data-dependent component has a skeleton variant:
- `JobCard.Skeleton` — gray rectangles matching card layout
- `StatCard.Skeleton` — pulsing gray blocks
- `Table.Skeleton` — pulsing rows
- Skeletons pulse with a subtle shimmer animation

### Empty States

Every list/collection has a meaningful empty state:
```
[Illustration/Icon — muted]
[Title — "No jobs found"]
[Description — "Try adjusting your filters or check back later."]
[Action — "Clear Filters" or "Upload Resume"]
```

Specific empty states:
- No resume: "Upload your resume to get started"
- No jobs: "No jobs match your current filters"
- No applications: "You haven't applied to any jobs yet"
- No notifications: "You're all caught up!"
- No DSA progress: "Start practicing to see your progress"

### Error States

```
[Error Icon — red circle with exclamation]
[Title — "Something went wrong"]
[Description — specific error message]
[Action — "Try Again" button]
```

- Form validation: Inline red text below input, red border
- API errors: Toast notification for transient errors, inline for persistent
- 404: Custom "Page not found" page
- 500: Custom "Something went wrong" page with retry

### Success States

- Form submission: Green toast "Changes saved successfully"
- File upload: Green checkmark with "Resume uploaded successfully"
- Application action: Toast confirmation
- Interview complete: Transition to report page with celebration animation

---

## 10. Responsive / Mobile Behavior

| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Sidebar | Fixed, expanded (256px) | Collapsed (64px icons) | Hidden, hamburger menu |
| Job grid | 3 columns | 2 columns | 1 column |
| Dashboard stats | 4 in row | 2x2 grid | 1 column stack |
| Tables | Full table | Horizontal scroll | Card view |
| Kanban | All columns | Horizontal scroll | Tab per column |
| Interview chat | 60% width centered | 80% width | Full width |
| PDF viewer | Inline preview | Inline preview | Full screen modal |
| Filters | Inline row | Collapsible row | Bottom sheet |
| Forms | 2-column | 2-column | 1-column |

### Mobile-Specific Patterns

- Bottom navigation bar (5 items): Dashboard, Jobs, Resume, Interview, More
- Pull-to-refresh on list pages
- Swipe actions on cards (save, dismiss)
- Floating action button for primary actions (upload resume, apply)
- Full-screen modals instead of side panels

---

## 11. Accessibility Requirements

### WCAG 2.1 AA Compliance

- **Color contrast**: All text meets 4.5:1 ratio (body), 3:1 ratio (large text)
- **Focus indicators**: Visible focus rings on all interactive elements (2px solid primary-500)
- **Keyboard navigation**: Tab order follows visual order, all actions keyboard accessible
- **Screen reader**: Proper ARIA labels, roles, and live regions
- **Alt text**: All images and icons have descriptive alt text
- **Semantic HTML**: Proper heading hierarchy (h1 → h2 → h3), landmark regions
- **Form labels**: Every input has an associated label (visible or sr-only)
- **Error announcements**: Form errors announced to screen readers
- **Skip links**: "Skip to main content" link at top of page
- **Motion**: Respect `prefers-reduced-motion` media query
- **Touch targets**: Minimum 44x44px on mobile

---

## 12. UX Flows & Navigation Rules

### Post-Login Routing

| Role | Default Route |
|------|---------------|
| Student | `/dashboard` |
| Recruiter | `/recruiter/dashboard` |
| Admin | `/admin/dashboard` |

### Resume-First Flow

If a student has not uploaded a resume:
1. Dashboard shows a prominent "Upload Resume" CTA
2. Job matching, skill gap, and interview features show empty states directing to resume upload
3. AI assistant gently redirects: "To help you better, please upload your resume first."

### Job Application Flow

```
View Job → Click "Apply" → Confirm redirect modal → Open original URL in new tab
                         → Application status set to "Applied"
                         → Added to application tracker
```

### Navigation Guards

- Unauthenticated users: Redirect to `/login` with return URL
- Student accessing recruiter routes: Redirect to `/dashboard` with toast
- Recruiter accessing admin routes: Redirect to `/recruiter/dashboard` with toast
- Admin can access all routes

### Breadcrumb Rules

- Every page beyond the top level shows breadcrumbs
- Format: `Home > Section > Subsection > Current Page`
- Each crumb is a clickable link except the current page

### Transition Animations

- Page transitions: Subtle fade (150ms)
- Modal/dialog: Fade + scale up (200ms)
- Sidebar collapse: Width transition (200ms)
- Card hover: translateY(-2px) + shadow increase (150ms)
- Skeleton shimmer: Continuous pulse (1.5s)
- Toast: Slide in from top-right (300ms), auto-dismiss (5s)
- Progress bar: Animated fill (300ms ease-out)

### Toast / Notification Rules

- Success: Green, auto-dismiss 5s
- Error: Red, persist until dismissed or 10s
- Info: Blue, auto-dismiss 5s
- Warning: Amber, auto-dismiss 8s
- Maximum 3 toasts visible at once, stack vertically
- Position: Top-right on desktop, top-center on mobile
