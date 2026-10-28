/**
 * ════════════════════════════════════════════════════════════════════════════
 * AI Warehouse Robot – 3D Interactive Simulation
 * Real-Time A* Pathfinding, Dynamic Obstacle Avoidance, Three.js WebGL Engine,
 * OrbitControls, Animated AGV Robot, 3D Racks, Parcels, and Barricades.
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
const TILE_SIZE = 2.0; // 3D world units per cell

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
        desc: "Robot navigates clear warehouse aisles in 3D to collect 4 packages and return to dispatch. Demonstrates optimal A* pathfinding.",
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
        scheduledObstacles: [
            { atStep: 2, r: 14, c: 22 },
            { atStep: 2, r: 15, c: 21 },
            { atStep: 2, r: 17, c: 21 },
            { atStep: 2, r: 18, c: 22 }
        ]
    },
    free_play: {
        title: "Free Play",
        desc: "Custom package count. Click on any 3D floor aisle cell to dynamically add or remove obstacle barricades.",
        dispatch: { r: 1, c: 1 },
        packages: [],
        scheduledObstacles: []
    }
};

/* ────────────────────────────────────────────────────────────────────────────
 * 3. 3D WAREHOUSE SIMULATION CONTROLLER
 * ──────────────────────────────────────────────────────────────────────────── */
