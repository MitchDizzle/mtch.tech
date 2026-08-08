/* ==========================================================================
   Sprite sheets and animation

   Built so greybox and real art share ONE render path. An entity always has
   an Animator; if no sheet is loaded it draws a coloured rectangle, and when
   a sheet arrives the same code draws frames instead. Nothing downstream
   changes when art lands.

   Sheet convention: a horizontal strip per animation, uniform frame size,
   origin at the sprite's FEET (bottom centre). Feet-anchoring is what makes
   Y-sorted ground-plane depth work without per-sprite fudging.
   ========================================================================== */

/* One decoded sheet. Frames are indexed left to right. */
export class Sheet {
  constructor(image, frameW, frameH) {
    this.image = image;
    this.frameW = frameW;
    this.frameH = frameH;
    this.cols = Math.max(1, Math.floor(image.width / frameW));
  }

  static load(src, frameW, frameH) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(new Sheet(img, frameW, frameH));
      img.onerror = () => reject(new Error(`sheet failed: ${src}`));
      img.src = src;
    });
  }

  draw(ctx, frame, x, y, flip) {
    const sx = (frame % this.cols) * this.frameW;
    const sy = Math.floor(frame / this.cols) * this.frameH;

    /* Draw anchored at feet: x is the centre, y is the ground line. */
    const dx = Math.round(x - this.frameW / 2);
    const dy = Math.round(y - this.frameH);

    if (!flip) {
      ctx.drawImage(this.image, sx, sy, this.frameW, this.frameH,
                    dx, dy, this.frameW, this.frameH);
      return;
    }

    /* Horizontal flip. Translating to the sprite's own centre first keeps
       the feet anchor correct - scaling around the canvas origin would
       move the character. */
    ctx.save();
    ctx.translate(Math.round(x), 0);
    ctx.scale(-1, 1);
    ctx.drawImage(this.image, sx, sy, this.frameW, this.frameH,
                  Math.round(-this.frameW / 2), dy, this.frameW, this.frameH);
    ctx.restore();
  }
}

/* An animation clip: which frames, how fast, whether it loops.

   `events` fires callbacks on specific frames - this is how an attack knows
   when its hitbox becomes active, rather than guessing with a timer that
   drifts out of sync with the art. */
export class Clip {
  constructor({ frames, fps = 10, loop = true, events = {} }) {
    this.frames = frames;
    this.fps = fps;
    this.loop = loop;
    this.events = events;
  }

  get duration() {
    return this.frames.length / this.fps;
  }
}

export class Animator {
  constructor({ sheet = null, clips = {}, fallback = {} }) {
    this.sheet = sheet;
    this.clips = clips;

    /* Greybox description used when no sheet is present. */
    this.fallback = {
      w: fallback.w ?? 16,
      h: fallback.h ?? 32,
      color: fallback.color ?? "#888",
      accent: fallback.accent ?? null
    };

    this.current = null;
    this.name = null;
    this.time = 0;
    this.frameIndex = 0;
    this.finished = false;
    this.onEvent = null;
  }

  play(name, { restart = false } = {}) {
    if (this.name === name && !restart) return;
    this.name = name;
    this.current = this.clips[name] || null;
    this.time = 0;
    this.frameIndex = 0;
    this.finished = false;
  }

  update(dt) {
    const clip = this.current;
    if (!clip) return;

    const prev = this.frameIndex;
    this.time += dt;

    let idx = Math.floor(this.time * clip.fps);
    if (idx >= clip.frames.length) {
      if (clip.loop) {
        idx %= clip.frames.length;
      } else {
        idx = clip.frames.length - 1;
        this.finished = true;
      }
    }
    this.frameIndex = idx;

    /* Fire frame events once, on the frame they are declared for. */
    if (idx !== prev && clip.events[idx] && this.onEvent) {
      this.onEvent(clip.events[idx]);
    }
  }

  draw(ctx, x, y, flip) {
    if (this.sheet && this.current) {
      this.sheet.draw(ctx, this.current.frames[this.frameIndex], x, y, flip);
      return;
    }

    /* Greybox. Same anchor as a real sprite - feet at (x, y) - so swapping
       in art does not shift anything. */
    const { w, h, color, accent } = this.fallback;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x - w / 2), Math.round(y - h), w, h);

    /* A facing pip, so direction is legible without art. */
    if (accent) {
      ctx.fillStyle = accent;
      const pipX = flip ? x - w / 2 - 1 : x + w / 2 - 2;
      ctx.fillRect(Math.round(pipX), Math.round(y - h * 0.7), 3, 3);
    }
  }
}
