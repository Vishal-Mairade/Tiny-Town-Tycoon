// --- 1. MEMORY CACHE REGISTRIES ---
const GeometryCache = {
    _cache: {},
    getBox(w, h, d) {
        const key = `box_${w}_${h}_${d}`;
        if (!this._cache[key]) this._cache[key] = new THREE.BoxGeometry(w, h, d);
        return this._cache[key];
    },
    getCylinder(rTop, rBottom, height, segments) {
        const key = `cyl_${rTop}_${rBottom}_${height}_${segments}`;
        if (!this._cache[key]) this._cache[key] = new THREE.CylinderGeometry(rTop, rBottom, height, segments);
        return this._cache[key];
    },
    getCone(radius, height, segments) {
        const key = `cone_${radius}_${height}_${segments}`;
        if (!this._cache[key]) this._cache[key] = new THREE.ConeGeometry(radius, height, segments);
        return this._cache[key];
    },
    getSphere(radius, wSeg, hSeg) {
        const key = `sphere_${radius}_${wSeg}_${hSeg}`;
        if (!this._cache[key]) this._cache[key] = new THREE.SphereGeometry(radius, wSeg, hSeg);
        return this._cache[key];
    },
    getPlane(w, h) {
        const key = `plane_${w}_${h}`;
        if (!this._cache[key]) this._cache[key] = new THREE.PlaneGeometry(w, h);
        return this._cache[key];
    },
    getRing(inner, outer, segments) {
        const key = `ring_${inner}_${outer}_${segments}`;
        if (!this._cache[key]) this._cache[key] = new THREE.RingGeometry(inner, outer, segments);
        return this._cache[key];
    },
    getEdges(geomKey, sourceGeom) {
        const key = `edges_${geomKey}`;
        if (!this._cache[key]) this._cache[key] = new THREE.EdgesGeometry(sourceGeom);
        return this._cache[key];
    },
    clear() {
        Object.values(this._cache).forEach(g => g.dispose());
        this._cache = {};
    }
};

const MaterialCache = {
    _cache: {},
    getStandard(color, options = {}) {
        const roughness = options.roughness ?? 0.5;
        const metalness = options.metalness ?? 0;
        const emissive = options.emissive ?? 0;
        const emissiveIntensity = options.emissiveIntensity ?? 0;
        const transparent = options.transparent ?? false;
        const opacity = options.opacity ?? 1.0;
        const side = options.side ?? THREE.FrontSide;

        const key = `std_${color}_${roughness}_${metalness}_${emissive}_${emissiveIntensity}_${transparent}_${opacity}_${side}`;
        if (!this._cache[key]) {
            this._cache[key] = new THREE.MeshStandardMaterial({
                color, roughness, metalness, emissive, emissiveIntensity, transparent, opacity, side
            });
        }
        return this._cache[key];
    },
    getBasic(color, options = {}) {
        const transparent = options.transparent ?? false;
        const opacity = options.opacity ?? 1.0;
        const key = `basic_${color}_${transparent}_${opacity}`;
        if (!this._cache[key]) {
            this._cache[key] = new THREE.MeshBasicMaterial({ color, transparent, opacity });
        }
        return this._cache[key];
    },
    getLineBasic(color, options = {}) {
        const linewidth = options.linewidth ?? 1;
        const key = `line_${color}_${linewidth}`;
        if (!this._cache[key]) {
            this._cache[key] = new THREE.LineBasicMaterial({ color, linewidth });
        }
        return this._cache[key];
    },
    clear() {
        Object.values(this._cache).forEach(m => m.dispose());
        this._cache = {};
    }
};

// --- 2. GAME DATA CONFIGS ---
const GRID_SIZE = 16;
const TILE_SIZE = 3;
const WORLD_OFFSET = -(GRID_SIZE * TILE_SIZE) / 2;

const TILES = {
    EMPTY: 0,
    ROAD: 1,
    BUILDING: 2,
    TOWN_HALL: 3,
    GRASS: 4,
    WATER: 5,
    DIRT: 6
};

const BUILDING_TYPES = {
    HOUSE: { name: "Residential House", key: "house", cost: 150, pop: 10, revenue: 3, pollution: 0, happiness: 5, unlockLevel: 1, desc: "Charming houses with smoking chimneys.", color: 0xe07a5f },
    CAFE: { name: "Cozy Café", key: "cafe", cost: 100, pop: 0, revenue: 5, pollution: 1, happiness: 8, unlockLevel: 1, desc: "A cozy spot serving fresh coffee and pastries.", color: 0x9c6644 },
    SHOP: { name: "Corner Market", key: "shop", cost: 300, pop: 0, revenue: 12, pollution: 2, happiness: 10, unlockLevel: 1, desc: "Generates taxes with stylized shop windows.", color: 0x3d5a80 },
    SUPERMARKET: { name: "Supermarket", key: "supermarket", cost: 500, pop: 0, revenue: 28, pollution: 5, happiness: 15, unlockLevel: 3, desc: "Groceries and items for local citizen blocks.", color: 0x1d3557 },
    FACTORY: { name: "Industrial Plant", key: "factory", cost: 600, pop: 0, revenue: 35, pollution: 25, happiness: -15, unlockLevel: 2, desc: "Vast metallic containers emitting factory steam.", color: 0x4f5d75 },
    PARK: { name: "Central Park", key: "park", cost: 400, pop: 0, revenue: 0, pollution: -20, happiness: 30, unlockLevel: 2, desc: "A garden pond flanked by blossoming trees.", color: 0x2a9d8f },
    SCHOOL: { name: "Community School", key: "school", cost: 800, pop: 0, revenue: 5, pollution: -5, happiness: 25, unlockLevel: 3, desc: "Educates your citizen base, driving high happiness rates.", color: 0xf4a261 },
    HOSPITAL: { name: "City Medical", key: "hospital", cost: 1200, pop: 0, revenue: 10, pollution: 0, happiness: 40, unlockLevel: 3, desc: "Emergency medical hub with a custom roof helipad.", color: 0xe63946 },
    APARTMENT: { name: "Modern Apartment", key: "apartment", cost: 1800, pop: 45, revenue: 8, pollution: 5, happiness: 15, unlockLevel: 4, desc: "Multi-tiered skyscraper housing with glass panels.", color: 0x8338ec },
    OFFICE: { name: "Business Tower", key: "office", cost: 2500, pop: 0, revenue: 90, pollution: 15, happiness: 20, unlockLevel: 4, desc: "Spectacular steel skyscrapers with helipads.", color: 0x00b4d8 },
    MEGAMALL: { name: "Mega Mall", key: "megamall", cost: 3500, pop: 0, revenue: 180, pollution: 20, happiness: 25, unlockLevel: 5, desc: "Huge shopping plaza with rotating skylights.", color: 0x4a4e69 },
    LANDMARK: { name: "Golden Obelisk", key: "landmark", cost: 6000, pop: 0, revenue: 120, pollution: -50, happiness: 80, unlockLevel: 5, desc: "Spiritual spire surrounded by rotating energy rings.", color: 0xffb703 },
    POLICE: { name: "Police Station", key: "police", cost: 700, pop: 0, revenue: 10, pollution: -2, happiness: 20, unlockLevel: 2, desc: "Maintains local security. Features flashing sirens.", color: 0x1d4ed8 },
    FIRE: { name: "Fire Station", key: "fire", cost: 700, pop: 0, revenue: 10, pollution: -1, happiness: 20, unlockLevel: 2, desc: "Protects against fire hazards.", color: 0xb91c1c },
    WIND: { name: "Wind Turbine", key: "wind", cost: 900, pop: 0, revenue: 18, pollution: -10, happiness: 10, unlockLevel: 3, desc: "Clean wind power generation with rotating blades.", color: 0xe2e8f0 },
    SOLAR: { name: "Solar Farm", key: "solar", cost: 1000, pop: 0, revenue: 22, pollution: -12, happiness: 12, unlockLevel: 3, desc: "Photovoltaic grid providing renewable energy.", color: 0x1e40af },
    STADIUM: { name: "Sports Arena", key: "stadium", cost: 2400, pop: 0, revenue: 50, pollution: 5, happiness: 50, unlockLevel: 4, desc: "Large athletic arena driving immense local happiness.", color: 0x059669 },
    AIRPORT: { name: "Regional Airport", key: "airport", cost: 4500, pop: 0, revenue: 150, pollution: 35, happiness: 15, unlockLevel: 5, desc: "Transportation runway terminal promoting high tax yields.", color: 0x64748b }
};

const TIERS = [
    { level: 1, minXp: 0, maxXp: 150, name: "Village", maxGrid: 8 },
    { level: 2, minXp: 150, maxXp: 450, name: "Town", maxGrid: 10 },
    { level: 3, minXp: 450, maxXp: 1000, name: "Small City", maxGrid: 12 },
    { level: 4, minXp: 1000, maxXp: 2500, name: "Big City", maxGrid: 14 },
    { level: 5, minXp: 2500, maxXp: 999999, name: "Mega City", maxGrid: 16 }
];

const BADGES_LIST = {
    founding: { name: "Founding Father", desc: "Constructed your very first building", earned: false },
    road_warrior: { name: "Road Builder", desc: "Connected 12 tiles of functional roads", earned: false },
    capitalist: { name: "Thriving Treasury", desc: "Accumulated more than 5,000 Coins", earned: false },
    green: { name: "Green Utopia", desc: "Maintained 0% pollution with beautiful parks", earned: false },
    metropolis: { name: "Mega-Architect", desc: "Reached City Level 4", earned: false }
};

const MISSION_POOL = [
    { id: "m1", text: "Build 3 Residential Houses", check: (s) => s.countBuildings('house') >= 3, reward: 200, xp: 50, done: false },
    { id: "m2", text: "Place 8 connected Roads", check: (s) => s.countConnectedRoads() >= 8, reward: 150, xp: 30, done: false },
    { id: "m3", text: "Reach a population of 30", check: (s) => s.state.population >= 30, reward: 300, xp: 70, done: false },
    { id: "m4", text: "Construct a Cozy Café", check: (s) => s.countBuildings('cafe') >= 1, reward: 120, xp: 40, done: false },
    { id: "m5", text: "Maintain 90% Happiness", check: (s) => s.state.happiness >= 90 && s.countBuildings() >= 6, reward: 300, xp: 60, done: false },
    { id: "m6", text: "Build 1 Central Park", check: (s) => s.countBuildings('park') >= 1, reward: 400, xp: 100, done: false },
    { id: "m7", text: "Reach Level 3 Metropolis", check: (s) => s.state.level >= 3, reward: 1000, xp: 200, done: false },
    { id: "m8", text: "Construct 1 Supermarket", check: (s) => s.countBuildings('supermarket') >= 1, reward: 450, xp: 110, done: false },
    { id: "m9", text: "Build a Modern Apartment", check: (s) => s.countBuildings('apartment') >= 1, reward: 600, xp: 150, done: false },
    { id: "m10", text: "Reach a population of 100", check: (s) => s.state.population >= 100, reward: 1200, xp: 300, done: false }
];

// --- 3. RETRO AUDIO CONTROLLER ---
class AudioController {
    constructor() {
        this.audioCtx = null;
        this.isMuted = false;
    }
    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }
    playSound(type) {
        if (this.isMuted) return;
        this.init();
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;

        switch (type) {
            case 'click': {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.frequency.setValueAtTime(600, now);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            }
            case 'build': {
                const osc1 = this.audioCtx.createOscillator();
                const osc2 = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc1.frequency.setValueAtTime(150, now);
                osc1.frequency.exponentialRampToValueAtTime(350, now + 0.15);
                osc2.type = 'triangle';
                osc2.frequency.setValueAtTime(120, now);
                osc2.frequency.exponentialRampToValueAtTime(280, now + 0.2);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.25);
                osc2.stop(now + 0.25);
                break;
            }
            case 'coin': {
                const freqs = [523.25, 659.25, 783.99, 1046.50];
                freqs.forEach((freq, idx) => {
                    const osc = this.audioCtx.createOscillator();
                    const gain = this.audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioCtx.destination);
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.04);
                    gain.gain.setValueAtTime(0.04, now + idx * 0.04);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.2);
                    osc.start(now + idx * 0.04);
                    osc.stop(now + idx * 0.04 + 0.25);
                });
                break;
            }
            case 'level': {
                const levelFreqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
                levelFreqs.forEach((freq, idx) => {
                    const osc = this.audioCtx.createOscillator();
                    const gain = this.audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioCtx.destination);
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                    gain.gain.setValueAtTime(0.1, now + idx * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
                    osc.start(now + idx * 0.08);
                    osc.stop(now + idx * 0.08 + 0.5);
                });
                break;
            }
            case 'demolish': {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
                break;
            }
        }
    }
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (!this.isMuted) this.playSound('click');
        return this.isMuted;
    }
}

