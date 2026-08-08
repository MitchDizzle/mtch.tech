/* ==========================================================================
   Input

   One abstraction over keyboard, pointer/touch, and gamepad. Everything else
   in the game reads Input.axis and Input.pressed - nothing else touches an
   event listener.

   Multi-touch is handled with pointer events and captured pointer IDs.
   Naive touchstart handlers drop the second finger, which means you cannot
   move and attack at the same time - the single most common way a browser
   game feels broken on a phone.
   ========================================================================== */

export const Input = {
  /* Normalised movement, -1..1 on each axis. Length is clamped to 1 so
     diagonal movement is not faster than cardinal. */
  axis: { x: 0, y: 0 },

  /* Actions held this frame. */
  held: new Set(),

  /* Actions that went down since the last update. Cleared by endFrame(). */
  justPressed: new Set(),

  pressed(action) {
    return this.justPressed.has(action);
  },

  down(action) {
    return this.held.has(action);
  },

  endFrame() {
    this.justPressed.clear();
  }
};

/* Keyboard. Multiple bindings per action on purpose - people reach for
   different keys and accepting all of them costs nothing. */
const KEYS = {
  ArrowUp: "up", KeyW: "up",
  ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
  Space: "attack", KeyJ: "attack", Enter: "attack",
  KeyK: "special", ShiftLeft: "dash", ShiftRight: "dash",
  KeyE: "interact",
  Escape: "pause"
};

const dirHeld = new Set();

function setAction(action, isDown) {
  if (isDown) {
    if (!Input.held.has(action)) Input.justPressed.add(action);
    Input.held.add(action);
  } else {
    Input.held.delete(action);
  }
}

function recomputeAxis() {
  let x = (dirHeld.has("right") ? 1 : 0) - (dirHeld.has("left") ? 1 : 0);
  let y = (dirHeld.has("down") ? 1 : 0) - (dirHeld.has("up") ? 1 : 0);

  /* Clamp to the unit circle. Without this, moving diagonally is 1.41x
     faster than moving straight, which players feel even if they cannot
     name it. */
  const len = Math.hypot(x, y);
  if (len > 1) { x /= len; y /= len; }

  Input.axis.x = x;
  Input.axis.y = y;
}

const DIRECTIONS = new Set(["up", "down", "left", "right"]);

function onKey(e, isDown) {
  const action = KEYS[e.code];
  if (!action) return;

  /* Stop the page scrolling under the game. */
  if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();

  if (DIRECTIONS.has(action)) {
    isDown ? dirHeld.add(action) : dirHeld.delete(action);
    recomputeAxis();
  } else {
    setAction(action, isDown);
  }
}

/* Touch: a virtual stick on the left, action buttons on the right.

   The stick tracks whichever pointer started inside it and follows that
   pointer id until release, so a thumb sliding outside the stick's visual
   bounds keeps working - which is how every good mobile stick behaves. */
function bindTouch(root) {
  const stick = root.querySelector("[data-stick]");
  const knob = root.querySelector("[data-stick-knob]");
  if (!stick) return;

  let stickPointer = null;
  let origin = { x: 0, y: 0 };
  const RADIUS = 44;

  stick.addEventListener("pointerdown", (e) => {
    stickPointer = e.pointerId;
    stick.setPointerCapture(e.pointerId);
    const r = stick.getBoundingClientRect();
    origin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    e.preventDefault();
  });

  stick.addEventListener("pointermove", (e) => {
    if (e.pointerId !== stickPointer) return;
    let dx = e.clientX - origin.x;
    let dy = e.clientY - origin.y;
    const len = Math.hypot(dx, dy);

    /* Small dead zone so resting a thumb does not drift the character. */
    if (len < 8) { Input.axis.x = 0; Input.axis.y = 0; }
    else {
      const clamped = Math.min(len, RADIUS);
      Input.axis.x = (dx / len) * (clamped / RADIUS);
      Input.axis.y = (dy / len) * (clamped / RADIUS);
    }

    if (knob) {
      const k = Math.min(len, RADIUS);
      knob.style.transform =
        `translate(${(dx / (len || 1)) * k}px, ${(dy / (len || 1)) * k}px)`;
    }
    e.preventDefault();
  });

  function releaseStick(e) {
    if (e.pointerId !== stickPointer) return;
    stickPointer = null;
    Input.axis.x = 0;
    Input.axis.y = 0;
    if (knob) knob.style.transform = "";
  }

  stick.addEventListener("pointerup", releaseStick);
  stick.addEventListener("pointercancel", releaseStick);

  /* Action buttons. Each captures its own pointer, so holding move while
     tapping attack works. */
  root.querySelectorAll("[data-action]").forEach((btn) => {
    const action = btn.getAttribute("data-action");

    btn.addEventListener("pointerdown", (e) => {
      btn.setPointerCapture(e.pointerId);
      setAction(action, true);
      e.preventDefault();
    });

    const up = (e) => { setAction(action, false); e.preventDefault(); };
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
  });
}

export function initInput(touchRoot) {
  window.addEventListener("keydown", (e) => onKey(e, true));
  window.addEventListener("keyup", (e) => onKey(e, false));

  /* Losing focus mid-key leaves that key stuck down forever otherwise. */
  window.addEventListener("blur", () => {
    dirHeld.clear();
    Input.held.clear();
    recomputeAxis();
  });

  if (touchRoot) bindTouch(touchRoot);
}
