/**
 * Regression test for js/loupe-row.js — no browser, no dependencies.
 *
 *   node test/loupe-row.test.js
 *
 * Covers: the hover/touch gate, the opt-out attribute, lens construction, the
 * magnification geometry, and the property the whole component exists for —
 * one pointer drives every tile in the row at the same *normalised* point.
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "js", "loupe-row.js");

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log("  PASS  " + name);
  else {
    failures++;
    console.log("  FAIL  " + name + (extra !== undefined ? "  -> " + extra : ""));
  }
}

function makeEl(cls) {
  let el;
  el = {
    className: cls || "",
    dataset: {},
    style: {},
    attrs: {},
    children: [],
    listeners: {},
    classes: new Set(),
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); },
    fire(t, ev) { (this.listeners[t] || []).forEach((f) => f(ev || {})); },
    appendChild(c) { this.children.push(c); return c; },
    classList: { add(c) { el.classes.add(c); }, remove(c) { el.classes.delete(c); } },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
  return el;
}

/** widths: one entry per tile, so a row of unequal tiles can be exercised. */
function makeRow(widths) {
  const row = makeEl("zoom-row");
  const tiles = widths.map((w, i) => {
    const tile = makeEl("zoom-tile");
    tile._w = w;
    tile._h = w;
    tile.getBoundingClientRect = () => ({ left: 0, top: 0, width: tile._w, height: tile._h });
    const img = makeEl("");
    img.src = "t" + i + ".png";
    tile.querySelector = (sel) => (sel === "img" ? img : null);
    tile.img = img;
    return tile;
  });
  row.querySelectorAll = (sel) => (sel === ".zoom-tile" ? tiles : []);
  row.tiles = tiles;
  return row;
}

/**
 * opts.hover        report a hover-capable, fine pointer
 * opts.reduceMotion report prefers-reduced-motion: reduce
 * opts.raf          provide rAF/setTimeout, which switches the self-
 *                   demonstrating tour on; without them it declines to run,
 *                   which is what keeps the earlier sections pointer-only.
 */
function run(rows, opts) {
  opts = opts || {};
  let rafSeq = 0;
  const rafPending = new Map();
  let timerSeq = 0;
  const timers = new Map();

  global.window = {
    matchMedia: (q) => ({
      matches: /hover/.test(q) ? !!opts.hover : !!opts.reduceMotion,
      addEventListener() {},
    }),
    addEventListener() {},
  };
  if (opts.raf) {
    global.window.requestAnimationFrame = (fn) => {
      const id = ++rafSeq;
      rafPending.set(id, fn);
      return id;
    };
    global.window.cancelAnimationFrame = (id) => { rafPending.delete(id); };
    global.window.setTimeout = (fn) => {
      const id = ++timerSeq;
      timers.set(id, fn);
      return id;
    };
    global.window.clearTimeout = (id) => { timers.delete(id); };
  }
  global.document = {
    readyState: "complete",
    hidden: false,
    addEventListener() {},
    createElement: () => makeEl(""),
    querySelectorAll: (sel) => (sel === ".zoom-row" ? rows : []),
  };
  const code = fs.readFileSync(SRC, "utf8");
  new Function("window", "document", code)(global.window, global.document);

  return {
    tick: (t) => {
      const due = [...rafPending.entries()];
      due.forEach(([id]) => rafPending.delete(id));
      due.forEach(([, fn]) => fn(t));
    },
    flushTimers: () => {
      const due = [...timers.entries()];
      due.forEach(([id]) => timers.delete(id));
      due.forEach(([, fn]) => fn());
    },
    pendingTimers: () => timers.size,
  };
}

const lensOf = (tile) => tile.children.find((c) => c.className === "zoom-tile__lens");

console.log("\n1. the hover gate");
{
  const row = makeRow([200, 200]);
  run([row]);
  check("no lens on a touch-only device", lensOf(row.tiles[0]) === undefined);
}

console.log("\n2. opt-out attribute");
{
  const row = makeRow([200, 200]);
  row.dataset.zoom = "false";
  run([row], { hover: true });
  check('data-zoom="false" builds nothing', lensOf(row.tiles[0]) === undefined);
}

console.log("\n3. lens construction");
{
  const row = makeRow([200, 200, 200, 200]);
  run([row], { hover: true });
  const lens = lensOf(row.tiles[0]);
  check("a lens per tile", row.tiles.every((t) => lensOf(t) !== undefined));
  check("default 112px diameter", lens.style.width === "112px", lens.style.width);
  check("hidden from assistive tech", lens.attrs["aria-hidden"] === "true");
  check("each lens shows its own tile's image",
    row.tiles.every((t, i) => lensOf(t).style.backgroundImage === 'url("t' + i + '.png")'),
    lensOf(row.tiles[2]).style.backgroundImage);
}