// --- 4. SIMULATION MANAGER ---
class CitySimulation {
    constructor(game) {
        this.game = game;
        this.state = {
            cityName: "My Tiny Town",
            level: 1,
            xp: 0,
            coins: 400,
            population: 0,
            happiness: 100,
            pollution: 0,
            gameStarted: false,
            grid: Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null).map(() => ({
                tileType: TILES.EMPTY,
                buildingType: null,
                level: 1,
                connected: false,
                terrain: 'grass',
                decoration: null
            }))),
            timeOfDay: 12.0,
            weather: 'sunny',
            weatherTimer: 30,
            missions: [],
            badges: JSON.parse(JSON.stringify(BADGES_LIST)),
            coinGenRate: 0,
            populationCap: 10,
            tutorialStep: 0,
            aiQuest: {
                active: false,
                headline: "Pigeon Demands",
                targetBuilding: "shop",
                story: "The local pigeons are protesting. They demand a corner shop immediately or they will start tagging the Town Hall columns.",
                rewardCoins: 300,
                rewardXp: 100,
                startCount: 0,
                completed: false
            },
            currentNewspaper: {
                title: "TINY TOWN DISPATCH",
                headline1: "Local Squirrel Declarations",
                story1: "Squirrel population votes 99% in favor of municipal parks.",
                headline2: "Asphalt Boom",
                story2: "Mayor constructs roadways, paving the path to glory.",
                headline3: "Tax Season Approaching",
                story3: "Residential block anticipates friendly tax collectors."
            }
        };
    }

    getCurrentGridLimit() {
        const currentTier = TIERS.find(t => t.level === this.state.level) || TIERS[0];
        return currentTier.maxGrid;
    }

    isInsideGridLimits(x, z) {
        const limit = this.getCurrentGridLimit();
        const minCoord = Math.floor((GRID_SIZE - limit) / 2);
        const maxCoord = minCoord + limit;
        return x >= minCoord && x < maxCoord && z >= minCoord && z < maxCoord;
    }

    countBuildings(type = null) {
        let count = 0;
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let z = 0; z < GRID_SIZE; z++) {
                const tile = this.state.grid[x][z];
                if (tile.tileType === TILES.BUILDING) {
                    if (!type || tile.buildingType === type) count++;
                }
            }
        }
        return count;
    }

    countConnectedRoads() {
        let count = 0;
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let z = 0; z < GRID_SIZE; z++) {
                const tile = this.state.grid[x][z];
                if (tile.tileType === TILES.ROAD && tile.connected) count++;
            }
        }
        return count;
    }

    createStarterVillage() {
        const cx = 8;
        const cz = 8;

        for (let x = 0; x < GRID_SIZE; x++) {
            for (let z = 0; z < GRID_SIZE; z++) {
                this.state.grid[x][z] = {
                    tileType: TILES.EMPTY,
                    buildingType: null,
                    level: 1,
                    connected: false,
                    terrain: 'grass',
                    decoration: null
                };
            }
        }

        this.procedurallyGenerateLandscape();

        this.state.grid[cx][cz] = { tileType: TILES.TOWN_HALL, buildingType: 'town_hall', level: 1, connected: true, terrain: 'grass' };
        this.state.grid[cx][cz + 1] = { tileType: TILES.ROAD, buildingType: 'road', level: 1, connected: true, terrain: 'grass' };
        this.state.grid[cx + 1][cz + 1] = { tileType: TILES.ROAD, buildingType: 'road', level: 1, connected: true, terrain: 'grass' };
        this.state.grid[cx - 1][cz + 1] = { tileType: TILES.ROAD, buildingType: 'road', level: 1, connected: true, terrain: 'grass' };

        this.state.grid[cx - 1][cz] = { tileType: TILES.BUILDING, buildingType: 'house', level: 1, connected: true, terrain: 'grass' };
        this.state.grid[cx + 1][cz] = { tileType: TILES.BUILDING, buildingType: 'house', level: 1, connected: true, terrain: 'grass' };
        this.state.grid[cx][cz + 2] = { tileType: TILES.BUILDING, buildingType: 'house', level: 1, connected: true, terrain: 'grass' };

        this.state.missions = [
            { id: "m1", text: "Build 3 Residential Houses", reward: 200, xp: 50, done: false },
            { id: "m2", text: "Place 8 connected Roads", reward: 150, xp: 30, done: false },
            { id: "m3", text: "Reach a population of 30", reward: 300, xp: 70, done: false }
        ];
        this.state.badges = JSON.parse(JSON.stringify(BADGES_LIST));

        this.state.coins = 600;
        this.state.xp = 0;
        this.state.level = 1;
        this.state.cityName = "My Tiny Town";
        this.state.tutorialStep = 0;

        this.evaluateConnectivity();
        this.recalculateCityStats();
        this.saveGame();
        if (this.game.engine) this.game.engine.rebuildCityVisuals();
    }

    procedurallyGenerateLandscape() {
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let z = 0; z < GRID_SIZE; z++) {
                if ((x + z === 12 || x + z === 11) && x < 14 && z < 14) {
                    this.state.grid[x][z].terrain = 'water';
                }
            }
        }

        for (let x = 0; x < GRID_SIZE; x++) {
            for (let z = 0; z < GRID_SIZE; z++) {
                if (Math.hypot(x - 2, z - 2) < 2.0) {
                    this.state.grid[x][z].terrain = 'water';
                }
            }
        }

        for (let x = 0; x < GRID_SIZE; x++) {
            for (let z = 0; z < GRID_SIZE; z++) {
                if (Math.hypot(x - 13, z - 13) < 2.5 && this.state.grid[x][z].terrain !== 'water') {
                    this.state.grid[x][z].terrain = 'dirt';
                }
            }
        }

        for (let x = 0; x < GRID_SIZE; x++) {
            for (let z = 0; z < GRID_SIZE; z++) {
                const cell = this.state.grid[x][z];
                if (Math.hypot(x - 8, z - 8) < 3.2) continue;
                if (cell.terrain === 'water') continue;

                const roll = Math.random();
                if (cell.terrain === 'grass') {
                    if (roll < 0.12) {
                        cell.decoration = 'tree_pine';
                    } else if (roll < 0.22) {
                        cell.decoration = 'tree_oak';
                    } else if (roll < 0.25) {
                        cell.decoration = 'rock';
                    } else if (roll < 0.28) {
                        cell.decoration = 'flower';
                    }
                } else if (cell.terrain === 'dirt') {
                    if (roll < 0.20) {
                        cell.decoration = 'rock';
                    } else if (roll < 0.35) {
                        cell.decoration = 'tree_pine';
                    }
                }
            }
        }
    }

    evaluateConnectivity() {
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let z = 0; z < GRID_SIZE; z++) {
                this.state.grid[x][z].connected = false;
            }
        }

        const queue = [];
        const visited = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));

        let thX = -1, thZ = -1;
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let z = 0; z < GRID_SIZE; z++) {
                if (this.state.grid[x][z].tileType === TILES.TOWN_HALL) {
                    thX = x; thZ = z; break;
                }
            }
        }

        if (thX !== -1 && thZ !== -1) {
            this.state.grid[thX][thZ].connected = true;
            queue.push({ x: thX, z: thZ });
            visited[thX][thZ] = true;
        }

        const directions = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];
        while (queue.length > 0) {
            const curr = queue.shift();
            for (const d of directions) {
                const nx = curr.x + d.x;
                const nz = curr.z + d.z;
                if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE) {
                    if (!visited[nx][nz]) {
                        const tile = this.state.grid[nx][nz];
                        if (tile.tileType === TILES.ROAD) {
                            tile.connected = true;
                            visited[nx][nz] = true;
                            queue.push({ x: nx, z: nz });
                        }
                    }
                }
            }
        }

        let hasUnconnectedBuildings = false;
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let z = 0; z < GRID_SIZE; z++) {
                const tile = this.state.grid[x][z];
                if (tile.tileType === TILES.BUILDING) {
                    let isAdjToRoad = false;
                    for (const d of directions) {
                        const nx = x + d.x;
                        const nz = z + d.z;
                        if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE) {
                            const adj = this.state.grid[nx][nz];
                            if ((adj.tileType === TILES.ROAD || adj.tileType === TILES.TOWN_HALL) && adj.connected) {
                                isAdjToRoad = true;
                                break;
                            }
                        }
                    }
                    tile.connected = isAdjToRoad;
                    if (!isAdjToRoad) hasUnconnectedBuildings = true;
                }
            }
        }
        if (this.game.ui) this.game.ui.showConnectivityWarning(hasUnconnectedBuildings);
    }

    recalculateCityStats() {
        let totalPop = 0;
        let totalPopCap = 10;
        let happinessScore = 100;
        let totalPollution = 0;

        for (let x = 0; x < GRID_SIZE; x++) {
            for (let z = 0; z < GRID_SIZE; z++) {
                const tile = this.state.grid[x][z];
                if (tile.tileType === TILES.BUILDING) {
                    const bInfo = BUILDING_TYPES[tile.buildingType.toUpperCase()];
                    if (!bInfo) continue;
                    const mult = tile.level;

                    if (tile.buildingType === 'house' || tile.buildingType === 'apartment') {
                        totalPopCap += (bInfo.pop * mult);
                        if (tile.connected) totalPop += (bInfo.pop * mult);
                    }
                    if (tile.connected) {
                        totalPollution += (bInfo.pollution * mult);
                        happinessScore += (bInfo.happiness * mult);
                    }
                }
            }
        }

        this.state.pollution = Math.max(0, Math.min(totalPollution, 100));
        happinessScore -= (this.state.pollution * 0.5);
        this.state.happiness = Math.max(0, Math.min(Math.floor(happinessScore), 100));
        this.state.population = Math.min(totalPop, totalPopCap);
        this.state.populationCap = totalPopCap;

        if (this.game.ui) this.game.ui.updateHUD();
    }

    addXP(amount) {
        this.state.xp += Math.floor(amount);
        let currentTier = TIERS.find(t => t.level === this.state.level) || TIERS[0];

        if (this.state.xp >= currentTier.maxXp) {
            this.state.level += 1;
            this.game.audio.playSound('level');
            if (this.game.ui) this.game.ui.showLevelUpModal(this.state.level);
            if (this.game.engine) this.game.engine.rebuildCityVisuals();
        }
        if (this.game.ui) this.game.ui.updateHUD();
    }

    saveGame() {
        const data = {
            cityName: this.state.cityName,
            level: this.state.level,
            xp: this.state.xp,
            coins: this.state.coins,
            grid: this.state.grid,
            missions: this.state.missions,
            badges: this.state.badges,
            tutorialStep: this.state.tutorialStep,
            aiQuest: this.state.aiQuest,
            currentNewspaper: this.state.currentNewspaper
        };
        localStorage.setItem('tiny_town_tycoon_save', JSON.stringify(data));
    }

    loadGame() {
        const raw = localStorage.getItem('tiny_town_tycoon_save');
        if (raw) {
            try {
                const data = JSON.parse(raw);
                this.state.cityName = data.cityName || "My Tiny Town";
                this.state.level = data.level || 1;
                this.state.xp = data.xp || 0;
                this.state.coins = data.coins || 0;
                this.state.grid = data.grid;
                
                // Backwards compatibility default values for terrain and decorations
                for (let x = 0; x < GRID_SIZE; x++) {
                    for (let z = 0; z < GRID_SIZE; z++) {
                        if (this.state.grid[x][z]) {
                            if (!this.state.grid[x][z].terrain) this.state.grid[x][z].terrain = 'grass';
                            if (this.state.grid[x][z].decoration === undefined) this.state.grid[x][z].decoration = null;
                        }
                    }
                }

                this.state.missions = data.missions || [];

                this.state.badges = {};
                Object.keys(BADGES_LIST).forEach(k => {
                    this.state.badges[k] = {
                        ...JSON.parse(JSON.stringify(BADGES_LIST[k])),
                        ...(data.badges && data.badges[k] ? data.badges[k] : {})
                    };
                });

                this.state.tutorialStep = data.tutorialStep !== undefined ? data.tutorialStep : -1;
                this.state.aiQuest = data.aiQuest || this.state.aiQuest;
                this.state.currentNewspaper = data.currentNewspaper || this.state.currentNewspaper;

                if (this.game.ui) {
                    this.game.ui.setCityNameInputValue(this.state.cityName);
                    this.game.ui.showContinueButton();
                }
                return true;
            } catch (e) {
                console.error("Save load failed, starting fresh", e);
            }
        }
        return false;
    }

    clearSave() {
        localStorage.removeItem('tiny_town_tycoon_save');
        this.createStarterVillage();
        if (this.game.ui) {
            this.game.ui.showToast("Progress reset successfully!", "success");
            this.game.ui.closeModal();
            this.game.ui.updateHUD();
        }
        this.saveGame();
    }

    async fetchGeminiAPI(prompt, systemInstruction, isJson = false, schema = null) {
        const key = localStorage.getItem('gemini_api_key');
        const proxyUrl = localStorage.getItem('gemini_api_proxy');

        if (!key && !proxyUrl) {
            return this.generateMockAiResponse(prompt, isJson);
        }

        let url = proxyUrl ? proxyUrl : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] }
        };

        if (isJson && schema) {
            payload.generationConfig = {
                responseMimeType: "application/json",
                responseSchema: schema
            };
        }

        let delay = 1000;
        for (let i = 0; i < 4; i++) {
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) throw new Error(`Gemini status: ${response.status}`);
                const result = await response.json();
                const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) return text;
                throw new Error("No responses candidates.");
            } catch (err) {
                if (i === 3) throw err;
                await new Promise(r => setTimeout(r, delay));
                delay *= 2;
            }
        }
    }

    generateMockAiResponse(prompt, isJson) {
        if (isJson) {
            if (prompt.includes('newspaper')) {
                return JSON.stringify({
                    title: "TINY DISPATCH (MOCK)",
                    headline1: "Gemini Key Missing",
                    story1: "The mayor hasn't configured the API. Visit settings to link your Gemini key!",
                    headline2: "Commercial Sector Booming",
                    story2: "New coffee shop structures report extremely high customer volumes.",
                    headline3: "Pigeon Protests",
                    story3: "Local pigeons demand more Central Parks to nesting safely."
                });
            } else {
                return JSON.stringify({
                    buildingKey: "cafe",
                    headline: "Caffeine Protests",
                    story: "Citizens are falling asleep at work. Construct a cozy cafe immediately to boost public productivity!",
                    rewardCoins: 200,
                    rewardXp: 80
                });
            }
        } else {
            if (prompt.includes('economy')) return "Mayor, build coffee shops and corner markets near residences. Connecting roads to Town Hall will multiply taxes.";
            if (prompt.includes('rumor')) return "Local whisper says that building a Golden Obelisk at level 5 will radiate energy across Town Hall.";
            return "Provide connected pathways to keep transport moving smoothly. Setup Gemini API keys for strategic audits!";
        }
    }

    async runDailyNewspaperGenerator() {
        if (this.state.coins < 100) {
            if (this.game.ui) this.game.ui.showToast("Need 100 coins for printing press!", "coins");
            return;
        }

        this.state.coins -= 100;
        if (this.game.ui) {
            this.game.ui.updateHUD();
            this.game.ui.showNewspaperLoading();
        }
        this.game.audio.playSound('click');

        const countsStr = Object.keys(BUILDING_TYPES)
            .map(k => `${BUILDING_TYPES[k].name}: ${this.countBuildings(k.toLowerCase())}`).join(', ');

        const prompt = `Write a quirky daily newspaper for our small town. Context: City: ${this.state.cityName}, Level: ${this.state.level}, Coins: ${this.state.coins}, Pop: ${this.state.population}, Happiness: ${this.state.happiness}%, Pollution: ${this.state.pollution}%. Layout: ${countsStrLayout = countsStr}.`;
        const sysInstruction = "You are the chief editor of 'Tiny Town Dispatch'. Write a brief, funny daily news dispatch matching current town status. Output as JSON following the schema.";
        const schema = {
            type: "OBJECT",
            properties: {
                title: { type: "STRING" },
                headline1: { type: "STRING" },
                story1: { type: "STRING" },
                headline2: { type: "STRING" },
                story2: { type: "STRING" },
                headline3: { type: "STRING" },
                story3: { type: "STRING" }
            },
            required: ["title", "headline1", "story1", "headline2", "story2", "headline3", "story3"]
        };

        try {
            const responseText = await this.fetchGeminiAPI(prompt, sysInstruction, true, schema);
            this.state.currentNewspaper = JSON.parse(responseText);
            this.addXP(15);
            if (this.game.ui) {
                this.game.ui.showToast("✨ AI Newspaper printed! Earned +15 XP", "success");
                this.game.ui.renderNewspaperUI();
            }
            this.game.audio.playSound('coin');
            this.saveGame();
        } catch (e) {
            console.error(e);
            if (this.game.ui) {
                this.game.ui.showToast("Fail printing newspaper.", "error");
                this.game.ui.renderNewspaperUI();
            }
        }
    }

    async runStrategicAdvisor(topic) {
        this.game.audio.playSound('click');
        if (this.game.ui) this.game.ui.appendUserChatBubble(topic);
        const loadingId = this.game.ui ? this.game.ui.appendLoadingChatBubble("Sparky advisor is auditing blueprints...") : null;

        const prompt = `Player clicked strategic topic: "${topic}". City: "${this.state.cityName}", Level: ${this.state.level}, Pop: ${this.state.population}, Happy: ${this.state.happiness}%. Give helpful strategic planning feedback. 3 sentences max.`;
        const sysInstruction = "You are Sparky, the loyal AI Advisor. Speak with a helpful and witty city-planner persona. Limit answers strictly to 3 sentences.";

        try {
            const responseText = await this.fetchGeminiAPI(prompt, sysInstruction, false, null);
            if (this.game.ui) {
                this.game.ui.removeLoadingChatBubble(loadingId);
                this.game.ui.appendAiChatBubble(responseText);
            }
        } catch (e) {
            console.error(e);
            if (this.game.ui) {
                this.game.ui.removeLoadingChatBubble(loadingId);
                this.game.ui.appendAiChatBubble("Static lines. Ensure you linked Gemini key correctly.");
            }
        }
    }

    async runCustomStrategicAdvisor(question) {
        if (this.game.ui) this.game.ui.appendUserChatBubble(question);
        const loadingId = this.game.ui ? this.game.ui.appendLoadingChatBubble("Sparky is consulting blueprints...") : null;

        const prompt = `Custom strategic question: "${question}". Level: ${this.state.level}, Pop: ${this.state.population}, Coins: ${this.state.coins}. Answer game design queries. 3 sentences max.`;
        const sysInstruction = "You are Sparky, the AI Strategic Advisor. Speak with a warm strategic tone. 3 sentences max.";

        try {
            const responseText = await this.fetchGeminiAPI(prompt, sysInstruction, false, null);
            if (this.game.ui) {
                this.game.ui.removeLoadingChatBubble(loadingId);
                this.game.ui.appendAiChatBubble(responseText);
            }
        } catch (e) {
            console.error(e);
            if (this.game.ui) {
                this.game.ui.removeLoadingChatBubble(loadingId);
                this.game.ui.appendAiChatBubble("Connection issues. Link custom keys in settings!");
            }
        }
    }

    async runAiQuestGenerator() {
        this.game.audio.playSound('click');
        if (this.game.ui) {
            this.game.ui.showToast("Drafting scenario quest...", "info");
            this.game.ui.showQuestDrafting();
        }

        const prompt = `Generate a special city objective based on: Level: ${this.state.level}, Coins: ${this.state.coins}, Pop: ${this.state.population}. Pick ONE building key. Output as JSON matching schema.`;
        const sysInstruction = "Choose one building key (house, cafe, shop, supermarket, factory, park, school, hospital, apartment, office, megamall, landmark). Write a humorous situation detailing why citizens want it. Keep story short (2 sentences max). Output strictly as JSON.";
        const schema = {
            type: "OBJECT",
            properties: {
                buildingKey: { type: "STRING" },
                headline: { type: "STRING" },
                story: { type: "STRING" },
                rewardCoins: { type: "NUMBER" },
                rewardXp: { type: "NUMBER" }
            },
            required: ["buildingKey", "headline", "story", "rewardCoins", "rewardXp"]
        };

        try {
            const responseText = await this.fetchGeminiAPI(prompt, sysInstruction, true, schema);
            const data = JSON.parse(responseText);

            this.state.aiQuest = {
                active: true,
                headline: data.headline,
                targetBuilding: data.buildingKey.toLowerCase(),
                story: data.story,
                rewardCoins: Math.max(200, Math.min(data.rewardCoins, 1200)),
                rewardXp: Math.max(50, Math.min(data.rewardXp, 300)),
                startCount: this.countBuildings(data.buildingKey.toLowerCase()),
                completed: false
            };

            this.saveGame();
            if (this.game.ui) {
                this.game.ui.renderQuestUI();
                this.game.ui.showToast("✨ AI Quest Issued! Check the Quest tab.", "success");
            }
        } catch (e) {
            console.error(e);
            if (this.game.ui) {
                this.game.ui.showToast("Failed to formulate quest.", "error");
                this.game.ui.renderQuestUI();
            }
        }
    }

    checkMissionsProgress() {
        let updated = false;
        this.state.missions.forEach(mission => {
            if (!mission.done) {
                let passed = false;
                if (mission.id === "m1" && this.countBuildings('house') >= 3) passed = true;
                else if (mission.id === "m2" && this.countConnectedRoads() >= 8) passed = true;
                else if (mission.id === "m3" && this.state.population >= 30) passed = true;
                else if (mission.id === "m4" && this.countBuildings('cafe') >= 1) passed = true;
                else if (mission.id === "m5" && this.state.happiness >= 90 && this.countBuildings() >= 6) passed = true;
                else if (mission.id === "m6" && this.countBuildings('park') >= 1) passed = true;
                else if (mission.id === "m7" && this.state.level >= 3) passed = true;
                else if (mission.id === "m8" && this.countBuildings('supermarket') >= 1) passed = true;
                else if (mission.id === "m9" && this.countBuildings('apartment') >= 1) passed = true;
                else if (mission.id === "m10" && this.state.population >= 100) passed = true;

                if (passed) {
                    mission.done = true;
                    updated = true;
                    this.state.coins += mission.reward;
                    this.addXP(mission.xp);
                    if (this.game.ui) this.game.ui.showToast(`Mission Accomplished: "${mission.text}"!`, "success");
                    this.game.audio.playSound('level');

                    const completedIds = this.state.missions.map(m => m.id);
                    const nextPoolItem = MISSION_POOL.find(item => !completedIds.includes(item.id));
                    if (nextPoolItem) {
                        setTimeout(() => {
                            this.state.missions = this.state.missions.filter(m => m.id !== mission.id);
                            this.state.missions.push({
                                ...JSON.parse(JSON.stringify(nextPoolItem)),
                                check: nextPoolItem.check
                            });
                            if (this.game.ui) {
                                this.game.ui.showToast(`New Mission Available!`, "info");
                                this.game.ui.updateHUD();
                            }
                        }, 3000);
                    }
                }
            }
        });

        if (updated) {
            if (this.game.ui) this.game.ui.updateHUD();
            this.saveGame();
        }
    }

    checkBadgesProgress() {
        let updated = false;
        if (!this.state.badges.founding.earned && this.countBuildings() >= 1) {
            this.state.badges.founding.earned = true;
            if (this.game.ui) this.game.ui.showBadgeAwardedModal(this.state.badges.founding);
            updated = true;
        }
        if (!this.state.badges.road_warrior.earned && this.countConnectedRoads() >= 12) {
            this.state.badges.road_warrior.earned = true;
            if (this.game.ui) this.game.ui.showBadgeAwardedModal(this.state.badges.road_warrior);
            updated = true;
        }
        if (!this.state.badges.capitalist.earned && this.state.coins >= 5000) {
            this.state.badges.capitalist.earned = true;
            if (this.game.ui) this.game.ui.showBadgeAwardedModal(this.state.badges.capitalist);
            updated = true;
        }
        if (!this.state.badges.green.earned && this.state.pollution === 0 && this.countBuildings('park') >= 2) {
            this.state.badges.green.earned = true;
            if (this.game.ui) this.game.ui.showBadgeAwardedModal(this.state.badges.green);
            updated = true;
        }
        if (!this.state.badges.metropolis.earned && this.state.level >= 4) {
            this.state.badges.metropolis.earned = true;
            if (this.game.ui) this.game.ui.showBadgeAwardedModal(this.state.badges.metropolis);
            updated = true;
        }
        if (updated) this.saveGame();
    }

    checkAiQuestProgress() {
        if (!this.state.aiQuest || !this.state.aiQuest.active || this.state.aiQuest.completed) return;
        const target = this.state.aiQuest.targetBuilding;
        const currentCount = this.countBuildings(target);
        const targetCount = this.state.aiQuest.startCount + 1;

        if (currentCount >= targetCount) {
            this.state.aiQuest.completed = true;
            this.game.audio.playSound('level');
            this.saveGame();
            if (this.game.ui) {
                this.game.ui.renderQuestUI();
                this.game.ui.showQuestCompletedModal(this.state.aiQuest);
            }
        }
    }

    claimAiQuestReward() {
        if (!this.state.aiQuest || !this.state.aiQuest.completed) return;
        this.state.coins += this.state.aiQuest.rewardCoins;
        this.addXP(this.state.aiQuest.rewardXp);
        this.game.audio.playSound('coin');

        if (this.game.ui) {
            this.game.ui.showToast(`✨ Quest Claimed: +$${this.state.aiQuest.rewardCoins}, +${this.state.aiQuest.rewardXp} XP!`, "success");
        }
        this.state.aiQuest.active = false;
        this.state.aiQuest.completed = false;
        this.saveGame();
        if (this.game.ui) this.game.ui.renderQuestUI();
    }
}

