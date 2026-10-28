# AI Warehouse Robot with Dynamic Obstacle Avoidance

An interactive, browser-based autonomous warehouse robot simulation featuring real-time **A\* (A-Star) Pathfinding** and **Dynamic Obstacle Avoidance**.

Built with vanilla **HTML5**, **CSS3**, and **JavaScript** (no external libraries or APIs).

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Architecture & Technology Stack](#architecture--technology-stack)
4. [A* Pathfinding Implementation](#a-pathfinding-implementation)
5. [Dynamic Obstacle Avoidance & Replanning](#dynamic-obstacle-avoidance--replanning)
6. [Predefined Demonstration Scenarios](#predefined-demonstration-scenarios)
7. [Setup & Running Locally](#setup--running-locally)
8. [Demonstration Guide for College Presentation](#demonstration-guide-for-college-presentation)
9. [Test Cases & Validation](#test-cases--validation)

---

## 1. Project Overview

Modern logistics warehouses (such as Amazon fulfillment centers) rely heavily on Automated Guided Vehicles (AGVs) to retrieve items from storage racks. In dynamic environments, aisles can become blocked unexpectedly due to fallen merchandise, forklifts, or other AGVs.

This application simulates a real-time autonomous AGV that:
- Navigates through a 2D warehouse grid.
- Collects packages from shelves using an optimal route.
- Detects dynamic blockages in real time.
- Immediately recalculates an alternative detour via A* pathfinding.
- Returns to the dispatch loading dock once all packages are collected.
- Halts safely when a path is mathematically unreachable.

---

## 2. Key Features

- **A\* Pathfinding from Scratch**: Custom implementation with an admissible Manhattan distance heuristic and a binary min-heap priority queue.
- **Dynamic Obstacle Avoidance**:
  - **Trigger Obstacle Button**: Instantly places an obstacle directly on the robot's upcoming path to demonstrate live rerouting.
  - **Click-to-Place Mode**: Click anywhere on the warehouse grid to toggle obstacles dynamically.
  - **Auto-Obstacle Mode**: Automatically injects dynamic hazards during navigation.
- **Real-Time Visual Search Process**: Highlights visited cells (closed set in translucent purple) and frontier cells (open set in glowing blue) so viewers can see A* exploring the grid.
- **Interactive Controls**: Start, Pause, Resume, Reset, Single Step Forward (`⏭ Step`), and Speed Adjustment (Slow to Turbo).
- **Mission Statistics Dashboard**: Real-time tracking of robot position, cells traversed, path length, search count, obstacles encountered, successful replans, explored nodes count, and search execution time in milliseconds.
- **Event Log & AI Explanations**: Live narrative feed explaining what the AI agent is thinking and doing at each step.

---

## 3. Architecture & Technology Stack

The project consists of three clean, modular files:

| File | Purpose |
|------|---------|
| `index.html` | Semantic layout containing header, control panel, warehouse canvas, statistics grid, event log, legend, and algorithm explanation. |
| `style.css` | Modern dark engineering dashboard theme with glassmorphic cards, responsive flex layout, and clear status badges. |
| `script.js` | Complete simulation engine: `MinPriorityQueue`, warehouse grid model, A* algorithm, AGV state machine, collision detection, and HTML5 canvas renderer. |

---

## 4. A* Pathfinding Implementation

### The Core Formula:
$$f(n) = g(n) + h(n)$$

- **$g(n)$**: Exact cost from the start cell to node $n$ (uniform cost: $1$ per orthogonal step).
- **$h(n)$**: Admissible Manhattan Distance heuristic:
  $$h(n) = |n.row - goal.row| + |n.col - goal.col|$$
- **$f(n)$**: Total estimated cost of the cheapest path passing through $n$.

### Min-Heap Priority Queue:
To achieve optimal time complexity $O(E \log V)$, a custom binary min-heap is implemented with:
- `push(item, priority)`: $O(\log N)$ bubble-up.
- `pop()`: $O(\log N)$ sink-down extracting node with minimum $f(n)$.
- `isEmpty()`, `size()`.

### Search Guarantee:
Because Manhattan distance never overestimates the true shortest path on a 4-directional grid (admissible and consistent), A* is mathematically guaranteed to find the shortest possible route.

---

## 5. Dynamic Obstacle Avoidance & Replanning

When the AGV is in transit:
1. **Obstacle Placement**: An obstacle is placed either manually, via the **⚡ Trigger Obstacle** button, or via scenario timing.
2. **Path Intersection Detection**: The robot verifies whether the new obstacle intersects its active remaining path array (`currentPath`).
3. **Immediate State Transition**:
   - Robot transitions from `MOVING` to `REPLANNING`.
   - Previous route is retained as a ghost trail (dashed orange) for visual comparison.
4. **detour Calculation**:
   - A* is triggered from the robot's **current position** to its active target.
   - If a valid detour exists, `Successful Replans` increments, the new path replaces the old path, and the robot resumes movement.
   - If no route exists (e.g. target surrounded), the robot halts safely with a **`Path Blocked`** banner without crashing or entering infinite loops.

---

## 6. Predefined Demonstration Scenarios

1. **1 – Basic Collection**:
   - Standard 4-package pick-and-pack mission. Shows baseline shortest-path computation and dispatch return.
2. **2 – Single Blockage**:
   - Robot starts moving toward Package 1. An obstacle blocks the narrow aisle midway, triggering an automatic detour through an adjacent corridor.
3. **3 – Multiple Obstacles**:
   - Multiple sequential blockages spawn during the run, showing successive dynamic replans.
4. **4 – Unreachable Target**:
   - The destination is completely walled off by obstacles. Proves the robot exhausts the frontier, safely identifies the dead end, and stops without error.
5. **Free Play**:
   - Custom package counts (1 to 12) with full freedom to click anywhere on the canvas to place or remove obstacles in real time.

---

## 7. Setup & Running Locally

### Option 1: Direct Browser Launch
Simply open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari):
```bash
# On Windows PowerShell:
Start-Process index.html
```

### Option 2: Local HTTP Server (Recommended)
Using Python:
```bash
python -m http.server 8080
```
Then visit: `http://localhost:8080`

Using Node.js (`npx serve`):
```bash
npx serve .
```

---

## 8. Demonstration Guide for College Presentation

When presenting to your professor, follow this 4-step sequence:

### Step 1: Baseline Demonstration (Optimal Path)
1. Select **1 – Basic Collection**.
2. Click **Start**.
3. Point out:
   - The cyan path connecting the robot to the first package.
   - The purple (closed set) and blue (open set) cells illustrating A* exploring nodes.
   - The real-time statistics panel showing search time (typically `< 2 ms`) and nodes explored.

### Step 2: Dynamic Obstacle Avoidance (The Core Feature)
1. Select **2 – Single Blockage** (or stay in Scenario 1 and click **⚡ Trigger Obstacle** while the robot is moving).
2. Point out:
   - The robot detects the obstacle immediately.
   - An alert banner appears: *"Aisle Blocked! Rerouting..."*.
   - The previous blocked path remains visible as an orange dashed trail.
   - The new cyan detour is computed in under 1 millisecond.
   - The stats record `Obstacles Hit: +1` and `Successful Replans: +1`.

### Step 3: Unsolvable Case & Safe Failover
1. Select **4 – Unreachable Target** and click **Load Scenario**.
2. Click **Start**.
3. Point out:
   - The robot runs A*, explores all accessible nodes, and mathematically proves no path exists.
   - The robot enters `BLOCKED` status, holds position, and alerts the operator safely.

### Step 4: Live Interactivity (Ask Teacher to Test)
1. Select **Free Play**.
2. Check the box **Click Grid to Add/Remove Obstacle**.
3. Invite the teacher or audience to click anywhere in the warehouse aisles while the robot moves to see it dodge obstacles dynamically!

---

## 9. Test Cases & Validation

| Test Case | Objective | Expected Result | Status |
|-----------|-----------|-----------------|--------|
| **TC-01** | Initial load & UI layout | Canvas grid, controls, stats, and legend render cleanly. | Pass |
| **TC-02** | A* Path optimality | Robot follows Manhattan-optimal shortest route. | Pass |
| **TC-03** | Dynamic obstacle avoidance | When path is blocked, robot reroutes around obstacle without skipping targets. | Pass |
| **TC-04** | Package collection lifecycle | Picking up package updates counter and marks package with green checkmark. | Pass |
| **TC-05** | Return to dispatch | After last package, robot plans route back to Dispatch Bay and enters Completed state. | Pass |
| **TC-06** | Dead-end detection | Enclosed target halts robot safely with `BLOCKED` status and clear UI notification. | Pass |
| **TC-07** | Step forward control | Clicking `⏭ Step` advances the robot exactly 1 grid cell per click. | Pass |
| **TC-08** | Pause & Resume | Halts movement immediately upon pause; resumes without state corruption. | Pass |
| **TC-09** | Speed slider | Speed adjustment scales step interval smoothly from Slow to Turbo. | Pass |
| **TC-10** | Console integrity | Browser console exhibits zero runtime errors or unhandled exceptions. | Pass |

---

## 📜 License
Educational Project — Open for academic demonstration and learning.
