import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, Shield, Cpu, Target, FileSearch, Code2, MessageSquareCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-16 text-center">
      {/* Hero Badge */}
      <Badge variant="default" className="px-4 py-1.5 text-xs mb-6 shadow-xs">
        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
        AI-Powered Career & Job Matching Platform
      </Badge>

      {/* Main Headline */}
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl max-w-3xl leading-[1.15]">
        Upload Your Resume. <br />
        <span className="text-primary-600">Get Your Target Job.</span>
      </h1>

      <p className="mt-6 text-lg text-gray-600 max-w-2xl">
        JobFit parses your resume, calculates deterministic job match scores, highlights skill gaps, and prepares you with tailored DSA & AI mock interviews.
      </p>

      {/* Hero Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href="/register">
          <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
            Get Started Free
          </Button>
        </Link>
        <Link href="/login">
          <Button variant="outline" size="lg">
            Sign In
          </Button>
        </Link>
      </div>

      {/* Core Platform Pillars Preview */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl text-left w-full">
        <Card hoverable>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 text-success-600 mb-2">
              <Target className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Top 10 Job Matching</CardTitle>
            <CardDescription className="text-xs">
              Deterministic skill and experience scoring without AI hallucinations. Get transparent match breakdowns.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card hoverable>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 mb-2">
              <Cpu className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">AI Resume & Skill Gap</CardTitle>
            <CardDescription className="text-xs">
              Deep ATS scoring, instant formatting suggestions, and personalized skill learning roadmaps.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card hoverable>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 mb-2">
              <MessageSquareCode className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">AI Mock Interviews</CardTitle>
            <CardDescription className="text-xs">
              Dynamic follow-up questions tailored to your resume and targeted job descriptions with full feedback.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
