import React from "react";
import { processJobDescription } from "@/services/jobs/sanitizer";

interface JobDescriptionProps {
  content: string;
  className?: string;
}

export function JobDescription({ content, className = "" }: JobDescriptionProps) {
  const { content: processed, isHtml } = processJobDescription(content);

  if (isHtml) {
    return (
      <div
        className={`prose prose-sm prose-gray max-w-none text-sm text-gray-700 leading-relaxed [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-3 [&_h3]:mb-1 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-gray-900 [&_h4]:mt-2.5 [&_h4]:mb-1 [&_p]:mb-2.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2.5 [&_li]:mb-1 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_a]:text-primary-600 [&_a]:underline ${className}`}
        dangerouslySetInnerHTML={{ __html: processed }}
      />
    );
  }

  // Plain text representation preserving paragraph spacing
  return (
    <div
      className={`prose prose-sm prose-gray max-w-none whitespace-pre-wrap text-sm text-gray-700 leading-relaxed ${className}`}
    >
      {processed}
    </div>
  );
}
