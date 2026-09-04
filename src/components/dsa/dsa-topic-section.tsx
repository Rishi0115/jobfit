"use client";

import * as React from "react";
import { DSATopicGrid } from "./dsa-topic-grid";
import { DSAQuestionList } from "./dsa-question-list";
import type { DSATopicProgress, DSAQuestionItem, DSATopicId } from "@/types/dsa";

export interface DSATopicSectionProps {
  topics: DSATopicProgress[];
  questions: DSAQuestionItem[];
}

export function DSATopicSection({
  topics,
  questions,
}: DSATopicSectionProps) {
  const [selectedTopic, setSelectedTopic] = React.useState<DSATopicId | "all">(
    "all"
  );

  return (
    <div className="space-y-6">
      <DSATopicGrid
        topics={topics}
        selectedTopic={selectedTopic}
        onSelectTopic={setSelectedTopic}
      />
      <DSAQuestionList
        questions={questions}
        selectedTopic={selectedTopic}
      />
    </div>
  );
}