class Warehouse3DSimulation {
    constructor() {
        // Warehouse Grid Matrix
        this.grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(CELL_TYPE.EMPTY));
        this.shelves = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false));
        this._buildWarehouseShelves();

        this.dispatch = { r: 1, c: 1 };
        this.packages = [];
        this.currentTarget = null;

        // Obstacles Set: "r,c" -> { mesh, dropProgress }
        this.obstacles = new Map();
        this.scheduledObstacles = [];

        // Robot Logical & Physical State
        this.robot = {
            r: 1,
            c: 1,
            visualX: 1,
            visualY: 1,
            dirAngle: 0,
            targetAngle: 0,
            carrying: null,
            state: 'IDLE' // IDLE, SEARCHING, MOVING, REPLANNING, COMPLETED, BLOCKED, PAUSED
        };

        // Paths & Search Visualization
        this.currentPath = [];
        this.fullCurrentPath = [];
        this.rerouteOldPath = [];
        this.rerouteTrailTimer = 0;
        this.lastExploredNodes = [];
        this.lastFrontierNodes = [];

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
        this.strategy = 'fixed';
        this.speedLevel = 8;
        this.showSearchViz = true;
        this.autoObstacles = false;
        this.editObstacleMode = false;
        this.isPaused = false;
        this.stepRequested = false;

        // Camera Views: 'iso', 'top', 'chase'
        this.currentCameraView = 'iso';

        // Timing
        this.lastStepTimestamp = 0;
        this.autoObstacleTimer = 0;
        this.timerIntervalId = null;

        // UI Element References
        this.canvas = document.getElementById('warehouse-canvas');
        this.overlayMsg = document.getElementById('grid-overlay-msg');
        this.explanation = document.getElementById('explanation');
        this.aiPulseDot = document.getElementById('ai-pulse-dot');
        this.aiModeLabel = document.getElementById('ai-mode-label');

        // Setup Three.js Scene & 3D Objects
        this._initThree();
        this._build3DEnvironment();
        this._initControls();
        this._initRaycasting();

        // Load Default Scenario
        this.loadScenario('basic');

        // Animation Loop
        this._animate = this._animate.bind(this);
        requestAnimationFrame(this._animate);
    }

    /* ── Shelf Layout Definition ── */
    _buildWarehouseShelves() {
        const rackBlocks = [
            { rStart: 3, rEnd: 4, cStart: 3, cEnd: 8 },
            { rStart: 3, rEnd: 4, cStart: 11, cEnd: 16 },
            { rStart: 3, rEnd: 4, cStart: 19, cEnd: 23 },

            { rStart: 7, rEnd: 8, cStart: 3, cEnd: 8 },
            { rStart: 7, rEnd: 8, cStart: 11, cEnd: 16 },
            { rStart: 7, rEnd: 8, cStart: 19, cEnd: 23 },

            { rStart: 11, rEnd: 12, cStart: 3, cEnd: 8 },
            { rStart: 11, rEnd: 12, cStart: 11, cEnd: 16 },
            { rStart: 11, rEnd: 12, cStart: 19, cEnd: 23 },

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

    /* ── Helper: Grid (r, c) to 3D World (x, z) ── */
    gridToWorld(r, c) {
        const x = (c - (GRID_COLS - 1) / 2) * TILE_SIZE;
        const z = (r - (GRID_ROWS - 1) / 2) * TILE_SIZE;
        return { x, z };
    }

    worldToGrid(x, z) {
        const c = Math.round(x / TILE_SIZE + (GRID_COLS - 1) / 2);
        const r = Math.round(z / TILE_SIZE + (GRID_ROWS - 1) / 2);
        return { r, c };
    }

    /* ────────────────────────────────────────────────────────────────────────
     * 4. THREE.JS 3D ENGINE INITIALIZATION
     * ──────────────────────────────────────────────────────────────────────── */
    _initThree() {
        const container = document.getElementById('canvas-wrap');
        const width = container.clientWidth || 800;
        const height = container.clientHeight || 560;

        // Scene with atmospheric fog
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e17);
        this.scene.fog = new THREE.FogExp2(0x0a0e17, 0.012);

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Do not go under floor
        this.controls.minDistance = 6;
        this.controls.maxDistance = 90;
        this.controls.target.set(0, 0, 0);

        this._setCameraPosition('iso', false);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xd0e2ff, 0.85);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
        dirLight.position.set(15, 30, 15);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 80;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.top = 25;
        dirLight.shadow.camera.bottom = -25;
        dirLight.shadow.bias = -0.0005;
        this.scene.add(dirLight);

        // Secondary soft fill light
        const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.35);
        fillLight.position.set(-20, 20, -20);
        this.scene.add(fillLight);

        // Window resize handler
        window.addEventListener('resize', () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        });
    }

    _setCameraPosition(viewMode, animate = true) {
        this.currentCameraView = viewMode;
        document.querySelectorAll('.btn-cam').forEach(b => b.classList.remove('active'));

        const btn = document.getElementById(`btn-cam-${viewMode}`);
        if (btn) btn.classList.add('active');

        if (viewMode === 'iso') {
            this.targetCamPos = new THREE.Vector3(0, 32, 34);
            this.targetCamLook = new THREE.Vector3(0, 0, 0);
        } else if (viewMode === 'top') {
            this.targetCamPos = new THREE.Vector3(0, 48, 0.001);
            this.targetCamLook = new THREE.Vector3(0, 0, 0);
        } else if (viewMode === 'chase') {
            // Chase camera position set dynamically in render loop
            return;
        }

        if (this.targetCamPos) {
            this.camera.position.copy(this.targetCamPos);
            if (this.controls) {
                this.controls.target.copy(this.targetCamLook);
                this.controls.update();
            }
        }
    }

    /* ── Build 3D Warehouse Environment ── */
    _build3DEnvironment() {
        const floorWidth = GRID_COLS * TILE_SIZE;
        const floorHeight = GRID_ROWS * TILE_SIZE;

        // 1. Warehouse Polished Concrete Floor
        const floorGeo = new THREE.PlaneGeometry(floorWidth, floorHeight);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x121722,
            roughness: 0.45,
            metalness: 0.2
        });
        this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
        this.floorMesh.rotation.x = -Math.PI / 2;
        this.floorMesh.receiveShadow = true;
        this.scene.add(this.floorMesh);

        // 2. 3D Grid Lines Overlay
        const gridHelper = new THREE.GridHelper(
            Math.max(floorWidth, floorHeight),
            Math.max(GRID_COLS, GRID_ROWS),
            0x243245,
            0x1a2432
        );
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);

        // 3. Perimeter Safety Border
        const borderGeo = new THREE.BoxGeometry(floorWidth + 0.4, 0.1, floorHeight + 0.4);
        const borderMat = new THREE.MeshBasicMaterial({ color: 0x3a4b63, wireframe: true });
        const borderMesh = new THREE.Mesh(borderGeo, borderMat);
        borderMesh.position.y = 0.05;
        this.scene.add(borderMesh);

        // 4. Dispatch Bay 3D Zone
        this._build3DDispatchBay();

        // 5. 3D Industrial Storage Racks & Pallets
        this._build3DShelves();

        // 6. 3D AGV Robot
        this._build3DRobot();

        // 7. Dynamic Groups for Paths & Search Viz
        this.pathGroup = new THREE.Group();
        this.scene.add(this.pathGroup);

        this.searchVizGroup = new THREE.Group();
        this.scene.add(this.searchVizGroup);

        this.packagesGroup = new THREE.Group();
        this.scene.add(this.packagesGroup);

        this.obstaclesGroup = new THREE.Group();
        this.scene.add(this.obstaclesGroup);
    }

    _build3DDispatchBay() {
        const { x, z } = this.gridToWorld(this.dispatch.r, this.dispatch.c);

        // Green bay platform
        const bayGeo = new THREE.BoxGeometry(TILE_SIZE * 0.95, 0.06, TILE_SIZE * 0.95);
        const bayMat = new THREE.MeshStandardMaterial({
            color: 0x1a5e2a,
            emissive: 0x1a5e2a,
            emissiveIntensity: 0.35,
            roughness: 0.4
        });
        const bay = new THREE.Mesh(bayGeo, bayMat);
        bay.position.set(x, 0.03, z);
        bay.receiveShadow = true;
        this.scene.add(bay);

        // Four Corner Bollards
        const bollardGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12);
        const bollardMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
        const offsets = [-0.4, 0.4];
        for (const ox of offsets) {
            for (const oz of offsets) {
                const bollard = new THREE.Mesh(bollardGeo, bollardMat);
                bollard.position.set(x + ox * TILE_SIZE, 0.25, z + oz * TILE_SIZE);
                bollard.castShadow = true;
                this.scene.add(bollard);
            }
        }
    }

    _build3DShelves() {
        const rackGroup = new THREE.Group();
        const beamMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 }); // Industrial blue
        const orangeBarMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.4 }); // Safety orange
        const palletMat = new THREE.MeshStandardMaterial({ color: 0x785338, roughness: 0.8 }); // Wood pallet
        const boxMatA = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 }); // Cardboard brown
        const boxMatB = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 }); // Blue container

        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (this.shelves[r][c]) {
                    const { x, z } = this.gridToWorld(r, c);
                    const unit = new THREE.Group();
                    unit.position.set(x, 0, z);

                    // 4 Steel Uprights
                    const legGeo = new THREE.BoxGeometry(0.1, 2.4, 0.1);
                    const legOffsets = [-0.85, 0.85];
                    for (const lx of legOffsets) {
                        for (const lz of legOffsets) {
                            const leg = new THREE.Mesh(legGeo, beamMat);
                            leg.position.set(lx, 1.2, lz);
                            leg.castShadow = true;
                            unit.add(leg);
                        }
                    }

                    // 2 Horizontal Orange Crossbeams (Shelf Tiers)
                    const beamGeo = new THREE.BoxGeometry(1.8, 0.08, 0.08);
                    for (const ty of [0.8, 1.8]) {
                        for (const bz of [-0.85, 0.85]) {
                            const beam = new THREE.Mesh(beamGeo, orangeBarMat);
                            beam.position.set(0, ty, bz);
                            beam.castShadow = true;
                            unit.add(beam);
                        }
                    }

                    // Wooden Pallets on tiers
                    const palletGeo = new THREE.BoxGeometry(1.6, 0.08, 1.6);
                    for (const ty of [0.85, 1.85]) {
                        const pallet = new THREE.Mesh(palletGeo, palletMat);
                        pallet.position.set(0, ty, 0);
                        pallet.castShadow = true;
                        unit.add(pallet);
                    }

                    // Stored Boxes on shelves
                    const box1Geo = new THREE.BoxGeometry(0.65, 0.55, 0.65);
                    const box1 = new THREE.Mesh(box1Geo, boxMatA);
                    box1.position.set(-0.35, 1.15, -0.2);
                    box1.castShadow = true;
                    unit.add(box1);

                    const box2Geo = new THREE.BoxGeometry(0.5, 0.45, 0.5);
                    const box2 = new THREE.Mesh(box2Geo, boxMatB);
                    box2.position.set(0.4, 1.1, 0.3);
                    box2.castShadow = true;
                    unit.add(box2);

                    const box3Geo = new THREE.BoxGeometry(0.7, 0.6, 0.7);
                    const box3 = new THREE.Mesh(box3Geo, boxMatA);
                    box3.position.set(0.1, 2.2, 0);
                    box3.castShadow = true;
                    unit.add(box3);

                    rackGroup.add(unit);
                }
            }
        }

        this.scene.add(rackGroup);
    }

    _build3DRobot() {
        this.robotGroup = new THREE.Group();

        // 1. Sleek AGV Main Chassis
        const bodyGeo = new THREE.CylinderGeometry(0.72, 0.76, 0.38, 28);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.3,
            metalness: 0.8
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.32;
        body.castShadow = true;
        this.robotGroup.add(body);

        // 2. High-Tech White Top Shell
        const topGeo = new THREE.CylinderGeometry(0.64, 0.68, 0.12, 28);
        const topMat = new THREE.MeshStandardMaterial({
            color: 0xf3f4f6,
            roughness: 0.2,
            metalness: 0.5
        });
        const topShell = new THREE.Mesh(topGeo, topMat);
        topShell.position.y = 0.52;
        topShell.castShadow = true;
        this.robotGroup.add(topShell);

        // 3. Glowing LED Status Perimeter Ring
        const ringGeo = new THREE.TorusGeometry(0.73, 0.045, 12, 32);
        this.robotRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const ring = new THREE.Mesh(ringGeo, this.robotRingMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.36;
        this.robotGroup.add(ring);

        // 4. Rotating LiDAR Sensor Dome
        this.lidarGroup = new THREE.Group();
        this.lidarGroup.position.set(0, 0.62, 0);

        const lidarBaseGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.15, 16);
        const lidarBaseMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9 });
        const lidarBase = new THREE.Mesh(lidarBaseGeo, lidarBaseMat);
        this.lidarGroup.add(lidarBase);

        // Laser Fan / Beam Sweep Mesh
        const laserGeo = new THREE.ConeGeometry(2.4, 0.02, 16, 1, true, 0, Math.PI / 3);
        const laserMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.22,
            side: THREE.DoubleSide
        });
        this.laserMesh = new THREE.Mesh(laserGeo, laserMat);
        this.laserMesh.rotation.x = Math.PI / 2;
        this.laserMesh.rotation.z = -Math.PI / 6;
        this.laserMesh.position.y = 0.08;
        this.lidarGroup.add(this.laserMesh);

        this.robotGroup.add(this.lidarGroup);

        // 5. Direction Chevron on Robot Front
        const chevronGeo = new THREE.ConeGeometry(0.16, 0.35, 3);
        const chevronMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const chevron = new THREE.Mesh(chevronGeo, chevronMat);
        chevron.rotation.x = Math.PI / 2;
        chevron.rotation.z = -Math.PI / 2;
        chevron.position.set(0.48, 0.58, 0);
        this.robotGroup.add(chevron);

        // 6. Rotating Wheels on sides
        this.wheels = [];
        const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
        for (const wz of [-0.55, 0.55]) {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(0, 0.2, wz);
            wheel.castShadow = true;
            this.robotGroup.add(wheel);
            this.wheels.push(wheel);
        }

        // 7. Cargo Bay Container Mesh (visible when carrying parcel)
        const cargoGeo = new THREE.BoxGeometry(0.48, 0.48, 0.48);
        const cargoMat = new THREE.MeshStandardMaterial({
            color: 0xd29922,
            roughness: 0.6,
            emissive: 0xd29922,
            emissiveIntensity: 0.2
        });
        this.robotCargoMesh = new THREE.Mesh(cargoGeo, cargoMat);
        this.robotCargoMesh.position.set(-0.15, 0.82, 0);
        this.robotCargoMesh.visible = false;
        this.robotGroup.add(this.robotCargoMesh);

        // Initial placement at dispatch
        const { x, z } = this.gridToWorld(this.dispatch.r, this.dispatch.c);
        this.robotGroup.position.set(x, 0, z);
        this.scene.add(this.robotGroup);
    }

    /* ────────────────────────────────────────────────────────────────────────
     * 5. A* PATHFINDING ALGORITHM (From scratch)
     * ──────────────────────────────────────────────────────────────────────── */
    findPathAStar(start, goal) {
        const t0 = performance.now();

        const directions = [
            { dr: -1, dc: 0 },
            { dr: 1, dc: 0 },
            { dr: 0, dc: -1 },
            { dr: 0, dc: 1 }
        ];

        const heuristic = (r, c) => Math.abs(r - goal.r) + Math.abs(c - goal.c);

        const startKey = `${start.r},${start.c}`;
        const goalKey = `${goal.r},${goal.c}`;

        const openSet = new MinPriorityQueue();
        const cameFrom = new Map();

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

            if (current.r === goal.r && current.c === goal.c) {
                const elapsed = performance.now() - t0;
                this.stats.totalSearches++;
                this.stats.totalNodesExplored += nodesExploredCount;
                this.stats.lastSearchTime = elapsed.toFixed(1);

                this.lastExploredNodes = Array.from(closedSet).map(k => {
                    const [r, c] = k.split(',').map(Number);
                    return { r, c };
                });
                this.lastFrontierNodes = Array.from(frontierSet).map(k => {
                    const [r, c] = k.split(',').map(Number);
                    return { r, c };
                });

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

            for (const dir of directions) {
                const nr = current.r + dir.dr;
                const nc = current.c + dir.dc;
                const neighborKey = `${nr},${nc}`;

                if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) continue;
                if (this.shelves[nr][nc]) continue;
                if (this.obstacles.has(neighborKey)) continue;
                if (closedSet.has(neighborKey)) continue;

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
     * 6. SCENARIO MANAGEMENT & 3D ASSET SPAWNING
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

        if (this.robotCargoMesh) this.robotCargoMesh.visible = false;

        // Clear 3D Obstacles
        for (const [key, obsData] of this.obstacles) {
            this.obstaclesGroup.remove(obsData.mesh);
        }
        this.obstacles.clear();
        this.scheduledObstacles = JSON.parse(JSON.stringify(sc.scheduledObstacles));

        // Setup Packages
        if (name === 'free_play') {
            const count = parseInt(document.getElementById('input-pkg-count').value, 10) || 5;
            this.packages = this._generateRandomPackages(count);
        } else {
            this.packages = sc.packages.map(p => ({ ...p, collected: false }));
        }

        this._spawn3DPackages();

        // Reset Stats
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

        // Position 3D Robot
        const { x, z } = this.gridToWorld(this.robot.r, this.robot.c);
        this.robotGroup.position.set(x, 0, z);
        this.robotGroup.rotation.y = 0;

        // Clear 3D Paths & Search Viz
        this._update3DPathMesh();
        this._update3DSearchViz();

        // UI Updates
        document.getElementById('scenario-desc').textContent = sc.desc;
        this.hideOverlayMsg();
        this.updateAIStatus('STANDBY', `Scenario <strong>${sc.title}</strong> loaded. Press <strong>Start</strong> to begin 3D navigation.`);
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

            if (this.shelves[r][c]) continue;
            if (r === this.dispatch.r && c === this.dispatch.c) continue;
            if (pkgs.some(p => p.r === r && p.c === c)) continue;

            pkgs.push({ id: id++, r, c, collected: false });
        }
        return pkgs;
    }

    _spawn3DPackages() {
        // Clear existing package meshes
        while (this.packagesGroup.children.length > 0) {
            this.packagesGroup.remove(this.packagesGroup.children[0]);
        }

        const boxGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65);

        for (const pkg of this.packages) {
            const { x, z } = this.gridToWorld(pkg.r, pkg.c);
            const pGroup = new THREE.Group();
            pGroup.position.set(x, 0.32, z);

            // Cardboard parcel box
            const boxMat = new THREE.MeshStandardMaterial({
                color: 0xd29922,
                roughness: 0.5,
                metalness: 0.1
            });
            const boxMesh = new THREE.Mesh(boxGeo, boxMat);
            boxMesh.castShadow = true;
            pGroup.add(boxMesh);

            // Package Ribbon Tape
            const tapeMat = new THREE.MeshStandardMaterial({ color: 0x9e6a03 });
            const tapeGeo = new THREE.BoxGeometry(0.67, 0.67, 0.12);
            const tape = new THREE.Mesh(tapeGeo, tapeMat);
            pGroup.add(tape);

            // Floating 3D Badge Sprite ("P1", "P2", etc.)
            const sprite = this._createLabelSprite(`P${pkg.id}`);
            sprite.position.y = 0.95;
            pGroup.add(sprite);

            pkg.meshGroup = pGroup;
            this.packagesGroup.add(pGroup);
        }
    }

    _createLabelSprite(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Draw glowing circular pin
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(64, 64, 52, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#58a6ff';
        ctx.lineWidth = 8;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 50px JetBrains Mono, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 66);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(1.2, 1.2, 1);
        return sprite;
    }

    /* ────────────────────────────────────────────────────────────────────────
     * 7. 3D DYNAMIC OBSTACLES (Barricades with Drop-in Animation)
     * ──────────────────────────────────────────────────────────────────────── */
    triggerObstacleAhead() {
        if (this.currentPath.length === 0) {
            this.updateAIStatus('WARNING', 'Cannot place obstacle: robot does not currently have an active planned path.');
            return;
        }

        const stepOffset = Math.min(1, this.currentPath.length - 1);
        const cell = this.currentPath[stepOffset];

        if (cell) {
            this.addObstacle(cell.r, cell.c, true);
        }
    }

    addObstacle(r, c, isTriggered = false) {
        const key = `${r},${c}`;

        if (r === this.robot.r && c === this.robot.c) return false;
        if (r === this.dispatch.r && c === this.dispatch.c) return false;
        if (this.shelves[r][c]) return false;

        // Toggle obstacle if clicking existing
        if (this.obstacles.has(key)) {
            const obsData = this.obstacles.get(key);
            this.obstaclesGroup.remove(obsData.mesh);
            this.obstacles.delete(key);
            this.updateAIStatus('UPDATE', `Removed obstacle at 3D grid cell (${r}, ${c}).`);
            this.updateStatsUI();
            return true;
        }

        // Create 3D Industrial Hazard Barrier
        const { x, z } = this.gridToWorld(r, c);
        const obsMesh = this._createHazardBarrierMesh();
        obsMesh.position.set(x, 6.0, z); // Starts elevated for drop-in animation

        const obsData = {
            mesh: obsMesh,
            targetY: 0,
            currentY: 6.0,
            vy: 0,
            r,
            c
        };

        this.obstacles.set(key, obsData);
        this.obstaclesGroup.add(obsMesh);
        this.stats.obstaclesHit++;

        // Check if obstacle blocks the active planned route
        const blockedIndex = this.currentPath.findIndex(step => step.r === r && step.c === c);

        if (blockedIndex !== -1) {
            this._handleDynamicReroute(r, c);
        } else {
            this.updateAIStatus('HAZARD', `Dynamic barrier placed at (${r}, ${c}). Route remains clear.`);
            this.updateStatsUI();
        }

        return true;
    }

    _createHazardBarrierMesh() {
        const group = new THREE.Group();

        // 1. Heavy Base Feet
        const footGeo = new THREE.BoxGeometry(0.3, 0.16, 1.2);
        const footMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 });
        for (const fx of [-0.65, 0.65]) {
            const foot = new THREE.Mesh(footGeo, footMat);
            foot.position.set(fx, 0.08, 0);
            foot.castShadow = true;
            group.add(foot);
        }

        // 2. Barricade Plank with Hazard Stripes Texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Draw bold diagonal hazard stripes (Yellow / Red / Black)
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, 0, 256, 128);

        ctx.fillStyle = '#facc15';
        for (let i = -128; i < 384; i += 48) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 32, 0);
            ctx.lineTo(i - 32, 128);
            ctx.lineTo(i - 64, 128);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        const plankGeo = new THREE.BoxGeometry(1.6, 0.55, 0.08);
        const plankMat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.4,
            metalness: 0.2
        });
        const plank = new THREE.Mesh(plankGeo, plankMat);
        plank.position.set(0, 0.55, 0);
        plank.castShadow = true;
        group.add(plank);

        // 3. Strobe Warning Light Beacon on top
        const beaconGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.25, 12);
        const beaconMat = new THREE.MeshStandardMaterial({
            color: 0xfacc15,
            emissive: 0xfacc15,
            emissiveIntensity: 0.85
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(0, 0.95, 0);
        group.add(beacon);

        return group;
    }

    _handleDynamicReroute(blockedR, blockedC) {
        this.robot.state = 'REPLANNING';
        this.stats.status = 'Replanning';

        // Update AGV LED ring to warning amber
        this.robotRingMat.color.setHex(0xea580c);

        // Store ghost trail of old blocked path for visual comparison
        this.rerouteOldPath = [{ r: this.robot.r, c: this.robot.c }, ...this.currentPath];
        this.rerouteTrailTimer = 180;

        this.showOverlayMsg(`⚠️ Aisle Blocked! Rerouting in 3D...`, 'msg-orange');
        this.updateAIStatus('REPLANNING', `<strong>Obstacle Encountered at (${blockedR}, ${blockedC})!</strong> Active path obstructed. Recalculating 3D A* detour.`);

        // Recompute A* path from robot's current position to current target
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

            this.robotRingMat.color.setHex(0x38bdf8);
            this._update3DPathMesh();
            this._update3DSearchViz();

            this.updateAIStatus('NAVIGATING', `Alternative detour computed: <strong>${res.path.length} cells</strong> (${res.elapsed.toFixed(1)} ms). Navigating around obstacle.`);

            setTimeout(() => {
                if (this.robot.state === 'MOVING') this.hideOverlayMsg();
            }, 1200);
        } else {
            this.robot.state = 'BLOCKED';
            this.stats.status = 'Blocked';
            this.currentPath = [];
            this.robotRingMat.color.setHex(0xf85149);
            this._update3DPathMesh();

            this.showOverlayMsg(`🚫 Path Blocked! Target Unreachable`, 'msg-red');
            this.updateAIStatus('BLOCKED', `<strong>Critical:</strong> No valid 3D route exists to target. All surrounding corridors obstructed. AGV halted safely.`);
        }

        this._updateUIStateButtons();
        this.updateStatsUI();
    }

    /* ────────────────────────────────────────────────────────────────────────
     * 8. 3D PATH & SEARCH VISUALIZATION MESHES
     * ──────────────────────────────────────────────────────────────────────── */
    _update3DPathMesh() {
        // Clear old path meshes
        while (this.pathGroup.children.length > 0) {
            this.pathGroup.remove(this.pathGroup.children[0]);
        }

        // 1. Draw Active Path Ribbon (Glowing Cyan)
        if (this.currentPath.length > 0) {
            const pts = [{ r: this.robot.r, c: this.robot.c }, ...this.currentPath];
            const v3Pts = pts.map(p => {
                const { x, z } = this.gridToWorld(p.r, p.c);
                return new THREE.Vector3(x, 0.12, z);
            });

            // Smooth curve path
            const curve = new THREE.CatmullRomCurve3(v3Pts, false, 'catmullrom', 0.2);
            const tubeGeo = new THREE.TubeGeometry(curve, pts.length * 4, 0.08, 8, false);
            const tubeMat = new THREE.MeshStandardMaterial({
                color: 0x38bdf8,
                emissive: 0x38bdf8,
                emissiveIntensity: 0.75,
                roughness: 0.2
            });
            const pathTube = new THREE.Mesh(tubeGeo, tubeMat);
            this.pathGroup.add(pathTube);

            // Waypoint Glow Spheres
            const sphereGeo = new THREE.SphereGeometry(0.14, 12, 12);
            const sphereMat = new THREE.MeshBasicMaterial({ color: 0xb3f7f0 });
            for (let i = 1; i < v3Pts.length; i++) {
                const sp = new THREE.Mesh(sphereGeo, sphereMat);
                sp.position.copy(v3Pts[i]);
                this.pathGroup.add(sp);
            }
        }

        // 2. Draw Reroute Ghost Path (Glowing Orange Dashed)
        if (this.rerouteOldPath.length > 1 && this.rerouteTrailTimer > 0) {
            const ghostPts = this.rerouteOldPath.map(p => {
                const { x, z } = this.gridToWorld(p.r, p.c);
                return new THREE.Vector3(x, 0.14, z);
            });

            const ghostCurve = new THREE.CatmullRomCurve3(ghostPts, false, 'catmullrom', 0.2);
            const ghostTubeGeo = new THREE.TubeGeometry(ghostCurve, ghostPts.length * 3, 0.05, 6, false);
            const ghostMat = new THREE.MeshStandardMaterial({
                color: 0xea580c,
                emissive: 0xea580c,
                emissiveIntensity: 0.65,
                transparent: true,
                opacity: Math.min(0.8, this.rerouteTrailTimer / 180)
            });
            const ghostTube = new THREE.Mesh(ghostTubeGeo, ghostMat);
            this.pathGroup.add(ghostTube);
        }
    }

    _update3DSearchViz() {
        while (this.searchVizGroup.children.length > 0) {
            this.searchVizGroup.remove(this.searchVizGroup.children[0]);
        }

        if (!this.showSearchViz) return;

        // Explored Nodes (Closed Set) - Soft translucent purple floor tiles
        const exploredGeo = new THREE.PlaneGeometry(TILE_SIZE * 0.88, TILE_SIZE * 0.88);
        const exploredMat = new THREE.MeshBasicMaterial({
            color: 0xc084fc,
            transparent: true,
            opacity: 0.22,
            depthWrite: false
        });

        for (const node of this.lastExploredNodes) {
            const { x, z } = this.gridToWorld(node.r, node.c);
            const tile = new THREE.Mesh(exploredGeo, exploredMat);
            tile.rotation.x = -Math.PI / 2;
            tile.position.set(x, 0.02, z);
            this.searchVizGroup.add(tile);
        }

        // Frontier Nodes (Open Set) - Glowing soft cyan floor tiles
        const frontierGeo = new THREE.PlaneGeometry(TILE_SIZE * 0.82, TILE_SIZE * 0.82);
        const frontierMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.38,
            depthWrite: false
        });

        for (const node of this.lastFrontierNodes) {
            const { x, z } = this.gridToWorld(node.r, node.c);
            const tile = new THREE.Mesh(frontierGeo, frontierMat);
            tile.rotation.x = -Math.PI / 2;
            tile.position.set(x, 0.025, z);
            this.searchVizGroup.add(tile);
        }
    }

    /* ────────────────────────────────────────────────────────────────────────
     * 9. SIMULATION STEPPING & MOVEMENT LOOP
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

        this._planNextLeg();
        this._updateUIStateButtons();
        this.updateStatsUI();
    }

    pause() {
        if (this.isPaused || this.robot.state === 'IDLE' || this.robot.state === 'COMPLETED') return;
        this.isPaused = true;
        this.stats.status = 'Paused';
        this.updateAIStatus('PAUSED', 'Simulation paused by user. Click <strong>Resume</strong> or <strong>Step</strong> to continue.');
        this._updateUIStateButtons();
        this.updateStatsUI();
    }

    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.robot.state = this.currentPath.length > 0 ? 'MOVING' : 'SEARCHING';
        this.stats.status = this.robot.state === 'MOVING' ? 'Moving' : 'Searching';
        this.updateAIStatus('NAVIGATING', 'Simulation resumed. Moving along calculated trajectory.');
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
    }

    _planNextLeg() {
        const remainingPkgs = this.packages.filter(p => !p.collected);

        if (remainingPkgs.length > 0) {
            if (this.strategy === 'nearest') {
                remainingPkgs.sort((a, b) => {
                    const distA = Math.abs(a.r - this.robot.r) + Math.abs(a.c - this.robot.c);
                    const distB = Math.abs(b.r - this.robot.r) + Math.abs(b.c - this.robot.c);
                    return distA - distB;
                });
            }
            this.currentTarget = remainingPkgs[0];
            this.updateAIStatus('SEARCHING', `Calculating 3D shortest path to <strong>Package ${this.currentTarget.id}</strong> at (${this.currentTarget.r}, ${this.currentTarget.c}).`);
        } else {
            this.currentTarget = { id: 'Dispatch', r: this.dispatch.r, c: this.dispatch.c, isDispatch: true };
            this.updateAIStatus('RETURNING', `All packages collected! Planning return path to <strong>Dispatch Bay</strong> at (${this.dispatch.r}, ${this.dispatch.c}).`);
        }

        const res = this.findPathAStar(
            { r: this.robot.r, c: this.robot.c },
            { r: this.currentTarget.r, c: this.currentTarget.c }
        );

        if (res.success && res.path.length > 0) {
            this.currentPath = res.path.slice(1);
            this.fullCurrentPath = [...res.path];
            this.robot.state = 'MOVING';
            this.stats.status = 'Moving';
            this.robotRingMat.color.setHex(0x38bdf8);

            this._update3DPathMesh();
            this._update3DSearchViz();
            this.updateAIStatus('NAVIGATING', `Optimal path found: <strong>${res.path.length} steps</strong> (${res.elapsed.toFixed(1)} ms). AGV underway.`);
        } else {
            this.robot.state = 'BLOCKED';
            this.stats.status = 'Blocked';
            this.robotRingMat.color.setHex(0xf85149);
            this.showOverlayMsg(`Path Blocked! Target Unreachable`, 'msg-red');
            this.updateAIStatus('BLOCKED', `<strong>Alert:</strong> No valid 3D route exists to ${this.currentTarget.isDispatch ? 'Dispatch' : 'Package ' + this.currentTarget.id}. AGV safely stopped.`);
        }

        this._updateUIStateButtons();
        this.updateStatsUI();
    }

    _updateSimulation(dt) {
        if (this.isPaused && !this.stepRequested) return;

        // Check scheduled scenario obstacles
        if (this.scheduledObstacles.length > 0) {
            const nextObs = this.scheduledObstacles[0];
            if (this.stats.cellsTraversed >= nextObs.atStep) {
                this.scheduledObstacles.shift();
                this.addObstacle(nextObs.r, nextObs.c);
            }
        }

        // Auto Obstacles generator
        if (this.autoObstacles && this.robot.state === 'MOVING') {
            this.autoObstacleTimer += dt;
            if (this.autoObstacleTimer > 4.0) {
                this.autoObstacleTimer = 0;
                if (Math.random() < 0.65 && this.currentPath.length > 2) {
                    const idx = Math.min(3, this.currentPath.length - 1);
                    const pt = this.currentPath[idx];
                    this.addObstacle(pt.r, pt.c);
                }
            }
        }

        // Speed slider step interval: 650ms (Slow) down to 35ms (Turbo)
        const stepInterval = Math.max(35, 650 - (this.speedLevel - 1) * 32);

        if (this.stepRequested || (Date.now() - this.lastStepTimestamp >= stepInterval)) {
            if (this.robot.state === 'MOVING') {
                this._executeRobotStep();
            }
            this.lastStepTimestamp = Date.now();
            this.stepRequested = false;
        }

        // Smooth physical position interpolation for 3D robot
        const lerpFactor = Math.min(1, dt * (4 + this.speedLevel * 0.9));
        this.robot.visualX += (this.robot.c - this.robot.visualX) * lerpFactor;
        this.robot.visualY += (this.robot.r - this.robot.visualY) * lerpFactor;

        const curWorld = this.gridToWorld(this.robot.visualY, this.robot.visualX);
        this.robotGroup.position.x = curWorld.x;
        this.robotGroup.position.z = curWorld.z;

        // Smooth yaw rotation towards heading
        let dAngle = this.robot.targetAngle - this.robot.dirAngle;
        while (dAngle < -Math.PI) dAngle += Math.PI * 2;
        while (dAngle > Math.PI) dAngle -= Math.PI * 2;
        this.robot.dirAngle += dAngle * lerpFactor;
        this.robotGroup.rotation.y = -this.robot.dirAngle; // Negated for Three.js coord system

        // Spin wheels when moving
        if (this.robot.state === 'MOVING') {
            for (const wheel of this.wheels) {
                wheel.rotation.z += dt * (8 + this.speedLevel * 1.5);
            }
        }

        // Rotate LiDAR sensor dome continuously
        if (this.lidarGroup) {
            this.lidarGroup.rotation.y += dt * 5.0;
        }

        // Drop-in bounce animation for dynamic obstacles
        for (const [key, obsData] of this.obstacles) {
            if (obsData.currentY > obsData.targetY) {
                obsData.vy -= 22 * dt; // gravity
                obsData.currentY += obsData.vy * dt;
                if (obsData.currentY <= obsData.targetY) {
                    obsData.currentY = obsData.targetY;
                    obsData.vy = -obsData.vy * 0.35; // bounce
                    if (Math.abs(obsData.vy) < 0.5) obsData.vy = 0;
                }
                obsData.mesh.position.y = obsData.currentY;
            }
        }

        // Gentle floating animation for uncollected 3D packages
        const time = Date.now() * 0.003;
        for (const pkg of this.packages) {
            if (!pkg.collected && pkg.meshGroup) {
                pkg.meshGroup.position.y = 0.32 + Math.sin(time + pkg.id) * 0.06;
            }
        }

        // Fade out reroute ghost trail
        if (this.rerouteTrailTimer > 0) {
            this.rerouteTrailTimer--;
            if (this.rerouteTrailTimer === 0) {
                this.rerouteOldPath = [];
                this._update3DPathMesh();
            }
        }

        // Update Chase Cam if active
        if (this.currentCameraView === 'chase') {
            const chaseDist = 9.5;
            const chaseHeight = 6.5;
            const camX = curWorld.x - Math.cos(this.robot.dirAngle) * chaseDist;
            const camZ = curWorld.z - Math.sin(this.robot.dirAngle) * chaseDist;
            this.camera.position.lerp(new THREE.Vector3(camX, chaseHeight, camZ), 0.1);
            this.controls.target.lerp(new THREE.Vector3(curWorld.x, 0.8, curWorld.z), 0.1);
        }
    }

    _executeRobotStep() {
        if (this.currentPath.length === 0) {
            this._handleArrivalAtTarget();
            return;
        }

        const nextCell = this.currentPath[0];

        // Obstacle blockage check
        if (this.obstacles.has(`${nextCell.r},${nextCell.c}`) || this.shelves[nextCell.r][nextCell.c]) {
            this._handleDynamicReroute(nextCell.r, nextCell.c);
            return;
        }

        this.currentPath.shift();

        const dr = nextCell.r - this.robot.r;
        const dc = nextCell.c - this.robot.c;
        if (dr !== 0 || dc !== 0) {
            this.robot.targetAngle = Math.atan2(dr, dc);
        }

        this.robot.r = nextCell.r;
        this.robot.c = nextCell.c;
        this.stats.cellsTraversed++;

        this._update3DPathMesh();

        if (this.robot.r === this.currentTarget.r && this.robot.c === this.currentTarget.c) {
            this._handleArrivalAtTarget();
        }

        this.updateStatsUI();
    }

    _handleArrivalAtTarget() {
        if (this.currentTarget.isDispatch) {
            this.robot.state = 'COMPLETED';
            this.stats.status = 'Completed';
            this.robot.carrying = null;
            if (this.robotCargoMesh) this.robotCargoMesh.visible = false;
            this.robotRingMat.color.setHex(0x3fb950);

            this.showOverlayMsg(`🎉 Mission Complete! All Packages Dispatched`, 'msg-green');
            this.updateAIStatus('COMPLETE', `<strong>Mission Completed!</strong> All ${this.stats.collectedCount} packages picked up, obstacles avoided in real time, and docked at Dispatch Bay.`);

            if (this.timerIntervalId) {
                clearInterval(this.timerIntervalId);
                this.timerIntervalId = null;
            }
        } else {
            const pkg = this.packages.find(p => p.id === this.currentTarget.id);
            if (pkg) {
                pkg.collected = true;
                this.stats.collectedCount++;
                this.robot.carrying = pkg.id;

                // Animate parcel disappearing into AGV cargo bay
                if (pkg.meshGroup) {
                    this.packagesGroup.remove(pkg.meshGroup);
                }
                if (this.robotCargoMesh) {
                    this.robotCargoMesh.visible = true;
                }

                this.updateAIStatus('COLLECTED', `<strong>Package #${pkg.id} picked up!</strong> [${this.stats.collectedCount}/${this.stats.totalPackages}]. Cargo bed loaded. Computing next path...`);
            }

            this._planNextLeg();
        }

        this._updateUIStateButtons();
        this.updateStatsUI();
    }

    /* ────────────────────────────────────────────────────────────────────────
     * 10. RENDERING LOOP & 3D INTERACTION
     * ──────────────────────────────────────────────────────────────────────── */
    _animate(timestamp) {
        if (!this.lastFrameTime) this.lastFrameTime = timestamp;
        const dt = Math.min(0.1, (timestamp - this.lastFrameTime) / 1000);
        this.lastFrameTime = timestamp;

        this._updateSimulation(dt);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame(this._animate);
    }

    _initRaycasting() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.floorMesh);

            if (intersects.length > 0) {
                const hit = intersects[0].point;
                const { r, c } = this.worldToGrid(hit.x, hit.z);

                if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
                    this.addObstacle(r, c, false);
                }
            }
        });
    }

    /* ────────────────────────────────────────────────────────────────────────
     * 11. UI UPDATES & EVENT LISTENERS
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

    updateAIStatus(mode, htmlDescription) {
        if (this.aiModeLabel) this.aiModeLabel.textContent = mode;
        if (this.explanation) this.explanation.innerHTML = htmlDescription;

        // Dynamic pulse dot color
        if (this.aiPulseDot) {
            if (mode === 'BLOCKED') this.aiPulseDot.style.background = '#f85149';
            else if (mode === 'REPLANNING' || mode === 'HAZARD') this.aiPulseDot.style.background = '#ea580c';
            else if (mode === 'COMPLETE') this.aiPulseDot.style.background = '#3fb950';
            else this.aiPulseDot.style.background = '#58a6ff';
        }
    }

    _initControls() {
        // Simulation buttons
        document.getElementById('btn-start').addEventListener('click', () => this.start());
        document.getElementById('btn-pause').addEventListener('click', () => this.pause());
        document.getElementById('btn-resume').addEventListener('click', () => this.resume());
        document.getElementById('btn-reset').addEventListener('click', () => this.reset());
        document.getElementById('btn-step').addEventListener('click', () => this.step());
        document.getElementById('btn-trigger').addEventListener('click', () => this.triggerObstacleAhead());

        // Camera view buttons
        document.getElementById('btn-cam-iso').addEventListener('click', () => this._setCameraPosition('iso'));
        document.getElementById('btn-cam-top').addEventListener('click', () => this._setCameraPosition('top'));
        document.getElementById('btn-cam-chase').addEventListener('click', () => this._setCameraPosition('chase'));
        document.getElementById('btn-cam-reset').addEventListener('click', () => this._setCameraPosition('iso'));

        // Scenario Selector
        document.getElementById('btn-load-scenario').addEventListener('click', () => {
            const sc = document.getElementById('select-scenario').value;
            this.loadScenario(sc);
        });

        document.getElementById('select-scenario').addEventListener('change', (e) => {
            this.loadScenario(e.target.value);
        });

        // Strategy Selector
        document.getElementById('select-strategy').addEventListener('change', (e) => {
            this.strategy = e.target.value;
            this.updateAIStatus('UPDATE', `Strategy changed to: ${e.target.value === 'nearest' ? 'Nearest Package' : 'Fixed Order'}.`);
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
            this._update3DSearchViz();
        });

        document.getElementById('chk-auto-obs').addEventListener('change', (e) => {
            this.autoObstacles = e.target.checked;
            this.updateAIStatus('CONFIG', `Auto obstacle generator ${this.autoObstacles ? 'enabled' : 'disabled'}.`);
        });

        document.getElementById('chk-edit-obs').addEventListener('change', (e) => {
            this.editObstacleMode = e.target.checked;
        });
    }
}

// Initialize 3D Simulation on DOM ready
window.addEventListener('DOMContentLoaded', () => {
    window.simulation = new Warehouse3DSimulation();
});