// --- 5. VISUAL GRAPHICS RENDER ENGINE ---
class SmokeParticleSystem {
    constructor(scene, maxParticles = 300) {
        this.scene = scene;
        this.maxParticles = maxParticles;
        this.geometry = GeometryCache.getSphere(0.15, 5, 5);
        this.material = MaterialCache.getBasic(0xcccccc, { transparent: true, opacity: 0.5 });
        this.instancedMesh = new THREE.InstancedMesh(this.geometry, this.material, maxParticles);
        this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.instancedMesh);

        this.particles = [];
        this.dummy = new THREE.Object3D();

        for (let i = 0; i < maxParticles; i++) {
            this.dummy.position.set(0, -999, 0);
            this.dummy.scale.set(0, 0, 0);
            this.dummy.updateMatrix();
            this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
        }
        this.instancedMesh.instanceMatrix.needsUpdate = true;
    }
    spawn(x, y, z) {
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift();
        }
        this.particles.push({
            x: x + (Math.random() - 0.5) * 0.1,
            y,
            z: z + (Math.random() - 0.5) * 0.1,
            vx: (Math.random() - 0.5) * 0.012,
            vy: 0.025 + Math.random() * 0.015,
            vz: (Math.random() - 0.5) * 0.012,
            age: 0,
            maxAge: 1.5 + Math.random() * 1.0,
            scale: 0.7 + Math.random() * 0.4
        });
    }
    update(delta) {
        for (let i = 0; i < this.maxParticles; i++) {
            if (i < this.particles.length) {
                const p = this.particles[i];
                p.age += delta;
                if (p.age >= p.maxAge) {
                    this.particles.splice(i, 1);
                    i--;
                    continue;
                }
                p.x += p.vx * (delta / 0.016);
                p.y += p.vy * (delta / 0.016);
                p.z += p.vz * (delta / 0.016);

                const ratio = p.age / p.maxAge;
                const currentScale = p.scale * (1.0 - ratio) * Math.pow(0.97, p.age / 0.016);
                this.dummy.position.set(p.x, p.y, p.z);
                this.dummy.scale.set(currentScale, currentScale, currentScale);
                this.dummy.updateMatrix();
                this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
            } else {
                this.dummy.position.set(0, -999, 0);
                this.dummy.scale.set(0, 0, 0);
                this.dummy.updateMatrix();
                this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
            }
        }
        this.instancedMesh.instanceMatrix.needsUpdate = true;
    }
}

class WeatherSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.group = new THREE.Group();
        this.scene.add(this.group);

        const rainMat = MaterialCache.getBasic(0x38bdf8, { transparent: true, opacity: 0.6 });
        const snowMat = MaterialCache.getBasic(0xffffff, { transparent: true, opacity: 0.9 });

        const rainGeom = GeometryCache.getBox(0.03, 0.45, 0.03);
        const snowGeom = GeometryCache.getSphere(0.08, 4, 4);

        for (let i = 0; i < 200; i++) {
            const rainDrop = new THREE.Mesh(rainGeom, rainMat);
            const snowFlake = new THREE.Mesh(snowGeom, snowMat);

            const rx = (Math.random() - 0.5) * 50;
            const ry = Math.random() * 25;
            const rz = (Math.random() - 0.5) * 50;

            rainDrop.position.set(rx, ry, rz);
            snowFlake.position.set(rx, ry, rz);

            this.group.add(rainDrop);
            this.group.add(snowFlake);

            this.particles.push({
                rain: rainDrop,
                snow: snowFlake,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: 10 + Math.random() * 5,
                speedZ: (Math.random() - 0.5) * 0.5
            });
        }
    }

    update(delta, weatherType) {
        this.particles.forEach(p => {
            if (weatherType === 'rain') {
                p.rain.visible = true;
                p.snow.visible = false;

                p.rain.position.y -= p.speedY * delta;
                if (p.rain.position.y < 0) {
                    p.rain.position.y = 25;
                    p.rain.position.x = (Math.random() - 0.5) * 50;
                    p.rain.position.z = (Math.random() - 0.5) * 50;
                }
            } else if (weatherType === 'snow') {
                p.rain.visible = false;
                p.snow.visible = true;

                p.snow.position.y -= (p.speedY * 0.25) * delta;
                p.snow.position.x += Math.sin(Date.now() * 0.0025 + p.snow.position.y) * 0.02;
                if (p.snow.position.y < 0) {
                    p.snow.position.y = 25;
                    p.snow.position.x = (Math.random() - 0.5) * 50;
                    p.snow.position.z = (Math.random() - 0.5) * 50;
                }
            } else {
                p.rain.visible = false;
                p.snow.visible = false;
            }
        });
    }
}

class RenderEngine {
    constructor(game) {
        this.game = game;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.lights = {};
        this.cameraTarget = new THREE.Vector3(1.5, 0, 1.5);

        // Unlocked zoom: Max zoom-out limits set to 200
        this.cameraZoom = 32;
        this.cameraAngleX = 0.65;
        this.cameraAngleY = 0.785;

        // Inertia damping variables
        this.targetVelocity = new THREE.Vector3();
        this.zoomVelocity = 0;
        this.angleYVelocity = 0;
        this.angleXVelocity = 0;

        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.mathGroundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        this.renderedMeshes = {};
        this.groundMeshes = {};
        this.activeCars = [];
        this.activeNpcs = [];
        this.animatingPlacements = [];
        this.entityClock = new THREE.Clock();
        this.smokeSystem = null;
        this.hoverMesh = null;
    }

