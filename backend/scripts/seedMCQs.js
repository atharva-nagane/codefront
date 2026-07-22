require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const MCQ = require('../src/features/battle/mcq.model');
const logger = require('../src/shared/utils/logger');

// ─── EASY (fundamentals) ─────────────────────────────────────────────────
const easy = [
  {
    question: 'What is the time complexity of accessing an element in an array by index?',
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
    correctIndex: 0,
    explanation: 'Arrays support random access — the memory address of any index is computed directly from the base address, so it takes constant time.',
    difficulty: 'Easy', topic: 'complexity',
  },
  {
    question: 'Which data structure uses LIFO (Last In, First Out) ordering?',
    options: ['Queue', 'Stack', 'Linked List', 'Array'],
    correctIndex: 1,
    explanation: 'A stack pushes and pops from the same end, so the last element inserted is the first one removed — LIFO.',
    difficulty: 'Easy', topic: 'stacks',
  },
  {
    question: 'What is the worst-case time complexity of linear search on an unsorted array of n elements?',
    options: ['O(log n)', 'O(1)', 'O(n)', 'O(n^2)'],
    correctIndex: 2,
    explanation: 'Linear search may have to check every element once before finding (or failing to find) the target, giving O(n).',
    difficulty: 'Easy', topic: 'searching',
  },
  {
    question: 'Which data structure uses FIFO (First In, First Out) ordering?',
    options: ['Stack', 'Queue', 'Tree', 'Graph'],
    correctIndex: 1,
    explanation: 'A queue enqueues at the rear and dequeues from the front, so the first element inserted is the first removed — FIFO.',
    difficulty: 'Easy', topic: 'queues',
  },
  {
    question: 'What is the time complexity of binary search on a sorted array of n elements?',
    options: ['O(n)', 'O(n log n)', 'O(log n)', 'O(1)'],
    correctIndex: 2,
    explanation: 'Binary search halves the search space on each comparison, giving a logarithmic number of steps.',
    difficulty: 'Easy', topic: 'searching',
  },
  {
    question: 'In a singly linked list, what is the time complexity of inserting a node at the head?',
    options: ['O(n)', 'O(1)', 'O(log n)', 'O(n^2)'],
    correctIndex: 1,
    explanation: 'Inserting at the head only requires updating the new node\'s next pointer and the head reference — constant time.',
    difficulty: 'Easy', topic: 'linked-lists',
  },
  {
    question: 'What is the space complexity of storing an n x n 2D matrix?',
    options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(1)'],
    correctIndex: 2,
    explanation: 'An n x n matrix has n^2 cells, each requiring storage, so space usage grows quadratically with n.',
    difficulty: 'Easy', topic: 'arrays',
  },
  {
    question: 'Which traversal of a binary tree visits nodes level by level?',
    options: ['Inorder', 'Preorder', 'Postorder', 'Breadth-First (Level Order)'],
    correctIndex: 3,
    explanation: 'BFS/level-order traversal uses a queue to visit all nodes at depth d before moving to depth d+1.',
    difficulty: 'Easy', topic: 'trees',
  },
  {
    question: 'What is the average-case time complexity of searching for a key in a hash table?',
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
    correctIndex: 0,
    explanation: 'With a good hash function and low load factor, lookups resolve to a single bucket check on average, giving O(1).',
    difficulty: 'Easy', topic: 'hashing',
  },
  {
    question: 'What does the acronym "DSA" stand for in the context of technical interviews?',
    options: ['Data Structures and Algorithms', 'Digital Systems Architecture', 'Data Storage Access', 'Dynamic Search Algorithm'],
    correctIndex: 0,
    explanation: 'DSA refers to the study of data structures (how data is organized) and algorithms (how it is processed).',
    difficulty: 'Easy', topic: 'general',
  },
  {
    question: 'What is the time complexity of pushing an element onto a stack (array-backed, no resize needed)?',
    options: ['O(n)', 'O(1)', 'O(log n)', 'O(n^2)'],
    correctIndex: 1,
    explanation: 'Pushing just writes to the next free slot and increments the top pointer — constant time.',
    difficulty: 'Easy', topic: 'stacks',
  },
  {
    question: 'Which of these best describes recursion?',
    options: ['A loop that never terminates', 'A function that calls itself to solve smaller subproblems', 'A sorting technique', 'A way to store key-value pairs'],
    correctIndex: 1,
    explanation: 'Recursion solves a problem by having a function call itself on smaller instances until a base case is reached.',
    difficulty: 'Easy', topic: 'recursion',
  },
  {
    question: 'What is the height of a balanced binary search tree with n nodes?',
    options: ['O(n)', 'O(n^2)', 'O(log n)', 'O(1)'],
    correctIndex: 2,
    explanation: 'A balanced BST keeps left and right subtrees roughly equal in size, so height grows logarithmically with n.',
    difficulty: 'Easy', topic: 'trees',
  },
  {
    question: 'What is the time complexity of Bubble Sort in the worst case?',
    options: ['O(n log n)', 'O(n)', 'O(n^2)', 'O(log n)'],
    correctIndex: 2,
    explanation: 'Bubble Sort repeatedly compares and swaps adjacent elements across n passes over n elements, giving O(n^2).',
    difficulty: 'Easy', topic: 'sorting',
  },
  {
    question: 'Which data structure is best suited for implementing "undo" functionality in an editor?',
    options: ['Queue', 'Stack', 'Hash Table', 'Graph'],
    correctIndex: 1,
    explanation: 'Undo needs to reverse the most recent action first — exactly the LIFO behavior a stack provides.',
    difficulty: 'Easy', topic: 'stacks',
  },
  {
    question: 'What is the main difference between a stack and a queue?',
    options: ['Stacks are always sorted', 'Stack is LIFO, Queue is FIFO', 'Queues can only store numbers', 'There is no difference'],
    correctIndex: 1,
    explanation: 'A stack removes the most recently added element first (LIFO); a queue removes the oldest element first (FIFO).',
    difficulty: 'Easy', topic: 'queues',
  },
  {
    question: 'What is the time complexity to append an element to a dynamic array (amortized)?',
    options: ['O(n)', 'O(log n)', 'O(1) amortized', 'O(n^2)'],
    correctIndex: 2,
    explanation: 'Occasional resizing costs O(n), but spread across many appends it averages out to O(1) amortized.',
    difficulty: 'Easy', topic: 'arrays',
  },
  {
    question: 'In a min-heap, where is the smallest element always located?',
    options: ['At a leaf node', 'At the root', 'At the last index', 'It can be anywhere'],
    correctIndex: 1,
    explanation: 'A min-heap maintains the invariant that every parent is smaller than its children, so the minimum is always at the root.',
    difficulty: 'Easy', topic: 'trees',
  },
  {
    question: 'What is the time complexity of deleting a node from the middle of a doubly linked list, given a pointer to it?',
    options: ['O(n)', 'O(1)', 'O(log n)', 'O(n log n)'],
    correctIndex: 1,
    explanation: 'With a direct pointer to the node and access to its neighbors, updating the links takes constant time.',
    difficulty: 'Easy', topic: 'linked-lists',
  },
  {
    question: 'Which of the following is NOT a linear data structure?',
    options: ['Array', 'Linked List', 'Tree', 'Stack'],
    correctIndex: 2,
    explanation: 'A tree is a hierarchical (non-linear) data structure; arrays, linked lists, and stacks store elements sequentially.',
    difficulty: 'Easy', topic: 'trees',
  },
  {
    question: 'What is the base case in a recursive function?',
    options: ['The first call made to the function', 'The condition that stops further recursive calls', 'The slowest part of the recursion', 'A syntax error'],
    correctIndex: 1,
    explanation: 'The base case is the terminating condition that returns a value directly instead of recursing further, preventing infinite recursion.',
    difficulty: 'Easy', topic: 'recursion',
  },
  {
    question: 'What does "in-place" mean when describing a sorting algorithm?',
    options: ['It sorts using recursion only', 'It uses O(1) extra space besides the input array', 'It only works on sorted input', 'It sorts strings only'],
    correctIndex: 1,
    explanation: 'An in-place algorithm rearranges elements within the original structure, needing only a constant amount of extra memory.',
    difficulty: 'Easy', topic: 'sorting',
  },
  {
    question: 'What is the time complexity of checking if a key exists in a balanced binary search tree?',
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
    correctIndex: 2,
    explanation: 'At each step you eliminate one subtree, so the search depth — and thus time — is logarithmic in a balanced BST.',
    difficulty: 'Easy', topic: 'trees',
  },
  {
    question: 'Which of these operations does a hash table NOT typically support in O(1) average time?',
    options: ['Insert', 'Search', 'Delete', 'Finding the minimum element'],
    correctIndex: 3,
    explanation: 'Hash tables have no inherent ordering, so finding the minimum requires scanning all elements — O(n), unlike insert/search/delete.',
    difficulty: 'Easy', topic: 'hashing',
  },
  {
    question: 'What is a "collision" in the context of hash tables?',
    options: ['Two threads writing at once', 'Two different keys mapping to the same bucket/index', 'A hash table running out of memory', 'An invalid key type'],
    correctIndex: 1,
    explanation: 'A collision occurs when the hash function produces the same index for two distinct keys, requiring a resolution strategy like chaining.',
    difficulty: 'Easy', topic: 'hashing',
  },
  {
    question: 'What is the time complexity of Selection Sort in all cases (best, average, worst)?',
    options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'],
    correctIndex: 2,
    explanation: 'Selection Sort always scans the remaining unsorted portion to find the minimum, doing this n times regardless of input order — O(n^2).',
    difficulty: 'Easy', topic: 'sorting',
  },
  {
    question: 'Which of the following best describes an "edge" in graph terminology?',
    options: ['A node with no connections', 'A connection between two vertices', 'The outermost node in a tree', 'A duplicate vertex'],
    correctIndex: 1,
    explanation: 'An edge represents a relationship or connection between two vertices (nodes) in a graph.',
    difficulty: 'Easy', topic: 'graphs',
  },
  {
    question: 'What is the time complexity of Depth-First Search (DFS) on a graph with V vertices and E edges?',
    options: ['O(V)', 'O(E)', 'O(V + E)', 'O(V * E)'],
    correctIndex: 2,
    explanation: 'DFS visits every vertex once and explores every edge once (in an adjacency list representation), giving O(V + E).',
    difficulty: 'Easy', topic: 'graphs',
  },
  {
    question: 'Which traversal visits the root node between the left and right subtrees?',
    options: ['Preorder', 'Postorder', 'Inorder', 'Level order'],
    correctIndex: 2,
    explanation: 'Inorder traversal visits left subtree, then root, then right subtree — for a BST this yields sorted order.',
    difficulty: 'Easy', topic: 'trees',
  },
  {
    question: 'What is the maximum number of children a node can have in a binary tree?',
    options: ['1', '2', '3', 'Unlimited'],
    correctIndex: 1,
    explanation: 'By definition, each node in a binary tree has at most two children — commonly called left and right.',
    difficulty: 'Easy', topic: 'trees',
  },
  {
    question: 'What is the time complexity of enqueue and dequeue operations on a properly implemented circular queue?',
    options: ['O(n) for both', 'O(1) for both', 'O(log n) for both', 'O(1) enqueue, O(n) dequeue'],
    correctIndex: 1,
    explanation: 'A circular queue tracks front and rear pointers, so both enqueue and dequeue are constant-time operations.',
    difficulty: 'Easy', topic: 'queues',
  },
  {
    question: 'Which of the following correctly orders these growth rates from fastest to slowest?',
    options: ['O(n^2) < O(n log n) < O(n) < O(log n)', 'O(log n) < O(n) < O(n log n) < O(n^2)', 'O(n) < O(log n) < O(n^2) < O(n log n)', 'O(n^2) < O(log n) < O(n) < O(n log n)'],
    correctIndex: 1,
    explanation: 'From fastest-growing (worst) to slowest-growing (best): O(n^2) is worse than O(n log n), which is worse than O(n), which is worse than O(log n).',
    difficulty: 'Easy', topic: 'complexity',
  },
];

