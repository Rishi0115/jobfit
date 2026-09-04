/**
 * Curated Foundational DSA Question Bank
 *
 * Seed data covering canonical algorithmic patterns across all 18 topics.
 */

import { DSADifficulty } from "@prisma/client";
import type { DSAPracticeLink } from "@/types/dsa";

export interface SeedQuestion {
  title: string;
  topic: string;
  difficulty: DSADifficulty;
  problemStatement: string;
  hints: string[];
  expectedApproach: string;
  solution: string;
  timeComplexity: string;
  spaceComplexity: string;
  relatedConcepts: string[];
  tags: string[];
  practiceLinks?: DSAPracticeLink[];
}

export const SEED_DSA_QUESTIONS: readonly SeedQuestion[] = [
  // ── Stage 1: Fundamentals ──
  {
    title: "Two Sum",
    topic: "arrays",
    difficulty: DSADifficulty.EASY,
    problemStatement:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    hints: [
      "Can we use extra space to remember numbers we have seen so far?",
      "For each number x, what number y do we need to reach the target?",
    ],
    expectedApproach:
      "Hash Map: Iterate through nums, checking if target - current exists in the hash map. If found, return indices; otherwise insert current number and index.",
    solution:
      "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    relatedConcepts: ["Hash Map", "Array Traversal", "Complements"],
    tags: ["arrays", "hashing", "blind75", "easy"],
  },
  {
    title: "Best Time to Buy and Sell Stock",
    topic: "arrays",
    difficulty: DSADifficulty.EASY,
    problemStatement:
      "You are given an array prices where prices[i] is the price of a given stock on the ith day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve. If no profit is possible, return 0.",
    hints: [
      "Track the minimum price seen so far as you iterate through the days.",
      "At each day, calculate the profit if sold today: prices[i] - minPrice.",
    ],
    expectedApproach:
      "Single Pass: Maintain minPrice and maxProfit. Update minPrice when a lower price is found; otherwise update maxProfit with prices[i] - minPrice.",
    solution:
      "function maxProfit(prices) {\n  let minPrice = Infinity;\n  let maxProfit = 0;\n  for (const price of prices) {\n    if (price < minPrice) minPrice = price;\n    else maxProfit = Math.max(maxProfit, price - minPrice);\n  }\n  return maxProfit;\n}",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    relatedConcepts: ["Greedy", "Single Pass", "Dynamic Tracking"],
    tags: ["arrays", "greedy", "blind75", "easy"],
  },
  {
    title: "Contains Duplicate",
    topic: "hashing",
    difficulty: DSADifficulty.EASY,
    problemStatement:
      "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
    hints: ["Use a Set to track visited elements in O(1) time."],
    expectedApproach:
      "Hash Set: Add elements to a Set; if an element already exists in the set, return true.",
    solution:
      "function containsDuplicate(nums) {\n  const seen = new Set();\n  for (const n of nums) {\n    if (seen.has(n)) return true;\n    seen.add(n);\n  }\n  return false;\n}",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    relatedConcepts: ["Hash Set", "Uniqueness", "Early Return"],
    tags: ["hashing", "arrays", "easy"],
  },
  {
    title: "Valid Anagram",
    topic: "strings",
    difficulty: DSADifficulty.EASY,
    problemStatement:
      "Given two strings s and t, return true if t is an anagram of s, and false otherwise.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase.",
    hints: [
      "Check if lengths are equal first.",
      "Count frequencies of each character.",
    ],
    expectedApproach:
      "Frequency Array / Map: Increment count for characters in s, decrement for t. All counts must be zero.",
    solution:
      "function isAnagram(s, t) {\n  if (s.length !== t.length) return false;\n  const count = {};\n  for (const c of s) count[c] = (count[c] || 0) + 1;\n  for (const c of t) {\n    if (!count[c]) return false;\n    count[c]--;\n  }\n  return true;\n}",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1) (26 letters)",
    relatedConcepts: ["Frequency Map", "String Manipulation"],
    tags: ["strings", "hashing", "easy"],
  },
  {
    title: "Group Anagrams",
    topic: "hashing",
    difficulty: DSADifficulty.MEDIUM,
    problemStatement:
      "Given an array of strings strs, group the anagrams together. You can return the answer in any order.",
    hints: [
      "How can you uniquely represent the character signature of each anagram group?",
      "Sorting the characters gives a canonical key.",
    ],
    expectedApproach:
      "Categorize by Sorted String: Use the sorted character string as a map key to collect matching words.",
    solution:
      "function groupAnagrams(strs) {\n  const map = new Map();\n  for (const s of strs) {\n    const key = s.split('').sort().join('');\n    if (!map.has(key)) map.set(key, []);\n    map.get(key).push(s);\n  }\n  return Array.from(map.values());\n}",
    timeComplexity: "O(n * k log k)",
    spaceComplexity: "O(n * k)",
    relatedConcepts: ["Canonical Representation", "Hash Map"],
    tags: ["hashing", "strings", "medium"],
  },
  {
    title: "Valid Palindrome",
    topic: "two_pointers",
    difficulty: DSADifficulty.EASY,
    problemStatement:
      "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.",
    hints: [
      "Use two pointers: left starting at 0, right starting at length - 1.",
      "Skip non-alphanumeric characters.",
    ],
    expectedApproach:
      "Two Pointers: Move left and right inward, comparing characters case-insensitively while skipping punctuation.",
    solution:
      "function isPalindrome(s) {\n  let l = 0, r = s.length - 1;\n  const isAlphaNum = c => /[a-z0-9]/i.test(c);\n  while (l < r) {\n    while (l < r && !isAlphaNum(s[l])) l++;\n    while (l < r && !isAlphaNum(s[r])) r--;\n    if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;\n    l++; r--;\n  }\n  return true;\n}",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    relatedConcepts: ["Two Pointers", "In-Place Traversal"],
    tags: ["two_pointers", "strings", "easy"],
  },
  {
    title: "3Sum",
    topic: "two_pointers",
    difficulty: DSADifficulty.MEDIUM,
    problemStatement:
      "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.\n\nNotice that the solution set must not contain duplicate triplets.",
    hints: [
      "Sort the array first to handle duplicates easily.",
      "Fix one element and use two pointers for the remaining two.",
    ],
    expectedApproach:
      "Sorted Two Pointers: Sort nums. Loop through nums with index i. For each i, use left = i + 1 and right = n - 1 to find complements summing to -nums[i]. Skip duplicates.",
    solution:
      "function threeSum(nums) {\n  nums.sort((a, b) => a - b);\n  const res = [];\n  for (let i = 0; i < nums.length - 2; i++) {\n    if (i > 0 && nums[i] === nums[i - 1]) continue;\n    let l = i + 1, r = nums.length - 1;\n    while (l < r) {\n      const sum = nums[i] + nums[l] + nums[r];\n      if (sum === 0) {\n        res.push([nums[i], nums[l], nums[r]]);\n        while (l < r && nums[l] === nums[l + 1]) l++;\n        while (l < r && nums[r] === nums[r - 1]) r--;\n        l++; r--;\n      } else if (sum < 0) l++;\n      else r--;\n    }\n  }\n  return res;\n}",
    timeComplexity: "O(n^2)",
    spaceComplexity: "O(1) extra space",
    relatedConcepts: ["Sorting", "Two Pointers", "Deduplication"],
    tags: ["two_pointers", "arrays", "medium"],
  },
  {
    title: "Longest Substring Without Repeating Characters",
    topic: "sliding_window",
    difficulty: DSADifficulty.MEDIUM,
    problemStatement:
      "Given a string s, find the length of the longest substring without repeating characters.",
    hints: [
      "Use a sliding window with left and right boundaries.",
      "Store the most recent index of each character in a map.",
    ],
    expectedApproach:
      "Sliding Window with Index Map: Expand right pointer. If s[right] was already seen in the current window, move left pointer to prevIndex + 1.",
    solution:
      "function lengthOfLongestSubstring(s) {\n  let maxLen = 0, left = 0;\n  const map = new Map();\n  for (let right = 0; right < s.length; right++) {\n    const char = s[right];\n    if (map.has(char) && map.get(char) >= left) {\n      left = map.get(char) + 1;\n    }\n    map.set(char, right);\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  return maxLen;\n}",
    timeComplexity: "O(n)",
    spaceComplexity: "O(min(m, n))",
    relatedConcepts: ["Sliding Window", "Hash Map"],
    tags: ["sliding_window", "strings", "medium"],
  },

  // ── Stage 2: Linear & Search ──
  {
    title: "Reverse Linked List",
    topic: "linked_list",
    difficulty: DSADifficulty.EASY,
    problemStatement:
      "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    hints: [
      "Keep track of previous, current, and next nodes as you iterate.",
    ],
    expectedApproach:
      "Iterative 3-Pointers: Store next = curr.next, point curr.next to prev, move prev = curr, curr = next.",
    solution:
      "function reverseList(head) {\n  let prev = null, curr = head;\n  while (curr) {\n    const next = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    relatedConcepts: ["Pointers", "Linked List Manipulation"],
    tags: ["linked_list", "easy"],
  },
  {
    title: "Merge Two Sorted Lists",
    topic: "linked_list",
    difficulty: DSADifficulty.EASY,
    problemStatement:
      "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list.",
    hints: ["Use a dummy node to simplify edge cases."],
    expectedApproach:
      "Dummy Node with Two Pointers: Compare values of list1 and list2, advancing the smaller node.",
    solution:
      "function mergeTwoLists(l1, l2) {\n  const dummy = { next: null };\n  let curr = dummy;\n  while (l1 && l2) {\n    if (l1.val <= l2.val) { curr.next = l1; l1 = l1.next; }\n    else { curr.next = l2; l2 = l2.next; }\n    curr = curr.next;\n  }\n  curr.next = l1 || l2;\n  return dummy.next;\n}",
    timeComplexity: "O(n + m)",
    spaceComplexity: "O(1)",
    relatedConcepts: ["Dummy Node", "Two Pointers"],
    tags: ["linked_list", "easy"],
  },
  {
    title: "Valid Parentheses",
    topic: "stack",
    difficulty: DSADifficulty.EASY,
    problemStatement:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nOpen brackets must be closed by the same type of brackets in the correct order.",
    hints: ["Use a stack to push expected closing brackets."],
    expectedApproach:
      "Stack: When encountering an opening bracket, push its matching closer. When encountering a closer, pop and compare.",
    solution:
      "function isValid(s) {\n  const stack = [];\n  const pairs = { '(': ')', '{': '}', '[': ']' };\n  for (const c of s) {\n    if (pairs[c]) stack.push(pairs[c]);\n    else if (stack.pop() !== c) return false;\n  }\n  return stack.length === 0;\n}",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    relatedConcepts: ["LIFO", "Matching Pairs", "Stack"],
    tags: ["stack", "strings", "easy"],
  },
  {
    title: "Binary Search",
    topic: "binary_search",
    difficulty: DSADifficulty.EASY,
    problemStatement:
      "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.",
    hints: ["Calculate mid = Math.floor((left + right) / 2)."],
    expectedApproach:
      "Logarithmic Bisection: Maintain left and right boundaries. Halve the search space based on nums[mid] <=> target.",
    solution:
      "function search(nums, target) {\n  let l = 0, r = nums.length - 1;\n  while (l <= r) {\n    const mid = l + Math.floor((r - l) / 2);\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) l = mid + 1;\n    else r = mid - 1;\n  }\n  return -1;\n}",
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    relatedConcepts: ["Binary Search", "Divide and Conquer"],
    tags: ["binary_search", "easy"],
  },
  {
    title: "Search in Rotated Sorted Array",
    topic: "binary_search",
    difficulty: DSADifficulty.MEDIUM,
    problemStatement:
      "There is an integer array nums sorted in ascending order with distinct values, rotated at an unknown pivot index. Given nums and a target, return the index of target if it is in nums, or -1 if it is not.",
    hints: [
      "At least one half of the array (left or right) is always normally sorted.",
      "Check if target falls within the sorted half.",
    ],
    expectedApproach:
      "Modified Binary Search: Identify which half is sorted. If target lies within the sorted range, search there; otherwise search the opposing half.",
    solution:
      "function searchRotated(nums, target) {\n  let l = 0, r = nums.length - 1;\n  while (l <= r) {\n    const mid = l + Math.floor((r - l) / 2);\n    if (nums[mid] === target) return mid;\n    if (nums[l] <= nums[mid]) {\n      if (nums[l] <= target && target < nums[mid]) r = mid - 1;\n      else l = mid + 1;\n    } else {\n      if (nums[mid] < target && target <= nums[r]) l = mid + 1;\n      else r = mid - 1;\n    }\n  }\n  return -1;\n}",
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    relatedConcepts: ["Pivot Detection", "Binary Search"],
    tags: ["binary_search", "medium"],
  },

  // ── Stage 3: Trees & Graphs ──
  {
    title: "Invert Binary Tree",
    topic: "trees",
    difficulty: DSADifficulty.EASY,
    problemStatement:
      "Given the root of a binary tree, invert the tree, and return its root.",
    hints: ["Swap left and right children recursively."],
    expectedApproach:
      "Recursive DFS: Base case root is null. Swap root.left and root.right, then recursively invert both subtrees.",
    solution:
      "function invertTree(root) {\n  if (!root) return null;\n  const temp = root.left;\n  root.left = invertTree(root.right);\n  root.right = invertTree(temp);\n  return root;\n}",
    timeComplexity: "O(n)",
    spaceComplexity: "O(h) call stack",
    relatedConcepts: ["Tree Recursion", "DFS"],
    tags: ["trees", "recursion", "easy"],
  },
  {
    title: "Maximum Depth of Binary Tree",
    topic: "trees",
    difficulty: DSADifficulty.EASY,
    problemStatement:
      "Given the root of a binary tree, return its maximum depth.\n\nA binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
    hints: ["Depth is 1 + max(depth(left), depth(right))."],
    expectedApproach:
      "Recursive Post-order: 1 + Math.max(maxDepth(root.left), maxDepth(root.right)).",
    solution:
      "function maxDepth(root) {\n  if (!root) return 0;\n  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));\n}",
    timeComplexity: "O(n)",
    spaceComplexity: "O(h)",
    relatedConcepts: ["DFS", "Tree Height"],
    tags: ["trees", "easy"],
  },
  {
    title: "Validate Binary Search Tree",
    topic: "bst",
    difficulty: DSADifficulty.MEDIUM,
    problemStatement:
      "Given the root of a binary tree, determine if it is a valid binary search tree (BST).",
    hints: [
      "Every node in the left subtree must be < current node.",
      "Every node in the right subtree must be > current node.",
      "Pass min and max bounds down the recursion.",
    ],
    expectedApproach:
      "Range Propagation: Check if min < node.val < max, then recurse left with (min, node.val) and right with (node.val, max).",
    solution:
      "function isValidBST(root, min = -Infinity, max = Infinity) {\n  if (!root) return true;\n  if (root.val <= min || root.val >= max) return false;\n  return isValidBST(root.left, min, root.val) && isValidBST(root.right, root.val, max);\n}",
    timeComplexity: "O(n)",
    spaceComplexity: "O(h)",
    relatedConcepts: ["BST Properties", "Range Validation"],
    tags: ["bst", "trees", "medium"],
  },
  {
    title: "Number of Islands",
    topic: "graph",
    difficulty: DSADifficulty.MEDIUM,
    problemStatement:
      "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
    hints: [
      "Traverse the grid. When you hit a '1', increment island count and use DFS/BFS to sink the island (turn connected '1's to '0's).",
    ],
    expectedApproach:
      "Grid DFS Flood Fill: For each unvisited '1', trigger DFS to mark all 4-directionally connected land cells as visited.",
    solution:
      "function numIslands(grid) {\n  let count = 0;\n  const dfs = (r, c) => {\n    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] === '0') return;\n    grid[r][c] = '0';\n    dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1);\n  };\n  for (let r = 0; r < grid.length; r++) {\n    for (let c = 0; c < grid[0].length; c++) {\n      if (grid[r][c] === '1') { count++; dfs(r, c); }\n    }\n  }\n  return count;\n}",
    timeComplexity: "O(m * n)",
    spaceComplexity: "O(m * n) call stack",
    relatedConcepts: ["Graph Traversal", "Connected Components", "DFS Flood Fill"],
    tags: ["graph", "dfs", "medium"],
  },
  {
    title: "Clone Graph",
    topic: "graph",
    difficulty: DSADifficulty.MEDIUM,
    problemStatement:
      "Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph.",
    hints: ["Use a hash map to map original nodes to their cloned counterparts."],
    expectedApproach:
      "DFS with Visited Map: Map original node to new Node(val). For each neighbor, recursively clone and attach to neighbors list.",
    solution:
      "function cloneGraph(node, visited = new Map()) {\n  if (!node) return null;\n  if (visited.has(node)) return visited.get(node);\n  const clone = { val: node.val, neighbors: [] };\n  visited.set(node, clone);\n  for (const n of node.neighbors) {\n    clone.neighbors.push(cloneGraph(n, visited));\n  }\n  return clone;\n}",
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    relatedConcepts: ["Graph Cloning", "DFS", "Adjacency List"],
    tags: ["graph", "medium"],
  },

  // ── Stage 4: Advanced Dynamic Programming & Paradigms ──
  {
    title: "Climbing Stairs",
    topic: "dynamic_programming",
    difficulty: DSADifficulty.EASY,
    problemStatement:
      "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    hints: ["To reach step n, you must come from step n-1 or step n-2."],
    expectedApproach:
      "Fibonacci DP: ways(n) = ways(n-1) + ways(n-2). Optimize space using two rolling variables.",
    solution:
      "function climbStairs(n) {\n  if (n <= 2) return n;\n  let prev2 = 1, prev1 = 2;\n  for (let i = 3; i <= n; i++) {\n    const curr = prev1 + prev2;\n    prev2 = prev1;\n    prev1 = curr;\n  }\n  return prev1;\n}",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    relatedConcepts: ["Memoization", "Fibonacci", "State Transitions"],
    tags: ["dynamic_programming", "easy"],
  },
  {
    title: "Coin Change",
    topic: "dynamic_programming",
    difficulty: DSADifficulty.MEDIUM,
    problemStatement:
      "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.",
    hints: [
      "dp[i] represents the minimum coins needed for amount i.",
      "For each coin, dp[i] = min(dp[i], 1 + dp[i - coin]).",
    ],
    expectedApproach:
      "Bottom-Up Tabulation: Initialize dp array with Infinity, dp[0] = 0. Iterate amounts from 1 to amount, testing every coin.",
    solution:
      "function coinChange(coins, amount) {\n  const dp = new Array(amount + 1).fill(Infinity);\n  dp[0] = 0;\n  for (let i = 1; i <= amount; i++) {\n    for (const c of coins) {\n      if (i - c >= 0) dp[i] = Math.min(dp[i], 1 + dp[i - c]);\n    }\n  }\n  return dp[amount] === Infinity ? -1 : dp[amount];\n}",
    timeComplexity: "O(amount * coins.length)",
    spaceComplexity: "O(amount)",
    relatedConcepts: ["Unbounded Knapsack", "Tabulation", "Optimal Substructure"],
    tags: ["dynamic_programming", "medium"],
  },
  {
    title: "Longest Increasing Subsequence",
    topic: "dynamic_programming",
    difficulty: DSADifficulty.MEDIUM,
    problemStatement:
      "Given an integer array nums, return the length of the longest strictly increasing subsequence.",
    hints: [
      "dp[i] is the length of the longest increasing subsequence ending at index i.",
    ],
    expectedApproach:
      "DP: For each i, compare with all j < i. If nums[j] < nums[i], dp[i] = max(dp[i], dp[j] + 1).",
    solution:
      "function lengthOfLIS(nums) {\n  if (nums.length === 0) return 0;\n  const dp = new Array(nums.length).fill(1);\n  let max = 1;\n  for (let i = 1; i < nums.length; i++) {\n    for (let j = 0; j < i; j++) {\n      if (nums[i] > nums[j]) dp[i] = Math.max(dp[i], dp[j] + 1);\n    }\n    max = Math.max(max, dp[i]);\n  }\n  return max;\n}",
    timeComplexity: "O(n^2)",
    spaceComplexity: "O(n)",
    relatedConcepts: ["Subsequences", "DP State Definition"],
    tags: ["dynamic_programming", "medium"],
  },
];