    init(container) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0f1d);

        // Render camera with far-clip bound set to 2000 to prevent zoom-out clipping
        this.camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 1, 2000);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.domElement.className = "w-full h-full block";
        container.appendChild(this.renderer.domElement);

        this.lights.hemisphere = new THREE.HemisphereLight(0xfffbeb, 0x475569, 0.7);
        this.scene.add(this.lights.hemisphere);

        const dirLight = new THREE.DirectionalLight(0xfffbeb, 0.9);
        dirLight.position.set(15, 30, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 10;
        dirLight.shadow.camera.far = 80;
        dirLight.shadow.bias = -0.0005;

        const d = 26;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        this.scene.add(dirLight);
        this.lights.directional = dirLight;

        this.buildStaticEnvironment();
        this.smokeSystem = new SmokeParticleSystem(this.scene);
        this.weatherSystem = new WeatherSystem(this.scene);
        this.updateCamera();
        this.initControls(container);

        this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const width = entry.contentRect.width || container.clientWidth || 412;
                const height = entry.contentRect.height || container.clientHeight || 840;
                this.renderer.setSize(width, height);
                this.camera.aspect = width / height;
                this.updateCamera();
            }
        });
        this.resizeObserver.observe(container);
    }

    buildStaticEnvironment() {
        const worldSize = GRID_SIZE * TILE_SIZE;

        // Ground base under individual tiles
        const terrainGeom = GeometryCache.getPlane(worldSize * 2.5, worldSize * 2.5);
        const terrainMat = MaterialCache.getStandard(0x052e16, { roughness: 0.95 });
        const terrainMesh = new THREE.Mesh(terrainGeom, terrainMat);
        terrainMesh.rotation.x = -Math.PI / 2;
        terrainMesh.receiveShadow = true;
        terrainMesh.position.y = -0.11;
        this.scene.add(terrainMesh);

        const gridHelper = new THREE.GridHelper(worldSize, GRID_SIZE, 0x166534, 0x14532d);
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);

        const mountainMat = MaterialCache.getStandard(0x1e293b, { roughness: 0.8 });
        const snowMat = MaterialCache.getStandard(0xf8fafc, { roughness: 0.5 });
        const mOffsets = [
            { x: -32, z: -32, s: 12, h: 10 },
            { x: -28, z: -15, s: 10, h: 8 },
            { x: 32, z: -32, s: 14, h: 12 },
            { x: 35, z: -10, s: 9, h: 7 },
            { x: 10, z: -35, s: 11, h: 9 },
            { x: -12, z: -35, s: 13, h: 11 }
        ];
        mOffsets.forEach(mo => {
            const mountGroup = new THREE.Group();
            const mBaseGeom = GeometryCache.getCone(mo.s, mo.h, 4);
            const mBase = new THREE.Mesh(mBaseGeom, mountainMat);
            mBase.rotation.y = Math.PI / 4;
            mBase.castShadow = true;
            mountGroup.add(mBase);

            const mCapGeom = GeometryCache.getCone(mo.s * 0.35, mo.h * 0.35, 4);
            const mCap = new THREE.Mesh(mCapGeom, snowMat);
            mCap.rotation.y = Math.PI / 4;
            mCap.position.y = mo.h * 0.32;
            mCap.castShadow = true;
            mountGroup.add(mCap);

            mountGroup.position.set(mo.x, mo.h / 2, mo.z);
            this.scene.add(mountGroup);
        });

        // Ambient trees
        const pineTrunkMat = MaterialCache.getStandard(0x451a03, { roughness: 0.9 });
        const pineLeavesMat = MaterialCache.getStandard(0x064e3b, { roughness: 0.8 });
        for (let i = 0; i < 45; i++) {
            const px = (Math.random() - 0.5) * worldSize * 2.2;
            const pz = (Math.random() - 0.5) * worldSize * 2.2;
            if (Math.abs(px) < (worldSize / 2) && Math.abs(pz) < (worldSize / 2)) continue;

            const tree = new THREE.Group();
            const trunkGeom = GeometryCache.getCylinder(0.1, 0.1, 0.8, 6);
            const trunk = new THREE.Mesh(trunkGeom, pineTrunkMat);
            trunk.position.set(px, 0.4, pz);

            const foliageGeom = GeometryCache.getSphere(0.4, 8, 8);
            const foliage = new THREE.Mesh(foliageGeom, pineLeavesMat);
            foliage.position.set(px, 0.9, pz);
            foliage.castShadow = true;

            tree.add(trunk, foliage);
            this.scene.add(tree);
        }
    }

    updateMouseCoordinates(clientX, clientY, container) {
        const rect = container.getBoundingClientRect();
        this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    }

    initControls(container) {
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoomVelocity += e.deltaY * 0.015;
        }, { passive: false });

        let startPointerX = 0;
        let startPointerY = 0;
        const dragThreshold = 5;

        container.addEventListener('pointerdown', (e) => {
            this.game.audio.init();
            this.isDragging = true;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
            startPointerX = e.clientX;
            startPointerY = e.clientY;
            this.updateMouseCoordinates(e.clientX, e.clientY, container);
        });

        container.addEventListener('pointermove', (e) => {
            this.updateMouseCoordinates(e.clientX, e.clientY, container);
            if (this.isDragging) {
                const deltaX = e.clientX - this.previousMousePosition.x;
                const deltaY = e.clientY - this.previousMousePosition.y;

                const forward = new THREE.Vector3(Math.sin(this.cameraAngleY), 0, Math.cos(this.cameraAngleY)).normalize();
                const right = new THREE.Vector3(Math.cos(this.cameraAngleY), 0, -Math.sin(this.cameraAngleY)).normalize();

                const isMouse = e.pointerType === 'mouse';
                const sensitivity = isMouse ? 1.4 : 1.0;
                const dragFactor = 0.004 * (this.cameraZoom / 30) * sensitivity;

                this.targetVelocity.addScaledVector(right, -deltaX * dragFactor);
                this.targetVelocity.addScaledVector(forward, deltaY * dragFactor);
                this.previousMousePosition = { x: e.clientX, y: e.clientY };
            }
            if (this.game.ui && this.game.ui.selectedTool) this.updateHoverPlacement();
        });

        container.addEventListener('pointerup', (e) => {
            this.isDragging = false;
            const distMoved = Math.hypot(e.clientX - startPointerX, e.clientY - startPointerY);
            if (distMoved < dragThreshold) {
                this.updateMouseCoordinates(e.clientX, e.clientY, container);
                this.handleGridCellTap();
            }
        });

        let touchDistStart = 0;
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                touchDistStart = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && touchDistStart > 0) {
                const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const diff = dist - touchDistStart;
                this.zoomVelocity -= diff * 0.08;
                touchDistStart = dist;
            }
        }, { passive: true });
    }

    rotateCamera(amt) {
        this.game.audio.playSound('click');
        this.angleYVelocity += amt * 0.35;
    }

    tiltCamera(amt) {
        this.game.audio.playSound('click');
        this.angleXVelocity += amt * 0.35;
    }

    updateCamera() {
        const offsetX = Math.cos(this.cameraAngleX) * Math.sin(this.cameraAngleY) * this.cameraZoom;
        const offsetY = Math.sin(this.cameraAngleX) * this.cameraZoom;
        const offsetZ = Math.cos(this.cameraAngleX) * Math.cos(this.cameraAngleY) * this.cameraZoom;

        this.camera.position.set(
            this.cameraTarget.x + offsetX,
            this.cameraTarget.y + offsetY,
            this.cameraTarget.z + offsetZ
        );
        this.camera.lookAt(this.cameraTarget);
        this.camera.updateProjectionMatrix();
    }

    getIntersectedCell() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersectPoint = new THREE.Vector3();
        const intersects = this.raycaster.ray.intersectPlane(this.mathGroundPlane, intersectPoint);
        if (intersects) {
            const localX = intersectPoint.x - WORLD_OFFSET;
            const localZ = intersectPoint.z - WORLD_OFFSET;
            const gridX = Math.floor(localX / TILE_SIZE);
            const gridZ = Math.floor(localZ / TILE_SIZE);
            if (gridX >= 0 && gridX < GRID_SIZE && gridZ >= 0 && gridZ < GRID_SIZE) {
                return { x: gridX, z: gridZ };
            }
        }
        return null;
    }

    updateHoverPlacement() {
        const cell = this.getIntersectedCell();
        const ui = this.game.ui;
        const sim = this.game.simulation;
        if (!ui || !sim || !this.hoverMesh) return;

        if (cell && sim.isInsideGridLimits(cell.x, cell.z)) {
            this.hoverMesh.visible = true;
            const posX = cell.x * TILE_SIZE + WORLD_OFFSET + TILE_SIZE / 2;
            const posZ = cell.z * TILE_SIZE + WORLD_OFFSET + TILE_SIZE / 2;
            this.hoverMesh.position.set(posX, 0.15, posZ);

            const cellState = sim.state.grid[cell.x][cell.z];
            let isValid = false;

            if (ui.selectedTool === 'build' && cellState.tileType === TILES.EMPTY && cellState.terrain !== 'water') {
                const cost = BUILDING_TYPES[ui.buildTypeSelected.toUpperCase()].cost;
                if (sim.state.coins >= cost) isValid = true;
            } else if (ui.selectedTool === 'road' && cellState.tileType === TILES.EMPTY) {
                if (sim.state.coins >= 15) isValid = true;
            } else if (ui.selectedTool === 'landscape' && (cellState.tileType === TILES.EMPTY || cellState.tileType === TILES.ROAD)) {
                const cost = ui.landscapeTypeSelected === 'water' ? 10 : 0;
                if (sim.state.coins >= cost) isValid = true;
            } else if (ui.selectedTool === 'demolish' && cellState.tileType !== TILES.EMPTY && cellState.tileType !== TILES.TOWN_HALL) {
                isValid = true;
            } else if (ui.selectedTool === 'upgrade' && cellState.tileType === TILES.BUILDING && cellState.level < 3) {
                const cost = Math.floor(BUILDING_TYPES[cellState.buildingType.toUpperCase()].cost * 0.8 * cellState.level);
                if (sim.state.coins >= cost) isValid = true;
            }

            const greenGhostMat = MaterialCache.getBasic(0x22c55e, { transparent: true, opacity: 0.45 });
            const redGhostMat = MaterialCache.getBasic(0xef4444, { transparent: true, opacity: 0.45 });
            this.hoverMesh.children[0].material = isValid ? greenGhostMat : redGhostMat;
        } else {
            this.hoverMesh.visible = false;
        }
    }

    setupHoverMesh(isDemolish = false) {
        if (this.hoverMesh) this.scene.remove(this.hoverMesh);
        this.hoverMesh = new THREE.Group();
        const color = isDemolish ? 0xef4444 : 0x22c55e;
        const geom = GeometryCache.getBox(TILE_SIZE * 0.96, isDemolish ? 0.15 : 0.2, TILE_SIZE * 0.96);
        const mat = MaterialCache.getBasic(color, { transparent: true, opacity: 0.45 });

        const base = new THREE.Mesh(geom, mat);
        this.hoverMesh.add(base);

        const edges = GeometryCache.getEdges(isDemolish ? 'demo_edges' : 'build_edges', geom);
        const lineMat = MaterialCache.getLineBasic(0xffffff, { linewidth: 2 });
        const wire = new THREE.LineSegments(edges, lineMat);
        this.hoverMesh.add(wire);
        this.scene.add(this.hoverMesh);
    }

    clearHoverMesh() {
        if (this.hoverMesh) {
            this.scene.remove(this.hoverMesh);
            this.hoverMesh = null;
        }
    }

    handleGridCellTap() {
        const ui = this.game.ui;
        const sim = this.game.simulation;
        if (!ui || !ui.selectedTool || !sim) return;

        const cell = this.getIntersectedCell();
        if (!cell) return;
        if (!sim.isInsideGridLimits(cell.x, cell.z)) {
            ui.showToast("This zone is locked! Level up to expand.", "lock");
            return;
        }

        const cellState = sim.state.grid[cell.x][cell.z];
        if (ui.selectedTool === 'build') {
            if (cellState.tileType !== TILES.EMPTY) {
                ui.showToast("Plot occupied!", "warn"); return;
            }
            if (cellState.terrain === 'water') {
                ui.showToast("Cannot construct buildings on water tiles!", "error"); return;
            }
            const bInfo = BUILDING_TYPES[ui.buildTypeSelected.toUpperCase()];
            if (sim.state.coins < bInfo.cost) {
                ui.showToast("Not enough coins!", "coins"); return;
            }

            sim.state.coins -= bInfo.cost;
            sim.state.grid[cell.x][cell.z] = {
                ...cellState,
                tileType: TILES.BUILDING,
                buildingType: ui.buildTypeSelected.toLowerCase(),
                level: 1,
                connected: false,
                decoration: null,
                placedTime: Date.now()
            };

            sim.addXP(25);
            this.game.audio.playSound('build');
            this.triggerPuffParticle(cell.x, cell.z);
            sim.evaluateConnectivity();
            sim.recalculateCityStats();
            this.rebuildCityVisuals();
            sim.saveGame();
            ui.showFloatingText(`-$${bInfo.cost}`, cell.x, cell.z);

            if (sim.state.tutorialStep === 1 && ui.buildTypeSelected.toLowerCase() === 'house') {
                ui.advanceTutorial();
            }
            if (sim.state.coins < bInfo.cost) ui.cancelPlacement();

        } else if (ui.selectedTool === 'road') {
            if (cellState.tileType !== TILES.EMPTY) {
                ui.showToast("Cannot build roads over structures!", "warn"); return;
            }
            const roadCost = 15;
            if (sim.state.coins < roadCost) {
                ui.showToast("Not enough coins!", "coins"); return;
            }

            sim.state.coins -= roadCost;
            sim.state.grid[cell.x][cell.z] = {
                ...cellState,
                tileType: TILES.ROAD,
                buildingType: 'road',
                level: 1,
                connected: false,
                decoration: null,
                placedTime: Date.now()
            };

            sim.addXP(5);
            this.game.audio.playSound('build');
            this.triggerPuffParticle(cell.x, cell.z);
            sim.evaluateConnectivity();
            sim.recalculateCityStats();
            this.rebuildCityVisuals();
            sim.saveGame();
            ui.showFloatingText(`-$${roadCost}`, cell.x, cell.z);

            if (sim.state.tutorialStep === 2) ui.advanceTutorial();
            if (sim.state.coins < roadCost) ui.cancelPlacement();

        } else if (ui.selectedTool === 'landscape') {
            const paintType = ui.landscapeTypeSelected;
            const cost = paintType === 'water' ? 10 : 0;
            if (sim.state.coins < cost) {
                ui.showToast("Not enough coins!", "coins"); return;
            }
            if (cellState.tileType !== TILES.EMPTY && cellState.tileType !== TILES.ROAD) {
                ui.showToast("Can only paint empty or road plots!", "warn"); return;
            }

            sim.state.coins -= cost;
            cellState.terrain = paintType;
            cellState.decoration = null; // Clear biomes on painted tiles

            this.game.audio.playSound('build');
            this.triggerPuffParticle(cell.x, cell.z);
            sim.evaluateConnectivity();
            sim.recalculateCityStats();
            this.rebuildCityVisuals();
            sim.saveGame();
            if (cost > 0) ui.showFloatingText(`-$${cost}`, cell.x, cell.z);

        } else if (ui.selectedTool === 'demolish') {
            // Demolishing empty tiles is a no-op unless they have tree/rock decorations
            if (cellState.tileType === TILES.EMPTY && !cellState.decoration) return;
            if (cellState.tileType === TILES.TOWN_HALL) {
                ui.showToast("Cannot bulldoze Town Hall!", "error"); return;
            }
            this.game.audio.playSound('demolish');
            this.triggerPuffParticle(cell.x, cell.z);

            sim.state.grid[cell.x][cell.z] = {
                ...cellState,
                tileType: TILES.EMPTY,
                buildingType: null,
                level: 1,
                connected: false,
                decoration: null
            };
            sim.evaluateConnectivity();
            sim.recalculateCityStats();
            this.rebuildCityVisuals();
            sim.saveGame();

        } else if (ui.selectedTool === 'upgrade') {
            if (cellState.tileType !== TILES.BUILDING) {
                ui.showToast("Select building to upgrade!", "warn"); return;
            }
            if (cellState.level >= 3) {
                ui.showToast("Maximum level reached!", "max"); return;
            }
            const bInfo = BUILDING_TYPES[cellState.buildingType.toUpperCase()];
            const upgradeCost = Math.floor(bInfo.cost * 0.8 * cellState.level);

            if (sim.state.coins < upgradeCost) {
                ui.showToast("Insufficient funds!", "coins"); return;
            }

            sim.state.coins -= upgradeCost;
            cellState.level += 1;
            sim.addXP(upgradeCost / 5);
            this.game.audio.playSound('build');
            this.triggerPuffParticle(cell.x, cell.z);
            sim.evaluateConnectivity();
            sim.recalculateCityStats();
            this.rebuildCityVisuals();
            sim.saveGame();
            ui.showFloatingText(`Upgrade! Lvl ${cellState.level}`, cell.x, cell.z);

            if (sim.state.coins < Math.floor(bInfo.cost * 0.8 * cellState.level)) ui.cancelPlacement();
        }
    }

    isRiverTile(x, z) {
        return (x + z === 12 || x + z === 11) && x < 14 && z < 14;
    }

    createBuildingMesh(type, level = 1, gridX = 0, gridZ = 0) {
        const group = new THREE.Group();
        if (!type) return group;
        const normalizedType = type.toLowerCase();

        const matDarkBase = MaterialCache.getStandard(0x475569, { roughness: 0.85 });
        const matWindowGlow = MaterialCache.getStandard(0xfef08a, { emissive: 0xfef08a, emissiveIntensity: 0.45 });
        const matWoodColumn = MaterialCache.getStandard(0x5c4033, { roughness: 0.9 });
        const matMetalPipe = MaterialCache.getStandard(0xb0bec5, { metalness: 0.5, roughness: 0.45 });
        const buildingColor = BUILDING_TYPES[normalizedType.toUpperCase()]?.color || 0xcccccc;
        const matAccentWall = MaterialCache.getStandard(buildingColor, { roughness: 0.55 });
        const matWhiteWall = MaterialCache.getStandard(0xf8fafc, { roughness: 0.6 });

        switch (normalizedType) {
            case 'house': {
                const hHeight = 1.1 * level;
                const bMesh = new THREE.Mesh(GeometryCache.getBox(1.6, hHeight, 1.6), matWhiteWall);
                bMesh.position.y = hHeight / 2;
                bMesh.castShadow = true; bMesh.receiveShadow = true;
                group.add(bMesh);

                const roof = new THREE.Mesh(GeometryCache.getCone(1.4, 0.9, 4), matAccentWall);
                roof.rotation.y = Math.PI / 4;
                roof.position.y = hHeight + 0.45;
                roof.castShadow = true;
                group.add(roof);

                const winGeom = GeometryCache.getBox(0.25, 0.35, 0.08);
                const win1 = new THREE.Mesh(winGeom, matWindowGlow); win1.position.set(-0.4, hHeight / 2, 0.81);
                const win2 = new THREE.Mesh(winGeom, matWindowGlow); win2.position.set(0.4, hHeight / 2, 0.81);
                group.add(win1, win2);

                const chimney = new THREE.Mesh(GeometryCache.getBox(0.3, 0.8, 0.3), matDarkBase);
                chimney.position.set(0.4, hHeight + 0.5, 0.4);
                group.add(chimney);
                break;
            }
            case 'cafe': {
                const baseMesh = new THREE.Mesh(GeometryCache.getBox(1.6, 1.0, 1.6), matAccentWall);
                baseMesh.position.y = 0.5;
                baseMesh.castShadow = true; baseMesh.receiveShadow = true;
                group.add(baseMesh);

                const awningMat = MaterialCache.getStandard(0xef4444, { roughness: 0.5 });
                const awning = new THREE.Mesh(GeometryCache.getBox(1.8, 0.15, 0.45), awningMat);
                awning.position.set(0, 0.95, 0.8);
                awning.rotation.x = 0.25;
                group.add(awning);

                const win = new THREE.Mesh(GeometryCache.getBox(0.8, 0.5, 0.1), matWindowGlow);
                win.position.set(0, 0.5, 0.81);
                group.add(win);

                const cupMat = MaterialCache.getStandard(0xfffbeb, { roughness: 0.5 });
                const cup = new THREE.Mesh(GeometryCache.getCylinder(0.16, 0.16, 0.25, 8), cupMat);
                cup.position.set(-0.3, 1.12, -0.3);
                group.add(cup);
                break;
            }
            case 'shop': {
                const shopBase = new THREE.Mesh(GeometryCache.getBox(1.8, 1.2, 1.8), matAccentWall);
                shopBase.position.y = 0.6; shopBase.castShadow = true;
                group.add(shopBase);

                const awningMat = MaterialCache.getStandard(0xef4444, { roughness: 0.5 });
                const awning = new THREE.Mesh(GeometryCache.getBox(2.0, 0.2, 0.4), awningMat);
                awning.position.set(0, 1.15, 0.8);
                group.add(awning);

                const shopWin = new THREE.Mesh(GeometryCache.getBox(1.2, 0.6, 0.1), matWindowGlow);
                shopWin.position.set(0, 0.5, 0.91);
                group.add(shopWin);

                if (level >= 2) {
                  const signMat = MaterialCache.getStandard(0xfacc15, { roughness: 0.5 });
                  const sign = new THREE.Mesh(GeometryCache.getBox(0.8, 0.5, 0.2), signMat);
                  sign.position.set(0, 1.5, 0.6);
                  group.add(sign);
                }
                break;
            }
            case 'supermarket': {
                const superBase = new THREE.Mesh(GeometryCache.getBox(2.1, 1.2, 2.1), matAccentWall);
                superBase.position.y = 0.6; superBase.castShadow = true; superBase.receiveShadow = true;
                group.add(superBase);

                const foyer = new THREE.Mesh(GeometryCache.getBox(1.0, 1.0, 0.5), matWhiteWall);
                foyer.position.set(0, 0.5, 1.1); foyer.castShadow = true;
                group.add(foyer);

                const glassDoor = new THREE.Mesh(GeometryCache.getBox(0.6, 0.7, 0.08), matWindowGlow);
                glassDoor.position.set(0, 0.45, 1.36);
                group.add(glassDoor);

                const signMat = MaterialCache.getStandard(0xfacc15, { roughness: 0.6 });
                const sign = new THREE.Mesh(GeometryCache.getBox(1.4, 0.35, 0.15), signMat);
                sign.position.set(0, 1.4, 0.9);
                group.add(sign);
                break;
            }
            case 'factory': {
                const factoryBase = new THREE.Mesh(GeometryCache.getBox(2.0, 1.3, 1.8), matDarkBase);
                factoryBase.position.y = 0.65; factoryBase.castShadow = true;
                group.add(factoryBase);

                const siloHeight = 1.3 + (level * 0.4);
                const silo = new THREE.Mesh(GeometryCache.getCylinder(0.35, 0.35, siloHeight, 8), matMetalPipe);
                silo.position.set(0.65, siloHeight / 2, -0.4); silo.castShadow = true;
                group.add(silo);

                const stackHeight = 1.7 + (level * 0.5);
                const stack = new THREE.Mesh(GeometryCache.getCylinder(0.18, 0.25, stackHeight, 8), matMetalPipe);
                stack.position.set(-0.7, stackHeight / 2, -0.5); stack.castShadow = true;
                group.add(stack);

                const pipe = new THREE.Mesh(GeometryCache.getCylinder(0.06, 0.06, 1.4, 6), matMetalPipe);
                pipe.rotation.z = Math.PI / 2; pipe.position.set(0, 1.1, -0.4);
                group.add(pipe);
                break;
            }
            case 'park': {
                const parkBaseMat = MaterialCache.getStandard(0x2ec4b6, { roughness: 0.9 });
                const parkBase = new THREE.Mesh(GeometryCache.getBox(2.3, 0.15, 2.3), parkBaseMat);
                parkBase.position.y = 0.075;
                group.add(parkBase);

                const pond = new THREE.Mesh(GeometryCache.getCylinder(0.6, 0.6, 0.05, 12), MaterialCache.getStandard(0x00b4d8, { roughness: 0.1 }));
                pond.position.set(0, 0.16, 0);
                group.add(pond);

                const numTrees = 1 + level;
                const treePositions = [[-0.6, 0.6], [0.5, -0.5], [-0.5, -0.5], [0.6, 0.5]];
                for (let i = 0; i < Math.min(numTrees, treePositions.length); i++) {
                    const trunk = new THREE.Mesh(GeometryCache.getCylinder(0.1, 0.1, 0.8, 6), matWoodColumn);
                    trunk.position.set(treePositions[i][0], 0.4, treePositions[i][1]);

                    const foliageMat = MaterialCache.getStandard(0xf3a1b3, { roughness: 0.8 });
                    const foliage = new THREE.Mesh(GeometryCache.getSphere(0.4, 8, 8), foliageMat);
                    foliage.position.set(treePositions[i][0], 0.9, treePositions[i][1]);
                    foliage.castShadow = true;
                    group.add(trunk, foliage);
                }
                break;
            }
            case 'school': {
                const schBase = new THREE.Mesh(GeometryCache.getBox(2.2, 1.5, 1.8), matAccentWall);
                schBase.position.y = 0.75; schBase.castShadow = true;
                group.add(schBase);

                const pole = new THREE.Mesh(GeometryCache.getCylinder(0.04, 0.04, 2.2, 6), matMetalPipe);
                pole.position.set(0.8, 1.1, 0.6);

                const flagMat = MaterialCache.getStandard(0xef4444, { roughness: 0.8 });
                const flag = new THREE.Mesh(GeometryCache.getBox(0.4, 0.25, 0.03), flagMat);
                flag.position.set(0.8, 2.0, 0.42);
                group.add(pole, flag);

                if (level >= 2) {
                    const tower = new THREE.Mesh(GeometryCache.getBox(0.8, 1.2, 0.8), matDarkBase);
                    tower.position.set(0, 2.1, 0);
                    const towerRoofMat = MaterialCache.getStandard(0xfacc15, { roughness: 0.5 });
                    const towerRoof = new THREE.Mesh(GeometryCache.getCone(0.6, 0.7, 4), towerRoofMat);
                    towerRoof.position.set(0, 3.05, 0);
                    towerRoof.rotation.y = Math.PI / 4;
                    group.add(tower, towerRoof);
                }
                break;
            }
            case 'hospital': {
                const hospBaseMat = MaterialCache.getStandard(0xf1f5f9, { roughness: 0.8 });
                const hospBase = new THREE.Mesh(GeometryCache.getBox(2.4, 1.8, 2.0), hospBaseMat);
                hospBase.position.y = 0.9; hospBase.castShadow = true;
                group.add(hospBase);

                const crossMat = MaterialCache.getStandard(0xef4444, { roughness: 0.8 });
                const crossH = new THREE.Mesh(GeometryCache.getBox(0.6, 0.18, 0.18), crossMat);
                const crossV = new THREE.Mesh(GeometryCache.getBox(0.18, 0.6, 0.18), crossMat);
                const crossGroup = new THREE.Group();
                crossGroup.add(crossH, crossV);
                crossGroup.position.set(0, 1.2, 1.05);
                group.add(crossGroup);
                break;
            }
            case 'police': {
                const bHeight = 1.3;
                const bMesh = new THREE.Mesh(GeometryCache.getBox(1.8, bHeight, 1.6), matAccentWall);
                bMesh.position.y = bHeight / 2;
                bMesh.castShadow = true; bMesh.receiveShadow = true;
                group.add(bMesh);

                const cab = new THREE.Mesh(GeometryCache.getBox(0.8, 0.6, 0.8), matWhiteWall);
                cab.position.set(0, bHeight + 0.3, 0);
                cab.castShadow = true;
                group.add(cab);

                const siren = new THREE.Mesh(GeometryCache.getSphere(0.12, 6, 6), MaterialCache.getStandard(0x3b82f6, { emissive: 0x3b82f6, emissiveIntensity: 1 }));
                siren.position.set(0, bHeight + 0.65, 0);
                siren.name = "siren";
                group.add(siren);
                break;
            }
            case 'fire': {
                const bHeight = 1.2;
                const bMesh = new THREE.Mesh(GeometryCache.getBox(2.0, bHeight, 1.6), matAccentWall);
                bMesh.position.y = bHeight / 2;
                bMesh.castShadow = true; bMesh.receiveShadow = true;
                group.add(bMesh);

                const doorGeom = GeometryCache.getBox(0.6, 0.8, 0.05);
                const door1 = new THREE.Mesh(doorGeom, matDarkBase); door1.position.set(-0.45, 0.4, 0.81);
                const door2 = new THREE.Mesh(doorGeom, matDarkBase); door2.position.set(0.45, 0.4, 0.81);
                group.add(door1, door2);

                const tower = new THREE.Mesh(GeometryCache.getBox(0.5, 2.2, 0.5), matAccentWall);
                tower.position.set(-0.7, 1.1, -0.5);
                tower.castShadow = true;
                group.add(tower);
                break;
            }
            case 'wind': {
                const pole = new THREE.Mesh(GeometryCache.getCylinder(0.06, 0.12, 2.8, 6), matWhiteWall);
                pole.position.y = 1.4; pole.castShadow = true;
                group.add(pole);

                const hub = new THREE.Mesh(GeometryCache.getBox(0.24, 0.24, 0.35), matDarkBase);
                hub.position.set(0, 2.8, 0.2);
                group.add(hub);

                const propeller = new THREE.Group();
                propeller.position.set(0, 2.8, 0.4);
                propeller.name = "propeller";

                const centerCap = new THREE.Mesh(GeometryCache.getCylinder(0.08, 0.08, 0.16, 6), matWhiteWall);
                centerCap.rotation.x = Math.PI / 2;
                propeller.add(centerCap);

                for (let b = 0; b < 3; b++) {
                    const angle = (Math.PI * 2 / 3) * b;
                    const blade = new THREE.Mesh(GeometryCache.getBox(0.05, 1.1, 0.12), matWhiteWall);
                    blade.position.set(Math.sin(angle) * 0.55, Math.cos(angle) * 0.55, 0);
                    blade.rotation.z = -angle;
                    propeller.add(blade);
                }
                group.add(propeller);
                break;
            }
            case 'solar': {
                const frameMat = matDarkBase;
                const panelMat = MaterialCache.getStandard(0x1e3a8a, { roughness: 0.15, metalness: 0.8 });

                for (let p = -1; p <= 1; p++) {
                    const panelGroup = new THREE.Group();
                    panelGroup.position.set(p * 0.65, 0, 0);

                    const stand = new THREE.Mesh(GeometryCache.getCylinder(0.03, 0.03, 0.5, 4), frameMat);
                    stand.position.y = 0.25; stand.rotation.x = 0.2;
                    panelGroup.add(stand);

                    const board = new THREE.Mesh(GeometryCache.getBox(0.55, 0.04, 0.9), panelMat);
                    board.position.set(0, 0.42, 0);
                    board.rotation.x = -0.4;
                    board.castShadow = true;
                    panelGroup.add(board);

                    group.add(panelGroup);
                }
                break;
            }
            case 'stadium': {
                const seatGeom = GeometryCache.getCylinder(1.1, 1.25, 0.65, 12);
                const seats = new THREE.Mesh(seatGeom, matDarkBase);
                seats.position.y = 0.325; seats.castShadow = true;
                group.add(seats);

                const fieldMat = MaterialCache.getStandard(0x15803d, { roughness: 0.9 });
                const field = new THREE.Mesh(GeometryCache.getBox(1.3, 0.05, 1.7), fieldMat);
                field.position.set(0, 0.1, 0);
                group.add(field);

                const postMat = matDarkBase;
                const p1 = new THREE.Mesh(GeometryCache.getCylinder(0.03, 0.03, 1.6, 4), postMat); p1.position.set(-1.0, 0.8, 1.0);
                const p2 = new THREE.Mesh(GeometryCache.getCylinder(0.03, 0.03, 1.6, 4), postMat); p2.position.set(1.0, 0.8, 1.0);
                const p3 = new THREE.Mesh(GeometryCache.getCylinder(0.03, 0.03, 1.6, 4), postMat); p3.position.set(-1.0, 0.8, -1.0);
                const p4 = new THREE.Mesh(GeometryCache.getCylinder(0.03, 0.03, 1.6, 4), postMat); p4.position.set(1.0, 0.8, -1.0);
                group.add(p1, p2, p3, p4);
                break;
            }
            case 'airport': {
                const runwayMat = MaterialCache.getStandard(0x1e293b, { roughness: 0.9 });
                const runway = new THREE.Mesh(GeometryCache.getBox(1.1, 0.06, 2.8), runwayMat);
                runway.position.y = 0.03; runway.receiveShadow = true;
                group.add(runway);

                const stripeMat = MaterialCache.getStandard(0xf8fafc, { roughness: 0.8 });
                for (let d = -1.0; d <= 1.0; d += 0.85) {
                    const mark = new THREE.Mesh(GeometryCache.getBox(0.08, 0.01, 0.4), stripeMat);
                    mark.position.set(0, 0.065, d);
                    group.add(mark);
                }

                const tower = new THREE.Mesh(GeometryCache.getBox(0.4, 1.2, 0.4), matWhiteWall);
                tower.position.set(0.85, 0.6, -0.6); tower.castShadow = true;
                group.add(tower);

                const cabin = new THREE.Mesh(GeometryCache.getBox(0.5, 0.35, 0.5), matDarkBase);
                cabin.position.set(0.85, 1.35, -0.6);
                group.add(cabin);
                break;
            }
            case 'apartment': {
                const floors = 2 + level;
                const aptHeight = floors * 1.0;
                const aptBase = new THREE.Mesh(GeometryCache.getBox(1.8, aptHeight, 1.8), matAccentWall);
                aptBase.position.y = aptHeight / 2; aptBase.castShadow = true;
                group.add(aptBase);

                const winGeom = GeometryCache.getBox(0.25, 0.25, 0.1);
                for (let f = 0; f < floors; f++) {
                    for (let side = 0; side < 4; side++) {
                        const win = new THREE.Mesh(winGeom, matWindowGlow);
                        const angle = (Math.PI / 2) * side;
                        win.position.set(Math.cos(angle) * 0.91, 0.5 + f * 1.0, Math.sin(angle) * 0.91);
                        win.rotation.y = -angle;
                        group.add(win);
                    }
                }
                break;
            }
            case 'office': {
                const officeHeight = 4.0 + (level * 1.0);
                const offBase = new THREE.Mesh(GeometryCache.getBox(1.6, officeHeight, 1.6), matAccentWall);
                offBase.position.y = officeHeight / 2; offBase.castShadow = true;
                group.add(offBase);

                const facadeMat = MaterialCache.getStandard(0x0284c7, { transparent: true, opacity: 0.6, roughness: 0.2 });
                const facade = new THREE.Mesh(GeometryCache.getBox(1.7, officeHeight - 0.6, 1.4), facadeMat);
                facade.position.y = officeHeight / 2;
                group.add(facade);
                break;
            }
            case 'megamall': {
                const tier1 = new THREE.Mesh(GeometryCache.getBox(2.4, 0.9, 2.4), matAccentWall);
                tier1.position.y = 0.45; tier1.castShadow = true; tier1.receiveShadow = true;
                group.add(tier1);

                const tier2 = new THREE.Mesh(GeometryCache.getBox(1.7, 0.8, 1.7), matWhiteWall);
                tier2.position.y = 1.3; tier2.castShadow = true;
                group.add(tier2);

                const domeMat = MaterialCache.getStandard(0x0284c7, { transparent: true, opacity: 0.6, roughness: 0.1 });
                const dome = new THREE.Mesh(GeometryCache.getSphere(0.5, 12, 12), domeMat);
                dome.position.set(0, 1.7, 0);
                group.add(dome);

                const pillarGeom = GeometryCache.getBox(0.2, 1.8, 0.2);
                const pillarMat = MaterialCache.getStandard(0x475569, { roughness: 0.8 });
                const p1 = new THREE.Mesh(pillarGeom, pillarMat); p1.position.set(-1.1, 0.9, 1.1);
                const p2 = new THREE.Mesh(pillarGeom, pillarMat); p2.position.set(1.1, 0.9, 1.1);
                const p3 = new THREE.Mesh(pillarGeom, pillarMat); p3.position.set(-1.1, 0.9, -1.1);
                const p4 = new THREE.Mesh(pillarGeom, pillarMat); p4.position.set(1.1, 0.9, -1.1);
                group.add(p1, p2, p3, p4);
                break;
            }
            case 'landmark': {
                const basePlate = new THREE.Mesh(GeometryCache.getBox(2.4, 0.4, 2.4), matDarkBase);
                basePlate.position.y = 0.2;
                group.add(basePlate);

                const pyramidOb = new THREE.Mesh(GeometryCache.getCylinder(0.1, 0.6, 5.0, 4), matAccentWall);
                pyramidOb.rotation.y = Math.PI / 4; pyramidOb.position.y = 2.9; pyramidOb.castShadow = true;
                group.add(pyramidOb);

                const glowSphereMat = MaterialCache.getStandard(0xfef08a, { emissive: 0xfacc15, emissiveIntensity: 1.0 });
                const glowSphere = new THREE.Mesh(GeometryCache.getSphere(0.4, 8, 8), glowSphereMat);
                glowSphere.position.y = 5.7;
                group.add(glowSphere);

                const ringGeom = GeometryCache.getRing(0.75, 0.95, 16);
                const ringMat = MaterialCache.getStandard(0xffb703, { emissive: 0xffb703, emissiveIntensity: 0.8, side: THREE.DoubleSide });
                const ring = new THREE.Mesh(ringGeom, ringMat);
                ring.rotation.x = Math.PI / 2; ring.position.y = 5.2;
                group.add(ring);
                break;
            }
            case 'town_hall': {
                const thBase = new THREE.Mesh(GeometryCache.getBox(2.6, 1.3, 2.2), matWhiteWall);
                thBase.position.y = 0.65; thBase.castShadow = true; thBase.receiveShadow = true;
                group.add(thBase);

                const colGeom = GeometryCache.getCylinder(0.08, 0.08, 1.1, 6);
                for (let colX = -0.8; colX <= 0.8; colX += 0.4) {
                    const col = new THREE.Mesh(colGeom, matWhiteWall);
                    col.position.set(colX, 0.55, 1.15);
                    group.add(col);
                }

                const thRoofMat = MaterialCache.getStandard(0x1e3a8a, { roughness: 0.7 });
                const thRoof = new THREE.Mesh(GeometryCache.getCone(1.6, 0.7, 4), thRoofMat);
                thRoof.rotation.y = Math.PI / 4; thRoof.position.set(0, 1.65, 0); thRoof.castShadow = true;
                group.add(thRoof);

                const clockBase = new THREE.Mesh(GeometryCache.getCylinder(0.35, 0.35, 0.7, 8), matWhiteWall);
                clockBase.position.set(0, 2.2, 0);
                const clockDome = new THREE.Mesh(GeometryCache.getSphere(0.45, 12, 12), matAccentWall);
                clockDome.position.set(0, 2.55, 0);
                group.add(clockBase, clockDome);
                break;
            }
            case 'road': {
                const cell = this.game.simulation.state.grid[gridX][gridZ];
                const isBridge = this.isRiverTile(gridX, gridZ) || (cell && cell.terrain === 'water');
                if (isBridge) {
                    const bridgeBase = new THREE.Mesh(GeometryCache.getBox(TILE_SIZE * 0.98, 0.3, TILE_SIZE * 0.98), matWoodColumn);
                    bridgeBase.position.y = 0.15; bridgeBase.castShadow = true; bridgeBase.receiveShadow = true;
                    group.add(bridgeBase);

                    const leftRail = new THREE.Mesh(GeometryCache.getBox(0.15, 0.5, TILE_SIZE * 0.98), matWoodColumn);
                    leftRail.position.set(-(TILE_SIZE * 0.42), 0.4, 0); leftRail.castShadow = true;
                    group.add(leftRail);

                    const rightRail = new THREE.Mesh(GeometryCache.getBox(0.15, 0.5, TILE_SIZE * 0.98), matWoodColumn);
                    rightRail.position.set((TILE_SIZE * 0.42), 0.4, 0); rightRail.castShadow = true;
                    group.add(rightRail);
                } else {
                    const rMesh = new THREE.Mesh(GeometryCache.getBox(TILE_SIZE * 0.98, 0.08, TILE_SIZE * 0.98), matDarkBase);
                    rMesh.position.y = 0.04; rMesh.receiveShadow = true;
                    group.add(rMesh);

                    const stripeMat = MaterialCache.getStandard(0xfacc15, { roughness: 0.8 });
                    const stripe = new THREE.Mesh(GeometryCache.getBox(1.1, 0.01, 0.16), stripeMat);
                    stripe.position.set(0, 0.09, 0);
                    group.add(stripe);
                }
                break;
            }
        }
        return group;
    }

    createDecorationMesh(type, posX, posZ) {
        const group = new THREE.Group();
        group.position.set(posX, 0, posZ);

        switch (type) {
            case 'tree_pine': {
                const trunkMat = MaterialCache.getStandard(0x451a03, { roughness: 0.9 });
                const leavesMat = MaterialCache.getStandard(0x064e3b, { roughness: 0.8 });

                const trunk = new THREE.Mesh(GeometryCache.getCylinder(0.08, 0.08, 0.7, 5), trunkMat);
                trunk.position.y = 0.35; trunk.castShadow = true;

                const foliage = new THREE.Mesh(GeometryCache.getCone(0.45, 1.2, 5), leavesMat);
                foliage.position.y = 1.1; foliage.castShadow = true;

                group.add(trunk, foliage);
                break;
            }
            case 'tree_oak': {
                const trunkMat = MaterialCache.getStandard(0x451a03, { roughness: 0.9 });
                const leavesMat = MaterialCache.getStandard(0x15803d, { roughness: 0.85 });

                const trunk = new THREE.Mesh(GeometryCache.getCylinder(0.1, 0.1, 0.6, 5), trunkMat);
                trunk.position.y = 0.3; trunk.castShadow = true;

                const foliage = new THREE.Mesh(GeometryCache.getSphere(0.42, 6, 6), leavesMat);
                foliage.position.y = 0.85; foliage.castShadow = true;

                group.add(trunk, foliage);
                break;
            }
            case 'rock': {
                const rockMat = MaterialCache.getStandard(0x64748b, { roughness: 0.8 });
                const rGeom = GeometryCache.getSphere(0.28, 4, 4);
                const rock = new THREE.Mesh(rGeom, rockMat);

                rock.scale.set(1.1, 0.65, 0.9);
                rock.position.y = 0.15;
                rock.castShadow = true;
                group.add(rock);
                break;
            }
            case 'flower': {
                const stemMat = MaterialCache.getStandard(0x22c55e, { roughness: 0.9 });
                const petalColors = [0xef4444, 0xec4899, 0xfacc15];
                const petalColor = petalColors[Math.floor(Math.random() * petalColors.length)];
                const petalMat = MaterialCache.getStandard(petalColor, { roughness: 0.7 });

                const stem = new THREE.Mesh(GeometryCache.getCylinder(0.02, 0.02, 0.3, 4), stemMat);
                stem.position.y = 0.15;

                const head = new THREE.Mesh(GeometryCache.getSphere(0.08, 4, 4), petalMat);
                head.position.y = 0.3;

                group.add(stem, head);
                break;
            }
        }
        return group;
    }

    rebuildCityVisuals() {
        const sim = this.game.simulation;
        if (!sim) return;

        // 1. Clear occupied meshes
        Object.keys(this.renderedMeshes).forEach(key => {
            this.scene.remove(this.renderedMeshes[key]);
            delete this.renderedMeshes[key];
        });

        // 2. Clear ground meshes
        if (this.groundMeshes) {
            Object.keys(this.groundMeshes).forEach(key => {
                this.scene.remove(this.groundMeshes[key]);
                delete this.groundMeshes[key];
            });
        }
        this.groundMeshes = {};

        // 3. Render ground and structures
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let z = 0; z < GRID_SIZE; z++) {
                const cell = sim.state.grid[x][z];
                const terrain = cell.terrain || 'grass';

                // Paint ground tile based on terrain configuration
                let groundColor = 0x15803d; // default grass green
                if (terrain === 'water') groundColor = 0x0284c7; // water blue
                else if (terrain === 'dirt') groundColor = 0x78350f; // dirt brown

                const groundGeom = GeometryCache.getBox(TILE_SIZE, 0.1, TILE_SIZE);
                const groundMat = MaterialCache.getStandard(groundColor, { roughness: 0.95 });
                const groundMesh = new THREE.Mesh(groundGeom, groundMat);

                const posX = x * TILE_SIZE + WORLD_OFFSET + TILE_SIZE / 2;
                const posZ = z * TILE_SIZE + WORLD_OFFSET + TILE_SIZE / 2;
                groundMesh.position.set(posX, -0.05, posZ);
                groundMesh.receiveShadow = true;

                this.scene.add(groundMesh);
                this.groundMeshes[`${x}_${z}`] = groundMesh;

                // Render building / road model
                if (cell.tileType !== TILES.EMPTY) {
                    const mesh = this.createBuildingMesh(cell.buildingType, cell.level, x, z);
                    mesh.position.set(posX, 0, posZ);

                    if (cell.tileType === TILES.BUILDING && !cell.connected) {
                        mesh.position.y = 0.1;
                        mesh.rotation.z = 0.08;
                    }

                    const age = Date.now() - (cell.placedTime || 0);
                    if (age < 800) {
                        mesh.scale.set(0.01, 0.01, 0.01);
                        this.animatingPlacements.push({
                            mesh: mesh,
                            startTime: Date.now() - age,
                            duration: 800
                        });
                    }

                    this.scene.add(mesh);
                    this.renderedMeshes[`${x}_${z}`] = mesh;
                } else if (cell.decoration) {
                    const decoMesh = this.createDecorationMesh(cell.decoration, posX, posZ);
                    this.scene.add(decoMesh);
                    this.renderedMeshes[`dec_${x}_${z}`] = decoMesh;
                }
            }
        }
    }

    getTileWorldPos(x, z) {
        return new THREE.Vector3(
            x * TILE_SIZE + WORLD_OFFSET + TILE_SIZE / 2, 0, z * TILE_SIZE + WORLD_OFFSET + TILE_SIZE / 2
        );
    }

    createNpcMesh() {
        const group = new THREE.Group();
        const skinColors = [0xffdbac, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524];
        const chosenSkin = skinColors[Math.floor(Math.random() * skinColors.length)];
        const headMat = MaterialCache.getStandard(chosenSkin, { roughness: 0.8 });

        const headGeom = GeometryCache.getSphere(0.18, 6, 6);
        const head = new THREE.Mesh(headGeom, headMat);
        head.position.y = 0.72; head.castShadow = true;
        group.add(head);

        const torsoColors = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b, 0x6366f1, 0xec4899, 0x14b8a6, 0xf43f5e];
        const shirtColor = torsoColors[Math.floor(Math.random() * torsoColors.length)];
        const bodyMat = MaterialCache.getStandard(shirtColor, { roughness: 0.7 });
        const bodyGeom = GeometryCache.getBox(0.3, 0.38, 0.24);
        const torso = new THREE.Mesh(bodyGeom, bodyMat);
        torso.position.y = 0.44; torso.castShadow = true;
        group.add(torso);

        const pantsColors = [0x1e293b, 0x1e3a8a, 0x475569, 0x27272a];
        const pantsColor = pantsColors[Math.floor(Math.random() * pantsColors.length)];
        const pantsMat = MaterialCache.getStandard(pantsColor, { roughness: 0.8 });
        const legGeom = GeometryCache.getBox(0.1, 0.24, 0.1);

        const leftLeg = new THREE.Mesh(legGeom, pantsMat);
        leftLeg.position.set(-0.09, 0.14, 0); leftLeg.castShadow = true;
        const rightLeg = new THREE.Mesh(legGeom, pantsMat);
        rightLeg.position.set(0.09, 0.14, 0); rightLeg.castShadow = true;
        group.add(leftLeg, rightLeg);

        group.scale.set(1.2, 1.2, 1.2);
        return group;
    }

    createCarMesh() {
        const group = new THREE.Group();
        const typeRoll = Math.random();

        const tireMat = MaterialCache.getStandard(0x0f172a, { roughness: 0.9 });
        const tireGeom = GeometryCache.getBox(0.12, 0.16, 0.18);

        let bodyMat;
        let baseGeom;

        if (typeRoll < 0.15) {
            bodyMat = MaterialCache.getStandard(0xfacc15, { roughness: 0.4 });
            baseGeom = GeometryCache.getBox(0.55, 0.22, 0.95);
            const base = new THREE.Mesh(baseGeom, bodyMat);
            base.position.y = 0.18; base.castShadow = true;
            group.add(base);

            const cabinMat = MaterialCache.getStandard(0x1e293b, { roughness: 0.2 });
            const cabin = new THREE.Mesh(GeometryCache.getBox(0.42, 0.18, 0.48), cabinMat);
            cabin.position.set(0, 0.35, -0.06); cabin.castShadow = true;
            group.add(cabin);

            const signMat = MaterialCache.getStandard(0x000000, { roughness: 0.5 });
            const sign = new THREE.Mesh(GeometryCache.getBox(0.25, 0.08, 0.08), signMat);
            sign.position.set(0, 0.46, -0.06);
            group.add(sign);

        } else if (typeRoll < 0.30) {
            bodyMat = MaterialCache.getStandard(0x10b981, { roughness: 0.5 });
            baseGeom = GeometryCache.getBox(0.65, 0.5, 1.8);
            const base = new THREE.Mesh(baseGeom, bodyMat);
            base.position.y = 0.35; base.castShadow = true;
            group.add(base);

            const glassMat = MaterialCache.getStandard(0x1e293b, { roughness: 0.1 });
            const windShield = new THREE.Mesh(GeometryCache.getBox(0.55, 0.3, 0.1), glassMat);
            windShield.position.set(0, 0.45, 0.86);
            group.add(windShield);

        } else if (typeRoll < 0.42) {
            bodyMat = MaterialCache.getStandard(0x1e3a8a, { roughness: 0.4 });
            baseGeom = GeometryCache.getBox(0.55, 0.22, 0.95);
            const base = new THREE.Mesh(baseGeom, bodyMat);
            base.position.y = 0.18; base.castShadow = true;
            group.add(base);

            const cabinMat = MaterialCache.getStandard(0xf8fafc, { roughness: 0.5 });
            const cabin = new THREE.Mesh(GeometryCache.getBox(0.42, 0.18, 0.48), cabinMat);
            cabin.position.set(0, 0.35, -0.06); cabin.castShadow = true;
            group.add(cabin);

            const sirenLight = new THREE.Mesh(GeometryCache.getSphere(0.08, 4, 4), MaterialCache.getStandard(0xef4444, { emissive: 0xef4444, emissiveIntensity: 1 }));
            sirenLight.position.set(0, 0.46, -0.06);
            sirenLight.name = "siren";
            group.add(sirenLight);

        } else if (typeRoll < 0.50) {
            bodyMat = MaterialCache.getStandard(0xf8fafc, { roughness: 0.5 });
            baseGeom = GeometryCache.getBox(0.6, 0.48, 1.1);
            const base = new THREE.Mesh(baseGeom, bodyMat);
            base.position.y = 0.34; base.castShadow = true;
            group.add(base);

            const crossMat = MaterialCache.getStandard(0xef4444, { roughness: 0.8 });
            const crossH = new THREE.Mesh(GeometryCache.getBox(0.25, 0.08, 0.08), crossMat);
            const crossV = new THREE.Mesh(GeometryCache.getBox(0.08, 0.25, 0.08), crossMat);
            crossH.position.set(0.31, 0.34, 0);
            crossV.position.set(0.31, 0.34, 0);
            group.add(crossH, crossV);

            const sirenLight = new THREE.Mesh(GeometryCache.getSphere(0.08, 4, 4), MaterialCache.getStandard(0x3b82f6, { emissive: 0x3b82f6, emissiveIntensity: 1 }));
            sirenLight.position.set(0, 0.6, 0.2);
            sirenLight.name = "siren";
            group.add(sirenLight);

        } else {
            const carColors = [0xef4444, 0x3b82f6, 0xec4899, 0xf43f5e, 0x06b6d4, 0x7c2d12];
            const randColor = carColors[Math.floor(Math.random() * carColors.length)];
            bodyMat = MaterialCache.getStandard(randColor, { roughness: 0.5 });

            baseGeom = GeometryCache.getBox(0.55, 0.22, 0.95);
            const base = new THREE.Mesh(baseGeom, bodyMat);
            base.position.y = 0.18; base.castShadow = true;
            group.add(base);

            const cabinMat = MaterialCache.getStandard(0x1e293b, { roughness: 0.2 });
            const cabin = new THREE.Mesh(GeometryCache.getBox(0.42, 0.18, 0.48), cabinMat);
            cabin.position.set(0, 0.35, -0.06); cabin.castShadow = true;
            group.add(cabin);
        }

        const isBus = typeRoll >= 0.15 && typeRoll < 0.30;
        const offsetZ = isBus ? 0.65 : 0.26;

        const tl = new THREE.Mesh(tireGeom, tireMat); tl.position.set(-0.28, 0.08, offsetZ);
        const tr = new THREE.Mesh(tireGeom, tireMat); tr.position.set(0.28, 0.08, offsetZ);
        const bl = new THREE.Mesh(tireGeom, tireMat); bl.position.set(-0.28, 0.08, -offsetZ);
        const br = new THREE.Mesh(tireGeom, tireMat); br.position.set(0.28, 0.08, -offsetZ);
        group.add(tl, tr, bl, br);

        group.scale.set(0.9, 0.9, 0.9);
        return group;
    }

    updateEntities(delta) {
        const sim = this.game.simulation;
        if (!sim || !sim.state.gameStarted) return;

        let roadTilesCoords = [];
        let spawnableBuildingCoords = [];

        for (let x = 0; x < GRID_SIZE; x++) {
            for (let z = 0; z < GRID_SIZE; z++) {
                const cell = sim.state.grid[x][z];
                if (cell.tileType === TILES.ROAD && cell.connected) {
                    roadTilesCoords.push({ x, z });
                } else if (cell.tileType === TILES.BUILDING && cell.connected) {
                    spawnableBuildingCoords.push({ x, z });
                }
            }
        }

        // 1. CAR SIMULATION (Standard counts)
        const maxCars = Math.min(8, Math.floor(sim.countConnectedRoads() / 2.5) + 1);
        if (this.activeCars.length < maxCars && roadTilesCoords.length > 0) {
            const startCell = roadTilesCoords[Math.floor(Math.random() * roadTilesCoords.length)];
            if (startCell) {
                const carMesh = this.createCarMesh();
                this.scene.add(carMesh);
                carMesh.position.copy(this.getTileWorldPos(startCell.x, startCell.z));
                this.activeCars.push({
                    mesh: carMesh,
                    currentTile: { x: startCell.x, z: startCell.z },
                    targetTile: { x: startCell.x, z: startCell.z },
                    progress: 1.0,
                    speed: 1.5 + Math.random() * 0.8,
                    isStopped: false,
                    stopTimer: 0
                });
            }
        }

        for (let i = this.activeCars.length - 1; i >= 0; i--) {
            const car = this.activeCars[i];

            if (car.isStopped) {
                car.stopTimer -= delta;
                if (car.stopTimer <= 0) {
                    car.isStopped = false;
                }
                const currentPos = this.getTileWorldPos(car.currentTile.x, car.currentTile.z);
                car.mesh.position.copy(currentPos);
                continue;
            }

            car.progress += car.speed * delta;

            const tileObj = sim.state.grid[car.currentTile.x][car.currentTile.z];
            if (!tileObj || tileObj.tileType !== TILES.ROAD || !tileObj.connected) {
                this.scene.remove(car.mesh);
                this.activeCars.splice(i, 1);
                continue;
            }

            if (car.progress >= 1.0) {
                car.currentTile = { x: car.targetTile.x, z: car.targetTile.z };

                // Smart Parking AI: check adjacent cells for functional buildings to pull over
                const directions = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];
                let foundAdjacentBuilding = false;
                for (const d of directions) {
                    const ax = car.currentTile.x + d.x;
                    const az = car.currentTile.z + d.z;
                    if (ax >= 0 && ax < GRID_SIZE && az >= 0 && az < GRID_SIZE) {
                        const cell = sim.state.grid[ax][az];
                        if (cell && cell.tileType === TILES.BUILDING && cell.connected) {
                            if (['hospital', 'shop', 'house', 'cafe', 'supermarket', 'megamall', 'apartment'].includes(cell.buildingType)) {
                                foundAdjacentBuilding = true;
                                break;
                            }
                        }
                    }
                }

                if (foundAdjacentBuilding && Math.random() < 0.25) {
                    car.isStopped = true;
                    car.stopTimer = 2.0 + Math.random() * 2.0;
                    this.game.ui.showFloatingText("Drop-off 👥", car.currentTile.x, car.currentTile.z);
                    this.game.audio.playSound('click');
                    
                    const currentPos = this.getTileWorldPos(car.currentTile.x, car.currentTile.z);
                    car.mesh.position.copy(currentPos);
                    car.progress = 1.0;
                    continue;
                }

                const dirs = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];
                let viableNeighbors = [];
                dirs.forEach(d => {
                    const nx = car.currentTile.x + d.x;
                    const nz = car.currentTile.z + d.z;
                    if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE) {
                        const neighbor = sim.state.grid[nx][nz];
                        if (neighbor && neighbor.tileType === TILES.ROAD && neighbor.connected) {
                            viableNeighbors.push({ x: nx, z: nz });
                        }
                    }
                });
                if (viableNeighbors.length > 0) {
                    const chosen = viableNeighbors[Math.floor(Math.random() * viableNeighbors.length)];
                    car.targetTile = { x: chosen.x, z: chosen.z };
                    car.progress = 0.0;
                } else {
                    car.targetTile = { x: car.currentTile.x, z: car.currentTile.z };
                    car.progress = 0.0;
                }
            }

            const startPos = this.getTileWorldPos(car.currentTile.x, car.currentTile.z);
            const endPos = this.getTileWorldPos(car.targetTile.x, car.targetTile.z);
            car.mesh.position.lerpVectors(startPos, endPos, car.progress);
            const dir = new THREE.Vector3().subVectors(endPos, startPos);
            if (dir.lengthSq() > 0.001) {
                car.mesh.rotation.y = Math.atan2(dir.x, dir.z);
            }
        }

        // 2. DYNAMIC NPC POPULATION SCALING (Math.min(150, Math.floor(pop * 0.8)) with minimum of 3 if pop > 0)
        const maxNpcs = sim.state.population > 0 
            ? Math.max(3, Math.min(150, Math.floor(sim.state.population * 0.8)))
            : 0;

        if (this.activeNpcs.length < maxNpcs && spawnableBuildingCoords.length > 0) {
            const parentCell = spawnableBuildingCoords[Math.floor(Math.random() * spawnableBuildingCoords.length)];
            if (parentCell) {
                const npcMesh = this.createNpcMesh();
                this.scene.add(npcMesh);
                const rootPos = this.getTileWorldPos(parentCell.x, parentCell.z);
                npcMesh.position.copy(rootPos);
                this.activeNpcs.push({
                    mesh: npcMesh,
                    spawnTile: { x: parentCell.x, z: parentCell.z },
                    state: "idle",
                    targetPos: new THREE.Vector3().copy(rootPos),
                    timer: 1.0 + Math.random() * 2.0,
                    speed: 0.6 + Math.random() * 0.4
                });
            }
        }

        for (let i = this.activeNpcs.length - 1; i >= 0; i--) {
            const npc = this.activeNpcs[i];
            const homeObj = sim.state.grid[npc.spawnTile.x][npc.spawnTile.z];

            if (!homeObj || homeObj.tileType !== TILES.BUILDING || !homeObj.connected) {
                this.scene.remove(npc.mesh);
                this.activeNpcs.splice(i, 1);
                continue;
            }

            if (npc.state === "idle") {
                npc.timer -= delta;
                npc.mesh.position.y = 0;

                if (npc.timer <= 0) {
                    if (npc.nextState === "returning") {
                        const homePos = this.getTileWorldPos(npc.spawnTile.x, npc.spawnTile.z);
                        npc.targetPos.set(homePos.x + (Math.random() - 0.5) * 0.4, 0, homePos.z + (Math.random() - 0.5) * 0.4);
                        npc.state = "returning";
                        npc.nextState = null;
                    } else {
                        const dec = Math.random();

                        const commercialTiles = [];
                        const roadTiles = [];
                        for (let x = 0; x < GRID_SIZE; x++) {
                            for (let z = 0; z < GRID_SIZE; z++) {
                                const cell = sim.state.grid[x][z];
                                if (cell.connected) {
                                    if (cell.tileType === TILES.BUILDING && ['shop', 'cafe', 'supermarket', 'megamall', 'park', 'school', 'stadium', 'landmark'].includes(cell.buildingType)) {
                                        commercialTiles.push({ x, z });
                                    } else if (cell.tileType === TILES.ROAD) {
                                        roadTiles.push({ x, z });
                                    }
                                }
                            }
                        }

                        if (dec < 0.4 && commercialTiles.length > 0) {
                            const targetShop = commercialTiles[Math.floor(Math.random() * commercialTiles.length)];
                            const shopPos = this.getTileWorldPos(targetShop.x, targetShop.z);
                            npc.targetPos.set(shopPos.x + (Math.random() - 0.5) * 0.8, 0, shopPos.z + (Math.random() - 0.5) * 0.8);
                            npc.state = "shopping";
                        } else if (dec < 0.65 && roadTiles.length > 0) {
                            const targetRoad = roadTiles[Math.floor(Math.random() * roadTiles.length)];
                            const roadPos = this.getTileWorldPos(targetRoad.x, targetRoad.z);
                            npc.targetPos.set(roadPos.x + (Math.random() - 0.5) * 0.5, 0, roadPos.z + (Math.random() - 0.5) * 0.5);
                            npc.state = "wander";
                        } else {
                            const origin = this.getTileWorldPos(npc.spawnTile.x, npc.spawnTile.z);
                            const radius = TILE_SIZE * 0.4;
                            const rx = origin.x + (Math.random() - 0.5) * radius * 2;
                            const rz = origin.z + (Math.random() - 0.5) * radius * 2;
                            npc.targetPos.set(rx, 0, rz);
                            npc.state = "wander";
                        }
                    }
                }
            } else if (npc.state === "wander" || npc.state === "shopping" || npc.state === "returning") {
                const flatNpcPos = new THREE.Vector3(npc.mesh.position.x, 0, npc.mesh.position.z);
                const distVec = new THREE.Vector3().subVectors(npc.targetPos, flatNpcPos);
                const distance = distVec.length();

                if (distance < 0.15) {
                    if (npc.state === "shopping") {
                        npc.state = "idle";
                        npc.timer = 1.5 + Math.random() * 2.0;
                        npc.nextState = "returning";
                    } else {
                        npc.state = "idle";
                        npc.timer = 2.0 + Math.random() * 3.0;
                    }
                } else {
                    const stepDir = distVec.normalize();
                    npc.mesh.position.addScaledVector(stepDir, npc.speed * delta);
                    npc.mesh.rotation.y = Math.atan2(stepDir.x, stepDir.z);
                    npc.mesh.position.y = Math.abs(Math.sin(Date.now() * 0.012)) * 0.08;
                }
            }
        }
    }

    triggerPuffParticle(gridX, gridZ) {
        const worldPos = this.getTileWorldPos(gridX, gridZ);
        for (let i = 0; i < 8; i++) {
            this.smokeSystem.spawn(worldPos.x, 0.4, worldPos.z);
        }
    }

    emitPlottedIndustrialSmoke() {
        const sim = this.game.simulation;
        if (!sim) return;

        for (let x = 0; x < GRID_SIZE; x++) {
            for (let z = 0; z < GRID_SIZE; z++) {
                const cell = sim.state.grid[x][z];
                if (cell.tileType === TILES.BUILDING && cell.connected) {
                    const worldX = x * TILE_SIZE + WORLD_OFFSET + TILE_SIZE / 2;
                    const worldZ = z * TILE_SIZE + WORLD_OFFSET + TILE_SIZE / 2;
                    if (cell.buildingType === 'house' && Math.random() < 0.04) {
                        this.smokeSystem.spawn(worldX + 0.4, (1.2 * cell.level) + 0.7, worldZ + 0.4);
                    } else if (cell.buildingType === 'factory' && Math.random() < 0.12) {
                        this.smokeSystem.spawn(worldX - 0.7, 1.4 + (cell.level * 0.5) + 0.5, worldZ - 0.5);
                    }
                }
            }
        }
    }

    tick(delta) {
        if (this.targetVelocity.lengthSq() > 0.00001) {
            this.cameraTarget.add(this.targetVelocity);
            this.cameraTarget.x = Math.max(-25, Math.min(this.cameraTarget.x, 25));
            this.cameraTarget.z = Math.max(-25, Math.min(this.cameraTarget.z, 25));
            this.targetVelocity.multiplyScalar(0.9);
            this.updateCamera();
        }
        if (Math.abs(this.zoomVelocity) > 0.005) {
            this.cameraZoom += this.zoomVelocity;
            this.cameraZoom = Math.max(12, Math.min(this.cameraZoom, 200));
            this.zoomVelocity *= 0.85;
            this.updateCamera();
        }
        if (Math.abs(this.angleYVelocity) > 0.001) {
            this.cameraAngleY += this.angleYVelocity;
            this.angleYVelocity *= 0.9;
            this.updateCamera();
        }
        if (Math.abs(this.angleXVelocity) > 0.001) {
            this.cameraAngleX += this.angleXVelocity;
            this.cameraAngleX = Math.max(0.2, Math.min(1.2, this.cameraAngleX));
            this.angleXVelocity *= 0.9;
            this.updateCamera();
        }

        // Animate placed buildings growing
        for (let i = this.animatingPlacements.length - 1; i >= 0; i--) {
            const anim = this.animatingPlacements[i];
            const elapsed = Date.now() - anim.startTime;
            const progress = Math.min(1.0, elapsed / anim.duration);
            const scaleBouncy = progress === 1.0 ? 1.0 : (progress < 0.7 ? (progress / 0.7) * 1.12 : 1.12 - ((progress - 0.7) / 0.3) * 0.12);
            anim.mesh.scale.set(scaleBouncy, scaleBouncy, scaleBouncy);
            if (progress >= 1.0) {
                this.animatingPlacements.splice(i, 1);
            }
        }

        Object.keys(this.renderedMeshes).forEach(key => {
            const mesh = this.renderedMeshes[key];
            if (mesh && mesh.children.length > 2) {
                const lastNode = mesh.children[mesh.children.length - 1];
                if (lastNode && lastNode.geometry && lastNode.geometry.type === "RingGeometry") {
                    lastNode.rotation.z += 0.025;
                    lastNode.position.y = 5.2 + Math.sin(Date.now() * 0.003) * 0.08;
                }
            }
        });

        const sim = this.game.simulation;
        if (sim) {
            sim.state.timeOfDay = (sim.state.timeOfDay + delta * 0.08) % 24;

            if (sim.state.weatherTimer !== undefined) {
                sim.state.weatherTimer -= delta;
                if (sim.state.weatherTimer <= 0) {
                    sim.state.weatherTimer = 40 + Math.random() * 40;
                    const weathers = ['sunny', 'rain', 'snow'];
                    sim.state.weather = weathers[Math.floor(Math.random() * weathers.length)];
                    if (this.game.ui) this.game.ui.showToast(`Weather is now ${sim.state.weather.toUpperCase()}!`, "info");
                }
            }

            const angle = (sim.state.timeOfDay / 24) * Math.PI * 2;
            if (this.lights.directional) {
                this.lights.directional.position.x = Math.cos(angle) * 20;
                this.lights.directional.position.y = Math.max(0.1, Math.sin(angle)) * 25;
                this.lights.directional.position.z = Math.sin(angle) * 20;
            }

            const isNight = sim.state.timeOfDay < 6 || sim.state.timeOfDay > 18;

            if (this.lights.hemisphere) {
                const dayAmbientColor = new THREE.Color(0xfffbeb);
                const nightAmbientColor = new THREE.Color(0x0f172a);
                this.lights.hemisphere.color.lerp(isNight ? nightAmbientColor : dayAmbientColor, 0.1);
                this.lights.hemisphere.intensity = isNight ? 0.35 : 0.7;
            }

            if (this.lights.directional) {
                const daySunColor = new THREE.Color(0xfffbeb);
                const nightSunColor = new THREE.Color(0x1d4ed8);
                this.lights.directional.color.lerp(isNight ? nightSunColor : daySunColor, 0.1);
                this.lights.directional.intensity = isNight ? 0.15 : 1.0;
            }

            const winGlowMat = MaterialCache.getStandard(0xfef08a);
            if (winGlowMat) {
                winGlowMat.emissiveIntensity = isNight ? 0.95 : 0.05;
            }

            this.scene.traverse(child => {
                if (child.name === "siren") {
                    child.material.emissiveIntensity = Math.sin(Date.now() * 0.015) > 0.0 ? 1.5 : 0.1;
                } else if (child.name === "propeller") {
                    child.rotation.z += 5.0 * delta;
                }
            });

            if (this.weatherSystem) {
                this.weatherSystem.update(delta, sim.state.weather);
            }
        }

        if (this.smokeSystem) this.smokeSystem.update(delta);
        this.updateEntities(delta);
        this.renderer.render(this.scene, this.camera);
    }
}

