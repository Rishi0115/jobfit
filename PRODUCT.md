# JobFit — Product Implementation Plan

> **Source of Truth**: [PROJECT_SPEC.md](file:///d:/projects/JobFit/PROJECT_SPEC.md)
> This document translates the product specification into an actionable product plan.

---

## 1. Product Vision

**"Upload your resume once, and JobFit becomes your personalized career assistant."**

JobFit is an AI-powered career and job matching platform that transforms a single resume upload into a comprehensive career preparation pipeline. It bridges the gap between a job seeker's current profile and their target career by providing intelligent job matching, skill gap analysis, personalized interview preparation, and application tracking — all powered by a combination of deterministic algorithms and AI assistance.

### What JobFit Is

- A resume-centric career platform for students and job seekers
- An AI-enhanced (not AI-dependent) job matching engine
- A personalized interview and DSA preparation tool
- A job aggregation platform using only authorized sources
- A recruiter-facing candidate discovery and management tool

### What JobFit Is NOT

- A job board that scrapes unauthorized sources
- A tool that fabricates resume content or skills
- A replacement for actual learning — it recommends, not teaches
- A fully AI-dependent platform — core matching is deterministic

---

## 2. Target Users / Personas

### Persona 1: Student / Job Seeker (Primary)

**Name**: Priya — Final-year CS student
**Goals**: Find relevant jobs, improve resume, prepare for interviews
**Pain Points**: Doesn't know which jobs match her skills, spends hours tailoring resumes, unsure what to study for interviews
**JobFit Value**: Upload resume once → get matched jobs, skill gaps, DSA plan, interview prep

### Persona 2: Recruiter

**Name**: Rahul — Startup hiring manager
**Goals**: Find qualified candidates quickly, manage applications efficiently
**Pain Points**: Sifting through hundreds of resumes, no standardized candidate scoring
**JobFit Value**: Post jobs → get ranked candidates with transparent match scores → manage pipeline

### Persona 3: Admin

**Name**: Platform administrator
**Goals**: Ensure platform health, manage users, moderate content
**Pain Points**: Need visibility into platform activity, user management overhead
**JobFit Value**: Centralized dashboard for user/company/job management and analytics

---

## 3. Problems JobFit Solves

| Problem | Solution |
|---------|----------|
| Students don't know which jobs match their skills | AI-enhanced matching engine with Top 10 recommendations |
| Resumes lack ATS optimization | ATS compatibility scoring and improvement suggestions |
| No clarity on skill gaps | Visual skill gap analysis with prioritized learning roadmap |
| Generic interview preparation | Personalized questions from resume + job description |
| No follow-up depth in practice | Dynamic AI follow-up questions based on answers |
| Scattered job applications | Centralized application tracker with status management |
| Recruiters can't efficiently find candidates | Transparent candidate scoring and filtering |
| DSA prep is not targeted | Personalized DSA based on role, skills, and gaps |

---

## 4. Complete User Journeys

### 4.1 Student / Job Seeker Journey

```
Registration/Login
    ↓
Profile Setup (name, target role, preferences)
    ↓
Resume Upload
    ↓
Automatic Resume Parsing & Analysis
    ↓
View Resume Score + ATS Score + Strengths/Weaknesses
    ↓
Browse Job Discovery / View Top 10 Matches
    ↓
View Job Detail → See Match % + Matched/Missing Skills
    ↓
"Analyze My Resume Against This Job"
    ↓
View Skill Gap Analysis → Prioritized Learning Roadmap
    ↓
Get Resume Improvement Suggestions (for specific job)
    ↓
Practice Personalized DSA (based on target role + gaps)
    ↓
Generate Interview Questions (resume-based + job-based)
    ↓
Practice with Dynamic Follow-up Questions
    ↓
Conduct AI Mock Interview → Receive Feedback Report
    ↓
Save/Apply to Jobs → Track Applications
    ↓
Receive Notifications (new matches, status changes, reminders)
```

### 4.2 Recruiter Journey

```
Registration/Login
    ↓
Create/Edit Company Profile
    ↓
Post Jobs (title, description, skills, requirements)
    ↓
View Applicants → See Candidate JobFit Scores
    ↓
Search/Filter Candidates by Skills, Score, Experience
    ↓
Shortlist or Reject Candidates
    ↓
Schedule Interviews
    ↓
Track Application Pipeline
    ↓
Close/Archive Jobs
```

### 4.3 Admin Journey

```
Login (admin credentials)
    ↓
View Platform Dashboard (analytics, activity)
    ↓
Manage Users (view, suspend, delete)
    ↓
Manage Recruiters (approve, suspend)
    ↓
Manage Companies (verify, edit, remove)
    ↓
Manage Jobs (review, remove problematic listings)
    ↓
Manage Job Sources (configure, enable/disable)
    ↓
Manage Reported Content
    ↓
View Analytics (user growth, jobs posted, applications, AI usage)
```

---

## 5. Feature / Module Breakdown

### 5.1 Core / MVP Features (Must-Have)

These features form the minimum viable product and must be implemented first.

| # | Feature | Module |
|---|---------|--------|
| C1 | User registration and login (Student, Recruiter, Admin) | Auth |
| C2 | Role-based access control | Auth |
| C3 | Student profile management | Profile |
| C4 | Resume upload (PDF) | Resume |
| C5 | Resume text extraction and parsing | Resume |
| C6 | Resume structured data storage | Resume |
| C7 | Resume score and ATS compatibility score | Resume Analysis |
| C8 | Resume strengths/weaknesses identification | Resume Analysis |
| C9 | Resume improvement suggestions | Resume Analysis |
| C10 | Job listing and browsing | Jobs |
| C11 | Job detail page | Jobs |
| C12 | Recruiter job posting | Jobs |
| C13 | Job matching engine (deterministic) | Matching |
| C14 | Top 10 matched jobs | Matching |
| C15 | Match score with breakdown | Matching |
| C16 | Matched/missing skills display | Matching |
| C17 | Save jobs | Applications |
| C18 | Application status tracking | Applications |
| C19 | Student dashboard | UI |
| C20 | Landing page | UI |

### 5.2 Major Features

| # | Feature | Module |
|---|---------|--------|
| M1 | Resume vs specific job analysis | Resume Analysis |
| M2 | Skill gap analysis with categorization | Skill Gap |
| M3 | Personalized learning roadmap | Skill Gap |
| M4 | Job aggregation from authorized sources | Job Aggregation |
| M5 | Job normalization and deduplication | Job Aggregation |
| M6 | Resume-based interview question generation | Interview |
| M7 | Job-based interview question generation | Interview |
| M8 | Interview answer evaluation | Interview |
| M9 | Recruiter dashboard | Recruiter |
| M10 | Candidate search and filtering | Recruiter |
| M11 | Candidate shortlisting/rejection | Recruiter |
| M12 | Application pipeline tracking (recruiter) | Recruiter |
| M13 | Admin dashboard with analytics | Admin |
| M14 | User/company/job management (admin) | Admin |
| M15 | In-app notifications | Notifications |

### 5.3 Advanced Features

| # | Feature | Module |
|---|---------|--------|
| A1 | Dynamic follow-up interview questions | Interview |
| A2 | AI mock interview with final report | Interview |
| A3 | Personalized DSA preparation | DSA |
| A4 | DSA progress tracking | DSA |
| A5 | AI career recommendations | AI |
| A6 | Semantic/AI-enhanced job matching | Matching |
| A7 | Interview scheduling (recruiter) | Recruiter |
| A8 | AI assistant/conversation interface | AI |
| A9 | Application analytics dashboard | Applications |
| A10 | Email-ready notification architecture | Notifications |

---

## 6. User Stories

### Authentication & Profile

| ID | Story | Priority |
|----|-------|----------|
| US-01 | As a student, I can register with email and password so I can access the platform | P0 |
| US-02 | As a student, I can log in so I can access my dashboard | P0 |
| US-03 | As a student, I can edit my profile (name, target role, location, preferences) | P0 |
| US-04 | As a recruiter, I can register and create a company profile | P0 |
| US-05 | As an admin, I can log in and access admin-only pages | P0 |
| US-06 | As a user, I can reset my forgotten password | P1 |

### Resume

| ID | Story | Priority |
|----|-------|----------|
| US-10 | As a student, I can upload my resume (PDF) and it is securely stored | P0 |
| US-11 | As a student, I can view my uploaded resume | P0 |
| US-12 | As a student, I can replace/update my resume | P0 |
| US-13 | As a student, my resume is automatically parsed into structured data after upload | P0 |
| US-14 | As a student, I can view the extracted information from my resume | P0 |
| US-15 | As a student, I can see my resume score (0-100) | P0 |
| US-16 | As a student, I can see my ATS compatibility score | P0 |
| US-17 | As a student, I can see strengths and weaknesses of my resume | P0 |
| US-18 | As a student, I can get actionable suggestions to improve my resume | P0 |
| US-19 | As a student, I can compare my resume against a specific job | P1 |

### Jobs

| ID | Story | Priority |
|----|-------|----------|
| US-20 | As a visitor, I can browse available job listings | P0 |
| US-21 | As a visitor, I can view job details | P0 |
| US-22 | As a student, I can see my Top 10 matched jobs | P0 |
| US-23 | As a student, I can see the match percentage for each job | P0 |
| US-24 | As a student, I can see matched and missing skills for a job | P0 |
| US-25 | As a student, I can see a match breakdown (skills, experience, education, other) | P0 |
| US-26 | As a student, I can click "Apply" to reach the original application URL | P0 |
| US-27 | As a student, I can save a job for later | P0 |
| US-28 | As a student, I can "Analyze My Resume Against This Job" | P1 |
| US-29 | As a recruiter, I can post a new job with full details | P0 |
| US-30 | As a recruiter, I can edit or close my posted jobs | P0 |

### Skill Gap

| ID | Story | Priority |
|----|-------|----------|
| US-35 | As a student, I can see my skill gaps compared to target jobs | P1 |
| US-36 | As a student, I can see skills categorized as Strong/Good/Needs Improvement/Missing | P1 |
| US-37 | As a student, I can see skill priorities (High/Medium/Low) | P1 |
| US-38 | As a student, I can get a personalized learning roadmap | P1 |

### Interview & DSA

| ID | Story | Priority |
|----|-------|----------|
| US-40 | As a student, I can generate interview questions from my resume | P1 |
| US-41 | As a student, I can generate interview questions from a job description | P1 |
| US-42 | As a student, I can answer questions and get AI evaluation | P1 |
| US-43 | As a student, I receive dynamic follow-up questions based on my answers | P2 |
| US-44 | As a student, I can conduct a full AI mock interview and receive a report | P2 |
| US-45 | As a student, I can practice personalized DSA problems | P2 |
| US-46 | As a student, I can track my DSA progress by topic and difficulty | P2 |

### Applications

| ID | Story | Priority |
|----|-------|----------|
| US-50 | As a student, I can save jobs | P0 |
| US-51 | As a student, I can mark a job as applied | P0 |
| US-52 | As a student, I can update application status (Saved→Applied→Shortlisted→Interview→Offer/Rejected) | P1 |
| US-53 | As a student, I can add notes to an application | P1 |
| US-54 | As a student, I can add interview dates | P1 |
| US-55 | As a student, I can view application analytics on my dashboard | P1 |

### Recruiter

| ID | Story | Priority |
|----|-------|----------|
| US-60 | As a recruiter, I can view applicants for my jobs | P1 |
| US-61 | As a recruiter, I can see candidate JobFit scores | P1 |
| US-62 | As a recruiter, I can search and filter candidates | P1 |
| US-63 | As a recruiter, I can shortlist or reject candidates | P1 |
| US-64 | As a recruiter, I can schedule interviews | P2 |
| US-65 | As a recruiter, I can track my application pipeline | P1 |

### Admin

| ID | Story | Priority |
|----|-------|----------|
| US-70 | As an admin, I can view platform analytics | P1 |
| US-71 | As an admin, I can manage (view/suspend/delete) users | P1 |
| US-72 | As an admin, I can manage companies | P1 |
| US-73 | As an admin, I can manage job listings | P1 |
| US-74 | As an admin, I can manage job sources | P2 |
| US-75 | As an admin, I can manage reported content | P2 |

### Notifications

| ID | Story | Priority |
|----|-------|----------|
| US-80 | As a student, I receive notification when resume analysis completes | P1 |
| US-81 | As a student, I receive notification for new high-match jobs | P2 |
| US-82 | As a student, I receive notification for application status changes | P1 |
| US-83 | As a student, I receive notification for scheduled interviews | P2 |

---

## 7. Feature Acceptance Criteria

### Resume Upload (US-10)

- Accepts PDF files only (initially)
- Max file size: 5MB
- File is stored in S3-compatible storage
- Original filename is preserved in metadata
- Upload progress is shown to user
- Success/failure feedback is displayed
- Resume text extraction begins automatically
- Previous resume is archived (not deleted) on replacement

### Resume Analysis (US-15, US-16, US-17, US-18)

- Resume score is 0-100 with clear criteria
- ATS score is 0-100 based on keyword density, formatting, section completeness
- At least 3 strengths and 3 weaknesses are identified
- At least 5 actionable improvement suggestions are provided
- AI never fabricates skills, experience, or education
- Analysis completes within 30 seconds
- Results are cached and re-generated only on resume update

### Job Matching (US-22, US-23, US-24, US-25)

- Match score is 0-100%
- Score uses deterministic algorithm as primary engine
- Breakdown shows: Skills (70%), Experience (15%), Education (5%), Other (10%)
- Required skills are weighted higher than preferred skills
- Top 10 jobs are ranked by match score descending
- Matched and missing skills are explicitly listed
- Matching recalculates when resume or profile changes

### Application Tracking (US-50, US-51, US-52)

- Status transitions: Saved → Applied → Shortlisted → Interview → Offer | Rejected
- Users can add free-text notes per application
- Users can set interview date/time per application
- Dashboard shows counts per status and recent activity

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Resume upload → analysis completion | < 30 seconds |
| Job match calculation for Top 10 | < 5 seconds |
| User can complete core journey (upload → matched jobs) | < 5 minutes |
| Resume analysis accuracy (no fabricated data) | 100% |
| Application status tracking adoption | > 60% of active users |
| Interview question relevance (user rating) | > 4/5 |
| Platform uptime | > 99% |

---

## 9. Scope Boundaries

### In Scope

- Everything defined in PROJECT_SPEC.md sections 1-23
- PDF resume upload (primary format)
- In-app notifications
- Recruiter job posting (manual)
- Job aggregation via authorized APIs/feeds only
- Deterministic job matching with optional AI enhancement
- AI-powered resume analysis, interview prep, DSA personalization

### Out of Scope

- Mobile native app
- Video interviews
- Real-time chat between students and recruiters
- Payment/subscription system
- Resume builder/editor (JobFit analyzes existing resumes)
- Unauthorized scraping of LinkedIn, Wellfound, Indeed, or similar platforms
- Social networking features
- Third-party calendar integration (v1)
- SMS notifications (v1)
- Multi-language support (v1)

---

## 10. Job Aggregation Constraints

### Authorized Sources Strategy

| Source Type | Strategy | Priority |
|------------|----------|----------|
| Recruiter-created jobs | Direct database insertion via recruiter portal | P0 (MVP) |
| Authorized public APIs | Integrate APIs that provide official access (e.g., Adzuna, The Muse, Remotive, GitHub Jobs) | P1 |
| RSS/Atom job feeds | Consume publicly available job feeds | P1 |
| Company career pages (with permission) | Integrate via official ATS APIs (Greenhouse, Lever, Workable) where they provide public API access | P2 |
| Government job portals | Use official government job APIs where available | P2 |

### Constraints

1. **Never scrape** LinkedIn, Wellfound, Indeed, Glassdoor, or any platform without explicit API/feed authorization
2. Architecture must be source-independent — every source implements the same adapter interface
3. All jobs normalize to the standard job schema regardless of source
4. External source ID and original application URL must be preserved
5. Jobs must be deduplicated across sources
6. Expired/removed jobs must be handled gracefully

---

## 11. AI vs Deterministic Responsibilities

### AI Responsibilities

| Function | AI Role | Constraint |
|----------|---------|------------|
| Resume parsing | Extract structured data from free text | Must not fabricate information |
| Resume analysis | Score, strengths, weaknesses, suggestions | Must base on actual resume content |
| Resume improvement | Suggest better wording, keywords, structure | Must not invent new skills/experience |
| Interview question generation | Generate relevant questions from resume/job | Must be contextually accurate |
| Interview evaluation | Assess answer quality | Must provide structured feedback |
| Dynamic follow-up | Generate contextual follow-up questions | Must relate to previous answer |
| Mock interview | Conduct full interview simulation | Must follow structured flow |
| DSA personalization | Select and prioritize DSA topics | Must align with user's skill level |
| Career recommendations | Suggest learning paths | Must base on actual skill gaps |

### Deterministic / Non-AI Responsibilities

| Function | Approach |
|----------|----------|
| Job matching score | Weighted deterministic algorithm (skills overlap, experience match, location, work mode) |
| Top 10 ranking | Sort by deterministic match score |
| Skill gap calculation | Set comparison (user skills vs job requirements) |
| Application state management | State machine transitions |
| Notification triggers | Event-based rules |
| User authentication | Auth.js standard flows |
| Role-based access | Middleware + database role checks |
| File validation | Server-side MIME type and size checks |
| Job deduplication | Hash-based comparison of title + company + source |

---

## 12. Important Product Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary matching engine | Deterministic with optional AI enhancement | Predictable, explainable, cost-effective |
| Resume format | PDF only (v1) | Most common format, reliable text extraction |
| Job application flow | Redirect to original URL | JobFit is a discovery platform, not an ATS |
| AI provider | OpenAI or Gemini (abstracted) | Provider-agnostic service layer allows switching |
| File storage | S3-compatible object storage | Industry standard, scalable, secure |
| Notification channel | In-app only (v1), email-ready architecture | Start simple, expand later |
| Recruiter verification | Admin-approved | Prevent spam job postings |
| Skill taxonomy | Free-text with normalization | Flexible, no pre-built taxonomy dependency |
| DSA questions | AI-generated per user | Personalized, not a static bank |

---

## 13. Feature Dependencies

```
Auth ──────────────┐
                   ↓
Profile ───────→ Resume Upload
                   ↓
              Resume Parsing
                   ↓
             Resume Analysis
                   ↓
         ┌─────────┼──────────┐
         ↓         ↓          ↓
   Job Matching   Skill Gap   Interview Prep
         ↓         ↓          ↓
   Top 10 Jobs   Learning    Dynamic Follow-up
         ↓       Roadmap      ↓
   Job Details              Mock Interview
         ↓
   Applications ──→ Application Tracker
         ↓
   Notifications

Recruiter Module:
   Auth → Company Profile → Job Posting → Candidate View → Pipeline

Admin Module:
   Auth → Dashboard → User/Company/Job Management → Analytics
```

---

## 14. Recommended Implementation Order

| Phase | Module | Depends On | Deliverable |
|-------|--------|------------|-------------|
| 0 | Project Setup | — | Next.js project, folder structure, Prisma, Docker, env config |
| 1 | Auth & RBAC | Phase 0 | Login, register, role-based middleware, protected routes |
| 2 | Database & Core Models | Phase 0 | All Prisma models, migrations, seed data |
| 3 | Profile & Resume Upload | Phase 1, 2 | Profile CRUD, file upload to S3, resume storage |
| 4 | Resume Parsing & Analysis | Phase 3 | AI-powered parsing, scoring, strengths/weaknesses |
| 5 | Core UI & Dashboards | Phase 1 | Landing page, student dashboard, layout, navigation |
| 6 | Job System | Phase 2, 5 | Job CRUD (recruiter), job listing, job detail, source adapters |
| 7 | Job Matching | Phase 4, 6 | Deterministic matching, Top 10, match breakdown |
| 8 | Skill Gap & Resume Improvement | Phase 4, 7 | Skill comparison, learning roadmap, AI suggestions |
| 9 | Interview Preparation | Phase 4 | Question generation, answer evaluation |
| 10 | Dynamic Follow-up & Mock Interview | Phase 9 | Follow-up logic, mock interview flow, feedback reports |
| 11 | DSA | Phase 4 | Personalized DSA, progress tracking |
| 12 | Application Tracking | Phase 7 | Save/apply, status management, analytics |
| 13 | Recruiter Module | Phase 6 | Recruiter dashboard, candidate management, pipeline |
| 14 | Admin Module | Phase 1, 2 | Admin dashboard, user/company/job management |
| 15 | Notifications | Phase 1 | In-app notifications, event triggers |
| 16 | Testing & Polish | All | Unit tests, integration tests, E2E, security hardening |
| 17 | Deployment | Phase 16 | CI/CD, Vercel deployment, production config |