/**
 * Curated, verified external practice links for foundational questions.
 * Static, deterministic metadata — zero scraping, zero guessing.
 */
export const SEED_PRACTICE_LINKS: Record<string, DSAPracticeLink[]> = {
  "Two Sum": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/two-sum/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/2-sum/" },
  ],
  "Best Time to Buy and Sell Stock": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/best-time-to-buy-and-sell-stocks-i/" },
  ],
  "Contains Duplicate": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/contains-duplicate/" },
  ],
  "Valid Anagram": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/valid-anagram/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/anagrams/" },
  ],
  "Group Anagrams": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/group-anagrams/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/anagrams/" },
  ],
  "Valid Palindrome": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/valid-palindrome/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/palindrome-string/" },
  ],
  "3Sum": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/3sum/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/3-sum/" },
  ],
  "Longest Substring Without Repeating Characters": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/longest-substring-without-repeat/" },
  ],
  "Reverse Linked List": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/reverse-linked-list/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/reverse-linked-list/" },
  ],
  "Merge Two Sorted Lists": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/merge-two-sorted-lists/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/merge-two-sorted-lists/" },
  ],
  "Valid Parentheses": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/valid-parentheses/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/generate-all-parentheses/" },
  ],
  "Binary Search": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/binary-search/" },
  ],
  "Search in Rotated Sorted Array": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/search-in-rotated-sorted-array/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/rotated-sorted-array-search/" },
  ],
  "Invert Binary Tree": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/invert-binary-tree/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/invert-the-binary-tree/" },
  ],
  "Maximum Depth of Binary Tree": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/max-depth-of-binary-tree/" },
  ],
  "Validate Binary Search Tree": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/validate-binary-search-tree/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/valid-binary-search-tree/" },
  ],
  "Number of Islands": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/number-of-islands/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/black-shapes/" },
  ],
  "Clone Graph": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/clone-graph/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/clone-graph/" },
  ],
  "Climbing Stairs": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/climbing-stairs/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/stairs/" },
  ],
  "Coin Change": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/coin-change/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/coin-sum-infinite/" },
  ],
  "Longest Increasing Subsequence": [
    { platform: "LEETCODE", url: "https://leetcode.com/problems/longest-increasing-subsequence/" },
    { platform: "INTERVIEWBIT", url: "https://www.interviewbit.com/problems/longest-increasing-subsequence/" },
  ],
};
