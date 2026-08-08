/* ==========================================================================
   Entities and combat

   Ground-plane movement: `x` is horizontal, `y` is depth. Sprites face left
   or right only; up and down move the character within a shallow band and
   draw order is sorted by y, which is what sells the depth without needing
   four-directional art.

   Attacks run a windup -> active -> recover state machine. Hits are resolved
   only during the active window, so a swing has commitment and a dash can
   pass through one.
   ========================================================================== */

import { Animator } from "./sprite.js";
import { VIEW } from "./data.js";

let nextId = 1;

export class Entity {
  constructor(def, x, y) {
    this.id = nextId++;
    this.def = def;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;             // 1 right, -1 left
    this.hp = def.maxHp;
    this.maxHp = def.maxHp;
    this.dead = false;

    this.w = def.size.w;
    this.h = def.size.h;

    /* Attack state machine. */
    this.phase = "idle";         // idle | windup | active | recover | dashing | hurt
    this.phaseTime = 0;
    this.hitThisSwing = new Set();

    this.dashCooldown = 0;
    this.invuln = 0;
    this.hitFlash = 0;

    this.anim = new Animator({
      fallback: { w: def.size.w, h: def.size.h, color: def.color, accent: def.accent }
    });
  }

  get attack() { return this.def.attack; }

  /* Feet position is the sort key and the collision point. */
  get depth() { return this.y; }

  takeHit(damage, fromX, fromY, knockback) {
    if (this.dead || this.invuln > 0) return false;

    this.hp -= damage;
    this.hitFlash = 0.12;

    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    this.vx += (dx / len) * knockback;
    this.vy += (dy / len) * knockback * 0.6;

    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    } else {
      /* Interrupt whatever it was doing. Getting hit mid-windup should
         cancel the swing, otherwise enemies feel like they cheat. */
      this.phase = "hurt";
      this.phaseTime = 0;
    }
    return true;
  }

  startAttack() {
    if (this.phase !== "idle") return false;
    this.phase = "windup";
    this.phaseTime = 0;
    this.hitThisSwing.clear();
    return true;
  }

  startDash() {
    const d = this.def.dash;
    if (!d || this.dashCooldown > 0 || this.phase === "dashing") return false;
    if (this.phase !== "idle") return false;

    this.phase = "dashing";
    this.phaseTime = 0;
    this.dashCooldown = d.cooldown;
    this.invuln = Math.max(this.invuln, d.iframes);

    /* Dash in the movement direction if moving, otherwise straight ahead. */
    const mag = Math.hypot(this.vx, this.vy);
    if (mag > 1) {
      this.vx = (this.vx / mag) * d.speed;
      this.vy = (this.vy / mag) * d.speed;
    } else {
      this.vx = this.facing * d.speed;
      this.vy = 0;
    }
    return true;
  }

  /* Advances timers and the attack state machine. Movement is applied by the
     caller so players and enemies can decide velocity differently. */
  step(dt) {
    this.phaseTime += dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    const a = this.attack;

    switch (this.phase) {
      case "windup":
        if (this.phaseTime >= a.windup) { this.phase = "active"; this.phaseTime = 0; }
        break;
      case "active":
        if (this.phaseTime >= a.active) { this.phase = "recover"; this.phaseTime = 0; }
        break;
      case "recover":
        if (this.phaseTime >= a.recover) { this.phase = "idle"; this.phaseTime = 0; }
        break;
      case "dashing":
        if (this.phaseTime >= this.def.dash.time) { this.phase = "idle"; this.phaseTime = 0; }
        break;
      case "hurt":
        if (this.phaseTime >= 0.18) { this.phase = "idle"; this.phaseTime = 0; }
        break;
    }
  }

  /* Rooted while swinging or reeling - commitment is what makes melee read
     as weighty rather than twitchy. */
  get canMove() {
    return this.phase === "idle" || this.phase === "dashing";
  }
}

export class Projectile {
  constructor(spec, x, y, dirX, dirY, owner, damage, knockback) {
    this.id = nextId++;
    this.spec = spec;
    this.x = x;
    this.y = y;
    this.vx = dirX * spec.speed;
    this.vy = dirY * spec.speed;
    this.life = spec.life;
    this.owner = owner;          // "player" | "enemy"
    this.damage = damage;
    this.knockback = knockback;
    this.pierce = spec.pierce || 0;
    this.dead = false;
    this.hit = new Set();
  }
}

/* --------------------------------------------------------------------------
   Collision
   -------------------------------------------------------------------------- */

/* Entities collide as a small box at their feet, not their full sprite
   height. On a ground plane, what matters is where you are standing. */
export function feetBox(e) {
  return { x: e.x - e.w / 2, y: e.y - 6, w: e.w, h: 12 };
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/* Moves an entity and resolves obstacles on each axis separately, so sliding
   along a wall works instead of sticking to it. */
export function moveWithCollision(e, dt, obstacles) {
  const stepX = e.vx * dt;
  const stepY = e.vy * dt;

  e.x += stepX;
  let box = feetBox(e);
  for (const o of obstacles) {
    if (rectsOverlap(box, o)) {
      e.x -= stepX;
      box = feetBox(e);
      break;
    }
  }

  e.y += stepY;
  box = feetBox(e);
  for (const o of obstacles) {
    if (rectsOverlap(box, o)) {
      e.y -= stepY;
      break;
    }
  }

  /* Clamp to the walkable band and the screen. */
  e.y = Math.max(VIEW.floorTop, Math.min(VIEW.floorBottom, e.y));
  e.x = Math.max(e.w / 2, Math.min(VIEW.width - e.w / 2, e.x));
}

/* --------------------------------------------------------------------------
   Melee resolution

   An arc rather than a rectangle: within reach, and within halfArc radians
   of the facing direction. Depth is scaled down because the ground plane is
   visually compressed - a target 20px "behind" you is much closer in world
   terms than 20px to the side.
   -------------------------------------------------------------------------- */

export function meleeHits(attacker, targets) {
  const a = attacker.attack;
  const out = [];

  for (const t of targets) {
    if (t.dead || attacker.hitThisSwing.has(t.id)) continue;

    const dx = t.x - attacker.x;
    const dy = (t.y - attacker.y) * 1.8;
    const dist = Math.hypot(dx, dy);
    if (dist > a.reach + t.w / 2) continue;

    const angle = Math.atan2(dy, dx);
    const facingAngle = attacker.facing > 0 ? 0 : Math.PI;
    let diff = Math.abs(angle - facingAngle);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff > a.halfArc) continue;

    out.push(t);
  }

  return out;
}
