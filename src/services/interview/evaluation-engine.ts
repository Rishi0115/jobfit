/**
 * Deterministic & Context-Aware Interview Answer Evaluator
 *
 * Provides realistic, answer-dependent, question-dependent, and explainable
 * evaluations without relying on hardcoded static scores or random values.
 * Used by MockAIClient, fallback execution, and test suites.
 */

import type { AIAnswerEvaluationOutput } from "@/lib/validators/interview";

export interface EvaluationInput {
  questionContent: string;
  candidateAnswer: string;
  previousFollowUps?: Array<{ question: string; answer?: string | null }>;
  currentFollowUpDepth: number;
  maxFollowUpDepth?: number;
}

const STOP_WORDS = new Set([
  "a", "an", "and", "the", "in", "on", "at", "to", "for", "of", "with", "by",
  "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
  "do", "does", "did", "can", "could", "should", "would", "may", "might",
  "will", "shall", "i", "you", "we", "they", "he", "she", "it", "my", "your",
  "what", "which", "who", "whom", "this", "that", "these", "those", "how",
  "why", "explain", "describe", "tell", "about", "your", "experience", "primary",
  "project", "handle", "handling", "used", "using", "work", "worked", "role",
]);

const TECHNICAL_KEYWORDS = new Set([
  "database", "postgres", "postgresql", "mysql", "mongodb", "redis", "sql", "nosql",
  "index", "indexes", "indexing", "btree", "query", "queries", "latency", "throughput",
  "performance", "cache", "caching", "invalidation", "memory", "cpu", "scalability",
  "scale", "distributed", "concurrency", "lock", "locking", "transaction", "acid",
  "react", "state", "redux", "zustand", "context", "hooks", "lifecycle", "render",
  "rendering", "component", "props", "frontend", "backend", "fullstack", "node",
  "nodejs", "express", "api", "rest", "graphql", "endpoint", "microservice", "service",
  "docker", "kubernetes", "k8s", "aws", "cloud", "serverless", "queue", "kafka",
  "rabbitmq", "pubsub", "async", "await", "promise", "thread", "worker", "process",
  "architecture", "tradeoff", "trade-off", "tradeoffs", "design", "pattern", "clean",
  "test", "testing", "unit", "integration", "mock", "stub", "ci", "cd", "pipeline",
  "security", "auth", "authentication", "authorization", "jwt", "session", "oauth",
  "algorithm", "complexity", "time", "space", "o(n)", "o(log", "structure", "tree",
  "graph", "hash", "map", "array", "stack", "queue", "heap", "pointer", "reference",
]);

/**
 * Extract significant words from a sentence.
 */
function extractSignificantWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9#+.-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

/**
 * Calculate Jaccard word similarity between two strings.
 */
