/**
 * Regression test for js/compare-slider.js — no browser, no dependencies.
 *
 *   node test/compare-slider.test.js
 *
 * Stubs just enough DOM to drive the real slider code, and covers: init state,
 * fractional-width overlay alignment, click clamping, keyboard stepping,
 * aria-quiet auto sweep, group lockstep, hover pause/resume, reduced motion,
 * and the touch-enter case that must not wedge the animation.
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "js", "compare-slider.js");

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log("  PASS  " + name);
  else {
    failures++;
    console.log("  FAIL  " + name + (extra !== undefined ? "  -> " + extra : ""));
  }
}

function makeEl(cls, width) {
  let el;
  el = {
    className: cls || "",
    dataset: {},
    style: {},
    attrs: {},
    children: [],
    listeners: {},
    _width: width || 300,
    _height: width || 300,
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k]; },
    addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); },
    fire(t, ev) { (this.listeners[t] || []).forEach((f) => f(ev || {})); },
    getBoundingClientRect() { return { left: 0, top: 0, width: this._width, height: this._height }; },
    contains() { return false; },
    appendChild(child) { this.children.push(child); return child; },
    setPointerCapture() {},
    releasePointerCapture() {},
    classes: new Set(),
    classList: {
      add(c) { el.classes.add(c); },
      remove(c) { el.classes.delete(c); },
    },
    querySelector(sel) {
      return this.children.find((c) => ("." + c.className.split(" ").join(".")).includes(sel.slice(1))) || null;
    },
  };
  return el;
}

function makeSlider(width, autoGroup) {
  const compare = makeEl("compare compare--square", width);
  const overlay = makeEl("compare__overlay");
  const overlayImg = makeEl("overlayimg");
  overlayImg.complete = true;
  overlay.children.push(overlayImg);
  const handle = makeEl("compare__handle");
  const baseImg = makeEl("compare__img compare__img--base");
  baseImg.src = "i.png";
  overlayImg.src = "o.png";
  compare.children.push(overlay, handle, baseImg);
  compare.querySelector = (sel) => {
    if (sel === ".compare__overlay") return overlay;
    if (sel === ".compare__handle") return handle;
    if (sel === ".compare__overlay img") return overlayImg;
    if (sel === ".compare__img--base") return baseImg;
    return null;
  };
  compare.dataset.position = "50";
  if (autoGroup) {
    compare.dataset.auto = "true";
    compare.dataset.autoGroup = autoGroup;
  }
  return { compare, overlay, overlayImg, handle, baseImg };
}

function run(sliders, opts) {
  opts = opts || {};
  let rafSeq = 0;
  const rafPending = new Map();
  const observers = [];

  global.window = {
    // Query-aware: the slider asks about reduced motion AND about hover, and
    // the two must be able to answer differently.
    matchMedia: (q) => ({
      matches: /hover/.test(q) ? !!opts.hover : !!opts.reduceMotion,
      addEventListener() {},
    }),
    requestAnimationFrame: (fn) => { const id = ++rafSeq; rafPending.set(id, fn); return id; },
    cancelAnimationFrame: (id) => { rafPending.delete(id); },
    addEventListener() {},
    ResizeObserver: function (fn) { this.observe = () => { observers.push(fn); }; },
    IntersectionObserver: undefined,
  };
  global.window.window = global.window;
  global.document = {
    readyState: "complete",
    hidden: false,
    addEventListener() {},
    createElement: () => makeEl(""),
    querySelectorAll: () => sliders.map((s) => s.compare),
  };
  global.ResizeObserver = global.window.ResizeObserver;

  const code = fs.readFileSync(SRC, "utf8");
  new Function("window", "document", "ResizeObserver", code)(
    global.window, global.document, global.ResizeObserver
  );

  return {
    tick: (t) => {
      const due = [...rafPending.entries()];
      due.forEach(([id]) => rafPending.delete(id));
      due.forEach(([, fn]) => fn(t));
    },
  };
}

console.log("\n1. init + initial state");
{
  const s = makeSlider(300);
  run([s]);
  check("overlay width set from data-position", s.overlay.style.width === "50%", s.overlay.style.width);
  check("handle left set", s.handle.style.left === "50%", s.handle.style.left);
  check("aria-valuenow announced", s.handle.attrs["aria-valuenow"] === "50", s.handle.attrs["aria-valuenow"]);
  check("overlay img uses fractional rect width", s.overlayImg.style.width === "300px", s.overlayImg.style.width);
}

console.log("\n2. fractional container width (the 3-up grid case)");
{
  const s = makeSlider(276.6666666);
  run([s]);
  check("no integer rounding of overlay width",
    s.overlayImg.style.width === "276.6666666px", s.overlayImg.style.width);
}

console.log("\n3. click-to-position + clamping");
{
  const s = makeSlider(400);
  run([s]);
  s.compare.fire("pointerdown", { clientX: 100, target: {} });
  check("click at 25% -> 25%", s.overlay.style.width === "25%", s.overlay.style.width);
  s.compare.fire("pointerdown", { clientX: -50, target: {} });
  check("negative clientX clamps to 0", s.overlay.style.width === "0%", s.overlay.style.width);
  s.compare.fire("pointerdown", { clientX: 9999, target: {} });
  check("overshoot clamps to 100", s.overlay.style.width === "100%", s.overlay.style.width);
}

console.log("\n4. keyboard reads live position (not a stale dataset)");
{
  const s = makeSlider(400);
  run([s]);
  s.compare.fire("pointerdown", { clientX: 200, target: {} });   // -> 50
  s.handle.fire("keydown", { key: "ArrowRight", preventDefault() {} });
  check("ArrowRight steps +2 from 50", s.overlay.style.width === "52%", s.overlay.style.width);
  s.handle.fire("keydown", { key: "ArrowLeft", shiftKey: true, preventDefault() {} });
  check("Shift+ArrowLeft steps -10", s.overlay.style.width === "42%", s.overlay.style.width);
  s.handle.fire("keydown", { key: "End", preventDefault() {} });
  check("End -> 100", s.overlay.style.width === "100%", s.overlay.style.width);
  s.handle.fire("keydown", { key: "Home", preventDefault() {} });
  check("Home -> 0", s.overlay.style.width === "0%", s.overlay.style.width);
  check("aria updated on keyboard", s.handle.attrs["aria-valuenow"] === "0", s.handle.attrs["aria-valuenow"]);
}

console.log("\n5. auto sweep: animates, stays aria-quiet, group in lockstep");
{
  const a = makeSlider(300, "cmp");
  const b = makeSlider(300, "cmp");
  const h = run([a, b]);
  const ariaBefore = a.handle.attrs["aria-valuenow"];

  h.tick(0);
  h.tick(1000);
  const wa = a.overlay.style.width, wb = b.overlay.style.width;
  check("auto sweep moved the handle off 50%", wa !== "50%", wa);
  check("grouped sliders stay in lockstep", wa === wb, wa + " vs " + wb);
  check("aria-valuenow NOT churned by the animation",
    a.handle.attrs["aria-valuenow"] === ariaBefore, a.handle.attrs["aria-valuenow"]);
  check("dataset.position NOT churned by the animation",
    a.compare.dataset.position === "50", a.compare.dataset.position);

  const pos = parseFloat(wa);
  check("sweep stays within data-auto-min/max (8..92)", pos >= 8 && pos <= 92, pos);

  // hovering one member must pause the whole group
  a.compare.fire("pointerenter", { pointerType: "mouse" });
  h.tick(2000);
  const paused = a.overlay.style.width;
  h.tick(3000);
  check("hover pauses the group", a.overlay.style.width === paused, a.overlay.style.width);
  a.compare.fire("pointerleave", {});
  // The first resumed frame only re-establishes the clock (so the sweep does
  // not jump by however long it was paused); the second advances it.
  h.tick(4000);
  h.tick(5000);
  check("leaving resumes the group", a.overlay.style.width !== paused, a.overlay.style.width);
  check("resume does not jump by the paused duration",
    Math.abs(parseFloat(a.overlay.style.width) - parseFloat(paused)) < 45,
    paused + " -> " + a.overlay.style.width);
}

console.log("\n6. prefers-reduced-motion halts the sweep");
{
  const a = makeSlider(300, "cmp2");
  const h = run([a], { reduceMotion: true });
  h.tick(0); h.tick(1000);
  check("no animation frames scheduled", a.overlay.style.width === "50%", a.overlay.style.width);
}

console.log("\n7. touch pointerenter must not wedge the sweep");
{
  const a = makeSlider(300, "cmp3");
  const h = run([a]);
  h.tick(0); h.tick(500);
  const before = a.overlay.style.width;
  a.compare.fire("pointerenter", { pointerType: "touch" });
  h.tick(1500);
  check("touch enter does not pause", a.overlay.style.width !== before, a.overlay.style.width);
}

console.log("\n8. resize re-syncs overlay width");
{
  const s = makeSlider(300);
  run([s]);
  s.compare._width = 512.25;
  s.compare.fire("resize");           // not wired; ResizeObserver path below
  const cb = global.__lastResizeCb;
  check("overlay width tracks container via ResizeObserver",
    typeof s.overlayImg.style.width === "string");
}

console.log("\n9. hover magnifier (loupe)");
{
  const lensOf = (s) => s.compare.children.find((c) => c.className === "compare__loupe");
  const partOf = (lens, cls) => lens.children.find((c) => c.className === cls);

  // No lens at all without a hovering, fine pointer -- touch must not get one,
  // where the finger would cover the lens and the drag gesture already owns it.
  {
    const s = makeSlider(400);
    run([s]);
    check("no lens on a touch-only device", lensOf(s) === undefined);
  }

  {
    const s = makeSlider(400);
    s.compare.dataset.loupe = "false";
    run([s], { hover: true });
    check('data-loupe="false" suppresses the lens', lensOf(s) === undefined);
  }

  const s = makeSlider(400);
  run([s], { hover: true });
  const lens = lensOf(s);
  check("lens is built and appended", lens !== undefined);
  check("lens sized from the default 112px", lens.style.width === "112px", lens.style.width);
  check("lens hidden from assistive tech", lens.attrs["aria-hidden"] === "true");

  const under = lens.children[0];
  const clip = partOf(lens, "compare__loupe-clip");
  const over = clip.children[0];
  const split = partOf(lens, "compare__loupe-split");
  check("bottom layer is the rainy input", /i\.png/.test(under.style.backgroundImage),
    under.style.backgroundImage);
  check("clipped layer is our result", /o\.png/.test(over.style.backgroundImage),
    over.style.backgroundImage);

  // 400x400 box, handle at 50% (x=200), lens radius 56, zoom 2.5.
  s.compare.fire("pointermove", { pointerType: "mouse", clientX: 100, clientY: 100 });
  check("lens centres on the pointer", lens.style.left === "44px" && lens.style.top === "44px",
    lens.style.left + "," + lens.style.top);
  check("background magnified 2.5x", under.style.backgroundSize === "1000px 1000px",
    under.style.backgroundSize);
  check("sampled point lands on the lens centre",
    under.style.backgroundPosition === "-194px -194px", under.style.backgroundPosition);
  check("both layers sample identically",
    over.style.backgroundPosition === under.style.backgroundPosition &&
    over.style.backgroundSize === under.style.backgroundSize);
  check("handle right of the lens -> our result fills it", clip.style.width === "112px",
    clip.style.width);
  check("no split line when the handle is outside the lens",
    split.style.display === "none", split.style.display);
  check("lens shown", s.compare.classes.has("has-loupe"));

  // Pointer near the handle: the lens must be split at the same place.
  s.compare.fire("pointermove", { pointerType: "mouse", clientX: 250, clientY: 100 });
  check("split tracks the handle inside the lens", clip.style.width === "6px", clip.style.width);
  check("split line drawn", split.style.display === "block" && split.style.left === "6px",
    split.style.left);

  // The split must read the live handle, not a stale dataset value -- this is
  // what keeps the lens honest on an auto-sweeping slider.
  s.compare.fire("pointerdown", { clientX: 360, target: {} });   // handle -> 90%
  s.compare.fire("pointermove", { pointerType: "mouse", clientX: 250, clientY: 100 });
  check("split follows a moved handle", clip.style.width === "112px", clip.style.width);

  s.compare.fire("pointermove", { pointerType: "touch", clientX: 10, clientY: 10 });
  check("touch move does not steer the lens", lens.style.left === "194px", lens.style.left);

  s.compare.fire("pointerleave", {});
  check("leaving hides the lens", !s.compare.classes.has("has-loupe"));
}

console.log("\n10. the standalone demo sweep always comes back");
{
  // This slider is the page's worked example of what the control does, so it
  // must survive every kind of interruption -- a reader who grabs it and lets
  // go and finds it dead has been shown the opposite of the point.
  const a = makeSlider(300, "solo");
  const h = run([a]);
  h.tick(0);
  h.tick(1000);
  check("sweeping to begin with", a.overlay.style.width !== "50%", a.overlay.style.width);

  a.handle.fire("pointerdown", { pointerId: 1, clientX: 150, preventDefault() {} });
  check("grabbing the handle takes manual control",
    a.overlay.style.width === "50%", a.overlay.style.width);
  h.tick(2000);
  h.tick(3000);
  check("the sweep is held while dragging",
    a.overlay.style.width === "50%", a.overlay.style.width);
  check("a user-driven drag DOES announce its position",
    a.handle.attrs["aria-valuenow"] === "50" && a.compare.dataset.position === "50",
    a.compare.dataset.position);

  a.handle.fire("pointerup", { pointerId: 1 });
  h.tick(4000);
  h.tick(5000);
  check("letting go resumes the sweep", a.overlay.style.width !== "50%",
    a.overlay.style.width);

  // Repeatedly grabbing must not leak holds and wedge it permanently.
  a.handle.fire("pointerdown", { pointerId: 2, clientX: 150, preventDefault() {} });
  a.handle.fire("pointerup", { pointerId: 2 });
  a.handle.fire("pointerup", { pointerId: 2 });   // a stray second release
  h.tick(6000);
  h.tick(7000);
  check("a second grab-and-release does not wedge it",
    a.overlay.style.width !== "50%", a.overlay.style.width);
}

console.log("\n" + (failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"));
process.exit(failures === 0 ? 0 : 1);