// --- 6. UI OVERLAYS MANAGER ---
class UIManager {
    constructor(game) {
        this.game = game;
        this.selectedTool = null;
        this.buildTypeSelected = null;
        this.landscapeTypeSelected = null;
    }

    init() {
        const cityNameInput = document.getElementById('hud-city-name');
        if (cityNameInput) {
            cityNameInput.addEventListener('change', (e) => {
                this.game.simulation.state.cityName = e.target.value;
                this.game.simulation.saveGame();
            });
        }
        const aiInput = document.getElementById('ai-advisor-input');
        if (aiInput) {
            aiInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const val = aiInput.value.trim();
                    if (val) {
                        this.game.simulation.runCustomStrategicAdvisor(val);
                        aiInput.value = '';
                    }
                }
            });
        }
        this.updateSoundButtonState(this.game.audio.isMuted);
        this.renderNewspaperUI();
        this.renderQuestUI();
    }

    updateSoundButtonState(muted) {
        const btn = document.getElementById('btn-sound-hud');
        if (!btn) return;
        if (muted) {
            btn.innerHTML = `<svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path stroke-linecap="round" stroke-linejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>`;
        } else {
            btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>`;
        }
    }

    updateHUD() {
        const state = this.game.simulation.state;
        const badge = document.getElementById('hud-level-badge');
        if (badge) badge.innerText = state.level;

        const tier = document.getElementById('hud-city-tier');
        if (tier) {
            const currentTier = TIERS.find(t => t.level === state.level) || TIERS[0];
            tier.innerText = currentTier.name.toUpperCase();
        }

        const xpText = document.getElementById('hud-xp-text');
        const xpFill = document.getElementById('hud-xp-fill');
        if (xpText && xpFill) {
            const currentTier = TIERS.find(t => t.level === state.level) || TIERS[0];
            xpText.innerText = `${state.xp}/${currentTier.maxXp}`;
            xpFill.style.width = `${Math.min(100, Math.floor((state.xp / currentTier.maxXp) * 100))}%`;
        }

        const coinsHUD = document.getElementById('hud-coins');
        const coinsRateHUD = document.getElementById('hud-coin-rate');
        if (coinsHUD) coinsHUD.innerText = `🪙 ${state.coins.toLocaleString()}`;
        if (coinsRateHUD) coinsRateHUD.innerText = `+${state.coinGenRate}/s`;

        const popHUD = document.getElementById('hud-pop');
        const popCapHUD = document.getElementById('hud-pop-cap');
        if (popHUD) popHUD.innerText = `👥 ${state.population}`;
        if (popCapHUD) popCapHUD.innerText = `Max: ${state.populationCap}`;

        const happyHUD = document.getElementById('hud-happy');
        const happyStatusHUD = document.getElementById('hud-happy-status');
        if (happyHUD) happyHUD.innerText = `❤️ ${state.happiness}%`;
        if (happyStatusHUD) {
            let status = "Ecstatic";
            if (state.happiness < 30) status = "Rebellious";
            else if (state.happiness < 60) status = "Discontent";
            else if (state.happiness < 85) status = "Satisfied";
            happyStatusHUD.innerText = status;
        }

        const pollutionHUD = document.getElementById('hud-pollution');
        const pollutionStatusHUD = document.getElementById('hud-pollution-status');
        if (pollutionHUD) pollutionHUD.innerText = `🌫️ ${state.pollution}%`;
        if (pollutionStatusHUD) {
            let status = "Pure Air";
            if (state.pollution > 60) status = "Smog Choked";
            else if (state.pollution > 30) status = "Hazy Skies";
            else if (state.pollution > 10) status = "Light Smog";
            pollutionStatusHUD.innerText = status;
        }
    }

    showConnectivityWarning(visible) {
        const banner = document.getElementById('connectivity-warning');
        if (banner) {
            if (visible) banner.classList.remove('hidden');
            else banner.classList.add('hidden');
        }
    }

    showToast(message, type = "info") {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl z-50 text-xs font-semibold game-font tracking-wide pointer-events-none transition-all duration-300 opacity-0 translate-y-4`;

        let icon = `ℹ️`;
        if (type === "success") icon = `✅`;
        if (type === "warn" || type === "coins") icon = `⚠️`;
        if (type === "error" || type === "lock") icon = `🚫`;

        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.remove('opacity-0', 'translate-y-4'), 10);
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-4');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    openModal(title, content, actions) {
        const mTitle = document.getElementById('modal-title');
        const mContent = document.getElementById('modal-content');
        const mActions = document.getElementById('modal-actions');
        const mOverlay = document.getElementById('overlay-modal');

        if (mTitle) mTitle.innerText = title;
        if (mContent) mContent.innerHTML = content;
        if (mActions) mActions.innerHTML = actions;
        if (mOverlay) mOverlay.classList.remove('hidden');
    }

    closeModal() {
        const mOverlay = document.getElementById('overlay-modal');
        if (mOverlay) mOverlay.classList.add('hidden');
    }

    openBuildDrawer() {
        this.game.audio.init();
        this.game.audio.playSound('click');
        this.resetMenuButtonsActive();

        const btn = document.getElementById('btn-menu-build');
        if (btn) {
            btn.classList.add('bg-indigo-600', 'text-white');
            btn.classList.remove('bg-slate-800', 'text-slate-300');
        }
        const dTitle = document.getElementById('drawer-title');
        if (dTitle) dTitle.innerHTML = `🔨 Construction Menu`;

        const grid = document.getElementById('drawer-grid');
        if (grid) {
            grid.innerHTML = '';
            const level = this.game.simulation.state.level;

            Object.keys(BUILDING_TYPES).forEach(key => {
                const b = BUILDING_TYPES[key];
                const locked = level < b.unlockLevel;

                const card = document.createElement('div');
                card.className = `flex flex-col items-center p-2 rounded-2xl border ${
                    locked 
                        ? 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60' 
                        : 'bg-slate-850 hover:bg-slate-800 border-slate-700/60 text-white active:scale-95'
                } transition cursor-pointer relative`;

                if (locked) {
                    card.innerHTML = `
                        <div class="absolute inset-0 bg-slate-950/80 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-400 text-xs">
                          🔒 LVL ${b.unlockLevel}
                        </div>
                        <span class="text-xs font-bold text-center">${b.name}</span>
                    `;
                } else {
                    card.innerHTML = `
                        <span class="text-xs font-bold text-center truncate w-full">${b.name}</span>
                        <span class="text-[9px] font-bold text-yellow-400 mt-1 flex items-center gap-0.5 font-mono">
                          🪙 ${b.cost}
                        </span>
                    `;
                    card.addEventListener('click', () => this.selectBuildTool(key));
                }
                grid.appendChild(card);
            });
        }
        const drawer = document.getElementById('action-drawer');
        if (drawer) drawer.style.height = '210px';
    }

    selectBuildTool(key) {
        this.game.audio.playSound('click');
        this.selectedTool = 'build';
        this.buildTypeSelected = key;

        const overlay = document.getElementById('placement-overlay');
        const overlayName = document.getElementById('tool-overlay-name');
        const overlayIcon = document.getElementById('tool-overlay-icon');

        if (overlay) overlay.classList.remove('translate-y-20', 'opacity-0');
        if (overlayName) overlayName.innerText = BUILDING_TYPES[key.toUpperCase()].name;
        if (overlayIcon) {
            overlayIcon.innerHTML = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`;
        }
        if (this.game.engine) this.game.engine.setupHoverMesh(false);
        this.closeDrawer();
    }

    selectRoadTool() {
        this.game.audio.init();
        this.game.audio.playSound('click');
        this.resetMenuButtonsActive();

        const btn = document.getElementById('btn-menu-roads');
        if (btn) {
            btn.classList.add('bg-indigo-600', 'text-white');
            btn.classList.remove('bg-slate-800', 'text-slate-300');
        }
        this.selectedTool = 'road';

        const overlay = document.getElementById('placement-overlay');
        const overlayName = document.getElementById('tool-overlay-name');
        const overlayIcon = document.getElementById('tool-overlay-icon');

        if (overlay) overlay.classList.remove('translate-y-20', 'opacity-0');
        if (overlayName) overlayName.innerText = "Asphalt Road Network ($15)";
        if (overlayIcon) {
            overlayIcon.innerHTML = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>`;
        }
        if (this.game.engine) this.game.engine.setupHoverMesh(false);
        this.closeDrawer();
    }

    openLandscapeDrawer() {
        this.game.audio.init();
        this.game.audio.playSound('click');
        this.resetMenuButtonsActive();

        const btn = document.getElementById('btn-menu-landscape');
        if (btn) {
            btn.classList.add('bg-indigo-600', 'text-white');
            btn.classList.remove('bg-slate-800', 'text-slate-300');
        }
        const dTitle = document.getElementById('drawer-title');
        if (dTitle) dTitle.innerHTML = `🌲 Terrain Landscaping`;

        const grid = document.getElementById('drawer-grid');
        if (grid) {
            grid.innerHTML = '';
            const items = [
                { key: 'grass', name: 'Meadow Grass', cost: 0, text: 'FREE' },
                { key: 'dirt', name: 'Dirt Ground', cost: 0, text: 'FREE' },
                { key: 'water', name: 'Scenic Water', cost: 10, text: '🪙 10' }
            ];
            items.forEach(t => {
                const card = document.createElement('div');
                card.className = `flex flex-col items-center p-2.5 rounded-2xl border bg-slate-850 hover:bg-slate-850 border-slate-700/60 text-white active:scale-95 transition cursor-pointer`;
                card.innerHTML = `
                    <span class="text-xs font-bold text-center truncate w-full">${t.name}</span>
                    <span class="text-[9px] font-bold text-yellow-400 mt-1 font-mono">${t.text}</span>
                `;
                card.addEventListener('click', () => this.selectLandscapeTool(t.key));
                grid.appendChild(card);
            });
        }
        const drawer = document.getElementById('action-drawer');
        if (drawer) drawer.style.height = '210px';
    }

    selectLandscapeTool(key) {
        this.game.audio.playSound('click');
        this.selectedTool = 'landscape';
        this.landscapeTypeSelected = key;

        const overlay = document.getElementById('placement-overlay');
        const overlayName = document.getElementById('tool-overlay-name');
        const overlayIcon = document.getElementById('tool-overlay-icon');

        if (overlay) overlay.classList.remove('translate-y-20', 'opacity-0');
        if (overlayName) overlayName.innerText = `Paint ${key.toUpperCase()} (${key === 'water' ? '$10' : 'FREE'})`;
        if (overlayIcon) {
            overlayIcon.innerHTML = `🖌️`;
        }
        if (this.game.engine) this.game.engine.setupHoverMesh(false);
        this.closeDrawer();
    }

    selectDemolishTool() {
        this.game.audio.init();
        this.game.audio.playSound('click');
        this.resetMenuButtonsActive();

        const btn = document.getElementById('btn-menu-demolish');
        if (btn) {
            btn.classList.add('bg-rose-600', 'text-white');
            btn.classList.remove('bg-slate-800', 'text-slate-300');
        }
        this.selectedTool = 'demolish';

        const overlay = document.getElementById('placement-overlay');
        const overlayName = document.getElementById('tool-overlay-name');
        const overlayIcon = document.getElementById('tool-overlay-icon');

        if (overlay) overlay.classList.remove('translate-y-20', 'opacity-0');
        if (overlayName) overlayName.innerText = "Bulldozer Mode (FREE)";
        if (overlayIcon) {
            overlayIcon.innerHTML = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`;
        }
        if (this.game.engine) this.game.engine.setupHoverMesh(true);
        this.closeDrawer();
    }

    selectUpgradeTool() {
        this.game.audio.init();
        this.game.audio.playSound('click');
        this.resetMenuButtonsActive();

        const btn = document.getElementById('btn-menu-upgrade');
        if (btn) {
            btn.classList.add('bg-green-600', 'text-white');
            btn.classList.remove('bg-slate-800', 'text-slate-300');
        }
        this.selectedTool = 'upgrade';

        const overlay = document.getElementById('placement-overlay');
        const overlayName = document.getElementById('tool-overlay-name');
        const overlayIcon = document.getElementById('tool-overlay-icon');

        if (overlay) overlay.classList.remove('translate-y-20', 'opacity-0');
        if (overlayName) overlayName.innerText = "Upgrade Level (80% Cost)";
        if (overlayIcon) {
            overlayIcon.innerHTML = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 11l7-7 7 7M5 19l7-7 7 7"/></svg>`;
        }
        if (this.game.engine) this.game.engine.setupHoverMesh(false);
        this.closeDrawer();
    }

    cancelPlacement() {
        this.selectedTool = null;
        this.buildTypeSelected = null;
        this.landscapeTypeSelected = null;
        const overlay = document.getElementById('placement-overlay');
        if (overlay) overlay.classList.add('translate-y-20', 'opacity-0');
        if (this.game.engine) this.game.engine.clearHoverMesh();
        this.resetMenuButtonsActive();
    }

    resetMenuButtonsActive() {
        const btns = ['btn-menu-build', 'btn-menu-roads', 'btn-menu-landscape', 'btn-menu-upgrade', 'btn-menu-demolish', 'btn-menu-missions', 'btn-menu-badges'];
        btns.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('bg-indigo-600', 'bg-rose-600', 'bg-green-600', 'text-white');
                el.classList.add('bg-slate-800', 'text-slate-300');
            }
        });
    }

    openMissionsDrawer() {
        this.game.audio.init();
        this.game.audio.playSound('click');
        this.resetMenuButtonsActive();

        const btn = document.getElementById('btn-menu-missions');
        if (btn) {
            btn.classList.add('bg-indigo-600', 'text-white');
            btn.classList.remove('bg-slate-800', 'text-slate-300');
        }

        const dTitle = document.getElementById('drawer-title');
        if (dTitle) dTitle.innerHTML = `📋 Active Objectives`;

        const grid = document.getElementById('drawer-grid');
        if (grid) {
            grid.innerHTML = '';
            this.game.simulation.checkMissionsProgress();

            this.game.simulation.state.missions.forEach(mission => {
                const item = document.createElement('div');
                item.className = `col-span-3 p-2.5 rounded-2xl bg-slate-850 border border-slate-700/60 flex items-center justify-between text-white text-left`;
                item.innerHTML = `
                    <div class="flex flex-col max-w-[70%]">
                      <span class="text-xs font-bold game-font leading-snug">${mission.text}</span>
                      <div class="flex gap-2 mt-1">
                        <span class="text-[9px] text-yellow-400 font-bold flex items-center gap-0.5 font-mono font-bold">🪙 +${mission.reward}</span>
                        <span class="text-[9px] text-indigo-400 font-bold flex items-center gap-0.5 font-mono font-bold">⭐ +${mission.xp} XP</span>
                      </div>
                    </div>
                    <div class="w-8 h-8 rounded-full flex items-center justify-center ${
                      mission.done 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }">
                      <span class="text-xs">${mission.done ? '✅' : '⏳'}</span>
                    </div>
                `;
                grid.appendChild(item);
            });
        }
        const drawer = document.getElementById('action-drawer');
        if (drawer) drawer.style.height = '210px';
    }

    openBadgesDrawer() {
        this.game.audio.init();
        this.game.audio.playSound('click');
        this.resetMenuButtonsActive();

        const btn = document.getElementById('btn-menu-badges');
        if (btn) {
            btn.classList.add('bg-indigo-600', 'text-white');
            btn.classList.remove('bg-slate-800', 'text-slate-300');
        }
        const dTitle = document.getElementById('drawer-title');
        if (dTitle) dTitle.innerHTML = `🏅 City Hall Achievements`;

        const grid = document.getElementById('drawer-grid');
        if (grid) {
            grid.innerHTML = '';
            const badges = this.game.simulation.state.badges;

            Object.keys(badges).forEach(key => {
                const b = badges[key];
                const earned = b.earned;

                const item = document.createElement('div');
                item.className = `col-span-3 p-2 rounded-2xl border text-left ${
                  earned ? 'bg-slate-850 border-pink-500/40 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-500'
                } flex items-center gap-3`;
                item.innerHTML = `
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center ${
                    earned ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-slate-800'
                  }">
                    🏆
                  </div>
                  <div class="flex flex-col">
                    <span class="text-xs font-bold game-font leading-tight">${b.name}</span>
                    <span class="text-[9px] leading-snug ${earned ? 'text-slate-300' : 'text-slate-500'}">${b.desc}</span>
                  </div>
                `;
                grid.appendChild(item);
            });
        }
        const drawer = document.getElementById('action-drawer');
        if (drawer) drawer.style.height = '210px';
    }

    closeDrawer() {
        const drawer = document.getElementById('action-drawer');
        if (drawer) drawer.style.height = '0px';
        this.resetMenuButtonsActive();
    }

    advanceTutorial() {
        const sim = this.game.simulation;
        sim.state.tutorialStep += 1;

        if (sim.state.tutorialStep === 1) {
            const title = "Welcome to Tiny Town!";
            const content = `
                <div class="space-y-3 text-center">
                  <div class="w-14 h-14 bg-indigo-500/20 rounded-full flex items-center justify-center text-sky-400 text-2xl mx-auto border border-sky-400/30">🎓</div>
                  <p class="text-slate-300 text-xs leading-relaxed">Let's build your first house! Residences house citizens, who pay taxes that populate your treasury funds.</p>
                  <div class="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-[11px] text-indigo-300 font-bold uppercase tracking-wider font-mono">Goal: Build 1 Residential House</div>
                </div>
            `;
            const actions = `<button id="modal-tut-btn" class="game-font w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold rounded-2xl transition">LET'S BUILD!</button>`;
            this.openModal(title, content, actions);
            document.getElementById('modal-tut-btn').addEventListener('click', () => {
                this.closeModal(); this.openBuildDrawer();
            });
        } else if (sim.state.tutorialStep === 2) {
            const title = "Connect with Roads";
            const content = `
                <div class="space-y-3 text-center">
                  <div class="w-14 h-14 bg-indigo-500/20 rounded-full flex items-center justify-center text-yellow-400 text-2xl mx-auto border border-yellow-400/30">🛣️</div>
                  <p class="text-slate-300 text-xs leading-relaxed">Good! Buildings must connect to the Town Hall via pathways. Disconnected structures stop tax generation.</p>
                  <div class="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-[11px] text-indigo-300 font-bold uppercase tracking-wider font-mono">Goal: Draw a Road adjacent to the House</div>
                </div>
            `;
            const actions = `<button id="modal-tut-btn" class="game-font w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold rounded-2xl transition">SELECT ROAD TOOL</button>`;
            this.openModal(title, content, actions);
            document.getElementById('modal-tut-btn').addEventListener('click', () => {
                this.closeModal(); this.selectRoadTool();
            });
        } else if (sim.state.tutorialStep === 3) {
            const title = "Tutorial Accomplished!";
            const content = `
                <div class="space-y-3 text-center">
                  <div class="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 text-2xl mx-auto border border-emerald-400/30">👍</div>
                  <p class="text-slate-300 text-xs leading-relaxed">Perfect! Your house is now connected and earning coins! Keep growing, manage pollution with parks, build cafes, and paint custom landscaping terrain!</p>
                </div>
            `;
            const actions = `<button id="modal-tut-btn" class="game-font w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition">START TYCOON EMPIRE!</button>`;
            this.openModal(title, content, actions);
            document.getElementById('modal-tut-btn').addEventListener('click', () => this.closeModal());
            sim.state.tutorialStep = -1;
            sim.saveGame();
        }
    }

    showFloatingText(text, gridX, gridZ) {
        const container = document.getElementById('floater-container');
        if (!container || !this.game.engine) return;

        const el = document.createElement('div');
        const isCost = text.startsWith('-');
        const colorClass = isCost ? "text-rose-400" : "text-yellow-400";
        el.className = `absolute text-xs ${colorClass} font-bold game-font floating-coin pointer-events-none drop-shadow-md whitespace-nowrap`;
        el.innerText = text;

        const posX = gridX * TILE_SIZE + WORLD_OFFSET + TILE_SIZE / 2;
        const posZ = gridZ * TILE_SIZE + WORLD_OFFSET + TILE_SIZE / 2;
        const vec = new THREE.Vector3(posX, 1.5, posZ);

        const updatePos = () => {
            if (!el.parentNode) return;
            const tempV = vec.clone().project(this.game.engine.camera);
            const rect = container.getBoundingClientRect();
            const x = (tempV.x * 0.5 + 0.5) * rect.width;
            const y = (tempV.y * -0.5 + 0.5) * rect.height;
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            requestAnimationFrame(updatePos);
        };
        container.appendChild(el);
        updatePos();
        setTimeout(() => { if (el.parentNode) el.remove(); }, 1200);
    }

    showLevelUpModal(level) {
        const currentTier = TIERS.find(t => t.level === level) || TIERS[0];
        const title = `Level Up! City Level ${level}`;
        const content = `
          <div class="flex flex-col items-center text-center space-y-3">
            <div class="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center text-yellow-400 text-3xl pulse-active border border-yellow-400/30">🏆</div>
            <p class="font-bold game-font text-lg text-white">Your City is now a <span class="text-indigo-400 uppercase font-extrabold">${currentTier.name}</span>!</p>
            <p class="text-slate-300 text-xs">Unlocked borders! Construction grid size expanded to <span class="font-bold text-white">${currentTier.maxGrid}x${currentTier.maxGrid}</span>.</p>
          </div>
        `;
        const actions = `<button id="btn-lvlup-ok" class="game-font w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold text-center rounded-2xl shadow-md border-b-4 border-yellow-600 transition active:scale-95">AWESOME!</button>`;
        this.openModal(title, content, actions);
        document.getElementById('btn-lvlup-ok').addEventListener('click', () => this.closeModal());
    }

    showBadgeAwardedModal(badge) {
        const title = `New Achievement Earned!`;
        const content = `
          <div class="flex flex-col items-center text-center space-y-3">
            <div class="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-400 text-3xl border border-pink-400/30">🏆</div>
            <p class="font-bold game-font text-lg text-white">${badge.name}</p>
            <p class="text-slate-300 text-xs">${badge.desc}</p>
          </div>
        `;
        const actions = `<button id="btn-badge-ok" class="game-font w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-center rounded-2xl transition active:scale-95">COLLECT BADGE</button>`;
        this.openModal(title, content, actions);
        document.getElementById('btn-badge-ok').addEventListener('click', () => this.closeModal());
    }

    showQuestCompletedModal(quest) {
        const title = `✨ Spark Quest Completed!`;
        const content = `
          <div class="text-center flex flex-col items-center space-y-2">
            <div class="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-2xl border border-green-500/30">🌟</div>
            <p class="font-bold text-white text-base">Quest Achieved: "${quest.headline}"</p>
            <p class="text-xs text-slate-300 leading-relaxed">Successfully constructed required ${BUILDING_TYPES[quest.targetBuilding.toUpperCase()].name}! Collect rewards in the AI Office.</p>
          </div>
        `;
        const actions = `<button id="btn-quest-claim" class="game-font w-full py-2.5 bg-green-500 hover:bg-green-400 text-slate-950 font-bold rounded-xl transition">COLLECT REWARD</button>`;
        this.openModal(title, content, actions);
        document.getElementById('btn-quest-claim').addEventListener('click', () => {
            this.closeModal();
            document.getElementById('ai-advisor-modal').classList.remove('hidden');
            switchAiTab('quest');
        });
    }

    setCityNameInputValue(val) {
        const input = document.getElementById('hud-city-name');
        if (input) input.value = val;
    }

    showContinueButton() {
        const btn = document.getElementById('btn-continue');
        if (btn) btn.classList.remove('hidden');
    }

    showNewspaperLoading() {
        const container = document.getElementById('chronicle-headlines-container');
        if (container) {
            container.innerHTML = `
              <div class="flex flex-col items-center justify-center py-6 text-slate-700">
                <svg class="w-8 h-8 animate-spin text-indigo-500 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4"/></svg>
                <p class="text-xs font-bold font-mono font-bold">PRINTING NEWSPAPER WITH AI...</p>
              </div>
            `;
        }
    }

    renderNewspaperUI() {
        const paper = this.game.simulation.state.currentNewspaper;
        const title = document.getElementById('chronicle-title');
        const container = document.getElementById('chronicle-headlines-container');

        if (title && paper) title.innerText = paper.title.toUpperCase();
        if (container && paper) {
            container.innerHTML = `
                <div class="space-y-4 text-slate-900">
                  <div class="border-b border-dashed border-slate-400 pb-2">
                    <h3 class="font-extrabold text-sm uppercase text-indigo-900">📰 ${paper.headline1}</h3>
                    <p class="text-xs text-slate-700 mt-1 leading-relaxed italic">"${paper.story1}"</p>
                  </div>
                  <div class="border-b border-dashed border-slate-400 pb-2">
                    <h3 class="font-extrabold text-sm uppercase text-indigo-900">📰 ${paper.headline2}</h3>
                    <p class="text-xs text-slate-700 mt-1 leading-relaxed italic">"${paper.story2}"</p>
                  </div>
                  <div>
                    <h3 class="font-extrabold text-sm uppercase text-indigo-900">📰 ${paper.headline3}</h3>
                    <p class="text-xs text-slate-700 mt-1 leading-relaxed italic">"${paper.story3}"</p>
                  </div>
                </div>
            `;
        }
    }

    showQuestDrafting() {
        const story = document.getElementById('ai-quest-story');
        if (story) {
            story.innerHTML = `
                <div class="flex items-center gap-2 text-slate-400 py-4 font-mono text-[11px] font-bold">
                  <svg class="w-4 h-4 animate-spin text-indigo-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/></svg>
                  FORMULATING DYNAMIC QUEST PLANS...
                </div>
            `;
        }
    }

    renderQuestUI() {
        const q = this.game.simulation.state.aiQuest;
        const headline = document.getElementById('ai-quest-headline');
        const title = document.getElementById('ai-quest-title');
        const story = document.getElementById('ai-quest-story');
        const pBox = document.getElementById('ai-quest-progress-box');
        const claimBtn = document.getElementById('btn-claim-ai-quest');

        if (!q || !q.active) {
            if (headline) headline.innerText = "UNASSIGNED";
            if (title) title.innerText = "Dynamic AI Objective";
            if (story) story.innerText = "No special quest issued. Let the AI advisor analyze city borders and draft objective storylines!";
            if (pBox) pBox.classList.add('hidden');
            if (claimBtn) claimBtn.classList.add('hidden');
            return;
        }

        if (headline) headline.innerText = q.headline.toUpperCase();
        if (title) title.innerText = `Construct: 1x ${BUILDING_TYPES[q.targetBuilding.toUpperCase()].name}`;
        if (story) story.innerText = `"${q.story}"`;
        if (pBox) pBox.classList.remove('hidden');

        const current = this.game.simulation.countBuildings(q.targetBuilding);
        const targetCount = q.startCount + 1;
        const pct = Math.min(100, Math.floor((current / targetCount) * 100));

        const targetDesc = document.getElementById('ai-quest-target-desc');
        const progTxt = document.getElementById('ai-quest-progress-txt');
        const progBar = document.getElementById('ai-quest-progress-bar');
        const rewardCoins = document.getElementById('ai-quest-reward-coins');
        const rewardXp = document.getElementById('ai-quest-reward-xp');

        if (targetDesc) targetDesc.innerText = BUILDING_TYPES[q.targetBuilding.toUpperCase()].name;
        if (progTxt) progTxt.innerText = `${current} / ${targetCount}`;
        if (progBar) progBar.style.width = `${pct}%`;
        if (rewardCoins) rewardCoins.innerText = q.rewardCoins;
        if (rewardXp) rewardXp.innerText = q.rewardXp;

        if (claimBtn) {
            if (q.completed) claimBtn.classList.remove('hidden');
            else claimBtn.classList.add('hidden');
        }
    }

    appendUserChatBubble(text) {
        const chatBox = document.getElementById('ai-chat-box');
        if (!chatBox) return;
        const div = document.createElement('div');
        div.className = "flex gap-2.5 items-start justify-end";
        div.innerHTML = `
          <div class="bg-indigo-600 text-white p-2.5 rounded-2xl rounded-tr-none text-xs leading-relaxed max-w-[85%] font-medium">
            ${text}
          </div>
        `;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    appendLoadingChatBubble(text) {
        const chatBox = document.getElementById('ai-chat-box');
        if (!chatBox) return null;
        const bubbleId = "b_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        const div = document.createElement('div');
        div.id = bubbleId;
        div.className = "flex gap-2.5 items-start animate-pulse";
        div.innerHTML = `
          <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
            <svg class="w-4 h-4 animate-spin text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4"/></svg>
          </div>
          <div class="bg-slate-800 text-slate-500 p-2.5 rounded-2xl rounded-tl-none text-xs max-w-[85%] italic">
            ${text}
          </div>
        `;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
        return bubbleId;
    }

    removeLoadingChatBubble(id) {
        if (!id) return;
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    appendAiChatBubble(text) {
        const chatBox = document.getElementById('ai-chat-box');
        if (!chatBox) return;
        const div = document.createElement('div');
        div.className = "flex gap-2.5 items-start";
        div.innerHTML = `
          <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div class="bg-slate-800 text-slate-200 p-2.5 rounded-2xl rounded-tl-none text-xs leading-relaxed max-w-[85%] font-medium">
            ${text}
          </div>
        `;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    showStrategicOfficeSetup() {
        const savedKey = localStorage.getItem('gemini_api_key') || '';
        const savedProxy = localStorage.getItem('gemini_api_proxy') || '';

        const title = "Generative AI API Configuration";
        const content = `
          <div class="space-y-4 text-left font-medium">
            <p class="text-xs text-slate-300 leading-relaxed font-semibold">
              Unlock strategic advisors, newspapers, and dynamic quest scenarios safely with your own Gemini API keys.
            </p>
            <div class="space-y-2 font-bold">
              <label class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Gemini API Key</label>
              <input type="password" id="input-modal-api-key" value="${savedKey}" placeholder="AIzaSy..." class="w-full bg-slate-950 border border-slate-700 focus:outline-none focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white font-mono" />
            </div>
            <div class="space-y-2 font-bold">
              <label class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Proxy URL Endpoint (Optional)</label>
              <input type="text" id="input-modal-api-proxy" value="${savedProxy}" placeholder="https://endpoint..." class="w-full bg-slate-950 border border-slate-700 focus:outline-none focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white font-mono" />
            </div>
          </div>
        `;
        const actions = `<button id="btn-modal-api-save" class="game-font w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold text-xs rounded-xl transition">SAVE CONFIG</button>`;
        this.openModal(title, content, actions);

        document.getElementById('btn-modal-api-save').addEventListener('click', () => {
            const keyVal = document.getElementById('input-modal-api-key').value.trim();
            const proxyVal = document.getElementById('input-modal-api-proxy').value.trim();

            if (keyVal) localStorage.setItem('gemini_api_key', keyVal);
            else localStorage.removeItem('gemini_api_key');

            if (proxyVal) localStorage.setItem('gemini_api_proxy', proxyVal);
            else localStorage.removeItem('gemini_api_proxy');

            this.showToast("Credentials saved locally!", "success");
            this.closeModal();
        });
    }
}

// --- 7. COORDINATOR LIFE SYSTEM ---
class Game {
    constructor() {
        this.audio = new AudioController();
        this.simulation = new CitySimulation(this);
        this.engine = new RenderEngine(this);
        this.ui = new UIManager(this);

        this.clock = new THREE.Clock();
        this.accumulator = 0;
        this.tickInterval = 1.0;

        this.smokeTimer = 0;
        this.smokeInterval = 1.0;
    }

    init() {
        const container = document.getElementById('canvas-container');
        if (!container) return;

        this.engine.init(container);
        this.simulation.loadGame();
        this.ui.init();

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.ui.cancelPlacement();
        });

        const loader = document.getElementById('loading-screen');
        if (loader) {
            loader.classList.add('opacity-0');
            setTimeout(() => loader.classList.add('hidden'), 500);
        }
    }

    startGame(isNewGame) {
        this.audio.init();
        this.audio.playSound('level');

        const startScreen = document.getElementById('start-screen');
        if (startScreen) startScreen.classList.add('hidden');

        this.simulation.state.gameStarted = true;
        if (isNewGame) {
            this.simulation.createStarterVillage();
            this.ui.advanceTutorial();
        } else {
            this.simulation.evaluateConnectivity();
            this.simulation.recalculateCityStats();
            this.engine.rebuildCityVisuals();
            if (this.simulation.state.tutorialStep > 0 && this.simulation.state.tutorialStep < 3) {
                this.simulation.state.tutorialStep -= 1;
                this.ui.advanceTutorial();
            }
        }

        this.clock.getDelta();
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = Math.min(0.1, this.clock.getDelta());
        this.engine.tick(delta);

        if (this.simulation.state.gameStarted) {
            this.accumulator += delta;
            while (this.accumulator >= this.tickInterval) {
                this.gameTick();
                this.accumulator -= this.tickInterval;
            }
            this.smokeTimer += delta;
            if (this.smokeTimer >= this.smokeInterval) {
                this.engine.emitPlottedIndustrialSmoke();
                this.smokeTimer = 0;
            }
        }
    }

    gameTick() {
        const sim = this.simulation;
        let coinEarnings = 0;

        for (let x = 0; x < sim.state.grid.length; x++) {
            for (let z = 0; z < sim.state.grid[x].length; z++) {
                const tile = sim.state.grid[x][z];
                if (tile.tileType === TILES.BUILDING && tile.connected) {
                    const bInfo = BUILDING_TYPES[tile.buildingType.toUpperCase()];
                    if (bInfo) {
                        let localRevenue = bInfo.revenue * tile.level;
                        
                        const isCommercial = ['shop', 'cafe', 'supermarket', 'megamall', 'stadium', 'airport'].includes(tile.buildingType);
                        if (isCommercial) {
                            const scale = 1.0 + (sim.state.population / 50);
                            localRevenue = Math.round(localRevenue * scale);
                        }

                        coinEarnings += localRevenue;
                        if (Math.random() < 0.15 && localRevenue > 0) {
                            this.ui.showFloatingText(`+$${localRevenue}`, x, z);
                            this.audio.playSound('coin');
                        }
                    }
                }
            }
        }

        sim.state.coins += coinEarnings;
        sim.state.coinGenRate = coinEarnings;

        sim.checkMissionsProgress();
        sim.checkBadgesProgress();
        sim.checkAiQuestProgress();
        this.ui.updateHUD();
    }

    toggleSound() {
        const isMuted = this.audio.toggleMute();
        this.ui.updateSoundButtonState(isMuted);
    }

    toggleSettingsModal(show) {
        this.audio.init();
        if (show) {
            const isMuted = this.audio.isMuted;
            const title = "Game Options & Settings";
            const content = `
                <div class="space-y-4 font-medium">
                  <div class="flex items-center justify-between p-3 bg-slate-800 rounded-2xl border border-slate-700/60">
                    <span class="text-sm font-semibold text-white">Synthesizer Sound Effects</span>
                    <button id="btn-settings-mute" class="px-4 py-2 rounded-xl bg-slate-900 text-xs font-bold border border-slate-700 text-white font-mono">
                      ${isMuted ? '🔇 OFF' : '🔊 ON'}
                    </button>
                  </div>
                  
                  <div class="flex items-center justify-between p-3 bg-slate-800 rounded-2xl border border-slate-700/60 font-bold">
                    <span class="text-sm font-semibold text-white">Gemini API Credentials</span>
                    <button id="btn-settings-api" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white">
                      🔧 CONFIGURE
                    </button>
                  </div>

                  <div class="p-3 bg-slate-850 rounded-2xl border border-slate-800/80 space-y-2 text-left font-semibold">
                    <h4 class="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Gameplay Controls</h4>
                    <p class="text-xs text-slate-300 leading-relaxed">
                      • <span class="font-bold text-white font-mono">PAN:</span> Left-click & drag on screen.<br>
                      • <span class="font-bold text-white font-mono">ZOOM:</span> Pinch screen or use mouse wheel.<br>
                      • <span class="font-bold text-white font-mono">BUILD:</span> Place buildings or paint landscaping.
                    </p>
                  </div>
                  
                  <div class="pt-3 border-t border-slate-800">
                    <button id="btn-settings-reset" class="game-font w-full py-2.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white font-bold text-xs rounded-xl transition border border-rose-500/20">
                      RESET GAME PROGRESS
                    </button>
                  </div>
                </div>
            `;
            const actions = `<button id="btn-settings-close" class="game-font w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-2xl transition">CLOSE SETTINGS</button>`;
            this.ui.openModal(title, content, actions);

            document.getElementById('btn-settings-mute').addEventListener('click', () => {
                this.toggleSound();
                this.toggleSettingsModal(true);
            });
            document.getElementById('btn-settings-api').addEventListener('click', () => {
                this.ui.showStrategicOfficeSetup();
            });
            document.getElementById('btn-settings-reset').addEventListener('click', () => {
                this.simulation.clearSave();
            });
            document.getElementById('btn-settings-close').addEventListener('click', () => {
                this.ui.closeModal();
            });
        } else {
            this.ui.closeModal();
        }
    }

    openAiAdvisorOffice() {
        this.audio.init();
        this.audio.playSound('click');
        this.ui.cancelPlacement();
        this.ui.closeDrawer();

        const key = localStorage.getItem('gemini_api_key');
        const proxy = localStorage.getItem('gemini_api_proxy');

        if (!key && !proxy) {
            this.ui.showStrategicOfficeSetup();
            this.ui.showToast("Mock strategically advice mode active.", "warn");
        }

        this.ui.renderNewspaperUI();
        this.ui.renderQuestUI();
        const modal = document.getElementById('ai-advisor-modal');
        if (modal) modal.classList.remove('hidden');
    }

    closeAiAdvisorOffice() {
        this.audio.playSound('click');
        const modal = document.getElementById('ai-advisor-modal');
        if (modal) modal.classList.add('hidden');
    }

    switchAiTab(tabName) {
        this.audio.playSound('click');
        const tabs = ['chronicle', 'advisor', 'quest'];
        tabs.forEach(t => {
            const btn = document.getElementById(`ai-tab-${t}`);
            const panel = document.getElementById(`panel-ai-${t}`);
            if (btn && panel) {
                if (t === tabName) {
                    btn.className = "py-3 border-b-2 border-indigo-500 text-indigo-400";
                    panel.classList.remove('hidden');
                } else {
                    btn.className = "py-3 border-b-2 border-transparent text-slate-400";
                    panel.classList.add('hidden');
                }
            }
        });
    }
}