// ─── MEDIUM (applied reasoning) ──────────────────────────────────────────
const medium = [
  {
    question: 'What is the average-case time complexity of inserting a node into a balanced binary search tree?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctIndex: 1,
    explanation: 'Insertion follows a root-to-leaf path determined by comparisons, and that path has length O(log n) in a balanced tree.',
    difficulty: 'Medium', topic: 'trees',
  },
  {
    question: 'What is the space complexity of the recursive Fibonacci implementation (naive, no memoization)?',
    options: ['O(1)', 'O(n)', 'O(2^n)', 'O(log n)'],
    correctIndex: 1,
    explanation: 'Although the naive recursion does O(2^n) work, the recursion call stack depth is only O(n), which bounds the space used.',
    difficulty: 'Medium', topic: 'recursion',
  },
  {
    question: 'What is the time complexity of Merge Sort in the worst case?',
    options: ['O(n)', 'O(n^2)', 'O(n log n)', 'O(log n)'],
    correctIndex: 2,
    explanation: 'Merge Sort splits the array in half recursively (log n levels) and merges in O(n) per level, giving O(n log n) regardless of input.',
    difficulty: 'Medium', topic: 'sorting',
  },
  {
    question: 'Which data structure is most efficient for implementing a priority queue?',
    options: ['Unsorted array', 'Linked list', 'Binary heap', 'Stack'],
    correctIndex: 2,
    explanation: 'A binary heap gives O(log n) insert and extract-min/max, far better than the O(n) scans an unsorted array or linked list would need.',
    difficulty: 'Medium', topic: 'trees',
  },
  {
    question: 'What is the worst-case time complexity of QuickSort?',
    options: ['O(n log n)', 'O(n)', 'O(n^2)', 'O(log n)'],
    correctIndex: 2,
    explanation: 'If the pivot chosen is always the smallest or largest element (e.g. already-sorted input with a naive pivot), partitions become unbalanced, degrading to O(n^2).',
    difficulty: 'Medium', topic: 'sorting',
  },
  {
    question: 'Which technique does Dynamic Programming rely on to avoid recomputation?',
    options: ['Recursion without base cases', 'Storing results of overlapping subproblems', 'Always sorting the input first', 'Using multiple threads'],
    correctIndex: 1,
    explanation: 'DP caches (memoizes) results of subproblems so that overlapping subproblems are computed once and reused, not recomputed.',
    difficulty: 'Medium', topic: 'dynamic-programming',
  },
  {
    question: 'What is the time complexity of BFS for finding the shortest path in an unweighted graph with V vertices and E edges?',
    options: ['O(V)', 'O(V + E)', 'O(V^2)', 'O(E log V)'],
    correctIndex: 1,
    explanation: 'BFS visits every vertex once and every edge once, so it runs in O(V + E) and naturally finds shortest paths by level in unweighted graphs.',
    difficulty: 'Medium', topic: 'graphs',
  },
  {
    question: 'What does the "greedy" approach to algorithm design mean?',
    options: ['Trying every possible combination', 'Making the locally optimal choice at each step, hoping for a global optimum', 'Always using recursion', 'Sorting the input before any computation'],
    correctIndex: 1,
    explanation: 'Greedy algorithms pick the best-looking option at each step without reconsidering past choices, which works when the problem has optimal substructure and the greedy-choice property.',
    difficulty: 'Medium', topic: 'greedy',
  },
  {
    question: 'What is the time complexity of building a heap from an unsorted array of n elements (heapify)?',
    options: ['O(n log n)', 'O(n)', 'O(n^2)', 'O(log n)'],
    correctIndex: 1,
    explanation: 'Although it looks like O(n log n) at first glance, a tighter amortized analysis shows bottom-up heap construction is O(n).',
    difficulty: 'Medium', topic: 'trees',
  },
  {
    question: 'In a hash table using separate chaining, what happens to lookup time complexity as the load factor grows very large?',
    options: ['It stays O(1)', 'It degrades towards O(n)', 'It becomes O(log n)', 'It becomes O(1) always due to hashing'],
    correctIndex: 1,
    explanation: 'As more keys collide into the same buckets, each bucket becomes a longer chain to scan linearly, degrading average lookup toward O(n).',
    difficulty: 'Medium', topic: 'hashing',
  },
  {
    question: 'What is the key property that makes a problem suitable for Dynamic Programming?',
    options: ['It must be solvable in O(1)', 'Overlapping subproblems and optimal substructure', 'It must involve sorting', 'It must be a graph problem'],
    correctIndex: 1,
    explanation: 'DP applies when a problem breaks into subproblems that repeat (overlapping subproblems) and whose optimal solutions combine into the overall optimal solution (optimal substructure).',
    difficulty: 'Medium', topic: 'dynamic-programming',
  },
  {
    question: 'What is the time complexity of finding the Lowest Common Ancestor (LCA) in a balanced binary search tree?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctIndex: 1,
    explanation: 'Starting at the root, you can walk down toward the split point using BST ordering, taking O(log n) steps in a balanced tree.',
    difficulty: 'Medium', topic: 'trees',
  },
  {
    question: 'Which sorting algorithm is generally preferred for nearly-sorted or small datasets due to its low overhead?',
    options: ['Merge Sort', 'Heap Sort', 'Insertion Sort', 'Quick Sort'],
    correctIndex: 2,
    explanation: 'Insertion Sort runs close to O(n) on nearly-sorted data and has minimal overhead, making it efficient for small or almost-sorted inputs.',
    difficulty: 'Medium', topic: 'sorting',
  },
  {
    question: 'What is the time complexity of the Union and Find operations in a Union-Find (DSU) structure with path compression and union by rank?',
    options: ['O(log n)', 'O(n)', 'Nearly O(1) (inverse Ackermann)', 'O(n log n)'],
    correctIndex: 2,
    explanation: 'With both optimizations, amortized time per operation is O(alpha(n)), the inverse Ackermann function, which is effectively constant for all practical n.',
    difficulty: 'Medium', topic: 'graphs',
  },
  {
    question: 'What is the primary advantage of a doubly linked list over a singly linked list?',
    options: ['It uses less memory', 'It allows traversal in both directions', 'It has O(1) random access', 'It cannot have cycles'],
    correctIndex: 1,
    explanation: 'Each node in a doubly linked list stores pointers to both its next and previous nodes, enabling backward as well as forward traversal.',
    difficulty: 'Medium', topic: 'linked-lists',
  },
  {
    question: 'What is the time complexity of Counting Sort for an array of n integers within range [0, k]?',
    options: ['O(n log n)', 'O(n + k)', 'O(n^2)', 'O(k log k)'],
    correctIndex: 1,
    explanation: 'Counting Sort tallies frequencies in a range-k array (O(k)) then outputs elements in order (O(n)), for a combined O(n + k), which beats comparison sorts when k is small.',
    difficulty: 'Medium', topic: 'sorting',
  },
  {
    question: 'Which traversal order of a binary tree is used to create a copy of the tree (visiting root before children)?',
    options: ['Inorder', 'Postorder', 'Preorder', 'Level order'],
    correctIndex: 2,
    explanation: 'Preorder (root, left, right) visits the root first, which is exactly the order needed to reconstruct or clone the tree top-down.',
    difficulty: 'Medium', topic: 'trees',
  },
  {
    question: 'What is the time complexity of the "two pointer" technique for finding a pair with a given sum in a sorted array?',
    options: ['O(n^2)', 'O(n)', 'O(log n)', 'O(n log n)'],
    correctIndex: 1,
    explanation: 'Two pointers starting from both ends move inward based on comparisons, each element visited at most once, giving a single O(n) pass.',
    difficulty: 'Medium', topic: 'arrays',
  },
  {
    question: 'What does memoization refer to in recursive algorithms?',
    options: ['Removing recursion entirely', 'Caching results of function calls to avoid redundant computation', 'Sorting recursive calls by depth', 'Running recursive calls in parallel'],
    correctIndex: 1,
    explanation: 'Memoization stores the result of a function call keyed by its input, so future calls with the same input return the cached result instead of recomputing.',
    difficulty: 'Medium', topic: 'dynamic-programming',
  },
  {
    question: 'In a max-heap represented as an array, what is the index of the left child of the node at index i (0-indexed)?',
    options: ['i / 2', '2i + 1', '2i', '2i - 1'],
    correctIndex: 1,
    explanation: 'For a 0-indexed array-based heap, the left child of node i sits at index 2i + 1, and the right child at 2i + 2.',
    difficulty: 'Medium', topic: 'trees',
  },
  {
    question: 'What is the time complexity of topological sort on a DAG with V vertices and E edges?',
    options: ['O(V log V)', 'O(V + E)', 'O(V^2)', 'O(E log E)'],
    correctIndex: 1,
    explanation: 'Both Kahn\'s algorithm and DFS-based topological sort process each vertex and edge once, giving O(V + E).',
    difficulty: 'Medium', topic: 'graphs',
  },
  {
    question: 'Which of these is a valid use case for a trie (prefix tree)?',
    options: ['Finding the shortest path in a graph', 'Autocomplete / prefix-based search on a dictionary of words', 'Sorting an array of numbers', 'Detecting cycles in a linked list'],
    correctIndex: 1,
    explanation: 'A trie stores strings character by character along shared paths, making prefix lookups and autocomplete very efficient.',
    difficulty: 'Medium', topic: 'trees',
  },
  {
    question: 'What is the time complexity of Radix Sort for n numbers with d digits each?',
    options: ['O(n log n)', 'O(d * n)', 'O(n^2)', 'O(d log n)'],
    correctIndex: 1,
    explanation: 'Radix Sort performs one counting-sort-like pass per digit, so total work is proportional to the number of digits times n elements: O(d * n).',
    difficulty: 'Medium', topic: 'sorting',
  },
  {
    question: 'What is the space complexity of an adjacency matrix representation for a graph with V vertices?',
    options: ['O(V)', 'O(V + E)', 'O(V^2)', 'O(E)'],
    correctIndex: 2,
    explanation: 'An adjacency matrix stores a V x V grid regardless of how many edges actually exist, giving O(V^2) space.',
    difficulty: 'Medium', topic: 'graphs',
  },
  {
    question: 'When is an adjacency list preferred over an adjacency matrix for representing a graph?',
    options: ['When the graph is dense (many edges)', 'When the graph is sparse (few edges)', 'When you need O(1) edge existence checks', 'Adjacency lists are never preferred'],
    correctIndex: 1,
    explanation: 'Adjacency lists only store existing edges, so for sparse graphs (E much less than V^2) they use far less memory than a full matrix.',
    difficulty: 'Medium', topic: 'graphs',
  },
  {
    question: 'What is the time complexity of the standard iterative binary search implementation in terms of space?',
    options: ['O(log n) space', 'O(n) space', 'O(1) space', 'O(n log n) space'],
    correctIndex: 2,
    explanation: 'The iterative version only tracks a few pointer variables (low, high, mid), using constant extra space, unlike the recursive version which uses O(log n) stack space.',
    difficulty: 'Medium', topic: 'searching',
  },
  {
    question: 'What is the "sliding window" technique primarily used for?',
    options: ['Sorting linked lists', 'Efficiently processing contiguous subarrays/substrings without recomputation', 'Balancing binary trees', 'Hashing large datasets'],
    correctIndex: 1,
    explanation: 'The sliding window technique maintains a running range and incrementally adjusts it, avoiding recomputation of overlapping work when scanning subarrays or substrings.',
    difficulty: 'Medium', topic: 'arrays',
  },
  {
    question: 'What is the time complexity of detecting a cycle in an undirected graph using DFS?',
    options: ['O(V)', 'O(E)', 'O(V + E)', 'O(V * E)'],
    correctIndex: 2,
    explanation: 'DFS-based cycle detection visits each vertex and edge at most once, giving O(V + E), the same as standard DFS traversal.',
    difficulty: 'Medium', topic: 'graphs',
  },
  {
    question: 'Which of the following correctly describes "optimal substructure"?',
    options: ['The problem has only one valid solution', 'An optimal solution to the problem contains optimal solutions to its subproblems', 'The algorithm always runs in polynomial time', 'The data must already be sorted'],
    correctIndex: 1,
    explanation: 'Optimal substructure means you can build the best overall solution by combining the best solutions to smaller subproblems — a prerequisite for both DP and greedy approaches.',
    difficulty: 'Medium', topic: 'dynamic-programming',
  },
  {
    question: 'What is the time complexity of Kadane\'s Algorithm for finding the maximum subarray sum?',
    options: ['O(n^2)', 'O(n log n)', 'O(n)', 'O(log n)'],
    correctIndex: 2,
    explanation: 'Kadane\'s algorithm makes a single pass, tracking the best sum ending at each position, giving linear O(n) time.',
    difficulty: 'Medium', topic: 'dynamic-programming',
  },
];