console.log("\n4. one pointer drives every tile (equal tiles)");
{
  const row = makeRow([200, 200, 200, 200]);
  run([row], { hover: true });
  // Hover the third tile at (150, 50) -> u=0.75, v=0.25.
  // radius 56, zoom 2.5 -> left 94px, top -6px, bg 500px, pos -319px/-69px.
  row.tiles[2].fire("pointermove", { pointerType: "mouse", clientX: 150, clientY: 50 });
  const lenses = row.tiles.map(lensOf);
  check("row marked as zooming", row.classes.has("is-zooming"));
  check("lens centres on the sampled point",
    lenses[2].style.left === "94px" && lenses[2].style.top === "-6px",
    lenses[2].style.left + "," + lenses[2].style.top);
  check("magnified 2.5x", lenses[2].style.backgroundSize === "500px 500px",
    lenses[2].style.backgroundSize);
  check("sampled point lands on the lens centre",
    lenses[2].style.backgroundPosition === "-319px -69px", lenses[2].style.backgroundPosition);
  check("all four tiles lensed from one hover",
    lenses.every((l) => l.style.backgroundPosition === lenses[2].style.backgroundPosition &&
                        l.style.left === lenses[2].style.left),
    lenses.map((l) => l.style.left).join(" "));

  // Hovering a different tile must drive the whole row just the same.
  row.tiles[0].fire("pointerenter", { pointerType: "mouse", clientX: 20, clientY: 20 });
  check("any tile can drive the row",
    row.tiles.map(lensOf).every((l) => l.style.left === "-36px"),
    row.tiles.map((t) => lensOf(t).style.left).join(" "));
}

console.log("\n5. syncing is normalised, not in pixels");
{
  const row = makeRow([200, 100]);
  run([row], { hover: true });
  row.tiles[0].fire("pointermove", { pointerType: "mouse", clientX: 150, clientY: 50 });
  // u=0.75 on a 100px tile is x=75 -> left 75-56 = 19px, not 94px.
  check("a narrower tile samples the same relative point",
    lensOf(row.tiles[1]).style.left === "19px", lensOf(row.tiles[1]).style.left);
  check("and scales its own magnification to its own size",
    lensOf(row.tiles[1]).style.backgroundSize === "250px 250px",
    lensOf(row.tiles[1]).style.backgroundSize);
}

console.log("\n6. bounds, touch, and leaving");
{
  const row = makeRow([200, 200]);
  run([row], { hover: true });
  row.tiles[0].fire("pointermove", { pointerType: "mouse", clientX: 100, clientY: 100 });
  const held = lensOf(row.tiles[0]).style.left;

  row.tiles[0].fire("pointermove", { pointerType: "touch", clientX: 10, clientY: 10 });
  check("touch move is ignored", lensOf(row.tiles[0]).style.left === held);

  row.tiles[0].fire("pointermove", { pointerType: "mouse", clientX: 999, clientY: 100 });
  check("a point outside the tile is ignored", lensOf(row.tiles[0]).style.left === held);

  row.fire("pointerleave", {});
  check("leaving the row hides every lens", !row.classes.has("is-zooming"));
}

const ghostOf = (tile) => tile.children.find((c) => c.className === "zoom-ghost");

console.log("\n7. the self-demonstrating tour");
{
  const row = makeRow([200, 200, 200, 200]);
  row.dataset.zoomAuto = "true";
  const h = run([row], { hover: true, raf: true });

  check("a ghost cursor on the first tile", ghostOf(row.tiles[0]) !== undefined);
  check("and on no other tile",
    row.tiles.slice(1).every((t) => ghostOf(t) === undefined));

  h.tick(0);
  h.tick(1500);
  const lenses = row.tiles.map(lensOf);
  check("the tour moves the lenses with no pointer at all",
    lenses[0].style.left !== "" && lenses[0].style.left !== undefined,
    lenses[0].style.left);
  check("row is zooming and flagged as self-driven",
    row.classes.has("is-zooming") && row.classes.has("is-auto"));
  check("all four stay in lockstep",
    lenses.every((l) => l.style.left === lenses[0].style.left));

  // The ghost has to sit at the lens centre, or the arrow points at a spot
  // that is not the one being magnified.
  const ghost = ghostOf(row.tiles[0]);
  check("ghost sits exactly at the lens centre",
    parseFloat(ghost.style.left) === parseFloat(lenses[0].style.left) + 56 &&
    parseFloat(ghost.style.top) === parseFloat(lenses[0].style.top) + 56,
    ghost.style.left + "/" + lenses[0].style.left);

  // The path must never reach the edges, where a half-clipped lens says
  // nothing and the ghost would be sliced in half.
  let minU = 1;
  let maxU = 0;
  for (let t = 0; t <= 9000; t += 150) {
    h.tick(t);
    const u = (parseFloat(lenses[0].style.left) + 56) / 200;
    minU = Math.min(minU, u);
    maxU = Math.max(maxU, u);
  }
  check("the path stays well inside the tile", minU > 0.15 && maxU < 0.85,
    minU.toFixed(3) + ".." + maxU.toFixed(3));
  check("and it actually covers ground", maxU - minU > 0.4,
    (maxU - minU).toFixed(3));
}

