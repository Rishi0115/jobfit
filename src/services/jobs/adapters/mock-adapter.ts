/**
 * Mock Job Adapter — Deterministic test data for local development.
 *
 * Returns realistic tech jobs with no network calls.
 * Used for testing the ingestion pipeline and populating dev databases.
 */

import { BaseJobAdapter } from "./base-adapter";
import type { RawJob, FetchOptions, AdapterResult } from "./types";

const MOCK_JOBS: RawJob[] = [
  {
    externalId: "mock-001",
    title: "Senior Frontend Developer",
    company: "TechCorp Solutions",
    companyWebsite: "https://techcorp.example.com",
    description:
      "We are looking for a Senior Frontend Developer to join our team. You will be responsible for building and maintaining our web applications using React, Next.js, and TypeScript. The ideal candidate has 4+ years of experience with modern frontend frameworks, strong understanding of web performance, and experience with design systems.\n\nResponsibilities:\n- Build and maintain React/Next.js applications\n- Implement responsive designs from Figma specs\n- Write unit and integration tests\n- Mentor junior developers\n- Participate in code reviews and architecture discussions",
    location: "Bangalore, India",
    workMode: "HYBRID",
    employmentType: "FULL_TIME",
    experienceLevel: "SENIOR",
    salaryMin: 2000000,
    salaryMax: 3500000,
    salaryCurrency: "INR",
    requiredSkills: ["React", "TypeScript", "Next.js", "CSS", "HTML"],
    preferredSkills: ["GraphQL", "Tailwind CSS", "Testing Library"],
    applicationUrl: "https://techcorp.example.com/careers/senior-frontend",
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
  },
  {
    externalId: "mock-002",
    title: "Backend Engineer",
    company: "DataFlow Inc",
    companyWebsite: "https://dataflow.example.com",
    description:
      "Join our backend engineering team to build scalable APIs and microservices. You will work with Node.js, PostgreSQL, and Redis to power our real-time data processing platform.\n\nWhat you'll do:\n- Design and implement RESTful APIs\n- Optimize database queries and data models\n- Build event-driven architectures\n- Monitor and improve system performance\n- Collaborate with frontend and mobile teams",
    location: "Mumbai, India",
    workMode: "REMOTE",
    employmentType: "FULL_TIME",
    experienceLevel: "MID",
    salaryMin: 1500000,
    salaryMax: 2500000,
    salaryCurrency: "INR",
    requiredSkills: ["Node.js", "PostgreSQL", "REST API", "TypeScript"],
    preferredSkills: ["Redis", "Docker", "Kubernetes", "AWS"],
    applicationUrl: "https://dataflow.example.com/jobs/backend-engineer",
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
  },
  {
    externalId: "mock-003",
    title: "Full Stack Developer",
    company: "StartupHub",
    companyWebsite: "https://startuphub.example.com",
    description:
      "We're a fast-growing startup looking for a Full Stack Developer to own features end-to-end. You will work across the entire stack — from designing database schemas to building beautiful UIs.\n\nTech Stack:\n- Frontend: React, Next.js, Tailwind CSS\n- Backend: Node.js, Express\n- Database: PostgreSQL, Prisma\n- Infra: Vercel, AWS",
    location: "Delhi, India",
    workMode: "ONSITE",
    employmentType: "FULL_TIME",
    experienceLevel: "MID",
    salaryMin: 1200000,
    salaryMax: 2000000,
    salaryCurrency: "INR",
    requiredSkills: ["React", "Node.js", "PostgreSQL", "TypeScript"],
    preferredSkills: ["Next.js", "Prisma", "Tailwind CSS"],
    applicationUrl: "https://startuphub.example.com/careers/fullstack",
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    externalId: "mock-004",
    title: "DevOps Engineer",
    company: "CloudNine Technologies",
    companyWebsite: "https://cloudnine.example.com",
    description:
      "We need a DevOps Engineer to manage our cloud infrastructure and CI/CD pipelines. You will work with AWS, Terraform, and GitHub Actions to ensure reliable, scalable deployments.\n\nResponsibilities:\n- Manage AWS infrastructure (ECS, RDS, S3, CloudFront)\n- Build and maintain CI/CD pipelines\n- Implement monitoring and alerting\n- Automate infrastructure with Terraform\n- Ensure security best practices",
    location: "Hyderabad, India",
    workMode: "HYBRID",
    employmentType: "FULL_TIME",
    experienceLevel: "SENIOR",
    salaryMin: 2500000,
    salaryMax: 4000000,
    salaryCurrency: "INR",
    requiredSkills: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD"],
    preferredSkills: ["GitHub Actions", "Prometheus", "Grafana"],
    applicationUrl: "https://cloudnine.example.com/openings/devops",
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
  },
  {
    externalId: "mock-005",
    title: "Junior React Developer",
    company: "WebCraft Studios",
    companyWebsite: "https://webcraft.example.com",
    description:
      "Great opportunity for a junior developer to kickstart their career! We're looking for someone who is passionate about frontend development and eager to learn.\n\nRequirements:\n- Basic understanding of React and JavaScript\n- Familiarity with HTML/CSS\n- Eagerness to learn and grow\n- Good communication skills\n\nWe offer mentorship, code reviews, and a supportive learning environment.",
    location: "Pune, India",
    workMode: "ONSITE",
    employmentType: "FULL_TIME",
    experienceLevel: "JUNIOR",
    salaryMin: 400000,
    salaryMax: 800000,
    salaryCurrency: "INR",
    requiredSkills: ["React", "JavaScript", "HTML", "CSS"],
    preferredSkills: ["TypeScript", "Git"],
    applicationUrl: "https://webcraft.example.com/careers/junior-react",
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  },
  {
    externalId: "mock-006",
    title: "Data Scientist",
    company: "AnalyticsAI",
    companyWebsite: "https://analyticsai.example.com",
    description:
      "We are seeking a Data Scientist to join our ML team. You'll work on building predictive models, analyzing large datasets, and deploying ML pipelines.\n\nWhat we expect:\n- Strong background in statistics and machine learning\n- Experience with Python, pandas, scikit-learn\n- Familiarity with deep learning frameworks\n- SQL proficiency for data extraction",
    location: "Bangalore, India",
    workMode: "REMOTE",
    employmentType: "FULL_TIME",
    experienceLevel: "MID",
    salaryMin: 1800000,
    salaryMax: 3000000,
    salaryCurrency: "INR",
    requiredSkills: ["Python", "Machine Learning", "SQL", "Pandas"],
    preferredSkills: ["TensorFlow", "PyTorch", "AWS SageMaker"],
    applicationUrl: "https://analyticsai.example.com/jobs/data-scientist",
    postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
  {
    externalId: "mock-007",
    title: "Mobile App Developer (React Native)",
    company: "AppForge",
    companyWebsite: "https://appforge.example.com",
    description:
      "Build cross-platform mobile applications using React Native. You will own the mobile app from design to deployment on both iOS and Android.\n\nRequirements:\n- 2+ years of React Native experience\n- Published at least one app on App Store or Play Store\n- Experience with native modules and bridging\n- Strong debugging skills",
    location: "Chennai, India",
    workMode: "HYBRID",
    employmentType: "FULL_TIME",
    experienceLevel: "MID",
    salaryMin: 1400000,
    salaryMax: 2200000,
    salaryCurrency: "INR",
    requiredSkills: ["React Native", "JavaScript", "TypeScript", "iOS", "Android"],
    preferredSkills: ["Redux", "Firebase", "REST API"],
    applicationUrl: "https://appforge.example.com/careers/rn-developer",
    postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  },
  {
    externalId: "mock-008",
    title: "Software Engineering Intern",
    company: "TechCorp Solutions",
    companyWebsite: "https://techcorp.example.com",
    description:
      "6-month internship program for computer science students. You'll work on real projects alongside senior engineers and gain hands-on experience with industry-standard tools and practices.\n\nWhat you'll learn:\n- Software development lifecycle\n- Version control with Git\n- Agile development practices\n- Testing and code quality",
    location: "Bangalore, India",
    workMode: "ONSITE",
    employmentType: "INTERNSHIP",
    experienceLevel: "FRESHER",
    salaryMin: 15000,
    salaryMax: 30000,
    salaryCurrency: "INR",
    requiredSkills: ["JavaScript", "HTML", "CSS"],
    preferredSkills: ["React", "Python", "Git"],
    applicationUrl: "https://techcorp.example.com/internships/swe",
    postedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
  },
  {
    externalId: "mock-009",
    title: "QA Automation Engineer",
    company: "QualityFirst Labs",
    companyWebsite: "https://qualityfirst.example.com",
    description:
      "We're looking for a QA Automation Engineer to build and maintain our test automation framework. You'll work with Playwright, Cypress, and Jest to ensure our product quality stays exceptional.\n\nKey responsibilities:\n- Design and implement automated test suites\n- Create and maintain CI/CD testing pipelines\n- Perform API and UI testing\n- Report bugs and track fixes",
    location: "Noida, India",
    workMode: "REMOTE",
    employmentType: "FULL_TIME",
    experienceLevel: "MID",
    salaryMin: 1200000,
    salaryMax: 2000000,
    salaryCurrency: "INR",
    requiredSkills: ["Playwright", "JavaScript", "CI/CD", "REST API"],
    preferredSkills: ["Cypress", "Jest", "TypeScript", "Docker"],
    applicationUrl: "https://qualityfirst.example.com/qa-engineer",
    postedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
  },
  {
    externalId: "mock-010",
    title: "UI/UX Designer (with Frontend Skills)",
    company: "DesignStudio Pro",
    companyWebsite: "https://designstudiopro.example.com",
    description:
      "We need a designer who can also code! You'll create beautiful designs in Figma and implement them in React. This hybrid role bridges our design and engineering teams.\n\nRequirements:\n- Strong Figma skills\n- Proficiency in HTML, CSS, React\n- Eye for detail and typography\n- Understanding of accessibility standards",
    location: "Mumbai, India",
    workMode: "HYBRID",
    employmentType: "FULL_TIME",
    experienceLevel: "MID",
    salaryMin: 1000000,
    salaryMax: 1800000,
    salaryCurrency: "INR",
    requiredSkills: ["Figma", "React", "CSS", "HTML"],
    preferredSkills: ["Tailwind CSS", "Framer Motion", "Adobe XD"],
    applicationUrl: "https://designstudiopro.example.com/careers/uiux",
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    externalId: "mock-011",
    title: "Site Reliability Engineer",
    company: "CloudNine Technologies",
    companyWebsite: "https://cloudnine.example.com",
    description:
      "Join our SRE team to ensure the reliability and performance of our distributed systems. You'll work on incident response, capacity planning, and automation.\n\nRequirements:\n- Experience with Linux systems administration\n- Strong scripting skills (Python/Bash)\n- Monitoring tools experience (Prometheus, Grafana, PagerDuty)\n- Understanding of SLOs, SLIs, and error budgets",
    location: "Hyderabad, India",
    workMode: "REMOTE",
    employmentType: "FULL_TIME",
    experienceLevel: "SENIOR",
    salaryMin: 2200000,
    salaryMax: 3800000,
    salaryCurrency: "INR",
    requiredSkills: ["Linux", "Python", "Docker", "Kubernetes", "Monitoring"],
    preferredSkills: ["Terraform", "AWS", "Prometheus", "Grafana"],
    applicationUrl: "https://cloudnine.example.com/openings/sre",
    postedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
  },
  {
    externalId: "mock-012",
    title: "Product Manager - Developer Tools",
    company: "DevToolsHQ",
    companyWebsite: "https://devtoolshq.example.com",
    description:
      "Lead the product strategy for our developer tools platform. You'll work closely with engineering and design to define the roadmap and ship features that developers love.\n\nExpectations:\n- 3+ years of product management experience\n- Technical background or strong technical intuition\n- Data-driven decision making\n- Excellent communication skills",
    location: "Bangalore, India",
    workMode: "HYBRID",
    employmentType: "FULL_TIME",
    experienceLevel: "SENIOR",
    salaryMin: 2500000,
    salaryMax: 4500000,
    salaryCurrency: "INR",
    requiredSkills: ["Product Management", "Agile", "Data Analysis"],
    preferredSkills: ["SQL", "Jira", "Analytics"],
    applicationUrl: "https://devtoolshq.example.com/pm-role",
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
  },
  {
    externalId: "mock-013",
    title: "Golang Backend Developer",
    company: "FinTech Solutions",
    companyWebsite: "https://fintechsolutions.example.com",
    description:
      "Build high-performance financial services in Go. You'll work on our core payment processing engine that handles millions of transactions daily.\n\nRequirements:\n- Strong Go programming skills\n- Experience with microservices architecture\n- Understanding of financial systems and compliance\n- Database optimization experience",
    location: "Gurgaon, India",
    workMode: "ONSITE",
    employmentType: "FULL_TIME",
    experienceLevel: "SENIOR",
    salaryMin: 2800000,
    salaryMax: 4200000,
    salaryCurrency: "INR",
    requiredSkills: ["Go", "Microservices", "PostgreSQL", "REST API"],
    preferredSkills: ["gRPC", "Kafka", "Redis", "Docker"],
    applicationUrl: "https://fintechsolutions.example.com/golang-dev",
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
  },
  {
    externalId: "mock-014",
    title: "Technical Writer",
    company: "DocuTech",
    companyWebsite: "https://docutech.example.com",
    description:
      "Create clear, concise technical documentation for developer APIs and SDKs. You'll work with engineering teams to document features, create tutorials, and maintain API references.\n\nRequirements:\n- Excellent writing skills\n- Basic programming knowledge\n- Experience with documentation tools (Markdown, MDX, Docusaurus)\n- Attention to detail",
    location: "Remote, India",
    workMode: "REMOTE",
    employmentType: "CONTRACT",
    experienceLevel: "MID",
    salaryMin: 800000,
    salaryMax: 1500000,
    salaryCurrency: "INR",
    requiredSkills: ["Technical Writing", "Markdown", "API Documentation"],
    preferredSkills: ["JavaScript", "Python", "Docusaurus"],
    applicationUrl: "https://docutech.example.com/tech-writer",
    postedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  },
  {
    externalId: "mock-015",
    title: "Machine Learning Engineer",
    company: "AnalyticsAI",
    companyWebsite: "https://analyticsai.example.com",
    description:
      "Deploy and optimize machine learning models at scale. You'll work on the MLOps pipeline — from model training to production deployment and monitoring.\n\nRequirements:\n- Strong Python and ML skills\n- Experience with MLOps (MLflow, Kubeflow, or similar)\n- Cloud deployment experience (AWS/GCP)\n- Understanding of model serving and inference optimization",
    location: "Bangalore, India",
    workMode: "HYBRID",
    employmentType: "FULL_TIME",
    experienceLevel: "SENIOR",
    salaryMin: 2500000,
    salaryMax: 4000000,
    salaryCurrency: "INR",
    requiredSkills: ["Python", "Machine Learning", "MLOps", "AWS"],
    preferredSkills: ["TensorFlow", "PyTorch", "Docker", "Kubernetes"],
    applicationUrl: "https://analyticsai.example.com/ml-engineer",
    postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000),
  },
  {
    externalId: "mock-016",
    title: "Frontend Developer (Part-Time)",
    company: "FlexiWork",
    companyWebsite: "https://flexiwork.example.com",
    description:
      "Part-time frontend role for developers who want flexible hours. Work on our SaaS platform UI with React and Tailwind CSS. 20 hours per week.\n\nRequirements:\n- 2+ years React experience\n- Available 20 hours/week\n- Good at async communication\n- Self-motivated",
    location: "Remote, India",
    workMode: "REMOTE",
    employmentType: "PART_TIME",
    experienceLevel: "MID",
    salaryMin: 600000,
    salaryMax: 900000,
    salaryCurrency: "INR",
    requiredSkills: ["React", "TypeScript", "Tailwind CSS"],
    preferredSkills: ["Next.js", "Zustand", "React Query"],
    applicationUrl: "https://flexiwork.example.com/part-time-frontend",
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
  },
];

export class MockJobAdapter extends BaseJobAdapter {
  readonly sourceName = "mock";
  readonly displayName = "Mock Job Source";
  readonly sourceType = "mock";

  async fetchJobs(options?: FetchOptions): Promise<AdapterResult> {
    let jobs = [...MOCK_JOBS];

    // Apply optional query filter
    if (options?.query) {
      const query = options.query.toLowerCase();
      jobs = jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.company.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query)
      );
    }

    // Apply optional location filter
    if (options?.location) {
      const loc = options.location.toLowerCase();
      jobs = jobs.filter(
        (job) => job.location?.toLowerCase().includes(loc)
      );
    }

    // Apply pagination
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? jobs.length;
    const totalAvailable = jobs.length;
    const paginated = jobs.slice(offset, offset + limit);

    return {
      jobs: paginated,
      totalAvailable,
      hasMore: offset + limit < totalAvailable,
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  getBaseUrl(): string {
    return "https://mock.jobfit.dev";
  }
}