// ─── HARD (scenario-based algorithm selection) ───────────────────────────
const hard = [
  {
    question: 'You need shortest paths from a single source in a graph that has some negative edge weights but no negative cycles. Which algorithm should you use?',
    options: ['Dijkstra\'s Algorithm', 'Bellman-Ford Algorithm', 'Floyd-Warshall Algorithm', 'Kruskal\'s Algorithm'],
    correctIndex: 1,
    explanation: 'Dijkstra assumes non-negative weights and can give wrong answers with negative edges. Bellman-Ford correctly handles negative weights (and can detect negative cycles) in O(V*E).',
    difficulty: 'Hard', topic: 'graphs',
  },
  {
    question: 'You need all-pairs shortest paths in a dense graph with a small number of vertices (e.g. V <= 400). Which algorithm is most appropriate?',
    options: ['Dijkstra\'s Algorithm run from every vertex', 'Bellman-Ford Algorithm', 'Floyd-Warshall Algorithm', 'Breadth-First Search'],
    correctIndex: 2,
    explanation: 'Floyd-Warshall computes all-pairs shortest paths in O(V^3), which is simple and efficient enough for small dense graphs, and naturally handles negative edges (no negative cycles).',
    difficulty: 'Hard', topic: 'graphs',
  },
  {
    question: 'You have a graph with non-negative edge weights and need the shortest path from a single source to all other vertices, as efficiently as possible. Which algorithm fits best?',
    options: ['Bellman-Ford Algorithm', 'Dijkstra\'s Algorithm', 'Floyd-Warshall Algorithm', 'Depth-First Search'],
    correctIndex: 1,
    explanation: 'Dijkstra\'s algorithm, using a min-heap, finds single-source shortest paths in O((V+E) log V) when all weights are non-negative — faster than Bellman-Ford for this case.',
    difficulty: 'Hard', topic: 'graphs',
  },
  {
    question: 'You need to repeatedly check whether two elements belong to the same group and merge groups efficiently, with no need to ever split them, as edges are added over time. Which structure fits best?',
    options: ['Binary Search Tree', 'Union-Find (Disjoint Set Union)', 'Doubly Linked List', 'Trie'],
    correctIndex: 1,
    explanation: 'DSU is purpose-built for dynamic connectivity: near-constant-time union and find operations with path compression and union by rank, exactly matching this access pattern.',
    difficulty: 'Hard', topic: 'graphs',
  },
  {
    question: 'You need to build a Minimum Spanning Tree for a graph and the edge list is already easy to sort by weight, with the graph being sparse. Which algorithm is most natural to apply?',
    options: ['Kruskal\'s Algorithm', 'Bellman-Ford Algorithm', 'Dijkstra\'s Algorithm', 'Floyd-Warshall Algorithm'],
    correctIndex: 0,
    explanation: 'Kruskal\'s algorithm sorts all edges by weight and greedily adds them (using DSU to avoid cycles), which is efficient and natural for sparse graphs with an edge list.',
    difficulty: 'Hard', topic: 'graphs',
  },
  {
    question: 'You need to build a Minimum Spanning Tree for a dense graph represented as an adjacency matrix, and want to grow the tree from a starting vertex. Which algorithm is a better fit than Kruskal\'s here?',
    options: ['Prim\'s Algorithm', 'Bellman-Ford Algorithm', 'Topological Sort', 'Breadth-First Search'],
    correctIndex: 0,
    explanation: 'Prim\'s algorithm grows the MST one vertex at a time using a priority queue (or O(V^2) with a matrix), which works well on dense graphs where Kruskal\'s edge-sorting overhead is less attractive.',
    difficulty: 'Hard', topic: 'graphs',
  },
  {
    question: 'A graph has a negative-weight cycle reachable from the source. Which algorithm can correctly DETECT this situation?',
    options: ['Dijkstra\'s Algorithm', 'Bellman-Ford Algorithm', 'Prim\'s Algorithm', 'Breadth-First Search'],
    correctIndex: 1,
    explanation: 'Bellman-Ford relaxes all edges V-1 times; if any edge can still be relaxed on the V-th pass, a negative cycle exists — a check Dijkstra cannot perform.',
    difficulty: 'Hard', topic: 'graphs',
  },
  {
    question: 'You must schedule tasks with dependencies (task B can\'t start until task A finishes) and need a valid execution order. Which technique applies?',
    options: ['Binary Search', 'Topological Sort', 'Dijkstra\'s Algorithm', 'Union-Find'],
    correctIndex: 1,
    explanation: 'Topological sort orders the vertices of a DAG such that every directed edge u -> v has u appearing before v — exactly a valid dependency-respecting schedule.',
    difficulty: 'Hard', topic: 'graphs',
  },
  {
    question: 'You need to find whether a target sum can be formed by choosing a subset of a given array, and the array size and target are both reasonably small. Which approach fits best?',
    options: ['Greedy selection', 'Dynamic Programming (subset-sum DP)', 'Binary Search alone', 'Union-Find'],
    correctIndex: 1,
    explanation: 'Subset-sum is a classic DP problem: dp[i][s] tracks whether sum s is achievable using the first i elements, avoiding the exponential blowup of brute-force subsets.',
    difficulty: 'Hard', topic: 'dynamic-programming',
  },
  {
    question: 'You need the k-th largest element in an unsorted array of n elements, and want better than full O(n log n) sorting on average. Which approach is best?',
    options: ['Sort the whole array then index', 'Quickselect (partition-based selection)', 'Bellman-Ford', 'Breadth-First Search'],
    correctIndex: 1,
    explanation: 'Quickselect uses the same partitioning idea as QuickSort but recurses into only one side, achieving O(n) average time instead of O(n log n) for full sorting.',
    difficulty: 'Hard', topic: 'sorting',
  },
  {
    question: 'A graph algorithm needs to explore all reachable nodes from a source and find the shortest number of edges to each, in an UNWEIGHTED graph. Which is correct and most efficient?',
    options: ['Dijkstra\'s Algorithm', 'Breadth-First Search', 'Depth-First Search', 'Bellman-Ford Algorithm'],
    correctIndex: 1,
    explanation: 'In unweighted graphs, BFS naturally finds shortest paths (fewest edges) in O(V + E), simpler and faster than Dijkstra which is designed for weighted graphs.',
    difficulty: 'Hard', topic: 'graphs',
  },
  {
    question: 'You need to merge k sorted linked lists of total length n as efficiently as possible. Which approach gives the best time complexity?',
    options: ['Concatenate then sort: O(n log n)', 'Merge one list at a time into the result: O(nk)', 'Use a min-heap of size k to always pick the smallest head: O(n log k)', 'Use Bellman-Ford'],
    correctIndex: 2,
    explanation: 'A min-heap holding one node from each list lets you repeatedly extract the global minimum in O(log k), giving O(n log k) total — better than O(nk) or full re-sorting.',
    difficulty: 'Hard', topic: 'trees',
  },
  {
    question: 'You are given a set of intervals and need to select the maximum number of non-overlapping intervals. Which strategy is provably optimal?',
    options: ['Dynamic programming over all subsets', 'Greedy: sort by end time, pick earliest-ending non-conflicting interval each time', 'Sort by start time and pick the longest interval first', 'Randomly sample intervals'],
    correctIndex: 1,
    explanation: 'This is the classic Activity Selection problem — sorting by end time and greedily picking the earliest-finishing compatible interval is provably optimal, no DP needed.',
    difficulty: 'Hard', topic: 'greedy',
  },
  {
    question: 'You need to detect a cycle in a DIRECTED graph. Which technique correctly identifies cycles that DFS-based undirected cycle detection would miss?',
    options: ['Simple visited-set DFS (same as undirected)', 'DFS tracking a recursion stack (in-progress nodes) to detect back edges', 'BFS level counting', 'Union-Find alone'],
    correctIndex: 1,
    explanation: 'In directed graphs, a cycle exists only if DFS finds an edge back to a node currently on the recursion stack (a "back edge") — a plain visited set (used for undirected graphs) gives false positives.',
    difficulty: 'Hard', topic: 'graphs',
  },
  {
    question: 'You want to find the longest increasing subsequence (LIS) of an array of size n efficiently, better than the O(n^2) DP. Which technique achieves O(n log n)?',
    options: ['Plain recursion with no memoization', 'Binary search combined with a patience-sorting style tails array', 'Bellman-Ford Algorithm', 'Counting Sort'],
    correctIndex: 1,
    explanation: 'Maintaining a "tails" array of smallest possible tail values for increasing subsequences of each length, and binary-searching it for each new element, brings LIS down to O(n log n).',
    difficulty: 'Hard', topic: 'dynamic-programming',
  },
  {
    question: 'A network flow problem asks for the maximum flow from source to sink in a weighted directed graph. Which family of algorithms directly solves this?',
    options: ['Ford-Fulkerson / Edmonds-Karp', 'Kruskal\'s Algorithm', 'Binary Search', 'Insertion Sort'],
    correctIndex: 0,
    explanation: 'Ford-Fulkerson (and its BFS-based variant Edmonds-Karp) repeatedly finds augmenting paths from source to sink and adds their bottleneck capacity to the flow until no augmenting path remains.',
    difficulty: 'Hard', topic: 'graphs',
  },
  {
    question: 'You need to find all shortest paths between every pair of vertices in a graph with up to 1000 vertices and it must run within a couple seconds. Floyd-Warshall\'s O(V^3) is too slow here. What is the better approach?',
    options: ['Run Dijkstra from every vertex (Johnson\'s-algorithm style), assuming non-negative or reweighted edges', 'Use Bellman-Ford once', 'Use DFS from every vertex', 'There is no better approach'],
    correctIndex: 0,
    explanation: 'Running Dijkstra from each vertex (as in Johnson\'s algorithm, with reweighting to handle negative edges) costs O(V(E log V)), which beats O(V^3) on sparse graphs with many vertices.',
    difficulty: 'Hard', topic: 'graphs',
  },
  {
    question: 'You need to check whether a string can be segmented into a sequence of valid dictionary words (word break problem). Which approach is standard?',
    options: ['Greedy longest-prefix matching only', 'Dynamic programming where dp[i] = true if s[0..i) can be segmented', 'Sorting the dictionary', 'Union-Find over characters'],
    correctIndex: 1,
    explanation: 'Word Break has overlapping subproblems: dp[i] depends on smaller dp[j] values for j < i, making bottom-up DP the standard, reliable solution (greedy can fail on cases requiring backtracking).',
    difficulty: 'Hard', topic: 'dynamic-programming',
  },
  {
    question: 'You need to efficiently answer many "sum of elements in range [l, r]" queries on an array that also supports point updates. Which structure is ideal?',
    options: ['Plain array with prefix sums recomputed each query', 'Fenwick Tree (Binary Indexed Tree) or Segment Tree', 'Unsorted linked list', 'Hash table'],
    correctIndex: 1,
    explanation: 'Fenwick Trees and Segment Trees support both range queries and point updates in O(log n), unlike prefix sums which need O(n) to rebuild after an update.',
    difficulty: 'Hard', topic: 'trees',
  },
  {
    question: 'You need to determine if a graph is bipartite (can be 2-colored so no edge connects same-colored vertices). Which technique works directly?',
    options: ['BFS/DFS coloring, checking for conflicts between adjacent nodes', 'Sorting vertices by degree', 'Floyd-Warshall', 'Kadane\'s Algorithm'],
    correctIndex: 0,
    explanation: 'A graph is bipartite iff it can be 2-colored via BFS/DFS such that no two adjacent vertices share a color; finding a conflict during this traversal proves it is not bipartite.',
    difficulty: 'Hard', topic: 'graphs',
  },
  {
    question: 'Given a very large stream of numbers where you must repeatedly query the median seen so far, which structure supports this efficiently?',
    options: ['A single sorted array, re-sorted on every insert', 'Two heaps: a max-heap for the lower half and a min-heap for the upper half', 'A hash table keyed by value', 'A singly linked list'],
    correctIndex: 1,
    explanation: 'Balancing a max-heap (lower half) and min-heap (upper half) keeps the median accessible at the heap tops in O(1), with O(log n) insertion — far better than re-sorting.',
    difficulty: 'Hard', topic: 'trees',
  },
  {
    question: 'You need the minimum number of coins to make a given amount from unlimited supply of given denominations, and denominations are arbitrary (not guaranteed canonical). What is the reliable approach?',
    options: ['Greedy: always pick the largest denomination that fits', 'Dynamic programming over all amounts from 0 to target', 'Sort denominations and binary search', 'Union-Find'],
    correctIndex: 1,
    explanation: 'Greedy coin selection fails for non-canonical denomination sets (e.g. {1, 3, 4} for amount 6). DP building up dp[amount] from smaller amounts guarantees the true optimum.',
    difficulty: 'Hard', topic: 'dynamic-programming',
  },
  {
    question: 'You need to find strongly connected components in a directed graph efficiently. Which algorithm is designed for this?',
    options: ['Kosaraju\'s or Tarjan\'s Algorithm', 'Dijkstra\'s Algorithm', 'Kruskal\'s Algorithm', 'Counting Sort'],
    correctIndex: 0,
    explanation: 'Both Kosaraju\'s (two DFS passes with a transposed graph) and Tarjan\'s (single DFS with low-link values) algorithms find all strongly connected components in O(V + E).',
    difficulty: 'Hard', topic: 'graphs',
  },
  {
    question: 'You need to find the shortest path in a graph where edge weights can be 0 or 1 only. Which specialized approach beats general Dijkstra\'s O((V+E) log V)?',
    options: ['0-1 BFS using a deque', 'Bellman-Ford', 'Floyd-Warshall', 'Standard DFS'],
    correctIndex: 0,
    explanation: '0-1 BFS pushes 0-weight edges to the front and 1-weight edges to the back of a deque, achieving O(V + E) — faster than a heap-based Dijkstra for this restricted weight case.',
    difficulty: 'Hard', topic: 'graphs',
  },
  {
    question: 'You need to find if there exists a path visiting every vertex exactly once in a graph (Hamiltonian path) for a reasonably small number of vertices. What is a practical approach given the problem is NP-hard in general?',
    options: ['Dijkstra\'s Algorithm', 'Bitmask Dynamic Programming (Held-Karp style)', 'Plain BFS', 'Counting Sort'],
    correctIndex: 1,
    explanation: 'For small V (roughly V <= 20), bitmask DP over subsets of visited vertices (as in the Held-Karp TSP algorithm) solves Hamiltonian-path-style problems in O(2^V * V), avoiding full brute force.',
    difficulty: 'Hard', topic: 'dynamic-programming',
  },
  {
    question: 'You need to efficiently find the next greater element for every element in an array. Which technique achieves O(n) instead of the naive O(n^2)?',
    options: ['Sorting the array first', 'Monotonic stack, processing elements while maintaining a decreasing stack', 'Binary search for every element', 'Union-Find'],
    correctIndex: 1,
    explanation: 'A monotonic (decreasing) stack lets you resolve each element\'s next-greater in amortized O(1), since each element is pushed and popped at most once — total O(n).',
    difficulty: 'Hard', topic: 'stacks',
  },
];

const questions = [...easy, ...medium, ...hard];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('MCQ seed: MongoDB connected');

    let created = 0;
    let skipped = 0;

    for (const q of questions) {
      const existing = await MCQ.findOne({ question: q.question });
      if (existing) {
        skipped++;
        continue;
      }
      await MCQ.create(q);
      created++;
    }

    logger.info(`MCQ seed complete: ${created} created, ${skipped} skipped (total pool: ${questions.length})`);
    process.exit(0);
  } catch (err) {
    logger.error(`MCQ seed failed: ${err.message}`);
    process.exit(1);
  }
};

seed();