// --- 8. GLOBAL INSTANCE INITIALIZER & BINDINGS ---
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    window.game = game;
    game.init();

    window.startGame = (isNew) => game.startGame(isNew);
    window.toggleSettingsModal = (show) => game.toggleSettingsModal(show);
    window.toggleSound = () => game.toggleSound();
    window.openAiAdvisorModal = () => game.openAiAdvisorOffice();
    window.closeAiAdvisorModal = () => game.closeAiAdvisorOffice();
    window.switchAiTab = (tab) => game.switchAiTab(tab);
    window.generateAiNewspaper = () => game.simulation.runDailyNewspaperGenerator();
    window.askPresetAi = (topic) => game.simulation.runStrategicAdvisor(topic);
    window.sendCustomAiMessage = () => {
        const input = document.getElementById('ai-advisor-input');
        if (input) {
            game.simulation.runCustomStrategicAdvisor(input.value.trim());
            input.value = '';
        }
    };
    window.generateAiQuest = () => game.simulation.runAiQuestGenerator();
    window.claimAiQuestReward = () => game.simulation.claimAiQuestReward();
    window.openBuildDrawer = () => game.ui.openBuildDrawer();
    window.selectRoadTool = () => game.ui.selectRoadTool();
    window.openLandscapeDrawer = () => game.ui.openLandscapeDrawer();
    window.selectUpgradeTool = () => game.ui.selectUpgradeTool();
    window.openMissionsDrawer = () => game.ui.openMissionsDrawer();
    window.openBadgesDrawer = () => game.ui.openBadgesDrawer();
    window.selectDemolishTool = () => game.ui.selectDemolishTool();
    window.rotateCamera = (amt) => game.engine.rotateCamera(amt);
    window.tiltCamera = (amt) => game.engine.tiltCamera(amt);
    window.cancelPlacement = () => game.ui.cancelPlacement();
    window.closeDrawer = () => game.ui.closeDrawer();
    window.closeModal = () => game.ui.closeModal();
});
