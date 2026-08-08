/* ==========================================================================
   Game loop, room management, and rendering

   Fixed timestep with an accumulator: simulation always advances in equal
   slices regardless of frame rate, so physics and combat timings are
   identical on a 60Hz laptop and a 120Hz phone. Rendering happens once per
   frame with whatever the latest state is.
   ========================================================================== */

import { Input, initInput } from "./input.js";
import { CLASSES, ENEMIES, ROOMS, STAGING, VIEW } from "./data.js";
import {
  Entity, Projectile, moveWithCollision, meleeHits, feetBox, rectsOverlap
} from "./entities.js";

const STEP = 1 / 60;
const MAX_FRAME = 0.25;   // never simulate more than this in one frame

export class Game {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.ctx.imageSmoothingEnabled = false;

    this.onStateChange = opts.onStateChange || (() => {});
    this.running = false;
    this.accumulator = 0;
    this.lastTime = 0;

    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.room = null;
    this.roomIndex = -1;
    this.state = "staging";     // staging | fighting | cleared | dead

    this.resize();
    window.addEventListener("resize", () => this.resize());

    /* A backgrounded tab should not burn battery simulating a fight nobody
       is watching, and should not fast-forward when it comes back. */
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pause();
      else this.resume();
    });
  }

  /* Integer scaling keeps pixels crisp. Fractional scale produces the soft,
     uneven look that makes pixel art appear broken. */
  resize() {
    const wrap = this.canvas.parentElement;
    const availW = wrap.clientWidth;
    const availH = wrap.clientHeight || window.innerHeight * 0.7;

    let scale = Math.min(availW / VIEW.width, availH / VIEW.height);
    scale = Math.max(1, Math.floor(scale));

    this.canvas.width = VIEW.width;
    this.canvas.height = VIEW.height;
    this.canvas.style.width = `${VIEW.width * scale}px`;
    this.canvas.style.height = `${VIEW.height * scale}px`;
    this.ctx.imageSmoothingEnabled = false;
  }

  start(classId = "knight") {
    const def = CLASSES[classId] || CLASSES.knight;
    this.player = new Entity(def, 80, (VIEW.floorTop + VIEW.floorBottom) / 2);
    this.enterStaging();
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.frame);
  }

  setClass(classId) {
    const def = CLASSES[classId];
    if (!def || !this.player) return;
    const { x, y } = this.player;
    this.player = new Entity(def, x, y);
  }

  pause() { this.running = false; }

  resume() {
    if (this.running) return;
    this.running = true;
    /* Reset the clock, otherwise the accumulator sees the whole time the tab
       was hidden and the game lurches forward. */
    this.lastTime = performance.now();
    this.accumulator = 0;
    requestAnimationFrame(this.frame);
  }

  /* ---------------------------------------------------------------- rooms */

  enterStaging() {
    this.room = STAGING;
    this.roomIndex = -1;
    this.enemies = [];
    this.projectiles = [];
    this.state = "staging";
    this.player.x = 60;
    this.player.hp = this.player.maxHp;
    this.onStateChange(this.state, this);
  }

  enterRoom(index) {
    const room = ROOMS[index % ROOMS.length];
    this.room = room;
    this.roomIndex = index;
    this.projectiles = [];
    this.player.x = 40;
    this.spawnEncounter(room);
    this.state = this.enemies.length ? "fighting" : "cleared";
    this.onStateChange(this.state, this);
  }

  /* The only procedural part, per ADR 0003: room layouts are hand-authored,
     the encounter inside them is generated. Difficulty scales with depth. */
  spawnEncounter(room) {
    this.enemies = [];
    const depth = Math.max(0, this.roomIndex);
    const bonus = Math.floor(depth / 2);

    for (const group of room.spawns) {
      const def = ENEMIES[group.type];
      if (!def) continue;
      const count = group.count + bonus;

      for (let i = 0; i < count; i++) {
        /* Keep spawns away from the player's entry point so nothing lands
           on top of them the instant a room loads. */
        const x = 180 + Math.random() * (VIEW.width - 220);
        const y = VIEW.floorTop + Math.random() * (VIEW.floorBottom - VIEW.floorTop);
        const e = new Entity(def, x, y);
        e.hp = e.maxHp = Math.round(def.maxHp * (1 + depth * 0.12));
        this.enemies.push(e);
      }
    }
  }

  advance() {
    if (this.state === "staging") this.enterRoom(0);
    else if (this.state === "cleared") this.enterRoom(this.roomIndex + 1);
  }

  /* ----------------------------------------------------------------- loop */

  frame = (now) => {
    if (!this.running) return;

    let delta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (delta > MAX_FRAME) delta = MAX_FRAME;

    this.accumulator += delta;
    while (this.accumulator >= STEP) {
      this.update(STEP);
      this.accumulator -= STEP;
    }

    this.render();
    Input.endFrame();
    requestAnimationFrame(this.frame);
  };

  update(dt) {
    const p = this.player;
    if (!p) return;

    if (p.dead) {
      if (this.state !== "dead") {
        this.state = "dead";
        this.onStateChange(this.state, this);
      }
      return;
    }

    /* -- player intent -- */
    if (p.canMove && p.phase !== "dashing") {
      const spd = p.def.speed;
      p.vx = Input.axis.x * spd;
      p.vy = Input.axis.y * spd * 0.72;   // depth reads slower than width
      if (Input.axis.x !== 0) p.facing = Input.axis.x > 0 ? 1 : -1;
    }

    if (Input.pressed("attack")) p.startAttack();
    if (Input.pressed("dash")) p.startDash();
    if (Input.pressed("interact") && this.state !== "fighting") this.advance();

    p.step(dt);
    this.resolveAttack(p, this.enemies, "player");

    if (p.phase !== "dashing") {
      p.vx *= 0.82;
      p.vy *= 0.82;
      if (p.canMove) {
        p.vx = Input.axis.x * p.def.speed;
        p.vy = Input.axis.y * p.def.speed * 0.72;
      }
    }
    moveWithCollision(p, dt, this.room.obstacles);

    /* -- enemies -- */
    for (const e of this.enemies) {
      if (e.dead) continue;
      this.updateEnemy(e, p, dt);
    }
    this.enemies = this.enemies.filter((e) => !e.dead || e.hitFlash > -0.4);

    /* -- projectiles -- */
    this.updateProjectiles(dt);

    /* -- room state -- */
    if (this.state === "fighting" && !this.enemies.some((e) => !e.dead)) {
      this.state = "cleared";
      this.onStateChange(this.state, this);
    }
  }

  updateEnemy(e, p, dt) {
    const dx = p.x - e.x;
    const dy = p.y - e.y;
    const dist = Math.hypot(dx, dy * 1.6);

    if (e.canMove) {
      const want = e.def.engageRange;
      const keep = e.def.keepAway || 0;

      let moveDir = 0;
      if (dist > want) moveDir = 1;
      else if (keep && dist < keep) moveDir = -1;

      if (moveDir !== 0) {
        const len = Math.hypot(dx, dy) || 1;
        e.vx = (dx / len) * e.def.speed * moveDir;
        e.vy = (dy / len) * e.def.speed * 0.7 * moveDir;
      } else {
        e.vx *= 0.8;
        e.vy *= 0.8;
        if (dist <= want) e.startAttack();
      }

      if (Math.abs(dx) > 2) e.facing = dx > 0 ? 1 : -1;
    }

    e.step(dt);
    this.resolveAttack(e, [p], "enemy");
    moveWithCollision(e, dt, this.room.obstacles);

    if (e.dead) e.hitFlash -= dt;
  }

  /* Fires once per swing, on the transition into the active window. */
  resolveAttack(attacker, targets, side) {
    if (attacker.phase !== "active") return;

    const a = attacker.attack;

    if (a.kind === "melee") {
      for (const t of meleeHits(attacker, targets)) {
        if (t.takeHit(a.damage, attacker.x, attacker.y, a.knockback)) {
          attacker.hitThisSwing.add(t.id);
        }
      }
      return;
    }

    /* Projectile: spawn exactly once per swing. */
    if (attacker.hitThisSwing.has("fired")) return;
    attacker.hitThisSwing.add("fired");

    this.projectiles.push(new Projectile(
      a.projectile,
      attacker.x + attacker.facing * 12,
      attacker.y - attacker.h * 0.45,
      attacker.facing, 0,
      side, a.damage, a.knockback
    ));
  }

  updateProjectiles(dt) {
    const p = this.player;

    for (const pr of this.projectiles) {
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.life -= dt;
      if (pr.life <= 0) { pr.dead = true; continue; }

      const box = { x: pr.x - pr.spec.w / 2, y: pr.y - pr.spec.h / 2,
                    w: pr.spec.w, h: pr.spec.h };

      for (const o of this.room.obstacles) {
        if (rectsOverlap(box, o)) { pr.dead = true; break; }
      }
      if (pr.dead) continue;

      const targets = pr.owner === "player" ? this.enemies : [p];
      for (const t of targets) {
        if (t.dead || pr.hit.has(t.id)) continue;

        /* Projectiles check against the body, not the feet - an arrow at
           chest height should hit. */
        const body = { x: t.x - t.w / 2, y: t.y - t.h, w: t.w, h: t.h };
        if (!rectsOverlap(box, body)) continue;

        t.takeHit(pr.damage, pr.x, pr.y, pr.knockback);
        pr.hit.add(t.id);

        if (pr.spec.splash) this.applySplash(pr, targets);

        if (pr.pierce > 0) pr.pierce--;
        else { pr.dead = true; break; }
      }
    }

    this.projectiles = this.projectiles.filter((pr) => !pr.dead);
  }

  applySplash(pr, targets) {
    const s = pr.spec.splash;
    for (const t of targets) {
      if (t.dead || pr.hit.has(t.id)) continue;
      const d = Math.hypot(t.x - pr.x, (t.y - pr.y) * 1.6);
      if (d <= s.radius) {
        t.takeHit(s.damage, pr.x, pr.y, pr.knockback * 0.5);
        pr.hit.add(t.id);
      }
    }
  }

  /* --------------------------------------------------------------- render */

  render() {
    const ctx = this.ctx;

    ctx.fillStyle = "#141014";
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);

    /* Back wall / floor split. Greybox, but it establishes the ground plane
       so movement reads correctly before any art exists. */
    ctx.fillStyle = "#241c22";
    ctx.fillRect(0, 0, VIEW.width, VIEW.floorTop);
    ctx.fillStyle = "#332830";
    ctx.fillRect(0, VIEW.floorTop, VIEW.width, VIEW.height - VIEW.floorTop);
    ctx.fillStyle = "#3d313a";
    ctx.fillRect(0, VIEW.floorTop, VIEW.width, 2);

    for (const o of this.room.obstacles) {
      ctx.fillStyle = "#4a3c46";
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = "#5c4a56";
      ctx.fillRect(o.x, o.y, o.w, 3);
    }

    /* Doors, drawn as gaps on the room edge. */
    if (this.state === "cleared" || this.state === "staging") {
      ctx.fillStyle = "#c8a050";
      for (const d of this.room.doors) {
        if (d === "east") ctx.fillRect(VIEW.width - 6, VIEW.floorTop + 30, 6, 46);
        if (d === "west") ctx.fillRect(0, VIEW.floorTop + 30, 6, 46);
      }
    }

    /* Y-sorted draw. Everything on the ground plane sorts by feet position,
       which is the whole trick that makes depth read without real 3D. */
    const drawables = [this.player, ...this.enemies].filter(Boolean);
    drawables.sort((a, b) => a.y - b.y);

    for (const e of drawables) {
      this.drawShadow(ctx, e);
      this.drawEntity(ctx, e);
    }

    for (const pr of this.projectiles) {
      ctx.fillStyle = pr.spec.color;
      ctx.fillRect(Math.round(pr.x - pr.spec.w / 2), Math.round(pr.y - pr.spec.h / 2),
                   pr.spec.w, pr.spec.h);
    }

    this.drawHud(ctx);
  }

  drawShadow(ctx, e) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    const w = e.w * (e.dead ? 0.5 : 1);
    ctx.fillRect(Math.round(e.x - w / 2), Math.round(e.y - 2), w, 4);
  }

  drawEntity(ctx, e) {
    ctx.save();

    if (e.dead) ctx.globalAlpha = Math.max(0, e.hitFlash + 0.4);
    else if (e.invuln > 0) ctx.globalAlpha = 0.55;   // dash i-frames are visible

    e.anim.draw(ctx, e.x, e.y, e.facing < 0);

    /* Hit flash: a white overlay on the sprite's footprint. */
    if (e.hitFlash > 0 && !e.dead) {
      ctx.globalAlpha = Math.min(1, e.hitFlash * 6);
      ctx.fillStyle = "#fff";
      ctx.fillRect(Math.round(e.x - e.w / 2), Math.round(e.y - e.h), e.w, e.h);
    }

    ctx.restore();

    /* Telegraph. Without art, the windup is invisible and every hit feels
       unfair - so the greybox has to show intent explicitly. */
    if (e.phase === "windup") {
      ctx.fillStyle = "#ffd070";
      ctx.fillRect(Math.round(e.x - 8), Math.round(e.y - e.h - 6), 16, 2);
    } else if (e.phase === "active" && e.attack.kind === "melee") {
      ctx.fillStyle = "rgba(255,240,200,0.5)";
      const r = e.attack.reach;
      ctx.fillRect(Math.round(e.facing > 0 ? e.x : e.x - r), Math.round(e.y - e.h * 0.7),
                   r, Math.round(e.h * 0.5));
    }

    /* Enemy health, only once damaged. */
    if (e !== this.player && !e.dead && e.hp < e.maxHp) {
      const w = e.w + 4;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(Math.round(e.x - w / 2), Math.round(e.y - e.h - 12), w, 3);
      ctx.fillStyle = "#d05050";
      ctx.fillRect(Math.round(e.x - w / 2), Math.round(e.y - e.h - 12),
                   Math.round(w * (e.hp / e.maxHp)), 3);
    }
  }

  drawHud(ctx) {
    const p = this.player;
    if (!p) return;

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(8, 8, 104, 12);
    ctx.fillStyle = "#d05050";
    ctx.fillRect(10, 10, Math.round(100 * (p.hp / p.maxHp)), 8);

    ctx.fillStyle = "#e8dcd0";
    ctx.font = "8px monospace";
    ctx.fillText(p.def.label.toUpperCase(), 10, 30);

    if (p.dashCooldown > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(8, 34, Math.round(40 * (p.dashCooldown / p.def.dash.cooldown)), 3);
    }

    const label =
      this.state === "staging" ? "STAGING - reach the door and press E" :
      this.state === "cleared" ? "CLEARED - press E for the next room" :
      this.state === "dead" ? "DEAD" :
      `ROOM ${this.roomIndex + 1} - ${this.enemies.filter((e) => !e.dead).length} left`;

    ctx.fillStyle = "#e8dcd0";
    ctx.fillText(label, 10, VIEW.height - 8);
  }
}

export function bootGame(canvas, touchRoot, opts) {
  initInput(touchRoot);
  const game = new Game(canvas, opts);
  return game;
}

export { CLASSES };
