/* ==========================================================================
   Game data

   Classes, enemies, and rooms as plain data. Kept separate from behaviour so
   balancing is editing numbers, not editing systems - and so the three
   classes can be proven against the same combat code rather than each
   growing its own special case.

   Units: pixels and seconds. World is a ground plane - `x` is horizontal,
   `y` is depth (further down the screen = nearer the camera).
   ========================================================================== */

export const VIEW = {
  /* Logical resolution, integer-scaled up to the display. Chosen so a ~40px
     character reads at a sensible size: roughly 12 characters wide by 7 tall. */
  width: 480,
  height: 270,

  /* The walkable band. Everything above is backdrop, below is foreground. */
  floorTop: 150,
  floorBottom: 252
};

/* --------------------------------------------------------------------------
   Player classes

   All three run through the same attack pipeline. What differs is data:
   reach, arc, whether the attack spawns a projectile, and the numbers.
   -------------------------------------------------------------------------- */

export const CLASSES = {
  knight: {
    id: "knight",
    label: "Knight",
    blurb: "Short reach, heavy hits, walks it off.",
    maxHp: 100,
    speed: 92,
    color: "#c86432",
    accent: "#f0d8a8",
    size: { w: 18, h: 40 },

    attack: {
      kind: "melee",
      damage: 22,
      /* Hitbox is an arc in front of the character rather than a rectangle,
         so it reads correctly on a ground plane where enemies can be at a
         different depth. */
      reach: 34,
      halfArc: 0.9,
      windup: 0.09,
      active: 0.10,
      recover: 0.20,
      knockback: 140
    },

    dash: { speed: 320, time: 0.16, cooldown: 0.55, iframes: 0.16 }
  },

  ranger: {
    id: "ranger",
    label: "Ranger",
    blurb: "Fragile, fast, hits from across the room.",
    maxHp: 70,
    speed: 108,
    color: "#3c8c5a",
    accent: "#d8f0c0",
    size: { w: 16, h: 38 },

    attack: {
      kind: "projectile",
      damage: 14,
      windup: 0.12,
      active: 0.02,
      recover: 0.26,
      knockback: 60,
      projectile: { speed: 260, life: 1.2, w: 10, h: 3, pierce: 0, color: "#d8f0c0" }
    },

    dash: { speed: 300, time: 0.18, cooldown: 0.45, iframes: 0.18 }
  },

  mage: {
    id: "mage",
    label: "Mage",
    blurb: "Slow to commit, hits everything nearby when it lands.",
    maxHp: 78,
    speed: 84,
    color: "#6a4ca8",
    accent: "#c8b4f0",
    size: { w: 17, h: 39 },

    attack: {
      kind: "projectile",
      damage: 18,
      windup: 0.24,
      active: 0.02,
      recover: 0.34,
      knockback: 90,
      projectile: {
        speed: 170, life: 1.6, w: 8, h: 8, pierce: 0, color: "#c8b4f0",
        /* Area damage on impact. The only thing separating mage from ranger
           in code - everything else is numbers. */
        splash: { radius: 42, damage: 12 }
      }
    },

    dash: { speed: 280, time: 0.2, cooldown: 0.7, iframes: 0.2 }
  }
};

/* --------------------------------------------------------------------------
   Enemies
   -------------------------------------------------------------------------- */

export const ENEMIES = {
  grunt: {
    id: "grunt",
    maxHp: 32,
    speed: 52,
    color: "#8c3c3c",
    accent: "#e08080",
    size: { w: 16, h: 34 },
    contactDamage: 8,
    attack: { kind: "melee", damage: 10, reach: 24, halfArc: 1.0,
              windup: 0.32, active: 0.10, recover: 0.45, knockback: 110 },
    /* How close it wants to be before committing to a swing. */
    engageRange: 26
  },

  archer: {
    id: "archer",
    maxHp: 22,
    speed: 44,
    color: "#8c6a2c",
    accent: "#e0c080",
    size: { w: 15, h: 33 },
    contactDamage: 4,
    attack: {
      kind: "projectile", damage: 9, windup: 0.5, active: 0.02, recover: 0.6,
      knockback: 40,
      projectile: { speed: 180, life: 1.6, w: 8, h: 3, pierce: 0, color: "#e0c080" }
    },
    engageRange: 130,
    /* Backs away if the player closes in. */
    keepAway: 90
  }
};

/* --------------------------------------------------------------------------
   Rooms

   Hand-authored, as decided in ADR 0003 - only the encounter is procedural.
   `obstacles` are solid rectangles in world space. `doors` name the edge they
   sit on; which room they lead to is decided by the run, not baked in here.
   -------------------------------------------------------------------------- */

const F = VIEW.floorTop;
const FB = VIEW.floorBottom;

export const ROOMS = [
  {
    id: "open",
    name: "Open floor",
    obstacles: [],
    doors: ["east"],
    spawns: [{ type: "grunt", count: 3 }]
  },
  {
    id: "pillars",
    name: "Pillars",
    obstacles: [
      { x: 150, y: F + 20, w: 20, h: 26 },
      { x: 310, y: F + 20, w: 20, h: 26 },
      { x: 230, y: FB - 34, w: 20, h: 26 }
    ],
    doors: ["east", "west"],
    spawns: [{ type: "grunt", count: 2 }, { type: "archer", count: 1 }]
  },
  {
    id: "corridor",
    name: "Corridor",
    obstacles: [
      { x: 90, y: F, w: 26, h: 40 },
      { x: 90, y: FB - 40, w: 26, h: 40 },
      { x: 370, y: F, w: 26, h: 40 },
      { x: 370, y: FB - 40, w: 26, h: 40 }
    ],
    doors: ["east", "west"],
    spawns: [{ type: "archer", count: 2 }, { type: "grunt", count: 1 }]
  },
  {
    id: "pit",
    name: "The pit",
    obstacles: [
      { x: 200, y: F + 26, w: 80, h: 34 }
    ],
    doors: ["east", "west"],
    spawns: [{ type: "grunt", count: 4 }]
  }
];

/* The staging area. No enemies, no doors that lead into a run until the
   player walks to the exit. This is where site content and minigames live. */
export const STAGING = {
  id: "staging",
  name: "Staging",
  obstacles: [
    { x: 60, y: F + 10, w: 28, h: 30 },
    { x: 392, y: F + 10, w: 28, h: 30 }
  ],
  doors: ["east"],
  spawns: []
};
