/**
 * DSA Canonical Taxonomy & Topic Configurations
 *
 * Defines the 18 canonical DSA topics, their skill mappings,
 * and the 4 progressive learning stages.
 */

import type { DSATopicDefinition, DSATopicId } from "@/types/dsa";

export const DSA_TOPICS: readonly DSATopicDefinition[] = [
  {
    id: "arrays",
    name: "Arrays",
    order: 1,
    description: "Contiguous memory allocations, indexing, and in-place manipulations.",
    relatedSkills: ["array", "arrays", "data structures", "memory allocation"],
  },
  {
    id: "strings",
    name: "Strings",
    order: 2,
    description: "Character manipulations, anagrams, palindromes, and parsing.",
    relatedSkills: ["string", "strings", "text processing", "parsing"],
  },
  {
    id: "hashing",
    name: "Hashing",
    order: 3,
    description: "Hash maps, hash sets, frequency counting, and O(1) lookups.",
    relatedSkills: ["hash table", "hash map", "hashing", "dictionary", "map"],
  },
  {
    id: "two_pointers",
    name: "Two Pointers",
    order: 4,
    description: "Linear scans from opposite ends or differing speeds.",
    relatedSkills: ["two pointers", "pointer manipulation", "linear scan"],
  },
  {
    id: "sliding_window",
    name: "Sliding Window",
    order: 5,
    description: "Dynamic sub-array and sub-string optimization techniques.",
    relatedSkills: ["sliding window", "subarrays", "window optimization"],
  },
  {
    id: "linked_list",
    name: "Linked List",
    order: 6,
    description: "Singly, doubly, and circular node-based sequential structures.",
    relatedSkills: ["linked list", "pointers", "nodes", "singly linked list"],
  },
  {
    id: "stack",
    name: "Stack",
    order: 7,
    description: "LIFO structure, parenthesis validation, and monotonic stacks.",
    relatedSkills: ["stack", "lifo", "monotonic stack", "parsing"],
  },
  {
    id: "queue",
    name: "Queue",
    order: 8,
    description: "FIFO structure, double-ended queues (deque), and BFS buffers.",
    relatedSkills: ["queue", "fifo", "deque", "message queues", "buffering"],
  },
  {
    id: "binary_search",
    name: "Binary Search",
    order: 9,
    description: "Logarithmic divide-and-conquer on sorted spaces and condition thresholds.",
    relatedSkills: ["binary search", "search algorithms", "divide and conquer"],
  },
  {
    id: "sorting",
    name: "Sorting",
    order: 10,
    description: "QuickSort, MergeSort, custom comparators, and stability.",
    relatedSkills: ["sorting", "mergesort", "quicksort", "algorithms"],
  },
  {
    id: "recursion",
    name: "Recursion",
    order: 11,
    description: "Base cases, call stack unwinding, and mathematical recurrence.",
    relatedSkills: ["recursion", "recursive programming", "call stack"],
  },
  {
    id: "trees",
    name: "Trees",
    order: 12,
    description: "Binary trees, traversals (pre/in/post/level), and depth calculation.",
    relatedSkills: ["trees", "binary tree", "tree traversal", "dfs", "bfs"],
  },
  {
    id: "bst",
    name: "BST",
    order: 13,
    description: "Binary Search Trees, in-order sorted property, insertions, and balance.",
    relatedSkills: ["binary search tree", "bst", "balanced trees"],
  },
  {
    id: "heap",
    name: "Heap / Priority Queue",
    order: 14,
    description: "Min/Max heaps, top-K elements, and continuous stream tracking.",
    relatedSkills: ["heap", "priority queue", "top k", "min heap", "max heap"],
  },
  {
    id: "graph",
    name: "Graphs",
    order: 15,
    description: "Adjacency lists, BFS, DFS, cycle detection, and topological sorting.",
    relatedSkills: ["graph", "graphs", "bfs", "dfs", "dijkstra", "topological sort"],
  },
  {
    id: "greedy",
    name: "Greedy",
    order: 16,
    description: "Locally optimal choices yielding globally optimal results.",
    relatedSkills: ["greedy", "interval scheduling", "optimization"],
  },
  {
    id: "dynamic_programming",
    name: "Dynamic Programming",
    order: 17,
    description: "Memoization, tabulation, subproblem overlapping, and state transitions.",
    relatedSkills: ["dynamic programming", "dp", "memoization", "tabulation"],
  },
  {
    id: "backtracking",
    name: "Backtracking",
    order: 18,
    description: "State-space tree exploration with pruning (N-Queens, permutations).",
    relatedSkills: ["backtracking", "permutations", "combinations", "pruning"],
  },
] as const;

export const DSA_TOPIC_MAP = new Map<DSATopicId, DSATopicDefinition>(
  DSA_TOPICS.map((t) => [t.id, t])
);

export interface StageConfig {
  stageNumber: number;
  title: string;
  description: string;
  topicIds: DSATopicId[];
}

export const ROADMAP_STAGES: readonly StageConfig[] = [
  {
    stageNumber: 1,
    title: "Stage 1: Core Fundamentals",
    description: "Contiguous structures, frequency counting, and linear scan optimizations.",
    topicIds: ["arrays", "strings", "hashing", "two_pointers", "sliding_window"],
  },
  {
    stageNumber: 2,
    title: "Stage 2: Linear & Search Systems",
    description: "Node structures, LIFO/FIFO mechanics, and logarithmic search.",
    topicIds: ["linked_list", "stack", "queue", "binary_search", "sorting"],
  },
  {
    stageNumber: 3,
    title: "Stage 3: Hierarchical & Graph Structures",
    description: "Tree traversals, binary search trees, heaps, and graph networks.",
    topicIds: ["trees", "bst", "heap", "graph"],
  },
  {
    stageNumber: 4,
    title: "Stage 4: Advanced Algorithmic Paradigms",
    description: "State memoization, overlapping subproblems, greedy choices, and exhaustive search.",
    topicIds: ["dynamic_programming", "greedy", "backtracking", "recursion"],
  },
] as const;
