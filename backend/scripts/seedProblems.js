require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Problem = require('../src/features/problems/problem.model');
const TestCase = require('../src/features/testcases/testcase.model');
const User = require('../src/features/auth/auth.model');
const logger = require('../src/shared/utils/logger');

const problems = [
  // ─── EASY ───────────────────────────────────────────────────────────────
  {
    name: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    tags: ['array', 'hash-table'],
    statement: `Given an array of integers and a target sum, find and print the indices of the two numbers that add up to the target. You may assume exactly one solution exists and you cannot use the same element twice.

Constraints:
- 2 <= n <= 10^4
- -10^9 <= nums[i] <= 10^9
- Only one valid answer exists`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '4 9\n2 7 11 15', output: '0 1' },
      { input: '3 6\n3 2 4', output: '1 2' },
    ],
    hiddenTestCases: [
      { input: '2 6\n3 3', output: '0 1' },
      { input: '5 10\n1 2 3 4 9', output: '1 3' },
      { input: '4 0\n-1 -2 3 -1', output: '0 3' },
    ],
  },
  {
    name: 'Reverse String',
    slug: 'reverse-string',
    difficulty: 'Easy',
    tags: ['string'],
    statement: `Given a string, print it in reverse order.

Constraints:
- 1 <= length of string <= 10^5
- String contains only printable ASCII characters`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: 'hello', output: 'olleh' },
      { input: 'CodeFront', output: 'tnorFedoC' },
    ],
    hiddenTestCases: [
      { input: 'a', output: 'a' },
      { input: 'abcde', output: 'edcba' },
      { input: 'racecar', output: 'racecar' },
    ],
  },
  {
    name: 'Palindrome Check',
    slug: 'palindrome-check',
    difficulty: 'Easy',
    tags: ['string'],
    statement: `Given a string, determine if it is a palindrome. Print YES if it is, NO otherwise. Consider only alphanumeric characters and ignore case.

Constraints:
- 1 <= length <= 10^5`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: 'racecar', output: 'YES' },
      { input: 'hello', output: 'NO' },
    ],
    hiddenTestCases: [
      { input: 'A man a plan a canal Panama', output: 'YES' },
      { input: 'Was it a car or a cat I saw', output: 'YES' },
      { input: 'random', output: 'NO' },
    ],
  },
  {
    name: 'Fibonacci Number',
    slug: 'fibonacci-number',
    difficulty: 'Easy',
    tags: ['math', 'recursion'],
    statement: `Given a number n, print the nth Fibonacci number. The sequence starts: 0, 1, 1, 2, 3, 5, 8, 13...
F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2) for n > 1.

Constraints:
- 0 <= n <= 30`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '6', output: '8' },
      { input: '0', output: '0' },
    ],
    hiddenTestCases: [
      { input: '1', output: '1' },
      { input: '10', output: '55' },
      { input: '30', output: '832040' },
    ],
  },
  {
    name: 'Factorial',
    slug: 'factorial',
    difficulty: 'Easy',
    tags: ['math', 'recursion'],
    statement: `Given a non-negative integer n, compute and print n! (n factorial).
n! = n * (n-1) * (n-2) * ... * 1, and 0! = 1.

Constraints:
- 0 <= n <= 12`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '5', output: '120' },
      { input: '0', output: '1' },
    ],
    hiddenTestCases: [
      { input: '1', output: '1' },
      { input: '10', output: '3628800' },
      { input: '12', output: '479001600' },
    ],
  },
  {
    name: 'Count Vowels',
    slug: 'count-vowels',
    difficulty: 'Easy',
    tags: ['string'],
    statement: `Given a string, count the number of vowels (a, e, i, o, u — both uppercase and lowercase).

Constraints:
- 1 <= length <= 10^5`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: 'Hello World', output: '3' },
      { input: 'aeiou', output: '5' },
    ],
    hiddenTestCases: [
      { input: 'rhythm', output: '0' },
      { input: 'AEIOU', output: '5' },
      { input: 'The quick brown fox', output: '5' },
    ],
  },
  {
    name: 'FizzBuzz',
    slug: 'fizzbuzz',
    difficulty: 'Easy',
    tags: ['math'],
    statement: `Given a number n, print numbers from 1 to n with the following rules:
- Print "FizzBuzz" if divisible by both 3 and 5
- Print "Fizz" if divisible by 3 only
- Print "Buzz" if divisible by 5 only
- Otherwise print the number

Each output on a new line.

Constraints:
- 1 <= n <= 100`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '5', output: '1\n2\nFizz\n4\nBuzz' },
      { input: '15', output: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz' },
    ],
    hiddenTestCases: [
      { input: '1', output: '1' },
      { input: '3', output: '1\n2\nFizz' },
      { input: '10', output: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz' },
    ],
  },
  {
    name: 'Find Maximum',
    slug: 'find-maximum',
    difficulty: 'Easy',
    tags: ['array'],
    statement: `Given an array of n integers, find and print the maximum element.

Constraints:
- 1 <= n <= 10^5
- -10^9 <= arr[i] <= 10^9`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '5\n3 1 4 1 5', output: '5' },
      { input: '3\n-1 -5 -2', output: '-1' },
    ],
    hiddenTestCases: [
      { input: '1\n42', output: '42' },
      { input: '4\n1000000000 999999999 0 -1000000000', output: '1000000000' },
      { input: '6\n5 5 5 5 5 5', output: '5' },
    ],
  },
  {
    name: 'Sum of Array',
    slug: 'sum-of-array',
    difficulty: 'Easy',
    tags: ['array', 'math'],
    statement: `Given an array of n integers, compute and print their sum.

Constraints:
- 1 <= n <= 10^5
- -10^4 <= arr[i] <= 10^4`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '4\n1 2 3 4', output: '10' },
      { input: '3\n-1 0 1', output: '0' },
    ],
    hiddenTestCases: [
      { input: '1\n0', output: '0' },
      { input: '5\n10 20 30 40 50', output: '150' },
      { input: '3\n-10000 -10000 -10000', output: '-30000' },
    ],
  },
  {
    name: 'Armstrong Number',
    slug: 'armstrong-number',
    difficulty: 'Easy',
    tags: ['math'],
    statement: `A number is an Armstrong number if the sum of its digits each raised to the power of the number of digits equals the number itself.
Example: 153 = 1^3 + 5^3 + 3^3 = 153

Given a number n, print YES if it is an Armstrong number, NO otherwise.

Constraints:
- 1 <= n <= 10^6`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '153', output: 'YES' },
      { input: '123', output: 'NO' },
    ],
    hiddenTestCases: [
      { input: '1', output: 'YES' },
      { input: '370', output: 'YES' },
      { input: '100', output: 'NO' },
    ],
  },
  {
    name: 'Binary Search',
    slug: 'binary-search',
    difficulty: 'Easy',
    tags: ['array', 'searching'],
    statement: `Given a sorted array of n integers and a target value, return the index of the target using binary search. If not found, print -1.

Constraints:
- 1 <= n <= 10^4
- Array is sorted in ascending order
- -10^9 <= arr[i], target <= 10^9`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '5 3\n1 2 3 4 5', output: '2' },
      { input: '4 7\n1 3 5 9', output: '-1' },
    ],
    hiddenTestCases: [
      { input: '1 1\n1', output: '0' },
      { input: '6 6\n1 3 5 6 8 10', output: '3' },
      { input: '3 0\n-1 0 1', output: '1' },
    ],
  },
  {
    name: 'Anagram Check',
    slug: 'anagram-check',
    difficulty: 'Easy',
    tags: ['string', 'hash-table'],
    statement: `Given two strings, determine if they are anagrams of each other. Two strings are anagrams if one can be formed by rearranging the letters of the other (case-insensitive). Print YES or NO.

Constraints:
- 1 <= length <= 10^4
- Strings contain only alphabetic characters`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: 'listen\nsilent', output: 'YES' },
      { input: 'hello\nworld', output: 'NO' },
    ],
    hiddenTestCases: [
      { input: 'Triangle\nIntegral', output: 'YES' },
      { input: 'abc\nabc', output: 'YES' },
      { input: 'ab\nabc', output: 'NO' },
    ],
  },

  // ─── MEDIUM ─────────────────────────────────────────────────────────────
  {
    name: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'Medium',
    tags: ['string', 'stack'],
    statement: `Given a string containing only '(', ')', '{', '}', '[' and ']', determine if the input string is valid.
An input string is valid if:
- Open brackets are closed by the same type of brackets
- Open brackets are closed in the correct order

Print YES if valid, NO otherwise.

Constraints:
- 1 <= length <= 10^4`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '()', output: 'YES' },
      { input: '([)]', output: 'NO' },
    ],
    hiddenTestCases: [
      { input: '()[]{}', output: 'YES' },
      { input: '{[]}', output: 'YES' },
      { input: '((((', output: 'NO' },
    ],
  },
  {
    name: 'Merge Two Sorted Arrays',
    slug: 'merge-sorted-arrays',
    difficulty: 'Medium',
    tags: ['array', 'sorting'],
    statement: `Given two sorted arrays, merge them into a single sorted array and print it.

Input format:
- First line: n m (sizes of arrays)
- Second line: n elements of first array
- Third line: m elements of second array

Constraints:
- 1 <= n, m <= 10^4
- -10^9 <= arr[i] <= 10^9`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '3 3\n1 3 5\n2 4 6', output: '1 2 3 4 5 6' },
      { input: '2 3\n1 5\n2 3 4', output: '1 2 3 4 5' },
    ],
    hiddenTestCases: [
      { input: '1 1\n1\n2', output: '1 2' },
      { input: '3 1\n1 2 3\n0', output: '0 1 2 3' },
      { input: '2 2\n-2 -1\n0 1', output: '-2 -1 0 1' },
    ],
  },
  {
    name: 'Longest Common Prefix',
    slug: 'longest-common-prefix',
    difficulty: 'Medium',
    tags: ['string'],
    statement: `Given n strings, find the longest common prefix among all of them. If no common prefix exists, print "none".

Input format:
- First line: n (number of strings)
- Next n lines: one string each

Constraints:
- 1 <= n <= 200
- 1 <= length of each string <= 200`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '3\nflower\nflow\nflight', output: 'fl' },
      { input: '3\ndog\ncar\nrace', output: 'none' },
    ],
    hiddenTestCases: [
      { input: '1\nalone', output: 'alone' },
      { input: '2\ninterspec\ninterstellar', output: 'inters' },
      { input: '3\nabc\nabc\nabc', output: 'abc' },
    ],
  },
  {
    name: 'Count Occurrences',
    slug: 'count-occurrences',
    difficulty: 'Medium',
    tags: ['array', 'hash-table'],
    statement: `Given an array of n integers, print each unique element and its frequency in ascending order of the element.

Input format:
- First line: n
- Second line: n integers

Output format:
- One line per unique element: "element count"

Constraints:
- 1 <= n <= 10^4
- -10^4 <= arr[i] <= 10^4`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '5\n1 2 2 3 1', output: '1 2\n2 2\n3 1' },
      { input: '3\n5 5 5', output: '5 3' },
    ],
    hiddenTestCases: [
      { input: '1\n7', output: '7 1' },
      { input: '4\n-1 0 1 0', output: '-1 1\n0 2\n1 1' },
      { input: '5\n3 1 2 1 3', output: '1 2\n2 1\n3 2' },
    ],
  },
  {
    name: 'Remove Duplicates',
    slug: 'remove-duplicates',
    difficulty: 'Medium',
    tags: ['array'],
    statement: `Given a sorted array, remove duplicates in-place and print the resulting array with unique elements only, maintaining order.

Constraints:
- 1 <= n <= 10^4
- Array is sorted in non-decreasing order`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '5\n1 1 2 3 3', output: '1 2 3' },
      { input: '4\n1 1 1 1', output: '1' },
    ],
    hiddenTestCases: [
      { input: '1\n5', output: '5' },
      { input: '6\n0 0 1 1 2 3', output: '0 1 2 3' },
      { input: '5\n1 2 3 4 5', output: '1 2 3 4 5' },
    ],
  },
  {
    name: 'Matrix Diagonal Sum',
    slug: 'matrix-diagonal-sum',
    difficulty: 'Medium',
    tags: ['array', 'math'],
    statement: `Given an n x n matrix, compute the sum of both diagonals. If n is odd, the center element should be counted only once.

Input format:
- First line: n
- Next n lines: n integers each

Constraints:
- 1 <= n <= 100
- -100 <= matrix[i][j] <= 100`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '3\n1 2 3\n4 5 6\n7 8 9', output: '25' },
      { input: '2\n1 2\n3 4', output: '10' },
    ],
    hiddenTestCases: [
      { input: '1\n5', output: '5' },
      { input: '4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16', output: '68' },
      { input: '3\n-1 0 1\n0 0 0\n1 0 -1', output: '-2' },
    ],
  },
  {
    name: 'Rotate Array',
    slug: 'rotate-array',
    difficulty: 'Medium',
    tags: ['array'],
    statement: `Given an array of n integers and a number k, rotate the array to the right by k steps and print the result.

Input format:
- First line: n k
- Second line: n integers

Constraints:
- 1 <= n <= 10^4
- 0 <= k <= 10^5`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '5 2\n1 2 3 4 5', output: '4 5 1 2 3' },
      { input: '3 1\n1 2 3', output: '3 1 2' },
    ],
    hiddenTestCases: [
      { input: '1 0\n1', output: '1' },
      { input: '4 4\n1 2 3 4', output: '1 2 3 4' },
      { input: '5 7\n1 2 3 4 5', output: '4 5 1 2 3' },
    ],
  },
  {
    name: 'Missing Number',
    slug: 'missing-number',
    difficulty: 'Medium',
    tags: ['array', 'math'],
    statement: `Given an array containing n distinct numbers taken from 0, 1, 2, ..., n, find the one number that is missing.

Input format:
- First line: n
- Second line: n integers

Constraints:
- 1 <= n <= 10^4
- All numbers in range [0, n] appear exactly once except one`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '3\n3 0 1', output: '2' },
      { input: '4\n0 1 2 3', output: '4' },
    ],
    hiddenTestCases: [
      { input: '1\n1', output: '0' },
      { input: '5\n0 1 3 4 5', output: '2' },
      { input: '6\n6 5 4 2 1 0', output: '3' },
    ],
  },
  {
    name: 'Power of Two',
    slug: 'power-of-two',
    difficulty: 'Medium',
    tags: ['math', 'bit-manipulation'],
    statement: `Given an integer n, determine if it is a power of two. Print YES or NO.
A number is a power of two if there exists an integer x such that n == 2^x.

Constraints:
- -2^31 <= n <= 2^31 - 1`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '16', output: 'YES' },
      { input: '6', output: 'NO' },
    ],
    hiddenTestCases: [
      { input: '1', output: 'YES' },
      { input: '0', output: 'NO' },
      { input: '-16', output: 'NO' },
    ],
  },
  {
    name: 'String Compression',
    slug: 'string-compression',
    difficulty: 'Medium',
    tags: ['string'],
    statement: `Implement basic string compression using counts of repeated characters.
For example "aabcccdddd" becomes "a2b1c3d4".
If the compressed string is not smaller than the original, print the original string.

Constraints:
- 1 <= length <= 10^4
- String contains only lowercase letters`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: 'aabcccdddd', output: 'a2b1c3d4' },
      { input: 'abc', output: 'abc' },
    ],
    hiddenTestCases: [
      { input: 'aaa', output: 'a3' },
      { input: 'aabb', output: 'aabb' },
      { input: 'aaabbbccc', output: 'a3b3c3' },
    ],
  },

  // ─── HARD ────────────────────────────────────────────────────────────────
  {
    name: 'Longest Substring Without Repeating',
    slug: 'longest-substring-no-repeat',
    difficulty: 'Hard',
    tags: ['string', 'sliding-window', 'hash-table'],
    statement: `Given a string, find the length of the longest substring without repeating characters.

Constraints:
- 0 <= length <= 5 * 10^4
- String consists of English letters, digits, symbols and spaces`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: 'abcabcbb', output: '3' },
      { input: 'bbbbb', output: '1' },
    ],
    hiddenTestCases: [
      { input: 'pwwkew', output: '3' },
      { input: '', output: '0' },
      { input: 'dvdf', output: '3' },
    ],
  },
  {
    name: '3Sum',
    slug: 'three-sum',
    difficulty: 'Hard',
    tags: ['array', 'sorting', 'two-pointers'],
    statement: `Given an integer array, find all unique triplets that sum to zero. Print each triplet on a new line with elements separated by spaces, sorted in ascending order. Print triplets in lexicographic order. If none exist, print "none".

Input format:
- First line: n
- Second line: n integers

Constraints:
- 3 <= n <= 3000
- -10^5 <= nums[i] <= 10^5`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '6\n-1 0 1 2 -1 -4', output: '-1 -1 2\n-1 0 1' },
      { input: '3\n0 0 0', output: '0 0 0' },
    ],
    hiddenTestCases: [
      { input: '3\n1 2 3', output: 'none' },
      { input: '4\n-2 0 1 1', output: '-2 1 1' },
      { input: '5\n-4 -1 -1 0 1 2', output: '-4 -1 -1 0 1 2' },
    ],
  },
  {
    name: 'Jump Game',
    slug: 'jump-game',
    difficulty: 'Hard',
    tags: ['array', 'greedy'],
    statement: `Given an array of non-negative integers where each element represents the maximum jump length from that position, determine if you can reach the last index starting from index 0. Print YES or NO.

Constraints:
- 1 <= n <= 3 * 10^4
- 0 <= nums[i] <= 10^5`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '5\n2 3 1 1 4', output: 'YES' },
      { input: '5\n3 2 1 0 4', output: 'NO' },
    ],
    hiddenTestCases: [
      { input: '1\n0', output: 'YES' },
      { input: '3\n0 2 3', output: 'NO' },
      { input: '4\n3 0 0 1', output: 'YES' },
    ],
  },
  {
    name: 'Coin Change',
    slug: 'coin-change',
    difficulty: 'Hard',
    tags: ['dynamic-programming', 'array'],
    statement: `Given an array of coin denominations and an amount, find the minimum number of coins needed to make up that amount. If it cannot be made up, print -1.

Input format:
- First line: n amount
- Second line: n coin denominations

Constraints:
- 1 <= n <= 12
- 1 <= coins[i] <= 2^31 - 1
- 0 <= amount <= 10^4`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '3 11\n1 5 6', output: '2' },
      { input: '2 3\n2 4', output: '-1' },
    ],
    hiddenTestCases: [
      { input: '1 0\n1', output: '0' },
      { input: '3 100\n1 5 10', output: '10' },
      { input: '2 7\n3 5', output: '-1' },
    ],
  },
  {
    name: 'Subarray Sum Equals K',
    slug: 'subarray-sum-k',
    difficulty: 'Hard',
    tags: ['array', 'hash-table', 'prefix-sum'],
    statement: `Given an array of integers and an integer k, find the total number of continuous subarrays whose sum equals k.

Input format:
- First line: n k
- Second line: n integers

Constraints:
- 1 <= n <= 2 * 10^4
- -1000 <= nums[i] <= 1000
- -10^7 <= k <= 10^7`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '5 2\n1 1 1 2 3', output: '4' },
      { input: '3 3\n1 2 3', output: '2' },
    ],
    hiddenTestCases: [
      { input: '1 0\n0', output: '1' },
      { input: '4 0\n0 0 0 0', output: '10' },
      { input: '3 -1\n1 -1 0', output: '3' },
    ],
  },
  {
    name: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    difficulty: 'Hard',
    tags: ['array', 'two-pointers', 'dynamic-programming'],
    statement: `Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.

Input format:
- First line: n
- Second line: n integers representing heights

Constraints:
- 1 <= n <= 2 * 10^4
- 0 <= height[i] <= 10^5`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', output: '6' },
      { input: '6\n4 2 0 3 2 5', output: '9' },
    ],
    hiddenTestCases: [
      { input: '1\n5', output: '0' },
      { input: '4\n3 0 0 3', output: '6' },
      { input: '5\n0 1 0 1 0', output: '1' },
    ],
  },
  {
    name: 'Median of Two Sorted Arrays',
    slug: 'median-two-sorted-arrays',
    difficulty: 'Hard',
    tags: ['array', 'binary-search', 'divide-and-conquer'],
    statement: `Given two sorted arrays, find the median of the combined sorted array. If the total length is even, print the average of the two middle elements as a decimal with exactly one decimal place.

Input format:
- First line: n m
- Second line: n elements of first array
- Third line: m elements of second array

Constraints:
- 0 <= n, m <= 1000
- -10^6 <= arr[i] <= 10^6
- Total length >= 1`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '2 2\n1 3\n2 4', output: '2.5' },
      { input: '2 1\n1 2\n3', output: '2.0' },
    ],
    hiddenTestCases: [
      { input: '1 2\n2\n1 3', output: '2.0' },
      { input: '3 3\n1 2 3\n4 5 6', output: '3.5' },
      { input: '1 1\n1\n1', output: '1.0' },
    ],
  },
  {
    name: 'Word Search',
    slug: 'word-search',
    difficulty: 'Hard',
    tags: ['array', 'backtracking', 'depth-first-search'],
    statement: `Given an m x n grid of characters and a target word, return YES if the word exists in the grid, NO otherwise.
The word can be constructed from letters of sequentially adjacent cells (horizontally or vertically). The same cell may not be used more than once.

Input format:
- First line: m n
- Next m lines: n characters each (no spaces)
- Last line: the target word

Constraints:
- 1 <= m, n <= 6
- 1 <= word length <= 15
- Grid and word contain only uppercase English letters`,
    timeLimit: 5000,
    memoryLimit: 256,
    sampleTestCases: [
      { input: '4 4\nABCE\nSFCS\nADEE\nword\nSEE', output: 'YES' },
      { input: '4 4\nABCE\nSFCS\nADEE\nABCB', output: 'NO' },
    ],
    hiddenTestCases: [
      { input: '1 1\nA\nA', output: 'YES' },
      { input: '2 2\nAB\nCD\nABDC', output: 'YES' },
      { input: '2 3\nABC\nDEF\nCAF', output: 'NO' },
    ],
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connected to MongoDB');

    // find admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      logger.error('No admin user found. Please create one first.');
      process.exit(1);
    }

    logger.info(`Using admin: ${admin.username}`);

    let created = 0;
    let skipped = 0;

    for (const p of problems) {
      // check if already exists
      const existing = await Problem.findOne({ slug: p.slug });
      if (existing) {
        logger.info(`Skipping existing problem: ${p.name}`);
        skipped++;
        continue;
      }

      // create problem
      const problem = await Problem.create({
        name: p.name,
        slug: p.slug,
        difficulty: p.difficulty,
        tags: p.tags,
        statement: p.statement,
        timeLimit: p.timeLimit,
        memoryLimit: p.memoryLimit,
        createdBy: admin._id,
      });

      // create test cases
      const testCases = [
        ...p.sampleTestCases.map(tc => ({
          problem: problem._id,
          input: tc.input,
          output: tc.output,
          isSample: true,
        })),
        ...p.hiddenTestCases.map(tc => ({
          problem: problem._id,
          input: tc.input,
          output: tc.output,
          isSample: false,
        })),
      ];

      await TestCase.insertMany(testCases);
      logger.info(`Created: ${p.name} (${p.difficulty}) — ${testCases.length} test cases`);
      created++;
    }

    logger.info(`\nSeed complete: ${created} created, ${skipped} skipped`);
    process.exit(0);
  } catch (err) {
    logger.error(`Seed failed: ${err.message}`);
    process.exit(1);
  }
};

seed();