export function calculateSemanticSimilarity(str1: string, str2: string): number {
  const set1 = new Set(extractSignificantWords(str1));
  const set2 = new Set(extractSignificantWords(str2));

  if (set1.size === 0 || set2.size === 0) return 0;

  let intersection = 0;
  for (const item of set1) {
    if (set2.has(item)) intersection++;
  }

  const union = new Set([...set1, ...set2]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Check if a candidate question duplicates an existing question.
 */
export function isDuplicateFollowUp(
  candidate: string,
  existingQuestions: string[]
): boolean {
  if (!candidate || existingQuestions.length === 0) return false;

  const normalizedCandidate = candidate
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

  for (const existing of existingQuestions) {
    const normalizedExisting = existing
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();

    // Exact normalized match
    if (normalizedCandidate === normalizedExisting) return true;

    // Substring match
    if (
      normalizedCandidate.length > 25 &&
      (normalizedCandidate.includes(normalizedExisting) ||
        normalizedExisting.includes(normalizedCandidate))
    ) {
      return true;
    }

    // High word token similarity
    if (calculateSemanticSimilarity(candidate, existing) > 0.65) {
      return true;
    }
  }

  return false;
}

/**
 * Detect obvious gibberish or spam strings.
 */
function isGibberish(text: string): boolean {
  const clean = text.trim().toLowerCase();
  if (clean.length < 3) return true;

  // Single word with no vowels if length >= 4 (e.g. "jnedckj", "qwrtyp")
  const words = clean.split(/\s+/);
  if (words.length === 1 && clean.length >= 4) {
    const vowelCount = (clean.match(/[aeiouy]/g) || []).length;
    if (vowelCount === 0 || vowelCount / clean.length < 0.15) {
      return true;
    }
  }

  // Same character repeated >= 4 times (e.g. "aaaaa", ".....")
  if (/(.)\1{3,}/.test(clean)) {
    return true;
  }

  return false;
}

/**
 * Main deterministic answer evaluation function.
 */
export function evaluateInterviewAnswerDeterministically(
  input: EvaluationInput
): AIAnswerEvaluationOutput {
  const {
    questionContent,
    candidateAnswer,
    previousFollowUps = [],
    currentFollowUpDepth,
    maxFollowUpDepth = 2,
  } = input;

  const trimmedAnswer = candidateAnswer.trim();

  // ─── CASE A: Empty or minimal answer (< 3 characters) ───
  if (!trimmedAnswer || trimmedAnswer.length < 3) {
    return {
      evaluation: {
        relevance: "No response was provided to address the interview question.",
        technicalCorrectness: "None.",
        depth: "SHALLOW",
        clarity: "Absent.",
        completeness: "Incomplete.",
        score: 0,
        strengths: [],
        missingConcepts: ["Did not attempt the question"],
        improvementSuggestions: [
          "Provide a structured answer explaining your technical approach, tools, and trade-offs.",
        ],
      },
      shouldAskFollowUp: false,
      followUpQuestion: null,
      followUpRationale: null,
    };
  }

  // ─── CASE B: Garbage, deflection, or gibberish answer ───
  const words = trimmedAnswer.split(/\s+/).filter(Boolean);
  const questionWords = extractSignificantWords(questionContent);
  const answerWords = extractSignificantWords(trimmedAnswer);

  const matchedQuestionWords = answerWords.filter((w) =>
    questionWords.includes(w)
  );
  const matchedTechWords = answerWords.filter((w) => TECHNICAL_KEYWORDS.has(w));

  const isLowEffort =
    trimmedAnswer.length < 15 ||
    words.length <= 2 ||
    isGibberish(trimmedAnswer);

  const hasNoRelevance =
    matchedQuestionWords.length === 0 && matchedTechWords.length === 0;

  if (isLowEffort && hasNoRelevance) {
    // Score low (5 to 15) deterministically based on character count and structure
    const baseScore = Math.min(15, Math.max(5, Math.floor(trimmedAnswer.length * 1.2)));

    return {
      evaluation: {
        relevance: "The answer does not meaningfully address the prompt.",
        technicalCorrectness: "Lacks technical concepts or relevant engineering detail.",
        depth: "SHALLOW",
        clarity: "Vague or non-substantive.",
        completeness: "Incomplete.",
        score: baseScore,
        strengths: [],
        missingConcepts: questionWords.slice(0, 3).map((w) => `Explanation of ${w}`),
        improvementSuggestions: [
          "Directly address the question with concrete technical details and implementation examples.",
        ],
      },
      shouldAskFollowUp: false,
      followUpQuestion: null,
      followUpRationale: null,
    };
  }

  // ─── CASE C: Substantive Answer Evaluation ───

  // 1. Relevance Score (0 - 30)
  const questionOverlapRatio =
    questionWords.length > 0 ? matchedQuestionWords.length / questionWords.length : 0;
  const relevanceScore = Math.min(
    30,
    Math.round(questionOverlapRatio * 20) + (matchedQuestionWords.length > 0 ? 10 : 2)
  );

  // 2. Technical Vocabulary & Concepts (0 - 35)
  const uniqueTechCount = new Set(matchedTechWords).size;
  const techScore = Math.min(
    35,
    Math.round(uniqueTechCount * 5) + (uniqueTechCount > 0 ? 12 : 0)
  );

  // 3. Completeness, Structure, and Reasoning (0 - 25)
  const reasoningKeywords = [
    "because", "therefore", "tradeoff", "trade-off", "tradeoffs", "advantage",
    "disadvantage", "instead", "chose", "opted", "result", "improved", "reduced",
    "scaled", "optimized", "prevented", "monitored", "ensured", "analyzed", "identified",
  ];
  const reasoningMatches = answerWords.filter((w) =>
    reasoningKeywords.includes(w)
  ).length;

  let structureScore = 12;
  if (words.length >= 20) structureScore += 4;
  if (words.length >= 35) structureScore += 4;
  if (reasoningMatches >= 1) structureScore += 5;
  structureScore = Math.min(25, structureScore);

  // 4. Clarity & Concrete Details (0 - 15)
  let clarityScore = trimmedAnswer.length >= 20 ? 8 : 4;
  // Reward concrete metrics (e.g. 25ms, 800ms, 90%, 4x, 1M)
  if (/\b\d+(?:ms|s|%|x|k|m|gb|mb)\b/i.test(trimmedAnswer)) {
    clarityScore += 5;
  }
  clarityScore = Math.min(15, clarityScore);

  // Aggregate final deterministic score (clamped between 25 and 95)
  let rawScore = relevanceScore + techScore + structureScore + clarityScore;

  // Penalize answers that have very few words despite matching a single keyword
  if (words.length < 8) {
    rawScore = Math.min(rawScore, 35);
  }

  const score = Math.max(20, Math.min(95, rawScore));

  const depth: "SHALLOW" | "MODERATE" | "DEEP" =
    score >= 70 ? "DEEP" : score >= 45 ? "MODERATE" : "SHALLOW";

  // Strengths and Missing Concepts
  const strengths: string[] = [];
  if (matchedQuestionWords.length > 0) {
    strengths.push(`Addressed core question topics: ${matchedQuestionWords.slice(0, 3).join(", ")}`);
  }
  if (uniqueTechCount > 0) {
    strengths.push(`Referenced relevant technical concepts: ${Array.from(new Set(matchedTechWords)).slice(0, 3).join(", ")}`);
  }
  if (reasoningMatches > 0) {
    strengths.push("Articulated engineering rationale or trade-offs.");
  }
  if (strengths.length === 0) {
    strengths.push("Attempted to respond to the prompt.");
  }

  const missingConcepts: string[] = [];
  const unmentionedQuestionWords = questionWords.filter(
    (w) => !matchedQuestionWords.includes(w)
  );
  if (unmentionedQuestionWords.length > 0) {
    missingConcepts.push(
      `Deeper exploration of ${unmentionedQuestionWords.slice(0, 2).join(" and ")}`
    );
  }
  if (reasoningMatches === 0) {
    missingConcepts.push("Concrete performance or architecture trade-offs");
  }
  if (uniqueTechCount < 2) {
    missingConcepts.push("Specific underlying tools or protocol mechanisms");
  }

  const improvementSuggestions: string[] = [];
  if (score < 70) {
    improvementSuggestions.push(
      "Provide more detailed implementation steps and discuss alternative designs you considered."
    );
  } else {
    improvementSuggestions.push(
      "Quantify the performance outcomes (e.g. latency reduction, throughput, or memory footprint) where possible."
    );
  }

  // ─── CASE D: Dynamic Follow-Up Formulation ───

  // Strict check: if max follow-up depth reached, no further follow-up
  if (currentFollowUpDepth >= maxFollowUpDepth) {
    return {
      evaluation: {
        relevance: "Directly addressed the prompt.",
        technicalCorrectness: "Accurately described concepts.",
        depth,
        clarity: "Clear structure and explanation.",
        completeness: score >= 70 ? "Thorough" : "Moderate",
        score,
        strengths,
        missingConcepts,
        improvementSuggestions,
      },
      shouldAskFollowUp: false,
      followUpQuestion: null,
      followUpRationale: null,
    };
  }

  // Generate context-aware follow-up question
  const existingQuestions = [
    questionContent,
    ...previousFollowUps.map((f) => f.question),
  ];

  let followUpQuestion: string | null = null;
  let followUpRationale: string | null = null;

  if (currentFollowUpDepth === 0) {
    const hasDatabaseKeywords =
      matchedTechWords.some((w) =>
        w.startsWith("postgres") || w.startsWith("index") || w.startsWith("sql") || w === "database"
      ) || questionWords.some((w) =>
        w.startsWith("postgres") || w.startsWith("index") || w.startsWith("query") || w === "database"
      );

    const hasFrontendKeywords =
      matchedTechWords.some((w) =>
        w === "react" || w === "state" || w === "redux" || w === "zustand" || w === "context" || w.startsWith("render")
      ) || questionWords.some((w) =>
        w === "react" || w === "state" || w.startsWith("render") || w === "frontend"
      );

    const hasApiKeywords =
      matchedTechWords.some((w) =>
        w === "api" || w === "service" || w === "microservice" || w === "endpoint"
      ) || questionWords.some((w) =>
        w === "api" || w === "service" || w === "microservice"
      );

    const hasCacheKeywords =
      matchedTechWords.some((w) =>
        w.startsWith("cache") || w === "redis"
      ) || questionWords.some((w) =>
        w.startsWith("cache") || w === "redis"
      );

    // Depth 1: Probe specific technical trade-offs or implementation choices based on the answer and question
    if (hasDatabaseKeywords) {
      followUpQuestion = "How do you verify index efficiency in production, and what metrics in the execution plan do you inspect first?";
      followUpRationale = "Probing database performance diagnostics and query planning trade-offs.";
    } else if (hasFrontendKeywords) {
      followUpQuestion = "How do you prevent unnecessary component re-renders or manage state synchronization across distributed views?";
      followUpRationale = "Probing frontend performance optimization and render lifecycle management.";
    } else if (hasApiKeywords) {
      followUpQuestion = "How do you handle distributed error boundaries, retries, and rate limiting across those service endpoints?";
      followUpRationale = "Probing distributed systems resilience and network failure handling.";
    } else if (hasCacheKeywords) {
      followUpQuestion = "What cache eviction policy and invalidation strategy did you implement to prevent stale data?";
      followUpRationale = "Probing caching trade-offs and consistency models.";
    } else {
      // General question-dependent probe
      const keyTopic = questionWords[0] || "that architectural decision";
      followUpQuestion = `What were the primary performance trade-offs and alternative solutions you evaluated regarding ${keyTopic}?`;
      followUpRationale = "Probing engineering judgment, alternatives, and technical trade-offs.";
    }
  } else if (currentFollowUpDepth === 1) {
    // Depth 2: Probe deeper into edge cases, scalability, or failure modes based on previous follow-up
    const prevAnswer = previousFollowUps[0]?.answer?.toLowerCase() || "";

    if (prevAnswer.includes("cache") || prevAnswer.includes("redis") || prevAnswer.includes("buffer")) {
      followUpQuestion = "How do you mitigate cache stampedes or thundering herd problems when keys expire under heavy traffic?";
      followUpRationale = "Probing high-concurrency resilience and failure mitigation.";
    } else if (prevAnswer.includes("plan") || prevAnswer.includes("index") || prevAnswer.includes("analyze")) {
      followUpQuestion = "How do you handle write amplification and table bloat as data volume grows into millions of records?";
      followUpRationale = "Probing database scaling limits and maintenance overhead.";
    } else if (prevAnswer.includes("render") || prevAnswer.includes("state") || prevAnswer.includes("re-render")) {
      followUpQuestion = "How do you structure automated integration tests and performance benchmarks to detect UI regressions?";
      followUpRationale = "Probing testing strategy and UI performance regression detection.";
    } else {
      followUpQuestion = "Under extreme scale or unexpected service disruption, what graceful degradation or fallback mechanisms are triggered?";
      followUpRationale = "Probing system reliability, disaster recovery, and edge-case resilience.";
    }
  }

  // ─── Duplicate Prevention ───
  if (followUpQuestion && isDuplicateFollowUp(followUpQuestion, existingQuestions)) {
    // Fallback to a distinct operational/monitoring probe
    const alternateProbe = "What automated monitoring and alerting signals do you establish in production to detect failures early?";
    if (!isDuplicateFollowUp(alternateProbe, existingQuestions)) {
      followUpQuestion = alternateProbe;
      followUpRationale = "Probing operational telemetry and production observability.";
    } else {
      // If still duplicate, conclude follow-ups for this question
      followUpQuestion = null;
      followUpRationale = null;
    }
  }

  const shouldAskFollowUp = Boolean(followUpQuestion);

  return {
    evaluation: {
      relevance: score >= 60 ? "Directly addressed the question." : "Partially addressed the question.",
      technicalCorrectness: score >= 70 ? "Accurately described core concepts." : "Basic technical understanding shown.",
      depth,
      clarity: "Clear structure and explanation.",
      completeness: score >= 70 ? "Covers main points." : "Missing deeper implementation details.",
      score,
      strengths,
      missingConcepts,
      improvementSuggestions,
    },
    shouldAskFollowUp,
    followUpQuestion,
    followUpRationale,
  };
}
