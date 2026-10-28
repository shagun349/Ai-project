/**
 * ════════════════════════════════════════════════════════════════════════════
 * AI Warehouse Robot Simulator – Dynamic Obstacle Avoidance
 * Implementation: A* Pathfinding (from scratch), Min-Heap Priority Queue,
 * Autonomous AGV Navigation, Dynamic Obstacle Rerouting, Canvas Rendering.
 * ════════════════════════════════════════════════════════════════════════════
 */

/* ────────────────────────────────────────────────────────────────────────────
 * 1. MIN-HEAP PRIORITY QUEUE (Implemented from scratch)
 * ──────────────────────────────────────────────────────────────────────────── */
class MinPriorityQueue {
    constructor() {
        this.heap = [];
    }

    push(item, priority) {
        const node = { item, priority };
        this.heap.push(node);
        this._bubbleUp(this.heap.length - 1);
    }

    pop() {
        if (this.isEmpty()) return null;
        const min = this.heap[0];
        const end = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = end;
            this._sinkDown(0);
        }
        return min.item;
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    size() {
        return this.heap.length;
    }

    _bubbleUp(n) {
        const element = this.heap[n];
        while (n > 0) {
            const parentN = Math.floor((n - 1) / 2);
            const parent = this.heap[parentN];
            if (element.priority >= parent.priority) break;
            this.heap[n] = parent;
            this.heap[parentN] = element;
            n = parentN;
        }
    }

    _sinkDown(n) {
        const length = this.heap.length;
        const element = this.heap[n];
        while (true) {
            const leftChildN = 2 * n + 1;
            const rightChildN = 2 * n + 2;
            let swap = null;

            if (leftChildN < length) {
                const leftChild = this.heap[leftChildN];
                if (leftChild.priority < element.priority) {
                    swap = leftChildN;
                }
            }

            if (rightChildN < length) {
                const rightChild = this.heap[rightChildN];
                if (
                    (swap === null && rightChild.priority < element.priority) ||
                    (swap !== null && rightChild.priority < this.heap[swap].priority)
                ) {
                    swap = rightChildN;
                }
            }

            if (swap === null) break;
            this.heap[n] = this.heap[swap];
            this.heap[swap] = element;
            n = swap;
        }
    }
}

/* ────────────────────────────────────────────────────────────────────────────
 * 2. GRID & WAREHOUSE DEFINITIONS
 * ──────────────────────────────────────────────────────────────────────────── */
const GRID_ROWS = 20;
const GRID_COLS = 25;

const CELL_TYPE = {
    EMPTY: 0,
    SHELF: 1,
    DISPATCH: 2,
    PACKAGE: 3,
    OBSTACLE: 4
};

// Scenario presets
const SCENARIOS = {
    basic: {
        title: "Basic Collection",
        desc: "Robot navigates clear warehouse aisles to collect 4 packages and return to dispatch. Demonstrates optimal A* pathfinding.",
        dispatch: { r: 1, c: 1 },
        packages: [
            { id: 1, r: 4, c: 6 },
            { id: 2, r: 10, c: 12 },
            { id: 3, r: 15, c: 7 },
            { id: 4, r: 8, c: 21 }
        ],
        scheduledObstacles: []
    },
    single_block: {
        title: "Single Blockage",
        desc: "Robot navigates toward Package 1. An obstacle blocks its primary aisle midway, forcing real-time A* dynamic rerouting.",
        dispatch: { r: 1, c: 1 },
        packages: [
            { id: 1, r: 6, c: 11 },
            { id: 2, r: 14, c: 17 },
            { id: 3, r: 17, c: 4 }
        ],
        // Scheduled: at step 5 of mission, inject obstacle at (4, 11) or path ahead
        scheduledObstacles: [
            { atStep: 4, r: 4, c: 11 }
        ]
    },
    multi_block: {
        title: "Multiple Obstacles",
        desc: "Multiple dynamic blockages spawn during the run, testing successive path recalculations through alternative warehouse aisles.",
        dispatch: { r: 1, c: 1 },
        packages: [
            { id: 1, r: 4, c: 7 },
            { id: 2, r: 15, c: 13 },
            { id: 3, r: 9, c: 22 },
            { id: 4, r: 17, c: 19 }
        ],
        scheduledObstacles: [
            { atStep: 3, r: 4, c: 5 },
            { atStep: 12, r: 11, c: 13 },
            { atStep: 22, r: 15, c: 17 }
        ]
    },
    unreachable: {
        title: "Unreachable Target",
        desc: "An aisle blockage completely isolates the target package. Demonstrates safe detection of unsolvable states without crashing.",
        dispatch: { r: 1, c: 1 },
        packages: [
            { id: 1, r: 16, c: 22 }
        ],
        // Obstacles creating an impenetrable box around (16, 22)
        scheduledObstacles: [
            { atStep: 2, r: 14, c: 22 },
            { atStep: 2, r: 15, c: 21 },
            { atStep: 2, r: 17, c: 21 },
            { atStep: 2, r: 18, c: 22 }
        ]
    },
    free_play: {
        title: "Free Play",
        desc: "Custom package count. Click on any floor/path cell to dynamically add or remove obstacles during execution.",
        dispatch: { r: 1, c: 1 },
        packages: [],
        scheduledObstacles: []
    }
};

/* ────────────────────────────────────────────────────────────────────────────
 * 3. SIMULATION STATE
 * ──────────────────────────────────────────────────────────────────────────── */
class WarehouseSimulation {
    constructor() {
        // Grid matrix [row][col]
        this.grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(CELL_TYPE.EMPTY));
        
