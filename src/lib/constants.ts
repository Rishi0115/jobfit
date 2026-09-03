export const APP_CONFIG = {
  name: "JobFit",
  description: "AI-Powered Career & Job Matching Platform",
  tagline: "Your AI-Powered Career Assistant",
  version: "0.1.0",
} as const;

export const ROLES = {
  STUDENT: "STUDENT",
  RECRUITER: "RECRUITER",
  ADMIN: "ADMIN",
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  STUDENT: {
    DASHBOARD: "/dashboard",
    PROFILE: "/profile",
    RESUME: "/resume",
    JOBS: "/jobs",
    TOP_MATCHES: "/jobs/top-matches",
    APPLICATIONS: "/applications",
    SKILL_GAP: "/skill-gap",
    DSA: "/dsa",
    INTERVIEW: "/interview",
    AI_ASSISTANT: "/ai-assistant",
    NOTIFICATIONS: "/notifications",
  },
  RECRUITER: {
    DASHBOARD: "/recruiter/dashboard",
    JOBS: "/recruiter/jobs",
    CANDIDATES: "/recruiter/candidates",
    APPLICATIONS: "/recruiter/applications",
    INTERVIEWS: "/recruiter/interviews",
  },
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    COMPANIES: "/admin/companies",
    JOBS: "/admin/jobs",
    ANALYTICS: "/admin/analytics",
  },
} as const;

export const RESUME_LIMITS = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ],
  ALLOWED_EXTENSIONS: [".pdf", ".docx", ".doc"],
} as const;
