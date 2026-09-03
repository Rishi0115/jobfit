import {
  Role,
  WorkMode,
  EmploymentType,
  ExperienceLevel,
  ApplicationStatus,
  SkillProficiency,
  SkillCategory,
  DSADifficulty,
  DSAStatus,
  InterviewType,
  InterviewStatus,
  QuestionCategory,
  NotificationType,
  JobStatus,
  ResumeStatus,
} from "@prisma/client";

export type UserRole = Role;
export type UserWorkMode = WorkMode;
export type UserEmploymentType = EmploymentType;
export type UserExperienceLevel = ExperienceLevel;
export type UserApplicationStatus = ApplicationStatus;
export type UserSkillProficiency = SkillProficiency;
export type UserSkillCategory = SkillCategory;
export type UserDSADifficulty = DSADifficulty;
export type UserDSAStatus = DSAStatus;
export type UserInterviewType = InterviewType;
export type UserInterviewStatus = InterviewStatus;
export type UserQuestionCategory = QuestionCategory;
export type UserNotificationType = NotificationType;
export type UserJobStatus = JobStatus;
export type UserResumeStatus = ResumeStatus;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  image?: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | Record<string, string[]>;
}

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: string | number;
  disabled?: boolean;
}