        // Shelf layout mask (true = permanent shelf rack)
        this.shelves = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false));
        this._buildWarehouseShelves();

        // Dispatch Station
        this.dispatch = { r: 1, c: 1 };

        // Packages array: [{ id, r, c, collected: false }]
        this.packages = [];
        this.currentTarget = null; // package object or dispatch

        // Dynamic Obstacles set: key "r,c"
        this.obstacles = new Set();
        this.scheduledObstacles = [];

        // Robot state
        this.robot = {
            r: 1,
            c: 1,
            visualX: 1,
            visualY: 1,
            dirAngle: 0, // In radians
            targetAngle: 0,
            carrying: null,
            state: 'IDLE' // IDLE, SEARCHING, MOVING, REPLANNING, COMPLETED, BLOCKED, PAUSED
        };

        // Paths & A* visualization
        this.currentPath = [];        // [{ r, c }] remaining steps
        this.fullCurrentPath = [];    // [{ r, c }] full path from start of leg
        this.rerouteOldPath = [];     // [{ r, c }] previous path before replan (for orange trail)
        this.rerouteTrailTimer = 0;   // Fade countdown for old path
        this.lastExploredNodes = [];  // Closed set from last search
        this.lastFrontierNodes = [];  // Open set from last search

        // Statistics
        this.stats = {
            status: 'Idle',
            collectedCount: 0,
            totalPackages: 0,
            cellsTraversed: 0,
            totalSearches: 0,
            obstaclesHit: 0,
            successfulReplans: 0,
            totalNodesExplored: 0,
            lastSearchTime: 0,
            startTime: null,
            elapsedSeconds: 0
        };

        // Configuration
        this.strategy = 'fixed';       // 'fixed' or 'nearest'
        this.speedLevel = 8;           // 1 to 20
        this.showSearchViz = true;
        this.autoObstacles = false;
        this.editObstacleMode = false;

        // Loop & Timing
        this.animationFrameId = null;
        this.timerIntervalId = null;
        this.autoObstacleTimer = 0;
        this.lastStepTimestamp = 0;
        this.isPaused = false;
        this.stepRequested = false;

        // Canvas & UI elements
        this.canvas = document.getElementById('warehouse-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlayMsg = document.getElementById('grid-overlay-msg');
        this.eventLog = document.getElementById('event-log');
        this.explanation = document.getElementById('explanation');

        // Setup Canvas Resolution
        this.cellSize = 32;
        this._setupCanvas();

        // Bind events
        this._initControls();
        this._initCanvasEvents();

        // Load default scenario
        this.loadScenario('basic');

        // Start render loop
        this._renderLoop = this._renderLoop.bind(this);
        requestAnimationFrame(this._renderLoop);
    }

    /* ── Shelf Layout Generation ── */
    _buildWarehouseShelves() {
        // Create realistic warehouse racks with broad horizontal & vertical aisles
        // Shelf rack blocks: 2x4 and 2x5 racks separated by clear 2-cell corridors
        const rackBlocks = [
            // Row 3-4 racks
            { rStart: 3, rEnd: 4, cStart: 3, cEnd: 8 },
            { rStart: 3, rEnd: 4, cStart: 11, cEnd: 16 },
            { rStart: 3, rEnd: 4, cStart: 19, cEnd: 23 },

            // Row 7-8 racks
            { rStart: 7, rEnd: 8, cStart: 3, cEnd: 8 },
            { rStart: 7, rEnd: 8, cStart: 11, cEnd: 16 },
            { rStart: 7, rEnd: 8, cStart: 19, cEnd: 23 },

            // Row 11-12 racks
            { rStart: 11, rEnd: 12, cStart: 3, cEnd: 8 },
            { rStart: 11, rEnd: 12, cStart: 11, cEnd: 16 },
            { rStart: 11, rEnd: 12, cStart: 19, cEnd: 23 },

            // Row 15-16 racks
            { rStart: 15, rEnd: 16, cStart: 3, cEnd: 8 },
            { rStart: 15, rEnd: 16, cStart: 11, cEnd: 16 },
            { rStart: 15, rEnd: 16, cStart: 19, cEnd: 23 }
        ];

        for (const block of rackBlocks) {
            for (let r = block.rStart; r <= block.rEnd; r++) {
                for (let c = block.cStart; c <= block.cEnd; c++) {
                    this.shelves[r][c] = true;
                }
            }
        }
    }

    _setupCanvas() {
        // High DPI canvas support
        const dpr = window.devicePixelRatio || 1;
        const width = GRID_COLS * this.cellSize;
        const height = GRID_ROWS * this.cellSize;

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        this.ctx.scale(dpr, dpr);
    }

    /* ────────────────────────────────────────────────────────────────────────
     * 4. A* PATHFINDING ALGORITHM (From scratch)
     * ──────────────────────────────────────────────────────────────────────── */
    findPathAStar(start, goal) {
        const t0 = performance.now();

        // 4-Directional Orthogonal Neighbors (N, S, E, W)
        const directions = [
            { dr: -1, dc: 0 },
            { dr: 1, dc: 0 },
            { dr: 0, dc: -1 },
            { dr: 0, dc: 1 }
        ];

        // Manhattan Distance Heuristic: h(n) = |dr| + |dc|
        const heuristic = (r, c) => Math.abs(r - goal.r) + Math.abs(c - goal.c);

        const startKey = `${start.r},${start.c}`;
        const goalKey = `${goal.r},${goal.c}`;

        const openSet = new MinPriorityQueue();
        const cameFrom = new Map(); // key -> { r, c }

        const gScore = new Map();
        gScore.set(startKey, 0);

        const fScore = new Map();
        fScore.set(startKey, heuristic(start.r, start.c));

        openSet.push({ r: start.r, c: start.c }, fScore.get(startKey));

        const closedSet = new Set();
        const frontierSet = new Set([startKey]);

        let nodesExploredCount = 0;

        while (!openSet.isEmpty()) {
            const current = openSet.pop();
            const currKey = `${current.r},${current.c}`;
            frontierSet.delete(currKey);

            // Reached goal!
            if (current.r === goal.r && current.c === goal.c) {
                const elapsed = performance.now() - t0;
                this.stats.totalSearches++;
                this.stats.totalNodesExplored += nodesExploredCount;
                this.stats.lastSearchTime = elapsed.toFixed(1);

                // Save explored nodes for UI visualization
                this.lastExploredNodes = Array.from(closedSet).map(k => {
                    const [r, c] = k.split(',').map(Number);
                    return { r, c };
                });
                this.lastFrontierNodes = Array.from(frontierSet).map(k => {
                    const [r, c] = k.split(',').map(Number);
                    return { r, c };
                });

                // Reconstruct path
                const path = [];
                let curr = current;
                while (curr) {
                    path.unshift({ r: curr.r, c: curr.c });
                    const parentKey = `${curr.r},${curr.c}`;
                    curr = cameFrom.get(parentKey);
                }

                return { success: true, path, elapsed, nodesCount: nodesExploredCount };
            }

            closedSet.add(currKey);
            nodesExploredCount++;

            // Evaluate neighbors
            for (const dir of directions) {
                const nr = current.r + dir.dr;
                const nc = current.c + dir.dc;
                const neighborKey = `${nr},${nc}`;

                // Boundary check
                if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) continue;

                // Shelf obstacle check
                if (this.shelves[nr][nc]) continue;

                // Dynamic obstacle check (target can be goal only if goal is not blocked)
                if (this.obstacles.has(neighborKey)) continue;

                // Already evaluated
                if (closedSet.has(neighborKey)) continue;

                // Tentative gScore (uniform cost = 1)
                const tentativeG = (gScore.get(currKey) ?? Infinity) + 1;

                if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
                    cameFrom.set(neighborKey, { r: current.r, c: current.c });
                    gScore.set(neighborKey, tentativeG);
                    const f = tentativeG + heuristic(nr, nc);
                    fScore.set(neighborKey, f);

                    if (!frontierSet.has(neighborKey)) {
                        openSet.push({ r: nr, c: nc }, f);
                        frontierSet.add(neighborKey);
                    }
                }
            }
        }

        // No path found!
        const elapsed = performance.now() - t0;
        this.stats.totalSearches++;
        this.stats.totalNodesExplored += nodesExploredCount;
        this.stats.lastSearchTime = elapsed.toFixed(1);

        this.lastExploredNodes = Array.from(closedSet).map(k => {
            const [r, c] = k.split(',').map(Number);
            return { r, c };
        });
        this.lastFrontierNodes = [];

        return { success: false, path: [], elapsed, nodesCount: nodesExploredCount };
    }

    /* ────────────────────────────────────────────────────────────────────────
     * 5. SCENARIO MANAGEMENT
     * ──────────────────────────────────────────────────────────────────────── */
    loadScenario(name) {
        const sc = SCENARIOS[name];
        if (!sc) return;

        this.stop();

        this.dispatch = { ...sc.dispatch };
        this.robot.r = this.dispatch.r;
        this.robot.c = this.dispatch.c;
        this.robot.visualX = this.dispatch.r;
        this.robot.visualY = this.dispatch.c;
        this.robot.dirAngle = 0;
        this.robot.targetAngle = 0;
        this.robot.carrying = null;
        this.robot.state = 'IDLE';

        this.obstacles.clear();
        this.scheduledObstacles = JSON.parse(JSON.stringify(sc.scheduledObstacles));

        // Setup packages
        if (name === 'free_play') {
            const count = parseInt(document.getElementById('input-pkg-count').value, 10) || 5;
            this.packages = this._generateRandomPackages(count);
        } else {
            this.packages = sc.packages.map(p => ({ ...p, collected: false }));
        }

        // Reset stats
        this.stats.collectedCount = 0;
        this.stats.totalPackages = this.packages.length;
        this.stats.cellsTraversed = 0;
        this.stats.totalSearches = 0;
        this.stats.obstaclesHit = 0;
        this.stats.successfulReplans = 0;
        this.stats.totalNodesExplored = 0;
        this.stats.lastSearchTime = 0;
        this.stats.elapsedSeconds = 0;
        this.stats.status = 'Idle';

        this.currentPath = [];
        this.fullCurrentPath = [];
        this.rerouteOldPath = [];
        this.lastExploredNodes = [];
        this.lastFrontierNodes = [];
        this.currentTarget = null;

        // UI Updates
        document.getElementById('scenario-desc').textContent = sc.desc;
        this.hideOverlayMsg();
        this.clearLog();
        this.log(`Loaded Scenario: ${sc.title}`, 'info');
        this.setExplanation(`Scenario loaded: <strong>${sc.title}</strong>. Click <strong>Start</strong> to begin navigation.`);
        this._updateUIStateButtons();
        this.updateStatsUI();
    }

    _generateRandomPackages(count) {
        const pkgs = [];
        let id = 1;
        let attempts = 0;
        while (pkgs.length < count && attempts < 500) {
            attempts++;
            const r = Math.floor(Math.random() * (GRID_ROWS - 2)) + 1;
            const c = Math.floor(Math.random() * (GRID_COLS - 2)) + 1;

            // Must be empty aisle floor, not shelf, not dispatch, not already taken
            if (this.shelves[r][c]) continue;
            if (r === this.dispatch.r && c === this.dispatch.c) continue;
            if (pkgs.some(p => p.r === r && p.c === c)) continue;

            pkgs.push({ id: id++, r, c, collected: false });
        }
        return pkgs;
    }

    /* ────────────────────────────────────────────────────────────────────────
     * 6. SIMULATION CONTROL & STEPPING
     * ──────────────────────────────────────────────────────────────────────── */
    start() {
        if (this.robot.state === 'COMPLETED' || this.robot.state === 'BLOCKED') {
            this.loadScenario(document.getElementById('select-scenario').value);
        }

        this.isPaused = false;
        this.robot.state = 'SEARCHING';
        this.stats.status = 'Searching';
        this.stats.startTime = Date.now() - (this.stats.elapsedSeconds * 1000);

        if (!this.timerIntervalId) {
            this.timerIntervalId = setInterval(() => {
                if (!this.isPaused && this.robot.state !== 'IDLE' && this.robot.state !== 'COMPLETED' && this.robot.state !== 'BLOCKED') {
                    this.stats.elapsedSeconds++;
                    this.updateDurationUI();
                }
            }, 1000);
        }

        this.log('Mission started. Initiating route calculation.', 'info');
        this._planNextLeg();
        this._updateUIStateButtons();
        this.updateStatsUI();
    }

    pause() {
        if (this.isPaused || this.robot.state === 'IDLE' || this.robot.state === 'COMPLETED') return;
        this.isPaused = true;
        this.stats.status = 'Paused';
        this.log('Simulation paused by user.', 'warning');
        this.setExplanation('Simulation is paused. Click <strong>Resume</strong> or <strong>Step</strong> to continue.');
        this._updateUIStateButtons();
        this.updateStatsUI();
    }

    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.robot.state = this.currentPath.length > 0 ? 'MOVING' : 'SEARCHING';
        this.stats.status = this.robot.state === 'MOVING' ? 'Moving' : 'Searching';
        this.log('Simulation resumed.', 'info');
        this._updateUIStateButtons();
        this.updateStatsUI();
    }

    step() {
        if (this.robot.state === 'IDLE') {
            this.start();
            this.pause();
            return;
        }
        this.stepRequested = true;
    }

    stop() {
        this.isPaused = false;
        this.robot.state = 'IDLE';
        this.stats.status = 'Idle';
        if (this.timerIntervalId) {
            clearInterval(this.timerIntervalId);
            this.timerIntervalId = null;
        }
        this._updateUIStateButtons();
        this.updateStatsUI();
    }

    reset() {
        const scName = document.getElementById('select-scenario').value;
        this.loadScenario(scName);
        this.log('System reset to initial coordinates.', 'info');
    }

    /* ── Next Target Leg Planning ── */
    _planNextLeg() {
        const remainingPkgs = this.packages.filter(p => !p.collected);

        if (remainingPkgs.length > 0) {
            // Select next package based on selected strategy
            if (this.strategy === 'nearest') {
                // Greedy nearest package based on Manhattan heuristic
                remainingPkgs.sort((a, b) => {
                    const distA = Math.abs(a.r - this.robot.r) + Math.abs(a.c - this.robot.c);
                    const distB = Math.abs(b.r - this.robot.r) + Math.abs(b.c - this.robot.c);
                    return distA - distB;
                });
            }
            this.currentTarget = remainingPkgs[0];
            this.setExplanation(`Calculating shortest path to <strong>Package ${this.currentTarget.id}</strong> at (${this.currentTarget.r}, ${this.currentTarget.c}) via A* algorithm.`);
            this.log(`Calculating path to Package #${this.currentTarget.id} at (${this.currentTarget.r}, ${this.currentTarget.c})`, 'info');
        } else {
            // All packages collected! Head back to Dispatch Station
            this.currentTarget = { id: 'Dispatch', r: this.dispatch.r, c: this.dispatch.c, isDispatch: true };
            this.setExplanation(`All packages collected! Planning return path to <strong>Dispatch Bay</strong> at (${this.dispatch.r}, ${this.dispatch.c}).`);
            this.log('All packages secured in AGV cargo. Navigating back to Dispatch Station.', 'success');
        }

        // Run A*
        const res = this.findPathAStar(
            { r: this.robot.r, c: this.robot.c },
            { r: this.currentTarget.r, c: this.currentTarget.c }
        );

        if (res.success && res.path.length > 0) {
            // Remove the first node (which is the current robot position)
            this.currentPath = res.path.slice(1);
            this.fullCurrentPath = [...res.path];
            this.robot.state = 'MOVING';
            this.stats.status = 'Moving';
            this.log(`A* Path computed: ${res.path.length} steps (${res.elapsed.toFixed(1)} ms, ${res.nodesCount} nodes explored).`, 'info');
        } else {
            // No path possible!
            this.robot.state = 'BLOCKED';
            this.stats.status = 'Blocked';
            this.showOverlayMsg(`Path Blocked! Target Unreachable`, 'msg-red');
            this.log(`Critical: Target at (${this.currentTarget.r}, ${this.currentTarget.c}) is completely inaccessible! Robot safely stopped.`, 'error');
            this.setExplanation(`<strong>Alert:</strong> No valid path exists to ${this.currentTarget.isDispatch ? 'Dispatch' : 'Package ' + this.currentTarget.id}. All aisles are obstructed. Robot has halted for safety.`);
        }

        this._updateUIStateButtons();
        this.updateStatsUI();
    }

    /* ────────────────────────────────────────────────────────────────────────
     * 7. DYNAMIC OBSTACLE INJECTION & REPLANNING
     * ──────────────────────────────────────────────────────────────────────── */
    triggerObstacleAhead() {
        if (this.currentPath.length === 0) {
            this.log('Cannot place obstacle: robot does not currently have an active planned path.', 'warning');
            return;
        }

        // Place obstacle 1 or 2 steps ahead of the robot on its active path
        const stepOffset = Math.min(1, this.currentPath.length - 1);
        const cell = this.currentPath[stepOffset];

        if (cell) {
            this.addObstacle(cell.r, cell.c, true);
        }
    }

    addObstacle(r, c, isTriggered = false) {
        const key = `${r},${c}`;

        // Validation: cannot place on robot or dispatch
        if (r === this.robot.r && c === this.robot.c) {
            this.log(`Cannot place obstacle at (${r}, ${c}): Robot occupies this cell.`, 'warning');
            return false;
        }
        if (r === this.dispatch.r && c === this.dispatch.c) {
            this.log(`Cannot block dispatch station.`, 'warning');
            return false;
        }
        if (this.shelves[r][c]) {
            return false; // Already a permanent shelf
        }

        if (this.obstacles.has(key)) {
            // Remove obstacle if clicking existing
            this.obstacles.delete(key);
            this.log(`Removed dynamic obstacle at (${r}, ${c}).`, 'info');
            this.updateStatsUI();
            return true;
        }

        // Add new obstacle
        this.obstacles.add(key);
        this.stats.obstaclesHit++;
        this.log(`⚡ Dynamic Obstacle detected at aisle cell (${r}, ${c})!`, 'warning');

        // Check if obstacle blocks the robot's remaining path
        const blockedIndex = this.currentPath.findIndex(step => step.r === r && step.c === c);

        if (blockedIndex !== -1) {
            // Robot's planned route is obstructed! Trigger immediate replanning!
            this._handleDynamicReroute(r, c);
        } else {
            this.updateStatsUI();
        }

        return true;
    }

    _handleDynamicReroute(blockedR, blockedC) {
        this.robot.state = 'REPLANNING';
        this.stats.status = 'Replanning';

        // Archive previous path for visual comparison (orange ghost trace)
        this.rerouteOldPath = [{ r: this.robot.r, c: this.robot.c }, ...this.currentPath];
        this.rerouteTrailTimer = 180; // frames to display ghost

        this.showOverlayMsg(`⚠️ Aisle Blocked! Rerouting...`, 'msg-orange');
        this.setExplanation(`<strong>Obstacle Encountered at (${blockedR}, ${blockedC})!</strong> Active trajectory is blocked. Robot re-running A* search to discover detour.`);
        this.log(`Aisle blocked at (${blockedR}, ${blockedC})! Initiating real-time path replan.`, 'warning');

        // Immediately recalculate path from robot's current position to current target
        const res = this.findPathAStar(
            { r: this.robot.r, c: this.robot.c },
            { r: this.currentTarget.r, c: this.currentTarget.c }
        );

        if (res.success && res.path.length > 0) {
            this.stats.successfulReplans++;
            this.currentPath = res.path.slice(1);
            this.fullCurrentPath = [...res.path];
            this.robot.state = 'MOVING';
            this.stats.status = 'Moving';
            this.log(`Detour found! New path: ${res.path.length} cells (${res.elapsed.toFixed(1)} ms). Navigating around obstacle.`, 'success');
            this.setExplanation(`New alternative route discovered avoiding obstacle! Length: <strong>${res.path.length} cells</strong>.`);

            setTimeout(() => {
                if (this.robot.state === 'MOVING') this.hideOverlayMsg();
            }, 1200);
        } else {
            this.robot.state = 'BLOCKED';
            this.stats.status = 'Blocked';
            this.currentPath = [];
            this.showOverlayMsg(`🚫 No Alternative Route! Target Blocked`, 'msg-red');
            this.log(`Replanning Failed: Target is inaccessible from current coordinates. Robot stopped.`, 'error');
            this.setExplanation(`<strong>Replanning Failed:</strong> No alternative route exists around the obstacle. Robot is safely holding position.`);
        }

        this._updateUIStateButtons();
        this.updateStatsUI();
    }

    /* ────────────────────────────────────────────────────────────────────────
     * 8. SIMULATION STEPPING & MOVEMENT LOOP
     * ──────────────────────────────────────────────────────────────────────── */
    _updateSimulation(dt) {
        if (this.isPaused && !this.stepRequested) return;

        // Scheduled obstacles trigger check
        if (this.scheduledObstacles.length > 0) {
            const nextObs = this.scheduledObstacles[0];
            if (this.stats.cellsTraversed >= nextObs.atStep) {
                this.scheduledObstacles.shift();
                this.addObstacle(nextObs.r, nextObs.c);
            }
        }

        // Auto obstacles random generator (if enabled)
        if (this.autoObstacles && this.robot.state === 'MOVING') {
            this.autoObstacleTimer += dt;
            if (this.autoObstacleTimer > 4.0) { // every 4 seconds
                this.autoObstacleTimer = 0;
                if (Math.random() < 0.6 && this.currentPath.length > 2) {
                    // Place obstacle 2-4 cells ahead
                    const idx = Math.min(3, this.currentPath.length - 1);
                    const pt = this.currentPath[idx];
                    this.addObstacle(pt.r, pt.c);
                }
            }
        }

        // Robot step movement timing
        // Speed slider 1..20: speed 1 = 600ms per step, speed 8 = 180ms, speed 20 = 40ms
        const stepInterval = Math.max(35, 650 - (this.speedLevel - 1) * 32);

        if (this.stepRequested || (Date.now() - this.lastStepTimestamp >= stepInterval)) {
            if (this.robot.state === 'MOVING') {
                this._executeRobotStep();
            }
            this.lastStepTimestamp = Date.now();
            this.stepRequested = false;
        }

        // Smooth visual position interpolation for robot rendering
        const lerpFactor = Math.min(1, dt * (4 + this.speedLevel * 0.8));
        this.robot.visualX += (this.robot.c - this.robot.visualX) * lerpFactor;
        this.robot.visualY += (this.robot.r - this.robot.visualY) * lerpFactor;

        // Smooth angle rotation
        let dAngle = this.robot.targetAngle - this.robot.dirAngle;
        while (dAngle < -Math.PI) dAngle += Math.PI * 2;
        while (dAngle > Math.PI) dAngle -= Math.PI * 2;
        this.robot.dirAngle += dAngle * lerpFactor;

        // Fade reroute ghost trail
        if (this.rerouteTrailTimer > 0) {
            this.rerouteTrailTimer--;
            if (this.rerouteTrailTimer === 0) {
                this.rerouteOldPath = [];
            }
        }
    }

    _executeRobotStep() {
        if (this.currentPath.length === 0) {
            // Arrived at current target!
            this._handleArrivalAtTarget();
            return;
        }

        // Peek next step
        const nextCell = this.currentPath[0];

        // Safety verification: is next cell now blocked?
        if (this.obstacles.has(`${nextCell.r},${nextCell.c}`) || this.shelves[nextCell.r][nextCell.c]) {
            this._handleDynamicReroute(nextCell.r, nextCell.c);
            return;
        }

        // Advance to next cell
        this.currentPath.shift();

        // Calculate target heading angle
        const dr = nextCell.r - this.robot.r;
        const dc = nextCell.c - this.robot.c;
        if (dr !== 0 || dc !== 0) {
            this.robot.targetAngle = Math.atan2(dr, dc);
        }

        this.robot.r = nextCell.r;
        this.robot.c = nextCell.c;
        this.stats.cellsTraversed++;

        // Arrived at target on this step?
        if (this.robot.r === this.currentTarget.r && this.robot.c === this.currentTarget.c) {
            this._handleArrivalAtTarget();
        }

        this.updateStatsUI();
    }

    _handleArrivalAtTarget() {
        if (this.currentTarget.isDispatch) {
            // Returned to Dispatch Station: Mission Complete!
            this.robot.state = 'COMPLETED';
            this.stats.status = 'Completed';
            this.robot.carrying = null;
            this.showOverlayMsg(`🎉 Mission Complete! All Packages Dispatched`, 'msg-green');
            this.log(`Warehouse AGV returned safely to Dispatch Bay. All ${this.stats.collectedCount} packages processed!`, 'success');
            this.setExplanation(`<strong>Mission Completed!</strong> The robot successfully picked up all warehouse packages, dynamically avoided any blockages, and docked at Dispatch.`);
            if (this.timerIntervalId) {
                clearInterval(this.timerIntervalId);
                this.timerIntervalId = null;
            }
        } else {
            // Collected a package!
            const pkg = this.packages.find(p => p.id === this.currentTarget.id);
            if (pkg) {
                pkg.collected = true;
                this.stats.collectedCount++;
                this.robot.carrying = pkg.id;
                this.log(`📦 Package #${pkg.id} picked up at (${pkg.r}, ${pkg.c}) [${this.stats.collectedCount}/${this.stats.totalPackages}]`, 'success');
                this.setExplanation(`<strong>Package ${pkg.id} collected!</strong> Loading cargo bay. Determining next route...`);
            }

            // Immediately calculate route to next package (or return home)
            this._planNextLeg();
        }

        this._updateUIStateButtons();
        this.updateStatsUI();
    }

    /* ────────────────────────────────────────────────────────────────────────
     * 9. CANVAS RENDERING ENGINE
     * ──────────────────────────────────────────────────────────────────────── */
    _renderLoop(timestamp) {
        if (!this.lastFrameTime) this.lastFrameTime = timestamp;
        const dt = Math.min(0.1, (timestamp - this.lastFrameTime) / 1000);
        this.lastFrameTime = timestamp;

        this._updateSimulation(dt);
        this._draw();

        requestAnimationFrame(this._renderLoop);
    }

    _draw() {
        const ctx = this.ctx;
        const cs = this.cellSize;

        // Background
        ctx.fillStyle = '#0f141c';
        ctx.fillRect(0, 0, GRID_COLS * cs, GRID_ROWS * cs);

        // 1. Grid Lines
        ctx.strokeStyle = '#1b2330';
        ctx.lineWidth = 1;
        for (let r = 0; r <= GRID_ROWS; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * cs);
            ctx.lineTo(GRID_COLS * cs, r * cs);
            ctx.stroke();
        }
        for (let c = 0; c <= GRID_COLS; c++) {
            ctx.beginPath();
            ctx.moveTo(c * cs, 0);
            ctx.lineTo(c * cs, GRID_ROWS * cs);
            ctx.stroke();
        }

        // 2. Dispatch Station Zone
        this._drawDispatchZone(ctx, cs);

        // 3. Warehouse Shelving Racks
        this._drawShelves(ctx, cs);

        // 4. A* Search Visualization (Explored & Frontier)
        if (this.showSearchViz) {
            this._drawSearchProcess(ctx, cs);
        }

        // 5. Reroute Ghost Path (Orange)
        if (this.rerouteOldPath.length > 1 && this.rerouteTrailTimer > 0) {
            this._drawRerouteGhost(ctx, cs);
        }

        // 6. Active Planned Path (Cyan)
        if (this.currentPath.length > 0) {
            this._drawActivePath(ctx, cs);
        }

        // 7. Dynamic Obstacles
        this._drawObstacles(ctx, cs);

        // 8. Packages
        this._drawPackages(ctx, cs);

        // 9. Robot AGV
        this._drawRobot(ctx, cs);
    }

    _drawDispatchZone(ctx, cs) {
        const x = this.dispatch.c * cs;
        const y = this.dispatch.r * cs;

        // Green bay background
        ctx.fillStyle = 'rgba(63, 185, 80, 0.14)';
        ctx.fillRect(x, y, cs, cs);

        // Glowing border
        ctx.strokeStyle = '#3fb950';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, cs - 2, cs - 2);

        // Diagonal hatch markings
        ctx.strokeStyle = 'rgba(63, 185, 80, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 10);
        ctx.lineTo(x + 10, y + 2);
        ctx.moveTo(x + 2, y + cs - 2);
        ctx.lineTo(x + cs - 2, y + 2);
        ctx.moveTo(x + cs - 10, y + cs - 2);
        ctx.lineTo(x + cs - 2, y + cs - 10);
        ctx.stroke();

        // Dispatch Icon/Text
        ctx.fillStyle = '#b0f0c0';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DISP', x + cs / 2, y + cs / 2);
    }

    _drawShelves(ctx, cs) {
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (this.shelves[r][c]) {
                    const x = c * cs;
                    const y = r * cs;

                    // Shelf Base
                    ctx.fillStyle = '#263345';
                    ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);

                    // Shelf Top Lip (3D depth)
                    ctx.fillStyle = '#3a4c63';
                    ctx.fillRect(x + 2, y + 2, cs - 4, 5);

                    // Shelf Support Lines
                    ctx.strokeStyle = '#18202c';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x + cs / 2, y + 2);
                    ctx.lineTo(x + cs / 2, y + cs - 2);
                    ctx.stroke();

                    // Shelf Stored Goods (subtle warm boxes on rack)
                    ctx.fillStyle = 'rgba(210, 153, 34, 0.4)';
                    ctx.fillRect(x + 4, y + 10, 8, 8);
                    ctx.fillStyle = 'rgba(88, 166, 255, 0.35)';
                    ctx.fillRect(x + cs - 12, y + 12, 8, 8);

                    // Outer border
                    ctx.strokeStyle = '#121822';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x + 1, y + 1, cs - 2, cs - 2);
                }
            }
        }
    }

    _drawSearchProcess(ctx, cs) {
        // Explored Nodes (Closed Set) - Soft translucent purple
        ctx.fillStyle = 'rgba(188, 140, 255, 0.18)';
        for (const node of this.lastExploredNodes) {
            ctx.fillRect(node.c * cs + 2, node.r * cs + 2, cs - 4, cs - 4);
        }

        // Frontier Nodes (Open Set) - Glowing soft blue
        ctx.fillStyle = 'rgba(88, 166, 255, 0.28)';
        ctx.strokeStyle = 'rgba(88, 166, 255, 0.6)';
        ctx.lineWidth = 1;
        for (const node of this.lastFrontierNodes) {
            ctx.fillRect(node.c * cs + 3, node.r * cs + 3, cs - 6, cs - 6);
            ctx.strokeRect(node.c * cs + 3, node.r * cs + 3, cs - 6, cs - 6);
        }
    }

    _drawRerouteGhost(ctx, cs) {
        const alpha = Math.min(0.65, this.rerouteTrailTimer / 180);
        ctx.strokeStyle = `rgba(209, 134, 22, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        for (let i = 0; i < this.rerouteOldPath.length; i++) {
            const pt = this.rerouteOldPath[i];
            const px = pt.c * cs + cs / 2;
            const py = pt.r * cs + cs / 2;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }

    _drawActivePath(ctx, cs) {
        // Draw path connecting robot to remaining steps
        const pts = [{ r: this.robot.r, c: this.robot.c }, ...this.currentPath];

        // Path Glow Underlay
        ctx.strokeStyle = 'rgba(57, 210, 192, 0.25)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
            const px = pts[i].c * cs + cs / 2;
            const py = pts[i].r * cs + cs / 2;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Main Cyan Path Line
        ctx.strokeStyle = '#39d2c0';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Path Waypoint Dots
        ctx.fillStyle = '#b3f7f0';
        for (let i = 1; i < pts.length; i++) {
            const px = pts[i].c * cs + cs / 2;
            const py = pts[i].r * cs + cs / 2;
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawObstacles(ctx, cs) {
        for (const key of this.obstacles) {
            const [r, c] = key.split(',').map(Number);
            const x = c * cs;
            const y = r * cs;

            // Hazard Red Base
            ctx.fillStyle = '#6e1a1a';
            ctx.fillRect(x + 2, y + 2, cs - 4, cs - 4);

            // Diagonal Hazard Warning Stripes
            ctx.save();
            ctx.beginPath();
            ctx.rect(x + 2, y + 2, cs - 4, cs - 4);
            ctx.clip();

            ctx.strokeStyle = '#f85149';
            ctx.lineWidth = 3.5;
            for (let offset = -cs; offset < cs * 2; offset += 8) {
                ctx.beginPath();
                ctx.moveTo(x + offset, y);
                ctx.lineTo(x + offset + cs, y + cs);
                ctx.stroke();
            }
            ctx.restore();

            // Pulsing Red Border
            ctx.strokeStyle = '#ff7b72';
            ctx.lineWidth = 1.8;
            ctx.strokeRect(x + 2, y + 2, cs - 4, cs - 4);

            // Warning Icon
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚠', x + cs / 2, y + cs / 2);
        }
    }

    _drawPackages(ctx, cs) {
        for (const pkg of this.packages) {
            const x = pkg.c * cs;
            const y = pkg.r * cs;

            if (pkg.collected) {
                // Dimmed collected marker
                ctx.fillStyle = 'rgba(63, 185, 80, 0.15)';
                ctx.fillRect(x + 4, y + 4, cs - 8, cs - 8);

                ctx.strokeStyle = 'rgba(63, 185, 80, 0.4)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 4, y + 4, cs - 8, cs - 8);

                ctx.fillStyle = '#3fb950';
                ctx.font = 'bold 11px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('✓', x + cs / 2, y + cs / 2);
            } else {
                // Target Package - Golden Box
                const isTarget = this.currentTarget && this.currentTarget.id === pkg.id;

                if (isTarget) {
                    // Pulsing ring around current target
                    ctx.strokeStyle = 'rgba(210, 153, 34, 0.6)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(x + cs / 2, y + cs / 2, cs / 2 - 2, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // Box Body
                ctx.fillStyle = '#d29922';
                ctx.fillRect(x + 4, y + 4, cs - 8, cs - 8);

                // Box 3D Top bevel
                ctx.fillStyle = '#e3b341';
                ctx.fillRect(x + 4, y + 4, cs - 8, 4);

                // Ribbon / Tape
                ctx.fillStyle = '#9e6a03';
                ctx.fillRect(x + cs / 2 - 1.5, y + 4, 3, cs - 8);
                ctx.fillRect(x + 4, y + cs / 2 - 1.5, cs - 8, 3);

                // Border
                ctx.strokeStyle = '#6e4a02';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 4, y + 4, cs - 8, cs - 8);

                // Package ID Number
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 9px JetBrains Mono, monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`P${pkg.id}`, x + cs / 2, y + cs / 2);
            }
        }
    }

    _drawRobot(ctx, cs) {
        const cx = this.robot.visualX * cs + cs / 2;
        const cy = this.robot.visualY * cs + cs / 2;
        const radius = cs * 0.42;

        ctx.save();
        ctx.translate(cx, cy);

        // Robot Direction Heading
        ctx.rotate(this.robot.dirAngle);

        // Sensor Radar Arc (when moving)
        if (this.robot.state === 'MOVING') {
            ctx.fillStyle = 'rgba(88, 166, 255, 0.12)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius * 2.2, -Math.PI / 4, Math.PI / 4);
            ctx.closePath();
            ctx.fill();
        }

        // AGV Outer Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;

        // AGV Body Circle
        const grad = ctx.createRadialGradient(-radius * 0.2, -radius * 0.2, 1, 0, 0, radius);
        if (this.robot.state === 'BLOCKED') {
            grad.addColorStop(0, '#f85149');
            grad.addColorStop(1, '#b62324');
        } else if (this.robot.state === 'REPLANNING') {
            grad.addColorStop(0, '#e3b341');
            grad.addColorStop(1, '#9e6a03');
        } else {
            grad.addColorStop(0, '#79c0ff');
            grad.addColorStop(1, '#1f6feb');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = 'transparent';

        // Outer Metallic Rim
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Direction Arrow Chevron (pointing to front)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(radius * 0.65, 0);
        ctx.lineTo(radius * 0.15, -radius * 0.45);
        ctx.lineTo(radius * 0.3, 0);
        ctx.lineTo(radius * 0.15, radius * 0.45);
        ctx.closePath();
        ctx.fill();

        // Central Cargo Bay Status
        if (this.robot.carrying) {
            // Package in cargo bay
            ctx.fillStyle = '#d29922';
            ctx.fillRect(-radius * 0.45, -radius * 0.45, radius * 0.7, radius * 0.7);
            ctx.strokeStyle = '#6e4a02';
            ctx.lineWidth = 1;
            ctx.strokeRect(-radius * 0.45, -radius * 0.45, radius * 0.7, radius * 0.7);
        } else {
            // Status Indicator LED
            ctx.fillStyle = this.robot.state === 'BLOCKED' ? '#ff7b72' : (this.robot.state === 'MOVING' ? '#56d364' : '#e3b341');
            ctx.beginPath();
            ctx.arc(-radius * 0.15, 0, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /* ────────────────────────────────────────────────────────────────────────
     * 10. UI UPDATES, STATS & EVENT LOGGING
     * ──────────────────────────────────────────────────────────────────────── */
    updateStatsUI() {
        document.getElementById('st-status').textContent = this.stats.status;
        document.getElementById('st-status').className = `stat-val s-${this.robot.state.toLowerCase()}`;

        document.getElementById('st-packages').textContent = `${this.stats.collectedCount} / ${this.stats.totalPackages}`;
        document.getElementById('st-position').textContent = `(${this.robot.r}, ${this.robot.c})`;

        if (this.currentTarget) {
            const name = this.currentTarget.isDispatch ? 'Dispatch Bay' : `Pkg #${this.currentTarget.id}`;
            document.getElementById('st-target').textContent = `${name} (${this.currentTarget.r}, ${this.currentTarget.c})`;
        } else {
            document.getElementById('st-target').textContent = '—';
        }

        document.getElementById('st-cells').textContent = this.stats.cellsTraversed;
        document.getElementById('st-path-len').textContent = `${this.currentPath.length} cells`;
        document.getElementById('st-searches').textContent = this.stats.totalSearches;
        document.getElementById('st-obstacles').textContent = this.stats.obstaclesHit;
        document.getElementById('st-replans').textContent = this.stats.successfulReplans;
        document.getElementById('st-nodes').textContent = this.stats.totalNodesExplored;
        document.getElementById('st-search-time').textContent = this.stats.lastSearchTime ? `${this.stats.lastSearchTime} ms` : '— ms';
    }

    updateDurationUI() {
        const mins = Math.floor(this.stats.elapsedSeconds / 60).toString().padStart(2, '0');
        const secs = (this.stats.elapsedSeconds % 60).toString().padStart(2, '0');
        document.getElementById('st-duration').textContent = `${mins}:${secs}`;
    }

    _updateUIStateButtons() {
        const isRunning = this.robot.state === 'MOVING' || this.robot.state === 'SEARCHING' || this.robot.state === 'REPLANNING';
        const isPaused = this.isPaused;
        const isHalted = this.robot.state === 'COMPLETED' || this.robot.state === 'BLOCKED' || this.robot.state === 'IDLE';

        document.getElementById('btn-start').disabled = isRunning && !isPaused;
        document.getElementById('btn-pause').disabled = !isRunning || isPaused;
        document.getElementById('btn-resume').disabled = !isPaused;
        document.getElementById('btn-step').disabled = !isPaused && !isHalted;
    }

    showOverlayMsg(text, className = '') {
        this.overlayMsg.textContent = text;
        this.overlayMsg.className = `grid-overlay-msg ${className}`;
    }

    hideOverlayMsg() {
        this.overlayMsg.className = 'grid-overlay-msg hidden';
    }

    setExplanation(html) {
        this.explanation.innerHTML = html;
    }

    log(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;

        const mins = Math.floor(this.stats.elapsedSeconds / 60).toString().padStart(2, '0');
        const secs = (this.stats.elapsedSeconds % 60).toString().padStart(2, '0');
        const timeSpan = document.createElement('span');
        timeSpan.className = 'log-time';
        timeSpan.textContent = `[${mins}:${secs}]`;

        const msgSpan = document.createElement('span');
        msgSpan.className = 'log-msg';
        msgSpan.textContent = message;

        entry.appendChild(timeSpan);
        entry.appendChild(msgSpan);

        this.eventLog.appendChild(entry);
        this.eventLog.scrollTop = this.eventLog.scrollHeight;
    }

    clearLog() {
        this.eventLog.innerHTML = '';
    }

    /* ────────────────────────────────────────────────────────────────────────
     * 11. EVENT LISTENERS & USER INTERACTION
     * ──────────────────────────────────────────────────────────────────────── */
    _initControls() {
        // Buttons
        document.getElementById('btn-start').addEventListener('click', () => this.start());
        document.getElementById('btn-pause').addEventListener('click', () => this.pause());
        document.getElementById('btn-resume').addEventListener('click', () => this.resume());
        document.getElementById('btn-reset').addEventListener('click', () => this.reset());
        document.getElementById('btn-step').addEventListener('click', () => this.step());
        document.getElementById('btn-trigger').addEventListener('click', () => this.triggerObstacleAhead());

        // Scenario Selector
        document.getElementById('btn-load-scenario').addEventListener('click', () => {
            const sc = document.getElementById('select-scenario').value;
            this.loadScenario(sc);
        });

        document.getElementById('select-scenario').addEventListener('change', (e) => {
            this.loadScenario(e.target.value);
        });

        // Strategy
        document.getElementById('select-strategy').addEventListener('change', (e) => {
            this.strategy = e.target.value;
            this.log(`Package collection strategy set to: ${e.target.value === 'nearest' ? 'Nearest Package' : 'Fixed Order'}.`, 'info');
        });

        // Speed Slider
        const speedSlider = document.getElementById('slider-speed');
        const speedDisplay = document.getElementById('speed-display');
        speedSlider.addEventListener('input', (e) => {
            this.speedLevel = parseInt(e.target.value, 10);
            if (this.speedLevel <= 4) speedDisplay.textContent = 'Slow';
            else if (this.speedLevel <= 11) speedDisplay.textContent = 'Medium';
            else if (this.speedLevel <= 17) speedDisplay.textContent = 'Fast';
            else speedDisplay.textContent = 'Turbo';
        });

        // Options Toggles
        document.getElementById('chk-search-viz').addEventListener('change', (e) => {
            this.showSearchViz = e.target.checked;
        });

        document.getElementById('chk-auto-obs').addEventListener('change', (e) => {
            this.autoObstacles = e.target.checked;
            this.log(`Auto obstacle generator ${this.autoObstacles ? 'enabled' : 'disabled'}.`, 'info');
        });

        document.getElementById('chk-edit-obs').addEventListener('change', (e) => {
            this.editObstacleMode = e.target.checked;
            this.log(`Click-to-place obstacle mode ${this.editObstacleMode ? 'active' : 'inactive'}.`, 'info');
        });
    }

    _initCanvasEvents() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            const c = Math.floor(clickX / this.cellSize);
            const r = Math.floor(clickY / this.cellSize);

            if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
                this.addObstacle(r, c, false);
            }
        });
    }
}

// Instantiate simulation when DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    window.simulation = new WarehouseSimulation();
});