console.log("\n8. a real pointer takes over, and gets it back");
{
  const row = makeRow([200, 200]);
  row.dataset.zoomAuto = "true";
  const h = run([row], { hover: true, raf: true });
  h.tick(0);
  h.tick(1500);

  row.tiles[0].fire("pointermove", { pointerType: "mouse", clientX: 100, clientY: 100 });
  check("the ghost is dropped the moment a real pointer arrives",
    !row.classes.has("is-auto"));
  check("pointer position wins", lensOf(row.tiles[0]).style.left === "44px",
    lensOf(row.tiles[0]).style.left);

  h.tick(3000);
  h.tick(4500);
  check("the tour is held while the pointer is in the row",
    lensOf(row.tiles[0]).style.left === "44px", lensOf(row.tiles[0]).style.left);

  row.fire("pointerleave", {});
  check("lenses fade out on leave", !row.classes.has("is-zooming"));
  h.tick(6000);
  h.tick(7500);
  check("the tour does NOT resume before the fade has run",
    lensOf(row.tiles[0]).style.left === "44px", lensOf(row.tiles[0]).style.left);
  check("a resume is pending", h.pendingTimers() === 1);

  h.flushTimers();
  h.tick(9000);
  h.tick(10500);
  check("and it resumes once the fade is done",
    lensOf(row.tiles[0]).style.left !== "44px", lensOf(row.tiles[0]).style.left);
  check("the ghost comes back with it", row.classes.has("is-auto"));

  // Re-entering during the fade must cancel the pending resume, not queue a
  // second one that fires later and yanks the lens out from under the reader.
  row.tiles[0].fire("pointermove", { pointerType: "mouse", clientX: 60, clientY: 60 });
  row.fire("pointerleave", {});
  row.tiles[0].fire("pointermove", { pointerType: "mouse", clientX: 60, clientY: 60 });
  check("re-entering cancels the pending resume", h.pendingTimers() === 0);
}

console.log("\n9. reduced motion silences the tour, not the magnifier");
{
  const row = makeRow([200, 200]);
  row.dataset.zoomAuto = "true";
  const h = run([row], { hover: true, raf: true, reduceMotion: true });
  h.tick(0);
  h.tick(1500);
  check("nothing moves on its own", lensOf(row.tiles[0]).style.left === undefined,
    lensOf(row.tiles[0]).style.left);
  check("not flagged as self-driven", !row.classes.has("is-auto"));

  row.tiles[0].fire("pointermove", { pointerType: "mouse", clientX: 100, clientY: 100 });
  check("but hovering still magnifies", row.classes.has("is-zooming") &&
    lensOf(row.tiles[0]).style.left === "44px", lensOf(row.tiles[0]).style.left);
}

console.log("\n10. the tour is opt-in, so a row of results stays still");
{
  const row = makeRow([200, 200, 200, 200]);
  const h = run([row], { hover: true, raf: true });   // no data-zoom-auto at all
  h.tick(0);
  h.tick(1500);
  check("no self-demonstration without data-zoom-auto", !row.classes.has("is-auto"));
  check("and no ghost cursor either",
    row.tiles[0].children.find((c) => c.className === "zoom-ghost") === undefined);
  row.tiles[0].fire("pointermove", { pointerType: "mouse", clientX: 100, clientY: 100 });
  check("the magnifier still works", lensOf(row.tiles[0]).style.left === "44px",
    lensOf(row.tiles[0]).style.left);
}

console.log("\n" + (failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"));
process.exit(failures === 0 ? 0 : 1);
